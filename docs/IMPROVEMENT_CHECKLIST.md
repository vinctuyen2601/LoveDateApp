# 📋 LOVE DATE APP - IMPROVEMENT CHECKLIST

**Tài liệu theo dõi tiến độ cải thiện app**
Tạo ngày: 2026-01-30
Cập nhật: 2026-01-30

---

## 🎯 TỔNG QUAN

### Mục tiêu
Nâng cấp app từ MVP hiện tại lên đúng specs đã định nghĩa trong [important_dates_app_spec.md](./important_dates_app_spec.md)

### Tiến độ tổng thể
- **Phase 1:** 3/3 tasks (100%) ✅ HOÀN THÀNH
- **Phase 2:** 0/3 tasks (0%)
- **Phase 3:** 0/3 tasks (0%)
- **Tổng cộng:** 3/9 tasks (33%)

---

## 📅 PHASE 1: CORE FEATURES (2 tuần)

### ~~✅ Task 1: Person Management System~~
**Trạng thái:** ❌ **BỎ QUA** - Không cần thiết
**Lý do:**
- Event title đã đủ thông tin
- Privacy concerns về lưu trữ data cá nhân
- Tăng complexity không cần thiết
- Tags hiện tại đã đủ cho filtering và AI suggestions

---

### ✅ Task 1: Checklist System
**Mức độ:** 🔴 CRITICAL
**Ước lượng:** 3-4 ngày
**Trạng thái:** ✅ **HOÀN THÀNH** (2026-01-30)
**Commit:** 603310f

#### Subtasks:
- [ ] **2.1. OpenAI Integration Setup**
  - [ ] Đăng ký OpenAI API key
  - [ ] Thêm `OPENAI_API_KEY` vào `.env`
  - [ ] Cài đặt package: `npm install openai`
  - [ ] Tạo wrapper service cho OpenAI API

- [ ] **2.2. Database Schema**
  - [ ] Tạo bảng `gift_history` (id, event_id, person_id, gift_name, price, rating, notes, purchased_at)
  - [ ] Migration script
  - [ ] Test migration

- [ ] **2.3. Service Layer**
  - [ ] Tạo `src/services/giftSuggestion.service.ts`
  - [ ] Function `generateGiftSuggestions(personId, eventType, budget)`
  - [ ] Build prompt template dựa trên:
    - Thông tin người (sở thích, màu, size)
    - Loại sự kiện (birthday, anniversary, etc)
    - Budget range
    - Lịch sử quà đã tặng (tránh trùng)
  - [ ] Parse OpenAI response
  - [ ] Fallback suggestions nếu API fail

- [ ] **2.4. Gift History Management**
  - [ ] Tạo `src/services/giftHistory.service.ts`
  - [ ] CRUD operations cho gift history
  - [ ] Link gift với event và person

- [ ] **2.5. UI Components**
  - [ ] Tạo `src/components/GiftSuggestionCard.tsx` - Card hiển thị gợi ý quà
  - [ ] Tạo `src/components/GiftSuggestionList.tsx` - Danh sách gợi ý
  - [ ] Tạo `src/components/BudgetSlider.tsx` - Chọn budget range
  - [ ] Tạo `src/components/GiftHistoryItem.tsx` - Hiển thị quà đã tặng

- [ ] **2.6. Screens**
  - [ ] Tạo `src/screens/GiftSuggestionsScreen.tsx`
  - [ ] Input: budget slider, regenerate button
  - [ ] Display: top 3-5 suggestions với giá, link mua
  - [ ] Add to gift history button

- [ ] **2.7. Integration**
  - [ ] Update EventDetailScreen: thêm button "🎁 Gợi ý quà"
  - [ ] Link đến GiftSuggestionsScreen
  - [ ] Show gift history trong EventDetailScreen

- [ ] **2.8. Testing**
  - [ ] Test OpenAI API call
  - [ ] Test với nhiều loại event khác nhau
  - [ ] Test fallback khi API fail
  - [ ] Test gift history CRUD
  - [ ] Manual UI testing

