# Implementation Plan: Internal Operations Mode

## Overview

Triển khai Internal Operations Mode theo thứ tự: database schema → backend modules → frontend shell → từng feature tab. Mỗi bước build trên bước trước, kết thúc bằng wiring toàn bộ hệ thống.

Stack: TypeScript (NestJS backend + Next.js 14 frontend), Prisma + SQLite, fast-check cho property tests.

## Tasks

- [x] 1. Mở rộng Prisma schema với 5 model mới
  - Thêm model `ProductInternal` vào `packages/backend/prisma/schema.prisma` với quan hệ 1-1 đến `Product`
  - Thêm model `Warehouse` với các trường: `id`, `name`, `location`, `is_active`
  - Thêm model `StockLevel` với unique constraint `[product_id, warehouse_id]`, quan hệ đến `ProductInternal` và `Warehouse`
  - Thêm model `InventoryRecord` với các trường: `id`, `product_id`, `warehouse_id`, `type`, `quantity`, `note`, `created_by`, `created_at`
  - Thêm model `ContentItem` với các trường: `id`, `title`, `type`, `description`, `is_published`, `images` (JSON string), `created_at`, `updated_at`
  - Thêm relation `productInternal ProductInternal?` vào model `Product` hiện có
  - Chạy `npx prisma migrate dev --name add_internal_ops_models` để tạo migration
  - _Requirements: 3.1, 3.2, 3.3, 6.3, 7.4_

- [x] 2. Backend — InternalProductsModule
  - [x] 2.1 Tạo module, service, controller cho `InternalProductsModule`
    - Tạo file `packages/backend/src/internal-products/internal-products.module.ts`
    - Tạo `internal-products.service.ts` với method `findByProductId(productId)` trả về `ProductInternal` + `StockLevel[]`
    - Tạo `internal-products.service.ts` method `upsert(productId, dto)` để tạo hoặc cập nhật `ProductInternal`
    - Tạo `internal-products.controller.ts` với `GET /products/:id/internal` và `PATCH /products/:id/internal`, cả hai dùng `JwtAuthGuard`
    - Tạo DTOs: `update-internal-product.dto.ts`, `internal-product-response.dto.ts`
    - Đăng ký module vào `app.module.ts`
    - _Requirements: 2.7, 3.5, 3.6_

  - [ ]\* 2.2 Property test: Internal product response đầy đủ các trường (Property 5)
    - Tạo `packages/backend/src/internal-products/internal-products.service.spec.ts`
    - `// Feature: internal-ops-mode, Property 5: Internal product info response đầy đủ các trường`
    - Dùng `fc.record({ cost_price: fc.float(), supplier_name: fc.string(), ... })` để generate random `ProductInternal` data
    - Assert response luôn chứa đủ: `cost_price`, `supplier_name`, `supplier_contact`, `internal_notes`, `stock_levels[]`
    - `{ numRuns: 100 }`
    - _Requirements: 2.4, 3.1, 3.2, 3.5_

  - [ ]\* 2.3 Property test: Protected endpoints trả về 401 khi không có JWT (Property 6)
    - Trong `internal-products.service.spec.ts`, thêm test cho `GET /products/:id/internal` và `PATCH /products/:id/internal`
    - `// Feature: internal-ops-mode, Property 6: Protected endpoints yêu cầu JWT hợp lệ`
    - Dùng `fc.string()` để generate invalid tokens, assert response status = 401
    - `{ numRuns: 100 }`
    - _Requirements: 2.7, 3.6_

