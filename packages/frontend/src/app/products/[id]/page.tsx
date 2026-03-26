"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Truck,
  FileCheck,
  X,
  Download,
  ZoomIn,
  MessageCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useQuoteCart } from "@/lib/wishlist-context";
import { productService } from "@/lib/product-service";
import { AppointmentForm } from "@/components/AppointmentForm";
import { ProductCard } from "@/components/ProductCard";
import { CrossSellSection } from "@/components/CrossSellSection";
import { ShippingPolicies } from "@/components/ShippingPolicies";
import {
  ProductSpecs,
  detectProductType,
  QRSection,
} from "@/components/ProductSpecs";
import { MediaShowcase } from "@/components/MediaShowcase";
import { Product } from "@/types";
import { useAuth } from "@repo/shared-utils";
import InternalProductInfo from "@/components/internal/InternalProductInfo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const ZALO_URL = "https://zalo.me/0901234567";
const TRUST_BADGES = [
  { icon: CheckCircle2, label: "Hàng chính hãng" },
  { icon: Truck, label: "Giao toàn quốc" },
  { icon: FileCheck, label: "CO / CQ đầy đủ" },
  { icon: MapPin, label: "Sẵn kho TP.HCM" },
];
const RECENT_KEY = "pct_recent_products";
const RECENT_MAX = 8;

type StockStatus = "in_stock" | "pre_order" | "coming_soon" | "out_of_stock";

function saveRecentProduct(product: Product) {
  if (typeof window === "undefined") return;
  try {
    const list: Product[] = JSON.parse(
      localStorage.getItem(RECENT_KEY) || "[]",
    );
    const next = [product, ...list.filter((p) => p.id !== product.id)].slice(
      0,
      RECENT_MAX,
    );
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
}

function getRecentProducts(excludeId: string): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const list: Product[] = JSON.parse(
      localStorage.getItem(RECENT_KEY) || "[]",
    );
    return list.filter((p) => p.id !== excludeId).slice(0, 4);
  } catch {
    return [];
  }
}

function Lightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
      >
        <X size={24} />
      </button>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative max-w-5xl max-h-[90vh] w-full h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <Image src={src} alt={alt} fill className="object-contain" />
      </motion.div>
    </motion.div>
  );
}

