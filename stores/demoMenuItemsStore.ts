import { create } from "zustand";
import {
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

export type DemoMenuItemInput = {
  name: string;
  description?: string;
  price: number;
  imageFile: File | null;
  kitchenType: KitchenType;
  availability?: MenuItemAvailability;
  soldOut?: MenuItemSoldOut;
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

interface DemoMenuItemsState {
  items: DemoMenuItem[];
  loading: boolean;
  error: string | null;
  fetchDemoMenuItems: () => Promise<void>;
  addDemoMenuItem: (input: DemoMenuItemInput) => Promise<void>;
  updateDemoMenuItem: (id: string, input: DemoMenuItemInput) => Promise<void>;
  updateDemoMenuItemField: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteDemoMenuItem: (id: string) => Promise<void>;
  reset: () => void;
}

export const useDemoMenuItemsStore = create<DemoMenuItemsState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  reset: () => {
    set({ items: [], loading: false, error: null });
  },

  fetchDemoMenuItems: async () => {
    set({ loading: true, error: null });
    try {
      const snapshot = await getDocs(collection(db, "demoMenuItems"));
      const items: DemoMenuItem[] = snapshot.docs.map((doc) => {
        const d = doc.data();
        const rawSoldOut = d.soldOut as
          | { since?: { toDate?: () => Date }; hours?: number; indefinite?: boolean }
          | undefined;
        return {
          id: doc.id,
          name: (d.name as string) ?? "",
          description: d.description as string | undefined,
          price: (d.price as number) ?? 0,
          image: d.image as DemoMenuItem["image"] | undefined,
          optionGroupIds: d.optionGroupIds as DemoMenuItem["optionGroupIds"] | undefined,
          categoryIds: d.categoryIds as string[] | undefined,
          kitchenType: (d.kitchenType as KitchenType) ?? KitchenType.Other,
          availability: d.availability as DemoMenuItem["availability"] | undefined,
          soldOut: rawSoldOut
            ? {
                since: rawSoldOut.since?.toDate?.() ?? new Date(),
                hours: rawSoldOut.hours,
                indefinite: !!rawSoldOut.indefinite,
              }
            : undefined,
          createdAt: d.createdAt?.toDate?.() ?? new Date(),
        };
      });
      items.sort((a, b) => a.name.localeCompare(b.name));
      set({ items, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch demo menu items",
        loading: false,
      });
    }
  },

  addDemoMenuItem: async ({ name, description, price, imageFile, kitchenType, availability, soldOut, categoryIds }) => {
    set({ error: null });
    try {
      let image: ImageItem | undefined;
      if (imageFile && imageFile.size > 0) {
        const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storageRef = ref(storage, `demoMenuItems/${Date.now()}_${safeName}`);
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
      if (soldOut) payload.soldOut = soldOut;

      await addDoc(collection(db, "demoMenuItems"), payload);
      await get().fetchDemoMenuItems();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add demo menu item";
      set({ error: message });
      throw err;
    }
  },

  updateDemoMenuItem: async (id, { name, description, price, imageFile, removeImage, kitchenType, availability, soldOut, categoryIds }) => {
    set({ error: null });
    try {
      const item = get().items.find((m) => m.id === id);
      const payload: Record<string, unknown> = {
        name: name.trim(),
        description: (description ?? "").trim(),
        price: Number.isFinite(price) ? price : 0,
        kitchenType,
        availability: availability ?? deleteField(),
        soldOut: soldOut ?? deleteField(),
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
        const storageRef = ref(storage, `demoMenuItems/${Date.now()}_${safeName}`);
        await uploadBytes(storageRef, imageFile);
        const url = await getDownloadURL(storageRef);
        payload.image = { name: imageFile.name, url };
      }

      await updateDoc(doc(db, "demoMenuItems", id), payload);
      await get().fetchDemoMenuItems();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update demo menu item";
      set({ error: message });
      throw err;
    }
  },

  updateDemoMenuItemField: async (id, data) => {
    set({ error: null });
    try {
      await updateDoc(doc(db, "demoMenuItems", id), data);
      await get().fetchDemoMenuItems();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update demo menu item";
      set({ error: message });
      throw err;
    }
  },

  deleteDemoMenuItem: async (id) => {
    set({ error: null });
    try {
      const item = get().items.find((m) => m.id === id);
      if (item?.image) {
        try { await deleteStorageImageByUrl(item.image.url); } catch { /* ignore */ }
      }
      await deleteDoc(doc(db, "demoMenuItems", id));
      await get().fetchDemoMenuItems();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete demo menu item";
      set({ error: message });
      throw err;
    }
  },
}));
