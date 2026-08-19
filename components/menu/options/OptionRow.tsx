"use client";

import { useState } from "react";
import { formatPriceCAD, formatWeeklyAvailability, hasNoAvailableDays } from "@/lib/utils";
import { EditOptionModal } from "./EditOptionModal";

type OptionRowProps = {
  option: ItemOption;
  optionGroups: OptionGroup[];
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
  onDelete: (option: ItemOption) => Promise<void>;
};

export function OptionRow({ option, optionGroups, onUpdate, onDelete }: OptionRowProps) {
  const [editOpen, setEditOpen] = useState(false);

  const belongsToGroups = optionGroups.filter((g) =>
    g.optionIds?.includes(option.id),
  );
  const isUnused = belongsToGroups.length === 0;

  return (
    <>
      <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-foreground/10 bg-foreground/[0.02] px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">{option.name}</span>
            <span className="text-sm text-foreground/60">{formatPriceCAD(option.price)}</span>
            {isUnused && (
              <span className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                Unused
              </span>
            )}
          </div>
          {belongsToGroups.length > 0 && (
            <p className="mt-0.5 text-xs text-foreground/50">
              Groups: {belongsToGroups.map((g) => g.name).join(", ")}
            </p>
          )}
          {option.availability && hasNoAvailableDays(option.availability) && (
            <span className="mt-1 inline-block text-xs rounded-full border border-red-300 bg-red-50 px-2 py-0.5 font-medium text-red-700">
              Unavailable · no days set
            </span>
          )}
          {option.availability && !hasNoAvailableDays(option.availability) && (
            <span className="mt-1 inline-block text-xs rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
              {formatWeeklyAvailability(option.availability)}
            </span>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="rounded-lg border border-foreground/20 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/5"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(option)}
            className="rounded-lg border border-red-600 text-red-600 px-3 py-1.5 text-sm font-medium hover:bg-red-600 hover:text-white"
          >
            Delete
          </button>
        </div>
      </li>

      <EditOptionModal
        open={editOpen}
        option={option}
        onClose={() => setEditOpen(false)}
        onSave={onUpdate}
      />
    </>
  );
}
