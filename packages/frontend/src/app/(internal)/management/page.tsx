"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContentType = "design" | "project" | "construction";

interface ContentItem {
  id: string;
  title: string;
  type: string;
  description: string | null;
  is_published: boolean;
  images: string; // JSON string
  created_at: string;
  updated_at: string;
}

const TYPE_LABELS: Record<ContentType, string> = {
  design: "Thiết kế",
  project: "Dự án",
  construction: "Công trình",
};

const ALL_TYPES: ContentType[] = ["design", "project", "construction"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseImages(images: string): string[] {
  try {
    return JSON.parse(images) as string[];
  } catch {
    return [];
  }
}

async function patchContent(id: string, data: Record<string, unknown>) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const res = await fetch(API_URL + `/content/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || "HTTP " + res.status);
  }
}

// ─── Content Form ─────────────────────────────────────────────────────────────

function ContentForm({
  item,
  onClose,
  filterType,
}: {
  item?: ContentItem;
  onClose: () => void;
  filterType: ContentType | "all";
}) {
  const queryClient = useQueryClient();
  const isEdit = !!item;

  const [form, setForm] = useState({
    title: item?.title ?? "",
    type:
      (item?.type as ContentType) ??
      (filterType !== "all" ? filterType : "design"),
    description: item?.description ?? "",
    imageUrls: item ? parseImages(item.images).join("\n") : "",
    is_published: item?.is_published ?? false,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function validate(): string | null {
    if (!form.title.trim()) return "Tiêu đề là bắt buộc";
    if (!form.type) return "Loại là bắt buộc";
    const urls = form.imageUrls
      .split(/[\n,]/)
      .map((u) => u.trim())
      .filter(Boolean);
    if (urls.length === 0) return "Cần ít nhất 1 URL ảnh";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(true);

    const urls = form.imageUrls
      .split(/[\n,]/)
      .map((u) => u.trim())
      .filter(Boolean);

    const payload = {
      title: form.title.trim(),
      type: form.type,
      description: form.description.trim() || undefined,
      is_published: form.is_published,
      images: urls,
    };

    try {
      if (isEdit) {
        await patchContent(item!.id, payload);
      } else {
        await apiClient.post("/content", payload);
      }
      queryClient.invalidateQueries({ queryKey: ["content-items"] });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 space-y-3"
    >
      <h2 className="text-sm font-semibold text-blue-800">
        {isEdit ? "Chỉnh sửa nội dung" : "Thêm nội dung mới"}
      </h2>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Tiêu đề <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Tiêu đề"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Loại <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.type}
            onChange={(e) =>
              setForm((f) => ({ ...f, type: e.target.value as ContentType }))
            }
          >
            {ALL_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Mô tả</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Mô tả (tuỳ chọn)"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">
            URL ảnh <span className="text-red-500">*</span>
            <span className="text-gray-400 font-normal ml-1">
              (mỗi dòng hoặc cách nhau bằng dấu phẩy, JPEG/PNG/WebP)
            </span>
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            rows={3}
            value={form.imageUrls}
            onChange={(e) =>
              setForm((f) => ({ ...f, imageUrls: e.target.value }))
            }
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_published_form"
            checked={form.is_published}
            onChange={(e) =>
              setForm((f) => ({ ...f, is_published: e.target.checked }))
            }
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor="is_published_form"
            className="text-sm text-gray-700 cursor-pointer"
          >
            Đã đăng
          </label>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo nội dung"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg"
        >
          Huỷ
        </button>
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ManagementPage() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<ContentType | "all">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    data: items,
    isLoading,
    isError,
  } = useQuery<ContentItem[]>({
    queryKey: ["content-items", filterType],
    queryFn: async () => {
      const url =
        filterType === "all" ? "/content" : `/content?type=${filterType}`;
      const res = await apiClient.get<any>(url);
      if (Array.isArray(res)) return res;
      if (res?.items) return res.items;
      return [];
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, is_published }: { id: string; is_published: boolean }) =>
      patchContent(id, { is_published }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-items"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/content/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-items"] });
    },
  });

  function handleDelete(id: string) {
    if (!window.confirm("Bạn có chắc muốn xóa?")) return;
    deleteMutation.mutate(id);
  }

  function handleTogglePublish(item: ContentItem) {
    togglePublishMutation.mutate({
      id: item.id,
      is_published: !item.is_published,
    });
  }

  const editingItem = items?.find((i) => i.id === editingId);

  return (
    <div className="px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Management</h1>
          <p className="text-sm text-gray-500">Quản lý nội dung</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm((v) => !v);
            setEditingId(null);
          }}
          className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg"
        >
          + Thêm
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <ContentForm
          filterType={filterType}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Edit form */}
      {editingId && editingItem && (
        <ContentForm
          item={editingItem}
          filterType={filterType}
          onClose={() => setEditingId(null)}
        />
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {(["all", ...ALL_TYPES] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filterType === t
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t === "all" ? "Tất cả" : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* States */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <p className="text-center text-red-500 py-8">
          Không thể tải danh sách nội dung.
        </p>
      )}

      {!isLoading && !isError && (items ?? []).length === 0 && (
        <p className="text-center text-gray-400 py-8">Chưa có nội dung nào.</p>
      )}

      {/* Content list */}
      <div className="space-y-2">
        {(items ?? []).map((item) => {
          const images = parseImages(item.images);
          const typeLabel = TYPE_LABELS[item.type as ContentType] ?? item.type;

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="px-4 py-3 flex items-start gap-3">
                {/* Thumbnail */}
                {images[0] && (
                  <img
                    src={images[0]}
                    alt={item.title}
                    className="w-12 h-12 rounded-lg object-cover shrink-0 bg-gray-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {typeLabel}
                    </span>
                    {images.length > 0 && (
                      <span className="text-xs text-gray-400">
                        {images.length} ảnh
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {/* Toggle published */}
                  <button
                    onClick={() => handleTogglePublish(item)}
                    disabled={togglePublishMutation.isPending}
                    className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                      item.is_published
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                    title={item.is_published ? "Bấm để ẩn" : "Bấm để đăng"}
                  >
                    {item.is_published ? "Đã đăng" : "Nháp"}
                  </button>

                  <div className="flex gap-1">
                    {/* Edit */}
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingId((prev) =>
                          prev === item.id ? null : item.id,
                        );
                      }}
                      className="px-2 py-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
                    >
                      Sửa
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deleteMutation.isPending}
                      className="px-2 py-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-50"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
