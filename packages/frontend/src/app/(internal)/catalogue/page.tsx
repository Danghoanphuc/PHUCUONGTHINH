"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  category_id: string | null;
  is_published: boolean;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface InternalInfo {
  cost_price: number | null;
  supplier_name: string | null;
  supplier_contact: string | null;
  internal_notes: string | null;
}

interface ImportJob {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  file_name: string;
  created_at: string;
}

interface ExtractedProduct {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

async function patchProduct(id: string, data: Record<string, unknown>) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const res = await fetch(API_URL + `/products/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(
      new Error((err as any)?.error?.message || "HTTP " + res.status),
      { status: res.status },
    );
  }
}

async function patchProductInternal(id: string, data: Record<string, unknown>) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const res = await fetch(API_URL + `/products/${id}/internal`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || "HTTP " + res.status);
  }
}

// ─── Add Product Form ─────────────────────────────────────────────────────────

function AddProductForm({
  categories,
  onClose,
}: {
  categories: Category[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category_id: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.post("/products", {
        name: form.name,
        sku: form.sku,
        category_id: form.category_id || undefined,
        description: form.description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalogue-products"] });
      onClose();
    },
    onError: (err: any) => {
      if (
        err?.message?.includes("409") ||
        err?.message?.toLowerCase().includes("sku")
      ) {
        setError("SKU đã tồn tại");
      } else {
        setError(err?.message || "Có lỗi xảy ra");
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.sku.trim()) {
      setError("Tên và SKU là bắt buộc");
      return;
    }
    mutation.mutate();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 space-y-3"
    >
      <h2 className="text-sm font-semibold text-blue-800">Thêm sản phẩm mới</h2>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs text-gray-600 mb-1">
            Tên sản phẩm <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Tên sản phẩm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">
            SKU <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.sku}
            onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
            placeholder="SKU"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Danh mục</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.category_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, category_id: e.target.value }))
            }
          >
            <option value="">— Chọn danh mục —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-xs text-gray-600 mb-1">Mô tả</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Mô tả (tuỳ chọn)"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
        >
          {mutation.isPending ? "Đang lưu..." : "Tạo sản phẩm"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg"
        >
          Huỷ
        </button>
      </div>
    </form>
  );
}

// ─── Edit Product Form ────────────────────────────────────────────────────────

function EditProductForm({
  product,
  categories,
  onClose,
}: {
  product: Product;
  categories: Category[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: product.name,
    sku: product.sku,
    category_id: product.category_id ?? "",
    description: product.description ?? "",
  });
  const [internalForm, setInternalForm] = useState<InternalInfo>({
    cost_price: null,
    supplier_name: null,
    supplier_contact: null,
    internal_notes: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load existing internal info
  const { data: internalData } = useQuery<InternalInfo | null>({
    queryKey: ["internal-product", product.id],
    queryFn: () =>
      apiClient.get<InternalInfo | null>(`/products/${product.id}/internal`),
  });

  useEffect(() => {
    if (internalData) {
      setInternalForm({
        cost_price: internalData.cost_price,
        supplier_name: internalData.supplier_name,
        supplier_contact: internalData.supplier_contact,
        internal_notes: internalData.internal_notes,
      });
    }
  }, [internalData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await patchProduct(product.id, {
        name: form.name,
        sku: form.sku,
        category_id: form.category_id || null,
        description: form.description || null,
      });
      await patchProductInternal(product.id, {
        cost_price: internalForm.cost_price,
        supplier_name: internalForm.supplier_name || null,
        supplier_contact: internalForm.supplier_contact || null,
        internal_notes: internalForm.internal_notes || null,
      });
      queryClient.invalidateQueries({ queryKey: ["catalogue-products"] });
      queryClient.invalidateQueries({
        queryKey: ["internal-product", product.id],
      });
      onClose();
    } catch (err: any) {
      if (err?.status === 409 || err?.message?.toLowerCase().includes("sku")) {
        setError("SKU đã tồn tại");
      } else {
        setError(err?.message || "Có lỗi xảy ra");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-2 space-y-3"
    >
      <h3 className="text-sm font-semibold text-gray-700">
        Chỉnh sửa sản phẩm
      </h3>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs text-gray-600 mb-1">
            Tên sản phẩm
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">SKU</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.sku}
            onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Danh mục</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.category_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, category_id: e.target.value }))
            }
          >
            <option value="">— Chọn danh mục —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-xs text-gray-600 mb-1">Mô tả</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
        </div>
      </div>

      {/* Internal info section */}
      <div className="border-t border-gray-200 pt-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Thông tin nội bộ
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Giá vốn (đ)
            </label>
            <input
              type="number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={internalForm.cost_price ?? ""}
              onChange={(e) =>
                setInternalForm((f) => ({
                  ...f,
                  cost_price: e.target.value ? Number(e.target.value) : null,
                }))
              }
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Nhà cung cấp
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={internalForm.supplier_name ?? ""}
              onChange={(e) =>
                setInternalForm((f) => ({
                  ...f,
                  supplier_name: e.target.value || null,
                }))
              }
              placeholder="Tên NCC"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-xs text-gray-600 mb-1">
              Liên hệ NCC
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={internalForm.supplier_contact ?? ""}
              onChange={(e) =>
                setInternalForm((f) => ({
                  ...f,
                  supplier_contact: e.target.value || null,
                }))
              }
              placeholder="SĐT / email NCC"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-xs text-gray-600 mb-1">
              Ghi chú nội bộ
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              value={internalForm.internal_notes ?? ""}
              onChange={(e) =>
                setInternalForm((f) => ({
                  ...f,
                  internal_notes: e.target.value || null,
                }))
              }
              placeholder="Ghi chú nội bộ"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg"
        >
          Huỷ
        </button>
      </div>
    </form>
  );
}

// ─── PDF Import Panel ─────────────────────────────────────────────────────────

function ImportPDFPanel({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<ImportJob["status"] | null>(null);
  const [extractedProducts, setExtractedProducts] = useState<
    ExtractedProduct[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => {
    return () => stopPolling();
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    setJobId(null);
    setJobStatus(null);
    setExtractedProducts([]);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(API_URL + "/import/jobs", {
        method: "POST",
        headers: token ? { Authorization: "Bearer " + token } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any)?.error?.message || "HTTP " + res.status);
      }
      const json = await res.json();
      const id: string = json?.data?.id ?? json?.id;
      setJobId(id);
      setJobStatus("PENDING");
      startPolling(id);
    } catch (err: any) {
      setError(err?.message || "Upload thất bại");
    } finally {
      setUploading(false);
    }
  }

  function startPolling(id: string) {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("auth_token")
            : null;
        const res = await fetch(API_URL + `/import/jobs/${id}`, {
          headers: token ? { Authorization: "Bearer " + token } : {},
        });
        if (!res.ok) return;
        const json = await res.json();
        const job: ImportJob = json?.data ?? json;
        setJobStatus(job.status);

        if (job.status === "COMPLETED") {
          stopPolling();
          // Fetch extracted products
          const pRes = await fetch(API_URL + `/import/jobs/${id}/products`, {
            headers: token ? { Authorization: "Bearer " + token } : {},
          });
          if (pRes.ok) {
            const pJson = await pRes.json();
            setExtractedProducts(pJson?.data ?? pJson ?? []);
          }
        } else if (job.status === "FAILED") {
          stopPolling();
          setError("Import thất bại. Vui lòng thử lại.");
        }
      } catch {
        // ignore poll errors
      }
    }, 2000);
  }

  async function handleConfirm() {
    if (!jobId) return;
    setConfirming(true);
    setError(null);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;
      const res = await fetch(API_URL + `/import/jobs/${jobId}/confirm`, {
        method: "POST",
        headers: token ? { Authorization: "Bearer " + token } : {},
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any)?.error?.message || "HTTP " + res.status);
      }
      queryClient.invalidateQueries({ queryKey: ["catalogue-products"] });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Xác nhận thất bại");
    } finally {
      setConfirming(false);
    }
  }

  const isProcessing = jobStatus === "PENDING" || jobStatus === "PROCESSING";

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-amber-800">Import từ PDF</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ×
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* File picker */}
      {!jobId && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
          >
            {uploading ? "Đang upload..." : "Chọn file PDF"}
          </button>
        </div>
      )}

      {/* Progress */}
      {isProcessing && (
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-amber-700">
            {jobStatus === "PENDING"
              ? "Đang chờ xử lý..."
              : "Đang trích xuất dữ liệu..."}
          </span>
        </div>
      )}

      {/* Extracted products */}
      {jobStatus === "COMPLETED" && extractedProducts.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Tìm thấy {extractedProducts.length} sản phẩm:
          </p>
          <ul className="divide-y divide-amber-100 max-h-48 overflow-y-auto rounded-lg border border-amber-200 bg-white">
            {extractedProducts.map((p) => (
              <li key={p.id} className="px-3 py-2">
                <p className="text-sm font-medium text-gray-900">{p.name}</p>
                {p.sku && <p className="text-xs text-gray-500">SKU: {p.sku}</p>}
                {p.description && (
                  <p className="text-xs text-gray-400 truncate">
                    {p.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
            >
              {confirming ? "Đang xác nhận..." : "Xác nhận import"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg"
            >
              Huỷ
            </button>
          </div>
        </div>
      )}

      {jobStatus === "COMPLETED" && extractedProducts.length === 0 && (
        <p className="text-sm text-gray-500">
          Không tìm thấy sản phẩm nào trong file PDF.
        </p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CataloguePage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    data: products,
    isLoading,
    isError,
  } = useQuery<Product[]>({
    queryKey: ["catalogue-products", debouncedSearch],
    queryFn: async () => {
      const url = debouncedSearch
        ? `/products?search=${encodeURIComponent(debouncedSearch)}&limit=20`
        : "/products?limit=20";
      const res = await apiClient.get<any>(url);
      // Handle both array and paginated response shapes
      if (Array.isArray(res)) return res;
      if (res?.products) return res.products;
      return [];
    },
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => apiClient.get<Category[]>("/categories"),
    staleTime: 5 * 60 * 1000,
  });

  const categoryMap = Object.fromEntries(
    (categories ?? []).map((c) => [c.id, c.name]),
  );

  function toggleEdit(id: string) {
    setEditingId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalogue</h1>
          <p className="text-sm text-gray-500">Quản lý danh mục sản phẩm</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowImport((v) => !v);
              setShowAddForm(false);
            }}
            className="px-3 py-2 bg-amber-100 text-amber-700 text-sm font-medium rounded-lg border border-amber-200"
          >
            Import PDF
          </button>
          <button
            onClick={() => {
              setShowAddForm((v) => !v);
              setShowImport(false);
            }}
            className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg"
          >
            + Thêm
          </button>
        </div>
      </div>

      {/* Import panel */}
      {showImport && <ImportPDFPanel onClose={() => setShowImport(false)} />}

      {/* Add form */}
      {showAddForm && (
        <AddProductForm
          categories={categories ?? []}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          placeholder="Tìm theo tên hoặc SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* States */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <p className="text-center text-red-500 py-8">
          Không thể tải danh sách sản phẩm.
        </p>
      )}

      {!isLoading && !isError && (products ?? []).length === 0 && (
        <p className="text-center text-gray-400 py-8">
          {debouncedSearch
            ? "Không tìm thấy sản phẩm nào."
            : "Chưa có sản phẩm nào."}
        </p>
      )}

      {/* Product list */}
      <div className="space-y-2">
        {(products ?? []).map((product) => {
          const isEditing = editingId === product.id;
          return (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Row */}
              <button
                className="w-full text-left px-4 py-3 flex items-center gap-3"
                onClick={() => toggleEdit(product.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    SKU: {product.sku}
                    {product.category_id && categoryMap[product.category_id]
                      ? ` · ${categoryMap[product.category_id]}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      product.is_published
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {product.is_published ? "Đã đăng" : "Nháp"}
                  </span>
                </div>
                <span className="text-gray-400 ml-1 text-sm">
                  {isEditing ? "▲" : "▼"}
                </span>
              </button>

              {/* Edit form inline */}
              {isEditing && (
                <div className="border-t border-gray-100 px-4 pb-4">
                  <EditProductForm
                    product={product}
                    categories={categories ?? []}
                    onClose={() => setEditingId(null)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
