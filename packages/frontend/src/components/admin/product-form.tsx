"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
} from "@/lib/product-service";

import { CategoryPicker } from "@/components/admin/category-picker";
import { MediaUploader, PendingMedia } from "@/components/admin/media-uploader";
import {
  InternalInfoSection,
  InternalInfoData,
} from "@/components/admin/internal-info-section";
import { SpecTable } from "@/components/admin/spec-table";
import { ProductType, detectProductType } from "@/lib/spec-templates";
import {
  uploadMedia,
  createMediaRecord,
  deleteMedia,
  updateSortOrder,
  MediaRecord,
} from "@/lib/media-service";
import { apiClient } from "@/lib/api-client";
import { realtimeService } from "@/lib/realtime-service";
import { invalidateProductMediaCache } from "@/lib/cache-utils";
import { Save, Copy, Eye, ChevronDown, Radio } from "lucide-react";

import {
  debounce,
  toSlug,
  withRetry,
  formatApiError,
  safeApiCall,
  initFormData,
  Field,
  Card,
  Input,
  Textarea,
  Toast,
  FormState,
  ProductFormProps,
  BADGES,
} from "./product-form-utils";

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
  const originalMediaRef = useRef<PendingMedia[]>([]);
  const initializedId = useRef<string | undefined>(undefined);

  const [productType, setProductType] = useState<ProductType>(
    () =>
      (product?.technical_specs?.product_type as ProductType) ??
      detectProductType(product?.category_id ?? ""),
  );

  useEffect(() => {
    if (product?.id && product.id !== initializedId.current) {
      initializedId.current = product.id;
      const d = initFormData(product);
      setFormData(d);
      originalMediaRef.current = d.pendingMedia;
      setErrors({});
      setSeoOpen(false);
      setProductType(
        (product?.technical_specs?.product_type as ProductType) ??
          detectProductType(product?.category_id ?? ""),
      );
    }
  }, [product]);

  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [internalData, setInternalData] = useState<InternalInfoData>({});
  const [seoOpen, setSeoOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    isSyncing: boolean;
    lastSync: Date | null;
  }>({ isSyncing: false, lastSync: null });
  const nameRef = useRef<HTMLInputElement>(null);
  const skuRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  // Real-time sync
  useEffect(() => {
    if (!product?.id || !realtimeService) return;
    const unsubscribeUploadStart = realtimeService.subscribe(
      "media_upload_start",
      (data) =>
        setToast({
          message: `📤 ${data.fileName} đang upload...`,
          type: "info",
        }),
    );
    const unsubscribeUploadComplete = realtimeService.subscribe(
      "media_upload_complete",
      () => {
        setSyncStatus({ isSyncing: true, lastSync: new Date() });
        setTimeout(
          () => setSyncStatus((p) => ({ ...p, isSyncing: false })),
          1000,
        );
      },
    );
    const unsubscribeProductSaved = realtimeService.subscribe(
      "product_saved",
      () => {
        setToast({ message: `💾 SP vừa được lưu tab khác.`, type: "info" });
        setSyncStatus({ isSyncing: true, lastSync: new Date() });
        setTimeout(
          () => setSyncStatus((p) => ({ ...p, isSyncing: false })),
          1500,
        );
      },
    );
    const unsubscribeMediaDelete = realtimeService.subscribe(
      "media_delete",
      (data) =>
        setFormData((prev) => ({
          ...prev,
          pendingMedia: prev.pendingMedia.filter(
            (m) => m.clientId !== data.mediaId,
          ),
        })),
    );

    return () => {
      unsubscribeUploadStart?.();
      unsubscribeUploadComplete?.();
      unsubscribeProductSaved?.();
      unsubscribeMediaDelete?.();
    };
  }, [product?.id]);

  useEffect(() => {
    if (!product?.id) return;
    safeApiCall(
      () => apiClient.get<any>(`/p/${product.sku}/internal`),
      "Lấy thông tin",
      { logError: false },
    ).then((res) => {
      if (res.success && res.data) {
        setInternalData(res.data);
      }
    });
  }, [product?.id]);

  const debouncedSlug = useMemo(
    () =>
      debounce(
        (name: string) => setFormData((p) => ({ ...p, slug: toSlug(name) })),
        300,
      ),
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
    if (!formData.category_id) e.category_id = "Vui lòng chọn";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    const apiErrors: string[] = [];

    try {
      const payload: CreateProductRequest | UpdateProductRequest = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        description: formData.description.trim() || undefined,
        category_id: formData.category_id,
        style_ids: formData.style_ids,
        space_ids: formData.space_ids,
        technical_specs: {
          ...formData.technical_specs,
          slug: formData.slug,
          meta_title: formData.meta_title || formData.name,
          meta_description:
            formData.meta_description || formData.description || undefined,
          badges: formData.badges.length > 0 ? formData.badges : undefined,
        },
      };

      const productResult = await withRetry(() => onSubmit(payload), {
        maxRetries: 2,
        context: "Lưu sản phẩm",
      });
      const productId = product?.id ?? (productResult as any)?.id;
      if (!productId) throw new Error("Lỗi lưu SP");

      const operations: Promise<any>[] = [];

      // A. Xóa media
      if (product?.id) {
        const currentIds = new Set(
          formData.pendingMedia
            .filter((m) => m.status === "done")
            .map((m) => m.clientId),
        );
        const toDelete = originalMediaRef.current.filter(
          (m) => m.status === "done" && !currentIds.has(m.clientId),
        );
        if (toDelete.length > 0) {
          operations.push(
            Promise.all(
              toDelete.map((m) =>
                safeApiCall(() => deleteMedia(m.clientId), `Xóa media`, {
                  throwOnError: false,
                }),
              ),
            ).then((res) => {
              const fail = res.filter((r) => !r.success);
              if (fail.length > 0)
                apiErrors.push(`Lỗi xóa ${fail.length} file`);
            }),
          );
        }
      }

      // B. Internal info
      operations.push(
        safeApiCall(
          () =>
            apiClient.patch(`/products/${productId}/internal`, internalData),
          "Lưu info nội bộ",
          { throwOnError: false },
        ),
      );

      // C. Sort order
      if (product?.id) {
        const existingIds = new Set(
          originalMediaRef.current.map((m) => m.clientId),
        );
        const doneItems = formData.pendingMedia.filter(
          (m) => m.status === "done" && existingIds.has(m.clientId),
        );
        const orderChanged = doneItems.some((item) => {
          const orig = originalMediaRef.current.find(
            (m) => m.clientId === item.clientId,
          );
          return orig && orig.sort_order !== item.sort_order;
        });
        if (doneItems.length > 0 && orderChanged) {
          operations.push(
            safeApiCall(
              () =>
                updateSortOrder(
                  productId,
                  doneItems.map((m) => ({
                    id: m.clientId,
                    sort_order: m.sort_order,
                  })),
                ),
              "Sắp xếp media",
              { throwOnError: false },
            ),
          );
        }
      }

      // D. Upload
      const pending = formData.pendingMedia.filter(
        (m) => m.status === "pending" && m.file,
      );
      if (pending.length > 0) {
        const updateStatus = (clientId: string, patch: Partial<PendingMedia>) =>
          setFormData((p) => ({
            ...p,
            pendingMedia: p.pendingMedia.map((m) =>
              m.clientId === clientId ? { ...m, ...patch } : m,
            ),
          }));
        operations.push(
          Promise.all(
            pending.map(async (item) => {
              if (!item.file) return { success: true };
              updateStatus(item.clientId, { status: "uploading", progress: 0 });
              try {
                const fileUrl = await withRetry(
                  () =>
                    uploadMedia(
                      productId,
                      item.file!,
                      item.media_type as any,
                      (pct) => updateStatus(item.clientId, { progress: pct }),
                    ),
                  { maxRetries: 2, context: `Upload` },
                );
                await withRetry(
                  () =>
                    createMediaRecord({
                      product_id: productId,
                      file_url: fileUrl,
                      file_type: item.file!.type,
                      media_type: item.media_type as any,
                      is_cover: item.is_cover,
                      sort_order: item.sort_order,
                      alt_text: item.alt_text,
                    }),
                  { maxRetries: 2, context: `Record` },
                );
                updateStatus(item.clientId, { status: "done", progress: 100 });
                return { success: true };
              } catch (err) {
                updateStatus(item.clientId, { status: "error" });
                return { success: false };
              }
            }),
          ).then((res) => {
            const fail = res.filter((r) => !r.success);
            if (fail.length > 0)
              apiErrors.push(`Lỗi upload ${fail.length} file`);
          }),
        );
      }

      await Promise.all(operations);

      invalidateProductMediaCache(productId);
      if (realtimeService) {
        realtimeService.broadcastProductSaved(productId, {
          id: productId,
          name: formData.name,
          updatedAt: new Date().toISOString(),
        });
      }

      setToast({
        message:
          apiErrors.length > 0
            ? `Xong, nhưng có lỗi: ${apiErrors.join(", ")}`
            : "Lưu thành công!",
        type: apiErrors.length > 0 ? "info" : "success",
      });

      // Clear Next.js cache before navigation
      router.refresh();

      // Force full page reload to bypass client-side cache and ensure fresh media
      setTimeout(() => {
        window.location.href = `/p/${formData.sku}`;
      }, 800);
    } catch (err: any) {
      setToast({ message: formatApiError(err, "Lưu thất bại"), type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const saving = isSaving || isLoading;

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        {/* ── Top bar (Kính mờ, thả nổi) ── */}
        <div className="sticky top-14 lg:top-0 z-30 bg-white/70 backdrop-blur-[32px] saturate-150 border-b border-black/5 px-4 md:px-6 py-3 mb-6 flex items-center justify-between shadow-[0_4px_16px_rgba(0,0,0,0.02)] -mx-4 md:-mx-6">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-bold text-gray-900 truncate tracking-tight">
                {formData.name || (product ? "Sửa sản phẩm" : "Sản phẩm mới")}
              </h2>
              {syncStatus.isSyncing && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-black/5 text-gray-700 text-[11px] font-bold rounded-full border border-black/5">
                  <Radio size={12} className="animate-pulse" /> Sync
                </span>
              )}
            </div>
            {formData.sku && (
              <p className="text-[12px] font-medium text-gray-500 mt-0.5">
                {formData.sku}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {product?.id && (
              <a
                href={`/p/${product.sku}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-black/5 text-gray-700 text-[13px] font-bold rounded-full hover:bg-black/10 transition-colors active:scale-95"
              >
                <Eye size={16} strokeWidth={2.5} /> Xem
              </a>
            )}
            {product?.id && onClone && (
              <button
                type="button"
                onClick={() => onClone(product.id)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-black/5 text-gray-700 text-[13px] font-bold rounded-full hover:bg-black/10 transition-colors active:scale-95"
              >
                <Copy size={16} strokeWidth={2.5} /> Copy
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gray-900 text-white text-[14px] font-bold rounded-full hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_4px_12px_rgba(0,0,0,0.15)] active:scale-95"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={16} strokeWidth={2.5} />
              )}
              {saving ? "Lưu..." : "Lưu"}
            </button>
          </div>
        </div>

        {/* ── 2-column layout ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          {/* ── LEFT COLUMN ── */}
          <div className="space-y-6">
            <Card title="Thông tin cơ bản">
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-5">
                  <Field label="Tên sản phẩm" required error={errors.name}>
                    <Input
                      ref={nameRef}
                      value={formData.name}
                      placeholder="VD: Gạch 60x120"
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
                  <Field label="Mã SKU" required error={errors.sku}>
                    <Input
                      ref={skuRef}
                      value={formData.sku}
                      placeholder="GCH-001"
                      className={`font-mono uppercase ${errors.sku ? "border-red-400 bg-red-50" : ""}`}
                      onChange={(e) => setField("sku", e.target.value)}
                    />
                  </Field>
                </div>

                <Field label="Mô tả">
                  <Textarea
                    value={formData.description}
                    rows={3}
                    placeholder="Mô tả chất liệu, ứng dụng..."
                    onChange={(e) => setField("description", e.target.value)}
                  />
                </Field>

                <Field label="Đường dẫn (URL)">
                  <div className="flex items-center bg-black/5 rounded-[12px] overflow-hidden border border-transparent focus-within:bg-white focus-within:border-black/10 focus-within:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all">
                    <span className="px-3 py-2.5 text-[13px] text-gray-500 whitespace-nowrap select-none font-medium">
                      /products/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setField("slug", e.target.value)}
                      className="flex-1 pr-3 py-2.5 text-[14px] bg-transparent focus:outline-none text-gray-900 font-mono"
                    />
                  </div>
                </Field>
              </div>
            </Card>

            <Card title="Hình ảnh & Video">
              <MediaUploader
                productId={product?.id}
                existingMedia={formData.pendingMedia}
                onChange={(media) => setField("pendingMedia", media)}
                productName={formData.name}
              />
            </Card>

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

            <Card title="Dữ liệu nội bộ (Kho & Giá)">
              <InternalInfoSection
                value={internalData}
                onChange={setInternalData}
              />
            </Card>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-6">
            <Card title="Phân loại">
              <div className="space-y-5">
                <div ref={categoryRef}>
                  <Field
                    label="Danh mục chính"
                    required
                    error={errors.category_id}
                  >
                    <CategoryPicker
                      categories={categories}
                      value={formData.category_id}
                      onChange={(id) => setField("category_id", id)}
                    />
                  </Field>
                </div>

                <Field label="Nhãn nổi bật (Badges)">
                  <div className="flex flex-wrap gap-2 mt-1">
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
                          className={`px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all active:scale-95 ${active ? "bg-gray-900 text-white border-gray-900 shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900"}`}
                        >
                          {badge}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>
            </Card>

            {(styles.length > 0 || spaces.length > 0) && (
              <Card title="Bộ lọc & Khám phá">
                <div className="space-y-5">
                  {styles.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                        Phong cách
                      </p>
                      <div className="flex flex-wrap gap-2">
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
                              className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-all active:scale-95 border ${active ? "bg-gray-900 text-white border-gray-900 shadow-sm" : "bg-black/5 text-gray-700 border-transparent hover:bg-black/10 hover:text-gray-900"}`}
                            >
                              {s.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {spaces.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                        Không gian
                      </p>
                      <div className="flex flex-wrap gap-2">
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
                              className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-all active:scale-95 border ${active ? "bg-gray-900 text-white border-gray-900 shadow-sm" : "bg-black/5 text-gray-700 border-transparent hover:bg-black/10 hover:text-gray-900"}`}
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

            <Card
              title="SEO On-page"
              action={
                <button
                  type="button"
                  onClick={() => setSeoOpen((o) => !o)}
                  className="p-1 text-gray-400 hover:text-gray-900 bg-black/5 rounded-full transition-colors active:scale-90"
                >
                  <ChevronDown
                    size={18}
                    strokeWidth={2.5}
                    className={`transition-transform duration-300 ${seoOpen ? "rotate-180" : ""}`}
                  />
                </button>
              }
            >
              {seoOpen ? (
                <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Field
                    label="Tiêu đề (Meta Title)"
                    hint={`${(formData.meta_title || formData.name).length}/65 ký tự`}
                  >
                    <Input
                      value={formData.meta_title}
                      placeholder={formData.name || "Auto"}
                      onChange={(e) => setField("meta_title", e.target.value)}
                    />
                  </Field>
                  <Field
                    label="Mô tả (Meta Desc)"
                    hint={`${(formData.meta_description || formData.description).length}/160 ký tự`}
                  >
                    <Textarea
                      value={formData.meta_description}
                      rows={3}
                      placeholder={formData.description || "Auto"}
                      onChange={(e) =>
                        setField("meta_description", e.target.value)
                      }
                    />
                  </Field>
                </div>
              ) : (
                <p className="text-[13px] text-gray-500 font-medium truncate pt-1">
                  {formData.meta_title || formData.name || "Chưa thiết lập"}
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
