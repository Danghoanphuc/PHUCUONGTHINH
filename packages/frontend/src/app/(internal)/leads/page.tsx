"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  inquiry_type: string;
  project_details: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface LeadsResponse {
  leads: Lead[];
  pagination: { total: number; page: number; limit: number };
}

const STATUS_LABEL: Record<string, string> = {
  new: "Mới",
  contacted: "Đã liên hệ",
  converted: "Đã chốt",
};

const STATUS_COLOR: Record<string, string> = {
  new: "bg-red-100 text-red-700",
  contacted: "bg-yellow-100 text-yellow-700",
  converted: "bg-green-100 text-green-700",
};

const NEXT_STATUS: Record<string, string[]> = {
  new: ["contacted"],
  contacted: ["converted"],
  converted: [],
};

async function fetchLeads(): Promise<LeadsResponse> {
  const res = await apiClient.get<LeadsResponse>("/leads?status=new&limit=50");
  return res;
}

async function updateLeadStatus(id: string, status: string): Promise<void> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const res = await fetch(API_URL + `/leads/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || "HTTP " + res.status);
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Record<string, string>>(
    {},
  );

  const { data, isLoading, isError } = useQuery<LeadsResponse>({
    queryKey: ["leads"],
    queryFn: fetchLeads,
    refetchInterval: 60_000,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateLeadStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads-new-count"] });
    },
  });

  const leads = data?.leads ?? [];

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function handleStatusChange(leadId: string, value: string) {
    setSelectedStatus((prev) => ({ ...prev, [leadId]: value }));
  }

  function handleUpdate(lead: Lead) {
    const newStatus = selectedStatus[lead.id];
    if (!newStatus || newStatus === lead.status) return;
    mutation.mutate({ id: lead.id, status: newStatus });
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Leads</h1>
      <p className="text-sm text-gray-500 mb-4">
        Danh sách khách hàng tiềm năng — tự động cập nhật mỗi 60 giây
      </p>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <p className="text-center text-red-500 py-8">
          Không thể tải danh sách leads.
        </p>
      )}

      {!isLoading && !isError && leads.length === 0 && (
        <p className="text-center text-gray-400 py-8">Chưa có lead nào.</p>
      )}

      <div className="space-y-3">
        {leads.map((lead) => {
          const isExpanded = expandedId === lead.id;
          const nextOptions = NEXT_STATUS[lead.status] ?? [];
          const currentSelected =
            selectedStatus[lead.id] ?? nextOptions[0] ?? lead.status;

          return (
            <div
              key={lead.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Row */}
              <button
                className="w-full text-left px-4 py-3 flex items-center gap-3"
                onClick={() => toggleExpand(lead.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {lead.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {lead.phone ?? "—"} · {lead.inquiry_type}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[lead.status] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {STATUS_LABEL[lead.status] ?? lead.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(lead.created_at)}
                  </span>
                </div>
                <span className="text-gray-400 ml-1">
                  {isExpanded ? "▲" : "▼"}
                </span>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 space-y-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Tên:</span>{" "}
                      <span className="font-medium text-gray-800">
                        {lead.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>{" "}
                      <span className="font-medium text-gray-800">
                        {lead.phone ?? "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>{" "}
                      <span className="font-medium text-gray-800">
                        {lead.email ?? "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Loại yêu cầu:</span>{" "}
                      <span className="font-medium text-gray-800">
                        {lead.inquiry_type}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Chi tiết dự án:</span>{" "}
                      <span className="font-medium text-gray-800">
                        {lead.project_details ?? "—"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Thời gian tạo:</span>{" "}
                      <span className="font-medium text-gray-800">
                        {formatDate(lead.created_at)}
                      </span>
                    </div>
                  </div>

                  {nextOptions.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <select
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={currentSelected}
                        onChange={(e) =>
                          handleStatusChange(lead.id, e.target.value)
                        }
                      >
                        {nextOptions.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s] ?? s}
                          </option>
                        ))}
                      </select>
                      <button
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                        disabled={mutation.isPending}
                        onClick={() => handleUpdate(lead)}
                      >
                        {mutation.isPending ? "Đang lưu..." : "Cập nhật"}
                      </button>
                    </div>
                  )}

                  {nextOptions.length === 0 && (
                    <p className="text-xs text-gray-400 italic">
                      Đã hoàn tất — không còn trạng thái tiếp theo.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
