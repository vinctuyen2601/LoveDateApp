# TÀI LIỆU CHI TIẾT APP NHẮC NHỞ NGÀY QUAN TRỌNG

## 1. THÔNG TIN TỔNG QUAN

### Tên App (đề xuất)
- **RemindHer** - Nhắc nhở thông minh cho đàn ông
- **NeverForget** - Không bao giờ quên
- **DateKeeper** - Giữ chặt mọi ngày quan trọng

### Slogan
"Đàn ông thông minh không cần nhớ mọi thứ - chỉ cần app đúng"

### Target Audience
- **Chính**: Đàn ông 25-45 tuổi, đã có mối quan hệ nghiêm túc
- **Phụ**: Người bận rộn, hay quên, muốn duy trì các mối quan hệ tốt đẹp

---

## 2. TÍNH NĂNG CỐT LÕI (MVP)

### 2.1 Quản lý Người và Ngày quan trọng

#### **Thêm người**
- Tên, mối quan hệ (vợ/chồng, bạn gái/trai, mẹ, bố, con, bạn bè)
- Avatar (chụp/chọn từ thư viện)
- Ngày sinh
- Thêm nhanh từ danh bạ

#### **Thêm ngày đặc biệt**
- Ngày kỷ niệm (hẹn hò, cưới, quen biết)
- Ngày quan trọng khác (lễ tình nhân, 8/3, 20/10, ngày của mẹ/cha)
- Sự kiện tùy chỉnh

#### **Lưu thông tin chi tiết** (tùy chọn)
- Sở thích
- Màu yêu thích
- Size áo/giày
- Món ăn ưa thích
- Hoa yêu thích
- Ghi chú đặc biệt

### 2.2 Hệ thống Nhắc nhở Thông minh

#### **Cấu hình nhắc nhở**
```
Cho mỗi sự kiện, người dùng chọn:
├─ Nhắc trước 30 ngày (gợi ý: "Bắt đầu suy nghĩ quà")
├─ Nhắc trước 14 ngày (gợi ý: "Nên đặt quà/book nhà hàng")
├─ Nhắc trước 7 ngày (gợi ý: "Xác nhận đặt chỗ")
├─ Nhắc trước 3 ngày (cảnh báo)
├─ Nhắc trước 1 ngày (cảnh báo khẩn)
└─ Nhắc sáng ngày chính (9:00 AM)
```

#### **Thông báo đa kênh**
- Push notification (ưu tiên cao, không tắt được)
- Email (backup)
- SMS (option premium)

#### **Độ ưu tiên**
- 🔴 Cực quan trọng: Vợ/chồng, bạn gái/trai
- 🟡 Quan trọng: Gia đình
- 🟢 Bình thường: Bạn bè, đồng nghiệp

### 2.3 Gợi ý Thông minh (AI-powered)

#### **Gợi ý quà tặng**
Dựa trên:
- Thông tin đã lưu (sở thích, màu yêu thích)
- Loại ngày (sinh nhật vs kỷ niệm)
- Mối quan hệ
- Ngân sách (người dùng tự set)
- Lịch sử quà đã tặng (không trùng lặp)

**Ví dụ output:**
```
🎁 GỢI Ý QUÀ CHO NGÀY SINH NHẬT VỢ (30/5)

Dựa trên: Vợ thích màu hồng, yêu hoa hồng, size M, thích đọc sách

Top 3 gợi ý:
1. Bó hoa hồng Ecuador + Thiệp handmade
   💰 800k - 1.2M | 🛒 Đặt ngay tại FloraShop
   
2. Túi xách Michael Kors màu hồng pastel
   💰 3-5M | 🛒 Xem tại Shopee Mall
   
3. Set sách best-seller + nến thơm
   💰 500-800k | 🛒 Fahasa giao 2h
```

#### **Gợi ý hoạt động**
- Nhà hàng (dựa vào vị trí, món ưa thích)
- Điểm check-in (phim, du lịch gần)
- Hoạt động đặc biệt (spa, massage, concert)

