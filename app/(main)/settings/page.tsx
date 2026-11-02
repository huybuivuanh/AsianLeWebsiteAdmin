"use client";

import { StoreSettingsForm } from "@/components/settings/StoreSettingsForm";
import { MenuPageHeader } from "@/components/menu/MenuPageHeader";

export default function SettingsPage() {
  return (
    <div className="min-w-0">
      <MenuPageHeader title="Settings" />
      <StoreSettingsForm />
    </div>
  );
}
