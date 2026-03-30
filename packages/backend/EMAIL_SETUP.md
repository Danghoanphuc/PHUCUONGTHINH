# Hướng dẫn cấu hình Email Notification

## Tổng quan

Hệ thống tự động gửi email khi có yêu cầu mới từ khách hàng:

- **Email cho Admin**: Thông báo có yêu cầu báo giá/đặt lịch mới
- **Email cho Khách hàng**: Xác nhận đã nhận yêu cầu (nếu khách cung cấp email)

## Cấu hình SMTP

### 1. Thêm biến môi trường vào file `.env`

```env
# Email của admin nhận thông báo
OWNER_EMAIL="admin@phucuongthinh.vn"

# Cấu hình SMTP server
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@phucuongthinh.vn"
```

### 2. Sử dụng Gmail (Khuyến nghị cho development)

#### Bước 1: Bật xác thực 2 bước

1. Truy cập https://myaccount.google.com/security
2. Bật "2-Step Verification"

#### Bước 2: Tạo App Password

1. Truy cập https://myaccount.google.com/apppasswords
2. Chọn "Mail" và "Other (Custom name)"
3. Nhập tên: "Phú Cường Thịnh Backend"
4. Copy mật khẩu 16 ký tự
5. Dán vào `SMTP_PASS` trong file `.env`

#### Cấu hình Gmail:

```env
OWNER_EMAIL="admin@phucuongthinh.vn"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-gmail@gmail.com"
SMTP_PASS="xxxx xxxx xxxx xxxx"  # App password từ bước 2
SMTP_FROM="noreply@phucuongthinh.vn"
```

### 3. Sử dụng dịch vụ SMTP khác

#### SendGrid

```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
```

#### Mailgun

```env
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT="587"
SMTP_USER="postmaster@your-domain.mailgun.org"
SMTP_PASS="your-mailgun-password"
```

#### AWS SES

```env
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT="587"
SMTP_USER="your-ses-smtp-username"
SMTP_PASS="your-ses-smtp-password"
```

## Kiểm tra cấu hình

### 1. Khởi động lại backend

```bash
cd packages/backend
npm run start:dev
```

### 2. Test gửi yêu cầu

- Truy cập trang sản phẩm
- Thêm sản phẩm vào giỏ hàng
- Điền form và gửi yêu cầu báo giá

### 3. Kiểm tra logs

```bash
# Xem logs backend
# Tìm dòng: "Admin notification sent for lead..."
# Hoặc: "Customer confirmation sent to..."
```

### 4. Kiểm tra email

- **Admin**: Kiểm tra inbox của `OWNER_EMAIL`
- **Khách hàng**: Kiểm tra email đã nhập trong form

## Xem danh sách yêu cầu

Admin có thể xem tất cả yêu cầu tại:

```
http://localhost:3001/admin/leads
```

Tính năng:

- Xem danh sách tất cả leads
- Lọc theo trạng thái (new, contacted, converted, lost)
- Xem chi tiết từng lead
- Cập nhật trạng thái
- Xem danh sách sản phẩm khách yêu cầu

## Troubleshooting

### Lỗi: "OWNER_EMAIL not configured"

- Kiểm tra file `.env` có biến `OWNER_EMAIL`
- Khởi động lại backend

### Lỗi: "Invalid login" (Gmail)

- Đảm bảo đã bật 2-Step Verification
- Sử dụng App Password, không phải mật khẩu Gmail thông thường
- Kiểm tra `SMTP_USER` phải là email Gmail đầy đủ

### Lỗi: "Connection timeout"

- Kiểm tra firewall/antivirus có chặn port 587 không
- Thử đổi `SMTP_PORT` sang 465 (SSL) hoặc 25

### Email không gửi nhưng không có lỗi

- Kiểm tra spam folder
- Kiểm tra logs backend: `Failed to send lead notification`
- Verify SMTP credentials

## Production Deployment

### Khuyến nghị

1. **Sử dụng dịch vụ email chuyên nghiệp**: SendGrid, Mailgun, AWS SES
2. **Cấu hình domain email**: Sử dụng email @phucuongthinh.vn thay vì Gmail
3. **Setup SPF, DKIM, DMARC**: Tránh email vào spam
4. **Monitor email delivery**: Theo dõi tỷ lệ gửi thành công

### Ví dụ production với SendGrid

```env
OWNER_EMAIL="admin@phucuongthinh.vn"
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="SG.xxxxxxxxxxxxxxxxxxxxx"
SMTP_FROM="noreply@phucuongthinh.vn"
```

## Tùy chỉnh nội dung email

File: `packages/backend/src/leads/notification.service.ts`

- `buildAdminEmail()`: Nội dung email gửi cho admin
- `buildCustomerEmail()`: Nội dung email xác nhận cho khách

Có thể chỉnh sửa HTML template để phù hợp với brand.
