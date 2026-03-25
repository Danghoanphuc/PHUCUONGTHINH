"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/products": "Sản phẩm",
  "/warehouse": "Kho hàng",
  "/catalogue": "Catalogue",
  "/management": "Nội dung",
  "/leads": "Leads nội bộ",
  "/admin/categories": "Danh mục",
  "/admin/tags": "Tags",
  "/admin/media": "Media",
  "/admin/import": "Import",
  "/admin/leads": "Leads",
  "/admin/products": "Quản lý SP",
};

function getTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Match prefix
  const match = Object.keys(PAGE_TITLES)
    .filter((k) => k !== "/" && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_TITLES[match] : "Phú Cường Thịnh";
}

export function MobileTopBar({ onMenuOpen }: { onMenuOpen: () => void }) {
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <div className="lg:hidden sticky top-0 z-30 bg-[#0a192f] flex items-center gap-3 px-4 h-14 shrink-0">
      {/* Logo mark */}
      <Link href="/" className="shrink-0">
        <svg
          width="28"
          height="28"
          viewBox="0 0 22 22"
          fill="none"
          aria-hidden="true"
        >
          <rect width="22" height="22" fill="#8B2E16" rx="5" />
          <path d="M4 4h6v3H7v2h3v3H7v6H4V4z" fill="#F5F0E8" />
          <path d="M12 4h6v14h-3v-5.5h-3V9.5h3V7h-3V4z" fill="#F5F0E8" />
        </svg>
      </Link>

      <h1 className="flex-1 text-white font-bold text-base tracking-tight truncate">
        {title}
      </h1>

      <button
        onClick={onMenuOpen}
        className="p-2 text-white/60 hover:text-white active:scale-95 transition-all"
        aria-label="Mở menu"
      >
        <Menu size={22} />
      </button>
    </div>
  );
}
