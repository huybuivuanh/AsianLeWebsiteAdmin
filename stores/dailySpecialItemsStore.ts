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

interface SpecialItemsState {
  items: DailySpecialItem[];
  loading: boolean;
  error: string | null;
  fetchSpecialItems: () => Promise<void>;
  addSpecialItem: (
    name: string,
    price: number,
    options?: string[],
  ) => Promise<void>;
  updateSpecialItem: (
    id: string,
    name: string,
    price: number,
    options?: string[],
  ) => Promise<void>;
  deleteSpecialItem: (id: string) => Promise<void>;
  reset: () => void;
}

export const useSpecialItemsStore = create<SpecialItemsState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  reset: () => {
    set({ items: [], loading: false, error: null });
  },

  fetchSpecialItems: async () => {
    set({ loading: true, error: null });
    try {
      const snapshot = await getDocs(collection(db, "specialItems"));
      const items: DailySpecialItem[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        const rawPrice = d.price;
        const price =
          typeof rawPrice === "number" && Number.isFinite(rawPrice)
            ? rawPrice
            : 0;
        const rawOptions = d.options;
        const options: string[] = Array.isArray(rawOptions)
          ? rawOptions.filter((o): o is string => typeof o === "string")
          : [];
        return {
          id: docSnap.id,
          name: (d.name as string) ?? "",
          price,
          options: options.length ? options : undefined,
          dayOfWeekIds: (d.dayOfWeekIds as string[] | undefined) ?? undefined,
          createdAt: d.createdAt?.toDate?.() ?? new Date(0),
        };
      });
      set({ items, loading: false });
    } catch (err) {
      set({
        error:
          err instanceof Error ? err.message : "Failed to fetch special items",
        loading: false,
      });
    }
  },

  addSpecialItem: async (name, price, options) => {
    set({ error: null });
    try {
      const optionsList = Array.isArray(options)
        ? options.map((o) => String(o).trim()).filter(Boolean)
        : [];
      await addDoc(collection(db, "specialItems"), {
        name: name.trim(),
        price: Number.isFinite(price) ? price : 0,
        options: optionsList,
        createdAt: serverTimestamp(),
      });
      await get().fetchSpecialItems();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add special item";
      set({ error: message });
      throw err;
    }
  },

  updateSpecialItem: async (id, name, price, options) => {
    set({ error: null });
    try {
      const optionsList = Array.isArray(options)
        ? options.map((o) => String(o).trim()).filter(Boolean)
        : [];
      await updateDoc(doc(db, "specialItems", id), {
        name: name.trim(),
        price: Number.isFinite(price) ? price : 0,
        options: optionsList,
      });
      await get().fetchSpecialItems();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update special item";
      set({ error: message });
      throw err;
    }
  },

  deleteSpecialItem: async (id) => {
    set({ error: null });
    try {
      await deleteDoc(doc(db, "specialItems", id));
      await get().fetchSpecialItems();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete special item";
      set({ error: message });
      throw err;
    }
  },
}));
