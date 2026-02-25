# Love Date App - CMS Implementation Guide

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
3. [Cài đặt Database](#cài-đặt-database)
4. [Thiết lập Backend API](#thiết-lập-backend-api)
5. [Xây dựng CMS Admin Frontend](#xây-dựng-cms-admin-frontend)
6. [Testing](#testing)
7. [Deployment](#deployment)

---

## 🎯 Tổng quan

CMS (Content Management System) cho Love Date App quản lý **8 loại content**:
- Articles (Bài viết)
- Affiliate Products (Sản phẩm affiliate)
- Activity Suggestions (Gợi ý hoạt động)
- Surveys (Khảo sát/trắc nghiệm)
- Gift Suggestions (Gợi ý quà tặng)
- Checklist Templates (Mẫu checklist)
- Badge Definitions (Định nghĩa huy hiệu)
- Subscription Plans (Gói đăng ký)

**Tính năng chính:**
- ✅ Version-based incremental sync
- ✅ Publishing workflow (Draft → Published → Archived)
- ✅ Role-based access control (RBAC)
- ✅ Media library với CDN
- ✅ Audit log
- ✅ REST API

---

## 🛠 Yêu cầu hệ thống

### Backend
- **Database**: PostgreSQL 14+
- **Runtime**: Node.js 18+ hoặc Python 3.10+
- **Framework**: Express.js / Fastify / Django / FastAPI
- **CDN**: AWS S3 / Cloudinary / Firebase Storage

### Frontend (CMS Admin)
- **Framework**: Next.js 14 (App Router)
- **UI Library**: Shadcn/ui + Tailwind CSS
- **Rich Text Editor**: Tiptap hoặc CKEditor 5
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form + Zod

---

## 📊 Cài đặt Database

### Bước 1: Tạo Database

```bash
# Kết nối PostgreSQL
psql -U postgres

# Tạo database
CREATE DATABASE lovedate_cms;
\c lovedate_cms

# Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance"; -- For geospatial search
```

### Bước 2: Chạy Migrations

Thực hiện migrations theo thứ tự:

```bash
# 1. Supporting tables trước (admin_users)
psql -U postgres -d lovedate_cms -f migrations/006_create_supporting_tables.sql

# 2. Content tables
psql -U postgres -d lovedate_cms -f migrations/001_create_articles_table.sql
psql -U postgres -d lovedate_cms -f migrations/002_create_affiliate_products_table.sql
psql -U postgres -d lovedate_cms -f migrations/003_create_activity_suggestions_table.sql
psql -U postgres -d lovedate_cms -f migrations/004_create_surveys_table.sql
psql -U postgres -d lovedate_cms -f migrations/005_create_remaining_tables.sql
```

### Bước 3: Verify Tables

```sql
-- Kiểm tra các bảng đã tạo
\dt

-- Kiểm tra indexes
\di

-- Kiểm tra triggers
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgname LIKE '%version%';
```

### Bước 4: Tạo Admin User đầu tiên

```sql
-- Mật khẩu: Admin@123 (bcrypt hash cost 12)
INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
VALUES (
    'admin@lovedate.app',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5oDWpZfN.QFZS',
    'System Administrator',
    'super_admin',
    true
);
```

---

## 🔧 Thiết lập Backend API

### Option 1: Node.js + Express + Prisma

#### 1. Initialize Project

```bash
mkdir cms-backend && cd cms-backend
npm init -y
npm install express prisma @prisma/client bcrypt jsonwebtoken cors dotenv
npm install -D typescript @types/node @types/express ts-node nodemon
npx tsc --init
```

#### 2. Prisma Setup

```bash
npx prisma init
```

**prisma/schema.prisma**: (generate từ existing database)
```bash
npx prisma db pull
npx prisma generate
```

#### 3. Project Structure

```
cms-backend/
├── src/
│   ├── controllers/
│   │   ├── articles.controller.ts
│   │   ├── products.controller.ts
│   │   ├── sync.controller.ts
│   │   └── auth.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── rbac.middleware.ts
│   ├── routes/
│   │   ├── articles.routes.ts
│   │   ├── products.routes.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── articles.service.ts
│   │   └── sync.service.ts
│   ├── utils/
│   │   ├── db.ts
│   │   └── redis.ts
│   └── server.ts
├── prisma/
│   └── schema.prisma
├── .env
├── package.json
└── tsconfig.json
```

#### 4. Environment Variables (.env)

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/lovedate_cms"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret"
CDN_URL="https://your-cdn.com"
AWS_S3_BUCKET="lovedate-media"
PORT=3000
```

#### 5. Core API Endpoints Implementation

**src/routes/sync.routes.ts** (Quan trọng nhất):

```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/sync/content - Version-based incremental sync
router.get('/sync/content', async (req, res) => {
  try {
    const {
      lastArticleVersion = 0,
      lastSurveyVersion = 0,
      lastProductVersion = 0,
      lastActivityVersion = 0,
      lastGiftVersion = 0,
      lastChecklistVersion = 0,
      lastBadgeVersion = 0,
      lastPlanVersion = 0,
    } = req.query;

    // Fetch only changed content (version > lastVersion)
    const [articles, surveys, products, activities, giftSuggestions, checklistTemplates, badgeDefinitions, subscriptionPlans] = await Promise.all([
      prisma.articles.findMany({
        where: {
          version: { gt: Number(lastArticleVersion) },
          status: 'published',
          deletedAt: null,
        },
        orderBy: { version: 'asc' },
        take: 1000,
      }),
      prisma.surveys.findMany({
        where: {
          version: { gt: Number(lastSurveyVersion) },
          status: 'published',
          deletedAt: null,
        },
        orderBy: { version: 'asc' },
        take: 1000,
      }),
      prisma.affiliateProducts.findMany({
        where: {
          version: { gt: Number(lastProductVersion) },
          status: 'published',
          deletedAt: null,
        },
        orderBy: { version: 'asc' },
        take: 1000,
      }),
      prisma.activitySuggestions.findMany({
        where: {
          version: { gt: Number(lastActivityVersion) },
          status: 'published',
          deletedAt: null,
        },
        orderBy: { version: 'asc' },
        take: 1000,
      }),
      prisma.giftSuggestions.findMany({
        where: {
          version: { gt: Number(lastGiftVersion) },
          status: 'published',
          deletedAt: null,
        },
        orderBy: { version: 'asc' },
        take: 1000,
      }),
      prisma.checklistTemplates.findMany({
        where: {
          version: { gt: Number(lastChecklistVersion) },
          status: 'published',
          deletedAt: null,
        },
        orderBy: { version: 'asc' },
        take: 1000,
      }),
      prisma.badgeDefinitions.findMany({
        where: {
          version: { gt: Number(lastBadgeVersion) },
          status: 'published',
          deletedAt: null,
        },
        orderBy: { version: 'asc' },
        take: 1000,
      }),
      prisma.subscriptionPlans.findMany({
        where: {
          version: { gt: Number(lastPlanVersion) },
          status: 'published',
          deletedAt: null,
        },
        orderBy: { version: 'asc' },
        take: 1000,
      }),
    ]);

    // Get latest versions
    const [lastArticle, lastSurvey, lastProduct, lastActivity, lastGift, lastChecklist, lastBadge, lastPlan] = await Promise.all([
      prisma.articles.findFirst({ orderBy: { version: 'desc' }, select: { version: true } }),
      prisma.surveys.findFirst({ orderBy: { version: 'desc' }, select: { version: true } }),
      prisma.affiliateProducts.findFirst({ orderBy: { version: 'desc' }, select: { version: true } }),
      prisma.activitySuggestions.findFirst({ orderBy: { version: 'desc' }, select: { version: true } }),
      prisma.giftSuggestions.findFirst({ orderBy: { version: 'desc' }, select: { version: true } }),
      prisma.checklistTemplates.findFirst({ orderBy: { version: 'desc' }, select: { version: true } }),
      prisma.badgeDefinitions.findFirst({ orderBy: { version: 'desc' }, select: { version: true } }),
      prisma.subscriptionPlans.findFirst({ orderBy: { version: 'desc' }, select: { version: true } }),
    ]);

    res.json({
      articles,
      surveys,
      products,
      activities,
      giftSuggestions,
      checklistTemplates,
      badgeDefinitions,
      subscriptionPlans,
      lastArticleVersion: lastArticle?.version || 0,
      lastSurveyVersion: lastSurvey?.version || 0,
      lastProductVersion: lastProduct?.version || 0,
      lastActivityVersion: lastActivity?.version || 0,
      lastGiftVersion: lastGift?.version || 0,
      lastChecklistVersion: lastChecklist?.version || 0,
      lastBadgeVersion: lastBadge?.version || 0,
      lastPlanVersion: lastPlan?.version || 0,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

export default router;
```

#### 6. CRUD Endpoints Template

**src/routes/articles.routes.ts**:

```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.middleware';
import { rbacMiddleware } from '../middleware/rbac.middleware';

const router = Router();
const prisma = new PrismaClient();

// Public endpoints
router.get('/articles', async (req, res) => {
  const { category, featured, page = 1, limit = 20 } = req.query;

  const articles = await prisma.articles.findMany({
    where: {
      status: 'published',
      deletedAt: null,
      ...(category && { category: category as string }),
      ...(featured && { isFeatured: featured === 'true' }),
    },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.articles.count({
    where: { status: 'published', deletedAt: null },
  });

  res.json({
    articles,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      hasMore: total > Number(page) * Number(limit),
    },
  });
});

router.post('/articles/:id/view', async (req, res) => {
  await prisma.articles.update({
    where: { id: req.params.id },
    data: { views: { increment: 1 } },
  });
  res.json({ success: true });
});

// Admin endpoints (protected)
router.post('/admin/articles', authMiddleware, rbacMiddleware(['editor', 'super_admin']), async (req, res) => {
  const article = await prisma.articles.create({
    data: {
      ...req.body,
      createdBy: req.user.id,
    },
  });
  res.json({ article });
});

router.put('/admin/articles/:id', authMiddleware, rbacMiddleware(['editor', 'super_admin']), async (req, res) => {
  const article = await prisma.articles.update({
    where: { id: req.params.id },
    data: {
      ...req.body,
      updatedBy: req.user.id,
    },
  });
  res.json({ article });
});

router.post('/admin/articles/:id/publish', authMiddleware, rbacMiddleware(['super_admin']), async (req, res) => {
  const article = await prisma.articles.update({
    where: { id: req.params.id },
    data: {
      status: 'published',
      publishedAt: new Date(),
    },
  });
  res.json({ article });
});

export default router;
```

---

## 🎨 Xây dựng CMS Admin Frontend

### 1. Initialize Next.js Project

```bash
npx create-next-app@latest cms-admin --typescript --tailwind --app
cd cms-admin
npm install @tanstack/react-query zustand react-hook-form zod
npm install @tiptap/react @tiptap/starter-kit
npm install shadcn-ui
```

### 2. Project Structure

```
cms-admin/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── articles/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/edit/page.tsx
│   │   ├── products/
│   │   ├── analytics/
│   │   └── media/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/ (shadcn components)
│   ├── editors/
│   │   └── RichTextEditor.tsx
│   └── layouts/
│       └── DashboardLayout.tsx
├── lib/
│   ├── api.ts
│   └── auth.ts
└── types/
    └── cms.ts
```

### 3. Article Editor Component

**components/editors/ArticleEditor.tsx**:

```tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const articleSchema = z.object({
  title: z.string().min(1).max(255),
  category: z.enum(['gifts', 'dates', 'communication', 'zodiac', 'personality']),
  content: z.string().min(1),
  tags: z.array(z.string()),
  isFeatured: z.boolean(),
});

export function ArticleEditor({ initialData, onSave }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialData?.content || '',
  });

  const form = useForm({
    resolver: zodResolver(articleSchema),
    defaultValues: initialData || {
      title: '',
      category: 'gifts',
      content: '',
      tags: [],
      isFeatured: false,
    },
  });

  const onSubmit = async (data) => {
    const content = editor?.getHTML() || '';
    await onSave({ ...data, content });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('title')} placeholder="Tiêu đề bài viết" />

      <select {...form.register('category')}>
        <option value="gifts">Quà tặng</option>
        <option value="dates">Hẹn hò</option>
        <option value="communication">Giao tiếp</option>
      </select>

      <EditorContent editor={editor} />

      <button type="button" onClick={() => onSave({ ...form.getValues(), status: 'draft' })}>
        Lưu nháp
      </button>
      <button type="submit">Xuất bản</button>
    </form>
  );
}
```

---

## ✅ Testing

### 1. Database Testing

```bash
# Test version increment trigger
psql -U postgres -d lovedate_cms

INSERT INTO articles (title, category, icon, color, content)
VALUES ('Test Article', 'gifts', 'gift', '#FF6B6B', '<p>Content</p>');

UPDATE articles SET title = 'Updated Title' WHERE id = '...';

SELECT id, title, version FROM articles ORDER BY version DESC LIMIT 5;
-- Verify version incremented
```

### 2. API Testing (Postman/Thunder Client)

**Test Sync Endpoint**:
```
GET http://localhost:3000/api/sync/content?lastArticleVersion=0
```

**Expected Response**:
```json
{
  "articles": [...],
  "surveys": [],
  "products": [],
  ...
  "lastArticleVersion": 5,
  "syncedAt": "2025-02-22T..."
}
```

### 3. Mobile App Testing

Update `.env` in React Native app:
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Test sync:
```typescript
import { contentSyncService } from './services/contentSync.service';
await contentSyncService.syncContent();
```

---

## 🚀 Deployment

### Backend (Railway/Render/Fly.io)

```bash
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "start"]
```

### Frontend (Vercel)

```bash
vercel --prod
```

### Database (Supabase/Railway/Neon)

- Migrate to production PostgreSQL
- Configure connection pooling (PgBouncer)
- Setup backups

---

## 📚 Tài liệu tham khảo

- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Tiptap Docs](https://tiptap.dev/)
- [Shadcn/ui](https://ui.shadcn.com/)

---

## 🔐 Security Checklist

- [ ] Environment variables secure
- [ ] HTTPS only
- [ ] JWT secret rotation
- [ ] Rate limiting enabled
- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS prevention
- [ ] CORS configured
- [ ] Admin access logs
- [ ] Regular security updates

---

**Document Version**: 1.0
**Last Updated**: 2025-02-22
**Maintained by**: Love Date App Development Team
