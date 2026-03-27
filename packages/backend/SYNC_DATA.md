# 🔄 Đồng Bộ Dữ Liệu Production → Local

## Cách 1: Export/Import qua JSON (Khuyến nghị)

### Bước 1: Export dữ liệu từ Production

```bash
cd packages/backend

# Set production API URL
export PRODUCTION_API_URL=https://your-production-api.com/api/v1

# Export data
npm run sync:export
```

Dữ liệu sẽ được lưu vào `packages/backend/data-backup/`

### Bước 2: Import vào Local

```bash
# Import từ file backup
npm run sync:import data-backup/full-export-2026-03-27T15-30-00-000Z.json
```

## Cách 2: Sync trực tiếp từ Production API

```bash
cd packages/backend

# Set production API URL
export PRODUCTION_API_URL=https://your-production-api.com/api/v1

# Sync directly
npm run sync:from-prod
```

## Cách 3: Manual Export từ Production Database

Nếu bạn có quyền truy cập production database:

### PostgreSQL Production:

```bash
# Export từ production
pg_dump -h production-host -U username -d database_name -F c -f production-backup.dump

# Import vào local PostgreSQL
pg_restore -h localhost -U postgres -d digital_showroom_db production-backup.dump
```

### Hoặc export sang SQLite:

```bash
# Trên production server
node scripts/export-production-data.js

# Copy file JSON về local
scp user@production:/path/to/backup.json ./data-backup/

# Import vào local SQLite
npm run sync:import data-backup/backup.json
```

## Lưu Ý

1. **Backup trước khi import:**

   ```bash
   cp dev.db dev.db.backup
   ```

2. **Reset database nếu cần:**

   ```bash
   npm run db:reset:sqlite
   ```

3. **Regenerate Prisma Client sau khi import:**
   ```bash
   npm run db:generate:sqlite
   ```

## Troubleshooting

### Lỗi "PRODUCTION_API_URL not set"

```bash
# Windows CMD
set PRODUCTION_API_URL=https://your-api.com/api/v1

# Windows PowerShell
$env:PRODUCTION_API_URL="https://your-api.com/api/v1"

# Linux/Mac
export PRODUCTION_API_URL=https://your-api.com/api/v1
```

### Lỗi "File not found"

Kiểm tra đường dẫn file backup:

```bash
ls -la data-backup/
```

### Lỗi "Foreign key constraint"

Import theo thứ tự: Categories → Styles → Spaces → Products
