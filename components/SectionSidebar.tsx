"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type SectionSidebarLink = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const STORAGE_KEY = "section-sidebar-collapsed";

// Shared collapsed state, persisted to localStorage and synced across every
// mounted sidebar (and across browser tabs via the `storage` event).
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function setCollapsed(next: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    /* ignore write failures (private mode, disabled storage) */
  }
  listeners.forEach((l) => l());
}

export function SectionSidebar({
  title,
  links,
  ariaLabel,
}: {
  title: string;
  links: readonly SectionSidebarLink[];
  ariaLabel: string;
}) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, () => false);

  return (
    <aside
      className={`shrink-0 border-r border-foreground/10 bg-foreground/[0.03] min-h-[calc(100dvh-3.5rem)] transition-[width] duration-200 ${
        collapsed ? "w-14" : "w-60"
      }`}
      aria-label={ariaLabel}
    >
      <div className="sticky top-0 px-2 py-4">
        <div
          className={`mb-3 flex items-center ${
            collapsed ? "justify-center" : "justify-between px-2"
          }`}
        >
          {!collapsed && (
            <p className="text-xs font-semibold tracking-wide text-foreground/60 uppercase truncate">
              {title}
            </p>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className="rounded-lg p-1.5 text-foreground/60 hover:bg-foreground/5 hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
          >
            <svg
              className={`h-4 w-4 transition-transform ${
                collapsed ? "" : "rotate-180"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {links.map(({ href, label, icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                aria-label={collapsed ? label : undefined}
                className={`group flex items-center rounded-xl text-sm font-medium transition-colors whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 ${
                  collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
                } ${
                  isActive
                    ? "bg-foreground/10 text-foreground"
                    : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                }`}
              >
                <span className="shrink-0 [&>svg]:h-5 [&>svg]:w-5" aria-hidden>
                  {icon}
                </span>
                {!collapsed && <span className="pl-3">{label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
