"use client";

import { useState, useCallback } from "react";
import {
  getSpecTemplate,
  mergeSpecs,
  SpecField,
  ProductType,
  PRODUCT_TYPE_LABELS,
  detectProductType,
} from "@/lib/spec-templates";

interface SpecTableProps {
  categoryId: string;
  value: Record<string, any>;
  onChange: (specs: Record<string, any>) => void;
  productType?: ProductType;
  onProductTypeChange?: (type: ProductType) => void;
}

const DEFAULT_OPEN_GROUPS = new Set([
  "Kích thước & Quy cách",
  "Quy cách đóng gói",
  "Chất liệu",
  "Kích thước",
  "Thông số lắp đặt",
  "Thông số điện / Kỹ thuật",
  "Thông số điện",
  "Thông số",
  "Kho",
]);

const FULL_WIDTH_TYPES = new Set(["textarea"]);

function SpecFieldInput({
  field,
  value,
  onChange,
}: {
  field: SpecField;
  value: any;
  onChange: (val: any) => void;
}) {
  const isFilled = value !== undefined && value !== null && value !== "";
  const base = `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
    isFilled ? "border-blue-300 bg-blue-50/30" : "border-gray-200 bg-white"
  }`;

  if (field.type === "select" && field.options) {
    return (
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className={`${base} cursor-pointer`}
      >
        <option value="">— Chọn —</option>
        {field.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "number") {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? undefined : Number(e.target.value))
          }
          placeholder={field.placeholder}
          className={base}
        />
        {field.unit && (
          <span className="text-xs text-gray-400 whitespace-nowrap bg-gray-50 border border-gray-200 rounded px-2 py-2">
            {field.unit}
          </span>
        )}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        placeholder={field.placeholder}
        rows={2}
        className={`${base} resize-none`}
      />
    );
  }

  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || undefined)}
      placeholder={field.placeholder}
      className={base}
    />
  );
}

function FieldItem({
  field,
  value,
  onChange,
}: {
  field: SpecField;
  value: any;
  onChange: (key: string, val: any) => void;
}) {
  const isFilled = value !== undefined && value !== null && value !== "";
  const isFullWidth = FULL_WIDTH_TYPES.has(field.type);

  return (
    <div className={isFullWidth ? "col-span-2" : ""}>
      <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
        {field.label}
        {field.required && <span className="text-red-400">*</span>}
        {isFilled && !field.required && (
          <span className="text-blue-400 text-xs">✓</span>
        )}
      </label>
      <SpecFieldInput
        field={field}
        value={value}
        onChange={(val) => onChange(field.key, val)}
      />
    </div>
  );
}

function GroupAccordion({
  name,
  fields,
  value,
  defaultOpen,
  onFieldChange,
}: {
  name: string;
  fields: SpecField[];
  value: Record<string, any>;
  defaultOpen: boolean;
  onFieldChange: (key: string, val: any) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const filledCount = fields.filter(
    (f) =>
      value[f.key] !== undefined &&
      value[f.key] !== null &&
      value[f.key] !== "",
  ).length;

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">{name}</span>
          {filledCount > 0 && (
            <span className="text-xs bg-blue-100 text-blue-600 font-medium px-1.5 py-0.5 rounded-full">
              {filledCount}/{fields.length}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="px-4 py-4 grid grid-cols-2 gap-x-4 gap-y-3">
          {fields.map((field) => (
            <FieldItem
              key={field.key}
              field={field}
              value={value[field.key]}
              onChange={onFieldChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SpecTable({
  categoryId,
  value,
  onChange,
  productType,
  onProductTypeChange,
}: SpecTableProps) {
  const effectiveType: ProductType =
    productType ?? detectProductType(categoryId);
  const template = getSpecTemplate(effectiveType);

  const groups = template.reduce<Record<string, SpecField[]>>((acc, f) => {
    const g = f.group ?? "Thông số";
    if (!acc[g]) acc[g] = [];
    acc[g].push(f);
    return acc;
  }, {});

  const handleTemplateChange = useCallback(
    (key: string, val: any) => {
      const updated = { ...value };
      if (val === undefined) delete updated[key];
      else updated[key] = val;
      onChange(updated);
    },
    [value, onChange],
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
          Loại sản phẩm <span className="text-red-400">*</span>
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.entries(PRODUCT_TYPE_LABELS) as [ProductType, string][]).map(
            ([type, label]) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onProductTypeChange?.(type);
                  onChange({ ...value, product_type: type });
                }}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                  effectiveType === type
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {label}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(groups).map(([groupName, fields]) => (
          <GroupAccordion
            key={groupName}
            name={groupName}
            fields={fields}
            value={value}
            defaultOpen={DEFAULT_OPEN_GROUPS.has(groupName)}
            onFieldChange={handleTemplateChange}
          />
        ))}
      </div>
    </div>
  );
}
