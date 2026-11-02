"use client";

import { useState } from "react";
import { formatPriceCAD } from "@/lib/utils";
import { EditOptionModal } from "./EditOptionModal";
import { RowActions, UnusedBadge, rowCardClass } from "@/components/menu/RowParts";

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
      <li className={`${rowCardClass} flex items-center gap-3 px-3 py-3 sm:px-4`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground break-words">{option.name}</span>
              {isUnused && <UnusedBadge />}
            </div>
            <span className="shrink-0 font-semibold tabular-nums text-foreground">
              {formatPriceCAD(option.price)}
            </span>
          </div>
          {belongsToGroups.length > 0 && (
            <p className="mt-0.5 text-sm text-foreground/60">
              In {belongsToGroups.map((g) => g.name).join(", ")}
            </p>
          )}
        </div>
        <RowActions
          name={option.name}
          onEdit={() => setEditOpen(true)}
          onDelete={() => onDelete(option)}
        />
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
