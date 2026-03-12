import { create } from "zustand";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";

function deleteStorageByUrl(imageUrl: string): Promise<void> {
  const url = new URL(imageUrl);
  const pathMatch = url.pathname.match(/\/o\/(.+?)(\?|$)/);
  if (!pathMatch?.[1]) return Promise.resolve();
  const storagePath = decodeURIComponent(pathMatch[1]);
  return deleteObject(ref(storage, storagePath));
}

interface UpdatesState {
  items: ImageItem[];
  loading: boolean;
  error: string | null;
  fetchUpdates: () => Promise<void>;
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

  fetchUpdates: async () => {
    set({ loading: true, error: null });
    try {
      const snapshot = await getDocs(collection(db, "updates"));
      const items: ImageItem[] = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          name: (d.name as string) ?? "",
          url: (d.url as string) ?? "",
        };
      });
      set({ items, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch updates",
        loading: false,
      });
    }
  },

  addUpdatesItem: async (name, imageFile) => {
    set({ error: null });
    try {
      const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storageRef = ref(storage, `updates/${Date.now()}_${safeName}`);
      await uploadBytes(storageRef, imageFile);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, "updates"), {
        name: name.trim(),
        url,
      });
      await get().fetchUpdates();
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
          await deleteStorageByUrl(item.url);
        } catch {
          // Ignore; upload new image anyway
        }
        const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storageRef = ref(storage, `updates/${Date.now()}_${safeName}`);
        await uploadBytes(storageRef, imageFile);
        url = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, "updates", id), {
        name: name.trim(),
        url,
      });
      await get().fetchUpdates();
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
          await deleteStorageByUrl(item.url);
        } catch {
          // Ignore; still delete the doc
        }
      }
      await deleteDoc(doc(db, "updates", id));
      await get().fetchUpdates();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete item";
      set({ error: message });
      throw err;
    }
  },
}));
