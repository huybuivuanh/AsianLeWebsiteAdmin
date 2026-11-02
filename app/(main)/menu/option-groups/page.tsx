"use client";

import { useMemo, useState } from "react";
import { useOptionGroupsStore } from "@/stores/optionGroupsStore";
import { useOptionsStore } from "@/stores/optionsStore";
import { useMenuItemsStore } from "@/stores/menuItemsStore";
import { OptionGroupRow } from "@/components/menu/option-groups/OptionGroupRow";
import { AddOptionGroupModal } from "@/components/menu/option-groups/AddOptionGroupModal";
import { itemReferencesOptionGroup, removeOptionGroupRef } from "@/lib/menu-item-option-groups";
import { patchClearDefaultIfNotInOptionIds } from "@/lib/option-group-updates";
import {
  MenuPageHeader,
  UnusedFilterButton,
  primaryButtonClass,
} from "@/components/menu/MenuPageHeader";
import { confirmDialog, alertDialog } from "@/stores/modalStore";

/** Same rule as the "Unused" badge on OptionGroupRow. */
function isUnusedGroup(group: OptionGroup) {
  return (group.itemIds?.length ?? 0) === 0;
}

export default function OptionGroupsPage() {
  const {
    optionGroups,
    loading,
    error,
    addOptionGroup,
    updateOptionGroup,
    deleteOptionGroup,
  } = useOptionGroupsStore();
  const { options, updateOption, updateOptionsBatch } = useOptionsStore();
  const { items: menuItems, updateMenuItemsBatch } = useMenuItemsStore();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [unusedOnly, setUnusedOnly] = useState(false);

  const unusedCount = useMemo(
    () => optionGroups.filter(isUnusedGroup).length,
    [optionGroups],
  );

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return optionGroups.filter(
      (g) =>
        (!unusedOnly || isUnusedGroup(g)) &&
        (!q || g.name.toLowerCase().includes(q)),
    );
  }, [optionGroups, query, unusedOnly]);

  async function handleDeleteGroup(group: OptionGroup) {
    if (!(await confirmDialog(`Delete "${group.name}"? This cannot be undone.`, { danger: true, confirmLabel: "Delete" })))
      return;
    try {
      await Promise.all([
        updateMenuItemsBatch(
          menuItems
            .filter((item) => itemReferencesOptionGroup(item, group.id))
            .map((item) => ({
              id: item.id,
              data: { optionGroupIds: removeOptionGroupRef(item, group.id) },
            })),
        ),
        updateOptionsBatch(
          options
            .filter((opt) => opt.groupIds?.includes(group.id))
            .map((opt) => ({
              id: opt.id,
              data: { groupIds: (opt.groupIds ?? []).filter((id) => id !== group.id) },
            })),
        ),
      ]);
      await deleteOptionGroup(group.id);
    } catch {
      await alertDialog("Failed to delete option group.");
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

  return (
    <div className="min-w-0">
      <MenuPageHeader
        title="Option groups"
        count={loading && optionGroups.length === 0 ? undefined : optionGroups.length}
      >
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className={primaryButtonClass}
        >
          + Add option group
        </button>
      </MenuPageHeader>
      <div className="mb-4 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search option groups…"
          className="min-w-0 flex-1 rounded-xl border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          aria-label="Search option groups"
        />
        <UnusedFilterButton
          active={unusedOnly}
          count={unusedCount}
          onToggle={() => setUnusedOnly((v) => !v)}
          title="Option groups not used by any item"
        />
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      {loading && optionGroups.length === 0 ? (
        <p className="text-foreground/60 text-sm">Loading option groups…</p>
      ) : optionGroups.length === 0 ? (
        <p className="text-foreground/70 text-sm">
          No option groups yet. Add one to get started.
        </p>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
          <p className="text-foreground text-sm font-medium">
            {query.trim()
              ? `No ${unusedOnly ? "unused " : ""}option groups match \u201c${query.trim()}\u201d.`
              : "No unused option groups."}
          </p>
          <p className="mt-1 text-foreground/60 text-sm">
            {unusedOnly ? "Turn off the Unused filter to see all option groups." : "Try a different search."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filteredGroups.map((group) => (
            <OptionGroupRow
              key={group.id}
              group={group}
              options={options}
              onUpdate={updateOptionGroup}
              onDelete={handleDeleteGroup}
              onSaveGroupOptions={handleSaveGroupOptions}
              onUpdateOption={updateOption}
            />
          ))}
        </ul>
      )}

      <AddOptionGroupModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={addOptionGroup}
      />
    </div>
  );
}
