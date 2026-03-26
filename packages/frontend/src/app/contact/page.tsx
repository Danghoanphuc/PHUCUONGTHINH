"use client";

import { useSearchParams } from "next/navigation";
import { AppointmentForm } from "@/components/AppointmentForm";
import { CalendarDays, MessageSquare, FileText } from "lucide-react";

export default function ContactPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "general";
  const productId = searchParams.get("product");

  const getTitle = () => {
    switch (type) {
      case "appointment":
        return "Đặt lịch xem mẫu tại Showroom";
      case "quote":
        return "Yêu cầu báo giá";
      default:
        return "Liên hệ với chúng tôi";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "appointment":
        return <CalendarDays className="w-8 h-8 text-emerald-600" />;
      case "quote":
        return <FileText className="w-8 h-8 text-blue-600" />;
      default:
        return <MessageSquare className="w-8 h-8 text-gray-600" />;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 pt-24">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-4 mb-6">
            {getIcon()}
            <h1 className="text-3xl font-black text-gray-900">{getTitle()}</h1>
          </div>

          <p className="text-gray-600 mb-8">
            Vui lòng điền thông tin bên dưới, chúng tôi sẽ liên hệ lại với bạn
            trong thời gian sớm nhất.
          </p>

          <AppointmentForm
            productId={productId || undefined}
            onSuccess={() => {
              // Redirect or show success message
              window.location.href = "/";
            }}
          />
        </div>

        {/* Contact Info */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Thông tin liên hệ
          </h2>
          <div className="space-y-3 text-gray-600">
            <p>
              <strong>Hotline:</strong>{" "}
              <a
                href="tel:0901234567"
                className="text-emerald-600 hover:underline"
              >
                0901 234 567
              </a>
            </p>
            <p>
              <strong>Email:</strong>{" "}
              <a
                href="mailto:info@phucuongthinh.com"
                className="text-emerald-600 hover:underline"
              >
                info@phucuongthinh.com
              </a>
            </p>
            <p>
              <strong>Địa chỉ:</strong> 123 Đường ABC, Quận XYZ, TP.HCM
            </p>
            <p>
              <strong>Giờ làm việc:</strong> 8:00 - 18:00 (Thứ 2 - Thứ 7)
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
