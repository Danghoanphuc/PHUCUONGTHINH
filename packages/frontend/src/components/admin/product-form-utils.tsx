"use client";

import React, { useEffect } from "react";
import { PendingMedia } from "@/components/admin/media-uploader";
import { MediaRecord } from "@/lib/media-service";
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
} from "@/lib/product-service";
import { Category } from "@/lib/category-service";
import { Tag } from "@/lib/tag-service";
import { AlertCircle, CheckCircle2, Radio, X } from "lucide-react";

export function debounce<T extends (...args: any[]) => any>(fn: T, ms: number) {
  let t: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export interface ProductFormProps {
  product?: Product & { media?: MediaRecord[] };
  categories: Category[];
  styles: Tag[];
  spaces: Tag[];
  onSubmit: (
    data: CreateProductRequest | UpdateProductRequest,
  ) => Promise<Product | void>;
  isLoading?: boolean;
  onClone?: (productId: string) => void;
}

export interface FormState {
  name: string;
  sku: string;
  slug: string;
  description: string;
  category_id: string;
  technical_specs: Record<string, any>;
  style_ids: string[];
  space_ids: string[];
  pendingMedia: PendingMedia[];
  meta_title: string;
  meta_description: string;
  badges: string[];
}

export function toSlug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export const BADGES = [
  "Mới về",
  "Best Seller",
  "Xả kho",
  "Hàng hiếm",
  "Độc quyền",
];

// API Error types
interface ApiErrorResponse {
  error?: {
    message?: string;
    code?: string;
  };
  message?: string | string[];
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; delayMs?: number; context?: string } = {},
): Promise<T> {
  const { maxRetries = 2, delayMs = 1000 } = options;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const isRetryable =
        err?.response?.status >= 500 ||
        err?.code === "ECONNABORTED" ||
        err?.code === "ETIMEDOUT";

      if (!isRetryable || attempt >= maxRetries) {
        throw err;
      }

      await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, attempt)));
    }
  }

  throw lastError;
}

export function formatApiError(err: any, defaultMsg: string): string {
  const data = err?.response?.data as ApiErrorResponse;
  const msg =
    data?.error?.message ||
    (Array.isArray(data?.message) ? data.message.join(", ") : data?.message) ||
    err?.message ||
    defaultMsg;
  return msg;
}

export async function safeApiCall<T>(
  fn: () => Promise<T>,
  context: string,
  options: { logError?: boolean; throwOnError?: boolean } = {},
): Promise<{ success: boolean; data?: T; error?: string }> {
  const { logError = true, throwOnError = false } = options;

  try {
    const data = await fn();
    return { success: true, data };
  } catch (err: any) {
    const errorMsg = formatApiError(err, `${context} thất bại`);
    if (logError) {
      console.error(`❌ [${context}]`, err);
    }
    if (throwOnError) {
      throw new Error(errorMsg);
    }
    return { success: false, error: errorMsg };
  }
}

export function initFormData(
  product?: Product & { media?: MediaRecord[] },
): FormState {
  if (!product)
    return {
      name: "",
      sku: "",
      slug: "",
      description: "",
      category_id: "",
      technical_specs: {},
      style_ids: [],
      space_ids: [],
      pendingMedia: [],
      meta_title: "",
      meta_description: "",
      badges: [],
    };
  return {
    name: product.name,
    sku: product.sku,
    slug: toSlug(product.name),
    description: product.description ?? "",
    category_id: product.category_id,
    technical_specs: product.technical_specs ?? {},
    style_ids: (product as any).style_tags?.map((t: any) => t.id) ?? [],
    space_ids: (product as any).space_tags?.map((t: any) => t.id) ?? [],
    pendingMedia: (product.media ?? []).map((m, i) => ({
      clientId: m.id,
      url: m.file_url,
      preview_url: m.file_url,
      media_type: m.media_type as any,
      is_cover: m.is_cover,
      sort_order: m.sort_order ?? i,
      status: "done" as const,
    })),
    meta_title: (product.technical_specs?.meta_title as string) ?? "",
    meta_description:
      (product.technical_specs?.meta_description as string) ?? "",
    badges: (product.technical_specs?.badges as string[]) ?? [],
  };
}

// ── Reusable field components (APPLE IOS 18 STYLE) ─────────────────────────

export function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-1.5 ml-1 text-[11px] font-medium text-gray-400">
          {hint}
        </p>
      )}
      {error && (
        <p className="mt-1.5 ml-1 text-[12px] font-semibold text-red-500 flex items-center gap-1">
          <AlertCircle size={14} strokeWidth={2.5} />
          {error}
        </p>
      )}
    </div>
  );
}

export function Card({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_8px_32px_rgba(0,0,0,0.03)] overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50/50 flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">
          {title}
        </h3>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    {...props}
    className={`w-full bg-black/5 border border-transparent rounded-[16px] px-4 py-3 text-[14px] text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-black/10 focus:shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-all duration-300 ${className}`}
  />
));
Input.displayName = "Input";

export function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full bg-black/5 border border-transparent rounded-[16px] px-4 py-3 text-[14px] text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-black/10 focus:shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-all duration-300 resize-none ${className}`}
    />
  );
}

// ── Apple Pill Toast ────────────────────────────────────────────────────────
export function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const isError = type === "error";

  const icons = {
    success: (
      <CheckCircle2
        size={18}
        strokeWidth={2.5}
        className={isError ? "text-red-500" : "text-white"}
      />
    ),
    error: <AlertCircle size={18} strokeWidth={2.5} className="text-red-500" />,
    info: (
      <Radio size={18} strokeWidth={2.5} className="animate-pulse text-white" />
    ),
  };

  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.15)] text-[14px] font-bold max-w-sm w-max animate-in slide-in-from-bottom-6 fade-in duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        isError
          ? "bg-red-50 text-red-600 border border-red-100"
          : "bg-gray-900/95 backdrop-blur-xl text-white border border-gray-800"
      }`}
    >
      {icons[type]}
      <span className="flex-1 whitespace-nowrap">{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="opacity-60 hover:opacity-100 ml-1 p-1 active:scale-90 transition-all"
      >
        <X size={16} strokeWidth={3} />
      </button>
    </div>
  );
}
