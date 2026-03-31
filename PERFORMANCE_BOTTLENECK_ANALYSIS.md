# Phân Tích Điểm Nghẽn Performance - Flow Add → Public → Edit/Delete

## 🔴 ĐIỂM NGHẼN NGHIÊM TRỌNG

### 1. **REDIRECT SAU SAVE - CHẬM 3 GIÂY**

**Vị trí:** `packages/frontend/src/components/admin/product-form.tsx` (line ~680-700)

```typescript
setTimeout(() => {
  setToast({ message: "⏳ Đang xử lý media...", type: "success" });
}, 1000);

setTimeout(() => {
  console.log("🔄 Redirecting to product page...");
  setToast({
    message: "✅ Hoàn tất! Đang chuyển trang...",
    type: "success",
  });
  setTimeout(() => {
    window.location.replace(`/products/${productId}`);
  }, 400);
}, 3000); // ⚠️ CHẬM 3 GIÂY!
```

**Vấn đề:**

- Delay cố định 3 giây bất kể media đã xử lý xong hay chưa
- Không có cơ chế kiểm tra trạng thái thực tế
- User phải chờ đợi không cần thiết

**Giải pháp:**

- Polling để check media upload status
- Redirect ngay khi backend confirm xong
- Fallback timeout chỉ khi có lỗi

---

### 2. **MEDIA UPLOAD TUẦN TỰ - KHÔNG PARALLEL**

**Vị trí:** `packages/frontend/src/components/admin/product-form.tsx` (line ~400-450)

```typescript
for (const item of pending) {
  if (!item.file) continue;
  updateItemStatus(item.clientId, { status: "uploading", progress: 0 });
  try {
    const { upload_url, public_url } = await getPresignedUrl(...);
    await uploadFileToS3(upload_url, item.file, ...);
    await createMediaRecord(...);
    // ⚠️ UPLOAD TỪNG FILE MỘT!
  } catch (err) {
    // ...
  }
}
```

**Vấn đề:**

- Upload 5 ảnh = 5 lần chờ tuần tự
- Mỗi ảnh: getPresignedUrl → uploadToS3 → createRecord
- Tổng thời gian = sum(tất cả uploads)

**Giải pháp:**

```typescript
// Upload parallel với Promise.all
const uploadPromises = pending.map(async (item) => {
  const { upload_url, public_url } = await getPresignedUrl(...);
  await uploadFileToS3(upload_url, item.file, ...);
  return createMediaRecord(...);
});

await Promise.all(uploadPromises);
```

---

### 3. **ADMIN EDIT PAGE - LOAD CHẬM DO NHIỀU API CALLS**

**Vị trí:** `packages/frontend/src/app/admin/products/[id]/page.tsx` (line ~30-50)

```typescript
Promise.all([
  productService.getProductById(productId), // API 1
  apiClient.get(`/media/product/${productId}`), // API 2
  categoryService.getCategories(), // API 3
  tagService.getStyles(), // API 4
  tagService.getSpaces(), // API 5
]);
```

**Vấn đề:**

- 5 API calls tuần tự (dù dùng Promise.all)
- Categories, Styles, Spaces load mỗi lần edit
- Không cache static data

**Giải pháp:**

- Cache categories/styles/spaces ở client (localStorage với TTL)
- Chỉ load product + media
- Prefetch categories/styles/spaces ở layout level

---

### 4. **PRODUCT LIST PAGE - KHÔNG CÓ PAGINATION THỰC SỰ**

**Vị trí:** `packages/frontend/src/app/products/page.tsx`

```typescript
const [filters, setFilters] = useState<FilterState>({
  page: 1,
  limit: 20, // ⚠️ Chỉ load 20 items
});
```

**Vấn đề:**

- Mỗi lần filter/search → fetch lại toàn bộ
- Không có infinite scroll
- Không cache previous pages

**Giải pháp:**

- Implement infinite scroll với intersection observer
- Cache previous pages
- Prefetch next page

---

### 5. **SSE CONNECTION - KHÔNG TỰ ĐỘNG RECONNECT HIỆU QUẢ**

**Vị trí:** `packages/frontend/src/hooks/useProductEvents.ts`

```typescript
useEffect(() => {
  const eventSource = new EventSource(url);

  eventSource.onerror = () => {
    console.error("❌ SSE connection error");
    eventSource.close();
    // ⚠️ Không tự động reconnect!
  };
}, []);
```

**Vấn đề:**

- Mất kết nối → không tự động kết nối lại
- Không có exponential backoff
- Không handle network offline/online

**Giải pháp:**

- Implement auto-reconnect với exponential backoff
- Listen network online/offline events
- Fallback to polling khi SSE fail

---

### 6. **BACKEND - N+1 QUERY PROBLEM**

**Vị trí:** `packages/backend/src/products/products.service.ts`

```typescript
const product = await this.prisma.product.findUnique({
  where: { id },
  include: {
    category: true,
    style_tags: {
      include: {
        style: true, // ⚠️ N+1 query cho mỗi style_tag
      },
    },
    space_tags: {
      include: {
        space: true, // ⚠️ N+1 query cho mỗi space_tag
      },
    },
    media: {
      orderBy: { sort_order: "asc" },
    },
  },
});
```

**Vấn đề:**

- Prisma include tạo nhiều queries
- Không optimize với select specific fields
- Load toàn bộ relations dù không cần

**Giải pháp:**

- Sử dụng raw query với JOIN
- Select only needed fields
- Implement DataLoader pattern

---

### 7. **CACHE INVALIDATION - QUÁ AGGRESSIVE**

