"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Product } from "@/types";
import { useWishlist, useQuoteCart } from "@/lib/wishlist-context";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const coverImage =
    product.media?.find((m) => m.is_cover) || product.media?.[0];
  const imageUrl = coverImage?.file_url || "/placeholder-product.svg";

  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addItem } = useQuoteCart();
  const isLiked = isInWishlist(product.id);
  const [isAdded, setIsAdded] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleWishlist(product.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product, 1, "m2");
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <div className="relative overflow-hidden rounded-xl bg-gray-100 aspect-square mb-2 md:mb-3">
        <Link href={`/products/${product.id}`}>
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
          />
        </Link>

        {/* Wishlist button — min 44px touch target */}
        <button
          onClick={handleLike}
          className="absolute top-1.5 right-1.5 md:top-2 md:right-2 p-2 md:p-2.5 min-w-[40px] min-h-[40px] md:min-w-[44px] md:min-h-[44px] flex items-center justify-center bg-white/85 backdrop-blur-sm rounded-full shadow-sm active:scale-95 transition-all z-10"
          aria-label={isLiked ? "Bỏ yêu thích" : "Yêu thích"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill={isLiked ? "#ef4444" : "none"}
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke={isLiked ? "#ef4444" : "currentColor"}
            className="w-4 h-4 md:w-5 md:h-5 text-gray-600"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </button>

        {/* Style Tags */}
        {product.style_tags && product.style_tags.length > 0 && (
          <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 flex gap-1 flex-wrap pointer-events-none">
            {product.style_tags.slice(0, 2).map((tag, i) => (
              <span
                key={tag.id ?? tag.name ?? i}
                className="px-1.5 py-0.5 bg-accent text-primary text-[9px] md:text-[10px] font-semibold rounded"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1 md:space-y-1.5">
        <Link href={`/products/${product.id}`}>
          <h3 className="text-xs md:text-sm lg:text-base font-semibold text-primary hover:text-accent transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>
        </Link>

        <p className="text-[10px] md:text-xs text-gray-500">
          SKU: {product.sku}
        </p>

        {product.space_tags && product.space_tags.length > 0 && (
          <div className="flex gap-1 md:gap-1.5 flex-wrap pt-0.5 md:pt-1">
            {product.space_tags.slice(0, 3).map((tag, i) => (
              <span
                key={tag.id ?? tag.name ?? i}
                className="px-1.5 md:px-2 py-0.5 bg-gray-100 text-gray-600 text-[9px] md:text-[10px] lg:text-xs rounded"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={handleAddToCart}
          className={`w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            isAdded
              ? "bg-emerald-500 text-white"
              : "bg-[#0a192f] text-white hover:bg-emerald-600"
          }`}
        >
          <ShoppingCart size={14} />
          {isAdded ? "Đã thêm!" : "Thêm vào giỏ"}
        </button>
      </div>
    </motion.div>
  );
}
