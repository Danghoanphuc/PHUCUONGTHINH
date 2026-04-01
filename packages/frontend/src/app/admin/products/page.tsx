"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { productService, Product } from "@/lib/product-service";
import {
  ImageIcon,
  Eye,
  EyeOff,
  Plus,
  Search,
  Copy,
  Trash2,
  Pencil,
  CheckSquare,
  Square,
  X,
} from "lucide-react";

// ── Thumbnail helper ──────────────────────────────────────────────────────────
function getCoverUrl(product: Product): string | null {
  const media = product.media;
  if (!media?.length) return null;
  return (media.find((m) => m.is_cover) ?? media[0])?.file_url ?? null;
}

function Thumbnail({ url }: { url: string | null }) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        loading="lazy"
        className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
      <ImageIcon size={14} className="text-gray-300" />
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
}: {
  count: number;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl mb-4">
      <span className="text-sm font-semibold flex-1 min-w-0">
        Đã chọn {count} SP
      </span>
      <button
        onClick={onPublish}
        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-xs font-semibold"
      >
        <Eye size={12} /> Đăng
      </button>
      <button
        onClick={onUnpublish}
        className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold"
      >
        <EyeOff size={12} /> Ẩn
      </button>
      <button
        onClick={onDelete}
        className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-xs font-semibold"
      >
        <Trash2 size={12} /> Xóa
      </button>
      <button onClick={onClear} className="p-1.5 hover:bg-white/10 rounded-lg">
        <X size={14} />
      </button>
    </div>
  );
}

