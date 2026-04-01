"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  AlertCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  Pencil,
} from "lucide-react";
import { useQuoteCart } from "@/lib/wishlist-context";
import { productService } from "@/lib/product-service";
import { AppointmentForm } from "@/components/AppointmentForm";
import { ProductCard } from "@/components/ProductCard";
import { CrossSellSection } from "@/components/CrossSellSection";
import { ShippingPolicies } from "@/components/ShippingPolicies";
import { clientCache } from "@/lib/cache-utils";
import {
  ProductSpecs,
  detectProductType,
  QRSection,
} from "@/components/ProductSpecs";
import { MediaShowcase } from "@/components/MediaShowcase";
import { Product } from "@/types";
import { useAuth } from "@repo/shared-utils";
import { apiClient } from "@/lib/admin-api-client";
import { ShareButton } from "@/components/ShareButton";
// import { useProductEvents } from "@/hooks/useProductEvents"; // DISABLED: Causing infinite reload loop

// ── Block thông tin nội bộ (chỉ admin) ───────────────────────────────────────
function InternalProductBlock({ productId }: { productId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<any>(`/products/${productId}/internal`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return null;
  if (!data)
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
        Chưa có thông tin nội bộ — thêm từ trang chỉnh sửa sản phẩm.
      </div>
    );

  const fmt = (v: number) => new Intl.NumberFormat("vi-VN").format(v) + "đ";
  const stockLabels: Record<string, { label: string; cls: string }> = {
    in_stock: {
      label: "Còn hàng",
      cls: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    low_stock: {
      label: "Sắp hết",
      cls: "text-amber-700 bg-amber-50 border-amber-200",
    },
    out_of_stock: {
      label: "Hết hàng",
      cls: "text-red-700 bg-red-50 border-red-200",
    },
    pre_order: {
      label: "Đặt trước",
      cls: "text-blue-700 bg-blue-50 border-blue-200",
    },
    discontinued: {
      label: "Ngừng kinh doanh",
      cls: "text-gray-700 bg-gray-50 border-gray-200",
    },
  };
  const stock = data.stock_status ? stockLabels[data.stock_status] : null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-amber-200 bg-amber-100/60 flex items-center justify-between">
        <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
          🔒 Thông tin nội bộ
        </span>
        {stock && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stock.cls}`}
          >
            {stock.label}
          </span>
        )}
      </div>
      <div className="px-4 py-3 space-y-4">
        {/* Giá bán */}
        {(data.price_retail != null ||
          data.price_wholesale != null ||
          data.price_dealer != null ||
          data.price_promo != null) && (
          <div>
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2">
              Giá bán
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {data.price_retail != null && (
                <div className="text-xs">
                  <p className="text-amber-600 mb-0.5">Giá bán lẻ</p>
                  <p className="font-bold text-amber-900">
                    {fmt(data.price_retail)}
                  </p>
                </div>
              )}
              {data.price_dealer != null && (
                <div className="text-xs">
                  <p className="text-amber-600 mb-0.5">Giá đại lý</p>
                  <p className="font-bold text-amber-900">
                    {fmt(data.price_dealer)}
                  </p>
                </div>
              )}
              {data.price_wholesale != null && (
                <div className="text-xs">
                  <p className="text-amber-600 mb-0.5">Giá bán sỉ</p>
                  <p className="font-bold text-amber-900">
                    {fmt(data.price_wholesale)}
                  </p>
                </div>
              )}
              {data.price_promo != null && (
                <div className="text-xs">
                  <p className="text-amber-600 mb-0.5">Giá khuyến mãi</p>
                  <p className="font-bold text-red-700">
                    {fmt(data.price_promo)}
                  </p>
                </div>
              )}
            </div>
            {data.wholesale_discount_tiers && (
              <div className="text-xs mt-2 pt-2 border-t border-amber-200">
                <p className="text-amber-600 mb-0.5">Khung chiết khấu</p>
                <p className="text-amber-900 text-[11px] leading-relaxed">
                  {data.wholesale_discount_tiers}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Khuyến mãi */}
        {(data.promo_start_date || data.promo_end_date || data.promo_note) && (
          <div className="pt-3 border-t border-amber-200">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2">
              Khuyến mãi
            </p>
            <div className="text-xs space-y-1">
              {(data.promo_start_date || data.promo_end_date) && (
                <p className="text-amber-900">
                  <span className="text-amber-600">Thời gian: </span>
                  {data.promo_start_date || "..."} →{" "}
                  {data.promo_end_date || "..."}
                </p>
              )}
              {data.promo_note && (
                <p className="text-amber-900">
                  <span className="text-amber-600">Ghi chú: </span>
                  {data.promo_note}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Kho hàng */}
        {(data.warehouse_location ||
          data.stock_quantity != null ||
          data.stock_levels?.length > 0) && (
          <div className="pt-3 border-t border-amber-200">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2">
              Kho hàng
            </p>
            <div className="text-xs space-y-1.5">
              {data.warehouse_location && (
                <p className="text-amber-900">
                  <span className="text-amber-600">Vị trí: </span>
                  {data.warehouse_location}
                </p>
              )}
              {data.stock_quantity != null && (
                <p className="text-amber-900">
                  <span className="text-amber-600">Số lượng: </span>
                  <span className="font-bold">{data.stock_quantity}</span>
                </p>
              )}
              {data.stock_levels?.length > 0 && (
                <div>
                  <p className="text-amber-600 mb-1">Tồn kho chi tiết:</p>
                  {data.stock_levels.map((sl: any) => (
                    <div
                      key={sl.id}
                      className="flex justify-between text-[11px] ml-2"
                    >
                      <span className="text-amber-700">
                        {sl.warehouse?.name}
                        {sl.warehouse?.location
                          ? ` — ${sl.warehouse.location}`
                          : ""}
                      </span>
                      <span
                        className={`font-bold ${sl.quantity > 0 ? "text-emerald-700" : "text-red-600"}`}
                      >
                        {sl.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nhà cung cấp */}
        {(data.supplier_name || data.supplier_phone) && (
          <div className="pt-3 border-t border-amber-200">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2">
              Nhà cung cấp
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
              {data.supplier_name && (
                <div>
                  <p className="text-amber-600 mb-0.5">Tên</p>
                  <p className="font-semibold text-amber-900">
                    {data.supplier_name}
                  </p>
                </div>
              )}
              {data.supplier_phone && (
                <div>
                  <p className="text-amber-600 mb-0.5">Số điện thoại</p>
                  <p className="font-semibold text-amber-900">
                    {data.supplier_phone}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ghi chú */}
        {data.internal_notes && (
          <div className="pt-3 border-t border-amber-200">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">
              Ghi chú nội bộ
            </p>
            <p className="text-xs text-amber-900 leading-relaxed">
              {data.internal_notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const TRUST_BADGES = [
  { icon: CheckCircle2, label: "Hàng chính hãng" },
  { icon: Truck, label: "Giao toàn quốc" },
  { icon: FileCheck, label: "CO / CQ đầy đủ" },
  { icon: MapPin, label: "Sẵn kho TP.HCM" },
];
const RECENT_KEY = "pct_recent_products";
const RECENT_MAX = 8;

type StockStatus = "in_stock" | "pre_order" | "coming_soon" | "out_of_stock";

// Helper: Optimize Cloudinary URL for faster loading
function optimizeCloudinaryUrl(url: string, width?: number): string {
  if (!url?.includes('cloudinary.com')) return url;
  if (url.includes('/upload/')) {
    const transform = width ? `w_${width},q_auto,f_auto` : 'q_auto,f_auto';
    return url.replace('/upload/', `/upload/${transform}/`);
  }
  return url;
}

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
        className={`flex-1 h-10 sm:h-11 flex items-center justify-center gap-1.5 sm:gap-2 font-bold rounded-lg transition-all shadow-md text-xs sm:text-sm ${isAdded ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-[#0a192f] text-white hover:bg-emerald-600 hover:shadow-emerald-500/20"}`}
      >
        <ShoppingCart size={14} className="sm:w-4 sm:h-4" />
        <span className="hidden xs:inline">
          {isAdded ? "Đã thêm!" : "Thêm vào báo giá"}
        </span>
        <span className="xs:hidden">{isAdded ? "Đã thêm" : "Báo giá"}</span>
      </button>
    );
  }
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 w-full">
      <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden h-10 sm:h-11 bg-white focus-within:border-[#0a192f] transition-colors">
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-12 sm:w-16 px-2 sm:px-3 h-full outline-none text-center font-semibold text-gray-900 text-xs sm:text-sm"
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as any)}
          className="h-full px-2 sm:px-3 bg-gray-50 border-l-2 border-gray-200 outline-none text-gray-700 font-semibold cursor-pointer text-xs sm:text-sm"
        >
          <option value="m2">m²</option>
          <option value="thùng">Thùng</option>
          <option value="bộ">Bộ</option>
        </select>
      </div>
      <button
        onClick={handleAdd}
        className={`flex-1 h-10 sm:h-11 flex items-center justify-center gap-1.5 sm:gap-2 font-bold rounded-lg transition-all shadow-lg text-white text-xs sm:text-sm ${isAdded ? "bg-emerald-500 shadow-emerald-500/30" : "bg-[#0a192f] hover:bg-emerald-600 hover:shadow-emerald-500/30"}`}
      >
        <ShoppingCart size={14} className="sm:w-4 sm:h-4" />
        <span className="hidden xs:inline">
          {isAdded ? "Đã thêm vào DS" : "Thêm vào DS Báo giá"}
        </span>
        <span className="xs:hidden">
          {isAdded ? "Đã thêm" : "Thêm báo giá"}
        </span>
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();

  const loadProduct = useCallback(
    (bustCache = false) => {
      if (!params.id) return;
      setIsLoading(true);

      // Only invalidate cache when explicitly requested (e.g. after edit)
      if (bustCache) {
        clientCache.invalidateProduct(params.id);
      }

      productService
        .getProductById(params.id, bustCache)
        .then(async (data) => {
          console.log("✅ Product loaded:", data.name);
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
    },
    [params.id],
  );

  useEffect(() => {
    // Bust cache when redirected from edit (?_cb= timestamp)
    const hasCacheBuster =
      typeof window !== "undefined" &&
      window.location.search.includes("_cb=");
    loadProduct(hasCacheBuster);
    
    // Clean up cache buster from URL
    if (hasCacheBuster && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("_cb");
      window.history.replaceState({}, "", url.toString());
    }
  }, [loadProduct]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0 },
    );
    if (ctaRef.current) observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, [product]);

  // DISABLED: SSE causing infinite reload loop on public pages
  // Users can manually refresh (F5) to see latest updates
  // TODO: Implement proper WebSocket with room-based events instead of SSE
  // useProductEvents(() => {
  //   loadProduct(true); // bust cache on SSE event
  // }, params.id);

  if (isLoading)
    return (
      <main className="min-h-screen bg-[#F8F9FA] pt-20 sm:pt-24 px-2 sm:px-4">
        <div className="max-w-7xl mx-auto py-4 sm:py-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm border border-gray-100 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-14">
              {/* Image skeleton */}
              <div className="lg:col-span-5">
                <div className="aspect-square bg-gray-100 rounded-2xl" />
                <div className="flex gap-2 mt-3">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-16 h-16 bg-gray-100 rounded-xl shrink-0"
                    />
                  ))}
                </div>
              </div>
              {/* Info skeleton */}
              <div className="lg:col-span-7 space-y-4">
                <div className="h-3 w-24 bg-gray-100 rounded" />
                <div className="h-7 w-3/4 bg-gray-100 rounded" />
                <div className="h-5 w-1/3 bg-gray-100 rounded" />
                <div className="space-y-2 pt-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-100 rounded" />
                  ))}
                </div>
                <div className="h-11 bg-gray-100 rounded-xl mt-6" />
              </div>
            </div>
          </div>
        </div>
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
        (m.media_type === "lifestyle" ||
          m.media_type === "cutout" ||
          (!m.media_type &&
            (m.file_type?.startsWith("image") ||
              m.file_url?.match(/\.(jpg|jpeg|png|webp|svg)$/i)))) &&
        m.file_url?.startsWith("http"),
    ) ?? [];
  
  // DEBUG: Log media info
  console.log("📸 Media debug:", {
    total: product.media?.length,
    media: product.media?.map(m => ({ id: m.id, type: m.media_type, file_type: m.file_type, url: m.file_url?.slice(0, 50) })),
    filteredImages: images.length,
  });
  const videos =
    product.media?.filter(
      (m) => m.media_type === "video" && m.file_url?.startsWith("http"),
    ) ?? [];
  const showcaseImages =
    product.media?.filter(
      (m) => m.media_type === "showcase" && m.file_url?.startsWith("http"),
    ) ?? [];
  const pdfFiles =
    product.media?.filter(
      (m) => m.media_type === "pdf" || m.file_url?.endsWith(".pdf"),
    ) ?? [];
  const activeImage = images[activeImageIndex]?.file_url || null;
  const optimizedActiveImage = optimizeCloudinaryUrl(activeImage || '', 800);

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

      <main className="min-h-screen bg-[#F8F9FA] py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 pt-20 sm:pt-24 pb-20 sm:pb-24 overflow-x-hidden max-w-full">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 md:gap-10 lg:gap-14 bg-white p-3 sm:p-4 md:p-6 lg:p-8 rounded-xl sm:rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 min-w-0">
            {/* Breadcrumb - Di chuyển vào trong khối trắng */}
            <nav className="lg:col-span-12 flex flex-col sm:flex-row items-start sm:items-center gap-2 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wide sm:tracking-widest overflow-hidden">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                <Link
                  href="/"
                  className="hover:text-[#0a192f] transition-colors whitespace-nowrap"
                >
                  Trang chủ
                </Link>
                <ChevronRight
                  size={12}
                  className="hidden sm:inline sm:w-[14px] sm:h-[14px] shrink-0"
                />
                <Link
                  href="/products"
                  className="hover:text-[#0a192f] transition-colors whitespace-nowrap"
                >
                  Sản phẩm
                </Link>
                <ChevronRight
                  size={12}
                  className="hidden sm:inline sm:w-[14px] sm:h-[14px] shrink-0"
                />
                <span className="text-emerald-600 truncate max-w-[150px] sm:max-w-[200px] md:max-w-xs text-xs sm:text-sm">
                  {product.sku}
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 sm:ml-auto shrink-0">
                <ShareButton
                  url={`/products/${product.id}`}
                  title={product.name}
                  text={`Xem sản phẩm ${product.name} (SKU: ${product.sku})`}
                  className="normal-case tracking-normal text-[10px] sm:text-xs"
                />
                {isAuthenticated && (
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-[#0a192f] text-white rounded-lg text-[10px] sm:text-xs font-semibold hover:bg-[#0d2137] transition-colors normal-case tracking-normal whitespace-nowrap"
                  >
                    <Pencil size={10} className="sm:w-3 sm:h-3" />
                    <span className="hidden sm:inline">Chỉnh sửa</span>
                  </Link>
                )}
              </div>
            </nav>

            {/* ── LEFT: Cột Hình ảnh (STICKY) ── */}
            <div className="lg:col-span-5 relative">
              <div className="lg:sticky lg:top-28 space-y-2 sm:space-y-3 md:space-y-4">
                <div
                  className="relative aspect-square bg-gray-50 rounded-xl sm:rounded-2xl overflow-hidden cursor-zoom-in group border border-gray-100"
                  onClick={() => activeImage && setLightboxSrc(activeImage)}
                >
                  {activeImage ? (
                    <>
                      <Image
                        src={optimizedActiveImage}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 backdrop-blur-[2px]">
                        <div className="bg-white/90 p-3 rounded-full shadow-lg text-gray-800">
                          <ZoomIn size={24} />
                        </div>
                      </div>
                      {/* Badges đè lên ảnh — góc trên trái */}
                      <div
                        className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1 sm:gap-1.5 pointer-events-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <StockBadge status={stockStatus} />
                        {(specs.badges as string[] | undefined)?.map(
                          (badge) => (
                            <span
                              key={badge}
                              className="self-start px-2 sm:px-2.5 py-0.5 sm:py-1 bg-amber-500 text-white text-xs sm:text-sm font-bold rounded-full shadow-sm"
                            >
                              {badge}
                            </span>
                          ),
                        )}
                      </div>
                      {/* Share ảnh hiện tại */}
                      <div
                        className="absolute top-2 sm:top-3 right-2 sm:right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ShareButton
                          url={activeImage}
                          title={`${product.name} - Ảnh sản phẩm`}
                          compact
                          className="bg-white/90 backdrop-blur-sm rounded-full shadow-md"
                        />
                      </div>
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrevImage();
                            }}
                            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-1.5 sm:p-2.5 shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                          >
                            <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNextImage();
                            }}
                            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-1.5 sm:p-2.5 shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                          >
                            <ChevronRight size={18} className="sm:w-5 sm:h-5" />
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
                  <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {images.map((m, idx) => (
                      <button
                        key={m.id}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === idx ? "border-emerald-500 shadow-sm scale-105" : "border-transparent opacity-70 hover:opacity-100 hover:border-gray-200"}`}
                      >
                        <Image
                          src={optimizeCloudinaryUrl(m.file_url, 200)}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="80px"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: Cột Thông tin ── */}
            <div className="lg:col-span-7 flex flex-col gap-3 sm:gap-4">
              {/* Block 1: Header */}
              <div className="border-b border-gray-100 pb-3 sm:pb-4">
                {/* Tên + QR */}
                <div className="flex items-start justify-between gap-2 mb-1 sm:mb-1.5">
                  <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-black text-[#0a192f] tracking-tight leading-tight break-words min-w-0">
                    {product.name}
                  </h1>
                  {product.sku && (
                    <div className="shrink-0 hidden md:block bg-gray-50 p-1.5 rounded-lg border border-gray-100">
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

                {/* SKU nhỏ */}
                <p className="text-[10px] sm:text-[11px] font-mono text-gray-400">
                  SKU: {product.sku}
                </p>
              </div>

              {/* Mô tả ngắn */}
              {product.description && (
                <p className="text-gray-600 leading-relaxed text-xs sm:text-sm md:text-base line-clamp-3 sm:line-clamp-2 break-words">
                  {product.description}
                </p>
              )}

              {/* Block 2: Thông số kỹ thuật */}
              <div className="bg-white border border-gray-100 rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
                <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100 bg-gray-50/80 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h2 className="text-xs sm:text-sm font-semibold text-gray-700 mr-1">
                    Thông số kỹ thuật
                  </h2>
                  {product.style_tags?.map((s) => (
                    <span
                      key={`style-${s.id}`}
                      className="px-1.5 sm:px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] sm:text-[10px] font-semibold rounded-full border border-emerald-100"
                    >
                      {s.name}
                    </span>
                  ))}
                  {product.space_tags?.map((s) => (
                    <span
                      key={`space-${s.id}`}
                      className="px-1.5 sm:px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] sm:text-[10px] font-semibold rounded-full border border-blue-100"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>

                <div className="p-2.5 sm:p-3 md:p-3.5">
                  {Object.keys(specs).length > 0 ? (
                    <ProductSpecs specs={specs} />
                  ) : (
                    <p className="text-xs sm:text-sm text-gray-400 italic">
                      Chưa có thông số kỹ thuật
                    </p>
                  )}
                </div>
              </div>

              {/* Block nội bộ — chỉ admin */}
              {isAuthenticated && (
                <InternalProductBlock productId={product.id} />
              )}

              {/* Block 3: Khu vực CTA */}
              <div
                ref={ctaRef}
                className="bg-gray-50/70 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl border border-gray-100 space-y-2 sm:space-y-2.5"
              >
                <AddToQuoteButton product={product} />
                <div className="flex gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setShowAppointmentForm((v) => !v)}
                    className="flex-1 h-10 sm:h-11 flex items-center justify-center gap-1 sm:gap-1.5 font-bold rounded-lg border-2 border-gray-200 text-[#0a192f] hover:border-[#0a192f] hover:bg-white transition-all text-[11px] sm:text-xs md:text-sm"
                  >
                    <CalendarDays size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Xem mẫu Showroom</span>
                    <span className="xs:hidden">Showroom</span>
                  </button>
                  {pdfFiles.length > 0 && (
                    <a
                      href={pdfFiles[0].file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 sm:h-11 px-2.5 sm:px-3.5 flex items-center justify-center gap-1.5 sm:gap-2 font-bold rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all text-xs sm:text-sm whitespace-nowrap shrink-0"
                    >
                      <Download size={14} className="sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Tải PDF</span>
                      <span className="sm:hidden">PDF</span>
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
                    <div className="bg-white border-2 border-emerald-100 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
                      <h3 className="text-sm sm:text-base font-bold text-[#0a192f] mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                        <CalendarDays className="text-emerald-600" size={16} />{" "}
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
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-100 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5">
                <h3 className="text-xs sm:text-sm font-bold text-[#0a192f] mb-2 sm:mb-3 uppercase tracking-wider">
                  Dịch vụ & Cam kết
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {TRUST_BADGES.map(({ icon: Icon, label }, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center gap-1.5 sm:gap-2 text-center p-2 sm:p-0"
                    >
                      <Icon
                        size={20}
                        className="text-emerald-600 sm:w-6 sm:h-6"
                      />
                      <span className="text-xs sm:text-sm font-semibold text-gray-700 leading-tight">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Các Khu vực bổ sung phía dưới ── */}
          <div className="mt-6 sm:mt-8 md:mt-12 lg:mt-16 space-y-6 sm:space-y-8 md:space-y-12 lg:space-y-16">
            {(videos.length > 0 || showcaseImages.length > 0) && (
              <MediaShowcase
                videos={videos}
                images={showcaseImages}
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
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-[#0a192f] mb-3 sm:mb-4 md:mb-6 flex items-center gap-1.5 sm:gap-2">
                  <span className="w-1 sm:w-1.5 md:w-2 h-4 sm:h-5 md:h-6 bg-emerald-500 rounded-full inline-block"></span>
                  Gợi Ý Phối Hợp
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4 lg:gap-6">
                  {relatedProducts.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} />
                  ))}
                </div>
              </section>
            )}

            <ShippingPolicies />

            {recentProducts.length > 0 && (
              <section>
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-[#0a192f] mb-3 sm:mb-4 md:mb-6 border-t border-gray-200 pt-4 sm:pt-6 md:pt-10">
                  Sản Phẩm Vừa Xem
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4 lg:gap-6">
                  {recentProducts.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      {/* Sticky Mobile Bar - Improved */}
      {showSticky && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 px-3 sm:px-4 py-3 sm:py-3.5 flex gap-2 sm:gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] lg:hidden" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <AddToQuoteButton product={product} compact />
          <Link
            href={`/contact?type=appointment&product=${product.id}`}
            className="h-12 sm:h-12 px-3 sm:px-4 flex items-center justify-center font-bold rounded-lg border-2 border-gray-200 text-[#0a192f] bg-gray-50 hover:bg-gray-100 transition-all shrink-0"
          >
            <CalendarDays size={18} />
          </Link>
        </div>
      )}
    </>
  );
}