**Ghi chú:**
_Tham khảo specs Section 2.3 - Gợi ý Thông minh_

---

### ✅ Task 3: Checklist System
**Mức độ:** 🔴 CRITICAL
**Ước lượng:** 3-4 ngày
**Trạng thái:** ⏳ Chưa bắt đầu

#### Subtasks:
- [ ] **1.1. Database Schema**
  - [ ] Tạo bảng `checklist_items` (id, event_id, title, is_completed, due_days_before, order, created_at, updated_at)
  - [ ] Migration script
  - [ ] Test migration

- [ ] **1.2. Checklist Templates**
  - [ ] Tạo `src/data/checklistTemplates.ts`
  - [ ] Template cho birthday: [Đặt quà (5 ngày trước), Mua quà (3 ngày), Viết thiệp (1 ngày), etc]
  - [ ] Template cho anniversary: [Đặt nhà hàng (7 ngày), Mua quà (5 ngày), Chuẩn bị outfit (1 ngày), etc]
  - [ ] Template cho holiday: tùy theo loại
  - [ ] Template mặc định cho other events

- [ ] **1.3. Service Layer**
  - [ ] Tạo `src/services/checklist.service.ts`
  - [ ] Function `generateChecklistForEvent(eventId, eventType)`
  - [ ] CRUD operations: addItem, updateItem, deleteItem, toggleComplete
  - [ ] Reorder items

- [ ] **1.4. UI Components**
  - [ ] Tạo `src/components/ChecklistItem.tsx` - Single checklist item với checkbox
  - [ ] Tạo `src/components/ChecklistSection.tsx` - Nhóm checklist items
  - [ ] Tạo `src/components/ChecklistProgress.tsx` - Progress bar (3/5 completed)

- [ ] **1.5. Integration**
  - [ ] Update EventDetailScreen:
    - [ ] Hiển thị checklist section
    - [ ] Show progress (✅ 3/5 hoàn thành)
    - [ ] Add custom item button
    - [ ] Toggle complete/incomplete
    - [ ] Delete item
  - [ ] Update EventCard (HomeScreen):
    - [ ] Mini progress indicator
    - [ ] "❌ Chưa mua quà" hoặc "✅ Đã đặt nhà hàng"

- [ ] **1.6. Auto-generation**
  - [ ] Auto-generate checklist khi tạo event mới
  - [ ] Based on event tags (birthday, anniversary, etc)
  - [ ] Allow user customization sau khi tạo

- [ ] **1.7. Testing**
  - [ ] Test checklist generation
  - [ ] Test toggle complete/incomplete
  - [ ] Test add/delete custom items
  - [ ] Test progress calculation
  - [ ] Manual UI testing

**Ghi chú:**
_Tham khảo specs Section 2.5 - Checklist Chuẩn bị_

---

### ✅ Task 2: AI Gift Suggestions System
**Mức độ:** 🔴 CRITICAL
**Ước lượng:** 4-5 ngày
**Trạng thái:** ✅ **HOÀN THÀNH** (2026-01-30)
**Commit:** e600d91

#### Subtasks:
- [ ] **2.1. OpenAI Integration Setup**
  - [ ] Đăng ký OpenAI API key
  - [ ] Thêm `OPENAI_API_KEY` vào `.env`
  - [ ] Cài đặt package: `npm install openai`
  - [ ] Tạo wrapper service cho OpenAI API

- [ ] **2.2. Database Schema**
  - [ ] Tạo bảng `gift_history` (id, event_id, gift_name, price, rating, notes, purchased_at)
  - [ ] Migration script (BỎ person_id field)
  - [ ] Test migration

- [ ] **2.3. Service Layer**
  - [ ] Tạo `src/services/giftSuggestion.service.ts`
  - [ ] Function `generateGiftSuggestions(eventId, budget)`
  - [ ] Build prompt template dựa trên:
    - Event title (parse bằng AI)
    - Event tags (birthday, anniversary, wife, husband, etc)
    - Budget range
    - Lịch sử quà đã tặng (tránh trùng)
  - [ ] Parse OpenAI response
  - [ ] Fallback suggestions nếu API fail

