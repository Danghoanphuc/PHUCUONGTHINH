"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  DragEvent,
  ChangeEvent,
} from "react";
import { validateFile, validateSocialUrl } from "@/lib/media-service";
import { Image as ImageIcon, Video, X, Star } from "lucide-react";

export type MediaType =
  | "lifestyle"
  | "cutout"
  | "video"
  | "showcase"
  | "social_link";

export interface PendingMedia {
  clientId: string;
  file?: File;
  url?: string;
  media_type: MediaType;
  is_cover: boolean;
  sort_order: number;
  preview_url?: string;
  status: "pending" | "uploading" | "done" | "error";
  progress?: number;
  error?: string;
  alt_text?: string;
}

export interface MediaUploaderProps {
  productId?: string;
  existingMedia?: PendingMedia[];
  onChange: (media: PendingMedia[]) => void;
  productName?: string;
}

let _idCounter = 0;
function nextId() {
  return `media-${Date.now()}-${++_idCounter}`;
}

export function setCover(list: PendingMedia[], index: number): PendingMedia[] {
  return list.map((item, i) => ({ ...item, is_cover: i === index }));
}

// ── Toast Component ──────────────────────────────────────────────────────────
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: "bg-emerald-600",
    error: "bg-red-600",
    info: "bg-blue-600",
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${colors[type]} animate-in slide-in-from-bottom-2 fade-in`}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
      >
        ✕
      </button>
    </div>
  );
}

// ── Thumbnail item ────────────────────────────────────────────────────────────
function MediaThumb({
  item,
  index,
  globalIdx,
  draggedIndex,
  onDragStart,
  onDragOver,
  onDragEnd,
  onSetCover,
  onRemove,
  isNew,
}: {
  item: PendingMedia;
  index: number;
  globalIdx: number;
  draggedIndex: number | null;
  onDragStart: (i: number) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>, i: number) => void;
  onDragEnd: () => void;
  onSetCover: (i: number) => void;
  onRemove: (id: string) => void;
  isNew?: boolean;
}) {
  const isVideo = item.media_type === "video";
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRemoving(true);
    setTimeout(() => onRemove(item.clientId), 300);
  };

  return (
    <div
      draggable
      onDragStart={() => onDragStart(globalIdx)}
      onDragOver={(e) => onDragOver(e, globalIdx)}
      onDragEnd={onDragEnd}
      className={`relative group rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all duration-300 ${
        item.is_cover
          ? "border-blue-500 shadow-md"
          : "border-transparent hover:border-gray-300"
      } ${draggedIndex === globalIdx ? "opacity-40 scale-95" : ""} ${
        isNew ? "animate-in zoom-in-95 fade-in duration-300" : ""
      } ${isRemoving ? "animate-out zoom-out-95 fade-out duration-300" : ""}`}
    >
      <div className="aspect-square bg-gray-100">
        {item.preview_url && !isVideo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.preview_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : item.preview_url && isVideo ? (
          <video
            src={item.preview_url}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
            onLoadedMetadata={(e) => {
              (e.target as HTMLVideoElement).currentTime = 0.5;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
            {isVideo ? "🎬" : "🖼️"}
          </div>
        )}
      </div>

      {item.status === "uploading" && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${item.progress ?? 0}%` }}
          />
        </div>
      )}
      {item.status === "error" && (
        <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center p-1">
          <p className="text-white text-xs text-center leading-tight">
            {item.error}
          </p>
        </div>
      )}
      {item.is_cover && (
        <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
          <Star size={9} className="fill-white" /> Bìa
        </div>
      )}

      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
        {!item.is_cover && !isVideo && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetCover(globalIdx);
            }}
            className="bg-white text-gray-800 text-xs px-2 py-1 rounded shadow hover:bg-blue-50"
          >
            Bìa
          </button>
        )}
        <button
          type="button"
          onClick={handleRemove}
          className="bg-red-500 text-white text-xs px-2 py-1 rounded shadow hover:bg-red-600 transition-colors"
        >
          Xóa
        </button>
      </div>
      <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
        {index + 1}
      </div>
    </div>
  );
}

