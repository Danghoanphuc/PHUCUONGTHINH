import { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient";

// Types matching product-service.ts
interface ProductTag {
  id: string;
  name: string;
}

interface ProductMedia {
  id: string;
  file_url: string;
  file_type?: string;
  media_type?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  media?: ProductMedia[];
  style_tags?: ProductTag[];
  space_tags?: ProductTag[];
}

// Server-side API URL (must use BACKEND_URL, not NEXT_PUBLIC_API_URL)
const API_URL =
  process.env.BACKEND_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
    : null) ||
  "http://localhost:3001/api/v1";

// Site URL for metadata
const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.VERCEL_URL ||
  "https://phucuongthinh.net";

// Helper to normalize tags from backend
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

// Fetch product on server
async function getProduct(id: string): Promise<Product | null> {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch product: ${response.status}`);
    }

    const raw = await response.json();
    return normalizeTags(raw);
  } catch (error) {
    console.error("Error fetching product for metadata:", error);
    return null;
  }
}

// Get first image URL from product media
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

// Generate dynamic metadata for each product
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const product = await getProduct(params.id);

  if (!product) {
    return {
      title: "Không tìm thấy sản phẩm | Phú Cường Thịnh",
      description: "Sản phẩm bạn tìm kiếm không tồn tại hoặc đã bị xóa.",
    };
  }

  const productImage = getFirstProductImage(product);
  const title = `${product.name} | Phú Cường Thịnh`;
  const description =
    product.description ||
    `Sản phẩm ${product.name} (SKU: ${product.sku}) - Đơn vị tiên phong trong ngành VLXD hoàn thiện về gạch khổ lớn và thiết bị vệ sinh/bếp kháng khuẩn.`;

  // Ensure images have absolute URLs
  const ogImage = productImage
    ? productImage
    : `${SITE_URL}/dacuon.png`;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/products/${params.id}`,
      images: [
        {
          url: ogImage,
          alt: product.name,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

// Page component (Server Component)
export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <ProductDetailClient productId={params.id} />;
}
