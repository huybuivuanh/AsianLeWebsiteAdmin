import { create } from "zustand";
import {
  collection,
  onSnapshot,
  type Unsubscribe,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { deleteImageByUrl, uploadImage } from "@/lib/image-upload";

interface UpdatesState {
  items: ImageItem[];
  loading: boolean;
  error: string | null;
  /** Starts a live listener; returns a function that stops it. */
  listen: () => Unsubscribe;
  addUpdatesItem: (name: string, imageFile: File) => Promise<void>;
  updateUpdatesItem: (
    id: string,
    name: string,
    imageFile: File | null,
  ) => Promise<void>;
  deleteUpdatesItem: (id: string) => Promise<void>;
  reset: () => void;
}

export const useUpdatesStore = create<UpdatesState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  reset: () => {
    set({ items: [], loading: false, error: null });
  },

  listen: () => {
    set({ loading: true, error: null });
    return onSnapshot(
      collection(db, "updates"),
      (snapshot) => {
        const items: ImageItem[] = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            name: (d.name as string) ?? "",
            url: (d.url as string) ?? "",
          };
        });
        set({ items, loading: false, error: null });
      },
      (err) => set({ error: err.message || "Failed to fetch updates", loading: false }),
    );
  },

  addUpdatesItem: async (name, imageFile) => {
    set({ error: null });
    try {
      const url = await uploadImage("updates", imageFile);

      await addDoc(collection(db, "updates"), {
        name: name.trim(),
        url,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add update";
      set({ error: message });
      throw err;
    }
  },

  updateUpdatesItem: async (id, name, imageFile) => {
    set({ error: null });
    try {
      const item = get().items.find((i) => i.id === id);
      if (!item) return;

      let url = item.url;
      if (imageFile && imageFile.size > 0) {
        try {
          await deleteImageByUrl(item.url);
        } catch {
          // Ignore; upload new image anyway
        }
        url = await uploadImage("updates", imageFile);
      }

      await updateDoc(doc(db, "updates", id), {
        name: name.trim(),
        url,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update item";
      set({ error: message });
      throw err;
    }
  },

  deleteUpdatesItem: async (id) => {
    set({ error: null });
    try {
      const item = get().items.find((i) => i.id === id);
      if (item?.url) {
        try {
          await deleteImageByUrl(item.url);
        } catch {
          // Ignore; still delete the doc
        }
      }
      await deleteDoc(doc(db, "updates", id));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete item";
      set({ error: message });
      throw err;
    }
  },
}));
