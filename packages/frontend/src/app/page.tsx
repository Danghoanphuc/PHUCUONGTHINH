"use client";

import { useState } from "react";
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
} from "lucide-react";
import Link from "next/link";

// ─── 1. Hero Section ────────────────────────────────────────────────────────
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
        <source
          src="https://assets.mixkit.co/videos/preview/mixkit-construction-worker-laying-tiles-42953-large.mp4"
          type="video/mp4"
        />
      </video>
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl text-white"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-6">
            <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-sm font-medium text-gray-200 tracking-wide uppercase">
              Phú Cường Thịnh - Vững Bước Công Trình
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black leading-tight mb-4 md:mb-6 tracking-tight">
            Tiên Phong Giải Pháp <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-200">
              Gạch Khổ Lớn & Kiến Trúc xanh
            </span>
          </h1>

          <p className="text-gray-300 text-sm md:text-lg mb-6 md:mb-8 max-w-xl leading-relaxed">
            Đơn vị dẫn đầu chuỗi cung ứng vật liệu xây dựng cho các đại dự án.
            Mang công nghệ gạch kháng khuẩn và gạch ốp lát khổ lớn vào mọi công
            trình đẳng cấp.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-6 md:mb-8">
            <a
              href="https://zalo.me"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#0068FF] hover:bg-blue-700 text-white font-bold px-6 py-3.5 md:px-8 md:py-4 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30"
            >
              <PhoneCall size={18} />
              Tư Vấn Miễn Phí
            </a>
            <Link
              href="/ve-chung-toi"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-md text-white font-semibold px-6 py-3.5 md:px-8 md:py-4 rounded-xl transition-all"
            >
              <FileText size={18} />
              Hồ Sơ Năng Lực
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

// ─── 2. Trust Brands ────────────────────────────────────────────────────────
function TrustBrandsSection() {
  const brands = [
    "EUROTILE",
    "VIGLACERA",
    "TOTO",
    "INAX",
    "DONG TAM",
    "TAICERA",
  ];
  return (
    <div className="bg-white border-b border-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest shrink-0 text-center md:text-left">
          ĐỐI TÁC PHÂN PHỐI:
        </p>
        <div className="flex gap-4 md:gap-8 overflow-x-auto w-full no-scrollbar justify-start md:justify-between opacity-60 grayscale hover:grayscale-0 transition-all duration-500 pb-1">
          {brands.map((brand) => (
            <span
              key={brand}
              className="text-base md:text-xl font-black text-gray-800 tracking-tighter shrink-0"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 3. Category Funnel ─────────────────────────────────────────────────────
const categories = [
  {
    name: "Gạch Khổ Nhỏ & Trang Trí",
    desc: "Gạch mosaic, gạch ốp tường, gạch trang trí nghệ thuật cho không gian tinh tế",
    img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80",
    link: "/products?category=gach-kho-nho",
  },
  {
    name: "Gạch Khổ Lớn",
    desc: "Big Slab, gạch 60x120, 80x160 - Giải phóng giới hạn thiết kế hiện đại",
    img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80",
    link: "/products?category=gach-kho-lon",
  },
  {
    name: "Thiết Bị Vệ Sinh & Bếp",
    desc: "Bồn cầu, lavabo, vòi sen, thiết bị bếp thông minh tiết kiệm năng lượng",
    img: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&q=80",
    link: "/products?category=thiet-bi-ve-sinh",
  },
  {
    name: "Phụ Kiện",
    desc: "Keo dán, vữa chà ron, thanh nẹp, gạt nước - Hoàn thiện mọi chi tiết",
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

// ─── 4. BOQ Lead Magnet ─────────────────────────────────────────────────────
function BOQLeadMagnet() {
  const [phone, setPhone] = useState("");

  return (
    <section className="py-24 px-4 bg-[#0a192f] text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[600px] h-[600px] bg-emerald-600/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-emerald-400 font-semibold text-sm mb-6 border border-emerald-500/30">
          <Star size={16} className="fill-emerald-400" />
          Hỗ trợ bóc tách khối lượng (BOQ) miễn phí
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
          Bạn Đã Có Bản Vẽ Thiết Kế?
        </h2>
        <p className="text-gray-400 text-base md:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
          Đừng mất thời gian tự nhẩm tính. Gửi bản vẽ cho Phú Cường Thịnh, đội
          ngũ kỹ thuật sẽ gửi lại{" "}
          <strong className="text-white">Bảng báo giá dự án chi tiết</strong>{" "}
          kèm mức chiết khấu đại lý trong{" "}
          <strong className="text-emerald-400">30 Phút</strong>.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Số điện thoại / Zalo..."
            className="flex-1 px-4 py-3.5 md:px-6 md:py-4 rounded-xl text-gray-900 text-base outline-none border-2 border-transparent focus:border-emerald-400 transition-colors"
          />
          <button className="bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-gray-900 font-bold px-6 py-3.5 md:px-8 md:py-4 rounded-xl transition-all shadow-lg text-base whitespace-nowrap">
            Nhận báo giá ngay
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── 5. Core Values (USPs) ──────────────────────────────────────────────────
const usps = [
  {
    icon: Star,
    title: "Tiên Phong Big Slab",
    desc: "Nhà phân phối đầu tiên mang các dòng gạch khổ lớn (Big Slab) về Việt Nam, giải phóng mọi giới hạn thiết kế.",
  },
  {
    icon: ShieldCheck,
    title: "Công Nghệ Kháng Khuẩn",
    desc: "Cung cấp các giải pháp gạch ốp lát công nghệ cao, bảo vệ sức khỏe và đáp ứng tiêu chuẩn y tế khắt khe.",
  },
  {
    icon: Leaf,
    title: "Kiến Trúc Xanh",
    desc: "Cam kết cung ứng vật liệu thân thiện với môi trường, chung tay kiến tạo các dự án xanh và bền vững.",
  },
  {
    icon: Warehouse,
    title: "Đối Tác B2B Tin Cậy",
    desc: "Kinh nghiệm phục vụ chuỗi dự án lớn. Tổng kho 10.000m² đảm bảo tiến độ và ngân sách tuyệt đối.",
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

export default function Home() {
  return (
    <main className="min-h-screen bg-white selection:bg-emerald-200 selection:text-gray-900">
      <HeroSection />
      <TrustBrandsSection />
      <CategoryFunnel />
      <USPSection />
      <BOQLeadMagnet />
    </main>
  );
}
