import { MenuSidebar } from "@/app/(main)/menu/MenuSidebar";

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 flex flex-col sm:flex-row gap-4 sm:gap-6">
      <MenuSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
