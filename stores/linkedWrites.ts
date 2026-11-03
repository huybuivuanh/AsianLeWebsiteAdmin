/**
 * Changes that touch two collections at once, e.g. a category and the menu items that
 * point back to it. Each one is a single Firestore batch, so it either fully succeeds or
 * changes nothing; the two sides can't end up disagreeing. The stores' live listeners
 * pick up the result, so nothing needs re-fetching.
 *
 * Use these instead of calling two store actions one after another.
 */
import { doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { deleteImageByUrl } from "@/lib/image-upload";
import {
  itemReferencesOptionGroup,
  removeOptionGroupRef,
} from "@/lib/menu-item-option-groups";
import {
  patchClearDefaultIfNotInOptionIds,
  patchClearDefaultIfOptionRemoved,
} from "@/lib/option-group-updates";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { useMenuItemsStore } from "@/stores/menuItemsStore";
import { useOptionGroupsStore } from "@/stores/optionGroupsStore";
import { useOptionsStore } from "@/stores/optionsStore";
import { useDailySpecialsStore } from "@/stores/dailySpecialsStore";
import { useSpecialItemsStore } from "@/stores/dailySpecialItemsStore";

type Write =
  | { kind: "update"; collection: string; id: string; data: Record<string, unknown> }
  | { kind: "delete"; collection: string; id: string };

/** Firestore allows at most 500 writes per batch. */
const MAX_BATCH_WRITES = 500;

async function commit(writes: Write[]) {
  if (writes.length > MAX_BATCH_WRITES) {
    // Far beyond what this restaurant's data can produce; refuse rather than split
    // into several batches and lose the all-or-nothing guarantee.
    throw new Error(`Too many changes at once (${writes.length}).`);
  }
  if (writes.length === 0) return;
  const batch = writeBatch(db);
  for (const w of writes) {
    const ref = doc(db, w.collection, w.id);
    if (w.kind === "update") batch.update(ref, w.data);
    else batch.delete(ref);
  }
  await batch.commit();
}

function without(list: string[] | undefined, id: string): string[] {
  return (list ?? []).filter((x) => x !== id);
}

function withAdded(list: string[] | undefined, id: string): string[] {
  return [...new Set([...(list ?? []), id])];
}

/**
 * Builds updates for every doc whose membership in `ownerId` changed: docs in `added`
 * gain `ownerId` in their `field` list, docs in `removed` lose it.
 */
function membershipUpdates<T extends { id: string }>(
  collection: string,
  docs: T[],
  field: keyof T & string,
  ownerId: string,
  previousIds: string[],
  nextIds: string[],
): Write[] {
  const added = new Set(nextIds.filter((id) => !previousIds.includes(id)));
  const removed = new Set(previousIds.filter((id) => !nextIds.includes(id)));
  return docs
    .filter((d) => added.has(d.id) || removed.has(d.id))
    .map((d) => {
      const current = d[field] as string[] | undefined;
      return {
        kind: "update" as const,
        collection,
        id: d.id,
        data: { [field]: added.has(d.id) ? withAdded(current, ownerId) : without(current, ownerId) },
      };
    });
}

// ---------- Categories ↔ menu items ----------

const categories = () => useCategoriesStore.getState();
const menuItems = () => useMenuItemsStore.getState();

/** Sets which items are in a category, and updates each item's `categoryIds` to match. */
export async function setCategoryItems(categoryId: string, itemIds: string[]) {
  const category = categories().categories.find((c) => c.id === categoryId);
  await commit(
    [
      { kind: "update", collection: "categories", id: categoryId, data: { itemIds } },
      ...membershipUpdates(
        "menuItems",
        menuItems().items,
        "categoryIds",
        categoryId,
        category?.itemIds ?? [],
        itemIds,
      ),
    ],
  );
}

export async function removeItemFromCategory(categoryId: string, itemId: string) {
  const category = categories().categories.find((c) => c.id === categoryId);
  await setCategoryItems(categoryId, without(category?.itemIds, itemId));
}

/** Deletes a category and removes it from every item that was in it. */
export async function deleteCategory(categoryId: string) {
  await commit(
    [
      { kind: "delete", collection: "categories", id: categoryId },
      ...menuItems()
        .items.filter((item) => item.categoryIds?.includes(categoryId))
        .map((item) => ({
          kind: "update" as const,
          collection: "menuItems",
          id: item.id,
          data: { categoryIds: without(item.categoryIds, categoryId) },
        })),
    ],
  );
}

// ---------- Menu items ↔ option groups ----------

const optionGroups = () => useOptionGroupsStore.getState();
const options = () => useOptionsStore.getState();

/**
 * Sets a menu item's option groups (and their order), and updates each group's
 * `itemIds` to match.
 */
export async function setMenuItemOptionGroups(itemId: string, optionGroupIds: OptionGroupId[]) {
  const selected = new Set(optionGroupIds.map((r) => r.optionGroupId));
  await commit(
    [
      { kind: "update", collection: "menuItems", id: itemId, data: { optionGroupIds } },
      // Checked against every group's own list (not the item's old one), so any
      // group that had drifted out of sync is corrected too.
      ...optionGroups()
        .optionGroups.filter((g) => selected.has(g.id) !== (g.itemIds ?? []).includes(itemId))
        .map((g) => ({
          kind: "update" as const,
          collection: "optionGroups",
          id: g.id,
          data: {
            itemIds: selected.has(g.id) ? withAdded(g.itemIds, itemId) : without(g.itemIds, itemId),
          },
        })),
    ],
  );
}

export async function removeOptionGroupFromItem(itemId: string, groupId: string) {
  const item = menuItems().items.find((m) => m.id === itemId);
  if (!item) return;
  await setMenuItemOptionGroups(itemId, removeOptionGroupRef(item, groupId));
}

/**
 * Deletes a menu item and removes it from its categories and option groups.
 * Its image is deleted from Storage afterwards (best effort).
 */
export async function deleteMenuItem(itemId: string) {
  const item = menuItems().items.find((m) => m.id === itemId);
  await commit(
    [
      { kind: "delete", collection: "menuItems", id: itemId },
      ...categories()
        .categories.filter((c) => c.itemIds?.includes(itemId))
        .map((c) => ({
          kind: "update" as const,
          collection: "categories",
          id: c.id,
          data: { itemIds: without(c.itemIds, itemId) },
        })),
      ...optionGroups()
        .optionGroups.filter((g) => g.itemIds?.includes(itemId))
        .map((g) => ({
          kind: "update" as const,
          collection: "optionGroups",
          id: g.id,
          data: { itemIds: without(g.itemIds, itemId) },
        })),
    ],
  );
  if (item?.image) {
    try {
      await deleteImageByUrl(item.image.url);
    } catch {
      // The item is already gone; a leftover image file is harmless.
    }
  }
}

// ---------- Option groups ↔ options ----------

/**
 * Sets which options are in a group (clearing the default if it was removed), and
 * updates each option's `groupIds` to match.
 */
export async function setOptionGroupOptions(groupId: string, optionIds: string[]) {
  const group = optionGroups().optionGroups.find((g) => g.id === groupId);
  await commit(
    [
      {
        kind: "update",
        collection: "optionGroups",
        id: groupId,
        data: {
          optionIds,
          ...(group ? patchClearDefaultIfNotInOptionIds(group, optionIds) : {}),
        },
      },
      ...membershipUpdates(
        "options",
        options().options,
        "groupIds",
        groupId,
        group?.optionIds ?? [],
        optionIds,
      ),
    ],
  );
}

export async function removeOptionFromGroup(groupId: string, optionId: string) {
  const group = optionGroups().optionGroups.find((g) => g.id === groupId);
  await setOptionGroupOptions(groupId, without(group?.optionIds, optionId));
}

/** Deletes an option group and removes it from every menu item and option that used it. */
export async function deleteOptionGroup(groupId: string) {
  await commit(
    [
      { kind: "delete", collection: "optionGroups", id: groupId },
      ...menuItems()
        .items.filter((item) => itemReferencesOptionGroup(item, groupId))
        .map((item) => ({
          kind: "update" as const,
          collection: "menuItems",
          id: item.id,
          data: { optionGroupIds: removeOptionGroupRef(item, groupId) },
        })),
      ...options()
        .options.filter((o) => o.groupIds?.includes(groupId))
        .map((o) => ({
          kind: "update" as const,
          collection: "options",
          id: o.id,
          data: { groupIds: without(o.groupIds, groupId) },
        })),
    ],
  );
}

/** Deletes an option and removes it from every group (clearing it as default where set). */
export async function deleteOption(optionId: string) {
  await commit(
    [
      { kind: "delete", collection: "options", id: optionId },
      ...optionGroups()
        .optionGroups.filter((g) => g.optionIds?.includes(optionId))
        .map((g) => ({
          kind: "update" as const,
          collection: "optionGroups",
          id: g.id,
          data: {
            optionIds: without(g.optionIds, optionId),
            ...patchClearDefaultIfOptionRemoved(g, optionId),
          },
        })),
    ],
  );
}

// ---------- Daily specials ↔ special items ----------

const dailySpecials = () => useDailySpecialsStore.getState();
const specialItems = () => useSpecialItemsStore.getState();

/** Sets which items are on a day special, and updates each item's `dayOfWeekIds` to match. */
export async function setDailySpecialItems(daySpecialId: string, itemIds: string[]) {
  const daySpecial = dailySpecials().dailySpecials.find((s) => s.id === daySpecialId);
  await commit(
    [
      { kind: "update", collection: "dailySpecials", id: daySpecialId, data: { itemIds } },
      ...membershipUpdates(
        "dailySpecialItems",
        specialItems().items,
        "dayOfWeekIds",
        daySpecialId,
        daySpecial?.itemIds ?? [],
        itemIds,
      ),
    ],
  );
}

export async function removeItemFromDailySpecial(daySpecialId: string, itemId: string) {
  const daySpecial = dailySpecials().dailySpecials.find((s) => s.id === daySpecialId);
  await setDailySpecialItems(daySpecialId, without(daySpecial?.itemIds, itemId));
}

/** Deletes a day special and removes it from every special item that was on it. */
export async function deleteDailySpecial(daySpecialId: string) {
  await commit(
    [
      { kind: "delete", collection: "dailySpecials", id: daySpecialId },
      ...specialItems()
        .items.filter((item) => item.dayOfWeekIds?.includes(daySpecialId))
        .map((item) => ({
          kind: "update" as const,
          collection: "dailySpecialItems",
          id: item.id,
          data: { dayOfWeekIds: without(item.dayOfWeekIds, daySpecialId) },
        })),
    ],
  );
}

/** Deletes a special item and removes it from every day special that listed it. */
export async function deleteSpecialItem(itemId: string) {
  await commit(
    [
      { kind: "delete", collection: "dailySpecialItems", id: itemId },
      ...dailySpecials()
        .dailySpecials.filter((s) => s.itemIds?.includes(itemId))
        .map((s) => ({
          kind: "update" as const,
          collection: "dailySpecials",
          id: s.id,
          data: { itemIds: without(s.itemIds, itemId) },
        })),
    ],
  );
}
