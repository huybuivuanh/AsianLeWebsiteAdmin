/**
 * The one place that lists every data store. AuthContext calls `listenToAllStores`
 * after login / session restore and stops the listeners + `resetAllStores` on logout.
 * Register new stores here.
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

type DataStore = {
  getState: () => { listen: () => () => void; reset: () => void };
};

const stores: DataStore[] = [
  useCategoriesStore,
  useMenuItemsStore,
  useGalleryStore,
  useUpdatesStore,
  useDailySpecialsStore,
  useSpecialItemsStore,
  useOptionGroupsStore,
  useOptionsStore,
  useStoreSettingsStore,
  useHoursStore,
];

/**
 * Starts a live Firestore listener for every store, so each one stays in sync with
 * the database (including changes made by other staff or the website).
 * Returns a function that stops them all.
 */
export function listenToAllStores(): () => void {
  const stops = stores.map((store) => store.getState().listen());
  return () => {
    for (const stop of stops) stop();
  };
}

/** Clears every store's cached data (on logout). */
export function resetAllStores() {
  for (const store of stores) store.getState().reset();
}
