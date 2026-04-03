"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

const VIDEO_ID = "qr-video-element";

function isCuid(value: string): boolean {
  return /^c[a-z0-9]{20,30}$/.test(value);
}

/** Parse QR text và trả về internal path nếu nhận ra, null nếu không */
function parseQRText(
  text: string,
): { type: "navigate"; path: string } | { type: "unknown"; text: string } {
  const trimmed = text.trim();

  // Full URL — thử parse
  try {
    const url = new URL(trimmed);
    const pathname = url.pathname;

    // /products/{id}
    const productMatch = pathname.match(/^\/products\/([^/]+)$/);
    if (productMatch) {
      return { type: "navigate", path: `/products/${productMatch[1]}` };
    }

    // Các path nội bộ khác có thể thêm vào đây
    // Nếu là URL nhưng không nhận ra path → vẫn navigate nếu cùng origin
    if (
      typeof window !== "undefined" &&
      url.origin === window.location.origin
    ) {
      return { type: "navigate", path: pathname };
    }

    // URL ngoài → unknown
    return { type: "unknown", text: trimmed };
  } catch {
    // Không phải URL
  }

  // cuid → navigate thẳng
  if (isCuid(trimmed)) {
    return { type: "navigate", path: `/products/${trimmed}` };
  }

  // Còn lại → coi là SKU, sẽ lookup API
  return { type: "unknown", text: trimmed };
}

type ScanState = "idle" | "requesting" | "scanning" | "error";

export default function QRScanner() {
  const router = useRouter();
  const scannerRef = useRef<any>(null);
  const isLoadingRef = useRef(false);
  const [state, setState] = useState<ScanState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; isError: boolean } | null>(
    null,
  );

  function showToast(msg: string, isError = true) {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 2500);
  }

  async function handleScan(decodedText: string) {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      const parsed = parseQRText(decodedText);

      if (parsed.type === "navigate") {
        router.push(parsed.path);
        return;
      }

      // Thử lookup theo SKU
      try {
        const product = await apiClient.get<{ id: string }>(
          `/products/sku/${encodeURIComponent(parsed.text)}`,
        );
        if (product?.id) {
          router.push(`/products/${product.id}`);
          return;
        }
      } catch {
        // không phải SKU
      }

      // Không nhận ra → hiện text
      showToast(`QR: ${parsed.text}`, false);
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
      <div id={VIDEO_ID} className="w-full h-full" style={{ minHeight: 360 }} />

      {state === "requesting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-sm">Đang khởi động camera...</p>
        </div>
      )}

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

      {state === "scanning" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-56 h-56 relative">
            <span className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
            <span className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
            <span className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
            <span className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-lg whitespace-nowrap max-w-[90%] truncate ${
            toast.isError ? "bg-red-600" : "bg-gray-800"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
