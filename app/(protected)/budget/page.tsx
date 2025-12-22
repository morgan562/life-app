import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type SessionUser = {
  id: string;
};

type WorkspaceMembership = {
  workspace_id: string;
};

type BudgetCategory = {
  id: string;
  name: string;
};

type BudgetTransaction = {
  id: string;
  type: "income" | "expense";
  description: string | null;
  amount: number;
  occurred_at: string;
  created_by: string | null;
  category_id: string | null;
};

type Totals = {
  income: number;
  expense: number;
  net: number;
};

async function requireWorkspaceMembership() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single<WorkspaceMembership>();

  if (membershipError || !membership) {
    redirect("/onboarding");
  }

  return { supabase, user: user as SessionUser, workspaceId: membership.workspace_id };
}

async function fetchCategories(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  workspaceId: string
) {
  return supabase
    .from("budget_categories")
    .select("id, name")
    .eq("workspace_id", workspaceId)
    .eq("is_archived", false)
    .order("name", { ascending: true });
}

async function fetchTransactions(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  workspaceId: string
) {
  return supabase
    .from("budget_transactions")
    .select("id, type, description, amount, occurred_at, created_by, category_id")
    .eq("workspace_id", workspaceId)
    .eq("is_archived", false)
    .order("occurred_at", { ascending: false })
    .limit(20);
}

async function fetchMonthToDateTotals(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  workspaceId: string
) {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);
  const endOfMonth = new Date(
    Date.UTC(startOfMonth.getUTCFullYear(), startOfMonth.getUTCMonth() + 1, 1, 0, 0, 0, 0)
  );
  // TODO: adjust to user local timezone once available; using UTC month boundaries for now.

  const { data, error } = await supabase
    .from("budget_transactions")
    .select("type, amount")
    .eq("workspace_id", workspaceId)
    .eq("is_archived", false)
    .gte("occurred_at", startOfMonth.toISOString())
    .lt("occurred_at", endOfMonth.toISOString());

  if (error || !data) {
    return { totals: { income: 0, expense: 0, net: 0 }, error };
  }

  const totals: Totals = data.reduce(
    (acc, txn) => {
      if (txn.type === "income") {
        acc.income += Number(txn.amount);
      } else if (txn.type === "expense") {
        acc.expense += Number(txn.amount);
      }
      return acc;
    },
    { income: 0, expense: 0, net: 0 }
  );
  totals.net = totals.income - totals.expense;

  return { totals, error: null };
}

export default async function BudgetPage() {
  const { supabase, workspaceId } = await requireWorkspaceMembership();

  const [
    { data: categories, error: categoriesError },
    { data: transactions, error: transactionsError },
  ] = await Promise.all([fetchCategories(supabase, workspaceId), fetchTransactions(supabase, workspaceId)]);

  const { totals, error: totalsError } = await fetchMonthToDateTotals(supabase, workspaceId);

  const categoryNameById =
    categories?.reduce<Record<string, string>>((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {}) ?? {};

  const hasError = categoriesError || transactionsError || totalsError;
  const errorMessage = categoriesError?.message ?? transactionsError?.message ?? totalsError?.message ?? null;

  return (
    <main className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Budget</h1>
          <p className="mt-2 text-neutral-600">Workspace budget overview (read-only).</p>
        </div>
      </div>

      {hasError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Error loading budget data: {errorMessage}
        </div>
      )}

      <section className="mt-6 grid gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">Income (MTD)</div>
          <div className="text-lg font-semibold text-green-700">${totals.income.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">Expense (MTD)</div>
          <div className="text-lg font-semibold text-red-700">${totals.expense.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">Net (MTD)</div>
          <div className="text-lg font-semibold text-neutral-900">${totals.net.toFixed(2)}</div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Recent Transactions</h2>
          <div className="text-xs text-neutral-500">Showing latest 20</div>
        </div>
        {transactions && transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-neutral-500">
                <tr>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Description</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Created By</th>
                </tr>
              </thead>
              <tbody className="text-neutral-900">
                {transactions.map((txn: BudgetTransaction) => (
                  <tr key={txn.id} className="border-t border-neutral-200">
                    <td className="py-2 pr-4 align-top">
                      {new Date(txn.occurred_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-4 align-top">
                      {txn.category_id ? categoryNameById[txn.category_id] ?? "(unknown)" : "(uncategorized)"}
                    </td>
                    <td className="py-2 pr-4 align-top">{txn.description ?? "(no description)"}</td>
                    <td className="py-2 pr-4 align-top capitalize">{txn.type}</td>
                    <td className="py-2 pr-4 align-top">${Number(txn.amount).toFixed(2)}</td>
                    <td className="py-2 pr-4 align-top text-neutral-600">{txn.created_by ?? "(unknown)"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-neutral-600">No transactions yet.</p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">Categories</h2>
        {categories && categories.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm text-neutral-900">
            {categories.map((category: BudgetCategory) => (
              <li key={category.id} className="rounded-lg border border-neutral-200 px-3 py-2">
                {category.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-neutral-600">No categories yet.</p>
        )}
      </section>
    </main>
  );
}
