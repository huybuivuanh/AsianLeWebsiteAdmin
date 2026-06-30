import { create } from "zustand";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface HoursState {
  hours: StoreHour[];
  loading: boolean;
  error: string | null;
  fetchHours: () => Promise<void>;
  addHour: (days: string, time: string) => Promise<void>;
  updateHour: (id: string, days: string, time: string) => Promise<void>;
  deleteHour: (id: string) => Promise<void>;
  reset: () => void;
}

export const useHoursStore = create<HoursState>((set, get) => ({
  hours: [],
  loading: false,
  error: null,

  reset: () => {
    set({ hours: [], loading: false, error: null });
  },

  fetchHours: async () => {
    set({ loading: true, error: null });
    try {
      const snapshot = await getDocs(collection(db, "hours"));
      const hours: StoreHour[] = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          days: (d.days as string) ?? "",
          time: (d.time as string) ?? "",
          order: (d.order as number) ?? 0,
        };
      });
      hours.sort((a, b) => a.order - b.order);
      set({ hours, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch hours",
        loading: false,
      });
    }
  },

  addHour: async (days, time) => {
    set({ error: null });
    try {
      await addDoc(collection(db, "hours"), {
        days: days.trim(),
        time: time.trim(),
        order: Date.now(),
      });
      await get().fetchHours();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add hour";
      set({ error: message });
      throw err;
    }
  },

  updateHour: async (id, days, time) => {
    set({ error: null });
    try {
      await updateDoc(doc(db, "hours", id), {
        days: days.trim(),
        time: time.trim(),
      });
      await get().fetchHours();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update hour";
      set({ error: message });
      throw err;
    }
  },

  deleteHour: async (id) => {
    set({ error: null });
    try {
      await deleteDoc(doc(db, "hours", id));
      await get().fetchHours();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete hour";
      set({ error: message });
      throw err;
    }
  },
}));
