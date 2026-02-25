# CMS API Quick Reference

## 🔥 Most Important Endpoint

### Version-Based Sync (Mobile App ← CMS)

```typescript
GET /api/sync/content

Query Parameters:
  lastArticleVersion: number (default: 0)
  lastSurveyVersion: number (default: 0)
  lastProductVersion: number (default: 0)
  lastActivityVersion: number (default: 0)
  lastGiftVersion: number (default: 0)
  lastChecklistVersion: number (default: 0)
  lastBadgeVersion: number (default: 0)
  lastPlanVersion: number (default: 0)

Response: {
  articles: Article[],
  surveys: Survey[],
  products: AffiliateProduct[],
  activities: ActivitySuggestion[],
  giftSuggestions: GiftSuggestion[],
  checklistTemplates: ChecklistTemplate[],
  badgeDefinitions: BadgeDefinition[],
  subscriptionPlans: SubscriptionProduct[],
  lastArticleVersion: number,
  lastSurveyVersion: number,
  lastProductVersion: number,
  lastActivityVersion: number,
  lastGiftVersion: number,
  lastChecklistVersion: number,
  lastBadgeVersion: number,
  lastPlanVersion: number,
  syncedAt: string
}
```

**Implementation Example (Prisma)**:

```typescript
// GET /api/sync/content
app.get('/api/sync/content', async (req, res) => {
  const versions = {
    lastArticleVersion: Number(req.query.lastArticleVersion || 0),
    lastSurveyVersion: Number(req.query.lastSurveyVersion || 0),
    // ... other versions
  };

  const [articles, surveys, products, /* ... */] = await Promise.all([
    prisma.articles.findMany({
      where: {
        version: { gt: versions.lastArticleVersion },
        status: 'published',
        deletedAt: null,
      },
      orderBy: { version: 'asc' },
      take: 1000,
    }),
    prisma.surveys.findMany({
      where: {
        version: { gt: versions.lastSurveyVersion },
        status: 'published',
        deletedAt: null,
      },
      orderBy: { version: 'asc' },
      take: 1000,
    }),
    // ... repeat for all 8 content types
  ]);

  // Get latest versions
  const [lastArticle, lastSurvey, /* ... */] = await Promise.all([
    prisma.articles.findFirst({
      orderBy: { version: 'desc' },
      select: { version: true },
    }),
    // ... repeat for all types
  ]);

  res.json({
    articles,
    surveys,
    products,
    // ... other content arrays
    lastArticleVersion: lastArticle?.version || 0,
    lastSurveyVersion: lastSurvey?.version || 0,
    // ... other version numbers
    syncedAt: new Date().toISOString(),
  });
});
```

---

## 📚 Public Endpoints

### Articles

```typescript
// List articles
GET /api/articles?category=gifts&featured=true&page=1&limit=20

// Get single article
GET /api/articles/:id

// Track view
POST /api/articles/:id/view
Body: { userId?: string, sessionId?: string }

// Like/Unlike
POST /api/articles/:id/like
POST /api/articles/:id/unlike
Body: { userId: string }
```

### Products

```typescript
// List products
GET /api/products?category=gift&occasion=birthday&budget=200k-500k

// Get single product
GET /api/products/:id

// Track analytics
POST /api/products/:id/view
POST /api/products/:id/click
```

### Activities

```typescript
// List activities
GET /api/activities?category=restaurant&location=Quận 1

// Geospatial search (nearby)
GET /api/activities/nearby?lat=10.7769&lng=106.7009&radius=5
```

---

## 🔐 Admin Endpoints (Protected)

### Authentication

```typescript
// Login
POST /api/admin/auth/login
Body: { email: string, password: string }
Response: { accessToken: string, refreshToken: string, user: User }

// Refresh token
POST /api/admin/auth/refresh
Body: { refreshToken: string }

// Logout
POST /api/admin/auth/logout
```

### Articles CRUD

```typescript
// List (admin view - includes drafts)
GET /admin/articles?status=draft&page=1

// Create
POST /admin/articles
Headers: Authorization: Bearer <token>
Body: {
  title: string,
  category: string,
  content: string,
  tags: string[],
  status: 'draft' | 'published',
  isFeatured: boolean
}

// Update
PUT /admin/articles/:id
Headers: Authorization: Bearer <token>
Body: { ...fields to update }

// Delete (soft delete)
DELETE /admin/articles/:id
Headers: Authorization: Bearer <token>

// Publish
POST /admin/articles/:id/publish
Headers: Authorization: Bearer <token>

// Unpublish
POST /admin/articles/:id/unpublish
Headers: Authorization: Bearer <token>

// History
GET /admin/articles/:id/history
Headers: Authorization: Bearer <token>
```

### Bulk Operations

```typescript
// Bulk publish
POST /admin/articles/bulk
Headers: Authorization: Bearer <token>
Body: { action: 'publish', ids: string[] }

// Bulk delete
POST /admin/articles/bulk
Body: { action: 'delete', ids: string[] }
```

---

## 💾 Database Queries

### Get Changed Content (Incremental Sync)

```sql
-- Articles changed after version 42
SELECT *
FROM articles
WHERE version > 42
  AND status = 'published'
  AND deleted_at IS NULL
ORDER BY version ASC
LIMIT 1000;
```

### Get Latest Version Number

```sql
SELECT MAX(version) as latest_version
FROM articles
WHERE deleted_at IS NULL;
```

### Publish Article

```sql
UPDATE articles
SET status = 'published',
    published_at = CURRENT_TIMESTAMP
WHERE id = 'article-uuid-here';
-- version auto-increments via trigger
```

