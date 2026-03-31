# Cấu trúc Routing - Frontend

## Public Pages

### Main Pages

- `/` - Homepage
- `/products` - Product list (public)
- `/products/[id]` - Product detail (public)
- `/cart` - Quote cart
- `/lien-he` - Full contact page (main navigation)
- `/contact` - Simple contact form (quick contact from products)
- `/ve-chung-toi` - About us
- `/thiet-ke` - Design inspiration
- `/thi-cong` - Execution/construction
- `/du-an` - Projects showcase

### Internal Pages (Protected)

- `/(internal)/` - Redirects to `/warehouse`
- `/(internal)/warehouse` - Warehouse management
- `/(internal)/catalogue` - Product catalogue
- `/(internal)/management` - Content management
- `/(internal)/leads` - Leads management
- `/(internal)/home` - Internal home

## Admin Pages (Protected)

### Dashboard

- `/admin/dashboard` - Admin dashboard

### Products

- `/admin/products` - Product list (admin)
- `/admin/products/new` - Create new product
- `/admin/products/[id]` - Edit product

### Categories & Tags

- `/admin/categories` - Category management
- `/admin/tags` - Style & Space tags management

### Media

- `/admin/media` - Media library

### Leads

- `/admin/leads` - Lead list
- `/admin/leads/[id]` - Lead detail

### Import

- `/admin/import` - Import products
- `/admin/import/[jobId]` - Import job status
- `/admin/import/[jobId]/preview` - Preview imported products

### Auth

- `/admin/login` - Admin login

## Cleaned Up

### Deleted Files

- ❌ `/products/[id]/ProductDetailClient.tsx` - Empty file, not used
- ❌ `/products/[id]/layout.tsx` - Unnecessary wrapper
- ❌ `/products/demo/` - Empty folder

## Notes

### Contact Pages

- `/contact` - Simple form for quick contact (used from product pages)
- `/lien-he` - Full contact page with hero, company info, tabs (main navigation)
- Both are needed for different use cases

### Product Pages

- `/products` - Public product list (customer view)
- `/admin/products` - Admin product list (management view)
- Different features and permissions

### Routing Groups

- `(internal)` - Internal tools, requires authentication
- No prefix in URL (e.g., `/warehouse` not `/(internal)/warehouse`)

## API Routes (Backend)

### Products

- `GET /api/v1/products` - List products
- `GET /api/v1/products/:id` - Get product
- `POST /api/v1/products` - Create product
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product
- `PATCH /api/v1/products/:id/internal` - Update internal data

### Media

- `GET /api/v1/media/product/:id` - Get product media
- `POST /api/v1/media/presigned-url` - Get upload URL
- `POST /api/v1/media` - Create media record
- `DELETE /api/v1/media/:id` - Delete media
- `PATCH /api/v1/media/products/:id/sort-order` - Update sort order

### Categories & Tags

- `GET /api/v1/categories` - List categories
- `GET /api/v1/styles` - List style tags
- `GET /api/v1/spaces` - List space tags

### Leads

- `GET /api/v1/leads` - List leads
- `POST /api/v1/leads` - Create lead

## File Structure

```
packages/frontend/src/app/
├── (internal)/          # Internal tools (protected)
│   ├── warehouse/
│   ├── catalogue/
│   ├── management/
│   ├── leads/
│   └── home/
├── admin/              # Admin panel (protected)
│   ├── dashboard/
│   ├── products/
│   │   ├── [id]/
│   │   └── new/
│   ├── categories/
│   ├── tags/
│   ├── media/
│   ├── leads/
│   │   └── [id]/
│   ├── import/
│   │   └── [jobId]/
│   │       └── preview/
│   └── login/
├── products/           # Public products
│   └── [id]/
├── cart/
├── contact/           # Simple contact form
├── lien-he/          # Full contact page
├── ve-chung-toi/     # About us
├── thiet-ke/         # Design
├── thi-cong/         # Execution
├── du-an/            # Projects
└── page.tsx          # Homepage
```

## Summary

- ✅ Clean structure, no duplicates
- ✅ Clear separation: public / admin / internal
- ✅ Consistent naming (Vietnamese for public, English for admin)
- ✅ Removed unused files
- ✅ All routes serve specific purposes
