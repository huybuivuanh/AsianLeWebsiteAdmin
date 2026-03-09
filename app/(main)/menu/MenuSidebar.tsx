"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuNavLinks = [
  { href: "/menu/items", label: "Menu Item" },
  { href: "/menu/categories", label: "Food Category" },
] as const;

export function MenuSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="shrink-0 w-full sm:w-52 border-r border-foreground/10 bg-foreground/[0.02] sm:min-h-[calc(100dvh-8rem)] rounded-lg sm:rounded-none"
      aria-label="Menu section navigation"
    >
      <nav className="flex sm:flex-col gap-0.5 p-2 sm:py-2 overflow-x-auto sm:overflow-x-visible sm:sticky sm:top-4">
        <span className="hidden sm:block px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/50">
          Menu
        </span>
        {menuNavLinks.map(({ href, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-foreground/10 text-foreground"
                  : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
