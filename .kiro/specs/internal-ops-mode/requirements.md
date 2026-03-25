# Requirements Document

## Introduction

Internal Operations Mode là một ứng dụng nội bộ mobile-first dành cho nhân viên Phú Cường Thịnh — công ty vật liệu xây dựng B2B (gạch, thiết bị vệ sinh). Ứng dụng nằm tại route `/internal` với bottom navigation bar 5 tab, cho phép nhân viên showroom tra cứu thông tin nội bộ sản phẩm qua QR, theo dõi leads realtime, quản lý catalogue, quản lý nội dung (thiết kế/công trình/dự án), và quản lý kho vận — tất cả được tối ưu cho thiết bị di động.

Hệ thống hiện có: Next.js 14 frontend, NestJS backend, Prisma + SQLite, JWT auth với role `admin`. Các trang `/admin/*` đã tồn tại và sẽ được giữ nguyên. Internal mode là một shell mới song song, không thay thế admin.

## Glossary

- **Internal_App**: Ứng dụng nội bộ tại route `/internal`, dành cho nhân viên đã xác thực
- **Internal_Shell**: Layout wrapper của Internal_App với bottom navigation bar 5 tab
- **Bottom_Nav**: Thanh điều hướng cố định ở đáy màn hình với 5 tab: Kho | Leads | Home | Catalogue | Quản lý
- **Internal_Tab**: Tab "Nội bộ" xuất hiện trên trang chi tiết sản phẩm public khi nhân viên đã đăng nhập
- **Internal_Product_Info**: Thông tin nội bộ của sản phẩm: tồn kho, giá nhập, nhà cung cấp, ghi chú nội bộ
- **QR_Scanner**: Tính năng quét mã QR trên thiết bị di động để điều hướng đến trang sản phẩm
- **Lead**: Thông tin khách hàng tiềm năng từ form liên hệ trên web public
- **Lead_Notification**: Email thông báo tức thì gửi cho chủ khi có lead mới
- **Catalogue**: Danh mục sản phẩm, bao gồm thêm/sửa sản phẩm và import PDF từ nhà cung cấp
- **Content_Item**: Bài đăng nội dung: thiết kế, công trình, hoặc dự án
- **Inventory_Record**: Bản ghi xuất/nhập kho cho một sản phẩm tại một thời điểm
- **Warehouse**: Kho bãi vật lý được quản lý trong hệ thống
- **Auth_Guard**: Middleware kiểm tra JWT token và role trước khi cho phép truy cập `/internal`
- **Notification_Service**: Service backend gửi email thông báo khi có lead mới
- **Stock_Level**: Số lượng tồn kho hiện tại của một sản phẩm tại một kho

---

## Requirements

### Requirement 1: Internal App Shell và Điều hướng

**User Story:** As a nhân viên, I want một ứng dụng nội bộ riêng biệt tại `/internal` với bottom navigation bar, so that tôi có thể điều hướng nhanh giữa các chức năng trên điện thoại.

#### Acceptance Criteria

1. THE Internal_Shell SHALL render tại route `/internal` và tất cả các sub-route `/internal/*`
2. THE Internal_Shell SHALL hiển thị Bottom_Nav cố định ở đáy màn hình với 5 tab theo thứ tự: Kho | Leads | Home | Catalogue | Quản lý
3. WHEN người dùng chưa xác thực truy cập bất kỳ route `/internal/*`, THE Auth_Guard SHALL chuyển hướng đến `/admin/login?returnTo=/internal`
4. WHEN người dùng đã xác thực với role `admin` truy cập `/internal`, THE Internal_Shell SHALL hiển thị tab Home được chọn mặc định
5. THE Bottom_Nav SHALL có touch target tối thiểu 44×44px cho mỗi tab
6. THE Internal_Shell SHALL không hiển thị Header và Footer của public site
7. WHEN người dùng nhấn một tab trong Bottom_Nav, THE Internal_Shell SHALL điều hướng đến route tương ứng mà không reload trang
8. THE Bottom_Nav SHALL highlight tab đang active dựa trên pathname hiện tại

---

### Requirement 2: QR Scan → Thông tin nội bộ sản phẩm

**User Story:** As a nhân viên showroom, I want quét mã QR của sản phẩm bằng điện thoại, so that tôi có thể xem ngay thông tin nội bộ (tồn kho, giá nhập, nhà cung cấp) để tư vấn khách hoặc kiểm tra hàng.

#### Acceptance Criteria