**Tích hợp booking:**
- Link đặt bàn nhà hàng (Foody, Shopee Food)
- Link đặt vé (CGV, Tiki)
- Link mua quà (Shopee, Lazada, Tiki)

### 2.4 Dashboard và Timeline

#### **Màn hình chính**
```
┌─────────────────────────────────┐
│  🏠 RemindHer                    │
├─────────────────────────────────┤
│                                  │
│  ⚠️ SẮP TỚI (7 ngày)            │
│  ┌─────────────────────────┐   │
│  │ 💝 Sinh nhật vợ         │   │
│  │ 📅 Còn 5 ngày (30/5)    │   │
│  │ ✅ Đã đặt nhà hàng      │   │
│  │ ❌ Chưa mua quà         │   │
│  │ [XEM GỢI Ý QUÀ]        │   │
│  └─────────────────────────┘   │
│                                  │
│  📆 THÁNG NÀY                   │
│  - 8/6: Ngày của Cha           │
│  - 15/6: Sinh nhật mẹ          │
│                                  │
│  [+ THÊM NGÀY MỚI]              │
└─────────────────────────────────┘
```

#### **Timeline view**
- Lịch theo tháng với các ngày được đánh dấu
- Filter theo người/loại sự kiện
- Countdown timer cho sự kiện gần nhất

### 2.5 Checklist Chuẩn bị

Cho mỗi sự kiện, tạo checklist tự động:
```
KỶ NIỆM 2 NĂM YÊU (15/6)

Checklist:
☐ Đặt bàn nhà hàng (làm trước 7 ngày)
☐ Mua quà (làm trước 5 ngày)
☐ Chuẩn bị thiệp/thư tay
☐ Xác nhận lại booking (làm trước 1 ngày)
☐ Chuẩn bị outfit đẹp
```

---

## 3. TÍNH NĂNG NÂNG CAO (Post-MVP)

### 3.1 AI Learning
- Học từ feedback: "Quà này vợ có thích không?" → Điều chỉnh gợi ý
- Phân tích pattern: Vợ thích quà surprise hay practical?
- Budget learning: Tự động điều chỉnh gợi ý theo khả năng chi tiêu

### 3.2 Social Features
- Chia sẻ ý tưởng quà với cộng đồng
- Vote cho gợi ý quà tốt nhất
- "Hỏi anh em": Post câu hỏi cho community nam giới

### 3.3 Tích hợp Shopping
- Affiliate links → kiếm commission
- So sánh giá trên các sàn
- Mua quà trực tiếp trong app (wallet)

### 3.4 Gamification
- Streak: Không bao giờ quên ngày quan trọng
- Badges: "Perfect Husband", "Thoughtful Boyfriend"
- Leaderboard: So với bạn bè (opt-in)

### 3.5 Premium Features
- Unlimited người và sự kiện
- AI gợi ý nâng cao
- SMS reminder
- Priority support
- Ad-free
- Custom themes

---

## 4. KIẾN TRÚC KỸ THUẬT

### 4.1 Tech Stack Đề xuất

#### **Frontend (Mobile)**
- **React Native** hoặc **Flutter** (cross-platform iOS/Android)
- **Redux/MobX** cho state management
- **React Navigation** cho routing

#### **Backend**
- **Node.js + Express** hoặc **Python + FastAPI**
- **PostgreSQL** (dữ liệu người dùng, events)
- **Redis** (caching, queue notifications)
- **Firebase Cloud Messaging** (push notifications)

#### **AI/ML**
- **OpenAI API** (gợi ý quà, personalization)
- **TensorFlow Lite** (on-device recommendation khi offline)

#### **Cloud Infrastructure**
- **AWS** hoặc **Google Cloud**
- **S3** cho lưu ảnh
- **CloudFront** cho CDN

### 4.2 Database Schema (Simplified)

