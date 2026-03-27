"use client";

import { motion } from "framer-motion";

interface FilterTabsProps {
  activeTab: "inspiration" | "technical";
  onTabChange: (tab: "inspiration" | "technical") => void;
}

export function FilterTabs({ activeTab, onTabChange }: FilterTabsProps) {
  return (
    <div className="flex bg-gray-100 p-1 rounded-lg">
      <button
        onClick={() => onTabChange("inspiration")}
        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
          activeTab === "inspiration"
            ? "text-gray-900 shadow-sm bg-white"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Cảm hứng
      </button>

      <button
        onClick={() => onTabChange("technical")}
        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
          activeTab === "technical"
            ? "text-gray-900 shadow-sm bg-white"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Kỹ thuật
      </button>
    </div>
  );
}
