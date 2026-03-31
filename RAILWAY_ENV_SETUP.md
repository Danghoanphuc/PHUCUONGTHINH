# Railway Environment Variables Setup

## Vấn đề

FE và BE là 2 Railway services riêng biệt.
Nếu không set `NEXT_PUBLIC_API_URL`, FE sẽ proxy qua `/api/backend` (double-hop, chậm).

## Cách fix: Set env vars trên Railway Dashboard

### 1. Backend Service (phucuongthinh-production)

Không cần thay đổi gì.

### 2. Frontend Service

Vào Railway Dashboard → Frontend Service → Variables, thêm:

```
NEXT_PUBLIC_API_URL=https://phucuongthinh-production.up.railway.app
BACKEND_URL=https://phucuongthinh-production.up.railway.app/api/v1
```

> ⚠️ NEXT*PUBLIC*\* phải được set TRƯỚC khi build (build-time env var)
> Railway inject chúng vào bundle khi build.

## Kiểm tra đã đúng chưa

Sau khi deploy, mở browser console trên production:

```javascript
// Phải thấy Railway URL, không phải /api/backend
console.log(process.env.NEXT_PUBLIC_API_URL);
```

Hoặc check Network tab: API calls phải đi thẳng đến
`phucuongthinh-production.up.railway.app`, không qua domain FE.