// ── Drop zone ─────────────────────────────────────────────────────────────────
function DropZone({
  label,
  hint,
  accept,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  inputRef,
  onFileChange,
  icon,
  accentColor,
}: {
  label: string;
  hint: string;
  accept: string;
  isDragging: boolean;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onClick: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  accentColor: string;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      className={`flex-1 border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 min-h-[110px] ${
        isDragging
          ? `${accentColor} border-opacity-100`
          : "border-gray-200 hover:border-gray-300 bg-gray-50/60 hover:bg-gray-50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={onFileChange}
      />
      <div className="pointer-events-none flex flex-col items-center gap-1.5">
        {icon}
        <p className="text-xs font-semibold text-gray-600">{label}</p>
        <p className="text-[10px] text-gray-400">{hint}</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function MediaUploader({
  existingMedia = [],
  onChange,
  productName = "",
}: MediaUploaderProps) {
  const [items, setItems] = useState<PendingMedia[]>(existingMedia);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set());

  // Sync khi existingMedia thay đổi (edit mode: product load async)
  const prevMediaKey = useRef<string>("");
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Create a key from media IDs to detect real changes
    const key = existingMedia.map((m) => m.clientId).join(",");
    if (key !== prevMediaKey.current) {
      prevMediaKey.current = key;
      if (existingMedia.length > 0) {
        setItems(existingMedia);
      }
    }
  }, [existingMedia]);

  // Notify parent sau mỗi thay đổi do user
  useEffect(() => {
    // Skip notification on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      console.log("⏭️ [MediaUploader] Skipping onChange on initial mount");
      return;
    }

    // Skip notification if this is a sync from existingMedia (same IDs in same order)
    const existingKey = existingMedia.map((m) => m.clientId).join(",");
    const currentKey = items.map((m) => m.clientId).join(",");

    if (existingKey === currentKey && existingMedia.length === items.length) {
      // This is likely a sync from existingMedia, not a user action
      console.log(
        "⏭️ [MediaUploader] Skipping onChange - sync from existingMedia",
      );
      return;
    }

    // Always notify parent when items change (user action)
    console.log(
      "📢 [MediaUploader] Calling onChange with items:",
      items.map((m) => ({ id: m.clientId, status: m.status })),
    );
    onChange(items);
  }, [items, onChange]); // eslint-disable-line react-hooks/exhaustive-deps

  const [dragging1, setDragging1] = useState(false);
  const [dragging2, setDragging2] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [socialUrl, setSocialUrl] = useState("");
  const [socialError, setSocialError] = useState("");
  const inputRef1 = useRef<HTMLInputElement>(null);
  const inputRef2 = useRef<HTMLInputElement>(null);

  // Zone 1: ảnh sản phẩm (lifestyle/cutout)
  const PRODUCT_TYPES: MediaType[] = ["lifestyle", "cutout"];
  // Zone 2: video + ảnh showcase
  const SHOWCASE_TYPES: MediaType[] = ["video", "showcase"];

  const addFilesAs = useCallback(
    (files: FileList | File[], zone: 1 | 2) => {
      const arr = Array.from(files);
      const newItems: PendingMedia[] = [];
      const newIds: string[] = [];

      for (const file of arr) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        const isVideo =
          file.type.startsWith("video/") ||
          ["mp4", "mov", "webm"].includes(ext);

        let mediaType: MediaType;
        if (zone === 1) {
          mediaType = "lifestyle";
        } else {
          mediaType = isVideo ? "video" : "showcase";
        }

        const result = validateFile(file, mediaType);
        const clientId = nextId();

        newItems.push({
          clientId,
          file,
          media_type: mediaType,
          is_cover: false,
          sort_order: 0,
          preview_url: result.valid ? URL.createObjectURL(file) : undefined,
          status: result.valid ? "pending" : "error",
          error: result.valid ? undefined : result.error,
        });

        if (result.valid) {
          newIds.push(clientId);
        }
      }

      setItems((prev) => {
        const base = prev.length;
        const withOrder = newItems.map((item, i) => ({
          ...item,
          sort_order: base + i,
        }));
        const next = [...prev, ...withOrder];
        // Auto-set cover nếu chưa có
        if (!next.some((i) => i.is_cover)) {
          const first = next.find((i) => PRODUCT_TYPES.includes(i.media_type));
          if (first) first.is_cover = true;
        }
        onChange(next);
        return next;
      });

      // Mark as new for animation
      setNewItemIds(new Set(newIds));
      setTimeout(() => setNewItemIds(new Set()), 500);

      // Show toast
      const validCount = newItems.filter((i) => i.status === "pending").length;
      const errorCount = newItems.filter((i) => i.status === "error").length;

      if (validCount > 0) {
        setToast({
          message: `✅ Đã thêm ${validCount} file${errorCount > 0 ? ` (${errorCount} lỗi)` : ""}`,
          type: validCount > 0 && errorCount === 0 ? "success" : "info",
        });
      } else if (errorCount > 0) {
        setToast({
          message: `❌ ${errorCount} file không hợp lệ`,
          type: "error",
        });
      }
    },
    [onChange],
  );

  const removeItem = (clientId: string) => {
    console.log("🗑️ [MediaUploader] Removing media:", clientId);
    setItems((prev) => {
      const next = prev
        .filter((i) => i.clientId !== clientId)
        .map((item, idx) => ({ ...item, sort_order: idx }));
      console.log("📋 [MediaUploader] Items after removal:", {
        before: prev.length,
        after: next.length,
        removed: clientId,
        remaining: next.map((m) => m.clientId),
      });
      return next;
    });

    setToast({
      message: "🗑️ Đã xóa",
      type: "info",
    });
  };

  const handleSetCover = (globalIdx: number) => {
    setItems((prev) => {
      const next = setCover(prev, globalIdx);
      return next;
    });

    setToast({
      message: "⭐ Đã đặt làm ảnh bìa",
      type: "success",
    });
  };

  const handleItemDragStart = (index: number) => setDraggedIndex(index);
  const handleItemDragEnd = () => setDraggedIndex(null);
  const handleItemDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(index, 0, moved);
      const reordered = next.map((item, i) => ({ ...item, sort_order: i }));
      setDraggedIndex(index);
      return reordered;
    });
  };

  const handleAddSocialLink = () => {
    setSocialError("");
    const trimmed = socialUrl.trim();
    if (!trimmed) return;
    if (!validateSocialUrl(trimmed)) {
      setSocialError(
        "Chỉ chấp nhận: pinterest.com, instagram.com, houzz.com, facebook.com",
      );
      return;
    }
    setItems((prev) => {
      const next = [
        ...prev,
        {
          clientId: nextId(),
          url: trimmed,
          media_type: "social_link" as MediaType,
          is_cover: false,
          sort_order: prev.length,
          status: "pending" as const,
        },
      ];
      return next;
    });
    setSocialUrl("");

    setToast({
      message: "🔗 Đã thêm link",
      type: "success",
    });
  };

  const productItems = items.filter((i) =>
    PRODUCT_TYPES.includes(i.media_type),
  );
  const showcaseItems = items.filter((i) =>
    SHOWCASE_TYPES.includes(i.media_type),
  );
  const socialItems = items.filter((i) => i.media_type === "social_link");

  const thumbProps = (item: PendingMedia, zoneItems: PendingMedia[]) => ({
    item,
    index: zoneItems.indexOf(item),
    globalIdx: items.indexOf(item),
    draggedIndex,
    onDragStart: handleItemDragStart,
    onDragOver: handleItemDragOver,
    onDragEnd: handleItemDragEnd,
    onSetCover: handleSetCover,
    onRemove: removeItem,
    isNew: newItemIds.has(item.clientId),
  });

  return (
    <div className="space-y-4">
      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ── 2 Drop zones ── */}
      <div className="flex gap-3">
        {/* Zone 1: Ảnh sản phẩm — 70% */}
        <div className="flex flex-col gap-2" style={{ flex: "7" }}>
          <DropZone
            label="Ảnh sản phẩm"
            hint="JPG, PNG, WEBP · Hiện trong gallery chính"
            accept=".jpg,.jpeg,.png,.webp"
            isDragging={dragging1}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging1(true);
            }}
            onDragLeave={() => setDragging1(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging1(false);
              if (e.dataTransfer.files?.length)
                addFilesAs(e.dataTransfer.files, 1);
            }}
            onClick={() => inputRef1.current?.click()}
            inputRef={inputRef1}
            onFileChange={(e) => {
              if (e.target.files?.length) {
                addFilesAs(e.target.files, 1);
                e.target.value = "";
              }
            }}
            icon={<ImageIcon size={22} className="text-blue-400" />}
            accentColor="border-blue-400 bg-blue-50/60"
          />
          {productItems.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {productItems.map((item) => (
                <MediaThumb
                  key={item.clientId}
                  {...thumbProps(item, productItems)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Zone 2: Video & Showcase — 30% */}
        <div className="flex flex-col gap-2" style={{ flex: "3" }}>
          <DropZone
            label="Video & Thư viện"
            hint="MP4, MOV, JPG · Hiện trong showcase"
            accept=".jpg,.jpeg,.png,.webp,.mp4,.mov"
            isDragging={dragging2}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging2(true);
            }}
            onDragLeave={() => setDragging2(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging2(false);
              if (e.dataTransfer.files?.length)
                addFilesAs(e.dataTransfer.files, 2);
            }}
            onClick={() => inputRef2.current?.click()}
            inputRef={inputRef2}
            onFileChange={(e) => {
              if (e.target.files?.length) {
                addFilesAs(e.target.files, 2);
                e.target.value = "";
              }
            }}
            icon={<Video size={22} className="text-purple-400" />}
            accentColor="border-purple-400 bg-purple-50/60"
          />
          {showcaseItems.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {showcaseItems.map((item) => (
                <MediaThumb
                  key={item.clientId}
                  {...thumbProps(item, showcaseItems)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Alt text ── */}
      {productItems.filter((i) => i.status !== "error").length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500">
              Alt text ảnh sản phẩm
            </p>
            {productName && (
              <button
                type="button"
                onClick={() => {
                  setItems((prev) =>
                    prev.map((item) =>
                      PRODUCT_TYPES.includes(item.media_type)
                        ? { ...item, alt_text: productName }
                        : item,
                    ),
                  );
                }}
                className="text-xs text-blue-600 hover:text-blue-800 underline underline-offset-2"
              >
                Copy tên SP vào tất cả
              </button>
            )}
          </div>
          {productItems
            .filter((i) => i.status !== "error")
            .map((item) => (
              <div
                key={`alt-${item.clientId}`}
                className="flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded overflow-hidden shrink-0 bg-gray-100">
                  {item.preview_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.preview_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <input
                  type="text"
                  value={item.alt_text ?? ""}
                  onChange={(e) => {
                    setItems((prev) =>
                      prev.map((m) =>
                        m.clientId === item.clientId
                          ? { ...m, alt_text: e.target.value }
                          : m,
                      ),
                    );
                  }}
                  placeholder={`Alt text ảnh ${item.sort_order + 1}...`}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            ))}
        </div>
      )}

      {/* ── Social links ── */}
      <div className="border border-gray-200 rounded-xl p-3 space-y-2">
        <p className="text-xs font-semibold text-gray-600">Link mạng xã hội</p>
        <div className="flex gap-2">
          <input
            type="url"
            value={socialUrl}
            onChange={(e) => {
              setSocialUrl(e.target.value);
              setSocialError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddSocialLink();
              }
            }}
            placeholder="https://www.pinterest.com/pin/..."
            className={`flex-1 border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${socialError ? "border-red-400" : "border-gray-200"}`}
          />
          <button
            type="button"
            onClick={handleAddSocialLink}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Thêm
          </button>
        </div>
        {socialError && <p className="text-xs text-red-500">{socialError}</p>}
        {socialItems.length > 0 && (
          <ul className="space-y-1.5">
            {socialItems.map((item) => (
              <li
                key={item.clientId}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-xs"
              >
                <span className="text-base">🔗</span>
                <span className="flex-1 truncate text-gray-500">
                  {item.url}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(item.clientId)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
