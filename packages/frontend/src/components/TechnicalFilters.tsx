"use client";

import { useState } from "react";

interface TechnicalFiltersProps {
  onFilterChange: (specs: Record<string, any>) => void;
}

export function TechnicalFilters({ onFilterChange }: TechnicalFiltersProps) {
  const [specs, setSpecs] = useState<Record<string, any>>({});

  const handleSpecChange = (key: string, value: string) => {
    const updated = { ...specs };
    if (value === "") {
      delete updated[key];
    } else {
      updated[key] = [value]; // backend expects array
    }
    setSpecs(updated);
    onFilterChange(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
          Kích thước
        </label>
        <select
          value={specs.size?.[0] || ""}
          onChange={(e) => handleSpecChange("size", e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-gray-50"
        >
          <option value="">Tất cả</option>
          <option value="30x60">30x60</option>
          <option value="60x60">60x60</option>
          <option value="60x120">60x120</option>
          <option value="80x80">80x80</option>
          <option value="80x160">80x160</option>
          <option value="120x120">120x120</option>
          <option value="120x240">120x240</option>
        </select>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
          Chất liệu
        </label>
        <select
          value={specs.material?.[0] || ""}
          onChange={(e) => handleSpecChange("material", e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-gray-50"
        >
          <option value="">Tất cả</option>
          <option value="Porcelain">Porcelain</option>
          <option value="Đá đồng chất">Đá đồng chất</option>
          <option value="Ceramic">Ceramic</option>
          <option value="Granite">Granite</option>
          <option value="Nano">Nano</option>
          <option value="Full Body Porcelain">Full Body Porcelain</option>
        </select>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
          Bề mặt hoàn thiện
        </label>
        <select
          value={specs.surface_finish?.[0] || ""}
          onChange={(e) => handleSpecChange("surface_finish", e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-gray-50"
        >
          <option value="">Tất cả</option>
          <option value="Bóng">Bóng</option>
          <option value="Bóng vittinh">Bóng vittinh</option>
          <option value="Mờ">Mờ</option>
          <option value="Giả đá tự nhiên">Giả đá tự nhiên</option>
          <option value="Giả gỗ">Giả gỗ</option>
          <option value="Glossy">Glossy</option>
        </select>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
          Chống trơn trượt
        </label>
        <select
          value={specs.slip_resistance?.[0] || ""}
          onChange={(e) => handleSpecChange("slip_resistance", e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-gray-50"
        >
          <option value="">Tất cả</option>
          <option value="R9">R9</option>
          <option value="R10">R10</option>
          <option value="R11">R11</option>
          <option value="R12">R12</option>
        </select>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
          Xuất xứ
        </label>
        <select
          value={specs.origin?.[0] || ""}
          onChange={(e) => handleSpecChange("origin", e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-gray-50"
        >
          <option value="">Tất cả</option>
          <option value="Việt Nam">Việt Nam</option>
          <option value="Ý">Ý</option>
          <option value="Tây Ban Nha">Tây Ban Nha</option>
          <option value="Trung Quốc">Trung Quốc</option>
          <option value="Ấn Độ">Ấn Độ</option>
          <option value="Malaysia">Malaysia</option>
          <option value="Indonesia">Indonesia</option>
          <option value="Thái Lan">Thái Lan</option>
        </select>
      </div>
    </div>
  );
}