- [ ] **2.4. Gift History Management**
  - [ ] Tạo `src/services/giftHistory.service.ts`
  - [ ] CRUD operations cho gift history
  - [ ] Link gift với event

- [ ] **2.5. UI Components**
  - [ ] Tạo `src/components/GiftSuggestionCard.tsx` - Card hiển thị gợi ý quà
  - [ ] Tạo `src/components/GiftSuggestionList.tsx` - Danh sách gợi ý
  - [ ] Tạo `src/components/BudgetSlider.tsx` - Chọn budget range
  - [ ] Tạo `src/components/GiftHistoryItem.tsx` - Hiển thị quà đã tặng

- [ ] **2.6. Screens**
  - [ ] Tạo `src/screens/GiftSuggestionsScreen.tsx`
  - [ ] Input: budget slider, regenerate button
  - [ ] Display: top 3-5 suggestions với giá, link mua
  - [ ] Add to gift history button

- [ ] **2.7. Integration**
  - [ ] Update EventDetailScreen: thêm button "🎁 Gợi ý quà"
  - [ ] Link đến GiftSuggestionsScreen
  - [ ] Show gift history trong EventDetailScreen

- [ ] **2.8. Testing**
  - [ ] Test OpenAI API call
  - [ ] Test với nhiều loại event khác nhau
  - [ ] Test fallback khi API fail
  - [ ] Test gift history CRUD
  - [ ] Manual UI testing

**Ghi chú:**
_Tham khảo specs Section 2.3 - Gợi ý Thông minh_
_AI có thể gợi ý quà dựa vào event title + tags, không cần person data riêng_

---

### ✅ Task 3: Notification Reliability Improvements
**Mức độ:** 🔴 CRITICAL
**Ước lượng:** 3-4 ngày
**Trạng thái:** ✅ **HOÀN THÀNH** (2026-01-30)
**Commit:** f2de9f4

#### Subtasks:
- [ ] **3.1. Notification Logging & Monitoring**
  - [ ] Tạo bảng `notification_logs` (id, event_id, scheduled_at, delivered_at, status, error_message)
  - [ ] Log mọi notification được schedule
  - [ ] Log delivery status (success/failed)
  - [ ] Track error messages

- [ ] **3.2. Redundancy System**
  - [ ] Implement dual notification system:
    - [ ] Primary: Push notification (expo-notifications)
    - [ ] Backup: Email notification (nếu có email)
  - [ ] Schedule backup 2h sau nếu primary fail
  - [ ] Critical events (1 day before): gửi cả push + email

- [ ] **3.3. Confirmation Mechanism**
  - [ ] Thêm "Đã nhận thông báo?" button trong notification
  - [ ] Track user confirmation
  - [ ] Escalation: nếu không confirm sau 2h → gửi lại

- [ ] **3.4. Service Layer Improvements**
  - [ ] Update `src/services/notification.service.ts`:
    - [ ] Add retry logic (3 attempts)
    - [ ] Exponential backoff
    - [ ] Better error handling
    - [ ] Validate notification scheduled successfully

- [ ] **3.5. Testing & Validation**
  - [ ] Test notification scheduling
  - [ ] Test delivery on different Android versions
  - [ ] Test app killed scenarios
  - [ ] Test device reboot scenarios
  - [ ] Verify background task works reliably

- [ ] **3.6. Debug Tools**
  - [ ] Enhance NotificationDebugScreen:
    - [ ] Show all scheduled notifications
    - [ ] Show delivery logs
    - [ ] Manual trigger for testing
    - [ ] Clear all notifications

- [ ] **3.7. Documentation**
  - [ ] Document notification flow
  - [ ] Troubleshooting guide
  - [ ] Best practices

**Ghi chú:**
_Tham khảo specs Section 4.3 - Notification System Architecture_
_Git history cho thấy nhiều bug về notifications - cần fix triệt để_

---

## 📅 PHASE 2: ENHANCED EXPERIENCE (1-2 tuần)

