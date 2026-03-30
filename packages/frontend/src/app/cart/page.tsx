"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Trash2, ArrowLeft, FileText } from "lucide-react";
import { useQuoteCart } from "@/lib/wishlist-context";
import { leadService } from "@/lib/lead-service";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart } = useQuoteCart();

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleQuantityChange = (id: string, value: string) => {
    const qty = parseInt(value);
    if (qty > 0) updateQuantity(id, qty);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus("idle");

    try {
      if (!formData.name || (!formData.phone && !formData.email)) {
        throw new Error("Vui lòng nhập tên và số điện thoại/email để liên hệ.");
      }

      // Tạo chuỗi mô tả danh sách sản phẩm để sale dễ đọc
      const itemsListText = items
        .map(
          (item) =>
            `- ${item.product.name} (SKU: ${item.product.sku}): ${item.quantity} ${item.unit}`,
        )
        .join("\n");

      const combinedDetails = `${formData.notes}\n\n=== DANH SÁCH YÊU CẦU ===\n${itemsListText}`;
      const productIds = items.map((item) => item.product.id);

      // Chỉ gửi email nếu có giá trị
      const leadData: any = {
        name: formData.name,
        phone: formData.phone,
        inquiry_type: "quote",
        project_details: combinedDetails,
        product_ids: productIds,
      };

      if (formData.email && formData.email.trim()) {
        leadData.email = formData.email.trim();
      }

      await leadService.createLead(leadData);

      setStatus("success");
      clearCart();
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error.message || "Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0 && status !== "success") {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 pt-24">
        <FileText size={64} className="text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-primary mb-2">
          Danh sách báo giá trống
        </h1>
        <p className="text-gray-500 mb-6">
          Bạn chưa chọn sản phẩm nào để yêu cầu báo giá.
        </p>
        <Link
          href="/products"
          className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
        >
          Khám phá sản phẩm
        </Link>
      </main>
    );
  }

  if (status === "success") {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 pt-24">
        <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">
            Gửi yêu cầu thành công!
          </h1>
          <p className="text-gray-600 mb-6">
            Cảm ơn {formData.name}. Chúng tôi đã nhận được danh sách yêu cầu và
            sẽ liên hệ lại với bạn kèm báo giá chi tiết trong vòng 24h.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors"
          >
            Quay về trang chủ
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 pt-24">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            href="/products"
            className="inline-flex items-center text-gray-500 hover:text-primary transition-colors font-medium text-sm"
          >
            <ArrowLeft size={16} className="mr-2" /> Tiếp tục xem sản phẩm
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-primary mt-4">
            Danh sách Yêu cầu Báo giá
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cột trái: Danh sách sản phẩm */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const coverImg =
                item.product.media?.find((m) => m.is_cover)?.file_url ||
                "/placeholder-product.svg";
              return (
                <motion.div
                  layout
                  key={item.product.id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                >
                  <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    <Image
                      src={coverImg}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-primary truncate">
                      {item.product.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Mã SP: {item.product.sku}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden h-10">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(item.product.id, e.target.value)
                        }
                        className="w-16 px-2 h-full outline-none text-center bg-transparent"
                      />
                      <div className="h-full px-3 bg-gray-50 border-l border-gray-300 flex items-center text-sm text-gray-600 font-medium">
                        {item.unit}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Cột phải: Form thông tin */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-xl font-bold text-primary mb-6">
                Thông tin nhận báo giá
              </h2>

              {status === "error" && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
                    placeholder="0901 234 567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
                    placeholder="example@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Ghi chú dự án (Tuỳ chọn)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-accent resize-none"
                    placeholder="VD: Giao hàng tại Thủ Đức, cần có CO/CQ..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-accent text-primary font-bold rounded-lg hover:bg-yellow-500 disabled:opacity-50 transition-colors mt-2"
                >
                  {isLoading ? "Đang gửi yêu cầu..." : "Gửi Yêu Cầu Báo Giá"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
