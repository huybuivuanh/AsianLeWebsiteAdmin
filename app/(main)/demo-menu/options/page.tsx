"use client";

import { useState } from "react";
import { useOptionsStore } from "@/stores/optionsStore";
import { useOptionGroupsStore } from "@/stores/optionGroupsStore";
import { OptionRow } from "@/components/menu/options/OptionRow";
import { AddOptionModal } from "@/components/menu/options/AddOptionModal";
import { patchClearDefaultIfOptionRemoved } from "@/lib/option-group-updates";
import { PublishMenuButton } from "@/components/menu/PublishMenuButton";

export default function OptionsPage() {
  const {
    options,
    loading,
    error,
    addOption,
    updateOption,
    deleteOption,
  } = useOptionsStore();
  const { optionGroups, updateOptionGroup } = useOptionGroupsStore();
  const [addModalOpen, setAddModalOpen] = useState(false);

  async function handleDeleteOption(option: ItemOption) {
    if (!confirm(`Delete "${option.name}"? This cannot be undone.`)) return;
    try {
      await Promise.all(
        optionGroups
          .filter((g) => g.optionIds?.includes(option.id))
          .map((g) =>
            updateOptionGroup(g.id, {
              optionIds: (g.optionIds ?? []).filter((id) => id !== option.id),
              ...patchClearDefaultIfOptionRemoved(g, option.id),
            }),
          ),
      );
      await deleteOption(option.id);
    } catch {
      alert("Failed to delete option.");
    }
  }

  return (
    <div className="min-w-0">
      <PublishMenuButton />
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          Options
        </h1>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20"
        >
          Add Option
        </button>
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-foreground/60 text-sm">Loading options…</p>
      ) : options.length === 0 ? (
        <p className="text-foreground/70 text-sm">
          No options yet. Add one to get started.
        </p>
      ) : (
        <ul className="space-y-2">
          {options.map((option) => (
            <OptionRow
              key={option.id}
              option={option}
              optionGroups={optionGroups}
              onUpdate={updateOption}
              onDelete={handleDeleteOption}
            />
          ))}
        </ul>
      )}

      <AddOptionModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={addOption}
      />
    </div>
  );
}
