import { create } from "zustand";
import {
  Timestamp,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  deleteField,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { KitchenType } from "@/types/enum";

export type MenuItemInput = {
  name: string;
  description?: string;
  price: number;
  imageFile: File | null;
  kitchenType: KitchenType;
  availability?: Availability;
  categoryIds?: string[];
  removeImage?: boolean;
};

function deleteStorageImageByUrl(imageUrl: string): Promise<void> {
  const url = new URL(imageUrl);
  const pathMatch = url.pathname.match(/\/o\/(.+?)(\?|$)/);
  if (!pathMatch?.[1]) return Promise.resolve();
  const storagePath = decodeURIComponent(pathMatch[1]);
  return deleteObject(ref(storage, storagePath));
}

interface MenuItemsState {
  items: MenuItem[];
  loading: boolean;
  error: string | null;
  fetchMenuItems: () => Promise<void>;
  addMenuItem: (input: MenuItemInput) => Promise<void>;
  updateMenuItem: (id: string, input: MenuItemInput) => Promise<void>;
  updateMenuItemField: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  reset: () => void;
}

export const useMenuItemsStore = create<MenuItemsState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  reset: () => {
    set({ items: [], loading: false, error: null });
  },

  fetchMenuItems: async () => {
    set({ loading: true, error: null });
    try {
      const snapshot = await getDocs(collection(db, "menuItems"));
      const items: MenuItem[] = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          name: (d.name as string) ?? "",
          description: d.description as string | undefined,
          price: (d.price as number) ?? 0,
          image: d.image as MenuItem["image"] | undefined,
          optionGroupIds: d.optionGroupIds as MenuItem["optionGroupIds"] | undefined,
          categoryIds: d.categoryIds as string[] | undefined,
          kitchenType: (d.kitchenType as KitchenType) ?? KitchenType.Other,
          availability: d.availability as MenuItem["availability"] | undefined,
          soldOutUntil: d.soldOutUntil instanceof Timestamp ? d.soldOutUntil.toDate() : undefined,
          createdAt: d.createdAt?.toDate?.() ?? new Date(),
        };
      });
      items.sort((a, b) => a.name.localeCompare(b.name));
      set({ items, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch menu items",
        loading: false,
      });
    }
  },

  addMenuItem: async ({ name, description, price, imageFile, kitchenType, availability, categoryIds }) => {
    set({ error: null });
    try {
      let image: ImageItem | undefined;
      if (imageFile && imageFile.size > 0) {
        const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storageRef = ref(storage, `menuItems/${Date.now()}_${safeName}`);
        await uploadBytes(storageRef, imageFile);
        const url = await getDownloadURL(storageRef);
        image = { name: imageFile.name, url };
      }

      const payload: Record<string, unknown> = {
        name: name.trim(),
        description: (description ?? "").trim(),
        price: Number.isFinite(price) ? price : 0,
        kitchenType,
        createdAt: serverTimestamp(),
      };
      if (image) payload.image = image;
      if (categoryIds?.length) payload.categoryIds = categoryIds;
      if (availability) payload.availability = availability;

      await addDoc(collection(db, "menuItems"), payload);
      await get().fetchMenuItems();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add menu item";
      set({ error: message });
      throw err;
    }
  },

  updateMenuItem: async (id, { name, description, price, imageFile, removeImage, kitchenType, availability, categoryIds }) => {
    set({ error: null });
    try {
      const item = get().items.find((m) => m.id === id);
      const payload: Record<string, unknown> = {
        name: name.trim(),
        description: (description ?? "").trim(),
        price: Number.isFinite(price) ? price : 0,
        kitchenType,
        availability: availability ?? deleteField(),
      };
      if (categoryIds !== undefined) payload.categoryIds = categoryIds;

      if (removeImage && item?.image) {
        try { await deleteStorageImageByUrl(item.image.url); } catch { /* ignore */ }
        payload.image = deleteField();
      } else if (imageFile && imageFile.size > 0) {
        if (item?.image) {
          try { await deleteStorageImageByUrl(item.image.url); } catch { /* ignore */ }
        }
        const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storageRef = ref(storage, `menuItems/${Date.now()}_${safeName}`);
        await uploadBytes(storageRef, imageFile);
        const url = await getDownloadURL(storageRef);
        payload.image = { name: imageFile.name, url };
      }

      await updateDoc(doc(db, "menuItems", id), payload);
      await get().fetchMenuItems();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update menu item";
      set({ error: message });
      throw err;
    }
  },

  updateMenuItemField: async (id, data) => {
    set({ error: null });
    try {
      await updateDoc(doc(db, "menuItems", id), data);
      await get().fetchMenuItems();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update menu item";
      set({ error: message });
      throw err;
    }
  },

  deleteMenuItem: async (id) => {
    set({ error: null });
    try {
      const item = get().items.find((m) => m.id === id);
      if (item?.image) {
        try { await deleteStorageImageByUrl(item.image.url); } catch { /* ignore */ }
      }
      await deleteDoc(doc(db, "menuItems", id));
      await get().fetchMenuItems();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete menu item";
      set({ error: message });
      throw err;
    }
  },
}));