```sql
-- Users
users
  - id (PK)
  - email
  - name
  - timezone
  - premium (boolean)
  - created_at

-- People (những người cần nhớ)
people
  - id (PK)
  - user_id (FK)
  - name
  - relationship
  - avatar_url
  - birthday
  - favorite_color
  - clothing_size
  - favorite_food
  - notes (JSON)
  - created_at

-- Events
events
  - id (PK)
  - people_id (FK)
  - event_type (birthday, anniversary, custom)
  - event_date
  - recurrence (yearly, monthly, once)
  - priority
  - created_at

-- Reminders
reminders
  - id (PK)
  - event_id (FK)
  - remind_at (timestamp)
  - reminded (boolean)
  - channel (push, email, sms)

-- Gift History
gift_history
  - id (PK)
  - event_id (FK)
  - gift_name
  - price
  - rating (did they like it?)
  - notes
  - purchased_at

-- Notifications Schedule
notification_schedule
  - id (PK)
  - event_id (FK)
  - days_before (30, 14, 7, 3, 1, 0)
  - enabled (boolean)
```

### 4.3 Notification System Architecture

```
┌─────────────────┐
│  Cron Job       │
│  (runs hourly)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Check upcoming events  │
│  (next 30 days)        │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Create notifications   │
│  in Redis Queue        │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Worker processes      │
│  - Send push (FCM)     │
│  - Send email (SES)    │
│  - Send SMS (Twilio)   │
└─────────────────────────┘
```

**Redundancy để đảm bảo 100% reliability:**
- Dual notification system (primary + backup)
- User confirmation: "Đã nhận thông báo chưa?"
- Escalation: Nếu không confirm sau 2h → gửi lại
- Critical dates: Gửi cả email + SMS

---

## 5. UI/UX GUIDELINES

### 5.1 Design Principles

**1. Simple & Masculine**
- Palette: Navy blue, dark grey, white
- Typography: Sans-serif, bold headings
- Minimal decoration

**2. Action-Oriented**
- CTA rõ ràng: "Đặt quà ngay", "Xem gợi ý"
- Ít scroll, nhiều action buttons
- Quick actions từ notification

**3. Stress-Free**
- Không quá nhiều thông tin cùng lúc
- Progress bar cho checklist
- Positive reinforcement

### 5.2 Key Screens Wireframe

#### **Screen 1: Onboarding**
```
┌─────────────────────────┐
│                          │
│     [ICON/ANIMATION]     │
│                          │
│   Đừng để quên nữa!     │
│                          │
│   RemindHer giúp bạn    │
│   nhớ mọi ngày quan     │
│   trọng và gợi ý quà    │
│   hoàn hảo              │
│                          │
│   [BẮT ĐẦU]             │
│                          │
└─────────────────────────┘
```

#### **Screen 2: Thêm người đầu tiên**
```
┌─────────────────────────┐
│  ← Thêm người quan trọng │
├─────────────────────────┤
│                          │
│   [📷 Thêm ảnh]         │
│                          │
│   Tên: _______________  │
│                          │
│   Mối quan hệ:          │
│   ○ Vợ/Chồng            │
│   ○ Bạn gái/trai        │
│   ○ Mẹ                  │
│   ○ Bố                  │
│   ○ Con                 │
│   ○ Khác                │
│                          │
│   Ngày sinh:            │
│   [📅 Chọn ngày]        │
│                          │
│   [TIẾP TỤC]            │
│                          │
└─────────────────────────┘
```

#### **Screen 3: Dashboard chính**
(Đã mô tả ở trên section 2.4)

#### **Screen 4: Chi tiết sự kiện**
```
┌─────────────────────────┐
│  ← Sinh nhật vợ          │
├─────────────────────────┤
│  [AVATAR]   Linh         │
│  📅 30/5/2026           │
│  ⏰ Còn 5 ngày          │
│                          │
│  ━━━━━━━━━━━━━━━━━━━   │
│                          │
│  📋 CHECKLIST            │
│  ✅ Đặt nhà hàng        │
│  ☐ Mua quà             │
│  ☐ Viết thiệp          │
│                          │
│  🎁 GỢI Ý QUÀ (3)       │
│  [Xem tất cả →]         │
│                          │
│  📍 GỢI Ý NHÀ HÀNG      │
│  [Tìm kiếm →]           │
│                          │
│  [SỬA SỰ KIỆN]          │
│                          │
└─────────────────────────┘
```

### 5.3 Notification Design

