"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

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
  const { data, isLoading, isError, refetch } =
    useQuery<InternalProductData | null>({
      queryKey: ["internal-product", productId],
      queryFn: async () => {
        try {
          const result = await apiClient.get<InternalProductData | null>(
            `/products/${productId}/internal`,
          );
          return result;
        } catch (err: any) {
          console.error("[InternalProductInfo] API Error:", err.message);
          throw err;
        }
      },
    });

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
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
        <p className="text-sm text-amber-800">
          Chưa có thông tin nội bộ cho sản phẩm này. Vui lòng thêm từ trang quản
          lý sản phẩm.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Giá vốn & nhà cung cấp */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Thông tin nội bộ
        </h2>

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