- [x] 3. Backend — InventoryModule
  - [x] 3.1 Tạo module, service, controller cho `InventoryModule`
    - Tạo `packages/backend/src/inventory/inventory.module.ts`
    - Tạo `inventory.service.ts` với các methods: `getStock(query)`, `createRecord(dto)`, `getRecordsByProduct(productId)`
    - Logic trong `createRecord`: nếu `type = "out"` và `quantity > current_stock`, throw `BadRequestException("Số lượng xuất vượt quá tồn kho")`
    - Logic trong `createRecord`: sau khi persist `InventoryRecord`, cập nhật `StockLevel` (upsert) trong cùng một Prisma transaction
    - Tạo `inventory.controller.ts` với endpoints: `GET /inventory/stock`, `POST /inventory/records`, `GET /inventory/records/:productId`, `GET /warehouses` — tất cả dùng `JwtAuthGuard`
    - Tạo DTOs: `create-inventory-record.dto.ts`, `stock-query.dto.ts`
    - Đăng ký module vào `app.module.ts`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7, 7.8_

  - [ ]\* 3.2 Property test: Stock level không âm — từ chối xuất kho vượt tồn (Property 7)
    - Tạo `packages/backend/src/inventory/inventory.service.spec.ts`
    - `// Feature: internal-ops-mode, Property 7: Stock level không âm — từ chối xuất kho vượt tồn kho`
    - Dùng `fc.integer({ min: 1, max: 1000 })` cho current stock và `fc.integer({ min: 1, max: 500 })` cho excess
    - Assert: `createRecord({ type: "out", quantity: stock + excess })` throw `BadRequestException`
    - Assert: stock level không thay đổi sau khi bị từ chối
    - `{ numRuns: 100 }`
    - _Requirements: 3.4, 7.3_

  - [ ]\* 3.3 Property test: Nhập kho tăng stock level đúng số lượng (Property 8)
    - Trong `inventory.service.spec.ts`, thêm property test
    - `// Feature: internal-ops-mode, Property 8: Nhập kho tăng stock level đúng số lượng`
    - Dùng `fc.integer({ min: 0, max: 1000 })` cho initial stock và `fc.integer({ min: 1, max: 500 })` cho quantity
    - Assert: stock_level sau = stock_level trước + quantity
    - `{ numRuns: 100 }`
    - _Requirements: 7.2_

  - [ ]\* 3.4 Property test: Inventory records sắp xếp theo thời gian giảm dần (Property 16)
    - Trong `inventory.service.spec.ts`, thêm property test
    - `// Feature: internal-ops-mode, Property 16: Inventory records được sắp xếp theo thời gian giảm dần`
    - Dùng `fc.array(fc.record({ created_at: fc.date() }), { minLength: 2 })` để generate records
    - Assert: với mọi `i`, `records[i].created_at >= records[i+1].created_at`
    - `{ numRuns: 100 }`
    - _Requirements: 7.5_

- [x] 4. Backend — ContentModule
  - [x] 4.1 Tạo module, service, controller cho `ContentModule`
    - Tạo `packages/backend/src/content/content.module.ts`
    - Tạo `content.service.ts` với methods: `findAll(type?)`, `create(dto)`, `update(id, dto)`, `remove(id)`
    - Validation trong `create`: `title`, `type`, và `images` (ít nhất 1 phần tử) là bắt buộc — throw `BadRequestException` nếu thiếu
    - Tạo `content.controller.ts` với endpoints: `GET /content`, `POST /content`, `PATCH /content/:id`, `DELETE /content/:id` — tất cả dùng `JwtAuthGuard`
    - Tạo DTOs: `create-content-item.dto.ts`, `update-content-item.dto.ts`
    - Đăng ký module vào `app.module.ts`
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6_

  - [ ]\* 4.2 Property test: ContentItem validation — trường bắt buộc (Property 12)
    - Tạo `packages/backend/src/content/content.service.spec.ts`
    - `// Feature: internal-ops-mode, Property 12: ContentItem validation — trường bắt buộc`
    - Dùng `fc.record({ title: fc.constant(""), type: fc.string(), images: fc.constant([]) })` để generate invalid data
    - Assert: `create(dto)` throw `BadRequestException` khi thiếu `title`, thiếu `type`, hoặc `images` rỗng
    - `{ numRuns: 100 }`
    - _Requirements: 6.2_

  - [ ]\* 4.3 Property test: ContentItem data persistence round-trip (Property 13)
    - Trong `content.service.spec.ts`, thêm property test
    - `// Feature: internal-ops-mode, Property 13: ContentItem data persistence round-trip`
    - Dùng `fc.record({ title: fc.string({ minLength: 1 }), type: fc.constantFrom("design","project","construction"), ... })` để generate valid data
    - Assert: sau khi `create(dto)`, `findAll()` trả về record với đúng `title`, `type`, `description`, `is_published`, `images`
    - `{ numRuns: 100 }`
    - _Requirements: 6.3_

  - [ ]\* 4.4 Property test: ContentItem CRUD round-trip (Property 15)
    - Trong `content.service.spec.ts`, thêm property test
    - `// Feature: internal-ops-mode, Property 15: ContentItem CRUD round-trip`
    - Assert: sau `update(id, newData)`, `findAll()` trả về data mới; sau `remove(id)`, item không còn tồn tại
    - `{ numRuns: 100 }`
    - _Requirements: 6.6_

  - [ ]\* 4.5 Property test: Publish ContentItem hiển thị trên public endpoint (Property 14)
    - Trong `content.service.spec.ts`, thêm property test
    - `// Feature: internal-ops-mode, Property 14: Publish ContentItem hiển thị trên public endpoint`
    - Assert: khi `is_published = true`, item xuất hiện trong `findAll()` với filter public; khi `is_published = false`, item không xuất hiện
    - `{ numRuns: 100 }`
    - _Requirements: 6.5_

