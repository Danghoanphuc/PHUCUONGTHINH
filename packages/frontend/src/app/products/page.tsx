"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  Package,
  Search,
  X,
} from "lucide-react";
import { FilterTabs } from "@/components/FilterTabs";
import { InspirationFilters } from "@/components/InspirationFilters";
import { TechnicalFilters } from "@/components/TechnicalFilters";
import { ProductGrid } from "@/components/ProductGrid";
import { Pagination } from "@/components/Pagination";
import { productService } from "@/lib/product-service";
import { Product, Style, Space, FilterState } from "@/types";
import { useProductEvents } from "@/hooks/useProductEvents";

// ─── VISUAL CATEGORIES ────────────────────────────────
const VISUAL_CATEGORIES = [
  {
    id: "Big Slab",
    label: "Gạch Khổ Lớn",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=200&q=80",
  },
  {
    id: "60x120",
    label: "Gạch 60x120",
    image:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200&q=80",
  },
  {
    id: "Giả Gỗ",
    label: "Gạch Giả Gỗ",
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200&q=80",
  },
  {
    id: "Bồn Cầu",
    label: "Bồn Cầu",
    image:
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=200&q=80",
  },
  {
    id: "Lavabo",
    label: "Lavabo",
    image:
      "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=200&q=80",
  },
  {
    id: "Sen Tắm",
    label: "Sen Tắm",
    image:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=200&q=80",
  },
  {
    id: "Bồn Tắm",
    label: "Bồn Tắm",
    image:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=200&q=80",
  },
  {
    id: "Keo Dán",
    label: "Phụ Trợ",
    image:
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=200&q=80",
  },
];

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<"inspiration" | "technical">(
    "inspiration",
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState<FilterState>({ page: 1, limit: 20 });
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>([]);
  const [technicalSpecs, setTechnicalSpecs] = useState<Record<string, any>>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const sliderRef = useRef<HTMLDivElement>(null);
  const scrollSlider = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const scrollAmount = 350;
      sliderRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await productService.getProducts({
        ...filters,
        styles: selectedStyles.length > 0 ? selectedStyles : undefined,
        spaces: selectedSpaces.length > 0 ? selectedSpaces : undefined,
        technical_specs:
          Object.keys(technicalSpecs).length > 0 ? technicalSpecs : undefined,
      });
      setProducts(response.products || []);
      setStyles(response.available_filters?.inspiration?.styles || []);
      setSpaces(response.available_filters?.inspiration?.spaces || []);
      setTotalPages(response.pagination?.total_pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, selectedStyles, selectedSpaces, technicalSpecs]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  useProductEvents(fetchProducts);

  const handleToggleStyle = (id: string) => {
    setSelectedStyles((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleToggleSpace = (id: string) => {
    setSelectedSpaces((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleTechnicalSpecChange = (specs: Record<string, any>) => {
    setTechnicalSpecs(specs);
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const executeSearch = (query: string) => {
    setSearchQuery(query);
    setFilters((prev) => ({ ...prev, search: query, page: 1 }));
  };

  const clearAllFilters = () => {
    setSelectedStyles([]);
    setSelectedSpaces([]);
    setTechnicalSpecs({});
    setSearchQuery("");
    setFilters({ page: 1, limit: 20, search: "" });
  };

  return (
    <main className="min-h-screen bg-[#F8F9FA] pt-0 pb-20">
      {/* 1. Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
          <nav className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            <Link href="/" className="hover:text-[#0a192f] transition-colors">
              Trang chủ
            </Link>
            <ChevronRight size={14} />
            <span className="text-emerald-600">Sản Phẩm</span>
          </nav>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-[#0a192f] tracking-tight mb-2 md:mb-3">
              Vật Liệu Khơi Nguồn Sáng Tạo
            </h1>
            <p className="text-gray-500 text-base flex items-center gap-2">
              <Package size={18} className="text-emerald-500" />
              Hệ sinh thái giải pháp ốp lát & thiết bị vệ sinh cao cấp
            </p>
          </div>
        </div>
      </div>

      {/* 2. Visual Category Slider */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-5 relative group">
          <button
            onClick={() => scrollSlider("left")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:text-emerald-600 hover:scale-105 transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
          >
            <ChevronLeft size={20} />
          </button>

          <div
            ref={sliderRef}
            className="flex gap-3 md:gap-5 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-1"
          >
            {VISUAL_CATEGORIES.map((cat, idx) => {
              const isActive = filters.search === cat.id;
              return (
                <button
                  key={idx}
                  onClick={() => executeSearch(isActive ? "" : cat.id)}
                  className={`shrink-0 flex flex-col items-center gap-2.5 p-2 rounded-2xl transition-all w-[90px] md:w-[110px] ${
                    isActive ? "bg-emerald-50/50" : "hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden relative shadow-sm transition-all duration-300 border-2 ${isActive ? "border-emerald-500 ring-4 ring-emerald-50" : "border-gray-100"}`}
                  >
                    <Image
                      src={cat.image}
                      alt={cat.label}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span
                    className={`text-[11px] md:text-xs text-center leading-tight ${isActive ? "font-bold text-emerald-700" : "font-medium text-gray-600"}`}
                  >
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scrollSlider("right")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:text-emerald-600 hover:scale-105 transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* 3. Main Layout */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <button
            className="lg:hidden flex items-center justify-center gap-2 w-full bg-white border border-gray-200 py-3.5 rounded-xl font-bold text-gray-700 shadow-sm"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <SlidersHorizontal size={18} />
            Bộ Lọc Sản Phẩm
          </button>

          {/* Sidebar */}
          <aside
            className={`lg:col-span-1 ${showMobileFilters ? "block" : "hidden lg:block"}`}
          >
            <div className="sticky top-20 space-y-4 md:space-y-6">
              {/* Search Bar */}
              <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm mã SKU, tên SP..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && executeSearch(searchQuery)
                    }
                    className="w-full pl-11 pr-10 py-3.5 bg-gray-50 border border-transparent rounded-xl text-sm font-medium outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50 transition-all"
                  />
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => executeSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
                <FilterTabs activeTab={activeTab} onTabChange={setActiveTab} />
                <div className="mt-8">
                  {activeTab === "inspiration" ? (
                    <InspirationFilters
                      styles={styles}
                      spaces={spaces}
                      selectedStyles={selectedStyles}
                      selectedSpaces={selectedSpaces}
                      onStyleChange={handleToggleStyle}
                      onSpaceChange={handleToggleSpace}
                    />
                  ) : (
                    <TechnicalFilters
                      onFilterChange={handleTechnicalSpecChange}
                    />
                  )}
                </div>

                {(selectedStyles.length > 0 ||
                  selectedSpaces.length > 0 ||
                  Object.keys(technicalSpecs).length > 0 ||
                  filters.search) && (
                  <button
                    onClick={clearAllFilters}
                    className="w-full mt-8 px-4 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
                  >
                    Xóa tất cả bộ lọc
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-white px-4 py-3 md:px-5 md:py-4 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-xs md:text-sm font-medium text-gray-600">
                Hiển thị{" "}
                <span className="font-bold text-gray-900">
                  {products.length > 0 ? (filters.page! - 1) * 20 + 1 : 0}
                </span>{" "}
                -{" "}
                <span className="font-bold text-gray-900">
                  {Math.min(filters.page! * 20, products?.length || 0)}
                </span>{" "}
                trên tổng số{" "}
                <span className="text-emerald-600 font-black">
                  {products?.length || 0}
                </span>{" "}
                mã hàng
              </p>
            </div>

            <ProductGrid products={products} isLoading={isLoading} />

            {totalPages > 1 && (
              <div className="mt-12">
                <Pagination
                  currentPage={filters.page || 1}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    setFilters((prev) => ({ ...prev, page }));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
