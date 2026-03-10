import { create } from "zustand";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

export type AddMenuItemInput = {
  name: string;
  description: string;
  price: number;
  imageFile: File | null;
};

interface MenuItemsState {
  menuItems: MenuItem[];
  loading: boolean;
  error: string | null;
  fetchMenuItems: () => Promise<void>;
  addMenuItem: (input: AddMenuItemInput) => Promise<void>;
  /** Clear cache on logout */
  reset: () => void;
}

export const useMenuItemsStore = create<MenuItemsState>((set, get) => ({
  menuItems: [],
  loading: false,
  error: null,

  reset: () => {
    set({ menuItems: [], loading: false, error: null });
  },

  fetchMenuItems: async () => {
    set({ loading: true, error: null });
    try {
      const snapshot = await getDocs(collection(db, "menuItems"));
      const menuItems: MenuItem[] = snapshot.docs.map((doc) => {
        const d = doc.data();
        const rawPrice = d.price;
        const price =
          typeof rawPrice === "number" && Number.isFinite(rawPrice)
            ? rawPrice
            : 0;
        return {
          id: doc.id,
          name: (d.name as string) ?? "",
          description: d.description as string | undefined,
          price,
          image: d.image as string | undefined,
          categoryIds: d.categoryIds as string[] | undefined,
          createdAt: d.createdAt?.toDate?.() ?? undefined,
        };
      });
      set({ menuItems, loading: false });
    } catch (err) {
      set({
        error:
          err instanceof Error ? err.message : "Failed to fetch menu items",
        loading: false,
      });
    }
  },

  addMenuItem: async ({ name, description, price, imageFile }) => {
    set({ error: null });
    try {
      let imageUrl: string | undefined;
      if (imageFile && imageFile.size > 0) {
        const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storageRef = ref(storage, `menuItems/${Date.now()}_${safeName}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const payload: Record<string, unknown> = {
        name: name.trim(),
        description: (description ?? "").trim(),
        price: Number.isFinite(price) ? price : 0,
        createdAt: serverTimestamp(),
      };
      if (imageUrl) payload.image = imageUrl;

      await addDoc(collection(db, "menuItems"), payload);
      await get().fetchMenuItems();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add menu item";
      set({ error: message });
      throw err;
    }
  },
}));
