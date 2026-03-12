import { create } from "zustand";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { DayOfWeek } from "@/types/enum";

function parseTimeHHMM(s: string): Date {
  const [h, m] = s.split(":").map(Number);
  return new Date(1970, 0, 1, h ?? 0, m ?? 0);
}

function formatTimeToHHMM(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

interface DailySpecialsState {
  dailySpecials: DailySpecial[];
  loading: boolean;
  error: string | null;
  fetchDailySpecials: () => Promise<void>;
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
  deleteDailySpecial: (id: string) => Promise<void>;
  updateDailySpecialItemIds: (id: string, itemIds: string[]) => Promise<void>;
  reset: () => void;
}

export const useDailySpecialsStore = create<DailySpecialsState>((set, get) => ({
  dailySpecials: [],
  loading: false,
  error: null,

  reset: () => {
    set({ dailySpecials: [], loading: false, error: null });
  },

  fetchDailySpecials: async () => {
    set({ loading: true, error: null });
    try {
      const snapshot = await getDocs(collection(db, "dailySpecials"));
      const dailySpecials: DailySpecial[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        const startStr = (d.startTime as string) ?? "00:00";
        const endStr = (d.endTime as string) ?? "23:59";
        const rawItemIds = d.itemIds;
        const itemIds: string[] = Array.isArray(rawItemIds)
          ? rawItemIds.filter((x): x is string => typeof x === "string")
          : [];
        return {
          id: docSnap.id,
          dayOfWeek: (d.dayOfWeek as DayOfWeek) ?? "MONDAY",
          timeRange: {
            startTime: parseTimeHHMM(startStr),
            endTime: parseTimeHHMM(endStr),
          },
          itemIds: itemIds.length ? itemIds : undefined,
          createdAt: d.createdAt?.toDate?.() ?? new Date(0),
        };
      });
      set({ dailySpecials, loading: false });
    } catch (err) {
      set({
        error:
          err instanceof Error ? err.message : "Failed to fetch daily specials",
        loading: false,
      });
    }
  },

  addDailySpecial: async (dayOfWeek, startTime, endTime) => {
    set({ error: null });
    try {
      await addDoc(collection(db, "dailySpecials"), {
        dayOfWeek,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        createdAt: serverTimestamp(),
      });
      await get().fetchDailySpecials();
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
      await get().fetchDailySpecials();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update daily special";
      set({ error: message });
      throw err;
    }
  },

  deleteDailySpecial: async (id) => {
    set({ error: null });
    try {
      await deleteDoc(doc(db, "dailySpecials", id));
      await get().fetchDailySpecials();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete daily special";
      set({ error: message });
      throw err;
    }
  },

  updateDailySpecialItemIds: async (id, itemIds) => {
    set({ error: null });
    try {
      await updateDoc(doc(db, "dailySpecials", id), { itemIds });
      await get().fetchDailySpecials();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update daily special items";
      set({ error: message });
      throw err;
    }
  },
}));

export { formatTimeToHHMM };
