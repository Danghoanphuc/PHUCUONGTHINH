"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import {
  productService,
  CreateProductRequest,
  UpdateProductRequest,
  Product,
} from "@/lib/product-service";
import { categoryService, Category } from "@/lib/category-service";
import { tagService, Tag } from "@/lib/tag-service";
import { staticDataCache } from "@/lib/static-data-cache";

export default function AdminNewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [styles, setStyles] = useState<Tag[]>([]);
  const [spaces, setSpaces] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Try to get from cache first
      const cachedCategories = staticDataCache.getCategories();
      const cachedStyles = staticDataCache.getStyles();
      const cachedSpaces = staticDataCache.getSpaces();

      if (cachedCategories && cachedStyles && cachedSpaces) {
        console.log("✅ Using cached static data");
        setCategories(cachedCategories);
        setStyles(cachedStyles);
        setSpaces(cachedSpaces);
        setIsLoadingData(false);
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
        setIsLoadingData(false);
      }
    } catch (err: any) {
      setError("Không thể tải dữ liệu form");
      setIsLoadingData(false);
    }
  };

  const handleSubmit = async (
    data: CreateProductRequest | UpdateProductRequest,
  ): Promise<Product | void> => {
    setIsLoading(true);
    try {
      const created = await productService.createProduct(
        data as CreateProductRequest,
      );
      router.push("/admin/products");
      return created;
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return <div className="text-center py-8">Đang tải...</div>;
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
          Tạo sản phẩm mới
        </h1>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <ProductForm
        categories={categories}
        styles={styles}
        spaces={spaces}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
