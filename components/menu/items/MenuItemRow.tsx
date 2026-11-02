"use client";

import { useState } from "react";
import Image from "next/image";
import { formatPriceCAD } from "@/lib/utils";
import { useOptionGroupsStore } from "@/stores/optionGroupsStore";
import { useOptionsStore } from "@/stores/optionsStore";
import { useMenuItemsStore } from "@/stores/menuItemsStore";
import {
  getOrderedOptionGroupRefs,
  removeOptionGroupRef,
} from "@/lib/menu-item-option-groups";
import {
  patchClearDefaultIfOptionRemoved,
  patchClearDefaultIfNotInOptionIds,
} from "@/lib/option-group-updates";
import { AddOptionToGroupModal } from "@/components/menu/option-groups/AddOptionToGroupModal";
import { AddItemOptionGroupsModal } from "@/components/menu/items/AddItemOptionGroupsModal";
import { SortItemOptionGroupsModal } from "@/components/menu/items/SortItemOptionGroupsModal";
import { confirmDialog, alertDialog } from "@/stores/modalStore";
import {
  ExpandChevron,
  RemoveButton,
  RowActions,
  UnusedBadge,
  addButtonClass,
  rowCardClass,
  rowHeaderClass,
  subtleButtonClass,
} from "@/components/menu/RowParts";

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
  const { optionGroups, updateOptionGroup, updateOptionGroupsBatch } = useOptionGroupsStore();
  const { options, updateOption, updateOptionsBatch } = useOptionsStore();
  const { updateMenuItemField } = useMenuItemsStore();

  const [expanded, setExpanded] = useState(false);
  const [addOptionForGroup, setAddOptionForGroup] = useState<OptionGroup | null>(null);
  const [addGroupsOpen, setAddGroupsOpen] = useState(false);
  const [sortGroupsOpen, setSortGroupsOpen] = useState(false);

  const itemOptionGroups = getOrderedOptionGroupRefs(item)
    .map((ref) => optionGroups.find((g) => g.id === ref.optionGroupId))
    .filter((g): g is OptionGroup => g != null);
  const isUnused = (item.categoryIds?.length ?? 0) === 0;

  async function handleRemoveOptionGroup(group: OptionGroup) {
    if (!(await confirmDialog(`Remove "${group.name}" from this item?`, { danger: true, confirmLabel: "Remove" })))
      return;
    try {
      await Promise.all([
        updateMenuItemField(item.id, {
          optionGroupIds: removeOptionGroupRef(item, group.id),
        }),
        updateOptionGroup(group.id, {
          itemIds: (group.itemIds ?? []).filter((id) => id !== item.id),
        }),
      ]);
    } catch {
      await alertDialog("Failed to remove option group.");
    }
  }

  async function handleRemoveOption(group: OptionGroup, option: ItemOption) {
    const otherItems = (group.itemIds ?? []).filter((id) => id !== item.id).length;
    const message =
      otherItems > 0
        ? `Remove "${option.name}" from "${group.name}"? This also removes it from the ${otherItems} other item${otherItems === 1 ? "" : "s"} that use this group.`
        : `Remove "${option.name}" from "${group.name}"?`;
    if (!(await confirmDialog(message, { danger: true, confirmLabel: "Remove" })))
      return;
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
      await alertDialog("Failed to remove option.");
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

    await updateOptionsBatch(
      options
        .filter((o) => removed.includes(o.id) || added.includes(o.id))
        .map((o) => ({
          id: o.id,
          data: {
            groupIds: removed.includes(o.id)
              ? (o.groupIds ?? []).filter((id) => id !== groupId)
              : [...new Set([...(o.groupIds ?? []), groupId])],
          },
        })),
    );
  }

  async function handleSaveOptionGroups(optionGroupIds: OptionGroupId[]) {
    const selectedIds = new Set(optionGroupIds.map((r) => r.optionGroupId));
    await Promise.all([
      updateMenuItemField(item.id, { optionGroupIds }),
      updateOptionGroupsBatch(
        optionGroups
          .filter((group) => selectedIds.has(group.id) !== (group.itemIds ?? []).includes(item.id))
          .map((group) => ({
            id: group.id,
            data: {
              itemIds: selectedIds.has(group.id)
                ? [...(group.itemIds ?? []), item.id]
                : (group.itemIds ?? []).filter((id) => id !== item.id),
            },
          })),
      ),
    ]);
  }

  return (
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
        <Image
          src={item.image?.url ?? "/Soup Bowl Icon.jpg"}
          alt=""
          width={128}
          height={128}
          sizes="56px"
          className="h-14 w-14 shrink-0 rounded-lg object-cover"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 font-semibold text-foreground break-words">{item.name}</p>
            <span className="shrink-0 font-semibold tabular-nums text-foreground">
              {formatPriceCAD(item.price)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground/60">
            {isUnused && <UnusedBadge />}
            {item.kitchenType && <span>{item.kitchenType}</span>}
            {itemOptionGroups.length > 0 && (
              <span>
                {itemOptionGroups.length} option group{itemOptionGroups.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <ExpandChevron expanded={expanded} />
        <RowActions
          name={item.name}
          onEdit={() => onEdit(item)}
          onDelete={() => onDelete(item)}
          deleting={deleting}
        />
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-foreground/10 px-3 py-3 sm:px-4">
          {item.description && (
            <p className="text-sm text-foreground/70">{item.description}</p>
          )}

          {itemOptionGroups.length === 0 ? (
            <p className="text-sm text-foreground/60">No option groups assigned.</p>
          ) : (
            itemOptionGroups.map((group) => {
              const groupOptions = options.filter((o) => group.optionIds?.includes(o.id));
              return (
                <section
                  key={group.id}
                  className="overflow-hidden rounded-lg border border-foreground/10"
                >
                  <div className="flex items-center justify-between gap-2 bg-foreground/[0.03] px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{group.name}</p>
                      <p className="text-xs text-foreground/60">
                        Min {group.minSelection}, max {group.maxSelection}
                      </p>
                    </div>
                    <RemoveButton
                      onClick={() => handleRemoveOptionGroup(group)}
                      label={`Remove ${group.name} from ${item.name}`}
                    >
                      Remove group
                    </RemoveButton>
                  </div>
                  <ul className="divide-y divide-foreground/10">
                    {groupOptions.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-foreground/50">
                        No options in this group.
                      </li>
                    ) : (
                      groupOptions.map((opt) => (
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
                          <RemoveButton
                            onClick={() => handleRemoveOption(group, opt)}
                            label={`Remove ${opt.name} from ${group.name}`}
                          />
                        </li>
                      ))
                    )}
                  </ul>
                  <div className="border-t border-foreground/10 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setAddOptionForGroup(group)}
                      className={addButtonClass}
                    >
                      + Add options
                    </button>
                  </div>
                </section>
              );
            })
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAddGroupsOpen(true)}
              className={addButtonClass}
            >
              + Add option groups
            </button>
            <button
              type="button"
              onClick={() => setSortGroupsOpen(true)}
              disabled={itemOptionGroups.length < 2}
              className={subtleButtonClass}
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
