"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function AdminEditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<
    (Product & { media?: MediaRecord[] }) | null
  >(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [styles, setStyles] = useState<Tag[]>([]);
  const [spaces, setSpaces] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    try {
      // Try to get static data from cache first
      const cachedCategories = staticDataCache.getCategories();
      const cachedStyles = staticDataCache.getStyles();
      const cachedSpaces = staticDataCache.getSpaces();

      // Load product and media (always fresh)
      const [prod, media] = await Promise.all([
        productService.getProductById(productId),
        apiClient
          .get<MediaRecord[]>(`/media/product/${productId}`)
          .catch(() => []),
      ]);

      setProduct({ ...prod, media: media || [] });

      // Use cached data if available, otherwise fetch
      if (cachedCategories && cachedStyles && cachedSpaces) {
        console.log("✅ Using cached static data");
        setCategories(cachedCategories);
        setStyles(cachedStyles);
        setSpaces(cachedSpaces);
      } else {
        console.log("🔄 Fetching fresh static data");
        const [cats, stls, sps] = await Promise.all([
          categoryService.getCategories(),
          tagService.getStyles(),
          tagService.getSpaces(),
        ]);

        // Cache for future use
        staticDataCache.setCategories(cats);
        staticDataCache.setStyles(stls);
        staticDataCache.setSpaces(sps);

        setCategories(cats);
        setStyles(stls);
        setSpaces(sps);
      }
    } catch (err) {
      setError("Không thể tải sản phẩm");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSubmit = async (
    data: UpdateProductRequest,
  ): Promise<Product | void> => {
    setIsLoading(true);
    try {
      const updated = await productService.updateProduct(productId, data);
      router.push("/admin/products");
      return updated;
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) return <div className="text-center py-8">Đang tải...</div>;
  if (!product)
    return (
      <div className="text-center py-8 text-red-600">
        {error || "Không tìm thấy sản phẩm"}
      </div>
    );

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
      {error && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}
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
