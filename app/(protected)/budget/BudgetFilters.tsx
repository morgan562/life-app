"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type BudgetCategory = {
  id: string;
  name: string;
};

type Props = {
  selectedMonthParam: string;
  typeFilter: "all" | "income" | "expense";
  categoryFilter: string | null;
  categories: BudgetCategory[];
};

function monthLabel(monthParam: string) {
  const date = new Date(`${monthParam}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return monthParam;
  return date.toLocaleString(undefined, { month: "short", year: "numeric" });
}

function buildMonthParam(monthParam: string, delta: number) {
  const date = new Date(`${monthParam}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return monthParam;
  }
  date.setMonth(date.getMonth() + delta);
  const year = date.getFullYear().toString().padStart(4, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
}

export function BudgetFilters({ selectedMonthParam, typeFilter, categoryFilter, categories }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentParams = useMemo(() => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    return params;
  }, [searchParams]);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(currentParams.toString());
    if (value && value.length > 0 && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/budget?${params.toString()}`);
    router.refresh();
  };

  const setMonth = (month: string) => {
    const params = new URLSearchParams(currentParams.toString());
    params.set("month", month);
    router.replace(`/budget?${params.toString()}`);
    router.refresh();
  };

  return (
    <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            onClick={() => setMonth(buildMonthParam(selectedMonthParam, -1))}
          >
            Prev
          </button>
          <div className="text-sm font-semibold text-neutral-900">{monthLabel(selectedMonthParam)}</div>
          <button
            type="button"
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            onClick={() => setMonth(buildMonthParam(selectedMonthParam, 1))}
          >
            Next
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-neutral-800">
            <span className="mb-1 block text-xs uppercase tracking-wide text-neutral-500">Type</span>
            <select
              value={typeFilter}
              onChange={(event) => updateParam("type", event.target.value)}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
            >
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>

          <label className="text-sm text-neutral-800">
            <span className="mb-1 block text-xs uppercase tracking-wide text-neutral-500">Category</span>
            <select
              value={categoryFilter ?? "all"}
              onChange={(event) => updateParam("category", event.target.value === "all" ? null : event.target.value)}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
            >
              <option value="all">All</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </section>
  );
}
