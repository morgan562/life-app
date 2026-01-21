"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { ArchiveTransactionButton } from "./ArchiveTransactionButton";
import { updateBudgetTransaction } from "./actions";
import { updateTransactionInitialState } from "./budgetState";
import { isoToYMD } from "@/lib/budget/date";

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

type Props = {
  transactions: BudgetTransaction[];
  categories: BudgetCategory[];
  categoryById: Record<string, { name: string; is_archived: boolean }>;
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
    >
      {pending ? "Saving..." : "Save"}
    </button>
  );
}

function CancelButton({ onClick }: { onClick: () => void }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="button"
      className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-black hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-70"
      onClick={onClick}
      disabled={pending}
    >
      Cancel
    </button>
  );
}

export function TransactionTable({ transactions, categories, categoryById }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, formAction] = useActionState(updateBudgetTransaction, updateTransactionInitialState);

  const initialValuesById = useMemo(() => {
    const map: Record<
      string,
      { category_id: string; type: "income" | "expense"; amount: string; occurred_at: string; description: string }
    > = {};
    transactions.forEach((txn) => {
      map[txn.id] = {
        category_id: txn.category_id ?? "",
        type: txn.type,
        amount: String(txn.amount),
        occurred_at: isoToYMD(txn.occurred_at),
        description: txn.description ?? "",
      };
    });
    return map;
  }, [transactions]);

  const [drafts, setDrafts] = useState(initialValuesById);

  useEffect(() => {
    setDrafts(initialValuesById);
  }, [initialValuesById]);

  useEffect(() => {
    if (formState.success) {
      setEditingId(null);
      router.refresh();
    }
  }, [formState.success, router]);

  const startEdit = (id: string) => {
    setEditingId(id);
    if (!drafts[id]) {
      const txn = transactions.find((t) => t.id === id);
      if (txn) {
        setDrafts((prev) => ({
          ...prev,
          [id]: {
            category_id: txn.category_id ?? "",
            type: txn.type,
            amount: String(txn.amount),
            occurred_at: isoToYMD(txn.occurred_at),
            description: txn.description ?? "",
          },
        }));
      }
    }
  };

  const onChange = (id: string, field: string, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const renderCategory = (txn: BudgetTransaction) => {
    if (!txn.category_id) {
      return "(uncategorized)";
    }

    const category = txn.category ?? categoryById[txn.category_id];
    if (category) {
      const suffix = category.is_archived ? " (archived)" : "";
      return `${category.name}${suffix}`;
    }

    return "(deleted category)";
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm glass-surface">
        <thead className="text-left text-black">
          <tr>
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Category</th>
            <th className="py-2 pr-4">Description</th>
            <th className="py-2 pr-4">Type</th>
            <th className="py-2 pr-4">Amount</th>
            <th className="py-2 pr-4">Created By</th>
            <th className="py-2 pr-4">Actions</th>
          </tr>
        </thead>
        <tbody className="text-black">
          {transactions.map((txn) => {
            const isEditing = editingId === txn.id;
            const draft = drafts[txn.id] ?? {
              category_id: txn.category_id ?? "",
              type: txn.type,
              amount: String(txn.amount),
              occurred_at: isoToYMD(txn.occurred_at),
              description: txn.description ?? "",
            };

            if (isEditing) {
              return (
                <tr key={txn.id} className="border-t border-neutral-200 align-top">
                  <td className="py-2 pr-4">
                    <input
                      type="date"
                      name="occurred_at"
                      value={draft.occurred_at}
                      onChange={(event) => onChange(txn.id, "occurred_at", event.target.value)}
                      className="w-full rounded-lg border border-neutral-200 px-2 py-1 text-sm focus:border-neutral-400 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <select
                      name="category_id"
                      value={draft.category_id}
                      onChange={(event) => onChange(txn.id, "category_id", event.target.value)}
                      className="w-full rounded-lg border border-neutral-200 px-2 py-1 text-sm focus:border-neutral-400 focus:outline-none"
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-4">
                    <input
                      type="text"
                      name="description"
                      value={draft.description}
                      onChange={(event) => onChange(txn.id, "description", event.target.value)}
                      className="w-full rounded-lg border border-neutral-200 px-2 py-1 text-sm focus:border-neutral-400 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <select
                      name="type"
                      value={draft.type}
                      onChange={(event) => onChange(txn.id, "type", event.target.value)}
                      className="w-full rounded-lg border border-neutral-200 px-2 py-1 text-sm capitalize focus:border-neutral-400 focus:outline-none"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </td>
                  <td className="py-2 pr-4">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="amount"
                      value={draft.amount}
                      onChange={(event) => onChange(txn.id, "amount", event.target.value)}
                      className="w-full rounded-lg border border-neutral-200 px-2 py-1 text-sm focus:border-neutral-400 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 pr-4 text-black">{txn.created_by ?? "(unknown)"}</td>
                  <td className="py-2 pr-4">
                    <form action={formAction} className="flex flex-col gap-2">
                      <input type="hidden" name="transaction_id" value={txn.id} />
                      <input type="hidden" name="occurred_at" value={draft.occurred_at} />
                      <input type="hidden" name="category_id" value={draft.category_id} />
                      <input type="hidden" name="description" value={draft.description} />
                      <input type="hidden" name="type" value={draft.type} />
                      <input type="hidden" name="amount" value={draft.amount} />
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <SaveButton />
                        <CancelButton onClick={() => setEditingId(null)} />
                      </div>
                      {formState.error && <span className="text-xs text-black">{formState.error}</span>}
                    </form>
                  </td>
                </tr>
              );
            }

            return (
              <tr key={txn.id} className="border-t border-neutral-200">
                <td className="py-2 pr-4 align-top">{isoToYMD(txn.occurred_at)}</td>
                <td className="py-2 pr-4 align-top">{renderCategory(txn)}</td>
                <td className="py-2 pr-4 align-top">{txn.description ?? "(no description)"}</td>
                <td className="py-2 pr-4 align-top capitalize">{txn.type}</td>
                <td className="py-2 pr-4 align-top">${Number(txn.amount).toFixed(2)}</td>
                <td className="py-2 pr-4 align-top text-black">{txn.created_by ?? "(unknown)"}</td>
                <td className="py-2 pr-4 align-top space-y-1">
                  <button
                    type="button"
                    className="text-sm font-semibold text-black hover:text-black"
                    onClick={() => startEdit(txn.id)}
                  >
                    Edit
                  </button>
                  <ArchiveTransactionButton transactionId={txn.id} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
