// One-time copy of the last 30 days of online orders into the POS project.
// Run from the functions folder after `gcloud auth application-default login`:
//   npm run backfill:online-orders
// Safe to run more than once.
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { mirrorOnlineOrder } from "../onlineOrderMirror";

const WEBSITE_PROJECT_ID = "asianlewebsite";
const DAYS = 30;

async function main() {
  initializeApp({ projectId: WEBSITE_PROJECT_ID });
  const since = Timestamp.fromMillis(Date.now() - DAYS * 24 * 60 * 60 * 1000);
  const snapshot = await getFirestore()
    .collection("orders")
    .where("createdAt", ">=", since)
    .get();

  const counts: Record<string, number> = {};
  for (const doc of snapshot.docs) {
    // Can't tell rejected from accepted-then-cancelled here, so copy
    // cancelled orders too.
    const result = await mirrorOnlineOrder(doc.id, doc.data(), doc.updateTime, {
      copyCancelledWithoutCopy: true,
    });
    counts[result] = (counts[result] ?? 0) + 1;
  }

  console.log(`Checked ${snapshot.size} orders from the last ${DAYS} days:`, counts);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
