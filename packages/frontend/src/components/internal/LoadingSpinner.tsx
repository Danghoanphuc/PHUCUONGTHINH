"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-5 h-5",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

export default function LoadingSpinner({ size = "md" }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeMap[size]} border-4 border-blue-600 border-t-transparent rounded-full animate-spin`}
      />
    </div>
  );
}
