"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface LeadsResponse {
  total?: number;
  count?: number;
}

async function fetchNewLeadsCount(): Promise<number> {
  const res = await apiClient.get<
    { total?: number; count?: number; items?: unknown[] } | unknown[]
  >("/leads?status=new&limit=1");
  if (Array.isArray(res)) return res.length;
  const obj = res as LeadsResponse;
  return obj.total ?? obj.count ?? 0;
}

export default function LeadsBadge() {
  const { data: count = 0 } = useQuery({
    queryKey: ["leads-new-count"],
    queryFn: fetchNewLeadsCount,
    refetchInterval: 60_000,
  });

  if (!count) return null;

  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
      {count > 99 ? "99+" : count}
    </span>
  );
}
