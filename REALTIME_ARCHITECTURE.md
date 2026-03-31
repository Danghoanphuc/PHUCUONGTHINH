# Real-time Architecture - SSE Implementation

## Overview

This document explains the Server-Sent Events (SSE) implementation for real-time product updates in the application.

## Architecture

### Backend (NestJS)

**Location:** `packages/backend/src/products/products-events.service.ts`

The backend emits SSE events when products or media are modified:

```typescript
// Event types
type ProductEvent = {
  type:
    | "product:created"
    | "product:updated"
    | "product:deleted"
    | "media:updated";
  productId: string;
  timestamp: string;
};
```

**Endpoints:**

- `GET /api/v1/products/events` - SSE stream endpoint

**Event Sources:**

1. Product CRUD operations (create, update, delete, publish, unpublish)
2. Media operations (upload, delete, reorder)

**Infrastructure:**

- Rate limiting is disabled for `/events` endpoints (long-lived connections)
- Response buffering is disabled for Cloudflare/nginx compatibility
- Headers: `X-Accel-Buffering: no`, `Cache-Control: no-cache`

### Frontend (Next.js)

**Location:** `packages/frontend/src/hooks/useProductEvents.ts`

Custom React hook that subscribes to SSE stream:

```typescript
useProductEvents(
  onEvent: () => void,  // Callback when event received
  productId?: string    // Optional: filter by specific product
)
```

**Features:**

- Auto-reconnect with exponential backoff (1s → 2s → 4s → ... → 30s max)
- Online/offline detection
- Automatic cleanup on unmount
- Product-specific filtering
- Client-side cache invalidation

## Current Usage

### ✅ Enabled Pages

| Page                   | Purpose         | Reason                                                         |
| ---------------------- | --------------- | -------------------------------------------------------------- |
| `/admin/products/[id]` | Admin edit page | Sync media changes across multiple tabs/windows during editing |

### ❌ Disabled Pages

| Page              | Reason                      | Alternative         |
| ----------------- | --------------------------- | ------------------- |
| `/products`       | Caused infinite reload loop | Manual refresh (F5) |
| `/products/[id]`  | Caused infinite reload loop | Manual refresh (F5) |
| `/admin/products` | Caused infinite reload loop | Manual refresh (F5) |

## The Infinite Loop Problem

### What Happened

Public pages (`/products` and `/products/[id]`) had SSE enabled, creating this cycle:

```
1. Component mounts
   ↓
2. useProductEvents() subscribes to SSE
   ↓
3. SSE event received
   ↓
4. onEvent() callback fires → loadProducts()
   ↓
5. State update → component re-renders
   ↓
6. useEffect dependencies change
   ↓
7. Re-subscribe to SSE (new EventSource)
   ↓
8. Back to step 3 (infinite loop)
```

### Why It Happened

The `useProductEvents` hook was called with `fetchProducts` as the callback:

```typescript
useProductEvents(fetchProducts); // ❌ fetchProducts changes on every render
```

The `fetchProducts` function was recreated on every render due to dependencies:

```typescript
const fetchProducts = useCallback(async () => {
  // ... fetch logic
}, [filters, selectedStyles, selectedSpaces, technicalSpecs]);
```

### Why Admin Edit Page Doesn't Have This Problem

The admin edit page uses a stable callback that only updates media:

```typescript
useProductEvents(() => {
  // Stable arrow function - doesn't change on re-render
  apiClient
    .get(`/media/product/${productId}`)
    .then((media) => setProduct((prev) => ({ ...prev, media })));
}, productId);
```

Key differences:

1. Inline arrow function (stable reference)
2. Only updates media, not entire product
3. Doesn't trigger full page reload
4. `productId` is stable (from URL params)

## Solution Applied

### Immediate Fix

Disabled SSE on public pages by commenting out `useProductEvents()` calls:

```typescript
// DISABLED: SSE causing infinite reload loop
// useProductEvents(fetchProducts);
```

### Why This Works

- Public pages don't need real-time updates
- Users can manually refresh (F5) to see latest changes
- Admin edit page still has real-time media sync for multi-tab editing

## Future Improvements

### Option 1: Fix the Hook (Recommended)

Make `useProductEvents` more resilient to prevent infinite loops:

```typescript
export function useProductEvents(onEvent: () => void, productId?: string) {
  const onEventRef = useRef(onEvent);
  const lastEventTimeRef = useRef(0);
  const DEBOUNCE_MS = 1000; // Prevent rapid-fire events

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    // ... EventSource setup

    eventSource.onmessage = (event) => {
      const now = Date.now();
      if (now - lastEventTimeRef.current < DEBOUNCE_MS) {
        return; // Ignore events within debounce window
      }
      lastEventTimeRef.current = now;

      // ... rest of handler
      onEventRef.current();
    };
  }, [productId]); // Only reconnect when productId changes
}
```

### Option 2: WebSocket with Rooms (Best Long-term)

Replace SSE with Socket.io for better control:

```typescript
// Backend
io.on("connection", (socket) => {
  socket.on("subscribe:product", (productId) => {
    socket.join(`product:${productId}`);
  });
});

// Emit only to specific room
io.to(`product:${productId}`).emit("product:updated", data);

// Frontend
const socket = io(backendUrl);
socket.emit("subscribe:product", productId);
socket.on("product:updated", onEvent);
```

Benefits:

- Bidirectional communication
- Room-based targeting (no broadcast spam)
- Better connection management
- Native reconnection handling
- Lower overhead than SSE

### Option 3: Polling with Smart Intervals

Use polling with adaptive intervals:

```typescript
useEffect(() => {
  let interval = 5000; // Start with 5s

  const poll = async () => {
    const hasChanges = await checkForUpdates();
    if (hasChanges) {
      loadProducts();
      interval = 5000; // Reset to 5s after change
    } else {
      interval = Math.min(interval * 1.5, 30000); // Increase up to 30s
    }
    setTimeout(poll, interval);
  };

  poll();
}, []);
```

## Testing Checklist

After any changes to SSE implementation:

- [ ] Backend logs show no excessive `/events` requests
- [ ] Public product list loads without auto-refresh
- [ ] Public product detail loads without auto-refresh
- [ ] Admin product list loads without auto-refresh
- [ ] Admin edit page syncs media across tabs
- [ ] Manual refresh (F5) shows latest data
- [ ] No memory leaks (EventSource properly closed)
- [ ] Works with Cloudflare proxy
- [ ] Handles offline/online transitions
- [ ] Reconnects after network interruption

## Monitoring

Watch for these issues in production:

1. **High SSE connection count**
   - Check: `netstat -an | grep :3001 | grep ESTABLISHED | wc -l`
   - Expected: ~1 connection per active admin editor
   - Problem: >100 connections = likely infinite loop

2. **Excessive `/events` requests in logs**
   - Check: `grep "/events" logs | wc -l`
   - Expected: Few requests per minute
   - Problem: Hundreds per minute = infinite loop

3. **Client-side memory leaks**
   - Check: Chrome DevTools → Memory → Take heap snapshot
   - Look for: Growing number of EventSource objects
   - Problem: EventSource not being closed on unmount

## References

- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [NestJS SSE Documentation](https://docs.nestjs.com/techniques/server-sent-events)
- [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
