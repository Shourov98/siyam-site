import DashboardSidebar from "./components/DashboardSidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#f2f5fa] text-[#1d2a45]">
      <div className="mx-auto flex w-full max-w-[1440px]">
        <DashboardSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