**Push Notification Example:**
```
🎂 SINH NHẬT VỢ - CÒN 5 NGÀY!

Linh sẽ tròn 30 tuổi vào 30/5. 
Đã chuẩn bị quà chưa?

[XEM GỢI Ý] [ĐÃ XONG]
```

**In-app Alert (Ngày chính):**
```
┌─────────────────────────┐
│   🎉 HÔM NAY LÀ NGÀY    │
│   SINH NHẬT VỢ!         │
│                          │
│   Đừng quên chúc mừng   │
│   sớm nhé!              │
│                          │
│   [ĐÃ CHÚC] [NHẮC SAU] │
└─────────────────────────┘
```

---

## 6. MONETIZATION STRATEGY

### 6.1 Freemium Model

**Free Tier:**
- Tối đa 5 người
- Tối đa 10 sự kiện
- Push notification
- Gợi ý quà cơ bản
- Có quảng cáo

**Premium ($4.99/tháng hoặc $49.99/năm):**
- Unlimited người & sự kiện
- AI gợi ý nâng cao
- SMS + Email reminder
- Ad-free
- Priority support
- Early access tính năng mới
- Custom themes
- Export data

### 6.2 Affiliate Revenue
- Commission từ Shopee, Lazada, Tiki (3-7%)
- Commission từ đặt nhà hàng qua app
- Partnership với florists, gift shops

### 6.3 B2B Opportunities
- Corporate gifts reminder
- HR tool cho employee birthdays/anniversaries

---

## 7. GO-TO-MARKET STRATEGY

### 7.1 Launch Plan

**Phase 1: Beta (Tháng 1-2)**
- Closed beta với 100-200 users
- Thu thập feedback
- Fix bugs critical

**Phase 2: Soft Launch (Tháng 3)**
- Launch Vietnam market first
- Focus iOS (cao cấp hơn, willing to pay)
- PR campaign: "App dành cho đàn ông hiện đại"

**Phase 3: Scale (Tháng 4-6)**
- Android version
- Influencer marketing
- Content marketing

### 7.2 Marketing Channels

**Organic:**
- TikTok content: "Những lần đàn ông quên kỷ niệm"
- YouTube: Review, tutorials
- Blog: "10 món quà vợ thực sự muốn"
- SEO: "quà tặng sinh nhật vợ", "nhà hàng kỷ niệm"

**Paid:**
- Facebook Ads targeting nam 25-45, "in a relationship"
- Google Ads cho keywords liên quan
- Instagram influencers (couples, lifestyle)

**Partnership:**
- Florists, gift shops
- Men's lifestyle brands
- Wedding planners

### 7.3 Viral Mechanics
- Referral program: "Mời bạn → cả 2 được 1 tháng Premium"
- Social proof: "10,000 đàn ông đã không quên kỷ niệm"
- UGC: Share success stories

---

## 8. SUCCESS METRICS (KPIs)

### 8.1 Product Metrics
- **DAU/MAU**: Daily/Monthly Active Users
- **Retention**: D1, D7, D30 retention rates
- **Notification delivery rate**: Phải đạt 99%+
- **Action rate**: % users thực hiện hành động sau notification
- **Checklist completion rate**

### 8.2 Business Metrics
- **Conversion to Premium**: Target 5-10%
- **ARPU**: Average Revenue Per User
- **CAC**: Customer Acquisition Cost
- **LTV**: Lifetime Value
- **Affiliate revenue per user**

### 8.3 User Satisfaction
- **App Store rating**: Target 4.5+
- **NPS (Net Promoter Score)**: Target 50+
- **Support ticket volume**
- **User testimonials**

---

## 9. ROADMAP

### Q1 2026: MVP Development
- ✅ Core features: Add people, events, reminders
- ✅ Basic UI/UX
- ✅ Push notifications
- ✅ Beta testing

### Q2 2026: Launch & Iterate
- 🚀 Soft launch Vietnam
- 📱 iOS app on App Store
- 🤖 Basic AI gift suggestions
- 💳 Premium tier

