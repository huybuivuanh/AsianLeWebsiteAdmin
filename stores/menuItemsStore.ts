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

export type AddMenuItemInput = {
  name: string;
  description: string;
  price: number;
  imageFile: File | null;
  /** When updating: remove existing image from Storage and clear image field */
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
  menuItems: MenuItem[];
  loading: boolean;
  error: string | null;
  fetchMenuItems: () => Promise<void>;
  addMenuItem: (input: AddMenuItemInput) => Promise<void>;
  updateMenuItem: (id: string, input: AddMenuItemInput) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  updateMenuItemCategoryIds: (id: string, categoryIds: string[]) => Promise<void>;
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
        const rawImage = d.image;
        const image: ImageItem | undefined =
          rawImage &&
          typeof rawImage === "object" &&
          "url" in rawImage &&
          typeof (rawImage as ImageItem).url === "string"
            ? {
                name:
                  typeof (rawImage as ImageItem).name === "string"
                    ? (rawImage as ImageItem).name
                    : "",
                url: (rawImage as ImageItem).url,
              }
            : undefined;
        return {
          id: doc.id,
          name: (d.name as string) ?? "",
          description: d.description as string | undefined,
          price,
          image,
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
        createdAt: serverTimestamp(),
      };
      if (image) payload.image = image;

      await addDoc(collection(db, "menuItems"), payload);
      await get().fetchMenuItems();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add menu item";
      set({ error: message });
      throw err;
    }
  },

  updateMenuItem: async (
    id,
    { name, description, price, imageFile, removeImage },
  ) => {
    set({ error: null });
    try {
      const item = get().menuItems.find((m) => m.id === id);
      const payload: Record<string, unknown> = {
        name: name.trim(),
        description: (description ?? "").trim(),
        price: Number.isFinite(price) ? price : 0,
      };

      if (removeImage && item?.image) {
        try {
          await deleteStorageImageByUrl(item.image.url);
        } catch {
          // Ignore storage errors; still clear the field
        }
        payload.image = deleteField();
      } else if (imageFile && imageFile.size > 0) {
        if (item?.image) {
          try {
            await deleteStorageImageByUrl(item.image.url);
          } catch {
            // Ignore; upload new image anyway
          }
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
      const message =
        err instanceof Error ? err.message : "Failed to update menu item";
      set({ error: message });
      throw err;
    }
  },

  deleteMenuItem: async (id) => {
    set({ error: null });
    try {
      const item = get().menuItems.find((m) => m.id === id);
      if (item?.image) {
        try {
          await deleteStorageImageByUrl(item.image.url);
        } catch {
          // Ignore storage errors (e.g. file already gone); still delete the doc
        }
      }
      await deleteDoc(doc(db, "menuItems", id));
      await get().fetchMenuItems();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete menu item";
      set({ error: message });
      throw err;
    }
  },

  updateMenuItemCategoryIds: async (id, categoryIds) => {
    set({ error: null });
    try {
      await updateDoc(doc(db, "menuItems", id), { categoryIds });
      await get().fetchMenuItems();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update item categories";
      set({ error: message });
      throw err;
    }
  },
}));