### ✅ Task 4: Dashboard Enhancements
**Mức độ:** 🟡 IMPORTANT
**Ước lượng:** 3-4 ngày
**Trạng thái:** ⏳ Chưa bắt đầu

#### Subtasks:
- [ ] **4.1. Countdown Timer Component**
  - [ ] Update `src/components/CountdownTimer.tsx`
  - [ ] Real-time countdown (days, hours, minutes)
  - [ ] Hiển thị trên EventCard
  - [ ] Highlight khi còn < 3 ngày

- [ ] **4.2. Progress Indicators**
  - [ ] Update EventCard component:
    - [ ] Show checklist progress bar
    - [ ] "✅ Đã mua quà" hoặc "❌ Chưa book nhà hàng"
    - [ ] Visual indicator cho completion %

- [ ] **4.3. Quick Actions**
  - [ ] Thêm quick action buttons trên EventDetailScreen:
    - [ ] "Đã mua quà?" → toggle checklist item
    - [ ] "Đã đặt nhà hàng?" → toggle checklist item
    - [ ] "Xem gợi ý quà" → navigate to suggestions

- [ ] **4.4. Testing**
  - [ ] Test countdown timer accuracy
  - [ ] Test progress calculations
  - [ ] Test quick actions
  - [ ] Manual UI testing

**Ghi chú:**
_Tham khảo specs Section 2.4 - Dashboard và Timeline_

---

### ✅ Task 5: Activity Suggestions
**Mức độ:** 🟡 IMPORTANT
**Ước lượng:** 4-5 ngày
**Trạng thái:** ⏳ Chưa bắt đầu

#### Subtasks:
- [ ] **5.1. Database Schema**
  - [ ] Tạo bảng `activity_suggestions` (id, name, category, location, price_range, rating, booking_url)
  - [ ] Seed data: danh sách nhà hàng, địa điểm phổ biến

- [ ] **5.2. Service Layer**
  - [ ] Tạo `src/services/activitySuggestion.service.ts`
  - [ ] Function `suggestRestaurants(cuisine, location, budget)`
  - [ ] Function `suggestActivities(activityType, location)`
  - [ ] Integration với Google Places API (optional)

- [ ] **5.3. UI Components**
  - [ ] Tạo `src/components/ActivityCard.tsx`
  - [ ] Tạo `src/components/RestaurantCard.tsx`
  - [ ] Show: name, location, price range, rating
  - [ ] Booking button (link to external)

- [ ] **5.4. Screens**
  - [ ] Tạo `src/screens/ActivitySuggestionsScreen.tsx`
  - [ ] Tabs: Nhà hàng | Hoạt động | Địa điểm
  - [ ] Filters: budget, location, category

- [ ] **5.5. Booking Integration**
  - [ ] Deep links to:
    - [ ] Foody, ShopeeFood (restaurants)
    - [ ] CGV, Tiki (movie tickets)
    - [ ] Google Maps (directions)

- [ ] **5.6. Testing**
  - [ ] Test suggestions generation
  - [ ] Test booking links
  - [ ] Manual UI testing

**Ghi chú:**
_Tham khảo specs Section 2.3 - Gợi ý hoạt động_

---

### ✅ Task 6: Analytics Dashboard
**Mức độ:** 🟡 IMPORTANT
**Ước lượng:** 2-3 ngày
**Trạng thái:** ⏳ Chưa bắt đầu

#### Subtasks:
- [ ] **6.1. Analytics Service**
  - [ ] Tạo `src/services/analytics.service.ts`
  - [ ] Calculate stats:
    - [ ] Total events
    - [ ] Upcoming vs past events
    - [ ] Events by tag/category
    - [ ] Events by person
    - [ ] Total gifts given
    - [ ] Average spending

- [ ] **6.2. UI Components**
  - [ ] Tạo `src/components/StatCard.tsx` - Card hiển thị số liệu
  - [ ] Tạo `src/components/PieChart.tsx` - Chart phân bố events
  - [ ] Tạo `src/components/BarChart.tsx` - Chart spending over time