- [x] 5. Backend — NotificationService (mở rộng LeadsModule)
  - [x] 5.1 Tạo `NotificationService` và inject vào `LeadsService`
    - Tạo `packages/backend/src/leads/notification.service.ts`
    - Cài đặt `nodemailer` và `@types/nodemailer` vào `packages/backend`
    - `NotificationService.sendLeadNotification(lead)`: gửi email async đến `OWNER_EMAIL` với nội dung: tên, phone, email, loại yêu cầu, thời gian tạo
    - Lỗi gửi mail → `logger.error(...)`, không throw, không rollback
    - Inject `NotificationService` vào `LeadsService.create()` — gọi fire-and-forget sau khi lead được persist
    - Thêm env vars vào `.env.example`: `OWNER_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]\* 5.2 Property test: Email notification được gửi khi tạo lead (Property 9)
    - Tạo `packages/backend/src/leads/notification.service.spec.ts`
    - `// Feature: internal-ops-mode, Property 9: Email notification được gửi khi tạo lead`
    - Mock `nodemailer.createTransport`, dùng `fc.record({ name: fc.string(), phone: fc.string(), ... })` để generate lead data
    - Assert: `sendLeadNotification` được gọi với recipient = `OWNER_EMAIL` và body chứa đủ các trường
    - `{ numRuns: 100 }`
    - _Requirements: 4.1, 4.3_

  - [ ]\* 5.3 Property test: Lỗi email không rollback việc tạo lead (Property 10)
    - Trong `notification.service.spec.ts`, thêm property test
    - `// Feature: internal-ops-mode, Property 10: Lỗi email không rollback việc tạo lead`
    - Mock `nodemailer` để throw error, dùng `fc.record(...)` để generate lead data
    - Assert: lead vẫn tồn tại trong database sau khi `NotificationService` throw
    - `{ numRuns: 100 }`
    - _Requirements: 4.4_

  - [ ]\* 5.4 Property test: Lead status transition hợp lệ (Property 11)
    - Trong `notification.service.spec.ts` hoặc `leads.service.spec.ts`, thêm property test
    - `// Feature: internal-ops-mode, Property 11: Lead status transition hợp lệ`
    - Dùng `fc.constantFrom("new","contacted","converted","invalid_status")` để generate status values
    - Assert: `new → contacted` và `contacted → converted` được chấp nhận; các transition khác bị từ chối với lỗi validation
    - `{ numRuns: 100 }`
    - _Requirements: 4.7_

