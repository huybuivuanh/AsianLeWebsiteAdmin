"use client";

import { useMemo, useState } from "react";
import { useOptionGroupsStore } from "@/stores/optionGroupsStore";
import { useOptionsStore } from "@/stores/optionsStore";
import { useDemoMenuItemsStore } from "@/stores/demoMenuItemsStore";
import { OptionGroupRow } from "@/components/menu/option-groups/OptionGroupRow";
import { AddOptionGroupModal } from "@/components/menu/option-groups/AddOptionGroupModal";
import { itemReferencesOptionGroup, removeOptionGroupRef } from "@/lib/menu-item-option-groups";
import { patchClearDefaultIfNotInOptionIds } from "@/lib/option-group-updates";
import { PublishMenuButton } from "@/components/menu/PublishMenuButton";
import { confirmDialog, alertDialog } from "@/stores/modalStore";

export default function OptionGroupsPage() {
  const {
    optionGroups,
    loading,
    error,
    addOptionGroup,
    updateOptionGroup,
    deleteOptionGroup,
  } = useOptionGroupsStore();
  const { options, updateOption } = useOptionsStore();
  const { items: demoItems, updateDemoMenuItemField } = useDemoMenuItemsStore();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return optionGroups;
    return optionGroups.filter((g) => g.name.toLowerCase().includes(q));
  }, [optionGroups, query]);

  async function handleDeleteGroup(group: OptionGroup) {
    if (!(await confirmDialog(`Delete "${group.name}"? This cannot be undone.`, { danger: true, confirmLabel: "Delete" })))
      return;
    try {
      await Promise.all([
        ...demoItems
          .filter((item) => itemReferencesOptionGroup(item, group.id))
          .map((item) =>
            updateDemoMenuItemField(item.id, {
              optionGroupIds: removeOptionGroupRef(item, group.id),
            }),
          ),
        ...options
          .filter((opt) => opt.groupIds?.includes(group.id))
          .map((opt) =>
            updateOption(opt.id, {
              groupIds: (opt.groupIds ?? []).filter((id) => id !== group.id),
            }),
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

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-foreground/10 bg-background px-4 py-3 mb-4">
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20"
        >
          + Add Option Group
        </button>
        <PublishMenuButton />
      </div>
      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search option groups…"
          className="w-full rounded-xl border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          aria-label="Search option groups"
        />
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-foreground/60 text-sm">Loading option groups…</p>
      ) : optionGroups.length === 0 ? (
        <p className="text-foreground/70 text-sm">
          No option groups yet. Add one to get started.
        </p>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
          <p className="text-foreground text-sm font-medium">
            No option groups match “{query.trim()}”.
          </p>
          <p className="mt-1 text-foreground/60 text-sm">
            Try a different search.
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
