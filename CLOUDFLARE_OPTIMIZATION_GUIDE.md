# Cloudflare Optimization Guide - Fix Slow Performance

## 🔴 VẤN ĐỀ HIỆN TẠI

Nếu bạn đang dùng Cloudflare (R2 + CDN), có thể gặp các vấn đề sau:

### 1. **Cloudflare Cache Headers quá aggressive**

- Cache API responses
- Cache HTML pages
- Không invalidate khi update

### 2. **SSE bị timeout/block**

- Cloudflare timeout SSE sau 100 giây
- Enterprise plan mới support SSE đầy đủ

### 3. **Upload file chậm**

- Upload qua Cloudflare proxy chậm
- Nên upload trực tiếp lên R2

---

## ✅ GIẢI PHÁP

### 1. Cấu hình Cloudflare Page Rules

Tạo các Page Rules sau trong Cloudflare Dashboard:

#### Rule 1: Bypass Cache cho API

```
URL: api.yourdomain.com/*
Settings:
  - Cache Level: Bypass
  - Disable Performance
  - Disable Apps
```

#### Rule 2: Bypass Cache cho SSE

```
URL: api.yourdomain.com/api/v1/products/events
Settings:
  - Cache Level: Bypass
  - Browser Cache TTL: Respect Existing Headers
```

#### Rule 3: Cache cho Static Assets

```
URL: *.yourdomain.com/*.{jpg,jpeg,png,gif,webp,svg,css,js}
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 month
```

#### Rule 4: Cache cho R2 Media

```
URL: pub-*.r2.dev/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 year
  - Browser Cache TTL: 1 month
```

---

### 2. Cấu hình Backend Headers

Thêm vào `packages/backend/src/main.ts`:

```typescript
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS configuration
  app.enableCors({
    origin: [
      "http://localhost:3000",
      "https://yourdomain.com",
      "https://www.yourdomain.com",
    ],
    credentials: true,
    exposedHeaders: ["Content-Length", "Content-Type"],
  });

  // Add cache control headers middleware
  app.use((req, res, next) => {
    // API routes - no cache
    if (req.path.startsWith("/api/")) {
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Surrogate-Control", "no-store");
    }

    // SSE endpoint - special headers
    if (req.path.includes("/events")) {
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
      res.setHeader("Connection", "keep-alive");
    }

    next();
  });

  await app.listen(3001);
}
bootstrap();
```

---

### 3. Upload Trực Tiếp lên R2 (Bypass Cloudflare)

Sửa `packages/backend/src/media/r2-storage.service.ts`:

```typescript
async getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: this.bucketName,
    Key: key,
    ContentType: contentType,
  });

  // Generate presigned URL pointing directly to R2 endpoint
  // This bypasses Cloudflare proxy for faster uploads
  const url = await getSignedUrl(this.s3Client, command, {
    expiresIn,
  });

  return url;
}

getPublicUrl(key: string): string {
  // Use R2 public URL (with Cloudflare CDN)
  return `${this.publicUrl}/${key}`;
}
```

---

### 4. Frontend: Detect Slow Connection & Show Warning

Thêm vào `packages/frontend/src/components/admin/product-form.tsx`:

```typescript
const [connectionSpeed, setConnectionSpeed] = useState<'fast' | 'slow' | 'unknown'>('unknown');

useEffect(() => {
  // Detect connection speed
  if ('connection' in navigator) {
    const conn = (navigator as any).connection;
    if (conn) {
      const effectiveType = conn.effectiveType;
      setConnectionSpeed(
        effectiveType === '4g' || effectiveType === 'wifi' ? 'fast' : 'slow'
      );
    }
  }
}, []);

// Show warning for slow connections
{connectionSpeed === 'slow' && (
  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
    <p className="text-sm text-amber-800">
      ⚠️ Kết nối mạng chậm. Upload có thể mất nhiều thời gian hơn.
    </p>
  </div>
)}
```

---

### 5. Cloudflare Workers (Advanced)

Tạo Cloudflare Worker để handle cache invalidation:

```javascript
// cloudflare-worker.js
addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // Bypass cache for API requests
  if (url.pathname.startsWith("/api/")) {
    const response = await fetch(request, {
      cf: {
        cacheTtl: 0,
        cacheEverything: false,
      },
    });

    // Add no-cache headers
    const newResponse = new Response(response.body, response);
    newResponse.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate",
    );
    newResponse.headers.set("CDN-Cache-Control", "no-store");

    return newResponse;
  }

  // Cache static assets
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|css|js)$/)) {
    return fetch(request, {
      cf: {
        cacheTtl: 2592000, // 30 days
        cacheEverything: true,
      },
    });
  }

  // Default: pass through
  return fetch(request);
}
```

