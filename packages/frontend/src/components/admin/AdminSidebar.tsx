"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@repo/shared-utils";
import { authService } from "@/lib/auth-service";
import {
  FolderTree,
  Tags,
  ImageIcon,
  Upload,
  Users,
  LogOut,
  ChevronRight,
  Warehouse,
  ClipboardList,
  FileText,
  Home,
  ShoppingBag,
  Eye,
  X,
  LayoutDashboard,
} from "lucide-react";

const ADMIN_NAV = [
  { href: "/admin/categories", label: "Danh mục", icon: FolderTree },
  { href: "/admin/tags", label: "Tags", icon: Tags },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/import", label: "Import", icon: Upload },
  { href: "/admin/leads", label: "Leads", icon: Users },
];

const OPS_NAV = [
  { href: "/warehouse", label: "Kho hàng", icon: Warehouse },
  { href: "/catalogue", label: "Catalogue", icon: ClipboardList },
  { href: "/management", label: "Nội dung", icon: FileText },
  { href: "/leads", label: "Leads nội bộ", icon: Users },
];

const PUBLIC_NAV = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/products", label: "Sản phẩm", icon: ShoppingBag },
];

// Bottom nav items for mobile (most important ones)
export const MOBILE_BOTTOM_NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/products", label: "Sản phẩm", icon: ShoppingBag },
  { href: "/warehouse", label: "Kho", icon: Warehouse },
  { href: "/catalogue", label: "Catalogue", icon: ClipboardList },
  { href: "/leads", label: "Leads", icon: Users },
];

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  target,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  target?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      target={target}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
        active
          ? "bg-white/10 text-white"
          : "text-white/55 hover:bg-white/8 hover:text-white/85"
      }`}
    >
      <Icon
        size={15}
        className={
          active ? "text-white" : "text-white/35 group-hover:text-white/65"
        }
      />
      <span className="flex-1 leading-none">{label}</span>
      {active && <ChevronRight size={12} className="text-white/35" />}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-3 pb-1.5 text-[10px] font-bold text-white/22 uppercase tracking-widest">
      {children}
    </p>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    authService.logout();
    router.replace("/admin/login");
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="h-full w-60 bg-[#0a192f] flex flex-col">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-white/8 shrink-0 flex items-center justify-between">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
            <svg
              width="32"
              height="32"
              viewBox="0 0 22 22"
              fill="none"
              aria-hidden="true"
            >
              <rect width="22" height="22" fill="#8B2E16" />
              <path d="M4 4h6v3H7v2h3v3H7v6H4V4z" fill="#F5F0E8" />
              <path d="M12 4h6v14h-3v-5.5h-3V9.5h3V7h-3V4z" fill="#F5F0E8" />
            </svg>
          </div>
          <div>
            <p className="text-white font-black text-[13px] tracking-tight uppercase leading-none">
              Phú Cường<span className="text-[#e07a5f]">Thịnh</span>
            </p>
            <p className="text-white/28 text-[10px] mt-0.5 font-medium tracking-widest uppercase">
              Admin Mode
            </p>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors p-1"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        <SectionLabel>Trang web</SectionLabel>
        {PUBLIC_NAV.map(({ href, label, icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={isActive(href)}
            onClick={onClose}
          />
        ))}

        <div className="mx-3 my-2 border-t border-white/8" />

        <SectionLabel>Quản trị</SectionLabel>
        {ADMIN_NAV.map(({ href, label, icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={isActive(href)}
            onClick={onClose}
          />
        ))}

        <div className="mx-3 my-2 border-t border-white/8" />

        <SectionLabel>Vận hành nội bộ</SectionLabel>
        {OPS_NAV.map(({ href, label, icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={isActive(href)}
            onClick={onClose}
          />
        ))}

        <div className="mx-3 my-2 border-t border-white/8" />

        <NavItem
          href="/products"
          label="Xem như khách"
          icon={Eye}
          active={false}
          target="_blank"
        />
      </nav>

      {/* User + logout */}
      <div className="px-3 py-3 border-t border-white/8 shrink-0">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/5 mb-1.5">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <span className="text-emerald-400 text-xs font-bold uppercase">
              {user?.email?.[0] ?? "A"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/75 text-xs font-medium truncate">
              {user?.email}
            </p>
            <p className="text-white/28 text-[10px] capitalize">
              {user?.role ?? "admin"}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/38 hover:bg-red-500/15 hover:text-red-400 transition-all"
        >
          <LogOut size={14} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}

// Desktop sidebar (fixed left)
export default function AdminSidebar() {
  return (
    <div className="fixed top-0 left-0 h-screen w-60 z-50 hidden lg:block">
      <SidebarContent />
    </div>
  );
}

// Mobile drawer sidebar
export function MobileSidebarDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed top-0 left-0 h-full z-50 lg:hidden shadow-2xl">
        <SidebarContent onClose={onClose} />
      </div>
    </>
  );
}
