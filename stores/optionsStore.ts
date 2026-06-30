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

interface OptionsState {
  options: ItemOption[];
  loading: boolean;
  error: string | null;
  fetchOptions: () => Promise<void>;
  addOption: (data: Omit<ItemOption, "id" | "createdAt">) => Promise<string>;
  updateOption: (id: string, data: Partial<Omit<ItemOption, "id" | "createdAt">>) => Promise<void>;
  deleteOption: (id: string) => Promise<void>;
  reset: () => void;
}

export const useOptionsStore = create<OptionsState>((set, get) => ({
  options: [],
  loading: false,
  error: null,

  reset: () => {
    set({ options: [], loading: false, error: null });
  },

  fetchOptions: async () => {
    set({ loading: true, error: null });
    try {
      const snapshot = await getDocs(collection(db, "options"));
      const options: ItemOption[] = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          name: (d.name as string) ?? "",
          price: (d.price as number) ?? 0,
          groupIds: d.groupIds as string[] | undefined,
          createdAt: d.createdAt?.toDate?.() ?? new Date(),
        };
      });
      set({ options, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch options",
        loading: false,
      });
    }
  },

  addOption: async (data) => {
    set({ error: null });
    try {
      const ref = await addDoc(collection(db, "options"), {
        ...data,
        createdAt: serverTimestamp(),
      });
      await get().fetchOptions();
      return ref.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add option";
      set({ error: message });
      throw err;
    }
  },

  updateOption: async (id, data) => {
    set({ error: null });
    try {
      await updateDoc(doc(db, "options", id), data);
      await get().fetchOptions();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update option";
      set({ error: message });
      throw err;
    }
  },

  deleteOption: async (id) => {
    set({ error: null });
    try {
      await deleteDoc(doc(db, "options", id));
      await get().fetchOptions();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete option";
      set({ error: message });
      throw err;
    }
  },
}));
