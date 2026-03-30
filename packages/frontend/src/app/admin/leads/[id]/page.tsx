"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { leadService, Lead } from "@/lib/lead-service-admin";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  converted: "bg-green-100 text-green-800",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Mới",
  contacted: "Đã liên hệ",
  converted: "Đã chuyển đổi",
};
const INQUIRY_LABELS: Record<string, string> = {
  appointment: "Đặt lịch hẹn",
  quote: "Yêu cầu báo giá",
};

export default function AdminLeadDetailPage() {
  const params = useParams();
  const leadId = params.id as string;
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [projectDetails, setProjectDetails] = useState("");

  useEffect(() => {
    leadService
      .getLeadById(leadId)
      .then((data) => {
        setLead(data);
        setProjectDetails(data.project_details || "");
      })
      .catch(() => setError("Không thể tải thông tin khách hàng"))
      .finally(() => setIsLoading(false));
  }, [leadId]);

  const handleStatusChange = async (status: string) => {
    if (!lead) return;
    setIsUpdating(true);
    try {
      const updated = await leadService.updateLeadStatus(
        leadId,
        status as "new" | "contacted" | "converted",
      );
      setLead(updated);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || "Không thể cập nhật trạng thái",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!lead) return;
    setIsUpdating(true);
    try {
      const updated = await leadService.updateLead(leadId, {
        project_details: projectDetails,
      });
      setLead(updated);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || "Không thể cập nhật chi tiết",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <div className="text-center py-8">Đang tải...</div>;
  if (!lead)
    return (
      <div className="text-center py-8 text-red-600">
        {error || "Không tìm thấy khách hàng"}
      </div>
    );

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/leads" className="text-blue-600 hover:text-blue-800">
          ← Quay lại Khách hàng
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">{lead.name}</h1>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Thông tin khách hàng
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Loại yêu cầu
                </label>
                <p className="mt-1">{INQUIRY_LABELS[lead.inquiry_type]}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <p className="mt-1">{lead.email || "Không có"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Số điện thoại
                </label>
                <p className="mt-1">{lead.phone || "Không có"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Ngày tạo
                </label>
                <p className="mt-1">
                  {new Date(lead.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Chi tiết dự án
            </h2>
            <textarea
              value={projectDetails}
              onChange={(e) => setProjectDetails(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Thêm hoặc chỉnh sửa chi tiết dự án..."
            />
            <button
              onClick={handleSaveDetails}
              disabled={isUpdating}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isUpdating ? "Đang lưu..." : "Lưu chi tiết"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 h-fit">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Trạng thái</h2>
          <div className="space-y-2">
            {["new", "contacted", "converted"].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={isUpdating}
                className={`w-full px-4 py-2 rounded text-sm font-medium transition ${
                  lead.status === status
                    ? `${STATUS_COLORS[status]} border-2 border-current`
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } disabled:opacity-50`}
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
          <div className="mt-6 space-y-3 text-sm">
            <div>
              <p className="text-gray-600">Số ngày kể từ khi tạo</p>
              <p className="font-semibold">
                {Math.floor(
                  (Date.now() - new Date(lead.created_at).getTime()) / 86400000,
                )}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Cập nhật lần cuối</p>
              <p>{new Date(lead.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
