"use server";

import { revalidatePath } from "next/cache";

import { getWorkspaceIdForUser } from "@/lib/budget/bills";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function createBill(formData: FormData) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const workspaceId = await getWorkspaceIdForUser(supabase, user.id);
  if (!workspaceId) {
    return;
  }

  const name = formData.get("name");
  const amountRaw = Number(formData.get("amount"));
  const dueDayRaw = Number(formData.get("due_day"));

  const trimmedName = typeof name === "string" ? name.trim() : "";
  if (!trimmedName) {
    return;
  }

  const amount = Number.isFinite(amountRaw) ? Math.abs(amountRaw) : NaN;
  if (!Number.isFinite(amount) || amount <= 0) {
    return;
  }

  const dueDay = Number.isInteger(dueDayRaw) ? dueDayRaw : Math.round(dueDayRaw);
  if (!Number.isFinite(dueDay) || dueDay < 1 || dueDay > 31) {
    return;
  }

  const { error } = await supabase.from("budget_bills").insert({
    workspace_id: workspaceId,
    name: trimmedName,
    amount,
    due_day: dueDay,
  });

  if (error) {
    return;
  }

  revalidatePath("/budget/calendar");
}

export async function markBillPaid(formData: FormData) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const workspaceId = await getWorkspaceIdForUser(supabase, user.id);
  if (!workspaceId) {
    return;
  }

  const billId = formData.get("bill_id");
  const paidOnRaw = formData.get("paid_on");

  if (typeof billId !== "string" || billId.length === 0) {
    return;
  }

  if (typeof paidOnRaw !== "string" || paidOnRaw.length === 0) {
    return;
  }

  const paidOnDate = new Date(`${paidOnRaw}T00:00:00Z`);
  if (Number.isNaN(paidOnDate.getTime())) {
    return;
  }

  const monthParam = formData.get("month");
  if (typeof monthParam === "string" && monthParam.length > 0) {
    const selectedMonthDate = new Date(`${monthParam}T00:00:00Z`);
    if (!Number.isNaN(selectedMonthDate.getTime())) {
      const nextMonthDate = new Date(selectedMonthDate);
      nextMonthDate.setUTCMonth(selectedMonthDate.getUTCMonth() + 1, 1);
      if (paidOnDate < selectedMonthDate || paidOnDate >= nextMonthDate) {
        return;
      }
    }
  }

  const { error } = await supabase.from("budget_bill_payments").insert({
    workspace_id: workspaceId,
    bill_id: billId,
    paid_on: paidOnDate.toISOString(),
  });

  if (error) {
    return;
  }

  revalidatePath("/budget/calendar");
}
