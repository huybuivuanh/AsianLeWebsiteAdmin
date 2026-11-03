"use client";

import { useMemo, useState } from "react";
import { useOptionGroupsStore } from "@/stores/optionGroupsStore";
import { useOptionsStore } from "@/stores/optionsStore";
import { deleteOptionGroup, setOptionGroupOptions } from "@/stores/linkedWrites";
import { OptionGroupRow } from "@/components/menu/option-groups/OptionGroupRow";
import { AddOptionGroupModal } from "@/components/menu/option-groups/AddOptionGroupModal";
import { searchInputClass } from "@/components/ui/form";
import { MenuPageHeader, UnusedFilterButton } from "@/components/menu/MenuPageHeader";
import { primaryButtonClass } from "@/components/ui/Button";
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
  } = useOptionGroupsStore();
  const { options } = useOptionsStore();
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
      await deleteOptionGroup(group.id);
    } catch {
      await alertDialog("Failed to delete option group.");
    }
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
          className={`${searchInputClass} min-w-0 flex-1`}
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
              onSaveGroupOptions={setOptionGroupOptions}
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
