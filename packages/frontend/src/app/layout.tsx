import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { PublicShell } from "@/components/PublicShell";

export const metadata: Metadata = {
  title: "Phúc Cường Thịnh - Tiên phong Big Slab & Kiến trúc xanh",
  description:
    "Đơn vị dẫn đầu chuỗi cung ứng vật liệu xây dựng B2B. Tổng kho phân phối Gạch khổ lớn (Big Slab) và giải pháp Gạch kháng khuẩn công nghệ cao.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="relative">
        <Providers>
          <PublicShell>{children}</PublicShell>
        </Providers>
      </body>
    </html>
  );
}
