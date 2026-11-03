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

interface GalleryState {
  items: ImageItem[];
  loading: boolean;
  error: string | null;
  /** Starts a live listener; returns a function that stops it. */
  listen: () => Unsubscribe;
  addGalleryItem: (name: string, imageFile: File) => Promise<void>;
  updateGalleryItem: (
    id: string,
    name: string,
    imageFile: File | null,
  ) => Promise<void>;
  deleteGalleryItem: (id: string) => Promise<void>;
  reset: () => void;
}

export const useGalleryStore = create<GalleryState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  reset: () => {
    set({ items: [], loading: false, error: null });
  },

  listen: () => {
    set({ loading: true, error: null });
    return onSnapshot(
      collection(db, "gallery"),
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
      (err) => set({ error: err.message || "Failed to fetch gallery", loading: false }),
    );
  },

  addGalleryItem: async (name, imageFile) => {
    set({ error: null });
    try {
      const url = await uploadImage("gallery", imageFile);

      await addDoc(collection(db, "gallery"), {
        name: name.trim(),
        url,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add gallery item";
      set({ error: message });
      throw err;
    }
  },

  updateGalleryItem: async (id, name, imageFile) => {
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
        url = await uploadImage("gallery", imageFile);
      }

      await updateDoc(doc(db, "gallery", id), {
        name: name.trim(),
        url,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update gallery item";
      set({ error: message });
      throw err;
    }
  },

  deleteGalleryItem: async (id) => {
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
      await deleteDoc(doc(db, "gallery", id));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete gallery item";
      set({ error: message });
      throw err;
    }
  },
}));
