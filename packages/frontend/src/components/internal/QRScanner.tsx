"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

const VIDEO_ID = "qr-video-element";

function isCuid(value: string): boolean {
  return /^c[a-z0-9]{20,30}$/.test(value);
}

type ScanState = "idle" | "requesting" | "scanning" | "error";

export default function QRScanner() {
  const router = useRouter();
  const scannerRef = useRef<any>(null);
  const isLoadingRef = useRef(false);
  const [state, setState] = useState<ScanState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleScan(decodedText: string) {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      const trimmed = decodedText.trim();
      if (isCuid(trimmed)) {
        router.push(`/products/${trimmed}`);
        return;
      }
      try {
        const product = await apiClient.get<{ id: string }>(
          `/products/sku/${encodeURIComponent(trimmed)}`,
        );
        if (product?.id) {
          router.push(`/products/${product.id}`);
        } else {
          showToast("Không tìm thấy sản phẩm");
        }
      } catch {
        showToast("Không tìm thấy sản phẩm");
      }
    } finally {
      isLoadingRef.current = false;
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      setState("requesting");
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        const scanner = new Html5Qrcode(VIDEO_ID);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (text) => handleScan(text),
          () => {},
        );

        if (!cancelled) setState("scanning");
      } catch (err: any) {
        if (cancelled) return;
        const msg = err?.message?.includes("Permission")
          ? "Vui lòng cấp quyền camera để quét mã QR"
          : "Không thể khởi động camera";
        setErrorMsg(msg);
        setState("error");
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden bg-black"
      style={{ minHeight: 360 }}
    >
      {/* Camera viewport */}
      <div id={VIDEO_ID} className="w-full h-full" style={{ minHeight: 360 }} />

      {/* Overlay: requesting permission */}
      {state === "requesting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-sm">Đang khởi động camera...</p>
        </div>
      )}

      {/* Overlay: error */}
      {state === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black px-6 text-center">
          <p className="text-red-400 text-sm">{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-white text-black text-sm rounded-lg font-medium"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Scanning frame overlay */}
      {state === "scanning" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-56 h-56 border-2 border-white/70 rounded-xl relative">
            {/* Corner accents */}
            <span className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
            <span className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
            <span className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
            <span className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-lg whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
