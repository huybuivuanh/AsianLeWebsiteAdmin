import { create } from "zustand";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface DemoCategoriesState {
  categories: DemoCategory[];
  loading: boolean;
  error: string | null;
  fetchDemoCategories: () => Promise<void>;
  addDemoCategory: (name: string, description: string) => Promise<void>;
  updateDemoCategory: (
    id: string,
    name: string,
    description: string,
  ) => Promise<void>;
  deleteDemoCategory: (id: string) => Promise<void>;
  updateDemoCategoryItemIds: (id: string, itemIds: string[]) => Promise<void>;
  reorderDemoCategories: (orderedIds: string[]) => Promise<void>;
  /** Clear cache on logout */
  reset: () => void;
}

export const useDemoCategoriesStore = create<DemoCategoriesState>((set, get) => ({
  categories: [],
  loading: false,
  error: null,

  reset: () => {
    set({ categories: [], loading: false, error: null });
  },

  fetchDemoCategories: async () => {
    set({ loading: true, error: null });
    try {
      const snapshot = await getDocs(collection(db, "demoCategories"));
      const categories: DemoCategory[] = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          name: (d.name as string) ?? "",
          description: d.description as string | undefined,
          itemIds: d.itemIds as string[] | undefined,
          order: (d.order as number) ?? 0,
          createdAt: d.createdAt?.toDate?.() ?? undefined,
        };
      });
      categories.sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name),
      );
      set({ categories, loading: false });
    } catch (err) {
      set({
        error:
          err instanceof Error ? err.message : "Failed to fetch demo categories",
        loading: false,
      });
    }
  },

  addDemoCategory: async (name: string, description: string) => {
    set({ error: null });
    try {
      await addDoc(collection(db, "demoCategories"), {
        name: name.trim(),
        description: (description ?? "").trim(),
        order: Date.now(),
        createdAt: serverTimestamp(),
      });
      await get().fetchDemoCategories();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add demo category";
      set({ error: message });
      throw err;
    }
  },

  updateDemoCategory: async (id, name, description) => {
    set({ error: null });
    try {
      await updateDoc(doc(db, "demoCategories", id), {
        name: name.trim(),
        description: (description ?? "").trim(),
      });
      await get().fetchDemoCategories();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update demo category";
      set({ error: message });
      throw err;
    }
  },

  deleteDemoCategory: async (id) => {
    set({ error: null });
    try {
      await deleteDoc(doc(db, "demoCategories", id));
      await get().fetchDemoCategories();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete demo category";
      set({ error: message });
      throw err;
    }
  },

  updateDemoCategoryItemIds: async (id, itemIds) => {
    set({ error: null });
    try {
      await updateDoc(doc(db, "demoCategories", id), { itemIds });
      await get().fetchDemoCategories();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update demo category items";
      set({ error: message });
      throw err;
    }
  },

  reorderDemoCategories: async (orderedIds) => {
    set({ error: null });
    try {
      const batch = writeBatch(db);
      orderedIds.forEach((id, index) => {
        const ref = doc(db, "demoCategories", id);
        batch.update(ref, { order: index });
      });
      await batch.commit();
      await get().fetchDemoCategories();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reorder demo categories";
      set({ error: message });
      throw err;
    }
  },
}));
