"use client";

import { useState, useEffect } from "react";
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
  CalendarDays,
  ShoppingCart,
} from "lucide-react";
import { MegaMenu } from "@/components/MegaMenu";
import { useAuth } from "@repo/shared-utils";
import { authService } from "@/lib/auth-service";
import { useQuoteCart } from "@/lib/wishlist-context";
import { LeadNotificationBadge } from "@/components/admin/LeadNotificationBadge";

// Bảng màu
const palette = {
  be: "#FDF5E6", // Màu kem nền
  brown: "#804000", // Màu nâu chữ
  lightBrown: "#D2B48C", // Màu nâu nhạt (đường kẻ)
};

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
  const [isScrolled, setIsScrolled] = useState(false);

  const pathname = usePathname();
  const isProductsPage = pathname === "/products";
  const isProductDetailPage =
    pathname.startsWith("/products/") && pathname !== "/products";
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useQuoteCart();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // Logic màu sắc động cho Header chính
  const textColor = isScrolled ? palette.brown : "#FFFFFF";
  const borderColor = isScrolled
    ? "rgba(128, 64, 0, 0.1)"
    : "rgba(255, 255, 255, 0.5)";
  const dividerColor = isScrolled
    ? palette.lightBrown
    : "rgba(255, 255, 255, 0.3)";

  if (isProductsPage || isProductDetailPage) {
    return (
      <>
        {/* Admin toolbar */}
        {isAuthenticated && (
          <div className="fixed top-0 left-0 right-0 z-[60] bg-[#0a192f] text-white text-xs flex items-center justify-between px-3 md:px-4 h-8 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-gray-400">
                Chế độ Admin
              </span>
              <span className="hidden sm:inline text-gray-500">·</span>
              <span className="text-emerald-400 font-medium truncate max-w-[120px] sm:max-w-none">
                {user?.email}
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
              >
                <LayoutDashboard size={12} />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <LeadNotificationBadge />
              <Link
                href="/admin/products"
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
              >
                <Settings size={12} />
                <span className="hidden sm:inline">Quản lý SP</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-red-500/20 transition-colors text-gray-400 hover:text-red-400"
              >
                <LogOut size={12} />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        )}
        <div
          className={`fixed right-3 md:right-4 z-50 transition-all duration-300 ${isAuthenticated ? "top-12" : "top-4"} ${isScrolled ? "opacity-90 hover:opacity-100" : ""}`}
        >
          <div className="bg-[#FDF5E6] rounded-full shadow-lg border border-gray-200/50 p-2 pr-3 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 shrink-0 pl-1">
              <img
                src="/favicon.png"
                alt="Phú Cường Thịnh"
                className="size-8 rounded-xl object-cover"
              />
              <span
                style={{ color: "#8B1A1A" }}
                className="font-black text-[12px] tracking-tight uppercase leading-none"
              >
                Phú Cường Thịnh
              </span>
            </Link>
            <span
              style={{ backgroundColor: palette.lightBrown }}
              className="w-px h-5 opacity-40"
            />
            <div className="relative">
              <button
                onClick={() => setCompactMenuOpen(!compactMenuOpen)}
                style={{ color: palette.brown }}
                className="flex items-center gap-1 text-[12px] font-medium transition-colors hover:text-opacity-80"
              >
                Menu{" "}
                <ChevronDown
                  size={13}
                  className={`transition-transform ${compactMenuOpen ? "rotate-180" : ""}`}
                />
              </button>
              {compactMenuOpen && (
                <div className="absolute top-full right-0 mt-2 bg-[#FDF5E6] border border-gray-200/50 rounded-lg shadow-lg py-2 min-w-[140px] z-10">
                  {compactNavLinks.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setCompactMenuOpen(false)}
                      style={{ color: palette.brown }}
                      className="block px-4 py-2 text-[12px] hover:text-opacity-80 transition-colors"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <span
              style={{ backgroundColor: palette.lightBrown }}
              className="w-px h-5 opacity-40"
            />
            <Link
              href="/cart"
              style={{ color: palette.brown }}
              className="relative p-2 hover:text-opacity-80 transition-colors"
              title="Giỏ hàng"
            >
              <ShoppingCart size={16} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            <span
              style={{ backgroundColor: palette.lightBrown }}
              className="w-px h-5 opacity-40"
            />
            <a
              href="https://zalo.me"
              target="_blank"
              rel="noopener noreferrer"
              style={{ backgroundColor: palette.brown }}
              className="flex items-center gap-1.5 text-white text-[12px] font-bold px-4 py-2 rounded-full hover:bg-opacity-90 transition-colors whitespace-nowrap shadow-sm"
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
      {isAuthenticated && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-[#0a192f] text-white text-xs flex items-center justify-between px-3 md:px-4 h-8 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-gray-400">Chế độ Admin</span>
            <span className="hidden sm:inline text-gray-500">·</span>
            <span className="text-emerald-400 font-medium truncate max-w-[120px] sm:max-w-none">
              {user?.email}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
            >
              <LayoutDashboard size={12} />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <LeadNotificationBadge />
            <Link
              href={`/admin/products`}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
            >
              <Settings size={12} />
              <span className="hidden sm:inline">Quản lý SP</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-red-500/20 transition-colors text-gray-400 hover:text-red-400"
            >
              <LogOut size={12} />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Header Container */}
      <div
        className={`fixed left-0 right-0 z-50 transition-all duration-300 ease-in-out px-4 pt-4 ${
          isAuthenticated ? "top-8" : "top-0"
        }`}
      >
        <header
          style={{ borderColor: borderColor }}
          className={`transition-all duration-300 ease-in-out border rounded-full mx-auto max-w-[1920px] ${
            isScrolled
              ? "bg-[#FDF5E6]/95 backdrop-blur-md shadow-lg"
              : "bg-transparent backdrop-blur-sm"
          }`}
        >
          <div
            className={`flex items-center justify-between transition-all duration-300 ease-in-out px-6 ${
              isScrolled ? "h-[70px]" : "h-[80px]"
            }`}
          >
            {/* Logo */}
            <div className="flex-1 flex justify-start">
              <Link href="/" className="flex items-center shrink-0">
                <img
                  src={isScrolled ? "/dacuon.png" : "/chuacuon.png"}
                  alt="Phú Cường Thịnh Logo"
                  className={`object-contain transition-all duration-300 ${
                    isScrolled ? "h-[50px]" : "h-[60px]"
                  }`}
                />
              </Link>
            </div>

            {/* Nav Links */}
            <nav className="hidden lg:flex shrink-0 items-center justify-center gap-1">
              <div className="group/products h-full flex items-center">
                <Link
                  href="/products"
                  style={{ color: textColor }}
                  className="group relative flex items-center gap-1 px-4 py-2 text-[14px] font-medium transition-opacity hover:opacity-70 whitespace-nowrap"
                >
                  Sản phẩm
                  <ChevronDown
                    size={14}
                    className="mt-px group-hover/products:rotate-180 transition-transform duration-200"
                  />
                </Link>
                <MegaMenu />
              </div>

              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  style={{ color: textColor }}
                  className="group relative flex items-center gap-0.5 px-4 py-2 text-[14px] font-medium transition-opacity hover:opacity-70 whitespace-nowrap"
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex-1 flex items-center justify-end gap-3 lg:gap-4">
              <button
                onClick={() => setSearchOpen((v) => !v)}
                style={{ color: textColor }}
                className="p-2 transition-opacity hover:opacity-70"
                aria-label="Tìm kiếm"
              >
                {searchOpen ? <X size={18} /> : <Search size={18} />}
              </button>

              <span
                style={{ backgroundColor: dividerColor }}
                className="w-px h-5 transition-colors duration-300"
              />

              <Link
                href="/cart"
                style={{ color: textColor }}
                className="relative p-2 transition-opacity hover:opacity-70"
                aria-label="Giỏ hàng"
              >
                <ShoppingCart size={18} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {itemCount}
                  </span>
                )}
              </Link>

              <span
                style={{ backgroundColor: dividerColor }}
                className="w-px h-5 transition-colors duration-300"
              />

              <button
                style={{ color: textColor }}
                className="flex items-center gap-1 px-2 py-2 text-[13px] font-medium transition-opacity hover:opacity-70"
              >
                VI
                <ChevronDown size={13} className="opacity-80 mt-px" />
              </button>

              <span
                style={{ backgroundColor: dividerColor }}
                className="w-px h-5 transition-colors duration-300"
              />

              {!isAuthenticated && (
                <Link
                  href="/admin/login"
                  style={{
                    color: textColor,
                    borderColor: isScrolled ? palette.brown : "#FFFFFF",
                  }}
                  className="hidden sm:flex items-center gap-1.5 px-5 py-2 text-[13px] font-semibold rounded-full border transition-all hover:bg-white/10 whitespace-nowrap"
                >
                  <LogOut size={14} className="rotate-180" />
                  Đăng nhập
                </Link>
              )}

              <a
                href="https://zalo.me"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: isScrolled ? palette.brown : "#FFFFFF",
                  color: isScrolled ? "#FFFFFF" : palette.brown,
                }}
                className="hidden sm:flex items-center gap-2 text-[13px] font-bold px-6 py-2.5 rounded-full transition-transform hover:scale-105 whitespace-nowrap shadow-sm ml-1"
              >
                <CalendarDays size={15} />
                Đặt Lịch
              </a>

              <button
                style={{ color: textColor }}
                className="lg:hidden p-2 transition-opacity hover:opacity-70"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Menu"
              >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Thanh Search thả xuống */}
          {searchOpen && (
            <div
              style={{
                backgroundColor: isScrolled
                  ? palette.be
                  : "rgba(255,255,255,0.1)",
                borderColor: borderColor,
              }}
              className="border-t px-6 py-4 rounded-b-3xl backdrop-blur-md"
            >
              <div className="flex items-center gap-3 max-w-2xl mx-auto">
                <Search
                  size={16}
                  style={{ color: textColor }}
                  className="opacity-70 shrink-0"
                />
                <input
                  autoFocus
                  type="text"
                  placeholder="Nhập mã gạch, tên thiết bị vệ sinh..."
                  style={{ color: textColor, borderColor: dividerColor }}
                  className="flex-1 text-sm bg-transparent outline-none placeholder:opacity-50 border-b pb-1.5 transition-colors focus:border-opacity-100"
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  style={{ color: textColor }}
                  className="text-xs font-medium hover:opacity-70 transition-opacity whitespace-nowrap"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </header>
      </div>

      {/* Mobile drawer (Giữ nguyên phong cách lơ lửng) */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-4 z-40 bg-[#FDF5E6]/95 backdrop-blur-xl rounded-3xl shadow-2xl pt-[80px] overflow-hidden border border-gray-200/50">
          <nav className="flex flex-col px-6 pt-6 h-full overflow-y-auto pb-6">
            <Link
              href="/products"
              onClick={() => setMobileOpen(false)}
              style={{ color: palette.brown, borderColor: palette.lightBrown }}
              className="flex items-center justify-between py-4 border-b opacity-100 text-sm font-medium"
            >
              Sản phẩm
              <ChevronDown
                size={14}
                style={{ color: palette.brown }}
                className="opacity-40"
              />
            </Link>
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                style={{
                  color: palette.brown,
                  borderColor: palette.lightBrown,
                }}
                className="flex items-center justify-between py-4 border-b opacity-100 text-sm hover:text-opacity-60 font-medium transition-colors"
              >
                {label}
              </Link>
            ))}

            <div className="mt-8 flex flex-col gap-4">
              {!isAuthenticated && (
                <Link
                  href="/admin/login"
                  onClick={() => setMobileOpen(false)}
                  style={{ color: palette.brown, borderColor: palette.brown }}
                  className="flex items-center justify-center gap-2 border-2 font-bold px-4 py-3.5 rounded-full text-sm hover:bg-black/5 transition-colors"
                >
                  <LogOut size={16} className="rotate-180" />
                  Đăng nhập
                </Link>
              )}

              <a
                href="https://zalo.me"
                target="_blank"
                rel="noopener noreferrer"
                style={{ backgroundColor: palette.brown }}
                className="flex items-center justify-center gap-2 text-white font-bold px-4 py-3.5 rounded-full text-sm hover:bg-opacity-90 transition-colors shadow-sm"
              >
                <CalendarDays size={16} />
                Đặt Lịch Trải Nghiệm Showroom
              </a>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
