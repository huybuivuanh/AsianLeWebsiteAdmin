"use client";

import { StoreSettingsForm } from "@/components/settings/StoreSettingsForm";

export default function SettingsPage() {
  return (
    <div className="min-w-0">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          Settings
        </h1>
      </div>
      <StoreSettingsForm />
    </div>
  );
}
