"use client";

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

type WishlistClientProps = {
  items: WishlistItem[];
  isOwner: boolean;
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

export function WishlistClient({ items: initialItems, isOwner }: WishlistClientProps) {
  const [items, setItems] = useState<WishlistItem[]>(initialItems);
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
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (!addState.success || !addState.item) return;
    const newItem = addState.item;
    setItems((prev) => {
      const alreadyExists = prev.some((it) => it.id === newItem.id);
      if (alreadyExists) return prev;
      return [...prev, newItem].sort((a, b) => a.sort_order - b.sort_order);
    });
    formRef.current?.reset();
  }, [addState.item, addState.success]);

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
    setDeleteError(null);
    setDeletePendingId(id);
    startDeleteTransition(async () => {
      const result = await deleteWishlistItem(id);
      if (!result.success) {
        setDeleteError(result.error ?? "Failed to delete item.");
        setDeletePendingId(null);
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      setDeletePendingId(null);
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!isOwner) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const previousItems = items;
    const nextItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
      ...item,
      sort_order: index + 1,
    }));

    setItems(nextItems);
    setReorderError(null);
    setIsReordering(true);

    const result = await reorderWishlistItems(nextItems.map((item) => item.id));

    if (!result.success) {
      setItems(previousItems);
      setReorderError(result.error ?? "Reorder failed. Please try again.");
      if (result.error) {
        console.error("Reorder failed:", result.error);
      }
    }

    setIsReordering(false);
  };

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
              />
            </div>
            <div className="sm:col-span-1 flex items-end">
              <button
                type="submit"
                className="glass-button-primary inline-flex w-full items-center justify-center"
              >
                Add item
              </button>
            </div>
          </form>
          {addState.error ? <p className="mt-2 text-sm text-red-600">{addState.error}</p> : null}
        </div>
      ) : null}

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
