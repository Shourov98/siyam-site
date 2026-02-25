"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  Boxes,
  CircleDashed,
  LayoutDashboard,
  Package,
  Settings,
  ShieldAlert,
  ShoppingCart,
  Wallet,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Products", icon: Boxes, href: "/products" },
  { label: "Inventory", icon: Package, href: "/inventory" },
  { label: "Orders", icon: ShoppingCart, href: "/orders" },
  { label: "Import", icon: CircleDashed, href: "/import" },
  { label: "Wallet", icon: Wallet, href: "/wallet" },
  { label: "Integration", icon: BadgeCheck, href: "/integration" },
  { label: "Dispute & Support", icon: ShieldAlert, href: "/support" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden h-screen w-24 shrink-0 border-r border-[#263350] bg-[#17223f] text-[#8ea0c6] md:flex md:flex-col md:sticky md:top-0">
        <div className="flex justify-center border-b border-[#263350] px-3 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0ad0e1] font-bold text-[#17223f]">
            C
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <ul className="space-y-1">
            {navItems.map(({ label, icon: Icon, href }) => {
              const isActive = pathname === href;

              return (
                <li key={label}>
                  <Link
                    href={href}
                    className={`group flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition ${
                      isActive
                        ? "bg-[#1f2e53] text-[#58e7f2]"
                        : "hover:bg-[#1f2e53] hover:text-[#d8e7ff]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-center leading-tight">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-[#263350] px-3 py-4">
          <button
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-[#3e4f73] bg-[#233153] text-xs font-semibold text-[#d7e5ff]"
            type="button"
          >
            S
          </button>
        </div>
      </aside>

      <div className="sticky top-0 z-20 border-b border-[#d6dce8] bg-white px-4 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0ad0e1] font-bold text-[#17223f]">
            C
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d1d8e6] bg-[#f7f9fc] text-xs font-semibold text-[#1f2c49]"
            type="button"
          >
            S
          </button>
        </div>
      </div>
    </>
  );
}
