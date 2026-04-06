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

// Mảng đầy đủ (Dùng khi chưa cuộn)
const navLinks = [
  { href: "/thiet-ke", label: "Thiết kế" },
  { href: "/thi-cong", label: "Thi công" },
  { href: "/du-an", label: "Dự án" },
  { href: "/ve-chung-toi", label: "Về chúng tôi" },
  { href: "/lien-he", label: "Liên hệ" },
];

// Mảng rút gọn (Dùng khi đã cuộn)
const compactNavLinks = [
  { href: "/thiet-ke", label: "Thiết kế" },
  { href: "/thi-cong", label: "Thi công" },
  { href: "/du-an", label: "Dự án" },
];

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [compactMenuOpen, setCompactMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const pathname = usePathname();
  const isProductsPage = pathname === "/products";
  const isProductDetailPage =
    (pathname.startsWith("/products/") && pathname !== "/products") ||
    pathname.startsWith("/p/");
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useQuoteCart();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "unset";
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    authService.logout();
  };

  // Màu chữ: Trắng khi chưa cuộn, Đen xám khi đã cuộn (Chuẩn iOS Monochrome)
  const textColor = isScrolled ? "#111827" : "#FFFFFF";
  const dividerColor = isScrolled
    ? "rgba(0,0,0,0.15)"
    : "rgba(255,255,255,0.3)";

  // =================== TRANG SẢN PHẨM (PILL MẶC ĐỊNH) ===================
  if (isProductsPage || isProductDetailPage) {
    return (
      <>
        {isAuthenticated && (
          <div className="fixed top-0 left-0 right-0 z-[60] bg-[#0a192f] text-white text-xs flex items-center justify-between px-3 md:px-4 h-8 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-gray-400">
                Chế độ Admin
              </span>
              <span className="text-emerald-400 font-medium truncate">
                {user?.email}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 text-gray-300"
              >
                <LayoutDashboard size={14} />{" "}
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
              >
                <LogOut size={14} />{" "}
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        )}

        <div
          className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${isAuthenticated ? "top-10" : "top-2 sm:top-4"} w-[96%] sm:w-auto max-w-[calc(100vw-16px)]`}
        >
          {/* APPLE PURE GLASSMORPHISM (bg-white/20 trong suốt) */}
          <div className="w-full bg-white/20 backdrop-blur-[24px] saturate-[1.8] rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.4)_inset] border border-white/50 p-1.5 sm:p-2 pr-2 sm:pr-3 flex items-center justify-between sm:justify-start gap-1 sm:gap-3 transition-all">
            <Link
              href="/"
              className="flex items-center gap-1.5 shrink-0 pl-1 active:scale-95 transition-transform"
            >
              <img
                src="/favicon.png"
                alt="Phú Cường Thịnh"
                className="size-6 sm:size-8 rounded-full object-cover"
              />
              <span className="hidden sm:block font-black text-[12px] tracking-tight text-gray-900 uppercase leading-none">
                Phú Cường Thịnh
              </span>
            </Link>

            <span
              style={{ backgroundColor: dividerColor }}
              className="w-px h-4 sm:h-5 opacity-40 mx-0.5 sm:mx-0"
            />

            <div className="relative shrink-0">
              <button
                onClick={() => setCompactMenuOpen(!compactMenuOpen)}
                className="flex items-center gap-0.5 sm:gap-1 text-[11px] sm:text-[12px] font-bold text-gray-900 active:scale-95 transition-transform"
              >
                Menu{" "}
                <ChevronDown
                  size={14}
                  strokeWidth={2.5}
                  className={compactMenuOpen ? "rotate-180" : ""}
                />
              </button>
              {compactMenuOpen && (
                <div className="absolute top-full left-0 mt-3 bg-white/60 backdrop-blur-[24px] saturate-[1.8] border border-white/60 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] py-2 min-w-[140px] sm:min-w-[160px] z-10 overflow-hidden">
                  {navLinks.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setCompactMenuOpen(false)}
                      className="block px-4 py-2.5 text-[12px] sm:text-[13px] font-semibold text-gray-900 hover:bg-black/5 transition-colors"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <span
              style={{ backgroundColor: dividerColor }}
              className="w-px h-4 sm:h-5 opacity-40 mx-0.5 sm:mx-0"
            />

            <Link
              href="/cart"
              className="relative p-1.5 sm:p-2 text-gray-900 active:scale-90 transition-transform shrink-0"
            >
              <ShoppingCart
                size={16}
                className="sm:w-[18px] sm:h-[18px]"
                strokeWidth={2.5}
              />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 sm:min-w-[16px] sm:h-4 flex items-center justify-center ring-2 ring-white/50">
                  {itemCount}
                </span>
              )}
            </Link>

            <span
              style={{ backgroundColor: dividerColor }}
              className="w-px h-4 sm:h-5 opacity-40 hidden min-[360px]:block"
            />

            <a
              href="https://zalo.me"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden min-[360px]:flex shrink-0 items-center gap-1 bg-gray-900 text-white text-[11px] sm:text-[12px] font-bold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full hover:scale-105 active:scale-95 transition-transform shadow-sm"
            >
              <CalendarCheck
                size={12}
                className="sm:w-[14px] sm:h-[14px]"
                strokeWidth={2.5}
              />{" "}
              <span className="hidden sm:inline">Đặt lịch</span>
            </a>
          </div>
        </div>
      </>
    );
  }

  // =================== TRANG CHỦ & CÁC TRANG KHÁC ===================
  // Lựa chọn mảng link dựa vào trạng thái cuộn
  const currentNavLinks = isScrolled ? compactNavLinks : navLinks;

  return (
    <>
      {isAuthenticated && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-[#0a192f] text-white text-xs flex items-center justify-between px-3 md:px-4 h-8 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-gray-400">Chế độ Admin</span>
            <span className="text-emerald-400 font-medium truncate max-w-[100px] sm:max-w-none">
              {user?.email}
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-0.5">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
            >
              <LayoutDashboard size={14} className="sm:w-3 sm:h-3" />{" "}
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <LeadNotificationBadge />
            <Link
              href="/admin/products"
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
            >
              <Settings size={14} className="sm:w-3 sm:h-3" />{" "}
              <span className="hidden sm:inline">Quản lý SP</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-red-500/20 transition-colors text-gray-400 hover:text-red-400"
            >
              <LogOut size={14} className="sm:w-3 sm:h-3" />{" "}
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      )}

      {/* VÙNG HEADER ĐỘNG - KÍNH TRONG SUỐT (bg-white/20) */}
      <div
        className={`fixed z-40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isAuthenticated ? "top-8" : "top-2 sm:top-4"} ${
          isScrolled
            ? "left-1/2 -translate-x-1/2 w-[98%] max-w-[1200px]" // Không gian rộng rãi, không bị thắt cổ chai
            : "left-0 right-0 px-2 sm:px-4 w-full"
        }`}
      >
        <header
          className={`flex items-center justify-between transition-all duration-500 mx-auto max-w-[1920px] ${
            isScrolled
              ? "bg-white/20 backdrop-blur-[24px] saturate-[1.8] shadow-[0_12px_40px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.4)_inset] border border-white/50 rounded-full h-[52px] sm:h-[56px] px-3 sm:px-5"
              : "bg-transparent backdrop-blur-sm border border-transparent rounded-2xl h-[60px] sm:h-[80px] px-2 sm:px-6"
          }`}
        >
          {/* CỘT TRÁI: LOGO */}
          <div className="flex-1 flex justify-start items-center">
            <Link
              href="/"
              className="flex items-center active:scale-95 transition-transform duration-200"
            >
              <img
                src={isScrolled ? "/dacuon.png" : "/chuacuon.png"}
                alt="Logo"
                className={`object-contain transition-all duration-500 ${
                  isScrolled
                    ? "h-[16px] w-[50px] sm:h-[26px] sm:w-auto"
                    : "h-[20px] w-[60px] sm:h-[40px] sm:w-auto lg:h-[56px]"
                }`}
              />
            </Link>
          </div>

          {/* CỘT GIỮA: NAV LINKS */}
          <div className="flex-none flex justify-center items-center px-1">
            <nav className="hidden lg:flex items-center justify-center gap-1 xl:gap-2 opacity-100 transition-opacity duration-300">
              {/* Nút Sản phẩm (Luôn hiển thị) */}
              <div className="group/products h-full flex items-center">
                <Link
                  href="/products"
                  style={{ color: textColor }}
                  className={`group relative flex items-center gap-1 px-2 py-2 font-bold transition-all hover:opacity-70 whitespace-nowrap ${isScrolled ? "text-[13px]" : "text-[14px]"}`}
                >
                  Sản phẩm{" "}
                  <ChevronDown
                    size={isScrolled ? 14 : 16}
                    strokeWidth={2.5}
                    className="mt-px group-hover/products:rotate-180 transition-transform duration-200"
                  />
                </Link>
                <MegaMenu />
              </div>

              {/* Các menu khác (Động: 5 mục khi chưa cuộn, 3 mục khi cuộn) */}
              {currentNavLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  style={{ color: textColor }}
                  className={`group relative flex items-center gap-0.5 px-2 py-2 font-bold transition-all hover:opacity-70 whitespace-nowrap ${isScrolled ? "text-[13px]" : "text-[14px]"}`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* CỘT PHẢI: ACTIONS */}
          <div className="flex-1 flex items-center justify-end gap-1 sm:gap-2">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              style={{ color: textColor }}
              className="p-1 sm:p-2 transition-transform active:scale-90"
            >
              {searchOpen ? (
                <X
                  size={isScrolled ? 18 : 22}
                  className="sm:w-[22px] sm:h-[22px]"
                  strokeWidth={2.5}
                />
              ) : (
                <Search
                  size={isScrolled ? 18 : 22}
                  className="sm:w-[22px] sm:h-[22px]"
                  strokeWidth={2.5}
                />
              )}
            </button>

            <Link
              href="/cart"
              style={{ color: textColor }}
              className="relative p-1 sm:p-2 transition-transform active:scale-90"
            >
              <ShoppingCart
                size={isScrolled ? 18 : 22}
                className="sm:w-[22px] sm:h-[22px]"
                strokeWidth={2.5}
              />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 sm:min-w-[16px] sm:h-4 flex items-center justify-center px-1 ring-2 ring-white/50">
                  {itemCount}
                </span>
              )}
            </Link>

            <span
              style={{ backgroundColor: dividerColor }}
              className="hidden sm:block w-px h-4 mx-1 transition-colors duration-300"
            />

            {/* Chỉ hiện Đăng nhập khi KHÔNG cuộn (!isScrolled) */}
            {!isAuthenticated && !isScrolled && (
              <Link
                href="/admin/login"
                style={{ color: textColor, borderColor: "#FFFFFF" }}
                className="hidden xl:flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-bold rounded-full border transition-all active:scale-95 whitespace-nowrap hover:opacity-70"
              >
                <LogOut size={14} strokeWidth={2.5} className="rotate-180" />{" "}
                Đăng nhập
              </Link>
            )}

            <a
              href="https://zalo.me"
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden md:flex items-center gap-1.5 text-[12px] font-bold px-4 sm:px-5 py-2 rounded-full transition-transform hover:scale-105 active:scale-95 whitespace-nowrap shadow-sm ${isScrolled ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}
            >
              <CalendarDays size={14} strokeWidth={2.5} /> Đặt Lịch
            </a>

            <button
              style={{ color: textColor }}
              className="lg:hidden p-1 sm:p-1.5 transition-transform active:scale-90"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={isScrolled ? 20 : 24} strokeWidth={2.5} />
            </button>
          </div>
        </header>

        {/* Thanh Search thả xuống */}
        {searchOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 mx-auto w-[95%] max-w-2xl bg-white/60 backdrop-blur-[24px] saturate-[1.8] border border-white/60 rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.12)] overflow-hidden animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3">
              <Search
                size={18}
                className="sm:w-5 sm:h-5 text-gray-900 opacity-70 shrink-0"
                strokeWidth={2.5}
              />
              <input
                autoFocus
                type="text"
                placeholder="Nhập mã gạch..."
                className="flex-1 text-[14px] sm:text-[15px] text-gray-900 bg-transparent outline-none placeholder:text-gray-900/40 font-semibold"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 hover:bg-black/5 rounded-full transition-colors"
              >
                <X
                  size={18}
                  className="sm:w-5 sm:h-5 text-gray-900"
                  strokeWidth={2.5}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MENU MOBILE OVERLAY */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] bg-white/60 backdrop-blur-[24px] saturate-[1.8] flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-300">
          <div className="flex items-center justify-between px-4 sm:px-6 h-[70px] sm:h-[80px] border-b border-black/5">
            <img
              src="/dacuon.png"
              alt="Logo"
              className="h-[18px] w-[55px] sm:h-[28px] sm:w-auto object-contain"
            />
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 bg-black/5 rounded-full active:scale-90 transition-transform"
            >
              <X
                size={20}
                className="sm:w-6 sm:h-6 text-gray-900"
                strokeWidth={2.5}
              />
            </button>
          </div>

          <nav className="flex flex-col px-4 sm:px-6 pt-6 sm:pt-8 flex-1 overflow-y-auto pb-10">
            <Link
              href="/products"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between py-4 sm:py-5 border-b border-black/5 text-gray-900 text-[16px] sm:text-[18px] font-bold active:scale-95 transition-transform"
            >
              Sản phẩm{" "}
              <ChevronDown
                size={18}
                className="sm:w-5 sm:h-5 opacity-40 -rotate-90"
                strokeWidth={2.5}
              />
            </Link>
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between py-4 sm:py-5 border-b border-black/5 text-gray-900 text-[16px] sm:text-[18px] font-bold active:scale-95 transition-transform"
              >
                {label}
              </Link>
            ))}
            <div className="mt-auto pt-8 flex flex-col gap-3">
              {!isAuthenticated && (
                <Link
                  href="/admin/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 bg-white text-gray-900 font-bold px-4 py-3.5 sm:py-4 rounded-full text-[15px] sm:text-[16px] active:scale-95 transition-transform shadow-md border border-gray-200"
                >
                  <LogOut
                    size={18}
                    className="sm:w-5 sm:h-5 rotate-180"
                    strokeWidth={2.5}
                  />{" "}
                  Đăng nhập
                </Link>
              )}
              <a
                href="https://zalo.me"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-gray-900 text-white font-bold px-4 py-3.5 sm:py-4 rounded-full text-[15px] sm:text-[16px] active:scale-95 transition-transform shadow-lg shadow-black/20"
              >
                <CalendarDays
                  size={18}
                  className="sm:w-5 sm:h-5"
                  strokeWidth={2.5}
                />{" "}
                Đặt Lịch Trải Nghiệm
              </a>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
