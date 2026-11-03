"use client";

import { useMemo, useState } from "react";
import { useOptionsStore } from "@/stores/optionsStore";
import { useOptionGroupsStore } from "@/stores/optionGroupsStore";
import { OptionRow } from "@/components/menu/options/OptionRow";
import { AddOptionModal } from "@/components/menu/options/AddOptionModal";
import { deleteOption } from "@/stores/linkedWrites";
import { searchInputClass } from "@/components/ui/form";
import { MenuPageHeader, UnusedFilterButton } from "@/components/menu/MenuPageHeader";
import { primaryButtonClass } from "@/components/ui/Button";
import { confirmDialog, alertDialog } from "@/stores/modalStore";

export default function OptionsPage() {
  const {
    options,
    loading,
    error,
    addOption,
    updateOption,
  } = useOptionsStore();
  const { optionGroups } = useOptionGroupsStore();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [unusedOnly, setUnusedOnly] = useState(false);

  /** Same rule as the "Unused" badge on OptionRow: not in any option group. */
  const usedOptionIds = useMemo(
    () => new Set(optionGroups.flatMap((g) => g.optionIds ?? [])),
    [optionGroups],
  );
  const unusedCount = useMemo(
    () => options.filter((o) => !usedOptionIds.has(o.id)).length,
    [options, usedOptionIds],
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter(
      (o) =>
        (!unusedOnly || !usedOptionIds.has(o.id)) &&
        (!q || o.name.toLowerCase().includes(q)),
    );
  }, [options, query, unusedOnly, usedOptionIds]);

  async function handleDeleteOption(option: ItemOption) {
    if (!(await confirmDialog(`Delete "${option.name}"? This cannot be undone.`, { danger: true, confirmLabel: "Delete" })))
      return;
    try {
      await deleteOption(option.id);
    } catch {
      await alertDialog("Failed to delete option.");
    }
  }

  return (
    <div className="min-w-0">
      <MenuPageHeader
        title="Options"
        count={loading && options.length === 0 ? undefined : options.length}
      >
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className={primaryButtonClass}
        >
          + Add option
        </button>
      </MenuPageHeader>
      <div className="mb-4 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search options…"
          className={`${searchInputClass} min-w-0 flex-1`}
          aria-label="Search options"
        />
        <UnusedFilterButton
          active={unusedOnly}
          count={unusedCount}
          onToggle={() => setUnusedOnly((v) => !v)}
          title="Options not in any option group"
        />
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      {loading && options.length === 0 ? (
        <p className="text-foreground/60 text-sm">Loading options…</p>
      ) : options.length === 0 ? (
        <p className="text-foreground/70 text-sm">
          No options yet. Add one to get started.
        </p>
      ) : filteredOptions.length === 0 ? (
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
          <p className="text-foreground text-sm font-medium">
            {query.trim()
              ? `No ${unusedOnly ? "unused " : ""}options match \u201c${query.trim()}\u201d.`
              : "No unused options."}
          </p>
          <p className="mt-1 text-foreground/60 text-sm">
            {unusedOnly ? "Turn off the Unused filter to see all options." : "Try a different search."}
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