### Soft Delete

```sql
UPDATE articles
SET deleted_at = CURRENT_TIMESTAMP
WHERE id = 'article-uuid-here';
-- version auto-increments via trigger
```

### Track Analytics

```sql
-- Increment views
UPDATE articles
SET views = views + 1
WHERE id = 'article-uuid-here';

-- Increment product clicks
UPDATE affiliate_products
SET clicks = clicks + 1
WHERE id = 'product-uuid-here';
```

### Get Popular Content

```sql
-- Top 10 most viewed articles
SELECT id, title, views, likes
FROM articles
WHERE status = 'published'
  AND deleted_at IS NULL
ORDER BY views DESC
LIMIT 10;

-- Top products by conversion
SELECT name, clicks, conversions,
       ROUND((conversions::float / NULLIF(clicks, 0)) * 100, 2) as conversion_rate
FROM affiliate_products
WHERE status = 'published'
ORDER BY conversions DESC
LIMIT 10;
```

---

## 📤 Media Upload

```typescript
POST /admin/media/upload
Headers:
  Authorization: Bearer <token>
  Content-Type: multipart/form-data
Body:
  file: File
  altText?: string
  title?: string
  tags?: string[]

Response: {
  media: {
    id: string,
    filename: string,
    cdnUrl: string,
    thumbnailUrl: string,
    width: number,
    height: number,
    mimeType: string,
    fileSize: number
  }
}

// Implementation with AWS S3
const uploadToS3 = async (file) => {
  const s3 = new AWS.S3();
  const key = `media/${Date.now()}-${file.originalname}`;

  await s3.upload({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  }).promise();

  return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
};
```

---

## 🔍 Search & Filter

### Full-text Search (Articles)

```sql
-- Search by title and content
SELECT id, title, ts_rank(search_vector, query) as rank
FROM articles,
     to_tsquery('english', 'gift & romantic') as query
WHERE search_vector @@ query
  AND status = 'published'
  AND deleted_at IS NULL
ORDER BY rank DESC
LIMIT 20;
```

### Filter by Multiple Criteria (Products)

```sql
-- Products for birthday, budget 200k-500k, gift category
SELECT *
FROM affiliate_products
WHERE status = 'published'
  AND deleted_at IS NULL
  AND category = 'gift'
  AND occasion @> '["birthday"]'::jsonb
  AND budget @> '["200k-500k"]'::jsonb
ORDER BY rating DESC, review_count DESC
LIMIT 20;
```

### Geospatial Search (Activities)

```sql
-- Activities within 5km of a location
SELECT id, name, location,
       earth_distance(
         ll_to_earth(latitude, longitude),
         ll_to_earth(10.7769, 106.7009)
       ) / 1000 as distance_km
FROM activity_suggestions
WHERE status = 'published'
  AND deleted_at IS NULL
  AND earth_box(ll_to_earth(10.7769, 106.7009), 5000) @> ll_to_earth(latitude, longitude)
ORDER BY distance_km
LIMIT 20;
```

---

## 📊 Analytics Queries

### Content Performance

```sql
-- Article engagement metrics
SELECT
  category,
  COUNT(*) as total_articles,
  AVG(views) as avg_views,
  AVG(likes) as avg_likes,
  SUM(views) as total_views
FROM articles
WHERE status = 'published'
  AND deleted_at IS NULL
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY category
ORDER BY total_views DESC;
```

### Revenue Tracking (Affiliate)

```sql
-- Product revenue by category
SELECT
  category,
  COUNT(*) as total_products,
  SUM(clicks) as total_clicks,
  SUM(conversions) as total_conversions,
  SUM(revenue) as total_revenue,
  ROUND(AVG(commission_rate), 2) as avg_commission
FROM affiliate_products
WHERE status = 'published'
  AND deleted_at IS NULL
GROUP BY category
ORDER BY total_revenue DESC;
```

---

## 🔒 RBAC (Role-Based Access Control)

### Middleware Example

```typescript
const rbacMiddleware = (allowedRoles: string[]) => {
  return async (req, res, next) => {
    const user = req.user; // From auth middleware

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
};

// Usage
app.post('/admin/articles', authMiddleware, rbacMiddleware(['editor', 'super_admin']), createArticle);
app.post('/admin/articles/:id/publish', authMiddleware, rbacMiddleware(['super_admin']), publishArticle);
app.get('/admin/articles', authMiddleware, rbacMiddleware(['viewer', 'editor', 'super_admin']), listArticles);
```

---

## ⚡ Performance Tips

### Use Indexes

```sql
-- Already created in migrations, but verify:
\di articles*

-- Should see indexes on:
-- - status
-- - category
-- - version
-- - tags (GIN)
-- - search (GIN)
```

### Cache with Redis

```typescript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Cache sync response (1 hour)
app.get('/api/sync/content', async (req, res) => {
  const cacheKey = `sync:${JSON.stringify(req.query)}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return res.json(JSON.parse(cached));
  }

  const data = await fetchSyncData(req.query);
  await redis.set(cacheKey, JSON.stringify(data), 'EX', 3600);

  res.json(data);
});
```

### Pagination

```typescript
// Offset-based pagination
const page = Number(req.query.page || 1);
const limit = Number(req.query.limit || 20);
const skip = (page - 1) * limit;

const [items, total] = await Promise.all([
  prisma.articles.findMany({ skip, take: limit }),
  prisma.articles.count(),
]);

res.json({
  items,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasMore: total > page * limit,
  },
});
```

---

**Quick Reference Version**: 1.0
**Last Updated**: 2025-02-22
