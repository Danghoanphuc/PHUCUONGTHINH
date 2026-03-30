"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { productService, Product } from "@/lib/product-service";
import {
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
    <div className="flex items-center gap-3 px-4 py-3 bg-[#0a192f] text-white rounded-xl mb-4 animate-in slide-in-from-top-2 duration-200">
      <span className="text-sm font-semibold mr-1">
        Đã chọn {count} sản phẩm
      </span>
      <div className="flex-1 flex items-center gap-2">
        <button
          onClick={onPublish}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-xs font-semibold transition-colors"
        >
          <Eye size={13} /> Đăng tất cả
        </button>
        <button
          onClick={onUnpublish}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-colors"
        >
          <EyeOff size={13} /> Ẩn tất cả
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-xs font-semibold transition-colors"
        >
          <Trash2 size={13} /> Xóa tất cả
        </button>
      </div>
      <button
        onClick={onClear}
        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        title="Bỏ chọn"
      >
        <X size={15} />
      </button>
    </div>
  );
}

// ── Chế độ admin: table ───────────────────────────────────────────────────────
function AdminTable({
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
                className="text-gray-400 hover:text-blue-600 transition-colors"
                title={allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
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
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    {isSelected ? (
                      <CheckSquare size={16} className="text-blue-600" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </td>
                <td className="px-5 py-3.5 text-sm font-medium text-gray-900 max-w-[260px] truncate">
                  {product.name}
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-500 font-mono">
                  {product.sku}
                </td>
                <td
                  className="px-5 py-3.5"
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
                  className="px-5 py-3.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Sửa"
                    >
                      <Pencil size={14} />
                    </Link>
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
          })}
        </tbody>
      </table>
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

  const loadProducts = useCallback(async () => {
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
    }
  }, [page, search]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Reset selection khi đổi trang/search
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
    if (selected.size === products.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map((p) => p.id)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    try {
      await productService.deleteProduct(id);
      setProducts((p) => p.filter((x) => x.id !== id));
      setTotal((t) => t - 1);
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
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể cập nhật sản phẩm");
    }
  };

  // ── Bulk actions ────────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    if (
      !confirm(
        `Bạn có chắc muốn xóa ${selected.size} sản phẩm đã chọn? Hành động này không thể hoàn tác.`,
      )
    )
      return;
    setIsBulkLoading(true);
    const ids = Array.from(selected);
    const results = await Promise.allSettled(
      ids.map((id) => productService.deleteProduct(id)),
    );
    const deleted = ids.filter((_, i) => results[i].status === "fulfilled");
    const failCount = ids.length - deleted.length;
    setProducts((p) => p.filter((x) => !deleted.includes(x.id)));
    setTotal((t) => t - deleted.length);
    setSelected(new Set());
    if (failCount > 0)
      setError(`Xóa thất bại ${failCount} sản phẩm. Vui lòng thử lại.`);
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
    setProducts((p) =>
      p.map((x) => {
        const u = updated.find((u) => u.id === x.id);
        return u ?? x;
      }),
    );
    setSelected(new Set());
    setIsBulkLoading(false);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Sản phẩm</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} sản phẩm</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0a192f] text-white rounded-xl text-sm font-semibold hover:bg-[#0d2137] transition-colors shadow-sm"
        >
          <Plus size={16} />
          Thêm sản phẩm
        </Link>
      </div>

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

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <BulkActionBar
          count={selected.size}
          onPublish={() => handleBulkPublish(true)}
          onUnpublish={() => handleBulkPublish(false)}
          onDelete={handleBulkDelete}
          onClear={() => setSelected(new Set())}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
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
          <AdminTable
            products={products}
            selected={selected}
            onToggleSelect={handleToggleSelect}
            onToggleAll={handleToggleAll}
            onPublish={handlePublish}
            onClone={handleClone}
            onDelete={handleDelete}
          />
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
          <span>
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Trước
            </button>
            <span className="px-2 font-medium text-gray-700">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