- [ ] **6.3. Analytics Screen**
  - [ ] Update `src/screens/AnalyticsScreen.tsx` (nếu đã có)
  - [ ] Hoặc tạo mới nếu chưa có
  - [ ] Sections:
    - [ ] Overview stats (total, upcoming, past)
    - [ ] Events by tag (pie chart)
    - [ ] Gift spending trends

- [ ] **6.4. Testing**
  - [ ] Test calculations
  - [ ] Test charts rendering
  - [ ] Manual UI testing

**Ghi chú:**
_Tham khảo specs Section 8 - SUCCESS METRICS_

---

## 📅 PHASE 3: ADVANCED FEATURES (1-2 tuần)

### ✅ Task 7: Gamification System
**Mức độ:** 🟢 NICE TO HAVE
**Ước lượng:** 3-4 ngày
**Trạng thái:** ⏳ Chưa bắt đầu

#### Subtasks:
- [ ] **7.1. Database Schema**
  - [ ] Tạo bảng `user_stats` (user_id, current_streak, longest_streak, total_events, badges)
  - [ ] Tạo bảng `achievements` (id, user_id, badge_type, earned_at)

- [ ] **7.2. Badge System**
  - [ ] Define badges:
    - [ ] "Perfect Partner" - 10 events không quên
    - [ ] "Thoughtful" - 5 quà được rate 5 sao
    - [ ] "Streak Master" - 30 ngày streak
    - [ ] "Planner" - 20 checklists hoàn thành 100%
  - [ ] Badge icons/images

- [ ] **7.3. Streak Tracking**
  - [ ] Tạo `src/services/streak.service.ts`
  - [ ] Calculate daily streak (không quên event nào)
  - [ ] Reset streak khi miss event
  - [ ] Update streak khi complete event

- [ ] **7.4. UI Components**
  - [ ] Tạo `src/components/StreakBadge.tsx` - Show current streak
  - [ ] Tạo `src/components/BadgeCard.tsx` - Display earned badge
  - [ ] Tạo `src/components/AchievementPopup.tsx` - Celebrate new badge

- [ ] **7.5. Integration**
  - [ ] Update SettingsScreen: show badges & stats
  - [ ] Update HomeScreen: show current streak
  - [ ] Trigger achievement popup khi earn badge

- [ ] **7.6. Testing**
  - [ ] Test streak calculation
  - [ ] Test badge earning logic
  - [ ] Manual UI testing

**Ghi chú:**
_Tham khảo specs Section 3.4 - Gamification_

---

### ✅ Task 8: Premium Features Setup
**Mức độ:** 🟢 NICE TO HAVE
**Ước lượng:** 3-4 ngày
**Trạng thái:** ⏳ Chưa bắt đầu

#### Subtasks:
- [ ] **8.1. In-App Purchase Setup**
  - [ ] Cài đặt `expo-in-app-purchases` hoặc `react-native-iap`
  - [ ] Setup products:
    - [ ] Monthly: $4.99
    - [ ] Yearly: $49.99

- [ ] **8.2. Paywall Logic**
  - [ ] Tạo `src/services/premium.service.ts`
  - [ ] Check premium status
  - [ ] Unlock features:
    - [ ] Free: max 10 events
    - [ ] Premium: unlimited

- [ ] **8.3. UI Components**
  - [ ] Tạo `src/screens/PremiumScreen.tsx` - Paywall
  - [ ] Feature comparison table
  - [ ] Purchase buttons

- [ ] **8.4. Feature Gating**
  - [ ] Block adding >10 events if free
  - [ ] Show upgrade prompt

- [ ] **8.5. Testing**
  - [ ] Test purchase flow (sandbox)
  - [ ] Test feature gating
  - [ ] Test restore purchases

**Ghi chú:**
_Tham khảo specs Section 3.5 & 6.1 - Premium Features_

---

### ✅ Task 9: Testing & Bug Fixes
**Mức độ:** 🟢 NICE TO HAVE
**Ước lượng:** 2-3 ngày
**Trạng thái:** ⏳ Chưa bắt đầu

