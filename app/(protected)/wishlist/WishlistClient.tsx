"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  addWishlistItem,
  deleteWishlistItem,
  reorderWishlistItems,
  type AddWishlistState,
  type WishlistItem,
} from "./actions";

type WishlistItemWithOwner = WishlistItem & { owner_id: string };

type WishlistClientProps = {
  itemsByUser: Record<string, WishlistItemWithOwner[]>;
  currentUserId: string;
  partnerUserId: string | null;
  currentName: string;
  partnerName: string | null;
  initialViewingUserId: string;
  profiles: { user_id: string; display_name: string | null }[];
};

type SortableRowProps = {
  item: WishlistItem;
  isOwner: boolean;
  onDelete?: (id: string) => void;
  pending?: boolean;
};

function SortableRow({ item, isOwner, onDelete, pending }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: !isOwner,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="glass-row flex items-start justify-between gap-4 p-4">
      <div className="flex flex-1 items-start gap-3">
        {isOwner ? (
          <button
            type="button"
            className="mt-1 cursor-grab text-lg text-neutral-500 transition hover:text-neutral-700"
            {...attributes}
            {...listeners}
            aria-label="Reorder item"
          >
            ☰
          </button>
        ) : (
          <div className="mt-1 h-5 w-5" />
        )}
        <div>
          <div className="text-base font-semibold text-neutral-900">{item.title}</div>
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-neutral-600 underline underline-offset-4 transition hover:text-neutral-900"
            >
              {item.url}
            </a>
          ) : (
            <div className="text-sm text-neutral-500">No link provided</div>
          )}
        </div>
      </div>
      {isOwner && onDelete ? (
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          disabled={pending}
          className="glass-button text-xs disabled:cursor-not-allowed disabled:opacity-60"
        >
          Delete
        </button>
      ) : null}
    </div>
  );
}

