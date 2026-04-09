"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { FilterTabs } from "@/components/FilterTabs";
import { InspirationFilters } from "@/components/InspirationFilters";
import { TechnicalFilters } from "@/components/TechnicalFilters";
import { ProductGrid } from "@/components/ProductGrid";
import { Pagination } from "@/components/Pagination";
import { productService } from "@/lib/product-service";
import { Product, Style, Space, FilterState } from "@/types";

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
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

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
      setTotalItems(response.pagination?.total_items || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, selectedStyles, selectedSpaces, technicalSpecs]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: query, page: 1 }));
    }, 350);
  };

  const clearAllFilters = () => {
    setSelectedStyles([]);
    setSelectedSpaces([]);
    setTechnicalSpecs({});
    setSearchQuery("");
    setFilters({ page: 1, limit: 20, search: "" });
  };

  const activeFilterCount =
    selectedStyles.length +
    selectedSpaces.length +
    Object.keys(technicalSpecs).length;

  return (
    <main className="min-h-screen bg-[#F8F9FA] pt-0 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
        {/* Search + Filter bar */}
        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm mã SKU, tên SP..."
              value={searchQuery}
              onChange={(e) => executeSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all shadow-sm"
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

          <div className="relative">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`flex items-center gap-2 px-4 py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all ${
                showMobileFilters || activeFilterCount > 0
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-emerald-500"
              }`}
            >
              <SlidersHorizontal size={18} />
              <span className="hidden sm:inline">Bộ lọc</span>
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 bg-white text-emerald-600 rounded-full text-xs font-black">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {showMobileFilters && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMobileFilters(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-[90vw] sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-[80vh] overflow-y-auto">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-black text-gray-900">
                        Bộ lọc sản phẩm
                      </h3>
                      <button
                        onClick={() => setShowMobileFilters(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <FilterTabs
                      activeTab={activeTab}
                      onTabChange={setActiveTab}
                    />

                    <div className="mt-5">
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

                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearAllFilters}
                        className="w-full mt-5 px-4 py-2.5 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors"
                      >
                        Xóa tất cả bộ lọc
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Result count */}
        <div className="mb-4 flex items-center justify-between bg-white px-4 py-3 md:px-5 md:py-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs md:text-sm font-medium text-gray-600">
            Hiển thị{" "}
            <span className="font-bold text-gray-900">
              {totalItems > 0
                ? (filters.page! - 1) * (filters.limit || 20) + 1
                : 0}
            </span>{" "}
            -{" "}
            <span className="font-bold text-gray-900">
              {Math.min(filters.page! * (filters.limit || 20), totalItems)}
            </span>{" "}
            trên tổng số{" "}
            <span className="text-emerald-600 font-black">{totalItems}</span> mã
            hàng
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
    </main>
  );
}
