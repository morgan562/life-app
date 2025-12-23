"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { archiveTransaction } from "./actions";
import { archiveTransactionInitialState } from "./budgetState";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="text-sm font-semibold text-red-700 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Archiving..." : "Archive"}
    </button>
  );
}

export function ArchiveTransactionButton({ transactionId }: { transactionId: string }) {
  const [state, formAction] = useActionState(archiveTransaction, archiveTransactionInitialState);

  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="transaction_id" value={transactionId} />
      <SubmitButton />
      {state.error && <p className="text-xs text-red-700">{state.error}</p>}
    </form>
  );
}
