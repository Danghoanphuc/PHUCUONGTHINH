"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { productService, Product } from "@/lib/product-service";
import {
  ImageIcon,
  Globe,
  Archive,
  Plus,
  Search,
  Copy,
  Trash2,
  Pencil,
  CheckCircle2,
  Circle,
  X,
} from "lucide-react";

// ── Thumbnail helper ──────────────────────────────────────────────────────────
function getCoverUrl(product: Product): string | null {
  const media = product.media;
  if (!media?.length) return null;
  return (media.find((m) => m.is_cover) ?? media[0])?.file_url ?? null;
}

function ProductAvatar({ url }: { url: string | null }) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        loading="lazy"
        className="w-12 h-12 rounded-[12px] object-cover bg-[#F2F2F7] shrink-0 border border-black/5"
      />
    );
  }
  return (
    <div className="w-12 h-12 rounded-[12px] bg-[#F2F2F7] flex items-center justify-center shrink-0 border border-black/5">
      <ImageIcon size={20} className="text-[#8E8E93]" strokeWidth={1.5} />
    </div>
  );
}

// ── Bulk action bar ───────────────────────────────────────────────────────────
function BulkActionBar({
  count,
  onPublish,
  onUnpublish,
  onDelete,
  onClear,
}: any) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-5 py-3 bg-white/80 backdrop-blur-xl border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-[20px] mb-6 animate-in slide-in-from-top-4 fade-in duration-200">
      <span className="text-[15px] font-semibold text-black flex-1 min-w-0">
        Đã chọn {count}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onPublish}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#34C759]/10 text-[#34C759] hover:bg-[#34C759]/20 rounded-[10px] text-[14px] font-semibold transition-colors active:scale-95"
        >
          <Globe size={16} strokeWidth={2} /> Đăng lên
        </button>
        <button
          onClick={onUnpublish}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8E8E93]/10 text-[#8E8E93] hover:bg-[#8E8E93]/20 rounded-[10px] text-[14px] font-semibold transition-colors active:scale-95"
        >
          <Archive size={16} strokeWidth={2} /> Lưu nháp
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF3B30]/10 text-[#FF3B30] hover:bg-[#FF3B30]/20 rounded-[10px] text-[14px] font-semibold transition-colors active:scale-95"
        >
          <Trash2 size={16} strokeWidth={2} /> Xóa
        </button>
        <div className="w-[1px] h-6 bg-[#E5E5EA] mx-1" />
        <button
          onClick={onClear}
          className="p-1.5 text-[#8E8E93] hover:bg-[#E5E5EA] hover:text-black rounded-full transition-colors"
          title="Hủy chọn"
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

// ── Desktop table (Kiểu macOS) ────────────────────────────────────────────────
function DesktopTable({
  products,
  selected,
  onToggleSelect,
  onToggleAll,
  onPublish,
  onClone,
  onDelete,
}: any) {
  const allSelected = products.length > 0 && selected.size === products.length;
  const someSelected = selected.size > 0 && selected.size < products.length;

  return (
    <div className="bg-white rounded-[24px] border border-[#E5E5EA] shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#E5E5EA] bg-[#F9F9F9]">
            <th className="px-5 py-3 w-12 text-left">
              <button
                onClick={onToggleAll}
                className="text-[#C7C7CC] hover:text-[#007AFF] transition-colors focus:outline-none"
              >
                {allSelected ? (
                  <CheckCircle2
                    size={20}
                    className="text-[#007AFF]"
                    fill="#007AFF"
                    color="white"
                  />
                ) : someSelected ? (
                  <CheckCircle2
                    size={20}
                    className="text-[#007AFF]/50"
                    fill="currentColor"
                    color="white"
                  />
                ) : (
                  <Circle size={20} strokeWidth={1.5} />
                )}
              </button>
            </th>
            <th className="px-4 py-3 w-16 text-left text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wider">
              Ảnh
            </th>
            <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wider">
              Sản phẩm
            </th>
            <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wider">
              SKU
            </th>
            <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wider">
              Trạng thái
            </th>
            <th className="px-5 py-3 text-right text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wider">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E5EA]">
          {products.map((product: any) => {
            const isSelected = selected.has(product.id);
            return (
              <tr
                key={product.id}
                className={`transition-colors cursor-pointer group ${isSelected ? "bg-[#007AFF]/[0.03]" : "hover:bg-[#F2F2F7]/60"}`}
                onClick={() => onToggleSelect(product.id)}
              >
                <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onToggleSelect(product.id)}
                    className="text-[#C7C7CC] hover:text-[#007AFF] transition-colors focus:outline-none"
                  >
                    {isSelected ? (
                      <CheckCircle2
                        size={20}
                        className="text-[#007AFF]"
                        fill="#007AFF"
                        color="white"
                      />
                    ) : (
                      <Circle size={20} strokeWidth={1.5} />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <ProductAvatar url={getCoverUrl(product)} />
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/p/${product.sku}`}
                    className="text-[15px] font-semibold text-black hover:text-[#007AFF] line-clamp-1 transition-colors"
                  >
                    {product.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[14px] text-[#8E8E93] font-mono">
                  {product.sku}
                </td>

                {/* MAC OS STATUS DOT */}
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onPublish(product.id, product.is_published)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] hover:bg-[#F2F2F7] active:bg-[#E5E5EA] transition-colors"
                  >
                    <span className="relative flex items-center justify-center w-2.5 h-2.5">
                      {product.is_published && (
                        <span className="absolute inline-flex w-full h-full rounded-full bg-[#34C759] opacity-40 blur-[2px]" />
                      )}
                      <span
                        className={`relative inline-flex rounded-full w-2.5 h-2.5 ${product.is_published ? "bg-[#34C759]" : "bg-[#C7C7CC]"}`}
                      />
                    </span>
                    <span
                      className={`text-[13px] font-medium transition-colors ${product.is_published ? "text-black" : "text-[#8E8E93]"}`}
                    >
                      {product.is_published ? "Đang hiển thị" : "Bản nháp"}
                    </span>
                  </button>
                </td>

                <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="p-2 rounded-[10px] text-[#8E8E93] hover:text-[#007AFF] hover:bg-[#007AFF]/10 transition-colors"
                    >
                      <Pencil size={18} strokeWidth={1.5} />
                    </Link>
                    <button
                      onClick={() => onClone(product.id)}
                      className="p-2 rounded-[10px] text-[#8E8E93] hover:text-black hover:bg-[#E5E5EA] transition-colors"
                    >
                      <Copy size={18} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="p-2 rounded-[10px] text-[#8E8E93] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors"
                    >
                      <Trash2 size={18} strokeWidth={1.5} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Mobile Card List (Toggle Switch & Long Press Fix) ─────────────────────────
function MobileCardList({
  products,
  selected,
  onToggleSelect,
  onPublish,
  onClone,
  onDelete,
  isSelectionMode,
  setIsSelectionMode,
}: any) {
  const router = useRouter();
  const [contextMenuProduct, setContextMenuProduct] = useState<Product | null>(
    null,
  );
  const touchTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (product: Product) => {
    if (isSelectionMode) return;
    touchTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      setContextMenuProduct(product);
    }, 400);
  };

  const handleTouchEnd = () => {
    if (touchTimer.current) clearTimeout(touchTimer.current);
  };

  return (
    <>
      <div className="bg-white rounded-[24px] shadow-[0_1px_5px_rgba(0,0,0,0.02)] border border-[#E5E5EA] overflow-hidden">
        {products.map((product: Product, index: number) => {
          const isSelected = selected.has(product.id);
          return (
            <div
              key={product.id}
              onTouchStart={() => handleTouchStart(product)}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchEnd}
              onClick={(e) => {
                if (isSelectionMode) {
                  e.preventDefault();
                  onToggleSelect(product.id);
                } else {
                  router.push(`/p/${product.sku}`);
                }
              }}
              style={{ WebkitTouchCallout: "none" }}
              className={`p-4 flex items-center gap-3 transition-colors cursor-pointer select-none ${
                isSelected ? "bg-[#007AFF]/[0.05]" : "active:bg-[#F2F2F7]"
              } ${index !== products.length - 1 ? "border-b border-[#E5E5EA]" : ""}`}
            >
              <AnimatePresence>
                {isSelectionMode && (
                  <motion.div
                    initial={{ width: 0, opacity: 0, scale: 0.5 }}
                    animate={{ width: "auto", opacity: 1, scale: 1 }}
                    exit={{ width: 0, opacity: 0, scale: 0.5 }}
                    className="shrink-0 mr-1"
                  >
                    {isSelected ? (
                      <CheckCircle2
                        size={24}
                        className="text-[#007AFF]"
                        fill="#007AFF"
                        color="white"
                      />
                    ) : (
                      <Circle size={24} className="text-[#C7C7CC]" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <ProductAvatar url={getCoverUrl(product)} />

              <div className="flex-1 min-w-0 pr-2">
                <p className="text-[17px] font-semibold text-black leading-snug line-clamp-1">
                  {product.name}
                </p>
                <p className="text-[14px] text-[#8E8E93] font-mono mt-0.5">
                  {product.sku}
                </p>
              </div>

              {/* CÔNG TẮC iOS (TOGGLE SWITCH) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPublish(product.id, product.is_published);
                }}
                className={`relative w-[44px] h-[24px] rounded-full transition-colors duration-300 ease-in-out shrink-0 outline-none ${
                  product.is_published ? "bg-[#34C759]" : "bg-[#E5E5EA]"
                }`}
              >
                <div
                  className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] bg-white rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.16)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    product.is_published
                      ? "translate-x-[20px]"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Menu Ngữ Cảnh (Bottom Sheet) ── */}
      <AnimatePresence>
        {contextMenuProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm"
              onClick={() => setContextMenuProduct(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 inset-x-0 z-[70] bg-[#F2F2F7] rounded-t-[32px] p-5 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.15)]"
            >
              <div className="bg-white rounded-[20px] p-4 mb-4 flex items-center gap-4 shadow-sm select-none">
                <ProductAvatar url={getCoverUrl(contextMenuProduct)} />
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-bold text-black line-clamp-1">
                    {contextMenuProduct.name}
                  </p>
                  <p className="text-[13px] text-[#8E8E93] font-mono mt-0.5">
                    {contextMenuProduct.sku}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-[20px] overflow-hidden flex flex-col shadow-sm select-none">
                <button
                  onClick={() => {
                    router.push(`/admin/products/${contextMenuProduct.id}`);
                    setContextMenuProduct(null);
                  }}
                  className="p-4 text-[17px] font-medium text-black border-b border-[#E5E5EA] active:bg-[#F2F2F7] flex items-center justify-between"
                >
                  Chỉnh sửa sản phẩm{" "}
                  <Pencil size={20} className="text-[#8E8E93]" />
                </button>
                <button
                  onClick={() => {
                    onClone(contextMenuProduct.id);
                    setContextMenuProduct(null);
                  }}
                  className="p-4 text-[17px] font-medium text-black border-b border-[#E5E5EA] active:bg-[#F2F2F7] flex items-center justify-between"
                >
                  Nhân bản sản phẩm{" "}
                  <Copy size={20} className="text-[#8E8E93]" />
                </button>
                <button
                  onClick={() => {
                    setIsSelectionMode(true);
                    onToggleSelect(contextMenuProduct.id);
                    setContextMenuProduct(null);
                  }}
                  className="p-4 text-[17px] font-medium text-black active:bg-[#F2F2F7] flex items-center justify-between"
                >
                  Chọn nhiều sản phẩm{" "}
                  <CheckCircle2 size={20} className="text-[#8E8E93]" />
                </button>
              </div>

              <div className="bg-white rounded-[20px] overflow-hidden mt-4 shadow-sm select-none">
                <button
                  onClick={() => {
                    onDelete(contextMenuProduct.id);
                    setContextMenuProduct(null);
                  }}
                  className="w-full p-4 text-[17px] font-semibold text-[#FF3B30] active:bg-[#F2F2F7]"
                >
                  Xóa sản phẩm
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const limit = 20;

  const isLoadingRef = useRef(false);

  const loadProducts = useCallback(
    async (bustCache = false) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setIsLoading(true);
      setError("");
      try {
        const response = await productService.getProducts(
          page,
          limit,
          search,
          bustCache,
        );
        setProducts(response.products);
        setTotal(response.pagination.total);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Không thể tải danh sách sản phẩm",
        );
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    },
    [page, search],
  );

  useEffect(() => {
    loadProducts(true);
  }, [loadProducts]);
  useEffect(() => {
    setSelected(new Set());
    setIsSelectionMode(false);
  }, [page, search]);

  const handleToggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleToggleAll = () => {
    setSelected(
      selected.size === products.length
        ? new Set()
        : new Set(products.map((p) => p.id)),
    );
  };

  const handleClearSelection = () => {
    setSelected(new Set());
    setIsSelectionMode(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    const deletedProduct = products.find((p) => p.id === id);
    setProducts((p) => p.filter((x) => x.id !== id));
    setTotal((t) => t - 1);
    try {
      await productService.deleteProduct(id);
      await loadProducts(true);
    } catch (err: any) {
      if (err.response?.status === 404) {
        await loadProducts(true);
        return;
      }
      if (deletedProduct) {
        setProducts((p) => [...p, deletedProduct]);
        setTotal((t) => t + 1);
      }
      setError(err.response?.data?.message || "Không thể xóa sản phẩm");
    }
  };

  const handleClone = async (id: string) => {
    try {
      const cloned = await productService.cloneProduct(id);
      setProducts((p) => [cloned, ...p]);
      setTotal((t) => t + 1);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể nhân bản sản phẩm");
    }
  };

  const handlePublish = async (id: string, isPublished: boolean) => {
    // Optimistic update
    setProducts((p) =>
      p.map((x) => (x.id === id ? { ...x, is_published: !isPublished } : x)),
    );

    try {
      const updated = isPublished
        ? await productService.unpublishProduct(id)
        : await productService.publishProduct(id);
      // Update with actual data from API
      setProducts((p) => p.map((x) => (x.id === id ? updated : x)));
      // REMOVED: await loadProducts(true) - to prevent flickering from stale cache
    } catch (err: any) {
      // Rollback on error
      setProducts((p) =>
        p.map((x) => (x.id === id ? { ...x, is_published: isPublished } : x)),
      );
      setError(err.response?.data?.message || "Không thể cập nhật sản phẩm");
      await loadProducts(true);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Xóa ${selected.size} sản phẩm đã chọn? Không thể hoàn tác.`))
      return;
    setIsBulkLoading(true);
    const ids = Array.from(selected);
    const deletedProducts = products.filter((p) => ids.includes(p.id));
    setProducts((p) => p.filter((x) => !ids.includes(x.id)));
    setTotal((t) => t - ids.length);
    setSelected(new Set());

    const results = await Promise.allSettled(
      ids.map((id) => productService.deleteProduct(id)),
    );
    const deleted = ids.filter((_, i) => results[i].status === "fulfilled");
    const failCount = ids.length - deleted.length;

    if (failCount > 0) {
      const failedIds = ids.filter((_, i) => results[i].status === "rejected");
      const restored = deletedProducts.filter((p) => failedIds.includes(p.id));
      setProducts((p) => [...p, ...restored]);
      setTotal((t) => t + restored.length);
      setError(`Xóa thất bại ${failCount} sản phẩm.`);
    }
    setIsBulkLoading(false);
    setIsSelectionMode(false);
    await loadProducts(true);
  };

  const handleBulkPublish = async (publish: boolean) => {
    setIsBulkLoading(true);
    const ids = Array.from(selected);
    // Optimistic update
    setProducts((p) =>
      p.map((x) => (ids.includes(x.id) ? { ...x, is_published: publish } : x)),
    );
    setSelected(new Set());

    const results = await Promise.allSettled(
      ids.map((id) =>
        publish
          ? productService.publishProduct(id)
          : productService.unpublishProduct(id),
      ),
    );
    const updated: Product[] = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<Product>).value);
    // Update with actual data from API
    setProducts((p) => p.map((x) => updated.find((u) => u.id === x.id) ?? x));
    setIsBulkLoading(false);
    setIsSelectionMode(false);
    // REMOVED: await loadProducts(true) - to prevent flickering from stale cache
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-sans pb-24">
      <div className="p-5 md:p-8 max-w-[1400px] mx-auto">
        {/* ── HEADER ── */}
        <div className="flex items-center justify-between mb-6 h-12">
          {isSelectionMode ? (
            <div className="w-full flex items-center justify-between md:hidden animate-in fade-in">
              <button
                onClick={handleClearSelection}
                className="text-[17px] font-medium text-[#007AFF] active:opacity-70 transition-opacity"
              >
                Hủy
              </button>
              <h1 className="text-[17px] font-semibold text-black tracking-tight">
                {selected.size > 0 ? `Đã chọn ${selected.size}` : "Chọn SP"}
              </h1>
              <button
                onClick={handleToggleAll}
                className="text-[17px] font-medium text-[#007AFF] active:opacity-70 transition-opacity"
              >
                Tất cả
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between animate-in fade-in">
              <div>
                <h1 className="text-[34px] font-bold text-black tracking-tight leading-none mb-1">
                  Sản phẩm
                </h1>
                <p className="text-[15px] text-[#8E8E93] font-medium">
                  {total} sản phẩm trong hệ thống
                </p>
              </div>
              <Link
                href="/admin/products/new"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#007AFF] text-white rounded-[14px] text-[15px] font-semibold hover:bg-[#007AFF]/90 active:scale-95 transition-all shadow-[0_2px_10px_rgba(0,122,255,0.3)]"
              >
                <Plus size={18} strokeWidth={2} /> Thêm
              </Link>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#FF3B30]/10 rounded-[16px] text-[#FF3B30] text-[15px] font-medium flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="ml-3 text-[#FF3B30]/70 hover:text-[#FF3B30] transition-colors"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        )}

        {selected.size > 0 && (
          <BulkActionBar
            count={selected.size}
            onPublish={() => handleBulkPublish(true)}
            onUnpublish={() => handleBulkPublish(false)}
            onDelete={handleBulkDelete}
            onClear={handleClearSelection}
          />
        )}

        <div className="relative mb-6">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93]"
            strokeWidth={2}
          />
          <input
            type="text"
            placeholder="Tìm theo tên, SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-11 pr-4 py-3 bg-[#E5E5EA]/60 border-2 border-transparent rounded-[16px] text-[17px] focus:outline-none focus:bg-white focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 transition-all text-black placeholder:text-[#8E8E93]"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#007AFF]/20 border-t-[#007AFF] rounded-full animate-spin" />
          </div>
        ) : !products.length ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-[#E5E5EA] rounded-[18px] flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-[#8E8E93]" />
            </div>
            <p className="text-[17px] font-medium text-black">Không tìm thấy</p>
          </div>
        ) : (
          <div
            className={
              isBulkLoading
                ? "opacity-50 pointer-events-none transition-opacity"
                : "transition-opacity"
            }
          >
            <div className="md:hidden">
              <MobileCardList
                products={products}
                selected={selected}
                onToggleSelect={handleToggleSelect}
                onPublish={handlePublish}
                onClone={handleClone}
                onDelete={handleDelete}
                isSelectionMode={isSelectionMode}
                setIsSelectionMode={setIsSelectionMode}
              />
            </div>
            <div className="hidden md:block">
              <DesktopTable
                products={products}
                selected={selected}
                onToggleSelect={handleToggleSelect}
                onToggleAll={handleToggleAll}
                onPublish={handlePublish}
                onClone={handleClone}
                onDelete={handleDelete}
              />
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between text-[15px]">
            <span className="text-[#8E8E93] font-medium">
              {(page - 1) * limit + 1} – {Math.min(page * limit, total)} của{" "}
              {total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-[#E5E5EA] rounded-[12px] font-semibold text-black hover:bg-[#F2F2F7] disabled:opacity-40 transition-colors active:scale-95"
              >
                Trước
              </button>
              <div className="px-3 font-semibold text-black">
                {page} / {totalPages}
              </div>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white border border-[#E5E5EA] rounded-[12px] font-semibold text-black hover:bg-[#F2F2F7] disabled:opacity-40 transition-colors active:scale-95"
              >
                Tiếp
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
