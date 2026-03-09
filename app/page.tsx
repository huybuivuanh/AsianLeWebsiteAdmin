"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground/60">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen p-6">
      <header className="flex items-center justify-between max-w-4xl mx-auto mb-8">
        <h1 className="text-xl font-semibold text-foreground">
          Asian Le Website Admin
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-foreground/60">{user.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-foreground/20 px-3 py-1.5 text-sm text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto">
        <p className="text-foreground/70">You are signed in. Admin content goes here.</p>
      </main>
    </div>
  );
}
