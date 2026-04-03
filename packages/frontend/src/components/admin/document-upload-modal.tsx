"use client";

import { useState, useCallback, useRef } from "react";
import { documentService, DocumentCategory } from "@/lib/document-service";
import {
  X,
  Upload,
  AlertCircle,
  File,
  CheckCircle2,
  Link as LinkIcon,
  Paperclip,
  Trash2,
  CloudUpload,
} from "lucide-react";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: DocumentCategory[];
  preselectedEntity?: {
    type: "ORDER" | "CUSTOMER" | "PRODUCT" | "LEAD";
    id: string;
  };
}

export default function DocumentUploadModal({
  isOpen,
  onClose,
  onSuccess,
  categories,
  preselectedEntity,
}: DocumentUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [entityType, setEntityType] = useState(preselectedEntity?.type || "");
  const [entityId, setEntityId] = useState(preselectedEntity?.id || "");

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Xử lý kéo thả file
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
    }
  }, []);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Vui lòng chọn hoặc kéo thả một file.");
      return;
    }
    if (!categoryId) {
      setError("Vui lòng phân loại danh mục cho chứng từ này.");
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const tags =
        entityType && entityId
          ? [{ entity_type: entityType, entity_id: entityId }]
          : undefined;

      const result = await documentService.uploadDocument(
        file,
        categoryId,
        tags,
      );
      console.log("[Upload] success:", result);
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error("[Upload] failed:", err);
      setError(err.message || "Upload thất bại. Vui lòng thử lại sau.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    setFile(null);
    setCategoryId("");
    setEntityType(preselectedEntity?.type || "");
    setEntityId(preselectedEntity?.id || "");
    setError(null);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (!isOpen) return null;

  return (
    // Backdrop - Căn dưới cùng trên mobile, căn giữa trên desktop
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-900/60 backdrop-blur-sm p-0 sm:p-4 transition-all">
      {/* Modal Container */}
      <div
        className="bg-white w-full max-w-[560px] max-h-[90vh] flex flex-col sm:rounded-2xl rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-xl">
              <CloudUpload className="w-5 h-5 text-gray-700" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Tải lên chứng từ
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 text-gray-500 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium leading-relaxed">
                {error}
              </p>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div>
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ease-in-out group
                  ${
                    isDragging
                      ? "border-blue-500 bg-blue-50/50"
                      : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
                  }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelected}
                  className="hidden"
                  disabled={isUploading}
                />
                <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full shadow-sm flex items-center justify-center border border-gray-100 group-hover:scale-105 transition-transform">
                  <CloudUpload
                    className={`w-8 h-8 ${isDragging ? "text-blue-500" : "text-gray-400"}`}
                  />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  Kéo thả file vào đây
                </h3>
                <p className="text-sm text-gray-500">
                  hoặc{" "}
                  <span className="text-blue-600 font-medium">
                    duyệt thư mục
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-4">
                  Hỗ trợ: PDF, Word, Excel, JPG, PNG (Tối đa 10MB)
                </p>
              </div>
            ) : (
              /* File Selected State */
              <div className="border border-gray-200 rounded-2xl p-4 bg-white shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
                    <File className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate pr-4">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium text-gray-500">
                        {formatFileSize(file.size)}
                      </span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Đã chọn
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setFile(null)}
                  disabled={isUploading}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  title="Xóa file"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-gray-500" />
                Phân loại chứng từ <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setError(null);
                }}
                disabled={isUploading}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
              >
                <option value="">-- Chọn một danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Linking - Thiết kế lại gọn gàng và responsive hơn */}
            <div className="pt-2">
              <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-gray-500" />
                Liên kết bản ghi (Tùy chọn)
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  disabled={!!preselectedEntity || isUploading}
                  className="w-full sm:w-2/5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">Không liên kết</option>
                  <option value="ORDER">Đơn hàng</option>
                  <option value="CUSTOMER">Khách hàng</option>
                  <option value="PRODUCT">Sản phẩm</option>
                  <option value="LEAD">Khách tiềm năng</option>
                </select>
                <input
                  type="text"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  disabled={!!preselectedEntity || !entityType || isUploading}
                  placeholder={
                    entityType
                      ? "Nhập mã (VD: DH_1001)"
                      : "Chọn loại liên kết trước"
                  }
                  className="w-full sm:w-3/5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:text-gray-400 placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed, Action buttons stretch on mobile */}
        <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 shrink-0 sm:rounded-b-2xl">
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="w-full sm:w-auto px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium disabled:opacity-50 text-sm"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || !categoryId || isUploading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-300 disabled:cursor-not-allowed text-sm shadow-sm hover:shadow active:scale-95 duration-200"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Xác nhận tải lên
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
