"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { archiveCategory, renameCategory } from "./actions";
import { archiveCategoryInitialState, renameCategoryInitialState } from "./budgetState";

type BudgetCategory = {
  id: string;
  name: string;
};

function ArchiveSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="text-sm font-semibold text-black hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Archiving..." : "Archive"}
    </button>
  );
}

function RenameSubmitButton() {
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

function ArchiveButton({ categoryId }: { categoryId: string }) {
  const [state, formAction] = useActionState(archiveCategory, archiveCategoryInitialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="category_id" value={categoryId} />
      <ArchiveSubmitButton />
      {state.error && <span className="text-xs text-black">{state.error}</span>}
    </form>
  );
}

function RenameForm({ category }: { category: BudgetCategory }) {
  const [name, setName] = useState(category.name);
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction] = useActionState(renameCategory, renameCategoryInitialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      setIsEditing(false);
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="flex flex-1 items-center gap-2">
      <input type="hidden" name="category_id" value={category.id} />
      {isEditing ? (
        <input
          type="text"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
          required
        />
      ) : (
        <span className="flex-1 text-sm text-black">{category.name}</span>
      )}
      {isEditing ? (
        <RenameSubmitButton />
      ) : (
        <button
          type="button"
          className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-black hover:bg-neutral-50"
          onClick={() => setIsEditing(true)}
        >
          Edit
        </button>
      )}
      {state.error && <span className="text-xs text-black">{state.error}</span>}
    </form>
  );
}

export function CategoryList({ categories }: { categories: BudgetCategory[] }) {
  return (
    <ul className="mt-3 space-y-3 text-sm text-black">
      {categories.map((category) => (
        <li
          key={category.id}
          className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <RenameForm category={category} />
          <ArchiveButton categoryId={category.id} />
        </li>
      ))}
    </ul>
  );
}
