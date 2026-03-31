"use client";

import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { Product } from "@/types";
import { productService } from "@/lib/product-service";
import { ProductCard } from "./ProductCard";
import { clientCache } from "@/lib/cache-utils";

type ProductType = "gach" | "tbvs" | "bep" | "phu-tro";

interface CrossSellSectionProps {
  productType?: ProductType;
  currentProductId?: string;
  currentCategoryId?: string;
}

function getTitle(type?: ProductType): string {
  if (type === "bep") return "Combo thường mua cùng";
  if (type === "tbvs") return "Phụ kiện & Bộ hoàn chỉnh";
  return "Mua kèm thường gặp";
}

export function CrossSellSection({
  productType,
  currentProductId,
  currentCategoryId,
}: CrossSellSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentCategoryId) {
      setIsLoading(false);
      return;
    }

    const cacheKey = `crosssell:${currentCategoryId}`;
    const cached = clientCache.get<Product[]>(cacheKey);
    if (cached) {
      setProducts(cached.filter((p) => p.id !== currentProductId).slice(0, 4));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    productService
      .getProducts({ categories: [currentCategoryId], limit: 6 })
      .then((result) => {
        const all = result.products ?? [];
        clientCache.set(cacheKey, all, 5 * 60 * 1000);
        setProducts(all.filter((p) => p.id !== currentProductId).slice(0, 4));
      })
      .catch(() => setProducts([]))
      .finally(() => setIsLoading(false));
  }, [currentCategoryId, currentProductId]);

  if (isLoading) {
    return (
      <section className="mt-12">
        <div className="flex items-center gap-2 mb-5">
          <Package className="text-primary" size={22} />
          <h2 className="text-2xl font-bold text-primary">
            {getTitle(productType)}
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 aspect-square rounded-xl animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mt-12">
      <div className="flex items-center gap-2 mb-6">
        <Package className="text-primary" size={22} />
        <h2 className="text-2xl font-bold text-primary">
          {getTitle(productType)}
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product, idx) => (
          <ProductCard key={product.id} product={product} index={idx} />
        ))}
      </div>
    </section>
  );
}
