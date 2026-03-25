"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ShoppingBag,
  Warehouse,
  ClipboardList,
  Menu,
} from "lucide-react";

const TABS = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/products", label: "Sản phẩm", icon: ShoppingBag },
  { href: "/warehouse", label: "Kho", icon: Warehouse },
  { href: "/catalogue", label: "Catalogue", icon: ClipboardList },
];

export function MobileBottomNav({ onMenuOpen }: { onMenuOpen: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#0a192f] border-t border-white/10 safe-area-pb">
      <div className="flex items-stretch h-16">
        {TABS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                active ? "text-white" : "text-white/40"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${active ? "bg-white/15" : ""}`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span
                className={`text-[10px] font-medium leading-none ${active ? "text-white" : "text-white/40"}`}
              >
                {label}
              </span>
            </Link>
          );
        })}

        {/* Menu button */}
        <button
          onClick={onMenuOpen}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-white/40 active:scale-95 transition-all"
        >
          <div className="p-1.5 rounded-xl">
            <Menu size={20} strokeWidth={1.8} />
          </div>
          <span className="text-[10px] font-medium leading-none text-white/40">
            Menu
          </span>
        </button>
      </div>
    </nav>
  );
}
