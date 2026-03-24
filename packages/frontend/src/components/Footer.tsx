import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Youtube,
  Clock,
  Download,
  ChevronRight,
  Building2,
} from "lucide-react";

const ZALO_URL = "https://zalo.me/0901234567";

export function Footer() {
  return (
    <footer className="bg-[#0a192f] text-gray-400 pt-12 md:pt-24 pb-8 border-t border-white/10 relative overflow-hidden font-sans mt-auto">
      {/* ─── Background Elements (DNA Match) ─── */}
      <div className="absolute top-0 left-0 -translate-y-1/2 -translate-x-1/3 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 translate-y-1/2 translate-x-1/3 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[60px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* ─── Main Footer Content ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 mb-10 md:mb-16">
          {/* CỘT 1: Thương Hiệu & Triết Lý (4 columns) */}
          <div className="lg:col-span-4 pr-0 lg:pr-8">
            <Link href="/" className="inline-block mb-6 group">
              <span className="text-emerald-400 font-bold tracking-[0.2em] uppercase text-xs mb-2 block flex items-center gap-2">
                <span className="w-6 h-[2px] bg-emerald-500 inline-block"></span>
                Vật Liệu Kiến Trúc
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Phú Cường{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                  Thịnh
                </span>
              </h2>
            </Link>
            <p className="text-gray-400 leading-relaxed text-sm mb-8">
              Kiến tạo đẳng cấp. Dẫn lối kiến trúc xanh. Hơn một thập kỷ tiên
              phong phân phối gạch khổ lớn (Big Slab) & thiết bị vệ sinh cao cấp
              cho các đại dự án tại Việt Nam.
            </p>
            <a
              href="/ho-so-nang-luc.pdf"
              target="_blank"
              className="inline-flex items-center gap-2 text-sm font-bold text-white bg-white/5 hover:bg-emerald-600 px-6 py-3.5 rounded-xl transition-all border border-white/10 hover:border-emerald-500 shadow-lg"
            >
              <Download size={18} />
              Tải Hồ Sơ Năng Lực B2B
            </a>
          </div>

          {/* CỘT 2: Menu Điều Hướng (2 columns) */}
          <div className="lg:col-span-2">
            <h3 className="text-white font-bold text-sm tracking-widest uppercase mb-6">
              Khám Phá
            </h3>
            <ul className="space-y-4 text-sm font-medium">
              {[
                { label: "Về Chúng Tôi", href: "/ve-chung-toi" },
                { label: "Gạch Big Slab", href: "/products?category=big-slab" },
                { label: "Thiết Bị Vệ Sinh", href: "/products?category=tbvs" },
                { label: "Thi Công Lắp Đặt", href: "/thi-cong" },
                { label: "Thư Viện Kiến Trúc", href: "/thiet-ke" },
                { label: "Dự Án Tiêu Biểu", href: "/du-an" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors group"
                  >
                    <ChevronRight
                      size={14}
                      className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-400"
                    />
                    <span className="group-hover:translate-x-1 transition-transform">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CỘT 3: Trụ Sở & Liên Hệ (3 columns) */}
          <div className="lg:col-span-3">
            <h3 className="text-white font-bold text-sm tracking-widest uppercase mb-6">
              Liên Hệ
            </h3>
            <ul className="space-y-6 text-sm">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <Building2 size={16} className="text-emerald-400" />
                </div>
                <div>
                  <span className="block text-white font-bold mb-1">
                    Showroom & Trụ Sở
                  </span>
                  <span className="text-gray-400 leading-relaxed block">
                    123 Đường Lê Lợi, P. Phú Cường, TP. Thủ Dầu Một, Bình Dương
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <MapPin size={16} className="text-emerald-400" />
                </div>
                <div>
                  <span className="block text-white font-bold mb-1">
                    Tổng Kho B2B
                  </span>
                  <span className="text-gray-400 leading-relaxed block">
                    Khu Công Nghiệp Sóng Thần 2, Dĩ An, Bình Dương
                  </span>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <Phone size={16} className="text-emerald-400" />
                </div>
                <div>
                  <a
                    href="tel:0901234567"
                    className="text-emerald-400 font-black hover:text-emerald-300 text-lg transition-colors block"
                  >
                    0862.530.979
                  </a>
                  <span className="text-gray-500 text-xs">
                    Hotline dự án 24/7
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* CỘT 4: Chăm sóc khách hàng & Kết nối (3 columns) */}
          <div className="lg:col-span-3">
            <h3 className="text-white font-bold text-sm tracking-widest uppercase mb-6">
              Hỗ Trợ
            </h3>

            {/* Bento box nhỏ cho giờ làm việc */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-emerald-400" />
                <span className="text-white font-bold text-sm">
                  Giờ Làm Việc
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span>Thứ 2 - Thứ 7</span>
                  <span className="text-white font-medium">07:30 - 17:30</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span>Chủ Nhật</span>
                  <span className="text-white font-medium">08:00 - 12:00</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={ZALO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-[#0068FF] hover:bg-[#0055d4] text-white text-sm font-bold py-3.5 rounded-xl transition-transform hover:-translate-y-1"
              >
                <span className="font-black bg-white text-[#0068FF] w-5 h-5 flex items-center justify-center rounded text-[12px]">
                  Z
                </span>
                Zalo
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 md:w-12 md:h-12 bg-white/5 hover:bg-[#1877F2] rounded-xl flex items-center justify-center transition-all border border-white/10 hover:-translate-y-1 hover:border-transparent"
              >
                <Facebook size={18} className="text-white" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 md:w-12 md:h-12 bg-white/5 hover:bg-[#FF0000] rounded-xl flex items-center justify-center transition-all border border-white/10 hover:-translate-y-1 hover:border-transparent"
              >
                <Youtube size={18} className="text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* ─── Bottom Footer: Legal & Copyright ─── */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-gray-500 font-medium">
          <p className="text-center md:text-left">
            © {new Date().getFullYear()} Công ty TNHH MTV Thương mại Phúc Cường
            Thịnh. <br className="md:hidden" />
            <span className="md:ml-2">MST: [Cập nhật MST]</span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/privacy"
              className="hover:text-emerald-400 transition-colors"
            >
              Chính sách bảo mật
            </Link>
            <Link
              href="/terms"
              className="hover:text-emerald-400 transition-colors"
            >
              Điều khoản sử dụng
            </Link>
            <Link
              href="/shipping"
              className="hover:text-emerald-400 transition-colors"
            >
              Chính sách vận chuyển
            </Link>
            <Link
              href="/admin/login"
              className="hover:text-gray-300 transition-colors opacity-40 hover:opacity-100"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