export function WishlistClient({
  itemsByUser,
  currentUserId,
  partnerUserId,
  currentName,
  partnerName,
  initialViewingUserId,
  profiles,
}: WishlistClientProps) {
  const [itemsByUserState, setItemsByUserState] = useState<Record<string, WishlistItemWithOwner[]>>(itemsByUser);
  const [viewingUserId, setViewingUserId] = useState<string>(initialViewingUserId);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [addState, formAction] = useActionState<AddWishlistState, FormData>(addWishlistItem, {
    error: null,
    success: false,
    item: null,
  });
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDeleteTransition, startDeleteTransition] = useTransition();
  const [switchPending, startSwitchTransition] = useTransition();
  const formRef = useRef<HTMLFormElement | null>(null);

  const items = itemsByUserState[viewingUserId] ?? [];
  const isOwner = String(viewingUserId) === String(currentUserId);

  const currentProfile = profiles.find((p) => String(p.user_id) === String(currentUserId)) ?? null;
  const partnerProfile = profiles.find((p) => String(p.user_id) !== String(currentUserId)) ?? null;

  const resolvedCurrentName = currentProfile?.display_name?.trim() || currentName;
  const resolvedPartnerName =
    partnerProfile?.display_name?.trim() || partnerName || (resolvedCurrentName === "Tyler" ? "Tessa" : "Tyler");

  const viewingName = String(viewingUserId) === String(partnerUserId) ? resolvedPartnerName : resolvedCurrentName;
  const partnerLabel = String(viewingUserId) === String(partnerUserId) ? resolvedCurrentName : resolvedPartnerName;

  useEffect(() => {
    if (!addState.success || !addState.item) return;
    const newItem: WishlistItemWithOwner = { ...addState.item, owner_id: currentUserId };
    setItemsByUserState((prev) => {
      const currentList = prev[currentUserId] ?? [];
      const alreadyExists = currentList.some((it) => it.id === newItem.id);
      if (alreadyExists) return prev;
      const next = [...currentList, newItem].sort((a, b) => a.sort_order - b.sort_order);
      return { ...prev, [currentUserId]: next };
    });
    formRef.current?.reset();
  }, [addState.item, addState.success, currentUserId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDelete = (id: string) => {
    if (!isOwner) return;
    setDeleteError(null);
    setDeletePendingId(id);
    startDeleteTransition(async () => {
      const result = await deleteWishlistItem(id);
      if (!result.success) {
        setDeleteError(result.error ?? "Failed to delete item.");
        setDeletePendingId(null);
        return;
      }
      setItemsByUserState((prev) => {
        const nextList = (prev[currentUserId] ?? []).filter((item) => item.id !== id);
        return { ...prev, [currentUserId]: nextList };
      });
      setDeletePendingId(null);
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!isOwner) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const list = itemsByUserState[currentUserId] ?? [];
    const oldIndex = list.findIndex((item) => item.id === active.id);
    const newIndex = list.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const previousItems = list;
    const nextItems = arrayMove(list, oldIndex, newIndex).map((item, index) => ({
      ...item,
      sort_order: index + 1,
    }));

    setItemsByUserState((prev) => ({ ...prev, [currentUserId]: nextItems }));
    setReorderError(null);
    setIsReordering(true);

    const result = await reorderWishlistItems(nextItems.map((item) => item.id));

    if (!result.success) {
      setItemsByUserState((prev) => ({ ...prev, [currentUserId]: previousItems }));
      setReorderError(result.error ?? "Reorder failed. Please try again.");
      if (result.error) {
        console.error("Reorder failed:", result.error);
      }
    }

    setIsReordering(false);
  };

  const toggleViewing = () => {
    if (!partnerUserId) return;
    startSwitchTransition(() => {
      setViewingUserId((prev) => (prev === partnerUserId ? currentUserId : partnerUserId));
      setReorderError(null);
      setDeleteError(null);
    });
  };

  useEffect(() => {
    console.log(
      "profiles count",
      profiles.length,
      "currentUserId",
      currentUserId,
      "partner",
      partnerProfile?.user_id
    );
  }, [profiles, currentUserId, partnerProfile?.user_id]);

  let listContent: React.ReactNode = <p className="glass-muted">No items yet.</p>;

  if (items.length > 0 && !isOwner) {
    listContent = (
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="glass-row flex items-start justify-between gap-4 p-4"
          >
            <div className="flex flex-1 items-start gap-3">
              <div className="mt-1 h-5 w-5" />
              <div>
                <div className="text-base font-semibold text-neutral-900">{item.title}</div>
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-neutral-600 underline underline-offset-4 transition hover:text-neutral-900"
                  >
                    {item.url}
                  </a>
                ) : (
                  <div className="text-sm text-neutral-500">No link provided</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length > 0 && isOwner) {
    if (!mounted) {
      listContent = (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="glass-row flex items-start justify-between gap-4 p-4"
            >
              <div className="flex flex-1 items-start gap-3">
                <div className="mt-1 h-5 w-5" />
                <div>
                  <div className="text-base font-semibold text-neutral-900">{item.title}</div>
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-neutral-600 underline underline-offset-4 transition hover:text-neutral-900"
                    >
                      {item.url}
                    </a>
                  ) : (
                    <div className="text-sm text-neutral-500">No link provided</div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                disabled={pendingDeleteTransition && deletePendingId === item.id}
                className="glass-button text-xs disabled:cursor-not-allowed disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      );
    } else {
      listContent = (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {items.map((item) => (
                <SortableRow
                  key={item.id}
                  item={item}
                  isOwner
                  onDelete={handleDelete}
                  pending={pendingDeleteTransition && deletePendingId === item.id}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Wishlist</p>
          <h1 className="mt-2 text-3xl font-semibold">
            {isOwner ? "Your wishlist" : `${viewingName}'s wishlist`}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            {isOwner
              ? "Drag to set priority, add links, and keep track of what matters most."
              : "Viewing partner’s wishlist"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/app"
            className="glass-button"
          >
            Menu
          </Link>
          <button
            type="button"
            onClick={toggleViewing}
            disabled={!partnerUserId}
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/40 px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm backdrop-blur-md transition hover:shadow-md hover:ring-1 hover:ring-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-60"
          >
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-600">Viewing:</span>
            <span>{viewingName}</span>
          </button>
          {partnerUserId ? (
            <button
              type="button"
              className="glass-button px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              onClick={toggleViewing}
              disabled={switchPending}
            >
              {switchPending ? "Switching..." : partnerLabel}
            </button>
          ) : (
            <span className="text-xs text-neutral-600">Partner profile not found yet</span>
          )}
        </div>
      </div>

      {isOwner ? (
        <div className="glass-surface-strong p-6 space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">Add item</h2>
          <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-3 sm:items-center">
            <div className="sm:col-span-1">
              <label className="text-xs uppercase tracking-[0.18em] text-neutral-500" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                name="title"
                required
                className="glass-input mt-2"
                placeholder="New espresso machine"
                disabled={!isOwner}
              />
            </div>
            <div className="sm:col-span-1">
              <label className="text-xs uppercase tracking-[0.18em] text-neutral-500" htmlFor="url">
                URL (optional)
              </label>
              <input
                id="url"
                name="url"
                type="url"
                className="glass-input mt-2"
                placeholder="https://example.com"
                disabled={!isOwner}
              />
            </div>
            <div className="sm:col-span-1 flex items-end">
              <button
                type="submit"
                className="glass-button-primary inline-flex w-full items-center justify-center disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!isOwner}
              >
                Add item
              </button>
            </div>
          </form>
          {addState.error ? <p className="mt-2 text-sm text-red-600">{addState.error}</p> : null}
        </div>
      ) : (
        <div className="glass-surface-strong p-6 text-sm text-neutral-700">Viewing partner’s wishlist</div>
      )}

      <div className="glass-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">Wishlist</h2>
          {isOwner ? (
            <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
              Drag to reorder {isReordering ? "(saving...)" : ""}
            </div>
          ) : (
            <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">Read only</div>
          )}
        </div>

        <div className="mt-4">{listContent}</div>

        {reorderError ? <p className="mt-3 text-sm text-red-600">{reorderError}</p> : null}
        {deleteError ? <p className="mt-2 text-sm text-red-600">{deleteError}</p> : null}
      </div>
    </div>
  );
}
