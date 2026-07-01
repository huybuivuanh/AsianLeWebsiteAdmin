"use client";

import Image from "next/image";
import { formatPriceCAD, formatTimeHHmmTo12h } from "@/lib/utils";

type DemoMenuItemRowProps = {
  item: DemoMenuItem;
  optionGroupCount: number;
  onEdit: (item: DemoMenuItem) => void;
  onDelete: (item: DemoMenuItem) => void;
  deleting?: boolean;
};

export function DemoMenuItemRow({
  item,
  optionGroupCount,
  onEdit,
  onDelete,
  deleting = false,
}: DemoMenuItemRowProps) {
  return (
    <li className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] px-4 py-3 flex flex-wrap items-start gap-3">
      <Image
        src={item.image?.url ?? "/Soup Bowl Icon.jpg"}
        alt={item.name}
        width={128}
        height={128}
        sizes="128px"
        className="w-16 h-16 object-cover rounded-md shrink-0"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-bold text-foreground">{item.name}</span>
          <span className="text-sm font-semibold text-foreground/80 rounded-full border border-foreground/15 bg-foreground/5 px-2 py-0.5">
            {formatPriceCAD(item.price)}
          </span>
        </div>

        {item.description && (
          <p className="mt-1 text-sm text-foreground/70 line-clamp-2">{item.description}</p>
        )}

        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="text-xs rounded-full border border-foreground/10 bg-foreground/[0.03] px-2 py-0.5 text-foreground/60">
            {item.kitchenType}
          </span>

          {item.availability && (
            <span className="text-xs rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
              {formatTimeHHmmTo12h(item.availability.start)}–{formatTimeHHmmTo12h(item.availability.end)}
            </span>
          )}

          {item.soldOut && (
            <span className="text-xs rounded-full border border-red-300 bg-red-50 px-2 py-0.5 font-medium text-red-700">
              Sold out{item.soldOut.indefinite ? "" : ` · ${item.soldOut.hours}h`}
            </span>
          )}

          {optionGroupCount > 0 && (
            <span className="text-xs rounded-full border border-foreground/10 bg-foreground/[0.03] px-2 py-0.5 text-foreground/60">
              {optionGroupCount} option group{optionGroupCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onEdit(item)}
          disabled={deleting}
          className="rounded-xl border border-foreground/20 px-3.5 py-2 text-sm font-semibold text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(item)}
          disabled={deleting}
          className="rounded-xl border border-red-600 text-red-600 px-3.5 py-2 text-sm font-semibold hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-50"
        >
          {deleting ? "…" : "Delete"}
        </button>
      </div>
    </li>
  );
}
