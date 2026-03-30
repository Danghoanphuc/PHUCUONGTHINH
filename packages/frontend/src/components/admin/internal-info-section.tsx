"use client";

import { useState, useEffect } from "react";
import { formatVND, parseVND } from "@/lib/price-utils";

export interface InternalInfoData {
  price_retail?: number;
  price_wholesale?: number;
  wholesale_discount_tiers?: string; // JSON string cho khung chiết khấu
  price_dealer?: number;
  price_promo?: number;
  promo_start_date?: string;
  promo_end_date?: string;
  promo_note?: string;
  warehouse_location?: string;
  stock_status?: string;
  stock_quantity?: number;
  supplier_name?: string;
  supplier_phone?: string;
  internal_notes?: string;
}

interface Props {
  value: InternalInfoData;
  onChange: (data: InternalInfoData) => void;
}

function PriceInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (v?: number) => void;
}) {
  const [display, setDisplay] = useState(value != null ? formatVND(value) : "");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setDisplay(value != null ? formatVND(value) : "");
  }, [value, editing]);

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={display}
          onChange={(e) => {
            setDisplay(e.target.value);
            onChange(
              e.target.value.trim() === ""
                ? undefined
                : parseVND(e.target.value),
            );
          }}
          onFocus={() => setEditing(true)}
          onBlur={() => {
            setEditing(false);
            setDisplay(value != null ? formatVND(value) : "");
          }}
          placeholder="VD: 1.500.000"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 pr-8"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
          đ
        </span>
      </div>
    </div>
  );
}

export function InternalInfoSection({ value, onChange }: Props) {
  const set = (patch: Partial<InternalInfoData>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        <p className="text-xs text-amber-800">
          🔒 Chỉ hiển thị cho admin đã đăng nhập
        </p>
      </div>

      {/* Giá bán */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Giá bán
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <PriceInput
            label="Giá bán lẻ"
            value={value.price_retail}
            onChange={(v) => set({ price_retail: v })}
          />
          <PriceInput
            label="Giá đại lý"
            value={value.price_dealer}
            onChange={(v) => set({ price_dealer: v })}
          />
        </div>

        <PriceInput
          label="Giá bán sỉ"
          value={value.price_wholesale}
          onChange={(v) => set({ price_wholesale: v })}
        />

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Khung chiết khấu theo số lượng
          </label>
          <textarea
            value={value.wholesale_discount_tiers ?? ""}
            onChange={(e) => set({ wholesale_discount_tiers: e.target.value })}
            rows={2}
            placeholder="VD: 10-50 viên: -5%, 51-100 viên: -10%, >100 viên: -15%"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          />
        </div>
      </div>

      {/* Khuyến mãi */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Khuyến mãi
        </h3>

        <PriceInput
          label="Giá khuyến mãi"
          value={value.price_promo}
          onChange={(v) => set({ price_promo: v })}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={value.promo_start_date ?? ""}
              onChange={(e) => set({ promo_start_date: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={value.promo_end_date ?? ""}
              onChange={(e) => set({ promo_end_date: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Ghi chú khuyến mãi
          </label>
          <input
            type="text"
            value={value.promo_note ?? ""}
            onChange={(e) => set({ promo_note: e.target.value })}
            placeholder="VD: Giảm giá mùa hè, Thanh lý tồn kho..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* Kho hàng */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Kho hàng
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Vị trí trong kho
            </label>
            <input
              type="text"
              value={value.warehouse_location ?? ""}
              onChange={(e) => set({ warehouse_location: e.target.value })}
              placeholder="VD: Kệ A3, Hàng 2"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tình trạng
            </label>
            <select
              value={value.stock_status ?? ""}
              onChange={(e) => set({ stock_status: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">— Chọn —</option>
              <option value="in_stock">Còn hàng</option>
              <option value="low_stock">Sắp hết</option>
              <option value="out_of_stock">Hết hàng</option>
              <option value="pre_order">Đặt trước</option>
              <option value="discontinued">Ngừng kinh doanh</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Số lượng tồn kho
          </label>
          <input
            type="number"
            value={value.stock_quantity ?? ""}
            onChange={(e) =>
              set({
                stock_quantity:
                  e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            placeholder="VD: 150"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* Nhà cung cấp */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Nhà cung cấp
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tên nhà cung cấp
            </label>
            <input
              type="text"
              value={value.supplier_name ?? ""}
              onChange={(e) => set({ supplier_name: e.target.value })}
              placeholder="VD: Công ty TNHH ABC"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Số điện thoại
            </label>
            <input
              type="text"
              value={value.supplier_phone ?? ""}
              onChange={(e) => set({ supplier_phone: e.target.value })}
              placeholder="0901234567"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Ghi chú */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Ghi chú nội bộ
        </label>
        <textarea
          value={value.internal_notes ?? ""}
          onChange={(e) => set({ internal_notes: e.target.value })}
          rows={3}
          placeholder="Ghi chú thêm về sản phẩm, điều kiện bảo quản, lưu ý đặc biệt..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
        />
      </div>
    </div>
  );
}
