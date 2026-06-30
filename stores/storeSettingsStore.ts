import { create } from "zustand";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  pauseOrdering: false,
  timezone: "America/Edmonton",
  hours: {
    mon: defaultHours,
    tue: defaultHours,
    wed: defaultHours,
    thu: defaultHours,
    fri: defaultHours,
    sat: { ...defaultHours, isOpen: false },
    sun: { ...defaultHours, isOpen: false },
  },
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
        const d = snapshot.data() as StoreSettings;
        set({ settings: d, loading: false });
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
      await setDoc(SETTINGS_DOC, patch, { merge: true });
      await get().fetchStoreSettings();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update settings";
      set({ error: message });
      throw err;
    }
  },
}));
