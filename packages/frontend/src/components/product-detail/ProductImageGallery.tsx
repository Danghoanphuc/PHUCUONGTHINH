"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import { ProductQRCode } from "./ProductQRCode";
import { Media } from "@/types";

interface ProductImageGalleryProps {
  images: Media[];
  productName: string;
  productSku?: string;
  productUrl?: string;
  stockBadge?: React.ReactNode;
  badges?: string[];
  onImageClick: (url: string) => void;
}

function optimizeCloudinaryUrl(url: string, width?: number): string {
  if (!url?.includes("cloudinary.com")) return url;
  if (url.includes("/upload/")) {
    const transform = width ? `w_${width},q_auto,f_auto` : "q_auto,f_auto";
    return url.replace("/upload/", `/upload/${transform}/`);
  }
  return url;
}

export function ProductImageGallery({
  images,
  productName,
  productSku,
  productUrl,
  stockBadge,
  badges,
  onImageClick,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomActive, setIsZoomActive] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  const activeImage = images[activeIndex]?.file_url || null;
  const optimizedActiveImage = optimizeCloudinaryUrl(activeImage || "", 1200);
  const zoomPreviewImage = optimizeCloudinaryUrl(activeImage || "", 1800);

  const handlePrev = () =>
    setActiveIndex((p) => (p > 0 ? p - 1 : images.length - 1));
  const handleNext = () =>
    setActiveIndex((p) => (p < images.length - 1 ? p + 1 : 0));

  useEffect(() => {
    setIsZoomActive(false);
    setZoomPosition({ x: 50, y: 50 });
  }, [activeIndex]);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-50 rounded-[24px] flex items-center justify-center text-gray-400 font-semibold">
        Chưa có ảnh
      </div>
    );
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomPosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="relative">
        {/* Khung ảnh chính - Bo góc cực lớn */}
        <div
          className="relative aspect-square bg-black/5 rounded-[24px] sm:rounded-[32px] overflow-hidden cursor-zoom-in lg:cursor-crosshair group shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]"
          onClick={() => activeImage && onImageClick(activeImage)}
          onMouseEnter={() => setIsZoomActive(true)}
          onMouseLeave={() => setIsZoomActive(false)}
          onMouseMove={handleMouseMove}
        >
          <Image
            src={optimizedActiveImage}
            alt={productName}
            fill
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03]"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
          />

          {/* Dòng chữ hướng dẫn Zoom - Apple Pill Style */}
          <div className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 rounded-full bg-white/60 backdrop-blur-[24px] saturate-150 border border-white/50 px-4 py-1.5 text-[12px] font-bold text-gray-900 shadow-sm lg:flex">
            Di chuyển chuột để xem chi tiết
          </div>

          {/* Badges - Góc trái trên */}
          <div
            className="absolute top-3 sm:top-4 left-3 sm:left-4 flex flex-col gap-1.5 sm:gap-2 pointer-events-none"
            onClick={(e) => e.stopPropagation()}
          >
            {stockBadge}
            {badges?.map((badge) => (
              <span
                key={badge}
                className="self-start px-3 py-1 bg-white/80 backdrop-blur-md text-gray-900 text-[11px] sm:text-xs font-bold rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-white/50 uppercase tracking-wide"
              >
                {badge}
              </span>
            ))}
          </div>

          {/* QR Code - Góc phải trên (BÊN TRONG ảnh) */}
          {productSku && productUrl && (
            <ProductQRCode
              sku={productSku}
              productUrl={productUrl}
              productName={productName}
            />
          )}

          {/* Nút Share - Kính phủ sương */}
          {activeImage && (
            <div
              className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <ShareButton
                url={activeImage}
                title={`${productName} - Ảnh sản phẩm`}
                compact
                className="bg-white/60 backdrop-blur-[24px] saturate-150 border border-white/50 text-gray-900 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:bg-white/90 active:scale-95 transition-all"
              />
            </div>
          )}

          {/* Nút Prev/Next - Kính phủ sương */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 bg-white/60 backdrop-blur-[24px] saturate-150 border border-white/50 text-gray-900 rounded-full p-2.5 sm:p-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)] opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 bg-white/60 backdrop-blur-[24px] saturate-150 border border-white/50 text-gray-900 rounded-full p-2.5 sm:p-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)] opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
            </>
          )}
        </div>

        {/* Khung Zoom Kính Mờ (Apple Style) */}
        {isZoomActive && (
          <div className="pointer-events-none absolute right-3 top-3 z-20 hidden w-44 rounded-[24px] border border-white/60 bg-white/80 backdrop-blur-[40px] saturate-150 p-2 shadow-[0_20px_40px_rgba(0,0,0,0.12)] lg:block xl:left-full xl:right-auto xl:top-0 xl:ml-5 xl:w-[280px]">
            <div className="mb-2 flex items-center gap-2 px-2 text-[13px] font-bold text-gray-900">
              <ZoomIn size={16} strokeWidth={2.5} />
              <span>Phóng to</span>
            </div>
            <div className="relative aspect-square overflow-hidden rounded-[16px] bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url("${zoomPreviewImage}")`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "320%",
                  backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Dải ảnh nhỏ (Thumbnails) */}
      {images.length > 1 && (
        <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 no-scrollbar px-1">
          {images.map((m, idx) => {
            const isActive = activeIndex === idx;
            return (
              <button
                key={m.id}
                onClick={() => setActiveIndex(idx)}
                className={`relative w-[68px] h-[68px] sm:w-[84px] sm:h-[84px] shrink-0 rounded-[16px] sm:rounded-[20px] overflow-hidden transition-all duration-300 ease-out active:scale-95 border-2 ${
                  isActive
                    ? "border-gray-900 shadow-[0_4px_12px_rgba(0,0,0,0.15)] scale-[1.02]"
                    : "border-transparent opacity-60 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-100 bg-black/5"
                }`}
              >
                <Image
                  src={optimizeCloudinaryUrl(m.file_url, 200)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="84px"
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
