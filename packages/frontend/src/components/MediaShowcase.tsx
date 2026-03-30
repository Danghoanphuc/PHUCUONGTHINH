"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Images, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";

interface MediaItem {
  id: string;
  file_url: string;
  file_type?: string;
  media_type?: string;
}

interface MediaShowcaseProps {
  videos: MediaItem[];
  images: MediaItem[];
  productName: string;
  onLightbox: (src: string) => void;
}

function VideoThumbnail({
  src,
  active,
  index,
  onClick,
}: {
  src: string;
  active: boolean;
  index: number;
  onClick: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const capture = () => {
      canvas.width = video.videoWidth || 180;
      canvas.height = video.videoHeight || 320;
      canvas
        .getContext("2d")
        ?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL("image/jpeg", 0.8);
      if (url !== "data:,") setThumb(url);
    };
    video.addEventListener("seeked", capture);
    video.addEventListener("loadedmetadata", () => {
      video.currentTime = Math.min(1, video.duration * 0.1);
    });
    return () => video.removeEventListener("seeked", capture);
  }, [src]);

  return (
    <button
      onClick={onClick}
      className={`relative shrink-0 w-14 rounded-xl overflow-hidden transition-all duration-200 ${
        active
          ? "ring-2 ring-white shadow-[0_0_0_3px_rgba(16,185,129,0.5)] scale-105"
          : "opacity-50 hover:opacity-90"
      }`}
      style={{ aspectRatio: "9/16" }}
    >
      <video
        ref={videoRef}
        src={src}
        muted
        preload="metadata"
        className="hidden"
        crossOrigin="anonymous"
      />
      <canvas ref={canvasRef} className="hidden" />
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-950" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`rounded-full p-1.5 backdrop-blur-sm ${active ? "bg-emerald-500/90" : "bg-white/20"}`}
        >
          <Play size={10} className="fill-white text-white" />
        </div>
      </div>
      <span className="absolute bottom-1 left-0 right-0 text-center text-[9px] font-bold text-white/70">
        {String(index + 1).padStart(2, "0")}
      </span>
    </button>
  );
}

