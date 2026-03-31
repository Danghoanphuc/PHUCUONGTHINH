"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
} from "@/lib/product-service";
import { Category } from "@/lib/category-service";
import { Tag } from "@/lib/tag-service";
import { CategoryPicker } from "@/components/admin/category-picker";
import { MediaUploader, PendingMedia } from "@/components/admin/media-uploader";
import {
  InternalInfoSection,
  InternalInfoData,
} from "@/components/admin/internal-info-section";
import { SpecTable } from "@/components/admin/spec-table";
import { ProductType, detectProductType } from "@/lib/spec-templates";
import {
  getPresignedUrl,
  uploadFileToS3,
  createMediaRecord,
  deleteMedia,
  updateSortOrder,
  MediaRecord,
} from "@/lib/media-service";
import { apiClient } from "@/lib/api-client";
import {
  Save,
  Copy,
  Eye,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

function debounce<T extends (...args: any[]) => any>(fn: T, ms: number) {
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

interface FormState {
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

function toSlug(s: string) {
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

const BADGES = ["Mới về", "Best Seller", "Xả kho", "Hàng hiếm", "Độc quyền"];

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

// ── Reusable field components ─────────────────────────────────────────────────
function Field({
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
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  );
}

function Card({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    {...props}
    className={`w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors ${className}`}
  />
));
Input.displayName = "Input";

function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors resize-none ${className}`}
    />
  );
}

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium max-w-sm ${type === "success" ? "bg-emerald-600" : "bg-red-600"}`}
    >
      {type === "success" ? (
        <CheckCircle2 size={16} />
      ) : (
        <AlertCircle size={16} />
      )}
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="opacity-60 hover:opacity-100 ml-1"
      >
        ✕
      </button>
    </div>
  );
}

// ── Main ProductForm ──────────────────────────────────────────────────────────
export function ProductForm({
  product,
  categories,
  styles,
  spaces,
  onSubmit,
  isLoading = false,
  onClone,
}: ProductFormProps) {
  const [formData, setFormData] = useState<FormState>(() =>
    initFormData(product),
  );
  const originalMediaRef = useRef<PendingMedia[]>(
    initFormData(product).pendingMedia,
  );
  const initializedId = useRef<string | undefined>(undefined);

  // Re-init when product loads async
  useEffect(() => {
    if (product?.id && product.id !== initializedId.current) {
      initializedId.current = product.id;
      const d = initFormData(product);
      setFormData(d);
      originalMediaRef.current = d.pendingMedia;
    }
  }, [product]);

  const [productType, setProductType] = useState<ProductType>(
    () =>
      (product?.technical_specs?.product_type as ProductType) ??
      detectProductType(product?.category_id ?? ""),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [internalData, setInternalData] = useState<InternalInfoData>({});
  const [seoOpen, setSeoOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const skuRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!product?.id) return;
    apiClient
      .get<any>(`/products/${product.id}/internal`)
      .then((d) => {
        if (d)
          setInternalData({
            price_retail: d.price_retail ?? undefined,
            price_wholesale: d.price_wholesale ?? undefined,
            wholesale_discount_tiers: d.wholesale_discount_tiers ?? undefined,
            price_dealer: d.price_dealer ?? undefined,
            price_promo: d.price_promo ?? undefined,
            promo_start_date: d.promo_start_date ?? undefined,
            promo_end_date: d.promo_end_date ?? undefined,
            promo_note: d.promo_note ?? undefined,
            warehouse_location: d.warehouse_location ?? undefined,
            stock_status: d.stock_status ?? undefined,
            stock_quantity: d.stock_quantity ?? undefined,
            supplier_name: d.supplier_name ?? undefined,
            supplier_phone: d.supplier_phone ?? undefined,
            internal_notes: d.internal_notes ?? undefined,
          });
      })
      .catch(() => {});
  }, [product?.id]);

  const debouncedSlug = useMemo(
    () =>
      debounce((name: string) => {
        setFormData((p) => ({ ...p, slug: toSlug(name) }));
      }, 300),
    [],
  );

  const setField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setFormData((p) => ({ ...p, [key]: value }));
      setErrors((p) => {
        if (!p[key]) return p;
        const n = { ...p };
        delete n[key];
        return n;
      });
    },
    [],
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = "Bắt buộc";
    if (!formData.sku.trim()) e.sku = "Bắt buộc";
    if (!formData.category_id) e.category_id = "Vui lòng chọn danh mục";
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setTimeout(() => {
        if (e.name) {
          nameRef.current?.focus();
          nameRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else if (e.sku) {
          skuRef.current?.focus();
          skuRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else if (e.category_id)
          categoryRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
      }, 50);
      return false;
    }
    return true;
  };

  const uploadPendingMedia = async (productId: string) => {
    const pending = formData.pendingMedia.filter(
      (m) => m.status === "pending" && m.file,
    );
    const updateStatus = (clientId: string, patch: Partial<PendingMedia>) =>
      setFormData((p) => ({
        ...p,
        pendingMedia: p.pendingMedia.map((m) =>
          m.clientId === clientId ? { ...m, ...patch } : m,
        ),
      }));

    await Promise.all(
      pending.map(async (item) => {
        if (!item.file) return;
        updateStatus(item.clientId, { status: "uploading", progress: 0 });
        try {
          const { upload_url, public_url } = await getPresignedUrl(
            productId,
            item.file.name,
            item.media_type as any,
            item.file.type || "application/octet-stream",
          );
          await uploadFileToS3(upload_url, item.file, (pct) =>
            updateStatus(item.clientId, { progress: pct }),
          );
          await createMediaRecord({
            product_id: productId,
            file_url: public_url,
            file_type: item.file.type,
            media_type: item.media_type,
            is_cover: item.is_cover,
            sort_order: item.sort_order,
            alt_text: item.alt_text,
          });
          updateStatus(item.clientId, { status: "done", progress: 100 });
        } catch (err: any) {
          const msg =
            err?.response?.data?.message || err?.message || "Upload thất bại";
          updateStatus(item.clientId, { status: "error", error: msg });
          throw new Error(`Upload "${item.file.name}" thất bại: ${msg}`);
        }
      }),
    );

    const socialPending = formData.pendingMedia.filter(
      (m) => m.status === "pending" && m.media_type === "social_link" && m.url,
    );
    await Promise.all(
      socialPending.map(async (item) => {
        if (!item.url) return;
        try {
          await createMediaRecord({
            product_id: productId,
            file_url: item.url,
            file_type: "text/html",
            media_type: "social_link",
            is_cover: false,
            sort_order: item.sort_order,
          });
        } catch {
          /* non-fatal */
        }
      }),
    );
  };

  const syncMediaForEdit = async (
    productId: string,
    originalMedia: PendingMedia[],
  ) => {
    const currentIds = new Set(
      formData.pendingMedia
        .filter((m) => m.status === "done" && m.clientId)
        .map((m) => m.clientId),
    );
    await Promise.all(
      originalMedia
        .filter(
          (m) =>
            m.status === "done" && m.clientId && !currentIds.has(m.clientId),
        )
        .map((m) => deleteMedia(m.clientId).catch(() => {})),
    );
    await uploadPendingMedia(productId);
    const existingIds = new Set(originalMedia.map((m) => m.clientId));
    const doneItems = formData.pendingMedia.filter(
      (m) => m.status === "done" && m.clientId && existingIds.has(m.clientId),
    );
    if (doneItems.length > 0) {
      try {
        await updateSortOrder(
          productId,
          doneItems.map((m) => ({ id: m.clientId, sort_order: m.sort_order })),
        );
      } catch {
        /* non-fatal */
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload: CreateProductRequest | UpdateProductRequest = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        description: formData.description.trim() || undefined,
        category_id: formData.category_id,
        technical_specs: {
          ...formData.technical_specs,
          slug: formData.slug,
          meta_title: formData.meta_title || formData.name,
          meta_description:
            formData.meta_description || formData.description || undefined,
          badges: formData.badges.length > 0 ? formData.badges : undefined,
        },
        style_ids: formData.style_ids,
        space_ids: formData.space_ids,
      };
      const result = await onSubmit(payload);
      const productId = product?.id || result?.id;
      if (productId) {
        if (product?.id)
          await syncMediaForEdit(product.id, originalMediaRef.current);
        else if (result?.id) await uploadPendingMedia(result.id);
        const hasInternal = Object.values(internalData).some(
          (v) => v != null && v !== "",
        );
        if (hasInternal) {
          try {
            await apiClient.patch(
              `/products/${productId}/internal`,
              internalData,
            );
          } catch (err) {
            console.error("Failed to save internal info:", err);
          }
        }
      }
      setToast({ message: "✅ Đã lưu sản phẩm", type: "success" });
      if (productId) {
        const hasPending = formData.pendingMedia.some(
          (m) => m.status === "pending" || m.status === "uploading",
        );
        if (!hasPending) {
          setTimeout(
            () => window.location.replace(`/products/${productId}?_updated=1`),
            600,
          );
        } else {
          setToast({ message: "⏳ Đang xử lý media...", type: "success" });
          let polls = 0;
          const iv = setInterval(() => {
            polls++;
            const still = formData.pendingMedia.some(
              (m) => m.status === "uploading",
            );
            if (!still || polls >= 20) {
              clearInterval(iv);
              setToast({ message: "✅ Hoàn tất!", type: "success" });
              setTimeout(
                () =>
                  window.location.replace(`/products/${productId}?_updated=1`),
                300,
              );
            }
          }, 500);
        }
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        (Array.isArray(err?.response?.data?.message)
          ? err.response.data.message.join(", ")
          : null) ||
        "Lưu sản phẩm thất bại";
      setToast({ message: msg, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const saving = isSaving || isLoading;

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        {/* ── Top bar ── */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-5 py-3 mb-6 flex items-center gap-3 shadow-sm -mx-4 md:-mx-6 px-4 md:px-6">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {formData.name ||
                (product ? "Chỉnh sửa sản phẩm" : "Sản phẩm mới")}
            </p>
            {formData.sku && (
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                {formData.sku}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {product?.id && (
              <a
                href={`/products/${product.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-500 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Eye size={13} /> Xem
              </a>
            )}
            {product?.id && onClone && (
              <button
                type="button"
                onClick={() => onClone(product.id)}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-500 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Copy size={13} /> Nhân bản
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-500/20"
            >
              {saving ? (
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
              ) : (
                <Save size={14} />
              )}
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </div>

        {/* ── 2-column layout ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5">
            {/* Basic info */}
            <Card title="Thông tin sản phẩm">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-4">
                  <Field label="Tên sản phẩm" required error={errors.name}>
                    <Input
                      ref={nameRef}
                      value={formData.name}
                      placeholder="VD: Gạch Porcelain 600x1200 Vân Đá"
                      className={
                        errors.name
                          ? "border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-500/20"
                          : ""
                      }
                      onChange={(e) => {
                        setFormData((p) => ({ ...p, name: e.target.value }));
                        debouncedSlug(e.target.value);
                        setErrors((p) => {
                          const n = { ...p };
                          delete n.name;
                          return n;
                        });
                      }}
                    />
                  </Field>
                  <Field label="SKU" required error={errors.sku}>
                    <Input
                      ref={skuRef}
                      value={formData.sku}
                      placeholder="GCH-001"
                      className={`font-mono ${errors.sku ? "border-red-400 bg-red-50" : ""}`}
                      onChange={(e) => setField("sku", e.target.value)}
                    />
                  </Field>
                </div>

                <Field label="Mô tả ngắn">
                  <Textarea
                    value={formData.description}
                    rows={3}
                    placeholder="Mô tả ngắn về sản phẩm, phong cách, không gian ứng dụng..."
                    onChange={(e) => setField("description", e.target.value)}
                  />
                </Field>

                <Field label="URL slug" hint="Tự động tạo từ tên sản phẩm">
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-400 transition-colors">
                    <span className="px-3 py-2.5 text-xs text-gray-400 bg-gray-50 border-r border-gray-200 whitespace-nowrap select-none">
                      /products/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setField("slug", e.target.value)}
                      className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none text-gray-600 font-mono"
                    />
                  </div>
                </Field>
              </div>
            </Card>

            {/* Media */}
            <Card title="Hình ảnh & Media">
              <MediaUploader
                productId={product?.id}
                existingMedia={formData.pendingMedia}
                onChange={(media) => setField("pendingMedia", media)}
                productName={formData.name}
              />
            </Card>

            {/* Specs */}
            <Card title="Thông số kỹ thuật">
              <SpecTable
                categoryId={formData.category_id}
                value={formData.technical_specs}
                onChange={(specs) => setField("technical_specs", specs)}
                productType={productType}
                onProductTypeChange={(type) => {
                  setProductType(type);
                  setFormData((p) => ({
                    ...p,
                    technical_specs: {
                      ...p.technical_specs,
                      product_type: type,
                    },
                  }));
                }}
              />
            </Card>

            {/* Internal info */}
            <Card title="Thông tin nội bộ 🔒">
              <InternalInfoSection
                value={internalData}
                onChange={setInternalData}
              />
            </Card>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-5">
            {/* Status & Category */}
            <Card title="Phân loại">
              <div className="space-y-4">
                <div ref={categoryRef}>
                  <Field label="Danh mục" required error={errors.category_id}>
                    <CategoryPicker
                      categories={categories}
                      value={formData.category_id}
                      onChange={(id) => setField("category_id", id)}
                    />
                  </Field>
                </div>

                {/* Badges */}
                <Field label="Nhãn">
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {BADGES.map((badge) => {
                      const active = formData.badges.includes(badge);
                      return (
                        <button
                          key={badge}
                          type="button"
                          onClick={() =>
                            setField(
                              "badges",
                              active
                                ? formData.badges.filter((b) => b !== badge)
                                : [...formData.badges, badge],
                            )
                          }
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${active ? "bg-orange-500 text-white border-orange-500 shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-orange-300 hover:text-orange-500"}`}
                        >
                          {badge}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>
            </Card>

            {/* Tags */}
            {(styles.length > 0 || spaces.length > 0) && (
              <Card title="Thẻ & Phong cách">
                <div className="space-y-4">
                  {styles.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        Phong cách
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {styles.map((s) => {
                          const active = formData.style_ids.includes(s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() =>
                                setField(
                                  "style_ids",
                                  active
                                    ? formData.style_ids.filter(
                                        (id) => id !== s.id,
                                      )
                                    : [...formData.style_ids, s.id],
                                )
                              }
                              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}
                            >
                              {s.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {spaces.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        Không gian
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {spaces.map((s) => {
                          const active = formData.space_ids.includes(s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() =>
                                setField(
                                  "space_ids",
                                  active
                                    ? formData.space_ids.filter(
                                        (id) => id !== s.id,
                                      )
                                    : [...formData.space_ids, s.id],
                                )
                              }
                              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${active ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300"}`}
                            >
                              {s.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* SEO */}
            <Card
              title="SEO"
              action={
                <button
                  type="button"
                  onClick={() => setSeoOpen((o) => !o)}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                >
                  {seoOpen ? "Thu gọn" : "Mở rộng"}
                  <ChevronDown
                    size={12}
                    className={`transition-transform ${seoOpen ? "rotate-180" : ""}`}
                  />
                </button>
              }
            >
              {seoOpen ? (
                <div className="space-y-3">
                  <Field
                    label="Meta Title"
                    hint={`${(formData.meta_title || formData.name).length}/65 ký tự`}
                  >
                    <Input
                      value={formData.meta_title}
                      placeholder={formData.name || "Tự động từ tên SP"}
                      onChange={(e) => setField("meta_title", e.target.value)}
                    />
                  </Field>
                  <Field
                    label="Meta Description"
                    hint={`${(formData.meta_description || formData.description).length}/160 ký tự`}
                  >
                    <Textarea
                      value={formData.meta_description}
                      rows={2}
                      placeholder={formData.description || "Tự động từ mô tả"}
                      onChange={(e) =>
                        setField("meta_description", e.target.value)
                      }
                    />
                  </Field>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  {formData.meta_title || formData.name || "Chưa có meta title"}
                </p>
              )}
            </Card>
          </div>
        </div>
      </form>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
