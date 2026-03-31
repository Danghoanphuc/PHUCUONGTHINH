"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Warehouse,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  Leaf,
  Star,
  Package,
  FolderTree,
  Users,
  Plus,
  Upload,
  TrendingUp,
  TrendingDown,
  Activity,
  ShoppingBag,
  AlertCircle,
  ChevronRight,
  Clock,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@repo/shared-utils";
import { productService } from "@/lib/product-service";

// Bảng màu đồng bộ thương hiệu
const palette = {
  be: "#FDF5E6",
  beDarker: "#F5EAD6",
  brown: "#804000",
  lightBrown: "#D2B48C",
};

// ─── COMPONENT BIỂU ĐỒ MINI (ADMIN) ──────────────────────────────────────────
function Sparkline({
  data,
  color = palette.brown,
}: {
  data: number[];
  color?: string;
}) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const w = 80,
    h = 32;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MiniBar({
  data,
  color = palette.brown,
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div
            className="w-full rounded-t-md transition-all duration-300 group-hover:opacity-100"
            style={{
              height: `${(d.value / max) * 52}px`,
              backgroundColor: color,
              opacity: 0.4 + (i / data.length) * 0.4,
            }}
          />
          <span className="text-[10px] text-[#804000]/50 font-bold truncate w-full text-center group-hover:text-[#804000]">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── ADMIN BENTO CARDS ────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  sparkData,
  href,
}: any) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-[32px] p-6 border border-[#804000]/10 shadow-sm hover:shadow-[0_20px_40px_rgba(128,64,0,0.06)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden relative"
    >
      <div className="relative z-10 flex items-start justify-between mb-6">
        <div
          style={{ backgroundColor: palette.be }}
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
        >
          <Icon
            size={24}
            style={{ color: palette.brown }}
            className="opacity-80"
          />
        </div>
        {trend && (
          <span
            className={`flex items-center gap-0.5 text-xs font-bold px-3 py-1.5 rounded-full ${trend.up ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}
          >
            {trend.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trend.value}%
          </span>
        )}
      </div>
      <div className="relative z-10">
        <p
          style={{ color: palette.brown }}
          className="text-4xl font-black tracking-tighter mb-1"
        >
          {value}
        </p>
        <p
          style={{ color: palette.brown }}
          className="text-sm font-bold uppercase tracking-widest opacity-60"
        >
          {label}
        </p>
        {sub && (
          <p
            style={{ color: palette.brown }}
            className="text-xs mt-1 opacity-40 font-medium"
          >
            {sub}
          </p>
        )}
      </div>
      {sparkData && (
        <div className="absolute bottom-4 right-4 opacity-30 group-hover:opacity-100 transition-opacity">
          <Sparkline data={sparkData} color={palette.lightBrown} />
        </div>
      )}
    </Link>
  );
}

function QuickAction({ href, icon: Icon, label, desc }: any) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 p-4 bg-[#FDF5E6]/30 hover:bg-[#FDF5E6] border border-transparent hover:border-[#D2B48C]/30 rounded-2xl transition-all"
    >
      <div
        style={{ backgroundColor: palette.brown }}
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
      >
        <Icon size={18} className="text-[#FDF5E6]" />
      </div>
      <div className="flex-1 min-w-0">
        <p
          style={{ color: palette.brown }}
          className="text-sm font-bold leading-none mb-1"
        >
          {label}
        </p>
        <p
          style={{ color: palette.brown }}
          className="text-xs opacity-60 font-medium"
        >
          {desc}
        </p>
      </div>
      <ChevronRight
        size={16}
        className="text-[#804000]/30 group-hover:text-[#804000] transition-colors shrink-0 group-hover:translate-x-1"
      />
    </Link>
  );
}

// ─── ADMIN DASHBOARD SECTION ──────────────────────────────────────────────────
function AdminDashboard({
  user,
}: {
  user: { email: string; role?: string } | null;
}) {
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0 });
  const [loading, setLoading] = useState(true);
  const [recentProducts, setRecentProducts] = useState<any[]>([]);

  useEffect(() => {
    productService
      .getProducts({ page: 1, limit: 5, published: "all" as any })
      .then((all) => {
        const total = all.pagination?.total ?? 0;
        const published = (all.products ?? []).filter(
          (p) => p.is_published,
        ).length;
        setStats({ total, published, draft: total - published });
        setRecentProducts(all.products.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayName = user?.email?.split("@")[0] || "Admin";
  const capitalizedName =
    displayName.charAt(0).toUpperCase() + displayName.slice(1);
  const weeklyData = [12, 18, 14, 22, 19, 25, (stats.total % 30) + 10];

  return (
    <div className="min-h-screen bg-white pb-20 animate-in fade-in">
      {/* Màn hình ngang (Desktop Banner) */}
      <div className="hidden lg:block px-8 py-8 max-w-[1920px] mx-auto">
        <div
          style={{ backgroundColor: palette.be }}
          className="relative overflow-hidden rounded-[40px] p-10 border border-[#804000]/10 shadow-sm"
        >
          <div
            style={{ backgroundColor: palette.lightBrown }}
            className="absolute top-[-50%] right-[-10%] w-[400px] h-[400px] rounded-full blur-[80px] opacity-20 pointer-events-none"
          />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p
                style={{ color: palette.brown }}
                className="text-sm font-bold uppercase tracking-widest opacity-60 mb-2"
                suppressHydrationWarning
              >
                {new Date().toLocaleDateString("vi-VN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <h1
                style={{ color: palette.brown }}
                className="text-4xl font-black tracking-tight"
              >
                Xin chào, {capitalizedName}! 👋
              </h1>
            </div>
            <Link
              href="/admin/products/new"
              style={{ backgroundColor: palette.brown }}
              className="flex items-center gap-2 px-6 py-4 text-[#FDF5E6] rounded-2xl text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 group"
            >
              <Plus
                size={18}
                className="group-hover:rotate-90 transition-transform duration-300"
              />
              Thêm sản phẩm mới
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 max-w-[1920px] mx-auto space-y-6 pt-6 lg:pt-0">
        {/* Lưới Bento Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Tổng sản phẩm"
            value={loading ? "…" : stats.total}
            sub="trong hệ thống"
            icon={Package}
            trend={{ value: 12, up: true }}
            sparkData={weeklyData}
            href="/admin/products"
          />
          <StatCard
            label="Đã xuất bản"
            value={loading ? "…" : stats.published}
            sub="đang hiển thị"
            icon={Activity}
            trend={{ value: 8, up: true }}
            href="/admin/products"
          />
          <StatCard
            label="Bản nháp"
            value={loading ? "…" : stats.draft}
            sub="chưa sẵn sàng"
            icon={AlertCircle}
            href="/admin/products"
          />
          <StatCard
            label="Danh mục"
            value="—"
            sub="nhóm phân loại"
            icon={FolderTree}
            href="/admin/categories"
          />
        </div>

        {/* Khung nội dung chính */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Biểu đồ hoạt động */}
          <div className="lg:col-span-2 bg-white rounded-[32px] border border-[#804000]/10 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2
                  style={{ color: palette.brown }}
                  className="text-xl font-black flex items-center gap-2"
                >
                  <Activity size={20} /> Hoạt động 7 ngày
                </h2>
                <p
                  style={{ color: palette.brown }}
                  className="text-sm font-medium opacity-60 mt-1"
                >
                  Sản phẩm được thêm / cập nhật
                </p>
              </div>
            </div>
            <MiniBar
              data={["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(
                (label, i) => ({ label, value: weeklyData[i] ?? 0 }),
              )}
            />

            {/* SP Vừa cập nhật */}
            <div className="mt-10 pt-8 border-t border-[#804000]/10">
              <div className="flex items-center justify-between mb-6">
                <h3
                  style={{ color: palette.brown }}
                  className="text-sm font-bold uppercase tracking-widest opacity-80"
                >
                  Gần đây nhất
                </h3>
                <Link
                  href="/admin/products"
                  style={{ color: palette.brown }}
                  className="text-xs font-bold hover:underline"
                >
                  Xem tất cả
                </Link>
              </div>
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-3 border-[#804000] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : recentProducts.length === 0 ? (
                <p className="text-sm text-[#804000]/40 text-center font-medium">
                  Chưa có sản phẩm nào
                </p>
              ) : (
                <div className="space-y-3">
                  {recentProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-4 p-3 rounded-2xl hover:bg-[#FDF5E6]/30 transition-colors group"
                    >
                      <div
                        style={{ backgroundColor: palette.beDarker }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      >
                        <span
                          style={{ color: palette.brown }}
                          className="text-xs font-black uppercase"
                        >
                          {p.sku?.slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          style={{ color: palette.brown }}
                          className="text-sm font-bold truncate"
                        >
                          {p.name}
                        </p>
                        <p
                          style={{ color: palette.lightBrown }}
                          className="text-xs font-semibold"
                        >
                          {p.sku}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-black px-3 py-1 rounded-full ${p.is_published ? "bg-[#804000]/10 text-[#804000]" : "bg-gray-100 text-gray-500"}`}
                      >
                        {p.is_published ? "LIVE" : "NHÁP"}
                      </span>
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg bg-white shadow-sm border border-[#804000]/10"
                      >
                        <ArrowRight
                          size={14}
                          style={{ color: palette.brown }}
                        />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cột Thao tác */}
          <div className="space-y-6">
            <div className="bg-white rounded-[32px] border border-[#804000]/10 p-8 shadow-sm">
              <h2
                style={{ color: palette.brown }}
                className="text-xl font-black mb-6"
              >
                Thao tác nhanh
              </h2>
              <div className="space-y-3">
                <QuickAction
                  href="/admin/products/new"
                  icon={Plus}
                  label="Thêm sản phẩm"
                  desc="Tạo sản phẩm mới"
                />
                <QuickAction
                  href="/admin/import"
                  icon={Upload}
                  label="Import hàng loạt"
                  desc="Nhập từ file CSV/PDF"
                />
                <QuickAction
                  href="/warehouse"
                  icon={Warehouse}
                  label="Quản lý kho"
                  desc="Tồn kho & nhập xuất"
                />
                <QuickAction
                  href="/admin/leads"
                  icon={Users}
                  label="Xem leads"
                  desc="Khách hàng tiềm năng"
                />
                <QuickAction
                  href="/products"
                  icon={ShoppingBag}
                  label="Trang sản phẩm"
                  desc="Xem như khách hàng"
                />
              </div>
            </div>

            <div
              style={{ backgroundColor: palette.brown }}
              className="rounded-[32px] p-8 text-white relative overflow-hidden shadow-lg"
            >
              <div className="relative z-10">
                <Star size={24} className="mb-4 text-[#FDF5E6]" />
                <h3 className="text-lg font-black mb-2">Cần hỗ trợ?</h3>
                <p className="text-sm font-medium opacity-80 mb-6 leading-relaxed">
                  Đội ngũ kỹ thuật luôn sẵn sàng hỗ trợ bạn vận hành hệ thống.
                </p>
                <a
                  href="tel:0901234567"
                  className="inline-flex items-center justify-center w-full py-3 bg-[#FDF5E6] text-[#804000] rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform"
                >
                  Liên hệ Hotline
                </a>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PUBLIC SECTIONS (TRANG CHỦ KHÁCH HÀNG) ──────────────────────────────────
function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden bg-black">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60"
      >
        <source
          src="https://assets.mixkit.co/videos/preview/mixkit-laying-ceramic-tiles-on-a-floor-42954-large.mp4"
          type="video/mp4"
        />
      </video>
      <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-transparent to-[#804000]/30" />

      <div className="relative z-10 w-full max-w-[1920px] mx-auto px-6 lg:px-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
            <span className="flex h-2 w-2 rounded-full bg-[#FDF5E6] animate-pulse" />
            <span className="text-xs font-bold text-[#FDF5E6] uppercase tracking-widest">
              Phú Cường Thịnh
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-[1.1] mb-6 tracking-tight">
            Nghệ Thuật Của <br />
            <span style={{ color: palette.lightBrown }}>Không Gian Sống</span>
          </h1>
          <p className="text-[#FDF5E6]/80 text-base md:text-xl mb-8 max-w-xl leading-relaxed font-medium">
            Đơn vị dẫn đầu chuỗi cung ứng vật liệu kiến trúc cao cấp, gạch khổ
            lớn và thiết bị vệ sinh cho các đại dự án.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <a
              href="https://zalo.me"
              target="_blank"
              rel="noopener noreferrer"
              style={{ backgroundColor: palette.brown }}
              className="inline-flex items-center justify-center gap-2 text-white font-bold px-8 py-4 rounded-full transition-transform hover:-translate-y-1 shadow-lg text-sm"
            >
              <PhoneCall size={18} /> Tư Vấn Miễn Phí
            </a>
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-md text-white font-bold px-8 py-4 rounded-full transition-all text-sm"
            >
              <ShoppingBag size={18} /> Khám Phá Sản Phẩm
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm text-[#FDF5E6]/60 font-medium">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} style={{ color: palette.lightBrown }} />{" "}
              Tổng kho 10.000m²
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} style={{ color: palette.lightBrown }} />{" "}
              Tiêu chuẩn Châu Âu
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} style={{ color: palette.lightBrown }} />{" "}
              Giao hàng toàn quốc
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

const PUBLIC_CATEGORIES = [
  {
    name: "Gạch Khổ Lớn (Big Slab)",
    desc: "Xóa nhòa ranh giới thiết kế với kích thước vượt trội.",
    img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
    link: "/products?category=gach-kho-lon",
  },
  {
    name: "Gạch Trang Trí Cao Cấp",
    desc: "Tạo điểm nhấn nghệ thuật cho mọi không gian.",
    img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80",
    link: "/products?category=gach-trang-tri",
  },
  {
    name: "Thiết Bị Vệ Sinh",
    desc: "Tinh hoa công nghệ nước và thẩm mỹ đương đại.",
    img: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80",
    link: "/products?category=thiet-bi-ve-sinh",
  },
  {
    name: "Phụ Kiện Hoàn Thiện",
    desc: "Giải pháp thi công đồng bộ và bền vững.",
    img: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=600&q=80",
    link: "/products?category=phu-kien",
  },
];

function CategoryFunnel() {
  return (
    <section
      style={{ backgroundColor: palette.be }}
      className="py-24 px-6 lg:px-12"
    >
      <div className="max-w-[1920px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16">
          <div className="max-w-2xl">
            <h2
              style={{ color: palette.brown }}
              className="text-4xl md:text-5xl font-black mb-4 tracking-tight"
            >
              Hệ Sinh Thái <br />
              Vật Liệu
            </h2>
            <p
              style={{ color: palette.brown }}
              className="text-lg font-medium opacity-70 leading-relaxed"
            >
              Đáp ứng khắt khe nhất các tiêu chuẩn của dự án thương mại & Villa
              cao cấp.
            </p>
          </div>
          <Link
            href="/products"
            style={{ color: palette.brown }}
            className="group flex items-center gap-2 font-bold hover:opacity-70 transition-opacity mt-6 md:mt-0 px-6 py-3 border-2 border-[#804000] rounded-full"
          >
            Xem toàn bộ{" "}
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PUBLIC_CATEGORIES.map((cat, idx) => (
            <Link
              key={idx}
              href={cat.link}
              className="group block relative rounded-[32px] overflow-hidden bg-white shadow-sm hover:shadow-[0_20px_40px_rgba(128,64,0,0.08)] transition-all duration-500"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h3 className="text-2xl font-black text-white mb-2 leading-tight">
                  {cat.name}
                </h3>
                <p className="text-[#FDF5E6]/80 text-sm font-medium mb-6 line-clamp-2">
                  {cat.desc}
                </p>
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-md text-white group-hover:bg-white group-hover:text-[#804000] transition-colors">
                  <ArrowRight
                    size={20}
                    className="-rotate-45 group-hover:rotate-0 transition-transform duration-300"
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const USPS_DATA = [
  {
    icon: Star,
    title: "Tiên Phong Big Slab",
    desc: "Đơn vị đầu tiên phân phối chính thức các dòng gạch khổ lớn thượng lưu.",
  },
  {
    icon: ShieldCheck,
    title: "Công Nghệ Châu Âu",
    desc: "Bề mặt kháng khuẩn, chống trầy xước, độ bền vượt thời gian.",
  },
  {
    icon: Leaf,
    title: "Kiến Trúc Xanh",
    desc: "Vật liệu sinh thái, an toàn cho sức khỏe và môi trường sống.",
  },
  {
    icon: Warehouse,
    title: "Năng Lực Cung Ứng",
    desc: "Hệ thống kho bãi quy mô lớn, sẵn sàng đáp ứng mọi tiến độ.",
  },
];

function USPSection() {
  return (
    <section className="py-24 px-6 lg:px-12 bg-white">
      <div className="max-w-[1920px] mx-auto">
        <div className="text-center mb-20">
          <h2
            style={{ color: palette.brown }}
            className="text-4xl md:text-5xl font-black mb-6 tracking-tight"
          >
            Giá Trị Cốt Lõi
          </h2>
          <p
            style={{ color: palette.brown }}
            className="text-lg font-medium opacity-70 max-w-2xl mx-auto"
          >
            Không chỉ phân phối vật liệu, chúng tôi mang đến sự an tâm tuyệt đối
            cho chủ đầu tư và giới tinh hoa kiến trúc.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {USPS_DATA.map((usp, idx) => {
            const Icon = usp.icon;
            return (
              <div
                key={idx}
                className="p-8 rounded-[40px] bg-[#FDF5E6]/30 border border-[#804000]/5 hover:bg-[#FDF5E6] hover:border-[#804000]/20 transition-all duration-300 group text-center flex flex-col items-center"
              >
                <div
                  style={{ backgroundColor: palette.brown }}
                  className="w-20 h-20 rounded-[24px] shadow-lg flex items-center justify-center mb-8 group-hover:-translate-y-2 transition-transform duration-300"
                >
                  <Icon size={32} className="text-[#FDF5E6]" />
                </div>
                <h3
                  style={{ color: palette.brown }}
                  className="text-xl font-black mb-4"
                >
                  {usp.title}
                </h3>
                <p
                  style={{ color: palette.brown }}
                  className="opacity-70 font-medium leading-relaxed"
                >
                  {usp.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BOQLeadMagnet() {
  const [phone, setPhone] = useState("");
  return (
    <section
      style={{ backgroundColor: palette.brown }}
      className="py-32 px-6 lg:px-12 relative overflow-hidden rounded-t-[60px] mt-10"
    >
      <div
        style={{ backgroundColor: palette.lightBrown }}
        className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] rounded-full blur-[120px] opacity-20 pointer-events-none"
      />
      <div
        style={{ backgroundColor: palette.be }}
        className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-[600px] h-[600px] rounded-full blur-[100px] opacity-10 pointer-events-none"
      />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/10 backdrop-blur-sm text-[#FDF5E6] font-bold text-sm mb-8 border border-white/20">
          <FileText size={16} /> Nhận bảng tính BOQ hoàn toàn miễn phí
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-[#FDF5E6] mb-8 leading-tight tracking-tight">
          Bạn Đã Có Bản Vẽ <br className="hidden md:block" /> Thiết Kế?
        </h2>
        <p className="text-[#FDF5E6]/80 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
          Gửi bản vẽ cho Phú Cường Thịnh, chuyên gia của chúng tôi sẽ phản hồi
          kèm <strong className="text-white">Bảng dự toán chi tiết</strong> chỉ
          trong vòng 30 phút.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto bg-white/5 p-2 rounded-full backdrop-blur-md border border-white/10">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Nhập số Zalo của bạn..."
            className="flex-1 px-6 py-4 rounded-full bg-transparent text-white placeholder-white/50 text-base font-medium outline-none focus:bg-white/10 transition-colors"
          />
          <button
            style={{ backgroundColor: palette.be, color: palette.brown }}
            className="font-black px-8 py-4 rounded-full transition-transform hover:scale-105 shadow-xl text-base whitespace-nowrap"
          >
            Gửi yêu cầu
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── ROOT PAGE COMPONENT ──────────────────────────────────────────────────────
export default function Home() {
  const { isAuthenticated, user } = useAuth();

  // ROUTER: Nếu đã login thì render nguyên cụm Dashboard
  if (isAuthenticated) {
    return <AdminDashboard user={user} />;
  }

  // Nếu chưa login thì render Trang Landing Page
  return (
    <main className="min-h-screen bg-white selection:bg-[#804000]/20 selection:text-[#804000]">
      <HeroSection />
      <CategoryFunnel />
      <USPSection />
      <BOQLeadMagnet />
    </main>
  );
}
