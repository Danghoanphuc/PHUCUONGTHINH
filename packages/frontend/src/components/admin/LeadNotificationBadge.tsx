"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { apiClient } from "@/lib/admin-api-client";

export function LeadNotificationBadge() {
  const [newLeadsCount, setNewLeadsCount] = useState(0);

  useEffect(() => {
    loadNewLeadsCount();

    // Refresh mỗi 30 giây
    const interval = setInterval(loadNewLeadsCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNewLeadsCount = async () => {
    try {
      const leads = await apiClient.get<any[]>("/leads/status/new");
      setNewLeadsCount(leads.length);
    } catch (error) {
      console.error("Failed to load new leads count:", error);
    }
  };

  if (newLeadsCount === 0) {
    return (
      <Link
        href="/admin/leads"
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
      >
        <Bell size={12} />
        <span className="hidden sm:inline">Leads</span>
      </Link>
    );
  }

  return (
    <Link
      href="/admin/leads"
      className="relative flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
    >
      <Bell size={12} className="animate-pulse" />
      <span className="hidden sm:inline">Leads</span>
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
        {newLeadsCount > 99 ? "99+" : newLeadsCount}
      </span>
    </Link>
  );
}