function StockBadge({ status }: { status: StockStatus }) {
  const map: Record<
    StockStatus,
    { label: string; cls: string; Icon: React.ElementType }
  > = {
    in_stock: {
      label: "Sẵn hàng",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Icon: CheckCircle2,
    },
    pre_order: {
      label: "Đặt trước (Order)",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      Icon: Clock,
    },
    coming_soon: {
      label: "Hàng sắp về",
      cls: "bg-blue-50 text-blue-700 border-blue-200",
      Icon: AlertCircle,
    },
    out_of_stock: {
      label: "Tạm hết",
      cls: "bg-red-50 text-red-700 border-red-200",
      Icon: X,
    },
  };
  const { label, cls, Icon } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wide ${cls}`}
    >
      <Icon size={12} />
      {label}
    </span>
  );
}

function AddToQuoteButton({
  product,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const { addItem } = useQuoteCart();
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<"m2" | "thùng" | "bộ">("m2");
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    addItem(product, quantity, unit);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  if (compact) {
    return (
      <button
        onClick={handleAdd}
        className={`flex-1 h-11 flex items-center justify-center gap-2 font-bold rounded-lg transition-all shadow-md text-sm ${isAdded ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-[#0a192f] text-white hover:bg-emerald-600 hover:shadow-emerald-500/20"}`}
      >
        <ShoppingCart size={16} />
        {isAdded ? "Đã thêm!" : "Thêm vào báo giá"}
      </button>
    );
  }
  return (
    <div className="flex flex-col sm:flex-row gap-2.5 w-full">
      <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden h-11 bg-white focus-within:border-[#0a192f] transition-colors">
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-16 px-3 h-full outline-none text-center font-semibold text-gray-900 text-sm"
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as any)}
          className="h-full px-3 bg-gray-50 border-l-2 border-gray-200 outline-none text-gray-700 font-semibold cursor-pointer text-sm"
        >
          <option value="m2">m²</option>
          <option value="thùng">Thùng</option>
          <option value="bộ">Bộ</option>
        </select>
      </div>
      <button
        onClick={handleAdd}
        className={`flex-1 h-11 flex items-center justify-center gap-2 font-bold rounded-lg transition-all shadow-lg text-white text-sm ${isAdded ? "bg-emerald-500 shadow-emerald-500/30" : "bg-[#0a192f] hover:bg-emerald-600 hover:shadow-emerald-500/30"}`}
      >
        <ShoppingCart size={16} />
        {isAdded ? "Đã thêm vào DS" : "Thêm vào DS Báo giá"}
      </button>
    </div>
  );
}

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [activeTab, setActiveTab] = useState<"specs" | "internal">("specs");
  const [internalQueryClient] = useState(() => new QueryClient());
  const ctaRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!params.id) return;
    setIsLoading(true);
    productService
      .getProductById(params.id)
      .then(async (data) => {
        setProduct(data);
        setActiveImageIndex(0);
        saveRecentProduct(data);
        setRecentProducts(getRecentProducts(data.id));
        const styleIds = data.style_tags?.map((s) => s.id) ?? [];
        if (styleIds.length > 0) {
          try {
            const related = await productService.getProducts({
              styles: styleIds,
              limit: 5,
            });
            setRelatedProducts(
              (related.products ?? [])
                .filter((p) => p.id !== data.id)
                .slice(0, 4),
            );
          } catch {}
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setIsLoading(false));
  }, [params.id]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0 },
    );
    if (ctaRef.current) observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, [product]);

  if (isLoading)
    return (
      <main className="min-h-screen bg-[#F8F9FA] py-12 px-4 pt-24 flex justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </main>
    );

  if (!product)
    return (
      <main className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center gap-4 pt-24">
        <AlertCircle size={48} className="text-gray-400" />
        <p className="text-gray-600 text-lg">Không tìm thấy sản phẩm.</p>
        <Link
          href="/products"
          className="text-emerald-600 font-semibold hover:underline"
        >
          Quay lại danh sách sản phẩm
        </Link>
      </main>
    );

  const images =
    product.media?.filter(
      (m) =>
        m.file_type?.startsWith("image") ||
        m.file_url?.match(/\.(jpg|jpeg|png|webp|svg)$/i),
    ) ?? [];
  const videos =
    product.media?.filter(
      (m) =>
        m.media_type === "video" ||
        m.file_type?.startsWith("video") ||
        m.file_url?.match(/\.(mp4|mov|webm)$/i),
    ) ?? [];
  const pdfFiles =
    product.media?.filter(
      (m) => m.media_type === "pdf" || m.file_url?.endsWith(".pdf"),
    ) ?? [];
  const activeImage = images[activeImageIndex]?.file_url || null;

  const handlePrevImage = () =>
    setActiveImageIndex((p) => (p > 0 ? p - 1 : images.length - 1));
  const handleNextImage = () =>
    setActiveImageIndex((p) => (p < images.length - 1 ? p + 1 : 0));

  const specs = product.technical_specs ?? {};
  const stockStatus: StockStatus =
    (specs["stock_status"] as StockStatus) ?? "in_stock";
  const productType = detectProductType(specs);

  return (
    <>
      <AnimatePresence>
        {lightboxSrc && (
          <Lightbox
            src={lightboxSrc}
            alt={product.name}
            onClose={() => setLightboxSrc(null)}
          />
        )}
      </AnimatePresence>

      <a
        href={`${ZALO_URL}?text=${encodeURIComponent(`Xin chào, tôi muốn hỏi về SP: ${product.name} (SKU: ${product.sku})`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#0068FF] text-white font-bold px-5 py-3.5 rounded-full shadow-[0_10px_20px_rgba(0,104,255,0.3)] hover:bg-blue-700 transition-transform hover:-translate-y-1 lg:bottom-8 lg:right-8"
      >
        <MessageCircle size={22} />
        <span className="text-sm hidden sm:inline">Tư vấn Zalo</span>
      </a>

      <main className="min-h-screen bg-[#F8F9FA] py-8 px-4 pt-8 pb-24 lg:pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 lg:gap-14 bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100">
            {/* Breadcrumb - Di chuyển vào trong khối trắng */}
            <nav className="lg:col-span-12 flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-widest">
              <Link href="/" className="hover:text-[#0a192f] transition-colors">
                Trang chủ
              </Link>
              <ChevronRight size={14} />
              <Link
                href="/products"
                className="hover:text-[#0a192f] transition-colors"
              >
                Sản phẩm
              </Link>
              <ChevronRight size={14} />
              <span className="text-emerald-600 truncate max-w-[200px] sm:max-w-xs">
                {product.sku}
              </span>
            </nav>

            {/* ── LEFT: Cột Hình ảnh (STICKY) ── */}
            <div className="lg:col-span-5 relative">
              <div className="lg:sticky lg:top-28 space-y-4">
                <div
                  className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden cursor-zoom-in group border border-gray-100"
                  onClick={() => activeImage && setLightboxSrc(activeImage)}
                >
                  {activeImage ? (
                    <>
                      <Image
                        src={activeImage}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        priority
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 backdrop-blur-[2px]">
                        <div className="bg-white/90 p-3 rounded-full shadow-lg text-gray-800">
                          <ZoomIn size={24} />
                        </div>
                      </div>
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrevImage();
                            }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2.5 shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNextImage();
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2.5 shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                          >
                            <ChevronRight size={20} />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Chưa có ảnh
                    </div>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {images.map((m, idx) => (
                      <button
                        key={m.id}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === idx ? "border-emerald-500 shadow-sm scale-105" : "border-transparent opacity-70 hover:opacity-100 hover:border-gray-200"}`}
                      >
                        <Image
                          src={m.file_url}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: Cột Thông tin (Bố cục gọn gàng, đẩy CTA lên cao) ── */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Block 1: Header (Tên, SKU, Tags, Trạng thái) */}
              <div className="border-b border-gray-100 pb-3">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <StockBadge status={stockStatus} />
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100/80 px-2.5 py-1 rounded-lg tracking-wider">
                    SKU: {product.sku}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-2xl md:text-3xl font-black text-[#0a192f] tracking-tight leading-tight">
                    {product.name}
                  </h1>
                  {product.sku && (
                    <div className="shrink-0 hidden sm:block bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                      <QRSection
                        sku={product.sku}
                        productUrl={
                          typeof window !== "undefined"
                            ? window.location.href
                            : ""
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Tags */}
                {((product.style_tags?.length ?? 0) > 0 ||
                  (product.space_tags?.length ?? 0) > 0) && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {product.style_tags?.map((s) => (
                      <span
                        key={`style-${s.id}`}
                        className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100"
                      >
                        {s.name}
                      </span>
                    ))}
                    {product.space_tags?.map((s) => (
                      <span
                        key={`space-${s.id}`}
                        className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Mô tả ngắn */}
              {product.description && (
                <p className="text-gray-600 leading-relaxed text-sm line-clamp-2">
                  {product.description}
                </p>
              )}

              {/* Block 2: Tab bar + nội dung tab */}
              <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                {/* Tab bar — luôn hiện "Thông số", chỉ hiện "Nội bộ" khi authenticated */}
                <div className="flex border-b border-gray-100">
                  <button
                    onClick={() => setActiveTab("specs")}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                      activeTab === "specs"
                        ? "text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/40"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Thông số
                  </button>
                  {isAuthenticated && (
                    <button
                      onClick={() => setActiveTab("internal")}
                      className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                        activeTab === "internal"
                          ? "text-amber-600 border-b-2 border-amber-500 bg-amber-50/40"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      🔒 Nội bộ
                    </button>
                  )}
                </div>

                {/* Tab content */}
                <div className="p-3.5">
                  {activeTab === "specs" && (
                    <>
                      {Object.keys(specs).length > 0 ? (
                        <>
                          <h3 className="text-base font-bold text-[#0a192f] mb-2.5">
                            Thông số kỹ thuật
                          </h3>
                          <ProductSpecs specs={specs} />
                        </>
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          Chưa có thông số kỹ thuật
                        </p>
                      )}
                    </>
                  )}
                  {activeTab === "internal" && isAuthenticated && (
                    <QueryClientProvider client={internalQueryClient}>
                      <InternalProductInfo productId={product.id} />
                    </QueryClientProvider>
                  )}
                </div>
              </div>

              {/* Block 3: Khu vực CTA (Đưa xuống sau) */}
              <div
                ref={ctaRef}
                className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-100 space-y-3"
              >
                <AddToQuoteButton product={product} />
                <div className="flex gap-2.5">
                  <button
                    onClick={() => setShowAppointmentForm((v) => !v)}
                    className="flex-1 h-11 flex items-center justify-center gap-2 font-bold rounded-lg border-2 border-gray-200 text-[#0a192f] hover:border-[#0a192f] hover:bg-white transition-all text-sm"
                  >
                    <CalendarDays size={16} />
                    Xem mẫu Showroom
                  </button>
                  {pdfFiles.length > 0 && (
                    <a
                      href={pdfFiles[0].file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-11 px-3.5 flex items-center justify-center gap-2 font-bold rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all text-sm whitespace-nowrap"
                    >
                      <Download size={16} />
                      <span className="hidden sm:inline">Tải PDF</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Form đặt lịch (Chỉ hiện khi bấm nút) */}
              <AnimatePresence>
                {showAppointmentForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white border-2 border-emerald-100 rounded-xl p-4 shadow-sm">
                      <h3 className="text-base font-bold text-[#0a192f] mb-3 flex items-center gap-2">
                        <CalendarDays className="text-emerald-600" size={18} />{" "}
                        Đặt lịch tư vấn chuyên sâu
                      </h3>
                      <AppointmentForm
                        productId={product.id}
                        onSuccess={() => setShowAppointmentForm(false)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Block 5: Trust Badges (Dịch vụ & Cam kết) */}
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-100 rounded-xl p-3.5">
                <h3 className="text-xs font-bold text-[#0a192f] mb-3 uppercase tracking-wider">
                  Dịch vụ & Cam kết
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {TRUST_BADGES.map(({ icon: Icon, label }, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center gap-1.5 text-center"
                    >
                      <Icon size={20} className="text-emerald-600" />
                      <span className="text-xs font-semibold text-gray-700">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Các Khu vực bổ sung phía dưới ── */}
          <div className="mt-16 space-y-16">
            {(videos.length > 0 || images.length > 0) && (
              <MediaShowcase
                videos={videos}
                images={images}
                productName={product.name}
                onLightbox={setLightboxSrc}
              />
            )}

            <CrossSellSection
              productType={productType}
              currentProductId={product.id}
              currentCategoryId={product.category_id}
            />

            {relatedProducts.length > 0 && (
              <section>
                <h2 className="text-2xl font-black text-[#0a192f] mb-6 flex items-center gap-2">
                  <span className="w-2 h-6 bg-emerald-500 rounded-full inline-block"></span>
                  Gợi Ý Phối Hợp
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {relatedProducts.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} />
                  ))}
                </div>
              </section>
            )}

            <ShippingPolicies />

            {recentProducts.length > 0 && (
              <section>
                <h2 className="text-2xl font-black text-[#0a192f] mb-6 border-t border-gray-200 pt-10">
                  Sản Phẩm Vừa Xem
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {recentProducts.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      {/* Sticky Mobile Bar */}
      {showSticky && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3 flex gap-3 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] lg:hidden">
          <AddToQuoteButton product={product} compact />
          <Link
            href={`/contact?type=appointment&product=${product.id}`}
            className="h-12 px-4 flex items-center justify-center font-bold rounded-xl border-2 border-gray-200 text-[#0a192f] bg-gray-50 transition-all"
          >
            <CalendarDays size={18} />
          </Link>
        </div>
      )}
    </>
  );
}
