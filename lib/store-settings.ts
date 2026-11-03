// Sentinel for "paused until a human manually resumes it" — a far-future
// timestamp, not a distinct type/flag. Must match the same sentinel used by
// the customer-facing website so every reader agrees on what "indefinite" means.
export const INDEFINITE_PAUSE = new Date("2099-01-01T00:00:00Z");

export function isStorePaused(pausedUntil: Date | null): boolean {
  if (pausedUntil == null) return false;
  return pausedUntil.getTime() > Date.now();
}

export function formatPausedUntil(pausedUntil: Date | null): string {
  if (pausedUntil == null || !isStorePaused(pausedUntil)) return "Not paused";
  if (pausedUntil.getTime() === INDEFINITE_PAUSE.getTime()) return "Paused indefinitely";
  return `Paused until ${pausedUntil.toLocaleString("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  })}`;
}
