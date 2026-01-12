import { redirect } from "next/navigation";

import { createBill, markBillPaid } from "./actions";
import {
  BudgetBill,
  BudgetBillPayment,
  getBills,
  getBillPaymentsForMonth,
  getWorkspaceIdForUser,
} from "@/lib/budget/bills";
import { buildCalendarGrid, clampDueDayToMonth, getMonthStart } from "@/lib/budget/calendar";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parseMonthParam(rawMonth: string | string[] | undefined) {
  const now = new Date();
  const asString = typeof rawMonth === "string" ? rawMonth : null;
  const normalized =
    asString && asString.length === 7
      ? `${asString}-01`
      : asString ?? `${now.getUTCFullYear()}-${(now.getUTCMonth() + 1).toString().padStart(2, "0")}-01`;

  const monthStart = getMonthStart(normalized);
  const year = monthStart.getUTCFullYear();
  const monthIndex = monthStart.getUTCMonth();
  const monthIso = formatDateInput(monthStart);

  return {
    monthStart,
    monthIso,
    monthInputValue: `${year.toString().padStart(4, "0")}-${(monthIndex + 1).toString().padStart(2, "0")}`,
  };
}

function formatDateInput(date: Date) {
  const year = date.getUTCFullYear().toString().padStart(4, "0");
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function BudgetCalendarPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await getSupabaseServerClient();
  const sp = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const workspaceId = await getWorkspaceIdForUser(supabase, user.id);
  if (!workspaceId) {
    redirect("/onboarding");
  }

  const { monthStart, monthIso, monthInputValue } = parseMonthParam(sp?.month);

  const [{ data: bills, error: billsError }, { data: payments, error: paymentsError }] = await Promise.all([
    getBills(workspaceId),
    getBillPaymentsForMonth(workspaceId, monthIso),
  ]);

  const paymentsByBillId =
    payments?.reduce<Record<string, BudgetBillPayment>>((acc, payment) => {
      if (!acc[payment.bill_id]) {
        acc[payment.bill_id] = payment;
      }
      return acc;
    }, {}) ?? {};

  const billList: BudgetBill[] = bills ?? [];
  const billsByDate: Record<string, { bill: BudgetBill; payment?: BudgetBillPayment }[]> = {};

  billList.forEach((bill) => {
    const dueDay = clampDueDayToMonth(bill.due_day, monthStart);
    const date = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), dueDay));
    const iso = formatDateInput(date);
    const payment = paymentsByBillId[bill.id];
    if (!billsByDate[iso]) {
      billsByDate[iso] = [];
    }
    billsByDate[iso].push({ bill, payment });
  });

  const errorMessage = billsError?.message ?? paymentsError?.message ?? null;
  const calendarWeeks = buildCalendarGrid(monthIso);

  return (
    <main className="min-h-screen bg-[#f9f6f1] px-6 py-10 text-[#2f2b27]">
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-[#2f2b27]">Budget Calendar</h1>
            <p className="mt-2 text-sm text-[#4d463f]">
              Create bills for your workspace and track payments for the selected month.
            </p>
          </div>
          <form
            method="get"
            className="flex items-center gap-3 rounded-full border border-[rgba(107,119,94,0.25)] bg-[#f1ede6] px-4 py-2 text-sm text-[#3c372f]"
          >
            <label className="text-xs uppercase tracking-wide text-[#6f665d]" htmlFor="month">
              Month
            </label>
            <input
              type="month"
              id="month"
              name="month"
              defaultValue={monthInputValue}
              className="border-b border-[rgba(107,119,94,0.25)] bg-transparent px-2 pb-1 text-sm text-[#2f2b27] outline-none focus:border-[#6B775E]"
            />
            <button
              type="submit"
              className="rounded-full border border-[rgba(107,119,94,0.25)] bg-transparent px-3 py-1 text-xs font-medium text-[#3c372f] transition hover:border-[#6B775E] hover:text-[#2f2b27]"
            >
              Go
            </button>
          </form>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#3c2b2b]">
            {errorMessage}
          </div>
        )}

        <section className="rounded-2xl border border-[rgba(107,119,94,0.2)] bg-white/90 px-6 py-5 shadow-sm">
          <h2 className="font-serif text-xl font-medium text-[#2f2b27]">Create bill</h2>
          <form action={createBill} className="mt-4 grid gap-4 sm:grid-cols-4 sm:items-end">
            <div className="sm:col-span-2">
              <label className="text-xs uppercase tracking-wide text-[#6f665d]" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                name="name"
                required
                className="mt-2 w-full border-b border-[rgba(107,119,94,0.25)] bg-transparent pb-2 text-sm text-[#2f2b27] outline-none focus:border-[#6B775E]"
                placeholder="Rent"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-[#6f665d]" htmlFor="amount">
                Amount
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                required
                className="mt-2 w-full border-b border-[rgba(107,119,94,0.25)] bg-transparent pb-2 text-sm text-[#2f2b27] outline-none focus:border-[#6B775E]"
                placeholder="1200"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-[#6f665d]" htmlFor="due_day">
                Due day
              </label>
              <input
                id="due_day"
                name="due_day"
                type="number"
                min="1"
                max="31"
                required
                className="mt-2 w-full border-b border-[rgba(107,119,94,0.25)] bg-transparent pb-2 text-sm text-[#2f2b27] outline-none focus:border-[#6B775E]"
                placeholder="1"
              />
            </div>
            <div className="sm:col-span-4">
              <button
                type="submit"
                className="inline-flex rounded-full border border-[rgba(107,119,94,0.25)] bg-transparent px-4 py-2 text-sm font-medium text-[#3c372f] transition hover:border-[#6B775E] hover:text-[#2f2b27]"
              >
                Save bill
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-[rgba(107,119,94,0.2)] bg-[#f1ede6] px-6 py-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl font-medium text-[#2f2b27]">Bills for {monthInputValue}</h2>
            <div className="text-xs uppercase tracking-wide text-[#776f66]">Calendar view</div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <div className="min-w-[720px]">
              <div
                className="grid grid-cols-7 border bg-[rgba(107,142,35,0.08)] text-xs font-medium uppercase tracking-wide text-[#6B8E23]"
                style={{ borderColor: "rgba(107,142,35,0.55)" }}
              >
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="border-b px-3 py-2 text-center text-[#6B8E23]"
                    style={{ borderColor: "rgba(107,142,35,0.55)" }}
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div
                className="grid grid-cols-7 border-t border-l"
                style={{ borderColor: "rgba(107,142,35,0.55)" }}
              >
                {calendarWeeks.flatMap((week, weekIndex) =>
                  week.map((day) => {
                    const dayBills = billsByDate[day.iso] ?? [];
                    return (
                      <div
                        key={`${weekIndex}-${day.iso}`}
                        className={`min-h-[140px] border-r border-b bg-white/90 p-3 ${
                          day.inMonth ? "" : "bg-[#f4f0e9] text-[#6B8E23]/60"
                        }`}
                        style={{ borderColor: "rgba(107,142,35,0.55)" }}
                      >
                        <div className="text-xs font-medium text-black">
                          <span className={day.inMonth ? "" : "text-neutral-400"}>{day.day}</span>
                        </div>
                        {dayBills.length > 0 && (
                          <div className="mt-3 space-y-3">
                            {dayBills.map(({ bill, payment }) => {
                              const isPaid = Boolean(payment);
                              const paidOnDate = payment ? new Date(payment.paid_on) : null;
                              const statusLabel = isPaid ? "Paid" : "Due";
                              const statusClass = isPaid
                                ? "text-[#4CAF50] bg-[rgba(76,175,80,0.25)] px-2 py-0.5 rounded-full"
                                : "text-red-600";
                              return (
                                <div
                                  key={bill.id}
                                  className="rounded-lg border border-[rgba(107,119,94,0.2)] bg-[#f7f3ec] p-2"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="text-sm font-medium text-[#2f2b27]">{bill.name}</div>
                                      <div className="text-[12px] text-[#4d463f]">${Number(bill.amount).toFixed(2)}</div>
                                    </div>
                                    <div className={`text-[11px] uppercase tracking-wide ${statusClass}`}>
                                      {statusLabel}
                                    </div>
                                  </div>
                                  {isPaid && paidOnDate ? (
                                    <div className="mt-1 text-[11px] text-[#6B775E]">
                                      Paid on {formatDateInput(paidOnDate)}
                                    </div>
                                  ) : (
                                    <form action={markBillPaid} className="mt-2 inline-flex items-center gap-2">
                                      <input type="hidden" name="bill_id" value={bill.id} />
                                      <input type="hidden" name="month" value={monthIso} />
                                      <input type="hidden" name="paid_on" value={day.iso} />
                                      <button
                                        type="submit"
                                        className="text-xs font-medium text-[#6B775E]/70 underline underline-offset-4 transition hover:text-[#6B775E]"
                                      >
                                        Mark paid
                                      </button>
                                    </form>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
