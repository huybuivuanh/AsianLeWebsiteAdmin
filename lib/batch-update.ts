import { doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type DocUpdate = { id: string; data: Record<string, unknown> };

/** Firestore allows at most 500 writes per batch. */
const MAX_BATCH_WRITES = 500;

/** Applies many field updates to one collection in as few round trips as possible. */
export async function batchUpdateDocs(
  collectionName: string,
  updates: DocUpdate[],
): Promise<void> {
  for (let i = 0; i < updates.length; i += MAX_BATCH_WRITES) {
    const batch = writeBatch(db);
    for (const { id, data } of updates.slice(i, i + MAX_BATCH_WRITES)) {
      batch.update(doc(db, collectionName, id), data);
    }
    await batch.commit();
  }
}
