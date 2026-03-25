"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StockLevel {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  updated_at: string;
  product_internal: {
    product_id: string;
    product: { id: string; name: string; sku: string };
  };
  warehouse: { id: string; name: string; location: string | null };
}

interface Warehouse {
  id: string;
  name: string;
  location: string | null;
  is_active: boolean;
}

interface InventoryRecord {
  id: string;
  product_id: string;
  warehouse_id: string;
  type: string;
  quantity: number;
  note: string | null;
  created_by: string;
  created_at: string;
  warehouse: { name: string };
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TYPE_LABEL: Record<string, string> = {
  in: "Nhập kho",
  out: "Xuất kho",
  adjustment: "Điều chỉnh",
};

const TYPE_COLOR: Record<string, string> = {
  in: "text-green-700",
  out: "text-red-700",
  adjustment: "text-blue-700",
};

// ─── Inventory Record Form ────────────────────────────────────────────────────

function RecordForm({
  stock,
  onClose,
}: {
  stock: StockLevel;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<"in" | "out" | "adjustment">("in");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;
      const res = await fetch(API_URL + "/inventory/records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          product_id: stock.product_id,
          warehouse_id: stock.warehouse_id,
          type,
          quantity: Number(quantity),
          note: note || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const status = res.status;
        throw Object.assign(
          new Error((err as any)?.error?.message || "HTTP " + status),
          { status },
        );
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
      queryClient.invalidateQueries({
        queryKey: ["inventory-records", stock.product_id],
      });
      onClose();
    },
    onError: (err: any) => {
      if (err?.status === 400) {
        setError("Số lượng xuất vượt quá tồn kho");
      } else {
        setError(err?.message || "Có lỗi xảy ra");
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const qty = Number(quantity);
    if (!quantity || isNaN(qty) || qty <= 0) {
      setError("Số lượng phải lớn hơn 0");
      return;
    }
    mutation.mutate();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-2 space-y-3"
    >
      <h3 className="text-sm font-semibold text-blue-800">Tạo phiếu kho</h3>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Loại</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={type}
            onChange={(e) =>
              setType(e.target.value as "in" | "out" | "adjustment")
            }
          >
            <option value="in">Nhập kho</option>
            <option value="out">Xuất kho</option>
            <option value="adjustment">Điều chỉnh</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Số lượng <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-xs text-gray-600 mb-1">
            Ghi chú (tuỳ chọn)
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú..."
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
        >
          {mutation.isPending ? "Đang lưu..." : "Tạo phiếu"}
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

// ─── Record History ───────────────────────────────────────────────────────────

function RecordHistory({ productId }: { productId: string }) {
  const { data: records, isLoading } = useQuery<InventoryRecord[]>({
    queryKey: ["inventory-records", productId],
    queryFn: () =>
      apiClient.get<InventoryRecord[]>(`/inventory/records/${productId}`),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic py-2">Chưa có lịch sử.</p>
    );
  }

  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Lịch sử
      </p>
      <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white overflow-hidden">
        {records.map((r) => (
          <li key={r.id} className="px-3 py-2 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <span
                className={`text-xs font-semibold ${TYPE_COLOR[r.type] ?? "text-gray-700"}`}
              >
                {TYPE_LABEL[r.type] ?? r.type}
              </span>
              {r.note && (
                <p className="text-xs text-gray-500 truncate">{r.note}</p>
              )}
              <p className="text-xs text-gray-400">
                {formatDate(r.created_at)}
              </p>
            </div>
            <span
              className={`text-sm font-bold shrink-0 ${TYPE_COLOR[r.type] ?? "text-gray-700"}`}
            >
              {r.type === "out" ? "-" : "+"}
              {r.quantity}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WarehousePage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<string | null>(null);

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["warehouses"],
    queryFn: () => apiClient.get<Warehouse[]>("/warehouses"),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: stockLevels,
    isLoading,
    isError,
  } = useQuery<StockLevel[]>({
    queryKey: ["stock-levels", selectedWarehouse],
    queryFn: () => {
      const url = selectedWarehouse
        ? `/inventory/stock?warehouse_id=${selectedWarehouse}`
        : "/inventory/stock";
      return apiClient.get<StockLevel[]>(url);
    },
  });

  // Client-side filter by search
  const filtered = (stockLevels ?? []).filter((s) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    const name = s.product_internal?.product?.name?.toLowerCase() ?? "";
    const sku = s.product_internal?.product?.sku?.toLowerCase() ?? "";
    return name.includes(q) || sku.includes(q);
  });

  function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setShowForm(null);
    } else {
      setExpandedId(id);
      setShowForm(null);
    }
  }

  return (
    <div className="px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kho</h1>
          <p className="text-sm text-gray-500">Quản lý tồn kho</p>
        </div>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedWarehouse}
          onChange={(e) => setSelectedWarehouse(e.target.value)}
        >
          <option value="">Tất cả kho</option>
          {(warehouses ?? []).map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

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
          Không thể tải dữ liệu tồn kho.
        </p>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <p className="text-center text-gray-400 py-8">
          {debouncedSearch
            ? "Không tìm thấy sản phẩm nào."
            : "Chưa có dữ liệu tồn kho."}
        </p>
      )}

      {/* Stock list */}
      <div className="space-y-2">
        {filtered.map((stock) => {
          const product = stock.product_internal?.product;
          const isExpanded = expandedId === stock.id;
          const isFormOpen = showForm === stock.id;

          return (
            <div
              key={stock.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Row */}
              <button
                className="w-full text-left px-4 py-3 flex items-center gap-3"
                onClick={() => toggleExpand(stock.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {product?.name ?? "—"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    SKU: {product?.sku ?? "—"} · {stock.warehouse.name}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span
                    className={`text-sm font-bold ${
                      stock.quantity > 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {stock.quantity}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>
              </button>

              {/* Expanded panel */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-4 pb-4">
                  {/* Action button */}
                  {!isFormOpen && (
                    <button
                      className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg"
                      onClick={() => setShowForm(stock.id)}
                    >
                      + Tạo phiếu kho
                    </button>
                  )}

                  {/* Create form */}
                  {isFormOpen && (
                    <RecordForm
                      stock={stock}
                      onClose={() => setShowForm(null)}
                    />
                  )}

                  {/* History */}
                  <RecordHistory productId={stock.product_id} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
