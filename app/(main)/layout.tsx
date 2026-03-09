"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { MenuSidebar } from "@/app/(main)/menu/MenuSidebar";

export default function MainLayout({
  children,
}: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isMenuSection = pathname?.startsWith("/menu");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] min-h-screen flex items-center justify-center p-4">
        <p className="text-foreground/60">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isMenuSection) {
    return (
      <>
        <Navbar />
        <div className="flex min-w-0 flex-1">
          <MenuSidebar />
          <main className="min-w-0 flex-1 px-4 sm:px-6 py-4 sm:py-6">
            {children}
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 min-w-0">
        {children}
      </main>
    </>
  );
}
