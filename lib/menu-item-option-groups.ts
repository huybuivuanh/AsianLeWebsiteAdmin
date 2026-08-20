/**
 * Menu items store `optionGroupIds` as `{ optionGroupId, order }[]`.
 * Legacy documents may still use `string[]`; normalize on read.
 */

export function normalizeMenuItemOptionGroupIds(
  raw: unknown,
): OptionGroupId[] | undefined {
  if (raw == null || !Array.isArray(raw) || raw.length === 0) {
    return undefined;
  }
  const first = raw[0];
  if (typeof first === "string") {
    return (raw as string[]).map((optionGroupId, index) => ({
      optionGroupId,
      order: index,
    }));
  }
  if (
    typeof first === "object" &&
    first !== null &&
    "optionGroupId" in first
  ) {
    return (raw as Partial<OptionGroupId>[]).map((r, index) => ({
      optionGroupId: String(r.optionGroupId),
      order: typeof r.order === "number" ? r.order : index,
    }));
  }
  return undefined;
}

export function reindexOptionGroupOrders(refs: OptionGroupId[]): OptionGroupId[] {
  return refs.map((r, index) => ({
    optionGroupId: r.optionGroupId,
    order: index,
  }));
}

export function getOrderedOptionGroupRefs(item: MenuItem): OptionGroupId[] {
  const list = normalizeMenuItemOptionGroupIds(item.optionGroupIds) ?? [];
  return [...list].sort((a, b) => a.order - b.order);
}

export function mergeOptionGroupSelection(
  item: MenuItem,
  selectedIds: string[],
): OptionGroupId[] {
  const ordered = getOrderedOptionGroupRefs(item);
  const selectedSet = new Set(selectedIds);
  const kept = ordered.filter((r) => selectedSet.has(r.optionGroupId));
  const keptIds = new Set(kept.map((r) => r.optionGroupId));
  const additions = selectedIds.filter((id) => !keptIds.has(id));
  return reindexOptionGroupOrders([
    ...kept,
    ...additions.map((optionGroupId) => ({ optionGroupId, order: 0 })),
  ]);
}

export function removeOptionGroupRef(
  item: MenuItem,
  groupId: string,
): OptionGroupId[] {
  const next = getOrderedOptionGroupRefs(item).filter(
    (r) => r.optionGroupId !== groupId,
  );
  return reindexOptionGroupOrders(next);
}

export function itemReferencesOptionGroup(
  item: MenuItem,
  groupId: string,
): boolean {
  return getOrderedOptionGroupRefs(item).some(
    (r) => r.optionGroupId === groupId,
  );
}
