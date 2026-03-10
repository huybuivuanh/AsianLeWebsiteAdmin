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

interface CategoriesState {
  categories: FoodCategory[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  addCategory: (name: string, description: string) => Promise<void>;
  updateCategory: (id: string, name: string, description: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  updateCategoryItemIds: (id: string, itemIds: string[]) => Promise<void>;
  /** Clear cache on logout */
  reset: () => void;
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  loading: false,
  error: null,

  reset: () => {
    set({ categories: [], loading: false, error: null });
  },

  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const snapshot = await getDocs(collection(db, "categories"));
      const categories: FoodCategory[] = snapshot.docs.map((doc) => {
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
      set({ categories, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch categories",
        loading: false,
      });
    }
  },

  addCategory: async (name: string, description: string) => {
    set({ error: null });
    try {
      await addDoc(collection(db, "categories"), {
        name: name.trim(),
        description: (description ?? "").trim(),
        order: Date.now(),
        createdAt: serverTimestamp(),
      });
      await get().fetchCategories();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add category";
      set({ error: message });
      throw err;
    }
  },

  updateCategory: async (id, name, description) => {
    set({ error: null });
    try {
      await updateDoc(doc(db, "categories", id), {
        name: name.trim(),
        description: (description ?? "").trim(),
      });
      await get().fetchCategories();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update category";
      set({ error: message });
      throw err;
    }
  },

  deleteCategory: async (id) => {
    set({ error: null });
    try {
      await deleteDoc(doc(db, "categories", id));
      await get().fetchCategories();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete category";
      set({ error: message });
      throw err;
    }
  },

  updateCategoryItemIds: async (id, itemIds) => {
    set({ error: null });
    try {
      await updateDoc(doc(db, "categories", id), { itemIds });
      await get().fetchCategories();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update category items";
      set({ error: message });
      throw err;
    }
  },
}));
