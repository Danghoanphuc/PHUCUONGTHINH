"use client";

import { useEffect, useRef, useState } from "react";
import { clientCache } from "@/lib/cache-utils";

/**
 * Subscribes to backend SSE stream at /products/events.
 * Calls `onEvent` whenever a product is created, updated, or deleted.
 * If `productId` is provided, only fires when that specific product changes.
 * Auto-reconnects with exponential backoff on disconnect.
 */
export function useProductEvents(onEvent: () => void, productId?: string) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const [isOnline, setIsOnline] = useState(true);
  const onEventRef = useRef(onEvent);

  // Keep onEventRef up to date without triggering reconnection
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => {
      console.log("🌐 Network online, reconnecting SSE...");
      setIsOnline(true);
      reconnectAttemptsRef.current = 0;
      connect();
    };

    const handleOffline = () => {
      console.log("📡 Network offline, pausing SSE...");
      setIsOnline(false);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Get backend URL from environment
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const url = `${backendUrl}/api/v1/products/events`;

    const connect = () => {
      // Don't connect if offline
      if (!navigator.onLine) {
        console.log("📡 Network offline, skipping SSE connection");
        return;
      }

      try {
        // Close existing connection
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        // Create new EventSource - direct connection to backend (bypass Next.js proxy)
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          console.log("✅ SSE connected to product events");
          reconnectAttemptsRef.current = 0; // Reset on successful connection
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("📡 Product event received:", data);

            // Invalidate cache for the affected product
            if (data.productId) {
              clientCache.invalidateProduct(data.productId);
            }

            // If productId filter is set, only trigger for matching product
            if (productId && data.productId !== productId) {
              return;
            }

            // Trigger callback
            onEventRef.current();
          } catch (err) {
            console.error("Failed to parse SSE event:", err);
          }
        };

        eventSource.onerror = (error) => {
          console.error("❌ SSE error:", error);
          eventSource.close();

          // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
          reconnectAttemptsRef.current++;
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current - 1),
            30000,
          );

          console.log(
            `🔄 Reconnecting SSE in ${delay / 1000}s (attempt ${reconnectAttemptsRef.current})...`,
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        };
      } catch (err) {
        console.error("Failed to create EventSource:", err);
      }
    };

    connect();

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [productId]); // Remove onEvent from dependencies
}
