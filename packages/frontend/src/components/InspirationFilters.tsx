"use client";

import { motion } from "framer-motion";
import { Style, Space } from "@/types";
import { Check } from "lucide-react";

interface InspirationFiltersProps {
  styles: Style[];
  spaces: Space[];
  selectedStyles: string[];
  selectedSpaces: string[];
  onStyleChange: (styleId: string) => void;
  onSpaceChange: (spaceId: string) => void;
}

export function InspirationFilters({
  styles,
  spaces,
  selectedStyles,
  selectedSpaces,
  onStyleChange,
  onSpaceChange,
}: InspirationFiltersProps) {
  return (
    <div className="space-y-5">
      {/* Phong cách */}
      <div>
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">
          Phong cách
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {styles.map((style) => {
            const isSelected = selectedStyles.includes(style.id);
            return (
              <motion.button
                key={style.id}
                onClick={() => onStyleChange(style.id)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-[#0a192f] text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {isSelected && <Check size={12} className="text-emerald-400" />}
                {style.name}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Không gian */}
      <div>
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">
          Không gian
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {spaces.map((space) => {
            const isSelected = selectedSpaces.includes(space.id);
            return (
              <motion.button
                key={space.id}
                onClick={() => onSpaceChange(space.id)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {isSelected && <Check size={12} />}
                {space.name}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
