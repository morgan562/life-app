import { getSupabaseServerClient } from "@/lib/supabase/server";

type WorkspaceMembership = {
  workspace_id: string;
};

type ProfileRow = {
  id: string;
};

export type BudgetBill = {
  id: string;
  name: string;
  amount: number;
  due_day: number;
  is_archived: boolean;
};

export type BudgetBillPayment = {
  id: string;
  bill_id: string;
  paid_on: string;
};

type SupabaseServerClient = Awaited<ReturnType<typeof getSupabaseServerClient>>;

export async function getWorkspaceIdForUser(
  supabase: SupabaseServerClient,
  userId: string
): Promise<string | null> {
  const { data: membershipByUser } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .limit(1)
    .single<WorkspaceMembership>();

  if (membershipByUser?.workspace_id) {
    return membershipByUser.workspace_id;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .single<ProfileRow>();

  if (!profile?.id) {
    return null;
  }

  const { data: membershipByProfile } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("profile_id", profile.id)
    .limit(1)
    .single<WorkspaceMembership>();

  return membershipByProfile?.workspace_id ?? null;
}

export async function getBills(workspaceId: string) {
  const supabase = await getSupabaseServerClient();
  return await supabase
    .from("budget_bills")
    .select("id, name, amount, due_day, is_archived")
    .eq("workspace_id", workspaceId)
    .eq("is_archived", false)
    .order("due_day", { ascending: true });
}

export async function getBillPaymentsForMonth(workspaceId: string, monthISO: string) {
  const supabase = await getSupabaseServerClient();

  let parsedMonth = new Date(monthISO);
  if (Number.isNaN(parsedMonth.getTime())) {
    parsedMonth = new Date();
  }
  const startOfMonth = new Date(
    Date.UTC(parsedMonth.getUTCFullYear(), parsedMonth.getUTCMonth(), 1)
  );
  const nextMonth = new Date(startOfMonth);
  nextMonth.setUTCMonth(startOfMonth.getUTCMonth() + 1, 1);

  return await supabase
    .from("budget_bill_payments")
    .select("id, bill_id, paid_on")
    .eq("workspace_id", workspaceId)
    .gte("paid_on", startOfMonth.toISOString())
    .lt("paid_on", nextMonth.toISOString())
    .order("paid_on", { ascending: true });
}