// ── Desktop table ─────────────────────────────────────────────────────────────
function DesktopTable({
  products,
  selected,
  onToggleSelect,
  onToggleAll,
  onPublish,
  onClone,
  onDelete,
}: {
  products: Product[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  onPublish: (id: string, current: boolean) => void;
  onClone: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const allSelected = products.length > 0 && selected.size === products.length;
  const someSelected = selected.size > 0 && selected.size < products.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60">
            <th className="px-4 py-3 w-10">
              <button
                onClick={onToggleAll}
                className="text-gray-400 hover:text-blue-600"
              >
                {allSelected ? (
                  <CheckSquare size={16} className="text-blue-600" />
                ) : someSelected ? (
                  <CheckSquare size={16} className="text-blue-400" />
                ) : (
                  <Square size={16} />
                )}
              </button>
            </th>
            <th className="px-4 py-3 w-14 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Ảnh
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Tên
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              SKU
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Trạng thái
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {products.map((product) => {
            const isSelected = selected.has(product.id);
            return (
              <tr
                key={product.id}
                className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${isSelected ? "bg-blue-50/40" : ""}`}
                onClick={() => onToggleSelect(product.id)}
              >
                <td
                  className="px-4 py-3.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onToggleSelect(product.id)}
                    className="text-gray-400 hover:text-blue-600"
                  >
                    {isSelected ? (
                      <CheckSquare size={16} className="text-blue-600" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </td>
                <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                  <Thumbnail url={getCoverUrl(product)} />
                </td>
                <td
                  className="px-4 py-3.5 text-sm font-medium text-gray-900 max-w-[260px] truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    href={`/products/${product.id}`}
                    className="hover:text-blue-600 hover:underline"
                  >
                    {product.name}
                  </Link>
                </td>
                <td className="px-4 py-3.5 text-sm text-gray-500 font-mono">
                  {product.sku}
                </td>
                <td
                  className="px-4 py-3.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onPublish(product.id, product.is_published)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${product.is_published ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                  >
                    {product.is_published ? (
                      <>
                        <Eye size={11} /> Đã đăng
                      </>
                    ) : (
                      <>
                        <EyeOff size={11} /> Nháp
                      </>
                    )}
                  </button>
                </td>
                <td
                  className="px-4 py-3.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                      title="Sửa"
                    >
                      <Pencil size={14} />
                    </Link>
                    <button
                      onClick={() => onClone(product.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                      title="Nhân bản"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                      title="Xóa"
                    >
                      <Trash2 size={14} />
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

// ── Mobile card list ──────────────────────────────────────────────────────────
function MobileCardList({
  products,
  selected,
  onToggleSelect,
  onPublish,
  onClone,
  onDelete,
}: {
  products: Product[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onPublish: (id: string, current: boolean) => void;
  onClone: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {products.map((product) => {
        const isSelected = selected.has(product.id);
        return (
          <div
            key={product.id}
            className={`bg-white rounded-2xl border p-4 transition-colors ${isSelected ? "border-blue-300 bg-blue-50/30" : "border-gray-100"}`}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <button
                onClick={() => onToggleSelect(product.id)}
                className="mt-0.5 shrink-0 text-gray-400 hover:text-blue-600"
              >
                {isSelected ? (
                  <CheckSquare size={16} className="text-blue-600" />
                ) : (
                  <Square size={16} />
                )}
              </button>

              {/* Thumbnail */}
              <Thumbnail url={getCoverUrl(product)} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${product.id}`}
                  className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 hover:text-blue-600"
                >
                  {product.name}
                </Link>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  {product.sku}
                </p>
              </div>

              {/* Status badge */}
              <button
                onClick={() => onPublish(product.id, product.is_published)}
                className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${product.is_published ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
              >
                {product.is_published ? (
                  <>
                    <Eye size={10} /> Đăng
                  </>
                ) : (
                  <>
                    <EyeOff size={10} /> Nháp
                  </>
                )}
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
              <Link
                href={`/admin/products/${product.id}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <Pencil size={13} /> Sửa
              </Link>
              <button
                onClick={() => onClone(product.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <Copy size={13} /> Nhân bản
              </button>
              <button
                onClick={() => onDelete(product.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <Trash2 size={13} /> Xóa
              </button>
            </div>
          </div>
        );
      })}
    </div>
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
  const limit = 20;

  // Stable reference to track if we're already loading
  const isLoadingRef = useRef(false);

  const loadProducts = useCallback(async () => {
    // Prevent concurrent loads
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    setError("");
    try {
      const response = await productService.getProducts(page, limit, search);
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
  }, [page, search]);

  // Initial load and reload on page/search change
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // DISABLED: Real-time updates causing infinite loop
  // User can manually refresh (F5) to see latest changes
  // TODO: Implement proper WebSocket with room-based events
  // useProductEvents(handleProductEvent);

  useEffect(() => {
    setSelected(new Set());
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

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    try {
      await productService.deleteProduct(id);
      setProducts((p) => p.filter((x) => x.id !== id));
      setTotal((t) => t - 1);
      // Reload to ensure fresh data from server
      await loadProducts();
    } catch (err: any) {
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
    try {
      const updated = isPublished
        ? await productService.unpublishProduct(id)
        : await productService.publishProduct(id);
      setProducts((p) => p.map((x) => (x.id === id ? updated : x)));
      // Reload to ensure fresh data from server
      await loadProducts();
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể cập nhật sản phẩm");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Xóa ${selected.size} sản phẩm đã chọn? Không thể hoàn tác.`))
      return;
    setIsBulkLoading(true);
    const ids = Array.from(selected);
    const results = await Promise.allSettled(
      ids.map((id) => productService.deleteProduct(id)),
    );
    const deleted = ids.filter((_, i) => results[i].status === "fulfilled");
    setProducts((p) => p.filter((x) => !deleted.includes(x.id)));
    setTotal((t) => t - deleted.length);
    setSelected(new Set());
    const failCount = ids.length - deleted.length;
    if (failCount > 0) setError(`Xóa thất bại ${failCount} sản phẩm.`);
    setIsBulkLoading(false);
  };

  const handleBulkPublish = async (publish: boolean) => {
    setIsBulkLoading(true);
    const ids = Array.from(selected);
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
    setProducts((p) => p.map((x) => updated.find((u) => u.id === x.id) ?? x));
    setSelected(new Set());
    setIsBulkLoading(false);
    // Reload to ensure fresh data from server
    await loadProducts();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-gray-900">Sản phẩm</h1>
          <p className="text-xs text-gray-400 mt-0.5">{total} sản phẩm</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm"
        >
          <Plus size={15} /> Thêm
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="ml-3 text-red-400 hover:text-red-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Bulk bar */}
      {selected.size > 0 && (
        <BulkActionBar
          count={selected.size}
          onPublish={() => handleBulkPublish(true)}
          onUnpublish={() => handleBulkPublish(false)}
          onDelete={handleBulkDelete}
          onClear={() => setSelected(new Set())}
        />
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Tìm theo tên, SKU..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !products.length ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Không tìm thấy sản phẩm
        </div>
      ) : (
        <div className={isBulkLoading ? "opacity-60 pointer-events-none" : ""}>
          {/* Mobile: card list */}
          <div className="md:hidden">
            <MobileCardList
              products={products}
              selected={selected}
              onToggleSelect={handleToggleSelect}
              onPublish={handlePublish}
              onClone={handleClone}
              onDelete={handleDelete}
            />
          </div>
          {/* Desktop: table */}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between text-sm text-gray-500">
          <span>
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Trước
            </button>
            <span className="px-2 font-medium text-gray-700">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
