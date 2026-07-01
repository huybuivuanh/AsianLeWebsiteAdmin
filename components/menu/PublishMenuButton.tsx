"use client";

import { useState } from "react";
import { useMenuVersionStore } from "@/stores/menuVersionStore";

export function PublishMenuButton() {
  const { version, publishMenu } = useMenuVersionStore();
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish() {
    if (!confirm("Publish menu? This will signal the customer site to refresh.")) return;
    setError(null);
    setPublishing(true);
    try {
      await publishMenu();
    } catch {
      setError("Failed to publish. Try again.");
    } finally {
      setPublishing(false);
    }
  }

  const lastUpdated = version?.lastUpdated
    ? new Intl.DateTimeFormat("en-CA", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(version.lastUpdated)
    : null;

  return (
    <>
      <button
        type="button"
        onClick={handlePublish}
        disabled={publishing}
        className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50 shrink-0"
      >
        {publishing ? "Publishing…" : "Publish Menu"}
      </button>
      <span className="flex flex-wrap items-center gap-1.5 min-w-0 text-xs text-foreground/60">
        <span className="shrink-0 rounded-full border border-foreground/15 bg-foreground/5 px-2 py-0.5 text-xs font-semibold text-foreground/80">
          v{version?.version ?? "—"}
        </span>
        {lastUpdated ? (
          <>
            <span aria-hidden="true">·</span>
            <span>
              Last published{" "}
              <span className="font-medium text-foreground">{lastUpdated}</span>
            </span>
          </>
        ) : (
          <span>Never published</span>
        )}
      </span>
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      )}
    </>
  );
}