1. THE Internal_App SHALL cung cấp tính năng QR_Scanner tại tab Home hoặc tab Kho
2. WHEN QR_Scanner đọc được mã QR chứa product ID hoặc SKU hợp lệ, THE Internal_App SHALL điều hướng đến trang chi tiết sản phẩm nội bộ tại `/internal/products/{id}`
3. WHEN QR_Scanner đọc được mã QR không hợp lệ hoặc không tìm thấy sản phẩm, THE Internal_App SHALL hiển thị thông báo lỗi rõ ràng trong vòng 2 giây
4. THE Internal_App SHALL hiển thị Internal_Product_Info tại `/internal/products/{id}` bao gồm: tồn kho theo kho, giá nhập, tên nhà cung cấp, và ghi chú nội bộ
5. WHEN nhân viên truy cập trang chi tiết sản phẩm public `/products/{id}` trong khi đã đăng nhập, THE Internal_Tab SHALL xuất hiện như một tab bổ sung trong tab bar của trang sản phẩm
6. WHEN nhân viên nhấn Internal_Tab trên trang public, THE Internal_Tab SHALL hiển thị Internal_Product_Info mà không chuyển trang
7. THE Backend SHALL bảo vệ endpoint trả về Internal_Product_Info bằng JWT auth guard, chỉ cho phép role `admin`

---

### Requirement 3: Internal Product Info — Schema mở rộng

**User Story:** As a quản trị viên, I want lưu trữ thông tin nội bộ cho từng sản phẩm, so that nhân viên có thể tra cứu tồn kho, giá nhập và nhà cung cấp chính xác.

#### Acceptance Criteria

1. THE System SHALL lưu trữ Internal_Product_Info với các trường: `cost_price` (giá nhập, số thực), `supplier_name` (tên nhà cung cấp), `supplier_contact` (thông tin liên hệ nhà cung cấp), `internal_notes` (ghi chú nội bộ, text)
2. THE System SHALL lưu trữ Stock_Level theo từng Warehouse với các trường: `product_id`, `warehouse_id`, `quantity` (số nguyên không âm), `updated_at`
3. THE System SHALL lưu trữ Warehouse với các trường: `id`, `name`, `location`, `is_active`
4. WHEN `quantity` của một Stock_Level được cập nhật thành giá trị âm, THE System SHALL từ chối thao tác và trả về lỗi validation
5. THE Backend SHALL cung cấp API endpoint `GET /products/{id}/internal` trả về Internal_Product_Info và danh sách Stock_Level theo kho
6. THE Backend SHALL cung cấp API endpoint `PATCH /products/{id}/internal` để cập nhật Internal_Product_Info, yêu cầu role `admin`

---

### Requirement 4: Leads Realtime

**User Story:** As a chủ doanh nghiệp, I want nhận thông báo email ngay khi có lead mới từ web, so that tôi có thể phản hồi khách hàng kịp thời.

#### Acceptance Criteria

1. WHEN một Lead mới được tạo qua form public, THE Notification_Service SHALL gửi email thông báo đến địa chỉ email được cấu hình trong biến môi trường `OWNER_EMAIL`
2. THE Notification_Service SHALL gửi email trong vòng 30 giây kể từ khi Lead được tạo thành công trong database
3. THE email thông báo SHALL chứa: tên khách hàng, số điện thoại, email, loại yêu cầu, và thời gian tạo lead
4. IF Notification_Service gặp lỗi khi gửi email, THEN THE System SHALL ghi log lỗi và KHÔNG rollback việc tạo Lead
5. THE Internal_App SHALL hiển thị danh sách Leads tại tab Leads với thông tin: tên, số điện thoại, loại yêu cầu, trạng thái, thời gian tạo
6. THE Internal_App SHALL hiển thị số lượng leads mới (status = `new`) dưới dạng badge trên tab Leads trong Bottom_Nav
7. WHEN nhân viên nhấn vào một Lead trong danh sách, THE Internal_App SHALL hiển thị chi tiết Lead và cho phép cập nhật trạng thái (new → contacted → converted)
8. WHEN nhân viên mở tab Leads, THE Internal_App SHALL tự động làm mới danh sách leads mỗi 60 giây

---

### Requirement 5: Catalogue Management

**User Story:** As a quản trị viên, I want thêm, sửa sản phẩm và import PDF catalogue từ nhà cung cấp ngay trên điện thoại, so that tôi có thể cập nhật catalogue nhanh chóng.

#### Acceptance Criteria

1. THE Internal_App SHALL cung cấp giao diện tại tab Catalogue để xem danh sách sản phẩm với tìm kiếm theo tên và SKU
2. WHEN quản trị viên nhấn "Thêm sản phẩm" tại tab Catalogue, THE Internal_App SHALL hiển thị form tạo sản phẩm mới với các trường bắt buộc: tên, SKU, danh mục
3. WHEN quản trị viên submit form tạo sản phẩm với SKU đã tồn tại, THE Internal_App SHALL hiển thị thông báo lỗi "SKU đã tồn tại" mà không tạo bản ghi mới
4. WHEN quản trị viên nhấn vào một sản phẩm trong danh sách, THE Internal_App SHALL cho phép chỉnh sửa thông tin sản phẩm bao gồm Internal_Product_Info
5. THE Internal_App SHALL cung cấp nút "Import PDF" tại tab Catalogue để upload file PDF catalogue từ nhà cung cấp
6. WHEN quản trị viên upload một file PDF hợp lệ, THE Internal_App SHALL tạo một ImportJob và hiển thị tiến trình xử lý
7. WHEN ImportJob hoàn thành, THE Internal_App SHALL hiển thị danh sách sản phẩm được trích xuất để quản trị viên xem xét và xác nhận trước khi lưu vào catalogue

