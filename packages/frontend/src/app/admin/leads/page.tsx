"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { leadService, Lead } from "@/lib/lead-service-admin";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  converted: "bg-green-100 text-green-800",
};

const INQUIRY_LABELS: Record<string, string> = {
  appointment: "Đặt lịch hẹn",
  quote: "Yêu cầu báo giá",
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    loadLeads();
  }, [page, statusFilter]);

  const loadLeads = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await leadService.getLeads(
        page,
        limit,
        statusFilter || undefined,
      );
      console.log("Leads response:", res);

      // Kiểm tra cấu trúc response
      if (!res || typeof res !== "object") {
        throw new Error("Invalid response format");
      }

      setLeads(res.leads || []);
      setTotal(res.pagination?.total || 0);
    } catch (err: any) {
      console.error("Error loading leads:", err);
      setError(
        err.message ||
          err.response?.data?.error?.message ||
          "Không thể tải leads",
      );
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const updated = await leadService.updateLeadStatus(
        id,
        status as "new" | "contacted" | "converted",
      );
      setLeads(leads.map((l) => (l.id === id ? updated : l)));
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || "Không thể cập nhật trạng thái",
      );
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Khách hàng tiềm năng
      </h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
          {error}
        </div>
      )}

      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="new">Mới</option>
          <option value="contacted">Đã liên hệ</option>
          <option value="converted">Đã chuyển đổi</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : leads.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Không tìm thấy khách hàng
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Tên
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Liên hệ
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Ngày
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {lead.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {lead.email && <p className="text-xs">{lead.email}</p>}
                      {lead.phone && <p className="text-xs">{lead.phone}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {INQUIRY_LABELS[lead.inquiry_type]}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <select
                        value={lead.status}
                        onChange={(e) =>
                          handleStatusChange(lead.id, e.target.value)
                        }
                        className={`px-3 py-1 rounded text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[lead.status]}`}
                      >
                        <option value="new">Mới</option>
                        <option value="contacted">Đã liên hệ</option>
                        <option value="converted">Đã chuyển đổi</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Xem
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Hiển thị {(page - 1) * limit + 1} đến{" "}
              {Math.min(page * limit, total)} trong {total} khách hàng
            </div>
            <div className="space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Trước
              </button>
              <span className="px-4 py-2">
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
