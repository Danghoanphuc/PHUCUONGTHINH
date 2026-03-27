"use client";

import { useState } from "react";

interface TechnicalFiltersProps {
  onFilterChange: (specs: Record<string, any>) => void;
}

export function TechnicalFilters({ onFilterChange }: TechnicalFiltersProps) {
  const [specs, setSpecs] = useState<Record<string, any>>({});

  const handleSpecChange = (key: string, value: any) => {
    const updated = { ...specs, [key]: value };
    setSpecs(updated);
    onFilterChange(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
          Định dạng
        </label>
        <select
          value={specs.format || ""}
          onChange={(e) =>
            handleSpecChange("format", e.target.value || undefined)
          }
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-gray-50"
        >
          <option value="">Tất cả</option>
          <option value="Slab">Slab</option>
          <option value="Mosaic">Mosaic</option>
          <option value="Hexagon">Hexagon</option>
        </select>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
          Chất liệu
        </label>
        <select
          value={specs.material || ""}
          onChange={(e) =>
            handleSpecChange("material", e.target.value || undefined)
          }
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-gray-50"
        >
          <option value="">Tất cả</option>
          <option value="Porcelain">Sứ</option>
          <option value="Ceramic">Gốm</option>
          <option value="Natural Stone">Đá tự nhiên</option>
        </select>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
          Bề mặt
        </label>
        <select
          value={specs.finish || ""}
          onChange={(e) =>
            handleSpecChange("finish", e.target.value || undefined)
          }
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-gray-50"
        >
          <option value="">Tất cả</option>
          <option value="Matte">Mờ</option>
          <option value="Glossy">Bóng</option>
          <option value="Textured">Nhám</option>
        </select>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
          Chống trơn
        </label>
        <select
          value={specs.slip_resistance || ""}
          onChange={(e) =>
            handleSpecChange("slip_resistance", e.target.value || undefined)
          }
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-gray-50"
        >
          <option value="">Tất cả</option>
          <option value="R9">R9</option>
          <option value="R10">R10</option>
          <option value="R11">R11</option>
        </select>
      </div>
    </div>
  );
}
