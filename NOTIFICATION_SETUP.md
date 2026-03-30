# Hướng dẫn nhận thông báo Leads

## 2 cách nhận thông báo khi khách gửi yêu cầu:

### 1. 🔔 Thông báo trong Admin UI (Đã hoạt động)

**Vị trí:** Admin toolbar (thanh đen phía trên)

**Tính năng:**

- Icon chuông (Bell) với badge đỏ hiển thị số lượng leads mới
- Tự động refresh mỗi 30 giây
- Click vào để xem danh sách leads

**Cách xem:**

1. Đăng nhập admin: `http://localhost:3001/admin/login`
2. Nhìn lên thanh admin toolbar (màu đen)
3. Thấy icon 🔔 với số đỏ = có leads mới
4. Click vào để xem chi tiết

---

### 2. 📧 Email Notification (Cần cấu hình)

**Hiện trạng:** Chưa cấu hình SMTP

**Để kích hoạt email:**

#### Bước 1: Cấu hình Gmail (Khuyến nghị)

1. **Bật xác thực 2 bước:**
   - Truy cập: https://myaccount.google.com/security
   - Bật "2-Step Verification"

2. **Tạo App Password:**
   - Truy cập: https://myaccount.google.com/apppasswords
   - Chọn "Mail" và "Other (Custom name)"
   - Nhập tên: "Phú Cường Thịnh"
   - Copy mật khẩu 16 ký tự

3. **Cập nhật file `.env`:**

   ```env
   # Trong packages/backend/.env
   OWNER_EMAIL="admin@phucuongthinh.vn"  # Email nhận thông báo
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-gmail@gmail.com"      # Gmail của bạn
   SMTP_PASS="xxxx xxxx xxxx xxxx"       # App password từ bước 2
   SMTP_FROM="noreply@phucuongthinh.vn"
   ```

4. **Khởi động lại backend:**
   ```bash
   cd packages/backend
   npm run start:dev
   ```

#### Bước 2: Test

1. Vào trang sản phẩm
2. Thêm sản phẩm vào giỏ
3. Gửi yêu cầu báo giá
4. Kiểm tra:
   - Email admin (OWNER_EMAIL) nhận thông báo
   - Email khách hàng nhận xác nhận (nếu họ nhập email)

---

## Nội dung Email

### Email cho Admin:

- Tiêu đề: "🔔 Yêu cầu mới: Báo giá - [Tên khách]"
- Nội dung:
  - Thông tin khách hàng (tên, SĐT, email)
  - Loại yêu cầu (báo giá/đặt lịch)
  - Danh sách sản phẩm chi tiết
  - Ghi chú của khách

### Email cho Khách hàng:

- Tiêu đề: "Xác nhận yêu cầu báo giá - Phú Cường Thịnh"
- Nội dung:
  - Xác nhận đã nhận yêu cầu
  - Cam kết liên hệ trong 24h
  - Thông tin liên hệ hotline/Zalo

---

## Xem Leads trong Admin

**URL:** `http://localhost:3001/admin/leads`

**Tính năng:**

- Xem tất cả leads (mới, đã liên hệ, đã chuyển đổi)
- Lọc theo trạng thái
- Xem chi tiết từng lead
- Cập nhật trạng thái
- Xem danh sách sản phẩm khách yêu cầu

---

## Troubleshooting

### Không thấy badge thông báo?

- Kiểm tra đã đăng nhập admin chưa
- Refresh trang (F5)
- Kiểm tra console browser có lỗi không

### Email không gửi?

- Kiểm tra file `.env` đã cấu hình đúng
- Kiểm tra logs backend: tìm "Admin notification sent"
- Kiểm tra spam folder
- Xem chi tiết: `packages/backend/EMAIL_SETUP.md`

### Badge hiển thị sai số lượng?

- Đợi 30 giây (auto refresh)
- Hoặc refresh trang

---

## Tóm tắt

✅ **Đã hoạt động:**

- Thông báo UI trong admin (badge đỏ)
- Lưu leads vào database
- Trang quản lý leads

⏳ **Cần cấu hình:**

- Email notification (cấu hình SMTP trong `.env`)

📖 **Tài liệu chi tiết:**

- Email setup: `packages/backend/EMAIL_SETUP.md`
