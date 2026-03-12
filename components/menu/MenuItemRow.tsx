"use client";

import Image from "next/image";

type MenuItemRowProps = {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  deleting?: boolean;
};

export function MenuItemRow({
  item,
  onEdit,
  onDelete,
  deleting = false,
}: MenuItemRowProps) {
  return (
    <li className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-4 py-3 flex flex-wrap items-start gap-3">
      {item.image && (
        <Image
          src={item.image.url}
          alt={item.image.name || item.name}
          width={128}
          height={128}
          sizes="256px"
          className="w-16 h-16 object-cover rounded-md shrink-0"
        />
      )}
      <div className="min-w-0 flex-1">
        <span className="font-bold text-foreground">{item.name}</span>
        {item.description && (
          <p className="mt-1 text-sm text-foreground/70 line-clamp-2">
            {item.description}
          </p>
        )}
        <p className="mt-1 text-sm font-medium text-foreground">
          ${Number(item.price ?? 0).toFixed(2)}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onEdit(item)}
          disabled={deleting}
          className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(item)}
          disabled={deleting}
          className="rounded-md border border-red-500/30 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-50"
        >
          {deleting ? "…" : "Delete"}
        </button>
      </div>
    </li>
  );
}
