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
  List,
  LayoutGrid,
  Eye,
  EyeOff,
  Plus,
  Copy,
  Trash2,
  Pencil,
} from "lucide-react";
import { FilterTabs } from "@/components/FilterTabs";
import { InspirationFilters } from "@/components/InspirationFilters";
import { TechnicalFilters } from "@/components/TechnicalFilters";
import { ProductGrid } from "@/components/ProductGrid";
import { Pagination } from "@/components/Pagination";
import { productService } from "@/lib/product-service";
import { Product, Style, Space, FilterState } from "@/types";
import { useProductEvents } from "@/hooks/useProductEvents";
import { useAuth } from "@repo/shared-utils";

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

// ─── ADMIN TABLE (inline) ────────────────────────────────────────────────────
function AdminProductRow({
  product,
  onPublish,
  onClone,
  onDelete,
}: {
  product: Product;
  onPublish: (id: string, current: boolean) => void;
  onClone: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <tr className="hover:bg-gray-50/60 transition-colors group">
      <td className="px-5 py-3.5 text-sm font-medium text-gray-900 max-w-[280px]">
        <div className="truncate">{product.name}</div>
      </td>
      <td className="px-5 py-3.5 text-sm text-gray-500 font-mono">
        {product.sku}
      </td>
      <td className="px-5 py-3.5">
        <button
          onClick={() => onPublish(product.id, product.is_published)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${product.is_published ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
        >
          {product.is_published ? (
            <>
              <Eye size={11} />
              Đã đăng
            </>
          ) : (
            <>
              <EyeOff size={11} />
              Nháp
            </>
          )}
        </button>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <a
            href={`/admin/products/${product.id}`}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Sửa"
          >
            <Pencil size={14} />
          </a>
          <button
            onClick={() => onClone(product.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Nhân bản"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Xóa"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

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
  const { isAuthenticated } = useAuth();
  const [viewMode, setViewMode] = useState<"customer" | "admin">("customer");

  const switchToAdmin = () => {
    setViewMode("admin");
    setFilters((prev) => ({ ...prev, published: "all" as any, page: 1 }));
  };

  const switchToCustomer = () => {
    setViewMode("customer");
    setFilters((prev) => {
      const { published, ...rest } = prev as any;
      return { ...rest, page: 1 };
    });
  };
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

  const handleAdminDelete = async (id: string) => {
    if (!confirm("Xóa sản phẩm này?")) return;

    // Optimistic update - remove from UI immediately
    const deletedProduct = products.find((p) => p.id === id);
    setProducts((p) => p.filter((x) => x.id !== id));

    try {
      await productService.deleteProduct(id);
    } catch (err) {
      // Rollback on error
      if (deletedProduct) {
        setProducts((p) => [...p, deletedProduct]);
      }
      alert("Xóa sản phẩm thất bại");
    }
  };

  const handleAdminClone = async (id: string) => {
    try {
      const cloned = await productService.cloneProduct(id);
      // Add to top of list
      setProducts((p) => [cloned, ...p]);
    } catch (err) {
      alert("Nhân bản sản phẩm thất bại");
    }
  };

  const handleAdminPublish = async (id: string, isPublished: boolean) => {
    // Optimistic update - toggle immediately
    setProducts((p) =>
      p.map((x) => (x.id === id ? { ...x, is_published: !isPublished } : x)),
    );

    try {
      const updated = isPublished
        ? await productService.unpublishProduct(id)
        : await productService.publishProduct(id);
      // Update with server response
      setProducts((p) => p.map((x) => (x.id === id ? updated : x)));
    } catch (err) {
      // Rollback on error
      setProducts((p) =>
        p.map((x) => (x.id === id ? { ...x, is_published: isPublished } : x)),
      );
      alert("Cập nhật trạng thái thất bại");
    }
  };

  // ── Admin mode: layout riêng, gọn nhẹ ──────────────────────────────────────
  if (isAuthenticated && viewMode === "admin") {
    return (
      <main className="min-h-screen bg-[#f8f9fb] pb-24 lg:pb-0">
        {/* Admin toolbar */}
        <div className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-full sm:max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Tìm tên, SKU..."
              value={searchQuery}
              onChange={(e) => executeSearch(e.target.value)}
              className="w-full pl-8 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-gray-50"
            />
            {searchQuery && (
              <button
                onClick={() => executeSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={(filters as any).published || "all"}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  published: e.target.value as any,
                  page: 1,
                }))
              }
              className="flex-1 sm:flex-none px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-600"
            >
              <option value="all">Tất cả</option>
              <option value="true">Đã đăng</option>
              <option value="false">Nháp</option>
            </select>

            <div className="flex items-center gap-2 ml-auto">
              <span className="hidden sm:inline text-xs text-gray-400 whitespace-nowrap">
                {products.length} SP
              </span>
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
                <button
                  onClick={switchToCustomer}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-gray-500 hover:text-gray-700 transition-all"
                >
                  <LayoutGrid size={12} />{" "}
                  <span className="hidden sm:inline">Khách</span>
                </button>
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-white text-gray-900 shadow-sm transition-all">
                  <List size={12} />{" "}
                  <span className="hidden sm:inline">Admin</span>
                </button>
              </div>
              <Link
                href="/admin/products/new"
                className="flex items-center gap-1.5 px-3 py-2.5 bg-[#0a192f] text-white rounded-lg text-xs font-semibold hover:bg-[#0d2137] transition-colors whitespace-nowrap"
              >
                <Plus size={13} />{" "}
                <span className="hidden sm:inline">Thêm</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Table - Mobile Cards / Desktop Table */}
        <div className="px-4 md:px-6 py-4 md:py-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                Không tìm thấy sản phẩm
              </div>
            ) : (
              <>
                {/* Mobile: Card view */}
                <div className="block lg:hidden divide-y divide-gray-100">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 hover:bg-gray-50/60 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2">
                            {p.name}
                          </h3>
                          <p className="text-xs text-gray-500 font-mono">
                            {p.sku}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleAdminPublish(p.id, p.is_published)
                          }
                          className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${p.is_published ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                        >
                          {p.is_published ? (
                            <>
                              <Eye size={11} />
                              Đăng
                            </>
                          ) : (
                            <>
                              <EyeOff size={11} />
                              Nháp
                            </>
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/admin/products/${p.id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <Pencil size={12} /> Sửa
                        </a>
                        <button
                          onClick={() => handleAdminClone(p.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          <Copy size={12} /> Nhân bản
                        </button>
                        <button
                          onClick={() => handleAdminDelete(p.id)}
                          className="px-3 py-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: Table view */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/60">
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Tên
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          SKU
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {products.map((p) => (
                        <AdminProductRow
                          key={p.id}
                          product={p}
                          onPublish={handleAdminPublish}
                          onClone={handleAdminClone}
                          onDelete={handleAdminDelete}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-6">
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

  // Customer mode: layout day du
  return (
    <main className="min-h-screen bg-[#F8F9FA] pt-0 pb-20">
      {/* Unified Header - giong nhau cho ca Admin va Khach */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-6 py-3">
        <div className="flex items-center gap-3">
          {/* Search - flex-1 để chiếm hết không gian */}
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Tìm tên, SKU..."
              value={searchQuery}
              onChange={(e) => executeSearch(e.target.value)}
              className="w-full pl-8 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-gray-50"
            />
            {searchQuery && (
              <button
                onClick={() => executeSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Các nút còn lại dính sát bên phải */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Filter Button - cho customer mode */}
            {viewMode === "customer" && (
              <div className="relative">
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all whitespace-nowrap ${
                    showMobileFilters ||
                    selectedStyles.length > 0 ||
                    selectedSpaces.length > 0 ||
                    Object.keys(technicalSpecs).length > 0
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-emerald-500"
                  }`}
                >
                  <SlidersHorizontal size={16} />
                  <span className="hidden sm:inline">Lọc</span>
                  {(selectedStyles.length > 0 ||
                    selectedSpaces.length > 0 ||
                    Object.keys(technicalSpecs).length > 0) && (
                    <span className="flex items-center justify-center min-w-[20px] h-5 bg-white text-emerald-600 rounded-full text-xs font-black px-1.5">
                      {selectedStyles.length +
                        selectedSpaces.length +
                        Object.keys(technicalSpecs).length}
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

                        {(selectedStyles.length > 0 ||
                          selectedSpaces.length > 0 ||
                          Object.keys(technicalSpecs).length > 0) && (
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
            )}
          </div>

          {/* Published Filter - cho admin mode */}
          {viewMode === "admin" && (
            <select
              value={(filters as any).published || "all"}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  published: e.target.value as any,
                  page: 1,
                }))
              }
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-600"
            >
              <option value="all">Tất cả</option>
              <option value="true">Đã đăng</option>
              <option value="false">Nháp</option>
            </select>
          )}

          {/* Toggle Buttons */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={switchToCustomer}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === "customer"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <LayoutGrid size={12} />
              <span className="hidden sm:inline">Khách</span>
            </button>
            <button
              onClick={switchToAdmin}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === "admin"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <List size={12} />
              <span className="hidden sm:inline">Admin</span>
            </button>
          </div>

          {/* Add Button - chỉ hiện ở admin mode */}
          {viewMode === "admin" && (
            <Link
              href="/admin/products/new"
              className="flex items-center gap-1.5 px-3 py-2.5 bg-[#0a192f] text-white rounded-lg text-xs font-semibold hover:bg-[#0d2137] transition-colors whitespace-nowrap hidden sm:flex"
            >
              <Plus size={13} /> Thêm
            </Link>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
        {/* Search + Filter bar */}
        {!isAuthenticated && (
          <div className="mb-6 flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm mã SKU, tên SP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && executeSearch(searchQuery)
                }
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

            {/* Filter Popover Button */}
            <div className="relative">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={`flex items-center gap-2 px-4 py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all ${
                  showMobileFilters ||
                  selectedStyles.length > 0 ||
                  selectedSpaces.length > 0 ||
                  Object.keys(technicalSpecs).length > 0
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-emerald-500"
                }`}
              >
                <SlidersHorizontal size={18} />
                <span className="hidden sm:inline">Bộ lọc</span>
                {(selectedStyles.length > 0 ||
                  selectedSpaces.length > 0 ||
                  Object.keys(technicalSpecs).length > 0) && (
                  <span className="flex items-center justify-center w-5 h-5 bg-white text-emerald-600 rounded-full text-xs font-black">
                    {selectedStyles.length +
                      selectedSpaces.length +
                      Object.keys(technicalSpecs).length}
                  </span>
                )}
              </button>

              {/* Filter Dropdown */}
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

                      {(selectedStyles.length > 0 ||
                        selectedSpaces.length > 0 ||
                        Object.keys(technicalSpecs).length > 0) && (
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
        )}

        {/* Products Grid */}
        {/* Toolbar count */}
        <div className="mb-4 flex items-center justify-between bg-white px-4 py-3 md:px-5 md:py-4 rounded-2xl shadow-sm border border-gray-100">
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
    </main>
  );
}
