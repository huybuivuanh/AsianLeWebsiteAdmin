import { create } from "zustand";
import {
  Timestamp,
  collection,
  onSnapshot,
  type Unsubscribe,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface OptionsState {
  options: ItemOption[];
  loading: boolean;
  error: string | null;
  /** Starts a live listener; returns a function that stops it. */
  listen: () => Unsubscribe;
  addOption: (data: Omit<ItemOption, "id" | "createdAt">) => Promise<string>;
  updateOption: (id: string, data: Record<string, unknown>) => Promise<void>;
  reset: () => void;
}

export const useOptionsStore = create<OptionsState>((set) => ({
  options: [],
  loading: false,
  error: null,

  reset: () => {
    set({ options: [], loading: false, error: null });
  },

  listen: () => {
    set({ loading: true, error: null });
    return onSnapshot(
      collection(db, "options"),
      (snapshot) => {
        const options: ItemOption[] = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            name: (d.name as string) ?? "",
            price: (d.price as number) ?? 0,
            groupIds: d.groupIds as string[] | undefined,
            availability: d.availability as ItemOption["availability"] | undefined,
            soldOutUntil: d.soldOutUntil instanceof Timestamp ? d.soldOutUntil.toDate() : undefined,
            createdAt: d.createdAt?.toDate?.() ?? new Date(),
          };
        });
        options.sort((a, b) => a.name.localeCompare(b.name));
        set({ options, loading: false, error: null });
      },
      (err) => set({ error: err.message || "Failed to fetch options", loading: false }),
    );
  },

  addOption: async (data) => {
    set({ error: null });
    try {
      const ref = await addDoc(collection(db, "options"), {
        ...data,
        createdAt: serverTimestamp(),
      });
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update option";
      set({ error: message });
      throw err;
    }
  },

}));