---

### 6. Environment Variables cho Production

Cập nhật `packages/frontend/.env.production`:

```bash
# Production API URL (direct to backend, bypass Cloudflare for API)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# CDN URL for media (through Cloudflare)
NEXT_PUBLIC_CDN_URL=https://cdn.yourdomain.com

# R2 Public URL (with Cloudflare CDN)
NEXT_PUBLIC_R2_URL=https://pub-f34efaa8f95d4557b118334a6e4e8448.r2.dev
```

Cập nhật `packages/backend/.env.production`:

```bash
# R2 Configuration
AWS_ACCESS_KEY_ID=your_r2_access_key
AWS_SECRET_ACCESS_KEY=your_r2_secret_key
AWS_S3_BUCKET_NAME=phucuongthinh
AWS_REGION=auto
R2_ENDPOINT=https://0af0cb8d25830dec9be29349736c9749.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-f34efaa8f95d4557b118334a6e4e8448.r2.dev

# Frontend URL
FRONTEND_URL=https://yourdomain.com
```

---

### 7. Disable Cloudflare Features (Temporary Test)

Để test xem Cloudflare có phải nguyên nhân không:

1. Vào Cloudflare Dashboard
2. Chọn domain của bạn
3. Tạm thời disable:
   - ✅ Auto Minify (CSS, JS, HTML)
   - ✅ Rocket Loader
   - ✅ Mirage
   - ✅ Polish
4. Set Development Mode = ON (bypass cache hoàn toàn)
5. Test lại performance

Nếu nhanh hơn → Cloudflare là nguyên nhân!

---

### 8. Monitoring & Debugging

#### Check Cloudflare Cache Status

Thêm vào browser console:

```javascript
// Check if response came from Cloudflare cache
fetch("/api/products/123").then((res) => {
  console.log("CF-Cache-Status:", res.headers.get("cf-cache-status"));
  console.log("CF-Ray:", res.headers.get("cf-ray"));
  console.log("Cache-Control:", res.headers.get("cache-control"));
});
```

Possible values:

- `HIT` - Served from Cloudflare cache (BAD for API)
- `MISS` - Not in cache, fetched from origin (GOOD for API)
- `BYPASS` - Cache bypassed (GOOD for API)
- `EXPIRED` - Cache expired, revalidating

#### Network Waterfall Analysis

```javascript
// Measure API response time
const start = performance.now();
await fetch("/api/products");
const end = performance.now();
console.log(`API took ${end - start}ms`);
```

---

## 🎯 EXPECTED RESULTS

### Before Optimization:

- API response: 2-5s (through Cloudflare cache)
- Upload: 10-20s (through Cloudflare proxy)
- SSE: Disconnects every 100s

### After Optimization:

- API response: 200-500ms (bypass cache)
- Upload: 3-7s (direct to R2)
- SSE: Stable connection with auto-reconnect

---

## 📋 CHECKLIST

- [ ] Tạo Cloudflare Page Rules
- [ ] Cập nhật backend cache headers
- [ ] Configure direct R2 upload
- [ ] Add connection speed detection
- [ ] Update production environment variables
- [ ] Test with Cloudflare Development Mode
- [ ] Monitor CF-Cache-Status headers
- [ ] Verify SSE connection stability

---

## 🚨 QUAN TRỌNG

### Nếu vẫn chậm sau khi optimize Cloudflare:

1. **Check Database Performance**

   ```sql
   -- Check slow queries
   SELECT * FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

2. **Check Backend Server Location**
   - Backend ở đâu? (Railway, Vercel, AWS?)
   - Frontend ở đâu?
   - Khoảng cách địa lý ảnh hưởng latency

3. **Check Network Path**

   ```bash
   # Trace route to backend
   traceroute api.yourdomain.com

   # Check DNS resolution time
   dig api.yourdomain.com
   ```

4. **Enable Cloudflare Argo**
   - Smart routing
   - Faster global network
   - Cost: $5/month + $0.10/GB

---

## 💡 TIPS

1. **Use Cloudflare Analytics** để xem:
   - Cache hit ratio
   - Bandwidth usage
   - Response time by country

2. **Enable HTTP/3 (QUIC)** trong Cloudflare:
   - Network > HTTP/3 = ON
   - Faster connection establishment

3. **Use Cloudflare Images** cho image optimization:
   - Automatic WebP conversion
   - Responsive images
   - Lazy loading

4. **Consider Cloudflare Workers** cho:
   - Edge caching logic
   - A/B testing
   - Personalization
