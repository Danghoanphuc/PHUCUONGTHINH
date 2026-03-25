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
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@repo/shared-utils";
import { productService } from "@/lib/product-service";

// ─── MINI SPARKLINE (SVG thuần) ──────────────────────────────────────────────
function Sparkline({
  data,
  color = "#10b981",
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
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── MINI BAR CHART ──────────────────────────────────────────────────────────
function MiniBar({
  data,
  color = "#3b82f6",
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm transition-all"
            style={{
              height: `${(d.value / max) * 52}px`,
              backgroundColor: color,
              opacity: 0.7 + (i / data.length) * 0.3,
            }}
          />
          <span className="text-[9px] text-gray-400 truncate w-full text-center">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── STAT CARD ───────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  trend,
  sparkData,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  iconBg: string;
  trend?: { value: number; up: boolean };
  sparkData?: number[];
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}
        >
          <Icon size={18} className="text-white" />
        </div>
        {trend && (
          <span
            className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${trend.up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}
          >
            {trend.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trend.value}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900 leading-none">
          {value}
        </p>
        <p className="text-xs text-gray-400 mt-1 font-medium">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {sparkData && (
        <div className="mt-auto">
          <Sparkline
            data={sparkData}
            color={trend?.up === false ? "#ef4444" : "#10b981"}
          />
        </div>
      )}
    </Link>
  );
}

// ─── QUICK ACTION ────────────────────────────────────────────────────────────
function QuickAction({
  href,
  icon: Icon,
  label,
  desc,
  color,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 p-3.5 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 rounded-xl transition-all hover:shadow-sm"
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}
      >
        <Icon size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 leading-none">
          {label}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
      <ChevronRight
        size={14}
        className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0"
      />
    </Link>
  );
}

// ─── ADMIN DASHBOARD ─────────────────────────────────────────────────────────
function AdminDashboard({
  user,
}: {
  user: { email: string; role?: string } | null;
}) {
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0 });
  const [loading, setLoading] = useState(true);
  const [recentProducts, setRecentProducts] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      productService.getProducts(1, 5, ""),
      productService.getProducts({ page: 1, limit: 5, published: true }),
    ])
      .then(([all, pub]) => {
        const total = all.pagination?.total ?? 0;
        const published = pub.pagination?.total ?? 0;
        setStats({ total, published, draft: total - published });
        setRecentProducts(all.products.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "Chào buổi sáng"
      : hour < 18
        ? "Chào buổi chiều"
        : "Chào buổi tối";

  // Fake weekly data for sparklines (replace with real API later)
  const weeklyData = [12, 18, 14, 22, 19, 25, (stats.total % 30) + 10];
  const publishedData = [8, 10, 9, 14, 12, 16, (stats.published % 20) + 5];

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Top bar — desktop only (mobile uses MobileTopBar) */}
      <div className="hidden lg:flex bg-white border-b border-gray-100 px-8 py-5 items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-0.5">
            {new Date().toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <h1 className="text-xl font-black text-gray-900">
            {greeting},{" "}
            <span className="text-emerald-600">
              {user?.email?.split("@")[0]}
            </span>{" "}
            👋
          </h1>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0a192f] hover:bg-[#0d2137] text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
        >
          <Plus size={15} /> Thêm sản phẩm
        </Link>
      </div>

      <div className="px-4 md:px-8 py-4 md:py-6 space-y-4 md:space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Tổng sản phẩm"
            value={loading ? "…" : stats.total}
            sub="trong hệ thống"
            icon={Package}
            iconBg="bg-blue-500"
            trend={{ value: 12, up: true }}
            sparkData={weeklyData}
            href="/admin/products"
          />
          <StatCard
            label="Đã đăng"
            value={loading ? "…" : stats.published}
            sub="đang hiển thị"
            icon={Activity}
            iconBg="bg-emerald-500"
            trend={{ value: 8, up: true }}
            sparkData={publishedData}
            href="/admin/products"
          />
          <StatCard
            label="Bản nháp"
            value={loading ? "…" : stats.draft}
            sub="chưa xuất bản"
            icon={AlertCircle}
            iconBg="bg-amber-500"
            href="/admin/products"
          />
          <StatCard
            label="Danh mục"
            value="—"
            sub="nhóm sản phẩm"
            icon={FolderTree}
            iconBg="bg-violet-500"
            href="/admin/categories"
          />
        </div>

        {/* Main content: chart + recent + quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Weekly activity chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Hoạt động 7 ngày
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Sản phẩm được thêm / cập nhật
                </p>
              </div>
              <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
                Tuần này
              </span>
            </div>
            <MiniBar
              data={["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(
                (label, i) => ({
                  label,
                  value: weeklyData[i] ?? 0,
                }),
              )}
              color="#3b82f6"
            />
            <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-3 gap-3">
              {[
                {
                  label: "Tổng SP",
                  value: stats.total,
                  color: "text-blue-600",
                },
                {
                  label: "Đã đăng",
                  value: stats.published,
                  color: "text-emerald-600",
                },
                { label: "Nháp", value: stats.draft, color: "text-amber-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <p className={`text-xl font-black ${color}`}>
                    {loading ? "…" : value}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">
              Thao tác nhanh
            </h2>
            <div className="space-y-2">
              <QuickAction
                href="/admin/products/new"
                icon={Plus}
                label="Thêm sản phẩm"
                desc="Tạo sản phẩm mới"
                color="bg-blue-500"
              />
              <QuickAction
                href="/admin/import"
                icon={Upload}
                label="Import hàng loạt"
                desc="Nhập từ file CSV/PDF"
                color="bg-violet-500"
              />
              <QuickAction
                href="/warehouse"
                icon={Warehouse}
                label="Quản lý kho"
                desc="Tồn kho & nhập xuất"
                color="bg-amber-500"
              />
              <QuickAction
                href="/admin/leads"
                icon={Users}
                label="Xem leads"
                desc="Khách hàng tiềm năng"
                color="bg-emerald-500"
              />
              <QuickAction
                href="/products"
                icon={ShoppingBag}
                label="Trang sản phẩm"
                desc="Xem như khách hàng"
                color="bg-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Recent products */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">
              Sản phẩm gần đây
            </h2>
            <Link
              href="/admin/products"
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              Xem tất cả <ChevronRight size={13} />
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recentProducts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              Chưa có sản phẩm nào
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 py-2.5 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-gray-400 uppercase">
                      {p.sku?.slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${p.is_published ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {p.is_published ? "Live" : "Nháp"}
                  </span>
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-blue-600 hover:underline shrink-0"
                  >
                    Sửa
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PUBLIC SECTIONS ─────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        poster="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80"
      >
        <source
          src="https://assets.mixkit.co/videos/preview/mixkit-laying-ceramic-tiles-on-a-floor-42954-large.mp4"
          type="video/mp4"
        />
      </video>
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl text-white"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-6">
            <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-gray-200 tracking-wide uppercase">
              Phú Cường Thịnh - Vững Bước Công Trình
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black leading-tight mb-4 tracking-tight">
            Tiên Phong Giải Pháp <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-200">
              Gạch Khổ Lớn & Kiến Trúc xanh
            </span>
          </h1>
          <p className="text-gray-300 text-sm md:text-lg mb-6 max-w-xl leading-relaxed">
            Đơn vị dẫn đầu chuỗi cung ứng vật liệu xây dựng cho các đại dự án.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <a
              href="https://zalo.me"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#0068FF] hover:bg-blue-700 text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg"
            >
              <PhoneCall size={18} /> Tư Vấn Miễn Phí
            </a>
            <Link
              href="/ve-chung-toi"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-md text-white font-semibold px-6 py-3.5 rounded-xl transition-all"
            >
              <FileText size={18} /> Hồ Sơ Năng Lực
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-gray-300 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-green-400" /> 10.000m² Kho
              Bãi
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-green-400" /> Tiêu chuẩn
              ISO 13006
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-green-400" /> Cấp hàng
              toàn miền Nam
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const categories = [
  {
    name: "Gạch Khổ Nhỏ & Trang Trí",
    desc: "Gạch mosaic, gạch ốp tường, gạch trang trí nghệ thuật",
    img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80",
    link: "/products?category=gach-kho-nho",
  },
  {
    name: "Gạch Khổ Lớn",
    desc: "Big Slab, gạch 60x120, 80x160 - Giải phóng giới hạn thiết kế",
    img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80",
    link: "/products?category=gach-kho-lon",
  },
  {
    name: "Thiết Bị Vệ Sinh & Bếp",
    desc: "Bồn cầu, lavabo, vòi sen, thiết bị bếp thông minh",
    img: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&q=80",
    link: "/products?category=thiet-bi-ve-sinh",
  },
  {
    name: "Phụ Kiện",
    desc: "Keo dán, vữa chà ron, thanh nẹp - Hoàn thiện mọi chi tiết",
    img: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=400&q=80",
    link: "/products?category=phu-kien",
  },
];

function CategoryFunnel() {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Hệ Sinh Thái Sản Phẩm
            </h2>
            <p className="text-gray-500 text-lg">
              Đáp ứng khắt khe nhất các tiêu chuẩn của dự án thương mại & Villa
              cao cấp.
            </p>
          </div>
          <Link
            href="/products"
            className="group flex items-center gap-2 text-primary font-bold hover:text-accent transition-colors mt-4 md:mt-0"
          >
            Xem toàn bộ danh mục{" "}
            <ArrowRight
              size={20}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((cat, idx) => (
            <Link
              key={idx}
              href={cat.link}
              className="group block relative rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{cat.desc}</p>
                <span className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-[#0068FF]">
                  Khám phá{" "}
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-1 transition-transform"
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

const usps = [
  {
    icon: Star,
    title: "Tiên Phong Big Slab",
    desc: "Nhà phân phối đầu tiên mang các dòng gạch khổ lớn (Big Slab) về Việt Nam.",
  },
  {
    icon: ShieldCheck,
    title: "Công Nghệ Kháng Khuẩn",
    desc: "Giải pháp gạch ốp lát công nghệ cao, bảo vệ sức khỏe và đáp ứng tiêu chuẩn y tế.",
  },
  {
    icon: Leaf,
    title: "Kiến Trúc Xanh",
    desc: "Cam kết cung ứng vật liệu thân thiện với môi trường, kiến tạo dự án xanh bền vững.",
  },
  {
    icon: Warehouse,
    title: "Đối Tác B2B Tin Cậy",
    desc: "Tổng kho 10.000m² đảm bảo tiến độ và ngân sách tuyệt đối.",
  },
];

function USPSection() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Giá Trị Cốt Lõi
          </h2>
          <p className="text-gray-500 text-lg">
            Chúng tôi không chỉ bán vật liệu, chúng tôi cung cấp sự an tâm cho
            công trình của bạn.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {usps.map((usp, idx) => {
            const Icon = usp.icon;
            return (
              <div
                key={idx}
                className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-emerald-600/30 transition-colors group"
              >
                <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon size={28} className="text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {usp.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm">
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
    <section className="py-24 px-4 bg-[#0a192f] text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[600px] h-[600px] bg-emerald-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-emerald-400 font-semibold text-sm mb-6 border border-emerald-500/30">
          <Star size={16} className="fill-emerald-400" /> Hỗ trợ bóc tách khối
          lượng (BOQ) miễn phí
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
          Bạn Đã Có Bản Vẽ Thiết Kế?
        </h2>
        <p className="text-gray-400 text-base md:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
          Gửi bản vẽ cho Phú Cường Thịnh, đội ngũ kỹ thuật sẽ gửi lại{" "}
          <strong className="text-white">Bảng báo giá dự án chi tiết</strong>{" "}
          trong <strong className="text-emerald-400">30 Phút</strong>.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Số điện thoại / Zalo..."
            className="flex-1 px-4 py-3.5 rounded-xl text-gray-900 text-base outline-none border-2 border-transparent focus:border-emerald-400 transition-colors"
          />
          <button className="bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-gray-900 font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg text-base whitespace-nowrap">
            Nhận báo giá ngay
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return <AdminDashboard user={user} />;
  }

  return (
    <main className="min-h-screen bg-white selection:bg-emerald-200 selection:text-gray-900">
      <HeroSection />
      <CategoryFunnel />
      <USPSection />
      <BOQLeadMagnet />
    </main>
  );
}
