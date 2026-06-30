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
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-foreground/10 bg-foreground/[0.02] px-4 py-3 mb-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">
          Menu Version {version?.version ?? "—"}
        </p>
        {lastUpdated ? (
          <p className="text-xs text-foreground/50">Last published {lastUpdated}</p>
        ) : (
          <p className="text-xs text-foreground/50">Never published</p>
        )}
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{error}</p>
        )}
      </div>
      <button
        type="button"
        onClick={handlePublish}
        disabled={publishing}
        className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50 shrink-0"
      >
        {publishing ? "Publishing…" : "Publish Menu"}
      </button>
    </div>
  );
}