**Vị trí:** `packages/backend/src/products/services/cache.service.ts`

```typescript
clearProductCaches(productId?: string): number {
  if (productId) {
    // Clear specific product
    const pattern = `products:${productId}:*`;
    // ...
  } else {
    // ⚠️ CLEAR TẤT CẢ CACHE!
    const pattern = 'products:*';
    // ...
  }
}
```

**Vấn đề:**

- Update 1 product → clear toàn bộ filter cache
- Mất cache của products khác
- Performance giảm sau mỗi update

**Giải pháp:**

- Chỉ invalidate cache liên quan
- Tag-based cache invalidation
- Stale-while-revalidate strategy

---

### 8. **FRONTEND - KHÔNG CÓ OPTIMISTIC UPDATES**

**Vị trí:** Toàn bộ admin forms

**Vấn đề:**

- Mọi thao tác đều chờ API response
- UI freeze khi đang save
- Không có feedback ngay lập tức

**Giải pháp:**

```typescript
// Optimistic update
const handleDelete = async (id: string) => {
  // Update UI immediately
  setProducts((prev) => prev.filter((p) => p.id !== id));

  try {
    await productService.deleteProduct(id);
  } catch (err) {
    // Rollback on error
    setProducts((prev) => [...prev, deletedProduct]);
    showError("Xóa thất bại");
  }
};
```

---

### 9. **IMAGE OPTIMIZATION - KHÔNG CÓ LAZY LOADING**

**Vị trí:** Product cards, product detail page

**Vấn đề:**

- Load tất cả ảnh cùng lúc
- Không có blur placeholder
- Không resize ảnh theo viewport

**Giải pháp:**

```typescript
<Image
  src={product.image}
  alt={product.name}
  loading="lazy"
  placeholder="blur"
  blurDataURL={product.blurHash}
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

---

### 10. **FORM VALIDATION - CHẠY MỖI KEYSTROKE**

**Vị trí:** `packages/frontend/src/components/admin/product-form.tsx`

```typescript
onChange={(e) => {
  const name = e.target.value;
  setFormData(prev => ({ ...prev, name, slug: toSlug(name) }));
  // ⚠️ toSlug() chạy mỗi keystroke!
}}
```

**Vấn đề:**

- Validation chạy mỗi keystroke
- toSlug() expensive với Vietnamese
- Re-render không cần thiết

**Giải pháp:**

```typescript
// Debounce validation
const debouncedValidate = useMemo(
  () => debounce((value) => {
    setFormData(prev => ({ ...prev, slug: toSlug(value) }));
  }, 300),
  []
);

onChange={(e) => {
  setFormData(prev => ({ ...prev, name: e.target.value }));
  debouncedValidate(e.target.value);
}}
```

---

## 📊 IMPACT ANALYSIS

| Điểm nghẽn                  | Độ nghiêm trọng | Thời gian tiết kiệm | Độ khó fix |
| --------------------------- | --------------- | ------------------- | ---------- |
| 1. Redirect delay 3s        | 🔴 Critical     | ~2.5s               | Easy       |
| 2. Serial media upload      | 🔴 Critical     | ~70% (5 files)      | Medium     |
| 3. Multiple API calls       | 🟡 High         | ~1-2s               | Medium     |
| 4. No pagination cache      | 🟡 High         | ~500ms              | Medium     |
| 5. SSE reconnect            | 🟡 High         | N/A (reliability)   | Medium     |
| 6. N+1 queries              | 🟠 Medium       | ~200ms              | Hard       |
| 7. Aggressive cache clear   | 🟠 Medium       | ~300ms              | Medium     |
| 8. No optimistic updates    | 🟢 Low          | UX improvement      | Easy       |
| 9. No lazy loading          | 🟢 Low          | ~1s (initial)       | Easy       |
| 10. Validation on keystroke | 🟢 Low          | ~50ms               | Easy       |

---

## 🎯 PRIORITY FIX ORDER

### Phase 1 - Quick Wins (1-2 giờ)

1. ✅ Remove 3s redirect delay → polling-based
2. ✅ Parallel media upload
3. ✅ Debounce form validation
4. ✅ Add lazy loading images

### Phase 2 - Medium Impact (3-4 giờ)

5. ✅ Cache categories/styles/spaces
6. ✅ Implement optimistic updates
7. ✅ Fix SSE auto-reconnect
8. ✅ Smarter cache invalidation

### Phase 3 - Deep Optimization (1-2 ngày)

9. ✅ Fix N+1 queries
10. ✅ Implement infinite scroll
11. ✅ Add service worker for offline
12. ✅ Database indexing optimization

---

## 🚀 EXPECTED RESULTS

**Trước khi fix:**

- Add product → Public: ~5-7 giây
- Edit product → Public: ~4-6 giây
- Upload 5 ảnh: ~15-20 giây
- Load product list: ~2-3 giây

**Sau khi fix Phase 1:**

- Add product → Public: ~2-3 giây ⚡ (-60%)
- Edit product → Public: ~1-2 giây ⚡ (-70%)
- Upload 5 ảnh: ~5-7 giây ⚡ (-65%)
- Load product list: ~1-1.5 giây ⚡ (-40%)

**Sau khi fix Phase 2:**

- Add product → Public: ~1-1.5 giây ⚡ (-80%)
- Edit product → Public: ~0.5-1 giây ⚡ (-85%)
- Upload 5 ảnh: ~4-5 giây ⚡ (-70%)
- Load product list: ~0.5-1 giây ⚡ (-70%)