#### Subtasks:
- [ ] **9.1. End-to-End Testing**
  - [ ] Test full user flow: onboarding → add event → notifications
  - [ ] Test edge cases: leap year, lunar calendar, timezone
  - [ ] Test offline mode
  - [ ] Test sync after offline

- [ ] **9.2. Bug Fixes từ Git History**
  - [ ] Review recent commits về notification bugs
  - [ ] Fix NullPointerException issues
  - [ ] Ensure SQLite INSERT works reliably

- [ ] **9.3. Performance Optimization**
  - [ ] Profile app performance
  - [ ] Optimize database queries
  - [ ] Lazy load images
  - [ ] Reduce re-renders

- [ ] **9.4. Code Quality**
  - [ ] Remove unused code
  - [ ] Consistent code style
  - [ ] Add JSDoc comments
  - [ ] TypeScript strict mode

- [ ] **9.5. Documentation**
  - [ ] Update README.md
  - [ ] API documentation
  - [ ] Setup guide
  - [ ] Troubleshooting guide

**Ghi chú:**
_Final polish before launch_

---

## 📊 TRACKING & METRICS

### Definition of Done (DoD)
Một task được coi là hoàn thành khi:
- ✅ Code được implement đầy đủ
- ✅ Không có TypeScript errors
- ✅ Database migrations chạy thành công
- ✅ UI hoạt động đúng trên Android
- ✅ Đã test manually các flows chính
- ✅ Không có regression bugs
- ✅ Code được commit với message rõ ràng

### Review Checkpoints
- **Sau Phase 1:** Review toàn bộ core features
- **Sau Phase 2:** Review UX/UI improvements
- **Sau Phase 3:** Final review trước launch

---

## 🔗 REFERENCES

- [App Specification](./important_dates_app_spec.md)
- [Database Schema](../src/services/database.service.ts)
- [Type Definitions](../src/types/index.ts)

---

## 📝 NOTES & DECISIONS

### 2026-01-30 - Morning
- ✅ Checklist được tạo
- 📋 Ưu tiên Phase 1 trước (core features thiếu)
- 🎯 Mục tiêu: hoàn thành Phase 1 trong 2 tuần

### 2026-01-30 - Afternoon
- ✅ REMOVED Task 1: Person Management System
  - Lý do: Event title đã đủ info, privacy concerns, tăng complexity không cần thiết
  - AI suggestions vẫn hoạt động tốt chỉ với event title + tags
- 🚀 START Task 1: Checklist System (quick win)
- 📊 Updated task numbers: 9 tasks (từ 10 tasks)

### 2026-01-30 - Evening
- ✅ COMPLETED Task 1: Checklist System
  - Database schema + service layer + UI components + integration
  - Auto-generate checklist based on event tags
  - Full CRUD operations with progress tracking
  - Commit: 603310f
- ✅ COMPLETED Task 2: AI Gift Suggestions System
  - OpenAI integration with gpt-4o-mini model
  - Gift history database + service layer
  - Full UI with suggestions + history tabs
  - Fallback to predefined suggestions if API fails
  - Context-aware: analyzes event tags, budget, preferences, past gifts
  - Commit: e600d91
- ✅ COMPLETED Task 3: Notification Reliability Improvements
  - notification_logs table for tracking
  - notificationLog.service.ts with 13 functions
  - notificationEnhanced.service.ts with retry logic & delivery tracking
  - Exponential backoff retry (3 attempts)
  - Statistics & monitoring built-in
  - Commit: f2de9f4
- 🎉 **Phase 1 Progress: 3/3 tasks completed (100%)** - PHASE 1 HOÀN THÀNH!

### Decisions Log
_Ghi lại các quyết định quan trọng trong quá trình development_

---

## ❓ QUESTIONS & BLOCKERS

### Open Questions
_Ghi lại các câu hỏi cần giải đáp_

### Blockers
_Ghi lại các vấn đề đang block tiến độ_

---

**Last Updated:** 2026-01-30
**Next Review:** Sau khi hoàn thành Task 1
