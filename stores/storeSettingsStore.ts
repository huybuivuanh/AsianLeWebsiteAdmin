import { create } from "zustand";
import { Timestamp, doc, onSnapshot, setDoc, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { INDEFINITE_PAUSE } from "@/lib/store-settings";

interface StoreSettingsState {
  settings: StoreSettings | null;
  loading: boolean;
  error: string | null;
  /** Starts a live listener; returns a function that stops it. */
  listen: () => Unsubscribe;
  updateSettings: (patch: Partial<StoreSettings>) => Promise<void>;
  reset: () => void;
}

const SETTINGS_DOC = doc(db, "settings", "store");

const defaultHours: DayHours = { isOpen: true, open: "11:00", close: "21:00" };

/** First booking 1 PM (after the lunch rush), last booking 8 PM. */
export const DEFAULT_RESERVATION_DAY: DayHours = { isOpen: true, open: "13:00", close: "20:00" };

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
  reservationHours: {
    mon: DEFAULT_RESERVATION_DAY,
    tue: DEFAULT_RESERVATION_DAY,
    wed: DEFAULT_RESERVATION_DAY,
    thu: DEFAULT_RESERVATION_DAY,
    fri: DEFAULT_RESERVATION_DAY,
    sat: { ...DEFAULT_RESERVATION_DAY, isOpen: false },
    sun: { ...DEFAULT_RESERVATION_DAY, isOpen: false },
  },
  holidays: [],
};

export const useStoreSettingsStore = create<StoreSettingsState>((set) => ({
  settings: null,
  loading: false,
  error: null,

  reset: () => {
    set({ settings: null, loading: false, error: null });
  },

  listen: () => {
    set({ loading: true, error: null });
    return onSnapshot(
      SETTINGS_DOC,
      (snapshot) => {
        if (snapshot.exists()) {
          const d = snapshot.data();
          set({
            settings: {
              ...d,
              pausedUntil:
                d.pausedUntil instanceof Timestamp ? d.pausedUntil.toDate() : null,
            } as StoreSettings,
            loading: false,
            error: null,
          });
        } else {
          set({ settings: DEFAULTS, loading: false, error: null });
        }
      },
      (err) => set({ error: err.message || "Failed to fetch store settings", loading: false }),
    );
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update settings";
      set({ error: message });
      throw err;
    }
  },
}));
