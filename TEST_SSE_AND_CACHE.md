# Test SSE và Cache - Hướng dẫn Debug

## Vấn đề hiện tại

Trang chi tiết sản phẩm chậm cập nhật sau khi edit.

## Đã cải thiện

1. ✅ Giảm cache TTL từ 30s → 5s
2. ✅ Force invalidate cache trước khi load
3. ✅ Thêm console logs để track
4. ✅ SSE đã được setup

## Cách test SSE có hoạt động

### Bước 1: Mở DevTools Console

1. Vào trang `/products/{id}` bất kỳ
2. Mở DevTools (F12) → Console tab
3. Xem logs:
   ```
   ✅ SSE connected to product events
   🔄 Loading product: abc-123
   ❌ Cache miss for product: abc-123
   ✅ Product loaded: Tên sản phẩm Updated at: 2026-03-31...
   ```

### Bước 2: Test Real-time Update

1. Mở 2 tabs:
   - Tab 1: `/products/{id}` (public view)
   - Tab 2: `/admin/products/{id}` (edit)

2. Ở Tab 2 (admin):
   - Sửa tên sản phẩm
   - Click "Lưu"
   - Đợi toast "Đã lưu sản phẩm"

3. Ở Tab 1 (public):
   - Xem console, phải thấy:
     ```
     📡 Product event received: {type: 'updated', productId: 'abc-123'}
     🔄 Product updated, reloading...
     🔄 Loading product: abc-123
     ✅ Product loaded: Tên mới
     ```
   - Trang tự động refresh (không cần F5)

### Bước 3: Kiểm tra Backend SSE

Mở terminal backend:

```bash
cd packages/backend
npm run start:dev
```

Phải thấy log:

```
📡 SSE endpoint: http://localhost:3001/api/v1/products/events
```

### Bước 4: Test SSE Connection trực tiếp

Mở file `test-sse-connection.html` trong browser:

1. Click "Connect"
2. Phải thấy: "✅ Connected to http://localhost:3001/api/v1/products/events"
3. Edit product ở admin
4. Phải thấy event trong test tool

## Troubleshooting

### SSE không connect

**Triệu chứng**: Console không có "✅ SSE connected"

**Giải pháp**:

1. Check backend đang chạy: `http://localhost:3001`
2. Check `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```
3. Check CORS trong backend logs
4. Restart cả frontend và backend

### Cache không invalidate

**Triệu chứng**: Vẫn thấy data cũ sau 5 giây

**Giải pháp**:

1. Hard refresh: Ctrl+Shift+R (hoặc Cmd+Shift+R)
2. Clear browser cache
3. Check console logs:
   - Phải thấy "❌ Cache miss" sau mỗi lần invalidate
   - Nếu thấy "✅ Cache hit" liên tục → cache chưa expire

### SSE event không trigger reload

**Triệu chứng**: Thấy event nhưng trang không reload

**Giải pháp**:

1. Check console có log "🔄 Product updated, reloading..."
2. Check `useProductEvents` hook có được gọi
3. Check productId filter có đúng không

## Cache Strategy hiện tại

### Client-side Cache

- **TTL**: 5 giây
- **Invalidation**: Khi nhận SSE event hoặc manual
- **Key**: `product:{id}`

### Backend Cache

- **TTL**: 5 phút (300s)
- **Invalidation**: Khi update/delete product
- **Key**: `products:{filter_params}`

## Expected Behavior

### Scenario 1: Edit → View (Same User)

1. Edit product → Save
2. Redirect về `/products/{id}`
3. Cache đã bị invalidate
4. Load fresh data ngay lập tức
5. **Thời gian**: < 1s

### Scenario 2: Edit → View (Different Tab)

1. Tab A: View `/products/{id}`
2. Tab B: Edit và save
3. Tab A nhận SSE event
4. Tab A auto-reload
5. **Thời gian**: < 2s

### Scenario 3: F5 Refresh

1. F5 trang `/products/{id}`
2. Nếu cache còn (< 5s): Load từ cache
3. Nếu cache hết: Fetch từ API
4. **Thời gian**: < 500ms (cache) hoặc < 1s (API)

## Monitoring Commands

### Check SSE connections

```bash
# Backend logs
cd packages/backend
npm run start:dev | grep "SSE"
```

### Check cache stats

```bash
# Frontend console
clientCache.getStats()
```

### Force clear cache

```bash
# Frontend console
clientCache.clear()
```

## Next Steps nếu vẫn chậm

1. **Disable cache hoàn toàn** (test only):

   ```typescript
   // In product-service.ts
   async getProductById(id: string): Promise<Product> {
     // Comment out cache logic
     const raw = await apiClient.get<any>(`/products/${id}`);
     return normalizeTags(raw);
   }
   ```

2. **Add manual refresh button**:
   - Thêm button "🔄 Refresh" ở góc trang
   - Click để force reload

3. **Check network tab**:
   - Xem API call có chậm không
   - Check response time
   - Check payload size

4. **Optimize backend query**:
   - Add indexes
   - Reduce includes
   - Use select specific fields
