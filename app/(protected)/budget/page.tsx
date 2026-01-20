import { redirect } from "next/navigation";

import { CategoryList } from "./CategoryList";
import { AddTransactionForm } from "./AddTransactionForm";
import { TransactionTable } from "./TransactionTable";
import { BudgetFilters } from "./BudgetFilters";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

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
  category?: { id: string; name: string; is_archived: boolean } | null;
};

type BudgetTransactionWithArrayCategory = Omit<BudgetTransaction, "category"> & {
  category: { id: string; name: string; is_archived: boolean }[] | null;
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

type BudgetFilters = {
  monthStart: Date;
  monthEnd: Date;
  typeFilter: "all" | "income" | "expense";
  categoryFilter: string | null;
  selectedMonthParam: string;
};

function normalizeMonthDate(monthParam: string | null): Date | null {
  if (!monthParam) return null;
  const match = monthParam.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (Number.isNaN(year) || Number.isNaN(monthIndex)) return null;
  const date = new Date(year, monthIndex, 1);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function parseFilters(searchParams: Record<string, string | string[] | undefined>): BudgetFilters {
  const now = new Date();
  const monthParam = typeof searchParams.month === "string" ? searchParams.month : null;
  const typeParam = typeof searchParams.type === "string" ? searchParams.type : null;
  const categoryParam = typeof searchParams.category === "string" ? searchParams.category : null;

  const normalizedDate = normalizeMonthDate(monthParam) ?? new Date(now.getFullYear(), now.getMonth(), 1);
  normalizedDate.setHours(0, 0, 0, 0);
  const monthStart = new Date(normalizedDate.getFullYear(), normalizedDate.getMonth(), 1);
  const monthEnd = new Date(normalizedDate.getFullYear(), normalizedDate.getMonth() + 1, 1);

  const typeFilter = typeParam === "income" || typeParam === "expense" ? typeParam : "all";
  const categoryFilter = categoryParam && categoryParam.length > 0 ? categoryParam : null;
  const selectedMonthParam = `${monthStart.getFullYear().toString().padStart(4, "0")}-${(monthStart.getMonth() + 1)
    .toString()
    .padStart(2, "0")}`;

  return { monthStart, monthEnd, typeFilter, categoryFilter, selectedMonthParam };
}

async function fetchTransactions(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  workspaceId: string,
  filters: BudgetFilters
) {
  let query = supabase
    .from("budget_transactions")
    .select("id, type, description, amount, occurred_at, created_by, category_id, category:budget_categories(id, name, is_archived)")
    .eq("workspace_id", workspaceId)
    .eq("is_archived", false)
    .gte("occurred_at", filters.monthStart.toISOString())
    .lt("occurred_at", filters.monthEnd.toISOString())
    .order("occurred_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  if (filters.typeFilter !== "all") {
    query = query.eq("type", filters.typeFilter);
  }
  if (filters.categoryFilter) {
    query = query.eq("category_id", filters.categoryFilter);
  }

  return query;
}

async function fetchTotals(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  workspaceId: string,
  filters: BudgetFilters
) {
  let query = supabase
    .from("budget_transactions")
    .select("type, amount")
    .eq("workspace_id", workspaceId)
    .eq("is_archived", false)
    .gte("occurred_at", filters.monthStart.toISOString())
    .lt("occurred_at", filters.monthEnd.toISOString());

  if (filters.typeFilter !== "all") {
    query = query.eq("type", filters.typeFilter);
  }
  if (filters.categoryFilter) {
    query = query.eq("category_id", filters.categoryFilter);
  }

  const { data, error } = await query;
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

async function getBudgetPageData(
  workspaceId: string,
  filters: BudgetFilters
): Promise<{
  categories: BudgetCategory[] | null;
  transactions: BudgetTransaction[] | null;
  totals: Totals;
  errors: (Error | null | undefined)[];
}> {
  const supabase = await getSupabaseServerClient();

  const [
    { data: categories, error: categoriesError },
    { data: rawTransactions, error: transactionsError },
  ] = await Promise.all([fetchCategories(supabase, workspaceId), fetchTransactions(supabase, workspaceId, filters)]);

  const typedTransactions = (rawTransactions as BudgetTransactionWithArrayCategory[] | null) ?? null;
  const transactions: BudgetTransaction[] | null =
    typedTransactions?.map((txn) => ({
      ...txn,
      category: txn.category?.[0] ?? null,
    })) ?? null;

  const { totals, error: totalsError } = await fetchTotals(supabase, workspaceId, filters);

  return { categories, transactions, totals, errors: [categoriesError, transactionsError, totalsError] };
}

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { workspaceId } = await requireWorkspaceMembership();
  const filters = parseFilters(sp ?? {});
  const { categories, transactions, totals, errors } = await getBudgetPageData(workspaceId, filters);

  const categoryById =
    categories?.reduce<Record<string, { name: string; is_archived: boolean }>>((acc, category) => {
      acc[category.id] = { name: category.name, is_archived: false };
      return acc;
    }, {}) ?? {};

  transactions?.forEach((txn) => {
    if (txn.category) {
      categoryById[txn.category.id] = { name: txn.category.name, is_archived: Boolean(txn.category.is_archived) };
    }
  });

  const errorMessage = errors.find((err) => err)?.message ?? null;
  const hasError = Boolean(errorMessage);
  const currentMonthParam = new Date().toISOString().slice(0, 7);

  const hasFiltersActive =
    filters.typeFilter !== "all" || !!filters.categoryFilter || filters.selectedMonthParam !== currentMonthParam;

  return (
    <main className="min-h-screen bg-white p-6 text-neutral-900">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Budget</h1>
          <p className="mt-2 text-sm text-neutral-600">Track income and expenses for your workspace.</p>
        </div>
        <Link
          href="/app"
          className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:border-neutral-400 hover:text-neutral-900"
        >
          Menu
        </Link>
      </div>

      <BudgetFilters
        selectedMonthParam={filters.selectedMonthParam}
        typeFilter={filters.typeFilter}
        categoryFilter={filters.categoryFilter}
        categories={categories ?? []}
      />

      {hasError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-black">
          Error loading budget data: {errorMessage}
        </div>
      )}

      <section className="mt-6 grid gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">Income (MTD)</div>
          <div className="text-lg font-semibold text-neutral-900">${totals.income.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">Expense (MTD)</div>
          <div className="text-lg font-semibold text-neutral-900">${totals.expense.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">Net (MTD)</div>
          <div className="text-lg font-semibold text-neutral-900">${totals.net.toFixed(2)}</div>
        </div>
      </section>

      <section className="mt-6">
        <AddTransactionForm categories={categories ?? []} />
      </section>

      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Recent Transactions</h2>
          <div className="text-xs text-neutral-600">
            Showing latest 20{hasFiltersActive ? " (filtered)" : ""}
          </div>
        </div>
        {transactions && transactions.length > 0 ? (
          <TransactionTable
            transactions={transactions as BudgetTransaction[]}
            categories={categories ?? []}
            categoryById={categoryById}
          />
        ) : (
          <p className="text-sm text-neutral-600">No transactions yet.</p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">Categories</h2>
        {categories && categories.length > 0 ? (
          <CategoryList categories={categories} />
        ) : (
          <p className="mt-2 text-sm text-neutral-600">No categories yet.</p>
        )}
      </section>
    </main>
  );
}