function VideoPlayer({
  videos,
  activeIdx,
  onSelect,
  height = "clamp(240px, 45vh, 400px)",
  productName = "",
}: {
  videos: MediaItem[];
  activeIdx: number;
  onSelect: (idx: number) => void;
  height?: string;
  productName?: string;
}) {
  return (
    <div className="flex gap-2 items-center justify-center">
      {videos.length > 1 && (
        <div className="hidden sm:flex flex-col gap-2 shrink-0">
          {videos.map((v, idx) => (
            <VideoThumbnail
              key={v.id}
              src={v.file_url}
              active={activeIdx === idx}
              index={idx}
              onClick={() => onSelect(idx)}
            />
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2 items-center">
        <div
          className="relative rounded-2xl overflow-hidden shadow-xl bg-gray-950"
          style={{ aspectRatio: "9/16", height, width: "auto" }}
        >
          <video
            key={videos[activeIdx].file_url}
            src={videos[activeIdx].file_url}
            controls
            className="absolute inset-0 w-full h-full object-contain"
            preload="metadata"
          >
            Trình duyệt không hỗ trợ video.
          </video>
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full pointer-events-none">
            <Play size={9} className="fill-white" /> Video
          </div>
          <div className="absolute top-2.5 right-2.5">
            <ShareButton
              url={videos[activeIdx].file_url}
              title={`${productName} - Video sản phẩm`}
              compact
              className="bg-black/50 backdrop-blur-sm rounded-full"
            />
          </div>
        </div>
        {videos.length > 1 && (
          <div className="flex sm:hidden gap-2 justify-center">
            {videos.map((v, idx) => (
              <VideoThumbnail
                key={v.id}
                src={v.file_url}
                active={activeIdx === idx}
                index={idx}
                onClick={() => onSelect(idx)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DesignGallery({
  images,
  productName,
  onLightbox,
}: {
  images: MediaItem[];
  productName: string;
  onLightbox: (src: string) => void;
}) {
  const [active, setActive] = useState(0);
  if (images.length === 0) return null;
  const prev = () => setActive((i) => (i > 0 ? i - 1 : images.length - 1));
  const next = () => setActive((i) => (i < images.length - 1 ? i + 1 : 0));

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Images size={14} className="text-primary" />
          <span className="text-sm font-semibold text-gray-700">
            Thư viện thiết kế
          </span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {images.length} ảnh
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ShareButton
            url={images[active].file_url}
            title={`${productName} - Thư viện thiết kế`}
            compact
          />
          <span className="text-xs text-gray-400">
            {active + 1} / {images.length}
          </span>
        </div>
      </div>

      <div className="flex gap-2 flex-1 min-h-0">
        <div
          className="relative flex-1 rounded-2xl overflow-hidden bg-gray-100 cursor-zoom-in group"
          style={{ minHeight: "200px" }}
          onClick={() => onLightbox(images[active].file_url)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={images[active].id}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.22 }}
              className="absolute inset-0"
            >
              <Image
                src={images[active].file_url}
                alt={`${productName} - ảnh ${active + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={active === 0}
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
            <div className="bg-white/80 backdrop-blur-sm rounded-full p-2.5">
              <ZoomIn size={18} className="text-primary" />
            </div>
          </div>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-1.5 shadow transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-1.5 shadow transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex flex-col gap-1.5 w-14 shrink-0 overflow-y-auto">
            {images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setActive(idx)}
                className={`relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                  active === idx
                    ? "border-primary shadow-sm"
                    : "border-transparent opacity-50 hover:opacity-100 hover:border-gray-200"
                }`}
              >
                <Image
                  src={img.file_url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function MediaShowcase({
  videos,
  images,
  productName,
  onLightbox,
}: MediaShowcaseProps) {
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const hasVideos = videos.length > 0;
  const hasImages = images.length > 0;

  if (!hasVideos && !hasImages) return null;

  return (
    <section className="mt-14">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200" />
        <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/5 rounded-full border border-primary/10">
          {hasVideos && (
            <Play size={13} className="text-primary fill-primary" />
          )}
          {hasImages && <Images size={13} className="text-primary" />}
          <span className="text-sm font-semibold text-primary">
            {hasVideos && hasImages
              ? "Video & Thư viện thiết kế"
              : hasVideos
                ? "Video sản phẩm"
                : "Thư viện thiết kế"}
          </span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200" />
      </div>

      {hasVideos && hasImages ? (
        <div className="flex flex-col lg:flex-row gap-3 lg:items-stretch p-3 bg-gray-50/80 backdrop-blur-sm rounded-2xl border border-gray-100/80">
          <div className="shrink-0 flex justify-center lg:justify-start bg-white/60 backdrop-blur-md rounded-xl p-3 border border-white/80 shadow-sm">
            <VideoPlayer
              videos={videos}
              activeIdx={activeVideoIdx}
              onSelect={setActiveVideoIdx}
              height="clamp(260px, 48vh, 420px)"
              productName={productName}
            />
          </div>
          <div
            className="flex-1 min-w-0 bg-white/60 backdrop-blur-md rounded-xl p-3 border border-white/80 shadow-sm"
            style={{ minHeight: "clamp(260px, 48vh, 420px)" }}
          >
            <DesignGallery
              images={images}
              productName={productName}
              onLightbox={onLightbox}
            />
          </div>
        </div>
      ) : hasVideos ? (
        <div className="flex justify-center">
          <VideoPlayer
            videos={videos}
            activeIdx={activeVideoIdx}
            onSelect={setActiveVideoIdx}
            height="clamp(300px, 58vh, 500px)"
            productName={productName}
          />
        </div>
      ) : (
        <DesignGallery
          images={images}
          productName={productName}
          onLightbox={onLightbox}
        />
      )}
    </section>
  );
}
