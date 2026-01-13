"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { addCategory, addTransaction } from "./actions";
import {
  addCategoryInitialState,
  addTransactionInitialState,
} from "./budgetState";
import { normalizeDateToMiddayUTC } from "@/lib/dates";
import { isoToYMD } from "@/lib/budget/date";

type BudgetCategory = {
  id: string;
  name: string;
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending || disabled}
    >
      {pending ? "Adding..." : "Add Transaction"}
    </button>
  );
}

function AddCategoryButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-black hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
    >
      {pending ? "Adding..." : "Add category"}
    </button>
  );
}

export function AddTransactionForm({ categories }: { categories: BudgetCategory[] }) {
  const router = useRouter();
  const [transactionState, transactionAction] = useActionState(addTransaction, addTransactionInitialState);
  const [categoryState, categoryAction] = useActionState(addCategory, addCategoryInitialState);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  useEffect(() => {
    if (transactionState.success) {
      router.refresh();
    }
  }, [transactionState.success, router]);

  useEffect(() => {
    if (categoryState.success) {
      setNewCategoryName("");
      if (categoryState.newCategoryId) {
        setSelectedCategoryId(categoryState.newCategoryId);
      }
      router.refresh();
    }
  }, [categoryState.success, categoryState.newCategoryId, router]);

  useEffect(() => {
    if (categories.length === 0) {
      setSelectedCategoryId("");
    }
  }, [categories]);

  const today = new Date();
  const todayDateString = `${today.getFullYear().toString().padStart(4, "0")}-${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;
  const defaultDate = isoToYMD(normalizeDateToMiddayUTC(todayDateString));
  const hasCategories = categories.length > 0;

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <form action={transactionAction} className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-black">Add Transaction</h2>
            <p className="text-sm text-black">Add income or expense for this workspace.</p>
          </div>
          <SubmitButton disabled={!hasCategories} />
        </div>

        {transactionState.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-black">
            {transactionState.error}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm text-black">
              <span className="mb-1 block font-medium">Category</span>
              <select
                name="category_id"
                required
                disabled={!hasCategories}
                value={selectedCategoryId}
                onChange={(event) => setSelectedCategoryId(event.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
              >
                <option value="" disabled>
                  {hasCategories ? "Select category" : "No categories available"}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="text-sm text-black">
            <span className="mb-1 block font-medium">Type</span>
            <select
              name="type"
              required
              defaultValue="expense"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-black">
            <span className="mb-1 block font-medium">Amount</span>
            <input
              type="number"
              min="0"
              step="0.01"
              name="amount"
              required
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
            />
          </label>

          <label className="text-sm text-black">
            <span className="mb-1 block font-medium">Date</span>
            <input
              type="date"
              name="occurred_at"
              defaultValue={defaultDate}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
            />
          </label>
        </div>

        <label className="block text-sm text-black">
          <span className="mb-1 block font-medium">Description (optional)</span>
          <input
            type="text"
            name="description"
            placeholder="Notes about this transaction"
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
          />
        </label>

        {!hasCategories && (
          <p className="text-sm text-black">
            Add a budget category first to enable transactions.
          </p>
        )}
      </form>

      <form action={categoryAction} className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3">
        <div className="text-sm font-semibold text-black">New category</div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            name="name"
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            placeholder="New category name"
            className="w-full flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
          />
          <AddCategoryButton />
        </div>
        {categoryState.error && <span className="text-xs text-black">{categoryState.error}</span>}
      </form>
    </div>
  );
}
