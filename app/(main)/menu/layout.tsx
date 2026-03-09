export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-w-0">{children}</div>;
}