- [x] 6. Checkpoint — Backend hoàn chỉnh
  - Đảm bảo tất cả backend tests pass: `cd packages/backend && npx jest --testPathPattern="internal-products|inventory|content|notification" --run`
  - Kiểm tra tất cả endpoints trả về đúng HTTP status codes
  - Hỏi user nếu có vấn đề cần giải quyết trước khi chuyển sang frontend.

- [x] 7. Frontend — InternalShell layout và InternalGuard
  - [x] 7.1 Tạo route group `(internal)` và layout
    - Tạo thư mục `packages/frontend/src/app/(internal)/`
    - Tạo `packages/frontend/src/app/(internal)/layout.tsx` với `InternalGuard` pattern (copy từ `AdminGuard` trong `admin/layout.tsx`)
    - `InternalGuard`: unauthenticated → `router.replace('/admin/login?returnTo=' + encodeURIComponent(pathname))`
    - Layout không render `Header`/`Footer` của public site
    - Layout render `BottomNav` cố định ở đáy, content area có `pb-20` (80px)
    - Wrap với `QueryClientProvider` tương tự `AdminLayout`
    - _Requirements: 1.1, 1.3, 1.4, 1.6, 8.1, 8.2_

  - [ ]\* 7.2 Unit test: InternalGuard redirect behavior (Property 1)
    - Tạo `packages/frontend/src/app/(internal)/layout.spec.tsx`
    - `// Feature: internal-ops-mode, Property 1: Unauthenticated redirect cho mọi internal route`
    - Mock `useAuth` để trả về `{ isAuthenticated: false, isLoading: false }`
    - Dùng `fc.string({ minLength: 1 })` để generate sub-paths dưới `/internal/`
    - Assert: `router.replace` được gọi với `/admin/login?returnTo=/internal/{path}`
    - `{ numRuns: 100 }`
    - _Requirements: 1.3_

- [x] 8. Frontend — BottomNav component
  - [x] 8.1 Tạo `BottomNav` component
    - Tạo `packages/frontend/src/components/internal/BottomNav.tsx`
    - 5 tab theo thứ tự: Kho (`/internal/warehouse`) | Leads (`/internal/leads`) | Home (`/internal/home`) | Catalogue (`/internal/catalogue`) | Quản lý (`/internal/management`)
    - Dùng `usePathname()` để xác định active tab
    - Touch target tối thiểu 44×44px cho mỗi tab (Tailwind: `min-h-[44px] min-w-[44px]`)
    - Tab Leads hiển thị `LeadsBadge` (số leads `status = new`)
    - _Requirements: 1.2, 1.5, 1.7, 1.8_

  - [ ]\* 8.2 Unit test: BottomNav active state theo pathname (Property 2)
    - Tạo `packages/frontend/src/components/internal/BottomNav.spec.tsx`
    - `// Feature: internal-ops-mode, Property 2: BottomNav active state theo pathname`
    - Dùng `fc.constantFrom("/internal/warehouse", "/internal/leads", "/internal/home", "/internal/catalogue", "/internal/management")` để generate pathnames
    - Assert: với mỗi pathname, đúng 1 tab có active class; tab đó có href khớp với pathname
    - `{ numRuns: 100 }`
    - _Requirements: 1.7, 1.8_

