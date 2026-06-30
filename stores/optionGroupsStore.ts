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

interface OptionGroupsState {
  optionGroups: OptionGroup[];
  loading: boolean;
  error: string | null;
  fetchOptionGroups: () => Promise<void>;
  addOptionGroup: (data: Omit<OptionGroup, "id" | "createdAt">) => Promise<string>;
  updateOptionGroup: (id: string, data: Partial<Omit<OptionGroup, "id" | "createdAt">>) => Promise<void>;
  deleteOptionGroup: (id: string) => Promise<void>;
  reset: () => void;
}

export const useOptionGroupsStore = create<OptionGroupsState>((set, get) => ({
  optionGroups: [],
  loading: false,
  error: null,

  reset: () => {
    set({ optionGroups: [], loading: false, error: null });
  },

  fetchOptionGroups: async () => {
    set({ loading: true, error: null });
    try {
      const snapshot = await getDocs(collection(db, "optionGroups"));
      const optionGroups: OptionGroup[] = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          name: (d.name as string) ?? "",
          minSelection: (d.minSelection as number) ?? 0,
          maxSelection: (d.maxSelection as number) ?? 1,
          multipleOptionQuantity: (d.multipleOptionQuantity as boolean) ?? false,
          optionIds: d.optionIds as string[] | undefined,
          itemIds: d.itemIds as string[] | undefined,
          defaultOptionId: d.defaultOptionId as string | undefined,
          createdAt: d.createdAt?.toDate?.() ?? new Date(),
        };
      });
      set({ optionGroups, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch option groups",
        loading: false,
      });
    }
  },

  addOptionGroup: async (data) => {
    set({ error: null });
    try {
      const ref = await addDoc(collection(db, "optionGroups"), {
        ...data,
        createdAt: serverTimestamp(),
      });
      await get().fetchOptionGroups();
      return ref.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add option group";
      set({ error: message });
      throw err;
    }
  },

  updateOptionGroup: async (id, data) => {
    set({ error: null });
    try {
      await updateDoc(doc(db, "optionGroups", id), data);
      await get().fetchOptionGroups();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update option group";
      set({ error: message });
      throw err;
    }
  },

  deleteOptionGroup: async (id) => {
    set({ error: null });
    try {
      await deleteDoc(doc(db, "optionGroups", id));
      await get().fetchOptionGroups();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete option group";
      set({ error: message });
      throw err;
    }
  },
}));
