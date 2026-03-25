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
      const [cats, stls, sps] = await Promise.all([
        categoryService.getCategories(),
        tagService.getStyles(),
        tagService.getSpaces(),
      ]);
      setCategories(cats);
      setStyles(stls);
      setSpaces(sps);
    } catch (err: any) {
      setError("Không thể tải dữ liệu form");
    } finally {
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
      router.push("/products");
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
    <div>
      <div className="mb-8">
        <Link href="/products" className="text-blue-600 hover:text-blue-800">
          ← Quay lại Sản phẩm
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">
          Tạo Sản phẩm mới
        </h1>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-8">
        <ProductForm
          categories={categories}
          styles={styles}
          spaces={spaces}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
