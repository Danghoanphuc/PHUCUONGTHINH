# 🔍 Debug QR Code - Hướng dẫn kiểm tra

## Bước 1: Kiểm tra Console Log

1. Mở trang sản phẩm bất kỳ
2. Mở DevTools (F12) → Console tab
3. Hard refresh: `Ctrl+Shift+R` hoặc `Ctrl+F5`
4. Tìm message: **🎯 QR Code generated for: [SKU]**

### Nếu THẤY message:

✅ Component đang render
✅ QR code đã được tạo
→ Vấn đề là CSS/z-index → Inspect element để xem

### Nếu KHÔNG THẤY message:

❌ Component không render
→ Kiểm tra bước 2

---

## Bước 2: Kiểm tra Sản phẩm có SKU

Mở DevTools → Console, chạy:

```javascript
// Xem product data
console.log(document.querySelector("[data-product-sku]"));

// Hoặc xem trong React DevTools
// Tìm component ProductImageGallery
// Xem props: productSku và productUrl
```

### Nếu SKU = null hoặc undefined:

❌ Sản phẩm không có SKU trong database
→ Cần thêm SKU cho sản phẩm

---

## Bước 3: Inspect Element

1. Click chuột phải vào vùng góc phải trên ảnh
2. Chọn "Inspect" hoặc "Kiểm tra phần tử"
3. Tìm element với class: `absolute top-3 sm:top-4 right-3 sm:right-4 z-30`

### Nếu THẤY element:

✅ QR code đã render
→ Có thể bị ẩn bởi CSS → Kiểm tra:

- `display: none`
- `opacity: 0`
- `visibility: hidden`
- `z-index` bị override

### Nếu KHÔNG THẤY element:

❌ Component không render
→ Quay lại bước 2

---

## Bước 4: Restart Dev Server

Nếu vẫn không thấy, thử:

```bash
# Stop dev server (Ctrl+C)

# Xóa cache
rm -rf packages/frontend/.next

# Chạy lại
pnpm dev:frontend
```

---

## Bước 5: Kiểm tra Network

1. DevTools → Network tab
2. Filter: `qrserver.com`
3. Reload trang
4. Xem có request đến API QR không

### Nếu THẤY request:

✅ API được gọi
→ Kiểm tra response có trả về ảnh không

### Nếu KHÔNG THẤY request:

❌ Component không render hoặc useEffect không chạy

---

## Test nhanh với Console

Chạy trong Console:

```javascript
// Test 1: Kiểm tra component có mount không
const qrElements = document.querySelectorAll('[alt*="QR Code"]');
console.log("QR elements found:", qrElements.length);

// Test 2: Kiểm tra z-index
qrElements.forEach((el) => {
  const parent = el.closest(".z-30");
  console.log("QR parent z-index:", window.getComputedStyle(parent).zIndex);
});

// Test 3: Tạo QR test
const testQR = document.createElement("div");
testQR.style.cssText =
  "position:fixed;top:20px;right:20px;z-index:9999;background:red;width:100px;height:100px;";
testQR.textContent = "TEST QR";
document.body.appendChild(testQR);
// Nếu thấy hộp đỏ → CSS working
// Nếu không thấy → Vấn đề khác
```

---

## Checklist

- [ ] Console có message "🎯 QR Code generated"
- [ ] Sản phẩm có SKU (không null)
- [ ] Inspect thấy element QR code
- [ ] Network có request đến qrserver.com
- [ ] Z-index = 30
- [ ] Không có CSS ẩn element
- [ ] Dev server đã restart
- [ ] Browser đã hard refresh

---

## Nếu vẫn không được

Chụp màn hình:

1. Console log
2. Inspect element (HTML structure)
3. Network tab
4. Computed styles của QR element

Và gửi cho tôi để debug tiếp!
