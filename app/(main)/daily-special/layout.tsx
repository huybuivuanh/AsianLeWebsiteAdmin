import { DailySpecialSidebar } from "./DailySpecialSidebar";

export default function DailySpecialLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1">
      <DailySpecialSidebar />
      <main className="min-w-0 flex-1 px-4 sm:px-6 py-4 sm:py-6">{children}</main>
    </div>
  );
}
