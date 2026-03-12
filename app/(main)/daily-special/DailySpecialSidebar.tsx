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
      className="shrink-0 w-60 border-r border-foreground/10 bg-foreground/[0.03] min-h-[calc(100dvh-3.5rem)]"
      aria-label="Daily Special section navigation"
    >
      <div className="sticky top-4 px-3 py-4">
        <div className="px-2 mb-3">
          <p className="text-xs font-semibold tracking-wide text-foreground/60 uppercase">
            Daily Special
          </p>
        </div>
        <nav className="flex flex-col gap-1">
          {dailySpecialNavLinks.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`group relative rounded-xl px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 ${
                  isActive
                    ? "bg-foreground/10 text-foreground"
                    : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                }`}
              >
                <span
                  className={`absolute left-1 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full transition-opacity ${
                    isActive ? "bg-foreground/60 opacity-100" : "opacity-0"
                  }`}
                  aria-hidden
                />
                <span className="pl-2">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
