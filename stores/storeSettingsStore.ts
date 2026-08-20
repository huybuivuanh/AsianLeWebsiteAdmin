import { create } from "zustand";
import { Timestamp, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { INDEFINITE_PAUSE } from "@/utils/storeSettingsHelpers";

interface StoreSettingsState {
  settings: StoreSettings | null;
  loading: boolean;
  error: string | null;
  fetchStoreSettings: () => Promise<void>;
  updateSettings: (patch: Partial<StoreSettings>) => Promise<void>;
  reset: () => void;
}

const SETTINGS_DOC = doc(db, "settings", "store");

const defaultHours: DayHours = { isOpen: true, open: "11:00", close: "21:00" };

const DEFAULTS: StoreSettings = {
  pausedUntil: INDEFINITE_PAUSE,
  timezone: "America/Edmonton",
  waitTime: 15,
  restaurantPhoneNumber: "",
  hours: {
    mon: defaultHours,
    tue: defaultHours,
    wed: defaultHours,
    thu: defaultHours,
    fri: defaultHours,
    sat: { ...defaultHours, isOpen: false },
    sun: { ...defaultHours, isOpen: false },
  },
  holidays: [],
};

export const useStoreSettingsStore = create<StoreSettingsState>((set, get) => ({
  settings: null,
  loading: false,
  error: null,

  reset: () => {
    set({ settings: null, loading: false, error: null });
  },

  fetchStoreSettings: async () => {
    set({ loading: true, error: null });
    try {
      const snapshot = await getDoc(SETTINGS_DOC);
      if (snapshot.exists()) {
        const d = snapshot.data();
        set({
          settings: {
            ...d,
            pausedUntil:
              d.pausedUntil instanceof Timestamp ? d.pausedUntil.toDate() : null,
          } as StoreSettings,
          loading: false,
        });
      } else {
        set({ settings: DEFAULTS, loading: false });
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch store settings",
        loading: false,
      });
    }
  },

  updateSettings: async (patch) => {
    set({ error: null });
    try {
      const firestorePatch: Record<string, unknown> = { ...patch };
      if ("pausedUntil" in patch) {
        firestorePatch.pausedUntil = patch.pausedUntil
          ? Timestamp.fromDate(patch.pausedUntil)
          : null;
      }
      await setDoc(SETTINGS_DOC, firestorePatch, { merge: true });
      await get().fetchStoreSettings();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update settings";
      set({ error: message });
      throw err;
    }
  },
}));
