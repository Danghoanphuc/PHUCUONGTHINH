"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useState } from "react";
import { Pencil, Save, X } from "lucide-react";

interface StockLevel {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  updated_at: string;
  warehouse: {
    id: string;
    name: string;
    location: string | null;
    is_active: boolean;
  };
}

interface InternalProductData {
  id: string;
  product_id: string;
  cost_price: number | null;
  supplier_name: string | null;
  supplier_contact: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  stock_levels: StockLevel[];
}

interface InternalProductInfoProps {
  productId: string;
}

export default function InternalProductInfo({
  productId,
}: InternalProductInfoProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    cost_price: "",
    supplier_name: "",
    supplier_contact: "",
    internal_notes: "",
  });

  const { data, isLoading, isError, error, refetch } =
    useQuery<InternalProductData | null>({
      queryKey: ["internal-product", productId],
      queryFn: async () => {
        console.log("[InternalProductInfo] Fetching data for:", productId);
        try {
          const result = await apiClient.get<InternalProductData | null>(
            `/products/${productId}/internal`,
          );
          console.log("[InternalProductInfo] Data received:", result);
          return result;
        } catch (err) {
          console.error("[InternalProductInfo] Fetch error:", err);
          throw err;
        }
      },
    });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      cost_price?: number;
      supplier_name?: string;
      supplier_contact?: string;
      internal_notes?: string;
    }) => {
      return apiClient.patch(`/products/${productId}/internal`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["internal-product", productId],
      });
      setIsEditing(false);
    },
  });

  console.log("[InternalProductInfo] Query state:", {
    isLoading,
    isError,
    error,
    hasData: !!data,
  });

  const handleEdit = () => {
    setFormData({
      cost_price: data?.cost_price?.toString() || "",
      supplier_name: data?.supplier_name || "",
      supplier_contact: data?.supplier_contact || "",
      internal_notes: data?.internal_notes || "",
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    const payload: any = {};
    if (formData.cost_price)
      payload.cost_price = parseFloat(formData.cost_price);
    if (formData.supplier_name) payload.supplier_name = formData.supplier_name;
    if (formData.supplier_contact)
      payload.supplier_contact = formData.supplier_contact;
    if (formData.internal_notes)
      payload.internal_notes = formData.internal_notes;

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-red-600 font-medium">
          Không thể tải thông tin nội bộ
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-sm text-amber-800 mb-3">
            Chưa có thông tin nội bộ cho sản phẩm này
          </p>
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            Thêm thông tin nội bộ
          </button>
        </div>

        {isEditing && (
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Thêm thông tin nội bộ
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Giá vốn (VNĐ)
              </label>
              <input
                type="number"
                value={formData.cost_price}
                onChange={(e) =>
                  setFormData({ ...formData, cost_price: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Nhập giá vốn"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Nhà cung cấp
              </label>
              <input
                type="text"
                value={formData.supplier_name}
                onChange={(e) =>
                  setFormData({ ...formData, supplier_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Tên nhà cung cấp"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Liên hệ NCC
              </label>
              <input
                type="text"
                value={formData.supplier_contact}
                onChange={(e) =>
                  setFormData({ ...formData, supplier_contact: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="SĐT hoặc email"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Ghi chú nội bộ
              </label>
              <textarea
                value={formData.internal_notes}
                onChange={(e) =>
                  setFormData({ ...formData, internal_notes: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Ghi chú..."
              />
            </div>

            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {updateMutation.isPending ? "Đang lưu..." : "Lưu thông tin"}
            </button>

            {updateMutation.isError && (
              <p className="text-xs text-red-600 text-center">
                Lỗi: {(updateMutation.error as Error)?.message}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Giá vốn & nhà cung cấp */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Thông tin nội bộ
          </h2>
          <button
            onClick={handleEdit}
            className="text-amber-600 hover:text-amber-700 transition-colors"
            title="Chỉnh sửa"
          >
            <Pencil size={16} />
          </button>
        </div>

        {!isEditing ? (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Giá vốn</span>
              <span className="text-sm font-semibold text-gray-900">
                {data.cost_price != null
                  ? `${data.cost_price.toLocaleString("vi-VN")} đ`
                  : "—"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Nhà cung cấp</span>
              <span className="text-sm text-gray-900">
                {data.supplier_name ?? "—"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Liên hệ NCC</span>
              <span className="text-sm text-gray-900">
                {data.supplier_contact ?? "—"}
              </span>
            </div>

            {data.internal_notes && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Ghi chú nội bộ</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {data.internal_notes}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Giá vốn (VNĐ)
              </label>
              <input
                type="number"
                value={formData.cost_price}
                onChange={(e) =>
                  setFormData({ ...formData, cost_price: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Nhập giá vốn"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Nhà cung cấp
              </label>
              <input
                type="text"
                value={formData.supplier_name}
                onChange={(e) =>
                  setFormData({ ...formData, supplier_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Tên nhà cung cấp"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Liên hệ NCC
              </label>
              <input
                type="text"
                value={formData.supplier_contact}
                onChange={(e) =>
                  setFormData({ ...formData, supplier_contact: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="SĐT hoặc email"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Ghi chú nội bộ
              </label>
              <textarea
                value={formData.internal_notes}
                onChange={(e) =>
                  setFormData({ ...formData, internal_notes: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Ghi chú..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save size={16} />
                {updateMutation.isPending ? "Đang lưu..." : "Lưu"}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                disabled={updateMutation.isPending}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
            </div>

            {updateMutation.isError && (
              <p className="text-xs text-red-600 text-center">
                Lỗi: {(updateMutation.error as Error)?.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tồn kho theo kho */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Tồn kho
        </h2>
        {data.stock_levels.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có dữ liệu tồn kho</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.stock_levels.map((sl) => (
              <li
                key={sl.id}
                className="py-2 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {sl.warehouse.name}
                  </p>
                  {sl.warehouse.location && (
                    <p className="text-xs text-gray-500">
                      {sl.warehouse.location}
                    </p>
                  )}
                </div>
                <span
                  className={`text-sm font-semibold ${sl.quantity > 0 ? "text-green-600" : "text-red-500"}`}
                >
                  {sl.quantity}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
