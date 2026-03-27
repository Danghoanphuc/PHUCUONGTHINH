"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { MobileBottomNav } from "@/components/admin/MobileBottomNav";
import { MobileTopBar } from "@/components/admin/MobileTopBar";
import { useAuth } from "@repo/shared-utils";
import { usePathname } from "next/navigation";

export function PublicShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Trang login không cần shell
  const isLoginPage = pathname === "/admin/login";
  if (isLoginPage) return <>{children}</>;

  // Khi đã đăng nhập: sidebar desktop + bottom nav mobile
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen bg-[#f8f9fb]">
        {/* Desktop sidebar — hidden on mobile */}
        <AdminSidebar />

        {/* Content — full width on mobile, offset on desktop */}
        <div className="flex-1 min-h-screen lg:ml-60 admin-content flex flex-col">
          <MobileTopBar onMenuOpen={() => setMobileMenuOpen(true)} />
          {children}
        </div>

        {/* Mobile bottom nav */}
        <MobileBottomNav onMenuOpen={() => setMobileMenuOpen(true)} />
      </div>
    );
  }

  // Khách chưa đăng nhập: layout bình thường
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
