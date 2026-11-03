import { MenuSidebar } from "./MenuSidebar";

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1">
      <MenuSidebar />
      <main className="min-w-0 flex-1 px-4 sm:px-6 py-4 sm:py-6">{children}</main>
    </div>
  );
}
