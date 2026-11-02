import type { ReactNode } from "react";

/** Outer card for every menu list row. */
export const rowCardClass =
  "rounded-xl border border-foreground/10 bg-background transition-colors hover:border-foreground/20";

/** The clickable header of an expandable row. */
export const rowHeaderClass =
  "flex items-center gap-3 rounded-xl px-3 py-3 sm:px-4 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-foreground/20";

/** Dashed "+ Add …" button used inside expanded rows. */
export const addButtonClass =
  "inline-flex min-h-9 items-center rounded-lg border border-dashed border-foreground/25 px-3 text-sm font-medium text-foreground/80 hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20";

/** Quiet outlined button for secondary actions inside expanded rows. */
export const subtleButtonClass =
  "inline-flex min-h-9 items-center rounded-lg border border-foreground/15 px-3 text-sm font-medium text-foreground hover:bg-foreground/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 disabled:opacity-50";

export function UnusedBadge() {
  return (
    <span className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
      Unused
    </span>
  );
}

/** Points right when closed, down when open. Hidden on phones to save room. */
export function ExpandChevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`hidden h-4 w-4 shrink-0 text-foreground/40 transition-transform sm:block ${
        expanded ? "rotate-90" : ""
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M4 7h16m-6 0V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v3"
      />
    </svg>
  );
}

/** Edit + a quiet trash button. Clicks don't toggle the row they sit in. */
export function RowActions({
  name,
  onEdit,
  onDelete,
  deleting = false,
}: {
  /** Used in the delete button's accessible label. */
  name: string;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
}) {
  return (
    <div
      className="flex shrink-0 items-center gap-1"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onEdit}
        disabled={deleting}
        className="rounded-lg border border-foreground/15 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 disabled:opacity-50"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        aria-label={`Delete ${name}`}
        title="Delete"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground/45 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 disabled:opacity-50"
      >
        {deleting ? <span className="text-sm">…</span> : <TrashIcon />}
      </button>
    </div>
  );
}

/** Small text button for removing something from a list; red only on hover. */
export function RemoveButton({
  onClick,
  label,
  children = "Remove",
}: {
  onClick: () => void;
  /** Accessible label, e.g. `Remove Large from Size`. */
  label: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-foreground/55 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
    >
      {children}
    </button>
  );
}
