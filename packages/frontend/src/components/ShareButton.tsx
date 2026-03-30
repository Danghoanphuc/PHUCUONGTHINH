"use client";

import { useState } from "react";
import { Share2, Link, Check, Facebook, MessageCircle } from "lucide-react";

interface ShareButtonProps {
  url: string;
  title: string;
  text?: string;
  /** compact: chỉ icon, không label */
  compact?: boolean;
  className?: string;
}

export function ShareButton({
  url,
  title,
  text,
  compact = false,
  className = "",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const fullUrl =
    typeof window !== "undefined"
      ? url.startsWith("http")
        ? url
        : `${window.location.origin}${url}`
      : url;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: text ?? title, url: fullUrl });
      } catch {
        /* user cancelled */
      }
      return;
    }
    setOpen((v) => !v);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 2000);
  };

  const shareZalo = () => {
    window.open(
      `https://zalo.me/share?url=${encodeURIComponent(fullUrl)}&title=${encodeURIComponent(title)}`,
      "_blank",
    );
    setOpen(false);
  };

  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
      "_blank",
    );
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleNativeShare}
        className={`flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100 ${compact ? "p-1.5" : "px-2.5 py-1.5 text-xs font-medium"}`}
        title="Chia sẻ"
      >
        <Share2 size={compact ? 15 : 13} />
        {!compact && <span>Chia sẻ</span>}
      </button>

      {/* Dropdown fallback khi không có Web Share API */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 min-w-[160px] animate-in fade-in slide-in-from-top-1 duration-150">
            <button
              onClick={copyLink}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {copied ? (
                <Check size={14} className="text-emerald-500" />
              ) : (
                <Link size={14} />
              )}
              {copied ? "Đã sao chép!" : "Sao chép link"}
            </button>
            <button
              onClick={shareFacebook}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Facebook size={14} className="text-blue-600" />
              Facebook
            </button>
            <button
              onClick={shareZalo}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <MessageCircle size={14} className="text-blue-500" />
              Zalo
            </button>
          </div>
        </>
      )}
    </div>
  );
}