- [x] 9. Frontend — Trang Home và QRScanner
  - [x] 9.1 Tạo trang Home và QRScanner component
    - Tạo `packages/frontend/src/app/(internal)/home/page.tsx`
    - Cài đặt `html5-qrcode` vào `packages/frontend`
    - Tạo `packages/frontend/src/components/internal/QRScanner.tsx`
    - Khi decode thành công: parse product ID hoặc SKU từ QR content → gọi `GET /products/sku/{sku}` hoặc navigate đến `/internal/products/{id}`
    - Khi decode thất bại hoặc product không tồn tại: hiển thị toast error trong 2 giây, không navigate
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]\* 9.2 Unit test: QR scan với valid/invalid content (Properties 3 & 4)
    - Tạo `packages/frontend/src/components/internal/QRScanner.spec.tsx`
    - `// Feature: internal-ops-mode, Property 3: QR scan với valid product dẫn đến đúng trang`
    - Dùng `fc.string({ minLength: 1 })` để generate valid product IDs, mock API response thành công
    - Assert: `router.push` được gọi với `/internal/products/{id}`
    - `// Feature: internal-ops-mode, Property 4: QR scan với invalid content hiển thị lỗi`
    - Dùng `fc.string()` để generate invalid QR content, mock API response 404
    - Assert: toast error hiển thị, `router.push` không được gọi
    - `{ numRuns: 100 }`
    - _Requirements: 2.2, 2.3_

- [x] 10. Frontend — Internal Product Detail page
  - [x] 10.1 Tạo trang `/internal/products/[id]` và `InternalProductInfo` component
    - Tạo `packages/frontend/src/app/(internal)/products/[id]/page.tsx`
    - Tạo `packages/frontend/src/components/internal/InternalProductInfo.tsx`
    - Fetch từ `GET /products/{id}/internal` với JWT Bearer token
    - Hiển thị: `cost_price`, `supplier_name`, `supplier_contact`, `internal_notes`, danh sách `stock_levels` theo kho
    - Loading state: spinner trong khi fetch; error state: message tiếng Việt + nút "Thử lại"
    - _Requirements: 2.4, 8.4, 8.5_

  - [x] 10.2 Thêm Internal_Tab vào trang public `/products/[id]`
    - Sửa `packages/frontend/src/app/products/[id]/ProductDetailClient.tsx`
    - Dùng `useAuth()` để kiểm tra `isAuthenticated`
    - Nếu authenticated: thêm tab "Nội bộ" vào tab bar hiện có của trang sản phẩm
    - Khi nhấn tab "Nội bộ": render `InternalProductInfo` component inline (không navigate)
    - _Requirements: 2.5, 2.6_

- [x] 11. Frontend — Leads tab
  - [x] 11.1 Tạo trang Leads và LeadsBadge component
    - Tạo `packages/frontend/src/app/(internal)/leads/page.tsx`
    - Tạo `packages/frontend/src/components/internal/LeadsBadge.tsx`
    - `LeadsBadge`: fetch `GET /leads?status=new&limit=1` để lấy total count, refresh mỗi 60 giây (dùng `useQuery` với `refetchInterval: 60000`)
    - Trang Leads: hiển thị danh sách với tên, phone, loại yêu cầu, trạng thái, thời gian tạo
    - Auto-refresh danh sách mỗi 60 giây
    - Nhấn vào lead: hiển thị chi tiết + dropdown cập nhật status (`new → contacted → converted`)
    - _Requirements: 4.5, 4.6, 4.7, 4.8_

- [x] 12. Frontend — Catalogue tab
  - [x] 12.1 Tạo trang Catalogue với product list, add/edit form và PDF import
    - Tạo `packages/frontend/src/app/(internal)/catalogue/page.tsx`
    - Hiển thị danh sách sản phẩm với search theo tên và SKU (reuse `GET /products` endpoint hiện có)
    - Form tạo sản phẩm mới: trường bắt buộc `name`, `sku`, `category_id`; hiển thị lỗi "SKU đã tồn tại" khi API trả về 409
    - Form edit sản phẩm: bao gồm cả `InternalProductInfo` fields (`cost_price`, `supplier_name`, `supplier_contact`, `internal_notes`)
    - Nút "Import PDF": reuse `ImportJob` flow hiện có — upload file, hiển thị progress, xem extracted products để confirm
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 13. Frontend — Warehouse tab (Kho)
  - [x] 13.1 Tạo trang Warehouse với stock levels và inventory records
    - Tạo `packages/frontend/src/app/(internal)/warehouse/page.tsx`
    - Fetch `GET /inventory/stock` để hiển thị danh sách sản phẩm với stock level, có thể filter theo warehouse
    - Search theo tên/SKU: debounce 300ms để đảm bảo kết quả trong 500ms
    - Form tạo `InventoryRecord`: chọn sản phẩm, warehouse, type (in/out/adjustment), quantity, note
    - Hiển thị lỗi "Số lượng xuất vượt quá tồn kho" khi API trả về 400
    - Lịch sử records: fetch `GET /inventory/records/:productId`, hiển thị theo thứ tự thời gian giảm dần
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6_