---

### Requirement 6: Content Management

**User Story:** As a quản trị viên, I want đăng và quản lý nội dung thiết kế, công trình, dự án trên điện thoại, so that tôi có thể cập nhật website nhanh chóng từ hiện trường.

#### Acceptance Criteria

1. THE Internal_App SHALL cung cấp giao diện tại tab Quản lý để xem danh sách Content_Item theo loại: thiết kế, công trình, dự án
2. WHEN quản trị viên tạo một Content_Item mới, THE System SHALL yêu cầu các trường bắt buộc: tiêu đề, loại (design/project/construction), và ít nhất một ảnh
3. THE System SHALL lưu trữ Content_Item với các trường: `id`, `title`, `type` (design | project | construction), `description`, `is_published`, `created_at`, `updated_at`
4. WHEN quản trị viên upload ảnh cho Content_Item từ thiết bị di động, THE System SHALL chấp nhận định dạng JPEG, PNG, WebP với kích thước tối đa 10MB mỗi file
5. WHEN quản trị viên đặt `is_published = true` cho một Content_Item, THE System SHALL hiển thị Content_Item đó trên trang public tương ứng
6. THE Internal_App SHALL cho phép quản trị viên chỉnh sửa và xóa Content_Item đã tạo

---

### Requirement 7: Quản lý Kho vận

**User Story:** As a nhân viên kho, I want ghi nhận xuất nhập kho và xem tồn kho hiện tại trên điện thoại, so that tôi có thể theo dõi hàng hóa chính xác và nhanh chóng.

#### Acceptance Criteria

1. THE Internal_App SHALL hiển thị danh sách sản phẩm với Stock_Level hiện tại tại tab Kho, có thể lọc theo Warehouse
2. WHEN nhân viên kho tạo một Inventory_Record nhập kho (type = `in`), THE System SHALL tăng Stock_Level của sản phẩm tại kho tương ứng theo số lượng nhập
3. WHEN nhân viên kho tạo một Inventory_Record xuất kho (type = `out`) với số lượng lớn hơn Stock_Level hiện tại, THE System SHALL từ chối thao tác và trả về lỗi "Số lượng xuất vượt quá tồn kho"
4. THE System SHALL lưu trữ Inventory_Record với các trường: `id`, `product_id`, `warehouse_id`, `type` (in | out | adjustment), `quantity`, `note`, `created_by`, `created_at`
5. THE Internal_App SHALL hiển thị lịch sử Inventory_Record của một sản phẩm theo thứ tự thời gian giảm dần
6. WHEN nhân viên kho tìm kiếm sản phẩm theo tên hoặc SKU tại tab Kho, THE Internal_App SHALL hiển thị kết quả trong vòng 500ms
7. THE Backend SHALL cung cấp API endpoint `GET /inventory/stock` trả về tổng hợp Stock_Level theo sản phẩm và kho, yêu cầu role `admin`
8. THE Backend SHALL cung cấp API endpoint `POST /inventory/records` để tạo Inventory_Record mới, yêu cầu role `admin`

---

### Requirement 8: Mobile-First UX

**User Story:** As a nhân viên, I want giao diện nội bộ được tối ưu cho điện thoại, so that tôi có thể sử dụng thoải mái khi đứng ở kho hoặc showroom.

#### Acceptance Criteria

1. THE Internal_Shell SHALL có viewport meta tag `width=device-width, initial-scale=1` và không cho phép user-scale
2. THE Internal_App SHALL dành padding-bottom tối thiểu 80px cho nội dung chính để không bị Bottom_Nav che khuất
3. THE Internal_App SHALL sử dụng font size tối thiểu 14px cho nội dung và 16px cho input fields để tránh auto-zoom trên iOS
4. WHILE người dùng đang thực hiện thao tác async (gọi API), THE Internal_App SHALL hiển thị loading indicator rõ ràng
5. IF một API call thất bại, THEN THE Internal_App SHALL hiển thị thông báo lỗi bằng tiếng Việt và cung cấp nút "Thử lại"
6. THE Internal_App SHALL hoạt động đúng trên các trình duyệt mobile: Chrome Android 90+, Safari iOS 14+
