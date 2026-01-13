"use server";

import type {
  AddTransactionState,
  ArchiveCategoryState,
  ArchiveTransactionState,
  AddCategoryState,
  RenameCategoryState,
  UpdateTransactionState,
} from "./budgetState";
import { revalidatePath } from "next/cache";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeDateToMiddayUTC } from "@/lib/dates";

type WorkspaceMembership = {
  workspace_id: string;
};

export async function addTransaction(
  _prevState: AddTransactionState,
  formData: FormData
): Promise<AddTransactionState> {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "You must be signed in.", success: false };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single<WorkspaceMembership>();

  if (membershipError || !membership) {
    return { error: "Workspace not found.", success: false };
  }

  const type = formData.get("type");
  if (type !== "income" && type !== "expense") {
    return { error: "Choose income or expense.", success: false };
  }

  const categoryId = formData.get("category_id");
  if (typeof categoryId !== "string" || !categoryId) {
    return { error: "Category is required.", success: false };
  }

  const amountValue = Number(formData.get("amount"));
  const amount = Math.abs(amountValue);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a positive amount.", success: false };
  }

  const occurredAtValue = formData.get("occurred_at");
  const occurredAtString = typeof occurredAtValue === "string" ? occurredAtValue.trim() : "";
  if (!occurredAtString) {
    return { error: "Date is required.", success: false };
  }

  let occurredAt: string;
  try {
    occurredAt = normalizeDateToMiddayUTC(occurredAtString);
  } catch {
    return { error: "Date is required.", success: false };
  }

  const description = formData.get("description");
  const descriptionValue =
    typeof description === "string" && description.trim().length > 0 ? description.trim() : null;

  const { error: insertError } = await supabase.from("budget_transactions").insert({
    workspace_id: membership.workspace_id,
    category_id: categoryId,
    type,
    description: descriptionValue,
    amount,
    occurred_at: occurredAt,
  });

  if (insertError) {
    return { error: "Failed to add transaction. Please try again.", success: false };
  }

  revalidatePath("/budget");
  return { error: null, success: true };
}

export async function archiveTransaction(
  _prevState: ArchiveTransactionState,
  formData: FormData
): Promise<ArchiveTransactionState> {
  const supabase = await getSupabaseServerClient();

  const transactionId = formData.get("transaction_id");
  if (typeof transactionId !== "string" || !transactionId) {
    return { error: "Transaction id is required.", success: false };
  }

  const {
    data,
    error: updateError,
  } = await supabase
    .from("budget_transactions")
    .update({ is_archived: true, updated_at: new Date().toISOString() })
    .eq("id", transactionId)
    .select("id")
    .single();

  if (updateError) {
    return { error: "Failed to archive transaction.", success: false };
  }

  if (!data) {
    return { error: "Transaction not found.", success: false };
  }

  revalidatePath("/budget");
  return { error: null, success: true };
}

export async function renameCategory(
  _prevState: RenameCategoryState,
  formData: FormData
): Promise<RenameCategoryState> {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "You must be signed in.", success: false };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single<WorkspaceMembership>();

  if (membershipError || !membership) {
    return { error: "Workspace not found.", success: false };
  }

  const categoryId = formData.get("category_id");
  const name = formData.get("name");
  const trimmedName = typeof name === "string" ? name.trim() : "";

  if (typeof categoryId !== "string" || !categoryId) {
    return { error: "Category id is required.", success: false };
  }

  if (!trimmedName) {
    return { error: "Name is required.", success: false };
  }

  const {
    data,
    error: updateError,
  } = await supabase
    .from("budget_categories")
    .update({ name: trimmedName, updated_at: new Date().toISOString() })
    .eq("id", categoryId)
    .eq("workspace_id", membership.workspace_id)
    .eq("is_archived", false)
    .select("id")
    .single();

  if (updateError) {
    return { error: "Failed to rename category.", success: false };
  }

  if (!data) {
    return { error: "Category not found.", success: false };
  }

  revalidatePath("/budget");
  return { error: null, success: true };
}

