"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type WishlistItem = {
  id: string;
  title: string;
  url: string | null;
  sort_order: number;
};

export type AddWishlistState = {
  error: string | null;
  success: boolean;
  item: WishlistItem | null;
};

export type DeleteWishlistState = {
  error: string | null;
  success: boolean;
  deletedId: string | null;
};

async function getCurrentUserId() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { userId: null, supabase };
  }

  return { userId: user.id, supabase };
}

export async function addWishlistItem(_prev: AddWishlistState, formData: FormData): Promise<AddWishlistState> {
  const { userId, supabase } = await getCurrentUserId();

  if (!userId) {
    return { error: "You must be signed in.", success: false, item: null };
  }

  const titleValue = formData.get("title");
  const urlValue = formData.get("url");

  const title = typeof titleValue === "string" ? titleValue.trim() : "";
  const url = typeof urlValue === "string" && urlValue.trim().length > 0 ? urlValue.trim() : null;

  if (!title) {
    return { error: "Title is required.", success: false, item: null };
  }

  const { data: orderRows, error: orderError } = await supabase
    .from("wishlist_items")
    .select("sort_order")
    .eq("owner_id", userId)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (orderError) {
    return { error: "Could not determine item order.", success: false, item: null };
  }

  const nextOrder = orderRows && orderRows.length > 0 ? (orderRows[0].sort_order ?? 0) + 1 : 1;

  const { data, error: insertError } = await supabase
    .from("wishlist_items")
    .insert({
      owner_id: userId,
      title,
      url,
      sort_order: nextOrder,
    })
    .select("id, title, url, sort_order")
    .single();

  if (insertError || !data) {
    return { error: "Failed to add item.", success: false, item: null };
  }

  revalidatePath("/wishlist");
  revalidatePath(`/wishlist/${userId}`);

  return {
    error: null,
    success: true,
    item: {
      id: data.id,
      title: data.title,
      url: data.url,
      sort_order: data.sort_order,
    },
  };
}

export async function deleteWishlistItem(itemId: string): Promise<DeleteWishlistState> {
  const { userId, supabase } = await getCurrentUserId();

  if (!userId) {
    return { error: "You must be signed in.", success: false, deletedId: null };
  }

  if (!itemId) {
    return { error: "Item id is required.", success: false, deletedId: null };
  }

  const { error: deleteError } = await supabase.from("wishlist_items").delete().eq("id", itemId).eq("owner_id", userId);

  if (deleteError) {
    return { error: "Failed to delete item.", success: false, deletedId: null };
  }

  revalidatePath("/wishlist");
  revalidatePath(`/wishlist/${userId}`);

  return { error: null, success: true, deletedId: itemId };
}

export async function reorderWishlistItems(orderedIds: string[]): Promise<{ success: boolean; error: string | null }> {
  const { userId, supabase } = await getCurrentUserId();

  if (!userId) {
    return { error: "You must be signed in.", success: false };
  }

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { error: "No items to reorder.", success: false };
  }

  const { data: ownedItems, error: ownershipError } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("owner_id", userId)
    .in("id", orderedIds);

  if (ownershipError) {
    return { error: "Unable to verify items.", success: false };
  }

  const ownedIds = new Set((ownedItems ?? []).map((row) => row.id));
  const containsForeignItems = orderedIds.some((id) => !ownedIds.has(id));
  if (containsForeignItems) {
    return { error: "You can only reorder your own items.", success: false };
  }

  const { error: rpcError } = await supabase.rpc("reorder_wishlist_items", {
    p_ordered_ids: orderedIds,
  });

  if (rpcError) {
    console.error("reorder_wishlist_items RPC error:", rpcError.message);
    return { error: rpcError.message || "Failed to reorder items.", success: false };
  }

  revalidatePath("/wishlist");
  revalidatePath(`/wishlist/${userId}`);

  return { error: null, success: true };
}
