"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

const SCANNER_ID = "qr-scanner-container";

// cuid pattern: starts with 'c' followed by ~24 alphanumeric chars
function isCuid(value: string): boolean {
  return /^c[a-z0-9]{20,30}$/.test(value);
}

export default function QRScanner() {
  const router = useRouter();
  const scannerRef = useRef<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }

  async function handleScanSuccess(decodedText: string) {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const trimmed = decodedText.trim();

      if (isCuid(trimmed)) {
        // Navigate directly by product ID
        router.push(`/internal/products/${trimmed}`);
        return;
      }

      // Treat as SKU — look up via API
      try {
        const product = await apiClient.get<{ id: string }>(
          `/products/sku/${encodeURIComponent(trimmed)}`,
        );
        if (product?.id) {
          router.push(`/internal/products/${product.id}`);
        } else {
          showToast("Không tìm thấy sản phẩm");
        }
      } catch {
        showToast("Không tìm thấy sản phẩm");
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleScanFailure(_error: string) {
    // Scan failures are normal (camera frames without QR), ignore silently
  }

  useEffect(() => {
    let scanner: any = null;

    async function initScanner() {
      try {
        const { Html5QrcodeScanner } = await import("html5-qrcode");
        scanner = new Html5QrcodeScanner(
          SCANNER_ID,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
          },
          false,
        );
        scannerRef.current = scanner;
        scanner.render(handleScanSuccess, handleScanFailure);
      } catch (err) {
        console.error("Failed to initialize QR scanner:", err);
        showToast("Không thể khởi động camera");
      }
    }

    initScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <div id={SCANNER_ID} className="w-full" />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-lg">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
