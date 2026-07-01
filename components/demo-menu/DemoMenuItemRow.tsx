"use client";

import { useState } from "react";
import Image from "next/image";
import { formatPriceCAD, formatTimeHHmmTo12h } from "@/lib/utils";
import { useOptionGroupsStore } from "@/stores/optionGroupsStore";
import { useOptionsStore } from "@/stores/optionsStore";
import { useDemoMenuItemsStore } from "@/stores/demoMenuItemsStore";
import {
  getOrderedOptionGroupRefs,
  removeOptionGroupRef,
} from "@/lib/menu-item-option-groups";
import {
  patchClearDefaultIfOptionRemoved,
  patchClearDefaultIfNotInOptionIds,
} from "@/lib/option-group-updates";
import { AddOptionToGroupModal } from "@/components/menu/option-groups/AddOptionToGroupModal";
import { AddItemOptionGroupsModal } from "@/components/demo-menu/AddItemOptionGroupsModal";
import { SortItemOptionGroupsModal } from "@/components/demo-menu/SortItemOptionGroupsModal";

type DemoMenuItemRowProps = {
  item: DemoMenuItem;
  onEdit: (item: DemoMenuItem) => void;
  onDelete: (item: DemoMenuItem) => void;
  deleting?: boolean;
};

export function DemoMenuItemRow({
  item,
  onEdit,
  onDelete,
  deleting = false,
}: DemoMenuItemRowProps) {
  const { optionGroups, updateOptionGroup } = useOptionGroupsStore();
  const { options, updateOption } = useOptionsStore();
  const { updateDemoMenuItemField } = useDemoMenuItemsStore();

  const [expanded, setExpanded] = useState(false);
  const [addOptionForGroup, setAddOptionForGroup] = useState<OptionGroup | null>(null);
  const [addGroupsOpen, setAddGroupsOpen] = useState(false);
  const [sortGroupsOpen, setSortGroupsOpen] = useState(false);

  const itemOptionGroups = getOrderedOptionGroupRefs(item)
    .map((ref) => optionGroups.find((g) => g.id === ref.optionGroupId))
    .filter((g): g is OptionGroup => g != null);

  async function handleRemoveOptionGroup(group: OptionGroup) {
    if (!confirm(`Remove "${group.name}" from this item?`)) return;
    try {
      await Promise.all([
        updateDemoMenuItemField(item.id, {
          optionGroupIds: removeOptionGroupRef(item, group.id),
        }),
        updateOptionGroup(group.id, {
          itemIds: (group.itemIds ?? []).filter((id) => id !== item.id),
        }),
      ]);
    } catch {
      alert("Failed to remove option group.");
    }
  }

  async function handleRemoveOption(group: OptionGroup, option: ItemOption) {
    if (!confirm(`Remove "${option.name}" from this group?`)) return;
    try {
      await Promise.all([
        updateOptionGroup(group.id, {
          optionIds: (group.optionIds ?? []).filter((id) => id !== option.id),
          ...patchClearDefaultIfOptionRemoved(group, option.id),
        }),
        updateOption(option.id, {
          groupIds: (option.groupIds ?? []).filter((id) => id !== group.id),
        }),
      ]);
    } catch {
      alert("Failed to remove option.");
    }
  }

  async function handleSaveGroupOptions(groupId: string, optionIds: string[]) {
    const group = optionGroups.find((g) => g.id === groupId);
    const previousOptionIds = group?.optionIds ?? [];
    const added = optionIds.filter((id) => !previousOptionIds.includes(id));
    const removed = previousOptionIds.filter((id) => !optionIds.includes(id));

    await updateOptionGroup(groupId, {
      optionIds,
      ...(group ? patchClearDefaultIfNotInOptionIds(group, optionIds) : {}),
    });

    for (const optionId of removed) {
      const option = options.find((o) => o.id === optionId);
      if (option) {
        const nextGroupIds = (option.groupIds ?? []).filter((id) => id !== groupId);
        await updateOption(optionId, { groupIds: nextGroupIds });
      }
    }
    for (const optionId of added) {
      const option = options.find((o) => o.id === optionId);
      if (option) {
        const nextGroupIds = (option.groupIds ?? []).includes(groupId)
          ? option.groupIds!
          : [...(option.groupIds ?? []), groupId];
        await updateOption(optionId, { groupIds: nextGroupIds });
      }
    }
  }

  async function handleSaveOptionGroups(optionGroupIds: OptionGroupId[]) {
    const selectedIds = new Set(optionGroupIds.map((r) => r.optionGroupId));
    await Promise.all([
      updateDemoMenuItemField(item.id, { optionGroupIds }),
      ...optionGroups.map((group) => {
        const isSelected = selectedIds.has(group.id);
        const hasItem = (group.itemIds ?? []).includes(item.id);
        if (isSelected === hasItem) return Promise.resolve();
        const nextItemIds = isSelected
          ? [...(group.itemIds ?? []), item.id]
          : (group.itemIds ?? []).filter((id) => id !== item.id);
        return updateOptionGroup(group.id, { itemIds: nextItemIds });
      }),
    ]);
  }

  return (
    <li className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] overflow-hidden">
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
        className="px-4 py-3 flex flex-wrap items-start gap-3 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 hover:bg-foreground/[0.03]"
      >
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

          {expanded && item.description && (
            <p className="mt-1 text-sm text-foreground/70">{item.description}</p>
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

            {itemOptionGroups.length > 0 && (
              <span className="text-xs rounded-full border border-foreground/10 bg-foreground/[0.03] px-2 py-0.5 text-foreground/60">
                {itemOptionGroups.length} option group{itemOptionGroups.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
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
      </div>

      {expanded && (
        <div className="border-t border-foreground/10 bg-foreground/[0.02] px-4 py-4 space-y-3">
          {itemOptionGroups.length === 0 ? (
            <p className="text-sm text-foreground/60">No option groups assigned.</p>
          ) : (
            itemOptionGroups.map((group) => {
              const groupOptions = options.filter((o) => group.optionIds?.includes(o.id));
              return (
                <div
                  key={group.id}
                  className="rounded-xl border border-foreground/10 bg-background/40 p-3 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-foreground">{group.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveOptionGroup(group)}
                      className="rounded-lg border border-red-600/30 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    >
                      Remove group
                    </button>
                  </div>
                  <p className="text-xs text-foreground/60">
                    Min {group.minSelection} · Max {group.maxSelection}
                  </p>
                  <div className="space-y-1.5">
                    {groupOptions.length === 0 ? (
                      <p className="text-sm text-foreground/50">No options in this group.</p>
                    ) : (
                      groupOptions.map((opt) => (
                        <div
                          key={opt.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-foreground/10 bg-background px-3 py-2"
                        >
                          <span className="text-sm text-foreground truncate">
                            {opt.name} <span className="text-foreground/50">· {formatPriceCAD(opt.price)}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(group, opt)}
                            className="shrink-0 rounded-lg border border-red-600/30 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
                          >
                            Remove option
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddOptionForGroup(group)}
                    className="rounded-lg border border-foreground/20 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  >
                    + Add Options
                  </button>
                </div>
              );
            })
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => setAddGroupsOpen(true)}
              className="rounded-xl border border-foreground/20 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            >
              + Add Option Groups
            </button>
            <button
              type="button"
              onClick={() => setSortGroupsOpen(true)}
              disabled={itemOptionGroups.length < 2}
              className="rounded-xl border border-foreground/20 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
            >
              Sort groups
            </button>
          </div>
        </div>
      )}

      <AddOptionToGroupModal
        open={addOptionForGroup != null}
        group={addOptionForGroup}
        options={options}
        onClose={() => setAddOptionForGroup(null)}
        onSave={handleSaveGroupOptions}
      />
      <AddItemOptionGroupsModal
        open={addGroupsOpen}
        item={item}
        optionGroups={optionGroups}
        onClose={() => setAddGroupsOpen(false)}
        onSave={handleSaveOptionGroups}
      />
      <SortItemOptionGroupsModal
        open={sortGroupsOpen}
        item={item}
        optionGroups={optionGroups}
        onClose={() => setSortGroupsOpen(false)}
        onSave={handleSaveOptionGroups}
      />
    </li>
  );
}
