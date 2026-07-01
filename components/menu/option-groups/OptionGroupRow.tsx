"use client";

import { useState } from "react";
import { deleteField } from "firebase/firestore";
import { formatPriceCAD } from "@/lib/utils";
import { patchClearDefaultIfOptionRemoved } from "@/lib/option-group-updates";
import { EditOptionGroupModal } from "./EditOptionGroupModal";
import { AddOptionToGroupModal } from "./AddOptionToGroupModal";

type OptionGroupRowProps = {
  group: OptionGroup;
  options: ItemOption[];
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
  onDelete: (group: OptionGroup) => Promise<void>;
  onSaveGroupOptions: (groupId: string, optionIds: string[]) => Promise<void>;
  onUpdateOption: (id: string, data: Record<string, unknown>) => Promise<void>;
};

export function OptionGroupRow({
  group,
  options,
  onUpdate,
  onDelete,
  onSaveGroupOptions,
  onUpdateOption,
}: OptionGroupRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addOptionOpen, setAddOptionOpen] = useState(false);
  const [savingDefault, setSavingDefault] = useState(false);

  const groupOptions = options.filter((o) => group.optionIds?.includes(o.id));
  const isUnused = (group.itemIds?.length ?? 0) === 0;

  async function handleRemoveOption(option: ItemOption) {
    if (!confirm(`Remove "${option.name}" from this group?`)) return;
    try {
      await Promise.all([
        onUpdate(group.id, {
          optionIds: (group.optionIds ?? []).filter((id) => id !== option.id),
          ...patchClearDefaultIfOptionRemoved(group, option.id),
        }),
        onUpdateOption(option.id, {
          groupIds: (option.groupIds ?? []).filter((id) => id !== group.id),
        }),
      ]);
    } catch {
      alert("Failed to remove option.");
    }
  }

  async function handleDefaultToggle(optionId: string, checked: boolean) {
    setSavingDefault(true);
    try {
      if (checked) {
        await onUpdate(group.id, { defaultOptionId: optionId });
      } else {
        await onUpdate(group.id, { defaultOptionId: deleteField() });
      }
    } catch {
      alert("Failed to update default option.");
    } finally {
      setSavingDefault(false);
    }
  }

  return (
    <>
      <li className="rounded-lg border border-foreground/10 bg-foreground/[0.02]">
        {/* Header */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setExpanded((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setExpanded((v) => !v);
            }
          }}
          aria-expanded={expanded}
          className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 hover:bg-foreground/[0.03]"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-foreground truncate">{group.name}</span>
            {isUnused && (
              <span className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                Unused
              </span>
            )}
          </div>
          <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="rounded-lg border border-foreground/20 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/5"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(group)}
              className="rounded-lg border border-red-600 text-red-600 px-3 py-1.5 text-sm font-medium hover:bg-red-600 hover:text-white"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Summary */}
        <p className="px-4 pb-3 text-xs text-foreground/50">
          Min {group.minSelection} · Max {group.maxSelection} · {groupOptions.length} option{groupOptions.length !== 1 ? "s" : ""}
          {group.multipleOptionQuantity && " · Multiple qty"}
        </p>

        {/* Expanded options */}
        {expanded && (
          <div className="border-t border-foreground/10 px-4 py-3 space-y-2">
            {groupOptions.length === 0 ? (
              <p className="text-sm text-foreground/50">No options in this group yet.</p>
            ) : (
              groupOptions.map((opt) => (
                <div
                  key={opt.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-foreground/10 bg-background px-3 py-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm text-foreground truncate">{opt.name}</span>
                    <span className="text-sm text-foreground/50 shrink-0">{formatPriceCAD(opt.price)}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={group.defaultOptionId === opt.id}
                        disabled={savingDefault}
                        onChange={(e) => {
                          const isDefault = group.defaultOptionId === opt.id;
                          if (e.target.checked && !isDefault) void handleDefaultToggle(opt.id, true);
                          else if (!e.target.checked && isDefault) void handleDefaultToggle(opt.id, false);
                        }}
                        className="h-3.5 w-3.5 rounded border-foreground/30"
                      />
                      <span className="text-xs text-foreground/60 whitespace-nowrap">Default</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(opt)}
                      className="rounded border border-red-600/50 text-red-600 px-2 py-1 text-xs font-medium hover:bg-red-600 hover:text-white"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
            <button
              type="button"
              onClick={() => setAddOptionOpen(true)}
              className="mt-1 rounded-lg border border-foreground/20 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/5"
            >
              + Add Options
            </button>
          </div>
        )}
      </li>

      <EditOptionGroupModal
        open={editOpen}
        group={group}
        onClose={() => setEditOpen(false)}
        onSave={onUpdate}
      />
      <AddOptionToGroupModal
        open={addOptionOpen}
        group={group}
        options={options}
        onClose={() => setAddOptionOpen(false)}
        onSave={onSaveGroupOptions}
      />
    </>
  );
}
