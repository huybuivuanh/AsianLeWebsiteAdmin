import { create } from "zustand";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface MenuItemsState {
  menuItems: MenuItem[];
  loading: boolean;
  error: string | null;
  fetchMenuItems: () => Promise<void>;
}

export const useMenuItemsStore = create<MenuItemsState>((set) => ({
  menuItems: [],
  loading: false,
  error: null,

  fetchMenuItems: async () => {
    set({ loading: true, error: null });
    try {
      const snapshot = await getDocs(collection(db, "menuItems"));
      const menuItems: MenuItem[] = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          name: (d.name as string) ?? "",
          description: d.description as string | undefined,
          price: d.price as number | undefined,
          image: d.image as string | undefined,
          createdAt: d.createdAt?.toDate?.() ?? undefined,
        };
      });
      set({ menuItems, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch menu items",
        loading: false,
      });
    }
  },
}));
