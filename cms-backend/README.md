# Love Date App - CMS Backend

Backend và database cho Content Management System (CMS) của Love Date App.

## 📁 Cấu trúc thư mục

```
cms-backend/
├── migrations/          # SQL migration files
│   ├── 001_create_articles_table.sql
│   ├── 002_create_affiliate_products_table.sql
│   ├── 003_create_activity_suggestions_table.sql
│   ├── 004_create_surveys_table.sql
│   ├── 005_create_remaining_tables.sql
│   ├── 006_create_supporting_tables.sql
│   └── 007_seed_sample_data.sql
├── CMS_IMPLEMENTATION_GUIDE.md  # Hướng dẫn chi tiết
└── README.md           # File này
```

## 🚀 Quick Start

### 1. Tạo Database

```bash
# Kết nối PostgreSQL
psql -U postgres

# Tạo database
CREATE DATABASE lovedate_cms;
\c lovedate_cms

# Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";
```

### 2. Chạy Migrations (theo thứ tự)

```bash
cd cms-backend/migrations

# 1. Supporting tables (admin_users phải tạo trước)
psql -U postgres -d lovedate_cms -f 006_create_supporting_tables.sql

# 2. Content tables
psql -U postgres -d lovedate_cms -f 001_create_articles_table.sql
psql -U postgres -d lovedate_cms -f 002_create_affiliate_products_table.sql
psql -U postgres -d lovedate_cms -f 003_create_activity_suggestions_table.sql
psql -U postgres -d lovedate_cms -f 004_create_surveys_table.sql
psql -U postgres -d lovedate_cms -f 005_create_remaining_tables.sql

# 3. Seed sample data (optional)
psql -U postgres -d lovedate_cms -f 007_seed_sample_data.sql
```

### 3. Verify Installation

```sql
-- Kiểm tra tables
\dt

-- Kiểm tra data
SELECT 'Articles' as type, COUNT(*) FROM articles
UNION ALL
SELECT 'Products', COUNT(*) FROM affiliate_products
UNION ALL
SELECT 'Activities', COUNT(*) FROM activity_suggestions;
```

## 📊 Database Schema

### Content Tables (8 loại)
1. **articles** - Bài viết/Tips
2. **affiliate_products** - Sản phẩm affiliate
3. **activity_suggestions** - Gợi ý hoạt động/địa điểm
4. **surveys** - Khảo sát/Trắc nghiệm
5. **gift_suggestions** - Gợi ý quà tặng
6. **checklist_templates** - Mẫu checklist
7. **badge_definitions** - Định nghĩa huy hiệu
8. **subscription_plans** - Gói đăng ký

### Supporting Tables
- **admin_users** - Tài khoản admin CMS
- **media_library** - Thư viện media
- **content_audit_log** - Lịch sử thay đổi

## 🔑 Key Features

- ✅ **Version-based Sync**: Mỗi table có field `version` tự động tăng khi update
- ✅ **Publishing Workflow**: Draft → Published → Archived
- ✅ **Soft Delete**: Sử dụng `deleted_at` thay vì xóa vĩnh viễn
- ✅ **JSONB Fields**: Linh hoạt với tags, features, requirements
- ✅ **Auto Timestamps**: `created_at`, `updated_at` tự động
- ✅ **Audit Trail**: Track mọi thay đổi qua `content_audit_log`

## 🔐 Admin User Mặc Định

**Email**: `admin@lovedate.app`
**Password**: `Admin@123`

⚠️ **QUAN TRỌNG**: Đổi password ngay sau khi deploy production!

## 📝 API Endpoints Cần Implement

### Sync Endpoint (Quan trọng nhất)
```
GET /api/sync/content
  ?lastArticleVersion=0
  &lastSurveyVersion=0
  &lastProductVersion=0
  &lastActivityVersion=0
  &lastGiftVersion=0
  &lastChecklistVersion=0
  &lastBadgeVersion=0
  &lastPlanVersion=0
```

### Public Endpoints
- `GET /api/articles` - Lấy danh sách articles
- `GET /api/products` - Lấy danh sách products
- `GET /api/activities` - Lấy gợi ý activities
- `POST /api/articles/:id/view` - Track lượt xem
- `POST /api/products/:id/click` - Track click affiliate

### Admin Endpoints (Protected)
- `POST /admin/articles` - Tạo article mới
- `PUT /admin/articles/:id` - Update article
- `DELETE /admin/articles/:id` - Soft delete
- `POST /admin/articles/:id/publish` - Publish article
- `POST /admin/media/upload` - Upload media

## 🛠 Tech Stack Đề Xuất

### Backend
- **Framework**: Express.js / Fastify / NestJS
- **ORM**: Prisma / TypeORM
- **Auth**: JWT + bcrypt
- **Cache**: Redis
- **Storage**: AWS S3 / Cloudinary

### Frontend (CMS Admin)
- **Framework**: Next.js 14
- **UI**: Shadcn/ui + Tailwind
- **Editor**: Tiptap / CKEditor
- **State**: Zustand + React Query

## 📚 Documentation

Xem **CMS_IMPLEMENTATION_GUIDE.md** để có hướng dẫn chi tiết về:
- Cài đặt database
- Implementation backend API
- Xây dựng CMS admin frontend
- Testing
- Deployment

## 🔍 Testing

### Test Version Increment

```sql
-- Insert test article
INSERT INTO articles (title, category, icon, color, content)
VALUES ('Test', 'gifts', 'gift', '#FF0000', '<p>Test</p>');

-- Check version = 1
SELECT id, title, version FROM articles WHERE title = 'Test';

-- Update article
UPDATE articles SET title = 'Test Updated' WHERE title = 'Test';

-- Check version = 2 (auto-incremented)
SELECT id, title, version FROM articles WHERE title = 'Test Updated';
```

### Test Sync Query

```sql
-- Simulate mobile app sync request
SELECT * FROM articles
WHERE version > 0
  AND status = 'published'
  AND deleted_at IS NULL
ORDER BY version ASC
LIMIT 1000;
```

## 🚀 Next Steps

1. ✅ Setup database (xong)
2. ⏳ Implement backend API
3. ⏳ Build CMS admin frontend
4. ⏳ Configure CDN cho media
5. ⏳ Setup monitoring & logging
6. ⏳ Deploy to production

## 📞 Support

Nếu có vấn đề, tham khảo:
- **CMS_IMPLEMENTATION_GUIDE.md** - Hướng dẫn đầy đủ
- **Mobile App Integration Guide** - `.claude/projects/.../memory/cms-integration-updates.md`
- **CMS Plan** - `.claude/plans/valiant-hopping-raccoon.md`

---

**Version**: 1.0
**Created**: 2025-02-22
**Database**: PostgreSQL 14+
