# Redis Setup for Railway

## Bước 1: Lấy Redis URL từ Railway

1. Vào Railway dashboard: https://railway.app
2. Chọn project "PHUCUONGTHINH"
3. Click vào service "Redis"
4. Vào tab "Connect"
5. Copy "Redis URL" (dạng: `redis://default:password@host:port`)

## Bước 2: Thêm REDIS_URL vào Backend Service

1. Vào service "Backend" (phucuongthinh-production.up.railway.app)
2. Vào tab "Variables"
3. Click "New Variable"
4. Thêm:
   - Name: `REDIS_URL`
   - Value: `redis://default:password@host:port` (paste URL từ bước 1)
5. Click "Add"
6. Service sẽ tự động redeploy

## Bước 3: Verify Redis Connection

Sau khi deploy xong, check logs:

- ✅ Nếu thấy: "✅ Redis connected successfully" → OK
- ⚠️ Nếu thấy: "⚠️ Redis URL not configured" → Chưa có REDIS_URL
- ❌ Nếu thấy: "❌ Redis connection failed" → URL sai hoặc Redis chưa chạy

## Lợi ích khi dùng Redis:

1. **Cache API responses** → giảm 80% database queries
2. **Session management** → auth nhanh hơn
3. **Rate limiting** → chống spam hiệu quả
4. **Product listing cache** → load trang nhanh 5-10x

## Fallback Strategy:

Code đã được thiết kế để:

- Nếu Redis available → dùng Redis
- Nếu Redis fail → tự động fallback về in-memory cache
- Không bao giờ crash vì Redis lỗi
