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

  useEffect(() => {
    if (staticDataCache.getCategories()) return; // already cached
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
  }, []);

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
