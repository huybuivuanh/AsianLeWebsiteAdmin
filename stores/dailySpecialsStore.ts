import { create } from "zustand";
import {
  collection,
  onSnapshot,
  type Unsubscribe,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { DayOfWeek } from "@/types/enum";

interface DailySpecialsState {
  dailySpecials: DailySpecial[];
  loading: boolean;
  error: string | null;
  /** Starts a live listener; returns a function that stops it. */
  listen: () => Unsubscribe;
  addDailySpecial: (
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
  ) => Promise<void>;
  updateDailySpecial: (
    id: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
  ) => Promise<void>;
  reset: () => void;
}

export const useDailySpecialsStore = create<DailySpecialsState>((set) => ({
  dailySpecials: [],
  loading: false,
  error: null,

  reset: () => {
    set({ dailySpecials: [], loading: false, error: null });
  },

  listen: () => {
    set({ loading: true, error: null });
    return onSnapshot(
      collection(db, "dailySpecials"),
      (snapshot) => {
        const dailySpecials: DailySpecial[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          const startStr = d.timeRange?.startTime ?? "00:00";
          const endStr = d.timeRange?.endTime ?? "23:59";
          const rawItemIds = d.itemIds;
          const itemIds: string[] = Array.isArray(rawItemIds)
            ? rawItemIds.filter((x): x is string => typeof x === "string")
            : [];
          return {
            id: docSnap.id,
            dayOfWeek: (d.dayOfWeek as DayOfWeek) ?? "MONDAY",
            timeRange: {
              startTime: startStr,
              endTime: endStr,
            },
            itemIds: itemIds.length ? itemIds : undefined,
            createdAt: d.createdAt?.toDate?.() ?? new Date(0),
          };
        });
        set({ dailySpecials, loading: false, error: null });
      },
      (err) => set({ error: err.message || "Failed to fetch daily specials", loading: false }),
    );
  },

  addDailySpecial: async (dayOfWeek, startTime, endTime) => {
    set({ error: null });
    try {
      await addDoc(collection(db, "dailySpecials"), {
        dayOfWeek,
        timeRange: { startTime: startTime.trim(), endTime: endTime.trim() },
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add daily special";
      set({ error: message });
      throw err;
    }
  },

  updateDailySpecial: async (id, dayOfWeek, startTime, endTime) => {
    set({ error: null });
    try {
      await updateDoc(doc(db, "dailySpecials", id), {
        dayOfWeek,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update daily special";
      set({ error: message });
      throw err;
    }
  },

}));
