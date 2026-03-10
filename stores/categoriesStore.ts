import { create } from "zustand";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CategoriesState {
  categories: FoodCategory[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  addCategory: (name: string, description: string) => Promise<void>;
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  loading: false,
  error: null,

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
}));
