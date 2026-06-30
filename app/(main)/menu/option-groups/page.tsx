"use client";

import { useState } from "react";
import { useOptionGroupsStore } from "@/stores/optionGroupsStore";
import { useOptionsStore } from "@/stores/optionsStore";
import { useDemoMenuItemsStore } from "@/stores/demoMenuItemsStore";
import { OptionGroupRow } from "@/components/menu/option-groups/OptionGroupRow";
import { AddOptionGroupModal } from "@/components/menu/option-groups/AddOptionGroupModal";
import { itemReferencesOptionGroup, removeOptionGroupRef } from "@/lib/menu-item-option-groups";
import { patchClearDefaultIfOptionRemoved } from "@/lib/option-group-updates";
import { PublishMenuButton } from "@/components/menu/PublishMenuButton";

export default function OptionGroupsPage() {
  const {
    optionGroups,
    loading,
    error,
    addOptionGroup,
    updateOptionGroup,
    deleteOptionGroup,
  } = useOptionGroupsStore();
  const { options, addOption, updateOption } = useOptionsStore();
  const { items: demoItems, updateDemoMenuItem } = useDemoMenuItemsStore();
  const [addModalOpen, setAddModalOpen] = useState(false);

  async function handleDeleteGroup(group: OptionGroup) {
    if (!confirm(`Delete "${group.name}"? This cannot be undone.`)) return;
    try {
      await Promise.all([
        ...demoItems
          .filter((item) => itemReferencesOptionGroup(item, group.id))
          .map((item) =>
            updateDemoMenuItem(item.id, {
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
      alert("Failed to delete option group.");
    }
  }

  async function handleCreateAndLinkOption(
    group: OptionGroup,
    name: string,
    price: number,
  ) {
    const optionId = await addOption({ name, price, groupIds: [group.id] });
    await updateOptionGroup(group.id, {
      optionIds: [...(group.optionIds ?? []), optionId],
    });
  }

  async function handleLinkExistingOption(group: OptionGroup, option: ItemOption) {
    await Promise.all([
      updateOptionGroup(group.id, {
        optionIds: [...(group.optionIds ?? []), option.id],
      }),
      updateOption(option.id, {
        groupIds: [...(option.groupIds ?? []), group.id],
      }),
    ]);
  }

  return (
    <div className="min-w-0">
      <PublishMenuButton />
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          Option Groups
        </h1>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20"
        >
          Add Option Group
        </button>
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
      ) : (
        <ul className="space-y-2">
          {optionGroups.map((group) => (
            <OptionGroupRow
              key={group.id}
              group={group}
              options={options}
              onUpdate={updateOptionGroup}
              onDelete={handleDeleteGroup}
              onCreateAndLinkOption={handleCreateAndLinkOption}
              onLinkExistingOption={handleLinkExistingOption}
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
