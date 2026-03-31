"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
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
  Image,
  Tag as TagIcon,
  BarChart2,
  Info,
  Save,
  Copy,
  DollarSign,
} from "lucide-react";

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
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

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const BADGE_OPTIONS = [
  "Mới về",
  "Best Seller",
  "Xả kho",
  "Hàng hiếm",
  "Độc quyền",
];

export function initFormData(
  product?: Product & { media?: MediaRecord[] },
): FormState {
  if (!product) {
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
  }
  const existingMedia: PendingMedia[] = (product.media ?? []).map((m, idx) => ({
    clientId: m.id,
    url: m.file_url,
    preview_url: m.file_url,
    media_type: m.media_type as any,
    is_cover: m.is_cover,
    sort_order: m.sort_order ?? idx,
    status: "done" as const,
  }));
  return {
    name: product.name,
    sku: product.sku,
    slug: toSlug(product.name),
    description: product.description ?? "",
    category_id: product.category_id,
    technical_specs: product.technical_specs ?? {},
    style_ids: (product as any).style_tags?.map((t: any) => t.id) ?? [],
    space_ids: (product as any).space_tags?.map((t: any) => t.id) ?? [],
    pendingMedia: existingMedia,
    meta_title: (product.technical_specs?.meta_title as string) ?? "",
    meta_description:
      (product.technical_specs?.meta_description as string) ?? "",
    badges: (product.technical_specs?.badges as string[]) ?? [],
  };
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
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
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${type === "success" ? "bg-green-600" : "bg-red-600"}`}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 opacity-70 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}

type TabId = "info" | "media" | "specs" | "classify" | "internal";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "info", label: "Thông tin", icon: Info },
  { id: "media", label: "Media", icon: Image },
  { id: "specs", label: "Thông số", icon: BarChart2 },
  { id: "classify", label: "Phân loại", icon: TagIcon },
  { id: "internal", label: "Nội bộ", icon: DollarSign },
];

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
  const [productType, setProductType] = useState<ProductType>(
    () =>
      (product?.technical_specs?.product_type as ProductType) ??
      detectProductType(product?.category_id ?? ""),
  );
  const [activeTab, setActiveTab] = useState<TabId>("info");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [internalData, setInternalData] = useState<InternalInfoData>({});

  // Load internal info khi edit
  useEffect(() => {
    if (!product?.id) return;
    apiClient
      .get<any>(`/products/${product.id}/internal`)
      .then((data) => {
        if (data) {
          setInternalData({
            price_retail: data.price_retail ?? undefined,
            price_wholesale: data.price_wholesale ?? undefined,
            wholesale_discount_tiers:
              data.wholesale_discount_tiers ?? undefined,
            price_dealer: data.price_dealer ?? undefined,
            price_promo: data.price_promo ?? undefined,
            promo_start_date: data.promo_start_date ?? undefined,
            promo_end_date: data.promo_end_date ?? undefined,
            promo_note: data.promo_note ?? undefined,
            warehouse_location: data.warehouse_location ?? undefined,
            stock_status: data.stock_status ?? undefined,
            stock_quantity: data.stock_quantity ?? undefined,
            supplier_name: data.supplier_name ?? undefined,
            supplier_phone: data.supplier_phone ?? undefined,
            internal_notes: data.internal_notes ?? undefined,
          });
        }
      })
      .catch(() => {});
  }, [product?.id]);

  const originalMediaRef = useRef<PendingMedia[]>(
    initFormData(product).pendingMedia,
  );
  const nameRef = useRef<HTMLInputElement>(null);
  const skuRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  // Debounced slug generation
  const debouncedSlugUpdate = useMemo(
    () =>
      debounce((name: string) => {
        setFormData((prev) => ({ ...prev, slug: toSlug(name) }));
      }, 300),
    [],
  );

  const setField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        if (!prev[key]) return prev;
        const n = { ...prev };
        delete n[key];
        return n;
      });
    },
    [],
  );

  const handleTagChange = useCallback(
    (tagId: string, type: "style" | "space", checked: boolean) => {
      const key = type === "style" ? "style_ids" : "space_ids";
      setFormData((prev) => ({
        ...prev,
        [key]: checked
          ? [...prev[key], tagId]
          : prev[key].filter((id) => id !== tagId),
      }));
    },
    [],
  );

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Tên sản phẩm là bắt buộc";
    if (!formData.sku.trim()) newErrors.sku = "SKU là bắt buộc";
    if (!formData.category_id) newErrors.category_id = "Vui lòng chọn danh mục";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setActiveTab("info");
      setTimeout(() => {
        if (newErrors.name) {
          nameRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          nameRef.current?.focus();
        } else if (newErrors.sku) {
          skuRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          skuRef.current?.focus();
        } else if (newErrors.category_id)
          categoryRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
      }, 50);
      return false;
    }
    return true;
  };

  const uploadPendingMedia = async (productId: string): Promise<void> => {
    const pending = formData.pendingMedia.filter(
      (m) => m.status === "pending" && m.file,
    );
    const updateItemStatus = (
      clientId: string,
      patch: Partial<PendingMedia>,
    ) => {
      setFormData((prev) => ({
        ...prev,
        pendingMedia: prev.pendingMedia.map((m) =>
          m.clientId === clientId ? { ...m, ...patch } : m,
        ),
      }));
    };

    // Upload files in parallel for better performance
    const uploadPromises = pending.map(async (item) => {
      if (!item.file) return;
      updateItemStatus(item.clientId, { status: "uploading", progress: 0 });
      try {
        const { upload_url, public_url } = await getPresignedUrl(
          productId,
          item.file.name,
          item.media_type as any,
          item.file.type || "application/octet-stream",
        );
        await uploadFileToS3(upload_url, item.file, (percent) =>
          updateItemStatus(item.clientId, { progress: percent }),
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
        updateItemStatus(item.clientId, { status: "done", progress: 100 });
      } catch (err: any) {
        const msg =
          err?.response?.data?.message || err?.message || "Upload thất bại";
        updateItemStatus(item.clientId, { status: "error", error: msg });
        throw new Error(`Upload "${item.file.name}" thất bại: ${msg}`);
      }
    });

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    // Handle social links
    const socialPending = formData.pendingMedia.filter(
      (m) => m.status === "pending" && m.media_type === "social_link" && m.url,
    );
    const socialPromises = socialPending.map(async (item) => {
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
    });
    await Promise.all(socialPromises);
  };

  const syncMediaForEdit = async (
    productId: string,
    originalMedia: PendingMedia[],
  ): Promise<void> => {
    const currentIds = new Set(
      formData.pendingMedia
        .filter((m) => m.status === "done" && m.clientId)
        .map((m) => m.clientId),
    );
    const deletions = originalMedia
      .filter(
        (m) => m.status === "done" && m.clientId && !currentIds.has(m.clientId),
      )
      .map((m) => deleteMedia(m.clientId).catch(() => {}));
    await Promise.all(deletions);
    await uploadPendingMedia(productId);
    // Chỉ update sort-order cho media đã tồn tại trong DB (từ existingMedia)
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
      const { ...publicSpecs } = formData.technical_specs;
      const payload: CreateProductRequest | UpdateProductRequest = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        description: formData.description.trim() || undefined,
        category_id: formData.category_id,
        technical_specs: {
          ...publicSpecs,
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
        const hasInternalInfo =
          internalData.price_retail != null ||
          internalData.price_wholesale != null ||
          internalData.wholesale_discount_tiers ||
          internalData.price_dealer != null ||
          internalData.price_promo != null ||
          internalData.promo_start_date ||
          internalData.promo_end_date ||
          internalData.promo_note ||
          internalData.warehouse_location ||
          internalData.stock_status ||
          internalData.stock_quantity != null ||
          internalData.supplier_name ||
          internalData.supplier_phone ||
          internalData.internal_notes;
        if (hasInternalInfo) {
          try {
            await apiClient.patch(`/products/${productId}/internal`, {
              price_retail: internalData.price_retail,
              price_wholesale: internalData.price_wholesale,
              wholesale_discount_tiers: internalData.wholesale_discount_tiers,
              price_dealer: internalData.price_dealer,
              price_promo: internalData.price_promo,
              promo_start_date: internalData.promo_start_date,
              promo_end_date: internalData.promo_end_date,
              promo_note: internalData.promo_note,
              warehouse_location: internalData.warehouse_location,
              stock_status: internalData.stock_status,
              stock_quantity: internalData.stock_quantity,
              supplier_name: internalData.supplier_name,
              supplier_phone: internalData.supplier_phone,
              internal_notes: internalData.internal_notes,
            });
          } catch (err) {
            console.error("Failed to save internal info:", err);
          }
        }
      }
      setToast({ message: "Đã lưu sản phẩm", type: "success" });

      // Redirect with polling-based check instead of fixed delay
      if (productId) {
        console.log("✅ Product saved successfully");

        // Check if media processing is needed
        const hasPendingMedia = formData.pendingMedia.some(
          (m) => m.status === "pending" || m.status === "uploading",
        );

        if (!hasPendingMedia) {
          // No media to process, redirect immediately
          console.log("🔄 No pending media, redirecting immediately...");
          setTimeout(() => {
            window.location.replace(`/products/${productId}`);
          }, 500);
        } else {
          // Poll for media completion
          setToast({ message: "⏳ Đang xử lý media...", type: "success" });
          let pollCount = 0;
          const maxPolls = 20; // Max 10 seconds (20 * 500ms)

          const pollInterval = setInterval(() => {
            pollCount++;
            const stillProcessing = formData.pendingMedia.some(
              (m) => m.status === "uploading",
            );

            if (!stillProcessing || pollCount >= maxPolls) {
              clearInterval(pollInterval);
              console.log("🔄 Media processing complete, redirecting...");
              setToast({
                message: "✅ Hoàn tất! Đang chuyển trang...",
                type: "success",
              });
              setTimeout(() => {
                window.location.replace(`/products/${productId}?_updated=1`);
              }, 300);
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

  // ── Tab content panels ──────────────────────────────────────────────────────
  const tabInfo = (
    <div className="space-y-4">
      <Section title="Thông tin cơ bản">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Tên sản phẩm <span className="text-red-400">*</span>
              </label>
              <input
                ref={nameRef}
                type="text"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData((prev) => ({ ...prev, name }));
                  debouncedSlugUpdate(name);
                  setErrors((prev) => {
                    const n = { ...prev };
                    delete n.name;
                    return n;
                  });
                }}
                placeholder="VD: Gạch Porcelain 600x1200 Vân Đá"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? "border-red-400 bg-red-50" : "border-gray-200"}`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                SKU <span className="text-red-400">*</span>
              </label>
              <input
                ref={skuRef}
                type="text"
                value={formData.sku}
                onChange={(e) => setField("sku", e.target.value)}
                placeholder="VD: GCH-001"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${errors.sku ? "border-red-400 bg-red-50" : "border-gray-200"}`}
              />
              {errors.sku && (
                <p className="mt-1 text-xs text-red-500">{errors.sku}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              URL{" "}
              <span className="text-gray-400 font-normal">
                — tự động từ tên
              </span>
            </label>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              <span className="px-3 py-2 text-xs text-gray-400 border-r border-gray-200 whitespace-nowrap">
                /products/
              </span>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setField("slug", e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none text-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Mô tả ngắn
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={3}
              placeholder="Mô tả ngắn về sản phẩm, phong cách, không gian ứng dụng..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div ref={categoryRef}>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Danh mục <span className="text-red-400">*</span>
            </label>
            <CategoryPicker
              categories={categories}
              value={formData.category_id}
              onChange={(id) => setField("category_id", id)}
            />
            {errors.category_id && (
              <p className="mt-1 text-xs text-red-500">{errors.category_id}</p>
            )}
          </div>

          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-400 uppercase tracking-widest py-1 select-none list-none">
              <svg
                className="w-3 h-3 transition-transform group-open:rotate-90"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              SEO (tùy chọn)
            </summary>
            <div className="mt-3 space-y-3 pl-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600">
                    Meta Title
                  </label>
                  <span
                    className={`text-xs font-mono ${(formData.meta_title || formData.name).length > 65 ? "text-red-500" : "text-green-500"}`}
                  >
                    {(formData.meta_title || formData.name).length} / 65
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.meta_title}
                  onChange={(e) => setField("meta_title", e.target.value)}
                  placeholder={formData.name || "Tự động lấy từ tên sản phẩm"}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600">
                    Meta Description
                  </label>
                  <span
                    className={`text-xs font-mono ${(formData.meta_description || formData.description).length > 160 ? "text-red-500" : "text-green-500"}`}
                  >
                    {(formData.meta_description || formData.description).length}{" "}
                    / 160
                  </span>
                </div>
                <textarea
                  value={formData.meta_description}
                  onChange={(e) => setField("meta_description", e.target.value)}
                  rows={2}
                  placeholder={
                    formData.description || "Tự động lấy từ mô tả ngắn"
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </details>
        </div>
      </Section>
    </div>
  );

  const tabMedia = (
    <Section title="Hình ảnh & Media">
      <MediaUploader
        productId={product?.id}
        existingMedia={formData.pendingMedia}
        onChange={(media) => setField("pendingMedia", media)}
        productName={formData.name}
      />
    </Section>
  );

  const tabSpecs = (
    <Section title="Thông số kỹ thuật">
      <SpecTable
        categoryId={formData.category_id}
        value={formData.technical_specs}
        onChange={(specs) => setField("technical_specs", specs)}
        productType={productType}
        onProductTypeChange={(type) => {
          setProductType(type);
          setFormData((prev) => ({
            ...prev,
            technical_specs: { ...prev.technical_specs, product_type: type },
          }));
        }}
      />
    </Section>
  );

  const tabClassify = (
    <div className="space-y-4">
      {(styles.length > 0 || spaces.length > 0) && (
        <Section title="Thẻ & Phân loại">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">
                Phong cách
              </p>
              <div className="space-y-1.5">
                {styles.map((style) => (
                  <label
                    key={style.id}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={formData.style_ids.includes(style.id)}
                      onChange={(e) =>
                        handleTagChange(style.id, "style", e.target.checked)
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900">
                      {style.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">
                Không gian
              </p>
              <div className="space-y-1.5">
                {spaces.map((space) => (
                  <label
                    key={space.id}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={formData.space_ids.includes(space.id)}
                      onChange={(e) =>
                        handleTagChange(space.id, "space", e.target.checked)
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900">
                      {space.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Section>
      )}

      <Section title="Nhãn dán">
        <div className="flex flex-wrap gap-2">
          {BADGE_OPTIONS.map((badge) => {
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
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${active ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-500 border-gray-200 hover:border-orange-300 hover:text-orange-500"}`}
              >
                {badge}
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );

  const tabInternal = (
    <Section title="Thông tin nội bộ">
      <InternalInfoSection value={internalData} onChange={setInternalData} />
    </Section>
  );

  const tabContent: Record<TabId, React.ReactNode> = {
    info: tabInfo,
    media: tabMedia,
    specs: tabSpecs,
    classify: tabClassify,
    internal: tabInternal,
  };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        {/* ── Save bar (luôn hiện, sticky trên mobile) ── */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3 mb-5 flex items-center gap-3 shadow-sm">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {formData.name ||
                (product ? "Chỉnh sửa sản phẩm" : "Sản phẩm mới")}
            </p>
            {formData.sku && (
              <p className="text-xs text-gray-400 font-mono">{formData.sku}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {product?.id && onClone && (
              <button
                type="button"
                onClick={() => onClone(product.id)}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Copy size={14} />
                <span className="hidden sm:inline">Nhân bản</span>
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
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
              <span>{saving ? "Đang lưu..." : "Lưu"}</span>
            </button>
          </div>
        </div>

        {/* ── Tab nav ── */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 overflow-x-auto no-scrollbar -mx-4 px-5 md:mx-0 md:px-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const hasError =
              id === "info" &&
              (errors.name || errors.sku || errors.category_id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all shrink-0 relative ${activeTab === id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <Icon size={14} />
                {label}
                {hasError && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tab content — hoạt động ở mọi kích thước ── */}
        <div>{tabContent[activeTab]}</div>
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
