"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import {
  productService,
  UpdateProductRequest,
  Product,
} from "@/lib/product-service";
import { categoryService, Category } from "@/lib/category-service";
import { tagService, Tag } from "@/lib/tag-service";
import { MediaRecord } from "@/lib/media-service";
import { apiClient } from "@/lib/admin-api-client";
import { staticDataCache } from "@/lib/static-data-cache";
import { useMediaPolling } from "@/hooks/useMediaPolling";

export default function AdminEditProductPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<
    (Product & { media?: MediaRecord[] }) | null
  >(null);
  const [categories, setCategories] = useState<Category[]>(
    () => staticDataCache.getCategories() ?? [],
  );
  const [styles, setStyles] = useState<Tag[]>(
    () => staticDataCache.getStyles() ?? [],
  );
  const [spaces, setSpaces] = useState<Tag[]>(
    () => staticDataCache.getSpaces() ?? [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Smart polling for media updates (replaces SSE)
  // Only polls when tab is active, uses exponential backoff
  useMediaPolling(productId, () => {
    console.log("📡 [EditPage] Media changes detected, reloading...");
    apiClient
      .get<MediaRecord[]>(`/media/product/${productId}`)
      .then((media) => {
        setProduct((prev) => (prev ? { ...prev, media: media || [] } : null));
      })
      .catch((err) => console.error("Failed to reload media:", err));
  });

  useEffect(() => {
    // Load product + media (critical path)
    Promise.all([
      productService.getProductById(productId),
      apiClient
        .get<MediaRecord[]>(`/media/product/${productId}`)
        .catch(() => []),
    ])
      .then(([prod, media]) => setProduct({ ...prod, media: media || [] }))
      .catch(() => setError("Không thể tải sản phẩm"));

    // Load static data (non-blocking, only if not cached)
    if (!staticDataCache.getCategories()) {
      Promise.all([
        categoryService.getCategories(),
        tagService.getStyles(),
        tagService.getSpaces(),
      ]).then(([cats, stls, sps]) => {
        staticDataCache.setCategories(cats);
        staticDataCache.setStyles(stls);
        staticDataCache.setSpaces(sps);
        setCategories(cats);
        setStyles(stls);
        setSpaces(sps);
      });
    }
  }, [productId]);

  const handleSubmit = async (
    data: UpdateProductRequest,
  ): Promise<Product | void> => {
    setIsLoading(true);
    try {
      const updated = await productService.updateProduct(productId, data);
      // Don't redirect here - let ProductForm handle it after media operations complete
      return updated;
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  if (error)
    return <div className="text-center py-8 text-red-600">{error}</div>;

  // Render form immediately — show skeleton while product loads
  if (!product) {
    return (
      <div className="p-4 md:p-6 animate-pulse">
        <div className="h-4 w-20 bg-gray-200 rounded mb-5" />
        <div className="h-6 w-48 bg-gray-200 rounded mb-6" />
        <div className="h-12 bg-gray-100 rounded-2xl mb-4" />
        <div className="h-10 bg-gray-100 rounded-xl mb-3" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5">
        <Link
          href="/admin/products"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Quay lại
        </Link>
        <h1 className="text-xl font-black text-gray-900 mt-2">
          Chỉnh sửa sản phẩm
        </h1>
      </div>
      <ProductForm
        product={product}
        categories={categories}
        styles={styles}
        spaces={spaces}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