- [x] 14. Frontend — Management tab (Quản lý nội dung)
  - [x] 14.1 Tạo trang Management với ContentItem CRUD
    - Tạo `packages/frontend/src/app/(internal)/management/page.tsx`
    - Hiển thị danh sách `ContentItem` với filter theo type: thiết kế | công trình | dự án
    - Form tạo/edit: trường bắt buộc `title`, `type`; upload ảnh (JPEG/PNG/WebP, tối đa 10MB mỗi file, validate client-side)
    - Toggle `is_published` trực tiếp từ danh sách
    - Nút xóa với confirm dialog
    - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.6_

- [x] 15. Frontend — Mobile UX và error handling
  - [x] 15.1 Đảm bảo mobile-first UX trên toàn bộ Internal App
    - Kiểm tra tất cả input fields có `text-base` (16px) để tránh auto-zoom trên iOS
    - Kiểm tra tất cả nội dung có `text-sm` (14px) tối thiểu
    - Tạo `packages/frontend/src/components/internal/LoadingSpinner.tsx` — reuse trong tất cả async operations
    - Tạo `packages/frontend/src/components/internal/ErrorMessage.tsx` — hiển thị message tiếng Việt + nút "Thử lại"
    - _Requirements: 8.3, 8.4, 8.5, 8.6_

  - [ ]\* 15.2 Property test: Loading state hiển thị trong async operations (Property 17)
    - Tạo test trong layout hoặc một component async bất kỳ
    - `// Feature: internal-ops-mode, Property 17: Loading state hiển thị trong async operations`
    - Mock API call với delay, dùng `fc.boolean()` để generate loading states
    - Assert: component render loading indicator trong khoảng thời gian từ khi call bắt đầu đến khi nhận response
    - `{ numRuns: 100 }`
    - _Requirements: 8.4_

  - [ ]\* 15.3 Property test: API error hiển thị thông báo tiếng Việt và nút thử lại (Property 18)
    - `// Feature: internal-ops-mode, Property 18: API error hiển thị thông báo tiếng Việt và nút thử lại`
    - Dùng `fc.constantFrom(400, 401, 403, 404, 500)` để generate error status codes
    - Assert: `ErrorMessage` component render text tiếng Việt và button "Thử lại"
    - `{ numRuns: 100 }`
    - _Requirements: 8.5_

- [x] 16. Checkpoint cuối — Tích hợp và kiểm tra toàn bộ
  - Đảm bảo tất cả tests pass (backend + frontend)
  - Kiểm tra route `/internal` redirect đúng đến `/internal/home`
  - Kiểm tra `InternalShell` không render Header/Footer của public site
  - Kiểm tra `PublicShell` vẫn hoạt động bình thường trên các trang public
  - Hỏi user nếu có vấn đề cần giải quyết.

## Notes

- Tasks đánh dấu `*` là optional, có thể bỏ qua để MVP nhanh hơn
- Thứ tự thực hiện: DB schema (1) → Backend modules (2-5) → Frontend shell (7-8) → Feature tabs (9-14) → Polish (15)
- Property tests dùng `fast-check` với `{ numRuns: 100 }` cho mỗi property
- Mỗi property test được tag với comment `// Feature: internal-ops-mode, Property N: ...`
- Backend tests chạy với Jest; Frontend tests chạy với Vitest hoặc Jest tùy config hiện có
- `InternalProductInfo` component được dùng ở cả `/internal/products/[id]` và tab "Nội bộ" trên `/products/[id]` public
