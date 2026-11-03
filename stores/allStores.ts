/**
 * The one place that lists every data store. AuthContext calls `loadAllStores` after
 * login / session restore and `resetAllStores` on logout. Register new stores here.
 */
import { useCategoriesStore } from "@/stores/categoriesStore";
import { useMenuItemsStore } from "@/stores/menuItemsStore";
import { useGalleryStore } from "@/stores/galleryStore";
import { useUpdatesStore } from "@/stores/updatesStore";
import { useDailySpecialsStore } from "@/stores/dailySpecialsStore";
import { useSpecialItemsStore } from "@/stores/dailySpecialItemsStore";
import { useOptionGroupsStore } from "@/stores/optionGroupsStore";
import { useOptionsStore } from "@/stores/optionsStore";
import { useStoreSettingsStore } from "@/stores/storeSettingsStore";
import { useHoursStore } from "@/stores/hoursStore";

const stores = [
  { store: useCategoriesStore, load: () => useCategoriesStore.getState().fetchCategories() },
  { store: useMenuItemsStore, load: () => useMenuItemsStore.getState().fetchMenuItems() },
  { store: useGalleryStore, load: () => useGalleryStore.getState().fetchGallery() },
  { store: useUpdatesStore, load: () => useUpdatesStore.getState().fetchUpdates() },
  { store: useDailySpecialsStore, load: () => useDailySpecialsStore.getState().fetchDailySpecials() },
  { store: useSpecialItemsStore, load: () => useSpecialItemsStore.getState().fetchSpecialItems() },
  { store: useOptionGroupsStore, load: () => useOptionGroupsStore.getState().fetchOptionGroups() },
  { store: useOptionsStore, load: () => useOptionsStore.getState().fetchOptions() },
  { store: useStoreSettingsStore, load: () => useStoreSettingsStore.getState().fetchStoreSettings() },
  { store: useHoursStore, load: () => useHoursStore.getState().fetchHours() },
];

/** Starts every store's fetch; each store tracks its own loading/error state. */
export function loadAllStores() {
  for (const { load } of stores) void load();
}

/** Clears every store's cached data (on logout). */
export function resetAllStores() {
  for (const { store } of stores) store.getState().reset();
}
