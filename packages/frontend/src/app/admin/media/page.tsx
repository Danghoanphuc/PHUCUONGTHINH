"use client";

import { useState, useEffect } from "react";
import { productService, Product } from "@/lib/product-service";
import { apiClient } from "@/lib/admin-api-client";
import {
  MediaRecord,
  getPresignedUrl,
  uploadFileToS3,
  createMediaRecord,
  deleteMedia,
  MediaType,
} from "@/lib/media-service";

export default function AdminMediaPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [media, setMedia] = useState<MediaRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    productService
      .getProducts(1, 100)
      .then((res) => {
        setProducts(res.products || []);
        if (res.products?.length > 0) setSelectedProduct(res.products[0].id);
      })
      .catch(() => setError("Không thể tải danh sách sản phẩm"))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    apiClient
      .get<MediaRecord[]>(`/media/product/${selectedProduct}`)
      .then((data) =>
        setMedia((data || []).sort((a, b) => a.sort_order - b.sort_order)),
      )
      .catch(() => setError("Không thể tải media"));
  }, [selectedProduct]);

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    mediaType: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProduct) return;
    setUploading(mediaType);
    setError("");
    try {
      const { upload_url, public_url } = await getPresignedUrl(
        selectedProduct,
        file.name,
        mediaType as MediaType,
        file.type,
      );
      await uploadFileToS3(upload_url, file);
      const record = await createMediaRecord({
        product_id: selectedProduct,
        file_url: public_url,
        file_type: file.type,
        media_type: mediaType as MediaType,
        sort_order: media.length,
      });
      setMedia([...media, record].sort((a, b) => a.sort_order - b.sort_order));
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Không thể tải lên media");
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa media này?")) return;
    try {
      await deleteMedia(id);
      setMedia(media.filter((m) => m.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Không thể xóa media");
    }
  };

  const MEDIA_TYPES: Record<string, string> = {
    lifestyle: "Ảnh thực tế",
    cutout: "Ảnh cắt nền",
    video: "Video",
    "3d_file": "File 3D",
    pdf: "Catalogue PDF",
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Quản lý Media</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn sản phẩm
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Tải lên Media
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(MEDIA_TYPES).map(([type, label]) => (
                <label
                  key={type}
                  className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-500 transition"
                >
                  <input
                    type="file"
                    onChange={(e) => handleUpload(e, type)}
                    disabled={uploading === type}
                    className="hidden"
                  />
                  <p className="text-sm font-medium text-gray-700 text-center">
                    {uploading === type ? "Đang tải..." : label}
                  </p>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Thư viện Media
            </h2>
            {media.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có media cho sản phẩm này
              </div>
            ) : (
              <div className="space-y-3">
                {media.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded border"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {MEDIA_TYPES[item.media_type] || item.media_type}
                      </p>
                      {item.is_cover && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                          Ảnh bìa
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
