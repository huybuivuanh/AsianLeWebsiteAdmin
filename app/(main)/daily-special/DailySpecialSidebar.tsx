"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const dailySpecialNavLinks = [
  { href: "/daily-special/day-special", label: "Day Special" },
  { href: "/daily-special/special-item", label: "Special Item" },
] as const;

export function DailySpecialSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="shrink-0 w-52 border-r border-foreground/10 bg-foreground/[0.04] min-h-[calc(100dvh-3.5rem)] py-4 pl-4 pr-0"
      aria-label="Daily Special section navigation"
    >
      <nav className="flex flex-col gap-0.5 sticky top-4">
        {dailySpecialNavLinks.map(({ href, label }) => {
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
