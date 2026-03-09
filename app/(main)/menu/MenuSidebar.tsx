"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuNavLinks = [
  { href: "/menu/categories", label: "Categories" },
  { href: "/menu/items", label: "Menu Item" },
] as const;

export function MenuSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="shrink-0 w-52 border-r border-foreground/10 bg-foreground/[0.04] min-h-[calc(100dvh-3.5rem)] py-4 pl-4 pr-0"
      aria-label="Menu section navigation"
    >
      <nav className="flex flex-col gap-0.5 sticky top-4">
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
