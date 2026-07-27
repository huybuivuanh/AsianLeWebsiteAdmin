"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/orders", label: "Orders" },
  { href: "/menu", label: "Menu" },
  { href: "/demo-menu", label: "Demo Menu" },
  { href: "/daily-special", label: "Daily Special" },
  { href: "/gallery", label: "Gallery" },
  { href: "/updates", label: "Updates" },
  { href: "/store-info", label: "Store Info" },
  { href: "/settings", label: "Settings" },
] as const;

function NavLinks({
  pathname,
  isMobile,
  onLinkClick,
}: {
  pathname: string;
  isMobile: boolean;
  onLinkClick?: () => void;
}) {
  const base = isMobile
    ? "block rounded-lg px-4 py-3 text-base font-medium transition-colors"
    : "rounded-md px-3 py-2 text-sm font-medium transition-colors";
  return (
    <>
      {navLinks.map(({ href, label }) => {
        const isActive =
          pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={onLinkClick}
            className={`${base} ${
              isActive
                ? "bg-[var(--nav-active)] text-[var(--nav-foreground)]"
                : "text-[var(--nav-foreground-muted)] hover:bg-[var(--nav-hover)] hover:text-[var(--nav-foreground)]"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  async function handleSignOut() {
    await logout();
    router.replace("/login");
  }

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="border-b border-[var(--nav-border)] bg-[var(--nav-bg)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 min-h-[3.5rem]">
          <div className="flex items-center min-w-0">
            <span className="font-semibold text-[var(--nav-foreground)] truncate mr-2 sm:mr-6">
              Asian Le Admin
            </span>
            <div className="hidden md:flex items-center gap-1">
              <NavLinks pathname={pathname} isMobile={false} />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSignOut}
              className="hidden sm:inline-flex rounded-md border border-[var(--nav-border)] px-3 py-2 text-sm font-medium text-[var(--nav-foreground)] hover:bg-[var(--nav-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--nav-foreground-muted)] min-h-[2.25rem]"
            >
              Sign out
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="md:hidden rounded-md p-2 text-[var(--nav-foreground)] hover:bg-[var(--nav-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--nav-foreground-muted)] min-h-[2.5rem] min-w-[2.5rem] inline-flex items-center justify-center"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-[height] duration-200 ease-out ${
          mobileMenuOpen ? "h-auto" : "h-0"
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="border-t border-[var(--nav-border)] bg-[var(--nav-bg)] px-4 py-3 pb-4">
          <div className="flex flex-col gap-1">
            <NavLinks
              pathname={pathname}
              isMobile
              onLinkClick={closeMobileMenu}
            />
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-3 w-full sm:hidden rounded-lg border border-[var(--nav-border)] px-4 py-3 text-base font-medium text-[var(--nav-foreground)] hover:bg-[var(--nav-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--nav-foreground-muted)]"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
