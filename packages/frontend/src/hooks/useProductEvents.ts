"use client";

import { useEffect, useRef } from "react";
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
  const onEventRef = useRef(onEvent);

  // Keep onEventRef up to date without triggering reconnection
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const url = `${backendUrl}/api/v1/products/events`;

    const connect = () => {
      if (!navigator.onLine) return;

      try {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          reconnectAttemptsRef.current = 0;
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.productId) {
              clientCache.invalidateProduct(data.productId);
            }

            if (productId && data.productId !== productId) {
              return;
            }

            onEventRef.current();
          } catch (err) {
            console.error("Failed to parse SSE event:", err);
          }
        };

        eventSource.onerror = () => {
          eventSource.close();

          reconnectAttemptsRef.current++;
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current - 1),
            30000,
          );

          reconnectTimeoutRef.current = setTimeout(connect, delay);
        };
      } catch (err) {
        console.error("Failed to create EventSource:", err);
      }
    };

    const handleOnline = () => {
      reconnectAttemptsRef.current = 0;
      connect();
    };

    const handleOffline = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    connect();

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
  }, [productId]);
}
