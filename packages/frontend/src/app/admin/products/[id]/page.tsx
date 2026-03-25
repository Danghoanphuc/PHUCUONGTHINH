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
    Promise.all([
      productService.getProductById(productId),
      apiClient
        .get<MediaRecord[]>(`/media/product/${productId}`)
        .catch(() => []),
      categoryService.getCategories(),
      tagService.getStyles(),
      tagService.getSpaces(),
    ])
      .then(([prod, media, cats, stls, sps]) => {
        setProduct({ ...prod, media: media || [] });
        setCategories(cats);
        setStyles(stls);
        setSpaces(sps);
      })
      .catch(() => setError("Không thể tải sản phẩm"))
      .finally(() => setIsLoadingData(false));
  }, [productId]);

  const handleSubmit = async (
    data: UpdateProductRequest,
  ): Promise<Product | void> => {
    setIsLoading(true);
    try {
      await productService.updateProduct(productId, data);
      router.push("/products");
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
    <div>
      <div className="mb-8">
        <Link href="/products" className="text-blue-600 hover:text-blue-800">
          ← Quay lại Sản phẩm
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">
          Chỉnh sửa Sản phẩm
        </h1>
      </div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
          {error}
        </div>
      )}
      <div className="bg-white rounded-lg shadow p-8">
        <ProductForm
          product={product}
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
