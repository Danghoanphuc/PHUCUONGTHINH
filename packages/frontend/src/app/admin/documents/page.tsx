"use client";

import { useEffect, useState, useMemo } from "react";
import {
  documentService,
  Document,
  DocumentCategory,
} from "@/lib/document-service";
import DocumentUploadModal from "@/components/admin/document-upload-modal";
import DocumentPreviewModal from "@/components/admin/document-preview-modal";
import {
  FileText,
  Search,
  Trash2,
  Eye,
  Upload,
  Filter,
  LayoutGrid,
  List as ListIcon,
  Image as ImageIcon,
  FileOutput,
  FileSpreadsheet,
  FolderOpen,
  Plus,
} from "lucide-react";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // UI State
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docs, cats] = await Promise.all([
        documentService.getDocuments(),
        documentService.getCategories(),
      ]);
      console.log(
        "[Documents] loaded:",
        docs.length,
        "docs,",
        cats.length,
        "categories",
        cats,
      );
      setDocuments(docs);
      setCategories(cats);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchCategory =
        !selectedCategory || doc.category_id === selectedCategory;
      const matchSearch =
        !searchQuery ||
        doc.original_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [documents, selectedCategory, searchQuery]);

  const handleDelete = async (docId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa chứng từ này vĩnh viễn?")) return;

    setDeleting(docId);
    try {
      await documentService.deleteDocument(docId);
      setDocuments(documents.filter((d) => d.id !== docId));
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Xóa thất bại. Vui lòng thử lại.");
    } finally {
      setDeleting(null);
    }
  };

  const handlePreview = (doc: Document) => {
    setPreviewDocument(doc);
    setIsPreviewOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Thay thế Emoji bằng Lucide Icons có màu sắc
  const getFileIcon = (mimeType?: string, className: string = "w-8 h-8") => {
    if (!mimeType) return <FileText className={`${className} text-blue-500`} />;
    if (mimeType.includes("pdf"))
      return <FileOutput className={`${className} text-rose-500`} />;
    if (mimeType.includes("sheet") || mimeType.includes("excel"))
      return <FileSpreadsheet className={`${className} text-emerald-600`} />;
    if (mimeType.includes("image"))
      return <ImageIcon className={`${className} text-amber-500`} />;
    return <FileText className={`${className} text-blue-500`} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-6 sm:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium animate-pulse">
            Đang tải không gian làm việc...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100">
              <FolderOpen className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Kho Chứng Từ Số
              </h1>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                Quản lý {documents.length} tài liệu trong {categories.length}{" "}
                danh mục
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-sm font-medium active:scale-95"
          >
            <Upload className="w-4 h-4" />
            Tải lên tài liệu
          </button>
        </div>

        {/* Toolbar: Filters & View Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-72 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên file..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>

            {/* Category Filter */}
            <div className="relative w-full sm:w-56">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all shadow-sm cursor-pointer"
              >
                <option value="">Tất cả danh mục</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm w-full sm:w-auto justify-center">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg flex items-center gap-2 transition-all ${
                viewMode === "grid"
                  ? "bg-gray-100 text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              title="Dạng lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg flex items-center gap-2 transition-all ${
                viewMode === "list"
                  ? "bg-gray-100 text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              title="Dạng danh sách"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {filteredDocuments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <FileText className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {documents.length === 0
                ? "Kho lưu trữ trống"
                : "Không tìm thấy tài liệu"}
            </h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
              {documents.length === 0
                ? "Bắt đầu tải lên các chứng từ, hợp đồng hoặc hình ảnh hiện trường để quản lý tập trung."
                : "Thử thay đổi từ khóa tìm kiếm hoặc xóa bộ lọc danh mục."}
            </p>
            {documents.length === 0 && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
              >
                <Plus className="w-4 h-4" /> Tải lên tài liệu đầu tiên
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                onClick={() => handlePreview(doc)}
                className="group relative bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div className="flex justify-between items-start mb-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50 group-hover:bg-blue-50/50 transition-colors border border-gray-100">
                    {getFileIcon(doc.mime_type, "w-7 h-7")}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.id);
                      }}
                      disabled={deleting === doc.id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <p
                    className="font-semibold text-gray-900 text-[15px] line-clamp-1 mb-1.5 group-hover:text-blue-600 transition-colors"
                    title={doc.original_name}
                  >
                    {doc.original_name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <span className="font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                      {doc.category.name}
                    </span>
                    <span>•</span>
                    <span>{formatFileSize(doc.file_size)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <span className="text-[11px] text-gray-400 font-medium">
                      {new Date(doc.created_at).toLocaleDateString("vi-VN")}
                    </span>
                    {doc.tags?.length > 0 && (
                      <span className="text-[11px] font-medium bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">
                        {doc.tags.length} liên kết
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                  <tr>
                    <th className="px-6 py-4">Tên tài liệu</th>
                    <th className="px-6 py-4">Danh mục</th>
                    <th className="px-6 py-4">Kích thước</th>
                    <th className="px-6 py-4">Ngày tải lên</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDocuments.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-gray-50/80 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-white transition-colors">
                            {getFileIcon(doc.mime_type, "w-5 h-5")}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {doc.original_name}
                            </p>
                            {doc.tags?.length > 0 && (
                              <p className="text-xs text-emerald-600 mt-0.5 font-medium">
                                Đã liên kết {doc.tags.length} bản ghi
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                          {doc.category.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-medium">
                        {formatFileSize(doc.file_size)}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(doc.created_at).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handlePreview(doc)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem file"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            disabled={deleting === doc.id}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        <DocumentUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={() => {
            setSelectedCategory(""); // Reset filter để hiển thị document mới
            loadData();
          }}
          categories={categories}
        />

        {/* Preview Modal */}
        <DocumentPreviewModal
          isOpen={isPreviewOpen}
          document={previewDocument}
          onClose={() => setIsPreviewOpen(false)}
        />
      </div>
    </div>
  );
}
