"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

type Feature = {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
};

/** 24×24 outline icon, drawn with the current text color. */
function Icon({ d }: { d: string }) {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

const GROUPS: { title: string; features: Feature[] }[] = [
  {
    title: "Day to day",
    features: [
      {
        href: "/orders",
        title: "Orders",
        description:
          "See online orders from the website by day, check their details, and print receipts.",
        icon: (
          <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        ),
      },
      {
        href: "/daily-special",
        title: "Daily special",
        description:
          "Set up special items and choose which ones are offered on each day.",
        icon: (
          <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        ),
      },
    ],
  },
  {
    title: "Website content",
    features: [
      {
        href: "/menu",
        title: "Menu",
        description:
          "Manage categories, items, prices, and the option groups and options customers can pick.",
        icon: <Icon d="M4 6h16M4 12h16M4 18h10" />,
      },
      {
        href: "/gallery",
        title: "Gallery",
        description: "Manage the photos shown in the website gallery.",
        icon: (
          <Icon d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        ),
      },
      {
        href: "/updates",
        title: "Updates",
        description: "Post news and announcements that appear on the website.",
        icon: (
          <Icon d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        ),
      },
      {
        href: "/store-info",
        title: "Store info",
        description: "Edit the store hours displayed on the website.",
        icon: <Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
      },
    ],
  },
  {
    title: "Setup",
    features: [
      {
        href: "/settings",
        title: "Settings",
        description:
          "Control online ordering: ordering and reservation hours, wait time, restaurant phone, holidays, and pausing orders.",
        icon: (
          <Icon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        ),
      },
    ],
  },
];

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  // Safe to read the clock during render: the (main) layout only renders pages
  // on the client, after sign-in.
  const now = new Date();
  const greeting = greetingFor(now.getHours());
  const today = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-w-0 space-y-10">
      {/* Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-ink px-6 py-8 text-on-ink sm:px-10 sm:py-10">
        <Image
          src="/logo.png"
          alt=""
          width={220}
          height={320}
          className="pointer-events-none absolute -right-6 -top-8 h-[130%] w-auto select-none object-contain opacity-[0.12] sm:right-6"
          unoptimized
          priority
        />
        <div className="relative max-w-xl">
          <p className="text-sm font-medium text-gold">{today}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {greeting}
          </h1>
          <p className="mt-3 text-sm text-on-ink-muted sm:text-base">
            This is where you run the Asian Le website: orders, the menu,
            specials, photos and store hours.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/orders"
              className="inline-flex min-h-11 items-center rounded-full bg-gold px-5 text-sm font-bold text-ink transition-colors hover:bg-on-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              View orders
            </Link>
            <Link
              href="/menu"
              className="inline-flex min-h-11 items-center rounded-full border border-gold px-5 text-sm font-bold text-gold transition-colors hover:bg-gold hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Edit menu
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      {GROUPS.map((group, i) => (
        <section key={group.title} aria-labelledby={`feature-group-${i}`}>
          <h2
            id={`feature-group-${i}`}
            className="mb-3 text-sm font-semibold text-foreground/60"
          >
            {group.title}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {group.features.map(({ href, title, description, icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group flex h-full gap-4 rounded-2xl border border-foreground/10 bg-background p-5 transition duration-200 hover:-translate-y-0.5 hover:border-gold hover:shadow-[0_8px_24px_-12px_rgba(20,18,16,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-gold transition-colors group-hover:bg-gold group-hover:text-ink">
                    {icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-semibold text-foreground">
                      {title}
                    </span>
                    <span className="mt-1 block text-sm text-foreground/70">
                      {description}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
