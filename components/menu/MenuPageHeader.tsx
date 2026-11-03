import type { ReactNode } from "react";

/** Toggle next to a menu page's search box that shows only unused entries. */
export function UnusedFilterButton({
  active,
  count,
  onToggle,
  title,
}: {
  active: boolean;
  count: number;
  onToggle: () => void;
  /** Tooltip explaining what "unused" means on this page. */
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      disabled={count === 0 && !active}
      title={title}
      className={`shrink-0 rounded-xl border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 disabled:opacity-50 ${
        active
          ? "border-amber-400 bg-amber-100 text-amber-800"
          : "border-foreground/20 text-foreground hover:bg-foreground/5"
      }`}
    >
      Unused {count}
    </button>
  );
}

/** Title + count on the left, actions on the right. */
export function MenuPageHeader({
  title,
  count,
  children,
}: {
  title: string;
  /** Hidden while the list hasn't loaded yet. */
  count?: number;
  children?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h1 className="flex items-baseline gap-2 text-xl font-semibold text-foreground sm:text-2xl">
        {title}
        {count != null && (
          <span className="text-base font-medium text-foreground/50">{count}</span>
        )}
      </h1>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
