"use client";

import { useMemo, useState } from "react";
import { useOptionsStore } from "@/stores/optionsStore";
import { useOptionGroupsStore } from "@/stores/optionGroupsStore";
import { OptionRow } from "@/components/menu/options/OptionRow";
import { AddOptionModal } from "@/components/menu/options/AddOptionModal";
import { patchClearDefaultIfOptionRemoved } from "@/lib/option-group-updates";
import { PublishMenuButton } from "@/components/menu/PublishMenuButton";
import { confirmDialog, alertDialog } from "@/stores/modalStore";

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
  const [query, setQuery] = useState("");

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  async function handleDeleteOption(option: ItemOption) {
    if (!(await confirmDialog(`Delete "${option.name}"? This cannot be undone.`, { danger: true, confirmLabel: "Delete" })))
      return;
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
      await alertDialog("Failed to delete option.");
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
          + Add Option
        </button>
        <PublishMenuButton />
      </div>
      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search options…"
          className="w-full rounded-xl border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          aria-label="Search options"
        />
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
      ) : filteredOptions.length === 0 ? (
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
          <p className="text-foreground text-sm font-medium">
            No options match “{query.trim()}”.
          </p>
          <p className="mt-1 text-foreground/60 text-sm">
            Try a different search.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filteredOptions.map((option) => (
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
