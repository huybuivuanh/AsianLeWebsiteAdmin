import { create } from "zustand";
import {
  collection,
  onSnapshot,
  type Unsubscribe,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { batchUpdateDocs } from "@/lib/batch-update";

interface HoursState {
  hours: StoreHour[];
  loading: boolean;
  error: string | null;
  /** Starts a live listener; returns a function that stops it. */
  listen: () => Unsubscribe;
  addHour: (days: string, time: string) => Promise<void>;
  updateHour: (id: string, days: string, time: string) => Promise<void>;
  deleteHour: (id: string) => Promise<void>;
  /** Saves this display order (the website sorts hours by `order`). */
  reorderHours: (orderedIds: string[]) => Promise<void>;
  reset: () => void;
}

export const useHoursStore = create<HoursState>((set) => ({
  hours: [],
  loading: false,
  error: null,

  reset: () => {
    set({ hours: [], loading: false, error: null });
  },

  listen: () => {
    set({ loading: true, error: null });
    return onSnapshot(
      collection(db, "hours"),
      (snapshot) => {
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
        set({ hours, loading: false, error: null });
      },
      (err) => set({ error: err.message || "Failed to fetch hours", loading: false }),
    );
  },

  addHour: async (days, time) => {
    set({ error: null });
    try {
      await addDoc(collection(db, "hours"), {
        days: days.trim(),
        time: time.trim(),
        order: Date.now(),
      });
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
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update hour";
      set({ error: message });
      throw err;
    }
  },

  reorderHours: async (orderedIds) => {
    set({ error: null });
    try {
      await batchUpdateDocs(
        "hours",
        orderedIds.map((id, index) => ({ id, data: { order: index } })),
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reorder hours";
      set({ error: message });
      throw err;
    }
  },

  deleteHour: async (id) => {
    set({ error: null });
    try {
      await deleteDoc(doc(db, "hours", id));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete hour";
      set({ error: message });
      throw err;
    }
  },
}));
