import { create } from "zustand";
import {
  collection,
  getDocs,
  addDoc,
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
        return {
          id: docSnap.id,
          dayOfWeek: (d.dayOfWeek as DayOfWeek) ?? "MONDAY",
          timeRange: {
            startTime: parseTimeHHMM(startStr),
            endTime: parseTimeHHMM(endStr),
          },
          items: undefined,
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
}));

export { formatTimeToHHMM };