### Q3 2026: Scale & Enhance
- 📱 Android app
- 🛒 Affiliate integrations
- 🎮 Gamification features
- 🌏 SEA expansion (Thailand, Indonesia)

### Q4 2026: Optimize & Grow
- 🤝 B2B pilot
- 📊 Advanced analytics
- 🎨 Custom themes
- 🌍 English version

---

## 10. RISKS & MITIGATIONS

### 10.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Notification không gửi | Critical | Dual system + monitoring + escalation |
| App crash | High | Extensive testing, error tracking (Sentry) |
| Data loss | Critical | Daily backups, redundancy |
| Scaling issues | Medium | Cloud auto-scaling, load testing |

### 10.2 Business Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Low user adoption | High | Strong marketing, referral program |
| Competition | Medium | Unique value prop (AI + action) |
| Privacy concerns | Medium | Clear privacy policy, GDPR compliance |
| Monetization failure | High | Multiple revenue streams |

### 10.3 Market Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Niche market quá nhỏ | High | Expand to broader audience |
| Seasonality | Low | Year-round value (not just holidays) |
| Cultural differences | Medium | Localization per market |

---

## 11. PHỤ LỤC

### 11.1 User Stories

**Story 1: Anh Minh - 32 tuổi, làm IT**
> "Tôi hay quên kỷ niệm với vợ vì bận coding. Lần trước quên, vợ giận cả tuần. App này nhắc tôi trước 2 tuần, gợi ý tôi book nhà hàng vợ thích. Vợ rất happy!"

**Story 2: Anh Tuấn - 28 tuổi, sales**
> "Bạn gái tôi thích quà bất ngờ. App gợi ý quà dựa trên sở thích của bạn ấy, tôi chỉ việc ấn mua. Giờ tôi là 'perfect boyfriend'!"

### 11.2 Competitor Comparison

| Feature | RemindHer | LoveTrack | Birthday Reminder |
|---------|-----------|-----------|-------------------|
| Multi-person support | ✅ Unlimited | ❌ 1 person only | ✅ Limited |
| AI gift suggestions | ✅ Advanced | ⚠️ Basic | ❌ None |
| Reliable notifications | ✅ 99%+ | ⚠️ Issues reported | ⚠️ Unreliable |
| Shopping integration | ✅ Yes | ❌ No | ❌ No |
| Checklist | ✅ Yes | ❌ No | ❌ No |
| Cross-platform | ✅ iOS + Android | ⚠️ iOS only | ✅ Both |

### 11.3 Tech Stack Alternatives

**Option A: Fast MVP (Recommended)**
- Frontend: **React Native** + Expo
- Backend: **Firebase** (Auth, Firestore, Cloud Functions)
- AI: **OpenAI API**
- Hosting: **Firebase Hosting**
- Pros: Nhanh, ít setup, scaling tự động
- Cons: Vendor lock-in

**Option B: Scalable Long-term**
- Frontend: **Flutter**
- Backend: **Node.js** + Express + PostgreSQL
- AI: **Custom ML model** + OpenAI fallback
- Hosting: **AWS ECS**
- Pros: Full control, optimize được cost
- Cons: Phức tạp, thời gian lâu hơn

---

## 12. NEXT STEPS

### Để AI render demo app, bạn cần:

1. **Chọn tech stack** (recommend: React Native + Firebase cho MVP)

2. **Định nghĩa chi tiết 3-5 screens chính** cho demo:
   - Onboarding
   - Add first person
   - Dashboard
   - Event detail
   - Gift suggestions

3. **Chuẩn bị data mẫu**:
   - Sample user profiles
   - Sample events
   - Sample gift suggestions

4. **Định nghĩa API endpoints** (nếu cần backend):
   ```
   POST /api/people
   GET /api/events
   POST /api/events
   GET /api/gifts/suggestions?eventId=123
   ```

5. **Mockup design** hoặc wireframe chi tiết hơn

Bạn muốn tôi giúp phần nào tiếp theo? Tôi có thể:
- Tạo wireframe chi tiết hơn cho từng màn hình
- Viết API specification đầy đủ
- Tạo sample data cho demo
- Viết pseudo-code cho các tính năng chính