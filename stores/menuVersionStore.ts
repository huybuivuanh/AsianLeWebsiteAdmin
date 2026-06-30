import { create } from "zustand";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface MenuVersionState {
  version: MenuVersion | null;
  loading: boolean;
  error: string | null;
  fetchMenuVersion: () => Promise<void>;
  publishMenu: () => Promise<void>;
  reset: () => void;
}

const VERSION_DOC = doc(db, "menuVersion", "versionDoc");

export const useMenuVersionStore = create<MenuVersionState>((set, get) => ({
  version: null,
  loading: false,
  error: null,

  reset: () => {
    set({ version: null, loading: false, error: null });
  },

  fetchMenuVersion: async () => {
    set({ loading: true, error: null });
    try {
      const snapshot = await getDoc(VERSION_DOC);
      if (snapshot.exists()) {
        const d = snapshot.data();
        set({
          version: {
            version: (d.version as number) ?? 0,
            lastUpdated: d.lastUpdated?.toDate?.() ?? null,
          },
          loading: false,
        });
      } else {
        set({ version: { version: 0, lastUpdated: null }, loading: false });
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch menu version",
        loading: false,
      });
    }
  },

  publishMenu: async () => {
    set({ error: null });
    try {
      const current = get().version?.version ?? 0;
      await setDoc(VERSION_DOC, {
        version: current + 1,
        lastUpdated: serverTimestamp(),
      });
      await get().fetchMenuVersion();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to publish menu";
      set({ error: message });
      throw err;
    }
  },
}));
