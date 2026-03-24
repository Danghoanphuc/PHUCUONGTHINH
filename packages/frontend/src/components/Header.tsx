"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  X,
  Menu,
  CalendarCheck,
  Settings,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { MegaMenu } from "@/components/MegaMenu";
import { useAuth } from "@repo/shared-utils";
import { authService } from "@/lib/auth-service";

const navLinks = [
  { href: "/thiet-ke", label: "Thiết kế" },
  { href: "/thi-cong", label: "Thi công" },
  { href: "/du-an", label: "Dự án" },
  { href: "/ve-chung-toi", label: "Về chúng tôi" },
  { href: "/lien-he", label: "Liên hệ" },
];

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [compactMenuOpen, setCompactMenuOpen] = useState(false);
  const pathname = usePathname();
  const isProductsPage = pathname === "/products";
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    authService.logout();
  };

  const compactNavLinks = [
    { href: "/thiet-ke", label: "Thiết kế" },
    { href: "/thi-cong", label: "Thi công" },
    { href: "/du-an", label: "Dự án" },
    { href: "/ve-chung-toi", label: "Về chúng tôi" },
  ];

  const isProductDetailPage =
    pathname.startsWith("/products/") && pathname !== "/products";

  if (isProductsPage || isProductDetailPage) {
    return (
      <>
        {/* Admin toolbar cho trang products */}
        {isAuthenticated && (
          <div className="fixed top-0 left-0 right-0 z-[60] bg-[#0a192f] text-white text-xs flex items-center justify-between px-4 h-8">
            <div className="flex items-center gap-3">
              <span className="text-gray-400">Chế độ Admin</span>
              <span className="text-gray-500">·</span>
              <span className="text-emerald-400 font-medium">
                {user?.email}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-1.5 px-3 py-1 rounded hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
              >
                <LayoutDashboard size={12} />
                Dashboard
              </Link>
              <Link
                href="/admin/products"
                className="flex items-center gap-1.5 px-3 py-1 rounded hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
              >
                <Settings size={12} />
                Quản lý SP
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1 rounded hover:bg-red-500/20 transition-colors text-gray-400 hover:text-red-400"
              >
                <LogOut size={12} />
                Đăng xuất
              </button>
            </div>
          </div>
        )}
        <div
          className={`fixed right-4 z-50 ${isAuthenticated ? "top-12" : "top-4"}`}
        >
          <div className="bg-brand-secondary rounded-xl shadow-lg border border-brand-paper p-4 flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 shrink-0 hover:opacity-80 transition-opacity"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 22 22"
                fill="none"
                aria-hidden="true"
              >
                <rect width="22" height="22" fill="#8B2E16" />
                <path d="M4 4h6v3H7v2h3v3H7v6H4V4z" fill="#F5F0E8" />
                <path d="M12 4h6v14h-3v-5.5h-3V9.5h3V7h-3V4z" fill="#F5F0E8" />
              </svg>
              <span className="font-black text-[12px] tracking-tight text-brand-primary uppercase leading-none">
                Phú Cường Thịnh
              </span>
            </Link>
            <span className="w-px h-5 bg-brand-paper" />

            <div className="relative">
              <button
                onClick={() => setCompactMenuOpen(!compactMenuOpen)}
                className="flex items-center gap-1 text-brand-primary/70 hover:text-brand-primary text-[12px] font-medium transition-colors"
              >
                Menu
                <ChevronDown
                  size={13}
                  className={`transition-transform ${compactMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {compactMenuOpen && (
                <div className="absolute top-full right-0 mt-2 bg-brand-secondary border border-brand-paper rounded-lg shadow-lg py-2 min-w-[140px]">
                  {compactNavLinks.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setCompactMenuOpen(false)}
                      className="block px-4 py-2 text-[12px] text-brand-primary/70 hover:text-brand-primary hover:bg-brand-paper/50 transition-colors"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <span className="w-px h-5 bg-brand-paper" />
            <a
              href="https://zalo.me"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-brand-primary text-brand-secondary text-[12px] font-bold px-3 py-1.5 rounded-lg hover:bg-[#6e2411] transition-colors whitespace-nowrap"
            >
              <CalendarCheck size={13} />
              Đặt lịch
            </a>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Admin toolbar — chỉ hiện khi đã đăng nhập */}
      {isAuthenticated && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-[#0a192f] text-white text-xs flex items-center justify-between px-4 h-8">
          <div className="flex items-center gap-3">
            <span className="text-gray-400">Chế độ Admin</span>
            <span className="text-gray-500">·</span>
            <span className="text-emerald-400 font-medium">{user?.email}</span>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1.5 px-3 py-1 rounded hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
            >
              <LayoutDashboard size={12} />
              Dashboard
            </Link>
            <Link
              href={`/admin/products`}
              className="flex items-center gap-1.5 px-3 py-1 rounded hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
            >
              <Settings size={12} />
              Quản lý SP
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1 rounded hover:bg-red-500/20 transition-colors text-gray-400 hover:text-red-400"
            >
              <LogOut size={12} />
              Đăng xuất
            </button>
          </div>
        </div>
      )}
      <div
        className={`fixed left-0 right-0 z-50 px-4 pt-3 ${isAuthenticated ? "top-8" : "top-0"}`}
      >
        <header className="bg-brand-secondary rounded-xl shadow-[0_4px_24px_0_rgba(139,46,22,0.12)] border border-brand-paper">
          <div className="relative flex items-center h-[58px] px-5">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <svg
                width="20"
                height="20"
                viewBox="0 0 22 22"
                fill="none"
                aria-hidden="true"
              >
                <rect width="22" height="22" fill="#8B2E16" />
                <path d="M4 4h6v3H7v2h3v3H7v6H4V4z" fill="#F5F0E8" />
                <path d="M12 4h6v14h-3v-5.5h-3V9.5h3V7h-3V4z" fill="#F5F0E8" />
              </svg>
              <span className="font-black text-[13px] tracking-tight text-brand-primary uppercase leading-none">
                Phú Cường<span className="text-brand-accent">Thịnh</span>
              </span>
            </Link>

            {/* Nav — căn giữa tuyệt đối */}
            {/* Đã thêm h-full để MegaMenu dropdown bám sát mép dưới của Header */}
            <nav className="hidden lg:flex items-center h-full absolute left-1/2 -translate-x-1/2">
              {/* Sản phẩm — có MegaMenu */}
              {/* Đã bỏ 'relative' ở div này để MegaMenu lấy <nav> làm hệ quy chiếu căn giữa */}
              <div className="group/products h-full flex items-center">
                <Link
                  href="/products"
                  className="group relative flex items-center gap-0.5 px-4 py-1 text-[13px] text-brand-primary/70 hover:text-brand-primary font-normal transition-colors whitespace-nowrap"
                >
                  Sản phẩm
                  <ChevronDown
                    size={12}
                    className="text-brand-primary/40 mt-px group-hover/products:rotate-180 transition-transform duration-200"
                  />
                  <span className="absolute bottom-[-4px] left-4 right-4 h-px bg-brand-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
                </Link>
                {/* MegaMenu Component */}
                <MegaMenu />
              </div>

              {/* Các link còn lại */}
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="group relative flex items-center gap-0.5 px-4 py-1 text-[13px] text-brand-primary/70 hover:text-brand-primary font-normal transition-colors whitespace-nowrap"
                >
                  {label}
                  <span className="absolute bottom-[-4px] left-4 right-4 h-px bg-brand-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => setSearchOpen((v) => !v)}
                className="p-2 text-brand-primary/60 hover:text-brand-primary transition-colors"
                aria-label="Tìm kiếm"
              >
                {searchOpen ? <X size={17} /> : <Search size={17} />}
              </button>

              <span className="w-px h-4 bg-brand-paper mx-0.5" />

              <button className="flex items-center gap-0.5 px-2.5 py-1 text-[13px] text-brand-primary/60 hover:text-brand-primary transition-colors">
                VI
                <ChevronDown
                  size={12}
                  className="text-brand-primary/40 mt-px"
                />
              </button>

              <span className="w-px h-4 bg-brand-paper mx-0.5" />

              <a
                href="https://zalo.me"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 flex items-center gap-1.5 bg-brand-primary text-brand-secondary text-[13px] font-bold px-4 py-2 rounded-lg hover:bg-[#6e2411] transition-colors whitespace-nowrap"
              >
                <CalendarCheck size={14} />
                Đặt Lịch Trải Nghiệm Showroom
              </a>

              <button
                className="lg:hidden p-2 ml-1 text-brand-primary/60 hover:text-brand-primary transition-colors"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Search expand */}
          {searchOpen && (
            <div className="border-t border-brand-paper px-6 py-3">
              <div className="flex items-center gap-3">
                <Search size={15} className="text-brand-primary/40 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Nhập mã gạch, tên thiết bị vệ sinh..."
                  className="flex-1 text-sm text-brand-primary bg-transparent outline-none placeholder-brand-primary/30 border-b border-brand-paper focus:border-brand-primary pb-1 transition-colors"
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="text-xs text-brand-primary/40 hover:text-brand-primary transition-colors whitespace-nowrap"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </header>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-brand-secondary pt-[80px]">
          <nav className="flex flex-col px-6 pt-4">
            <Link
              href="/products"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between py-4 border-b border-brand-paper text-sm text-brand-primary font-medium"
            >
              Sản phẩm
              <ChevronDown size={14} className="text-brand-primary/40" />
            </Link>
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between py-4 border-b border-brand-paper text-sm text-brand-primary hover:text-brand-primary/60 font-medium transition-colors"
              >
                {label}
              </Link>
            ))}
            <a
              href="https://zalo.me"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex items-center justify-center gap-2 bg-brand-primary text-brand-secondary font-bold px-4 py-3 rounded-lg text-sm hover:bg-[#6e2411] transition-colors"
            >
              <CalendarCheck size={16} />
              Đặt Lịch Trải Nghiệm Showroom
            </a>
          </nav>
        </div>
      )}
    </>
  );
}
