import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Product } from "@/types";
import ProductDetailClient from "./ProductDetailClient";

// Server-side API URL
const API_URL =
  process.env.BACKEND_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
    : null) ||
  "http://localhost:3001/api/v1";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.VERCEL_URL ||
  "https://phucuongthinh.net";

// Helper
function normalizeTags(product: any): Product {
  return {
    ...product,
    style_tags: (product.style_tags ?? []).map((t: any) =>
      t.style ? { id: t.style.id, name: t.style.name } : t,
    ),
    space_tags: (product.space_tags ?? []).map((t: any) =>
      t.space ? { id: t.space.id, name: t.space.name } : t,
    ),
  };
}

// Fetch product on server strictly for Metadata
async function getProduct(id: string): Promise<Product | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // Vẫn dùng revalidate để tối ưu cache SEO
    const response = await fetch(`${API_URL}/products/${id}`, {
      next: { revalidate: 10 },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) return null;
      return null;
    }

    const raw = await response.json();
    // Đề phòng trường hợp API bọc data
    const productData = raw.data || raw;
    return normalizeTags(productData);
  } catch (error: any) {
    return null;
  }
}

function getFirstProductImage(product: Product): string | null {
  if (!product.media?.length) return null;

  const images = product.media.filter(
    (m) =>
      (m.media_type === "lifestyle" ||
        m.media_type === "cutout" ||
        (!m.media_type &&
          (m.file_type?.startsWith("image") ||
            m.file_url?.match(/\.(jpg|jpeg|png|webp|svg)$/i)))) &&
      m.file_url?.startsWith("http"),
  );

  return images[0]?.file_url || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Không tìm thấy sản phẩm | Phú Cường Thịnh",
      description: "Sản phẩm bạn tìm kiếm không tồn tại hoặc đã bị xóa.",
    };
  }

  const productImage = getFirstProductImage(product);
  const productName = product.name || "Sản phẩm";
  const productSku = product.sku || "";
  const title = `${productName} | Phú Cường Thịnh`;
  const description =
    product.description ||
    `Sản phẩm ${productName}${productSku ? ` (SKU: ${productSku})` : ""} - Đơn vị tiên phong trong ngành VLXD hoàn thiện về gạch khổ lớn và thiết bị vệ sinh/bếp kháng khuẩn.`;

  const ogImage = productImage || `${SITE_URL}/dacuon.png`;

  return {
    title,
    description,
    alternates: {
      canonical: `/products/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `/products/${id}`,
      images: [
        {
          url: ogImage,
          alt: productName,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient productId={id} initialProduct={product} />;
}
