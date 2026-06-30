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
import { KitchenType } from "@/types/enum";

interface DemoMenuItemsState {
  items: DemoMenuItem[];
  loading: boolean;
  error: string | null;
  fetchDemoMenuItems: () => Promise<void>;
  addDemoMenuItem: (data: Omit<DemoMenuItem, "id" | "createdAt">) => Promise<void>;
  updateDemoMenuItem: (id: string, data: Partial<Omit<DemoMenuItem, "id" | "createdAt">>) => Promise<void>;
  deleteDemoMenuItem: (id: string) => Promise<void>;
  reset: () => void;
}

export const useDemoMenuItemsStore = create<DemoMenuItemsState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  reset: () => {
    set({ items: [], loading: false, error: null });
  },

  fetchDemoMenuItems: async () => {
    set({ loading: true, error: null });
    try {
      const snapshot = await getDocs(collection(db, "demoMenuItems"));
      const items: DemoMenuItem[] = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          name: (d.name as string) ?? "",
          description: d.description as string | undefined,
          price: (d.price as number) ?? 0,
          image: d.image as DemoMenuItem["image"] | undefined,
          optionGroupIds: d.optionGroupIds as DemoMenuItem["optionGroupIds"] | undefined,
          categoryIds: d.categoryIds as string[] | undefined,
          kitchenType: (d.kitchenType as KitchenType) ?? KitchenType.Other,
          availability: (d.availability as DemoMenuItem["availability"]) ?? { enabled: true },
          isSoldOut: (d.isSoldOut as boolean) ?? false,
          createdAt: d.createdAt?.toDate?.() ?? new Date(),
        };
      });
      set({ items, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch demo menu items",
        loading: false,
      });
    }
  },

  addDemoMenuItem: async (data) => {
    set({ error: null });
    try {
      await addDoc(collection(db, "demoMenuItems"), {
        ...data,
        createdAt: serverTimestamp(),
      });
      await get().fetchDemoMenuItems();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add demo menu item";
      set({ error: message });
      throw err;
    }
  },

  updateDemoMenuItem: async (id, data) => {
    set({ error: null });
    try {
      await updateDoc(doc(db, "demoMenuItems", id), data);
      await get().fetchDemoMenuItems();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update demo menu item";
      set({ error: message });
      throw err;
    }
  },

  deleteDemoMenuItem: async (id) => {
    set({ error: null });
    try {
      await deleteDoc(doc(db, "demoMenuItems", id));
      await get().fetchDemoMenuItems();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete demo menu item";
      set({ error: message });
      throw err;
    }
  },
}));
