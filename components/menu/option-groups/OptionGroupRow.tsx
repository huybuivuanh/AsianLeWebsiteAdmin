"use client";

import { useState } from "react";
import { deleteField } from "firebase/firestore";
import { formatPriceCAD } from "@/lib/utils";
import { patchClearDefaultIfOptionRemoved } from "@/lib/option-group-updates";
import { confirmDialog, alertDialog } from "@/stores/modalStore";
import { EditOptionGroupModal } from "./EditOptionGroupModal";
import { AddOptionToGroupModal } from "./AddOptionToGroupModal";
import {
  ExpandChevron,
  RemoveButton,
  RowActions,
  UnusedBadge,
  addButtonClass,
  rowCardClass,
  rowHeaderClass,
} from "@/components/menu/RowParts";

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
    if (!(await confirmDialog(`Remove "${option.name}" from this group?`, { danger: true, confirmLabel: "Remove" })))
      return;
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
      await alertDialog("Failed to remove option.");
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
      await alertDialog("Failed to update default option.");
    } finally {
      setSavingDefault(false);
    }
  }

  return (
    <>
      <li className={rowCardClass}>
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
          className={rowHeaderClass}
        >
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground break-words">{group.name}</span>
              {isUnused && <UnusedBadge />}
            </div>
            <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-sm text-foreground/60">
              <span>
                Min {group.minSelection}, max {group.maxSelection}
              </span>
              <span>
                {groupOptions.length} option{groupOptions.length !== 1 ? "s" : ""}
              </span>
              {group.multipleOptionQuantity && <span>Multiple qty</span>}
            </div>
          </div>
          <ExpandChevron expanded={expanded} />
          <RowActions
            name={group.name}
            onEdit={() => setEditOpen(true)}
            onDelete={() => onDelete(group)}
          />
        </div>

        {expanded && (
          <div className="space-y-3 border-t border-foreground/10 px-3 py-3 sm:px-4">
            {groupOptions.length === 0 ? (
              <p className="text-sm text-foreground/60">No options in this group yet.</p>
            ) : (
              <ul className="divide-y divide-foreground/10 overflow-hidden rounded-lg border border-foreground/10">
                {groupOptions.map((opt) => (
                  <li
                    key={opt.id}
                    className="flex items-center justify-between gap-3 px-3 py-1.5"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {opt.name}
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-foreground/60">
                      {formatPriceCAD(opt.price)}
                    </span>
                    <label className="flex shrink-0 cursor-pointer items-center gap-1.5">
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
                    <RemoveButton
                      onClick={() => handleRemoveOption(opt)}
                      label={`Remove ${opt.name} from ${group.name}`}
                    />
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => setAddOptionOpen(true)}
              className={addButtonClass}
            >
              + Add options
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
