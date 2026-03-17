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
    <li className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] px-4 py-3 flex flex-wrap items-start gap-3">
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
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-bold text-foreground">{item.name}</span>
          <span className="text-medium font-semibold text-foreground/80 rounded-full border border-foreground/15 bg-foreground/5 px-2 py-0.5">
            ${Number(item.price ?? 0).toFixed(2)}
          </span>
        </div>
        {item.description && (
          <p className="mt-1 text-sm text-foreground/70 line-clamp-2">
            {item.description}
          </p>
        )}
        {item.options && item.options.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {item.options.slice(0, 6).map((opt) => (
              <span
                key={opt}
                className="text-medium leading-5 rounded-full border border-foreground/10 bg-foreground/[0.03] px-2 text-foreground/70"
              >
                {opt}
              </span>
            ))}
            {item.options.length > 6 && (
              <span className="text-medium leading-5 text-foreground/50">
                +{item.options.length - 6} more
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onEdit(item)}
          disabled={deleting}
          className="rounded-xl border border-foreground/20 px-3.5 py-2 text-base font-semibold text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(item)}
          disabled={deleting}
          className="rounded-xl border border-red-600 text-red-600 px-3.5 py-2 text-base font-semibold hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-50"
        >
          {deleting ? "…" : "Delete"}
        </button>
      </div>
    </li>
  );
}
