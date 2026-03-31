"use client";

import { useEffect, useRef } from "react";

/**
 * Smart polling hook for media updates
 * - Polls only when tab is active
 * - Exponential backoff when no changes detected
 * - Stops polling when component unmounts
 */
export function useMediaPolling(
  productId: string | undefined,
  onUpdate: () => void,
  options: {
    enabled?: boolean;
    initialInterval?: number;
    maxInterval?: number;
  } = {},
) {
  const {
    enabled = true,
    initialInterval = 3000, // Start with 3s
    maxInterval = 30000, // Max 30s
  } = options;

  const intervalRef = useRef<number>(initialInterval);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastHashRef = useRef<string>("");
  const isActiveRef = useRef(true);

  useEffect(() => {
    if (!enabled || !productId) return;

    const poll = async () => {
      // Skip if tab is not active
      if (!isActiveRef.current) {
        scheduleNext();
        return;
      }

      try {
        // Fetch media list to check for changes
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/media/product/${productId}`,
        );

        if (!response.ok) {
          scheduleNext();
          return;
        }

        const media = await response.json();
        const currentHash = JSON.stringify(
          media.map((m: any) => ({ id: m.id, sort_order: m.sort_order })),
        );

        if (lastHashRef.current && currentHash !== lastHashRef.current) {
          // Changes detected - reset interval and notify
          console.log("📡 [MediaPolling] Changes detected, reloading...");
          intervalRef.current = initialInterval;
          onUpdate();
        } else if (lastHashRef.current) {
          // No changes - increase interval (exponential backoff)
          intervalRef.current = Math.min(
            intervalRef.current * 1.5,
            maxInterval,
          );
        }

        lastHashRef.current = currentHash;
      } catch (err) {
        console.error("[MediaPolling] Poll failed:", err);
      }

      scheduleNext();
    };

    const scheduleNext = () => {
      timeoutRef.current = setTimeout(poll, intervalRef.current);
    };

    // Handle visibility change
    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden;
      if (isActiveRef.current) {
        // Tab became active - reset interval and poll immediately
        intervalRef.current = initialInterval;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        poll();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Start polling
    poll();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, productId, onUpdate, initialInterval, maxInterval]);
}
