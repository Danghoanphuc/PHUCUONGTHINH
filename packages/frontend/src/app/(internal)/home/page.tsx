import dynamic from "next/dynamic";

const QRScanner = dynamic(() => import("@/components/internal/QRScanner"), {
  ssr: false,
});

export default function HomePage() {
  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Trang chủ</h1>
      <p className="text-sm text-gray-500 mb-4">
        Quét mã QR để tra cứu sản phẩm nhanh chóng
      </p>
      <QRScanner />
    </div>
  );
}
