"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface ProductQRCodeProps {
  sku: string;
  productUrl: string;
  productName?: string;
}

export function ProductQRCode({
  sku,
  productUrl,
  productName,
}: ProductQRCodeProps) {
  const [qrImageUrl, setQrImageUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Sử dụng API QR code generator
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(productUrl)}&color=0a192f&bgcolor=ffffff&margin=10`;
    setQrImageUrl(qrUrl);
    console.log("🎯 QR Code generated for:", sku, "URL:", productUrl);
  }, [productUrl, sku]);

  const handleDownload = async () => {
    if (isGenerating || !qrImageUrl) return;
    setIsGenerating(true);

    try {
      // Tạo canvas để vẽ QR + SKU
      const downloadCanvas = document.createElement("canvas");
      const ctx = downloadCanvas.getContext("2d");
      if (!ctx) return;

      // Kích thước canvas
      const qrSize = 400;
      const padding = 40;
      const textHeight = 60;
      downloadCanvas.width = qrSize + padding * 2;
      downloadCanvas.height = qrSize + padding * 2 + textHeight;

      // Nền trắng
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

      // Tải QR image từ API
      const qrImage = new Image();
      qrImage.crossOrigin = "anonymous";
      qrImage.src = qrImageUrl;

      await new Promise((resolve, reject) => {
        qrImage.onload = resolve;
        qrImage.onerror = reject;
      });

      // Vẽ QR code
      ctx.drawImage(qrImage, padding, padding, qrSize, qrSize);

      // Vẽ SKU text
      ctx.fillStyle = "#0a192f";
      ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        sku,
        downloadCanvas.width / 2,
        qrSize + padding + textHeight / 2,
      );

      // Tải xuống
      const link = document.createElement("a");
      link.download = `QR-${sku}.png`;
      link.href = downloadCanvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Download error:", error);
      // Fallback: download trực tiếp QR image
      const link = document.createElement("a");
      link.download = `QR-${sku}.png`;
      link.href = qrImageUrl;
      link.click();
    } finally {
      setIsGenerating(false);
    }
  };

  if (!qrImageUrl) {
    return null;
  }

  return (
    <div
      className="absolute top-3 sm:top-4 right-3 sm:right-4 z-30 group/qr pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* QR Code hiển thị */}
      <div className="relative bg-white/90 backdrop-blur-[24px] saturate-150 border-2 border-white/60 rounded-2xl p-2 shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)]">
        <img
          src={qrImageUrl}
          alt={`QR Code for ${sku}`}
          className="block w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px] rounded-lg"
          loading="lazy"
        />

        {/* SKU Label */}
        <div className="mt-1 sm:mt-1.5 text-center">
          <p className="text-[8px] sm:text-[9px] md:text-[10px] font-mono font-bold text-gray-900 tracking-tight">
            {sku}
          </p>
        </div>

        {/* Download Button - Hiện khi hover (desktop) hoặc tap (mobile) */}
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 sm:gap-1.5 bg-gray-900/95 backdrop-blur-sm rounded-2xl opacity-0 group-hover/qr:opacity-100 active:opacity-100 transition-all duration-300 disabled:opacity-50"
          title="Tải xuống QR Code"
          aria-label="Tải xuống mã QR"
        >
          <Download
            size={20}
            className="sm:w-6 sm:h-6 text-white"
            strokeWidth={2.5}
          />
          <span className="text-white text-[10px] sm:text-[11px] font-bold">
            {isGenerating ? "Đang tạo..." : "Tải xuống"}
          </span>
        </button>
      </div>

      {/* Tooltip - Chỉ hiện trên desktop */}
      <div className="hidden md:block absolute top-full right-0 mt-2 opacity-0 group-hover/qr:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="bg-gray-900 text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
          Quét mã để xem sản phẩm
        </div>
      </div>
    </div>
  );
}