export async function archiveCategory(
  _prevState: ArchiveCategoryState,
  formData: FormData
): Promise<ArchiveCategoryState> {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "You must be signed in.", success: false };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single<WorkspaceMembership>();

  if (membershipError || !membership) {
    return { error: "Workspace not found.", success: false };
  }

  const categoryId = formData.get("category_id");
  if (typeof categoryId !== "string" || !categoryId) {
    return { error: "Category id is required.", success: false };
  }

  const {
    data,
    error: updateError,
  } = await supabase
    .from("budget_categories")
    .update({ is_archived: true, updated_at: new Date().toISOString() })
    .eq("id", categoryId)
    .eq("workspace_id", membership.workspace_id)
    .eq("is_archived", false)
    .select("id")
    .single();

  if (updateError) {
    return { error: "Failed to archive category.", success: false };
  }

  if (!data) {
    return { error: "Category not found.", success: false };
  }

  revalidatePath("/budget");
  return { error: null, success: true };
}

export async function updateBudgetTransaction(
  _prevState: UpdateTransactionState,
  formData: FormData
): Promise<UpdateTransactionState> {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "You must be signed in.", success: false };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single<WorkspaceMembership>();

  if (membershipError || !membership) {
    return { error: "Workspace not found.", success: false };
  }

  const transactionId = formData.get("transaction_id");
  if (typeof transactionId !== "string" || !transactionId) {
    return { error: "Transaction id is required.", success: false };
  }

  const type = formData.get("type");
  if (type !== "income" && type !== "expense") {
    return { error: "Choose income or expense.", success: false };
  }

  const categoryId = formData.get("category_id");
  if (typeof categoryId !== "string" || !categoryId) {
    return { error: "Category is required.", success: false };
  }

  const amountValue = Number(formData.get("amount"));
  const amount = Math.abs(amountValue);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a positive amount.", success: false };
  }

  const occurredAtValue = formData.get("occurred_at");
  const occurredAtString = typeof occurredAtValue === "string" ? occurredAtValue.trim() : "";
  if (!occurredAtString) {
    return { error: "Date is required.", success: false };
  }

  let occurredAt: string;
  try {
    occurredAt = normalizeDateToMiddayUTC(occurredAtString);
  } catch {
    return { error: "Date is required.", success: false };
  }

  const description = formData.get("description");
  const descriptionValue =
    typeof description === "string" && description.trim().length > 0 ? description.trim() : null;

  const {
    data,
    error: updateError,
  } = await supabase
    .from("budget_transactions")
    .update({
      category_id: categoryId,
      type,
      amount,
      occurred_at: occurredAt,
      description: descriptionValue,
      updated_at: new Date().toISOString(),
    })
    .eq("id", transactionId)
    .eq("workspace_id", membership.workspace_id)
    .eq("is_archived", false)
    .select("id")
    .single();

  if (updateError) {
    return { error: "Failed to update transaction.", success: false };
  }

  if (!data) {
    return { error: "Transaction not found.", success: false };
  }

  revalidatePath("/budget");
  return { error: null, success: true };
}

export async function addCategory(
  _prevState: AddCategoryState,
  formData: FormData
): Promise<AddCategoryState> {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "You must be signed in.", success: false, newCategoryId: null };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single<WorkspaceMembership>();

  if (membershipError || !membership) {
    return { error: "Workspace not found.", success: false, newCategoryId: null };
  }

  const name = formData.get("name");
  const trimmedName = typeof name === "string" ? name.trim() : "";

  if (trimmedName.length < 1 || trimmedName.length > 60) {
    return { error: "Name must be between 1 and 60 characters.", success: false, newCategoryId: null };
  }

  const {
    data,
    error: insertError,
  } = await supabase
    .from("budget_categories")
    .insert({
      workspace_id: membership.workspace_id,
      name: trimmedName,
    })
    .select("id")
    .single();

  if (insertError || !data) {
    return { error: "Failed to add category.", success: false, newCategoryId: null };
  }

  revalidatePath("/budget");
  return { error: null, success: true, newCategoryId: data.id };
}
