# Love Date App - Ứng dụng Nhắc Nhở Ngày Quan Trọng

Mobile App React Native Expo - Offline-First Architecture với tính năng Premium và Gamification

## Tính năng chính

- ✅ **100% Offline**: Hoạt động hoàn toàn offline với SQLite local database
- ✅ **Auto Sync**: Tự động đồng bộ với backend khi có Internet
- ✅ **Local Notifications**: Nhắc nhở ngay cả khi không có mạng
- ✅ **Âm lịch**: Hỗ trợ chuyển đổi Dương lịch / Âm lịch
- ✅ **Firebase Auth**: Đăng nhập an toàn với Firebase
- ✅ **Conflict Resolution**: Xử lý xung đột dữ liệu thông minh
- ✅ **Checklist & Todo**: Quản lý công việc chuẩn bị cho sự kiện
- ✅ **Gift Suggestions**: Gợi ý quà tặng thông minh theo sự kiện
- ✅ **Budget Tracking**: Theo dõi chi phí quà tặng và mua sắm
- ✅ **Analytics Dashboard**: Phân tích thống kê và insights
- ✅ **Activity Suggestions**: Gợi ý hoạt động phù hợp cho từng sự kiện
- ✅ **Gamification**: Hệ thống streak và achievement badges
- ✅ **Premium Features**: Gói Premium với tính năng cao cấp

## Cấu trúc Source Code

```
src/
├── types/                    # TypeScript types & interfaces
│   └── index.ts             # All type definitions
│
├── constants/                # App constants
│   ├── config.ts            # API URLs, timeouts, etc.
│   ├── colors.ts            # Color palette
│   └── strings.ts           # Text strings (i18n ready)
│
├── utils/                    # Helper utilities
│   ├── date.utils.ts        # Date formatting & countdown
│   ├── notification.utils.ts # Notification helpers
│   └── validation.utils.ts  # Form validation
│
├── services/                 # Business logic layer
│   ├── database.service.ts  # SQLite operations (9 tables)
│   ├── notification.service.ts # Local notifications
│   ├── auth.service.ts      # Firebase authentication
│   ├── api.service.ts       # HTTP client (Axios)
│   ├── sync.service.ts      # Sync with backend
│   ├── lunar.service.ts     # Lunar calendar conversion
│   ├── analytics.service.ts # Analytics & insights
│   ├── activities.service.ts # Activity suggestions
│   ├── streak.service.ts    # Gamification & badges
│   └── premium.service.ts   # Premium subscriptions
│
├── store/                    # State management (Context API)
│   ├── AuthContext.tsx      # Authentication state
│   ├── EventsContext.tsx    # Events management
│   ├── SyncContext.tsx      # Sync status
│   └── AchievementContext.tsx # Achievement popups
│
├── components/               # Reusable UI components
│   ├── EventCard.tsx        # Event display card
│   ├── CountdownTimer.tsx   # Countdown component
│   ├── CategoryPicker.tsx   # Category selector
│   ├── DatePicker.tsx       # Date picker
│   ├── ReminderSettings.tsx # Reminder configuration
│   ├── GiftSuggestions.tsx  # Gift suggestion list
│   ├── StreakBadge.tsx      # Streak display badge
│   ├── BadgeCard.tsx        # Achievement badge
│   └── AchievementPopup.tsx # Achievement celebration
│
├── screens/                  # App screens
│   ├── HomeScreen.tsx       # Dashboard with events
│   ├── AddEventScreen.tsx   # Create new event
│   ├── EditEventScreen.tsx  # Edit existing event
│   ├── EventDetailScreen.tsx # Event details & actions
│   ├── CalendarScreen.tsx   # Calendar view
│   ├── SettingsScreen.tsx   # Settings & achievements
│   ├── AuthScreen.tsx       # Login/Register
│   ├── AnalyticsScreen.tsx  # Analytics dashboard
│   └── PremiumScreen.tsx    # Premium paywall
│
└── navigation/               # React Navigation
    ├── AppNavigator.tsx     # Main stack navigator
    ├── AuthNavigator.tsx    # Auth flow
    └── TabNavigator.tsx     # Bottom tabs
```

## Yêu cầu hệ thống

- Node.js >= 18.x
- npm hoặc yarn
- Expo CLI
- iOS Simulator / Android Emulator (hoặc thiết bị thật)

## Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình Firebase

1. Tạo project tại [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password và Google Sign-In)
3. Tải Service Account Key
4. Cập nhật Firebase config trong `src/constants/config.ts`:

```typescript
export const FIREBASE_CONFIG = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};
```

5. Thêm Firebase config files:
   - Android: `android/app/google-services.json`
   - iOS: `ios/GoogleService-Info.plist`

### 3. Cấu hình Backend API

Cập nhật API URL trong `src/constants/config.ts`:

```typescript
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'       // Development
  : 'https://your-api.com/api';       // Production
```

## Chạy ứng dụng

### Development Mode

```bash
# Start Expo dev server
npm start

# Chạy trên Android
npm run android

# Chạy trên iOS (chỉ macOS)
npm run ios

# Chạy trên web
npm run web
```

### Scan QR Code

1. Chạy `npm start`
2. Quét QR code bằng:
   - **Android**: Expo Go app
   - **iOS**: Camera app (hoặc Expo Go)

## Kiến trúc Offline-First

### Cách hoạt động:

```
User thao tác → Lưu ngay vào SQLite local → UI update ngay lập tức
                         ↓
            Đánh dấu needsSync = 1
                         ↓
            SyncService chạy background
                         ↓
        Kiểm tra Internet → Có → Sync lên server
                           ↓
                    Server xử lý và trả về
                           ↓
                Update local với server changes
```

### Database Schema (SQLite)

App sử dụng 9 bảng trong SQLite:

**1. events** - Sự kiện
- `id`, `title`, `description`, `eventDate`, `isLunarCalendar`, `category`
- `reminderSettings`, `needsSync`, `version`, `isDeleted`
- `createdAt`, `updatedAt`

**2. checklist_items** - Công việc chuẩn bị
- `id`, `eventId`, `task`, `isCompleted`, `order`, `createdAt`

**3. gifts** - Quà tặng
- `id`, `eventId`, `giftName`, `price`, `isPurchased`, `purchaseDate`
- `rating`, `notes`, `createdAt`

**4. activities** - Hoạt động gợi ý
- `id`, `eventId`, `activityName`, `duration`, `cost`, `isCompleted`
- `notes`, `createdAt`

**5. analytics_events** - Analytics tracking
- `id`, `userId`, `eventType`, `eventData`, `timestamp`

**6. user_stats** - Thống kê người dùng
- `id`, `userId`, `currentStreak`, `longestStreak`
- `totalEventsCreated`, `totalEventsCompleted`, `totalChecklistsCompleted`
- `totalGiftsPurchased`, `lastActivityDate`

**7. achievements** - Thành tựu
- `id`, `userId`, `badgeType`, `badgeName`, `badgeDescription`
- `earnedAt`, `notified`

**8. premium_subscriptions** - Gói Premium
- `id`, `userId`, `subscriptionType`, `status`, `productId`
- `purchaseDate`, `expiryDate`, `purchaseToken`, `autoRenew`, `platform`

**9. sync_queue** - Hàng đợi đồng bộ (future use)

## Services Layer

### DatabaseService
```typescript
import * as DatabaseService from './services/database.service';

// Initialize database
await DatabaseService.initDatabase();

// CRUD operations
const event = await DatabaseService.createEvent({...});
const events = await DatabaseService.getAllEvents();
await DatabaseService.updateEvent(id, {...});
await DatabaseService.softDeleteEvent(id);
```

### NotificationService
```typescript
import * as NotificationService from './services/notification.service';

// Initialize
await NotificationService.initNotifications();

// Schedule notifications
await NotificationService.scheduleEventNotifications(event);

// Cancel notifications
await NotificationService.cancelEventNotifications(eventId);
```

### AnalyticsService
```typescript
import * as AnalyticsService from './services/analytics.service';

// Track events
await AnalyticsService.trackEvent(db, 'event_created', { category: 'birthday' });

// Get insights
const insights = await AnalyticsService.getEventInsights(db, userId);

// Get monthly stats
const stats = await AnalyticsService.getMonthlyStats(db, userId);
```

### ActivitiesService
```typescript
import * as ActivitiesService from './services/activities.service';

// Get activity suggestions
const activities = await ActivitiesService.getActivitySuggestions(category);

// Track activity
await ActivitiesService.createActivity(db, eventId, activityData);

// Complete activity
await ActivitiesService.completeActivity(db, activityId);
```

### StreakService (Gamification)
```typescript
import * as StreakService from './services/streak.service';

// Get user stats
const stats = await StreakService.getUserStats(db, userId);

// Track actions
const newBadges = await StreakService.trackEventCreated(db, userId);

// Get achievements
const achievements = await StreakService.getUserAchievements(db, userId);
```

### PremiumService
```typescript
import * as PremiumService from './services/premium.service';

// Check premium status
const { isPremium } = await PremiumService.checkPremiumStatus(db, userId);

// Check feature access
const { canCreate, reason } = await PremiumService.canCreateEvent(db, userId);

// Mock purchase (development)
await PremiumService.mockPurchase(db, userId, productId, platform);
```

## Utils

### DateUtils
```typescript
import { DateUtils } from './utils/date.utils';

// Format date
const formatted = DateUtils.formatDate(new Date()); // "27/11/2025"

// Get countdown
const countdown = DateUtils.getCountdown(eventDate);
// { isPast, days, hours, minutes, seconds, displayText }

// Check if today
const isToday = DateUtils.isToday(date);
```

### ValidationUtils
```typescript
import { ValidationUtils } from './utils/validation.utils';

// Validate email
const isValid = ValidationUtils.isValidEmail(email);

// Validate event form
const errors = ValidationUtils.validateEventForm(formData);
```

## Testing & Quality Assurance

### Manual Testing Guide

Xem chi tiết trong [docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md)

**End-to-End Test Flows:**
1. First Time User Flow (onboarding → create event → notification)
2. Multiple Events Management (CRUD operations)
3. Checklist Workflow (create → complete → track)
4. Gift Suggestions Flow (browse → purchase → rate)
5. Premium Upgrade Flow (hit limit → upgrade → unlock)

**Testing Offline Mode:**
1. Mở app và đăng nhập
2. Thêm vài events với checklist và gifts
3. **Tắt WiFi và Mobile Data**
4. Thử thêm/sửa/xóa events → Vẫn hoạt động bình thường
5. Complete checklist items, mark gifts purchased
6. Bật lại Internet
7. Pull to refresh → Data tự động sync

**Testing Gamification:**
1. Create events on consecutive days to build streak
2. Complete checklists to earn badges
3. Check SettingsScreen for achievement display
4. Verify achievement popups appear correctly

**Testing Premium Features:**
1. Create 10 events as free user
2. Try to create 11th event → See upgrade prompt
3. Navigate to PremiumScreen
4. Select subscription plan and mock purchase
5. Verify unlimited event creation after upgrade

## Troubleshooting

### SQLite không hoạt động
```bash
# Clear cache và reinstall
rm -rf node_modules
npm install
expo start -c
```

### Notifications không hiển thị
- Kiểm tra quyền: Settings → App → Notifications
- Test với scheduled time gần (1-2 phút)
- Verify permissions trong code

### Sync thất bại
- Kiểm tra backend server đang chạy
- Verify API URL trong config
- Check JWT token chưa expire
- Xem console logs để debug

### Firebase Auth lỗi
- Verify Firebase config files đúng
- Check Firebase console: Authentication enabled
- Verify SHA-1 fingerprint (Android)

## Feature Highlights

### 🎯 Event Management
- Create unlimited events (Premium) or 10 events (Free)
- Support for both Solar and Lunar calendars
- Event categories: Birthday, Anniversary, Holiday, Other
- Custom reminders (minutes, hours, days before)
- Edit and soft-delete events
- Countdown timer to event date

### ✅ Checklist & Tasks
- Task lists for event preparation
- Mark tasks as complete/incomplete
- Track completion percentage
- Drag-and-drop reordering
- Automatic stats tracking

### 🎁 Gift Management
- Smart gift suggestions by event category
- Budget tracking per gift
- Purchase status tracking
- 5-star rating system
- Notes and photos support

### 📊 Analytics & Insights
- Monthly/Yearly event statistics
- Spending analysis and budget tracking
- Category breakdown charts
- Most frequent categories
- Average spending insights
- Event completion rates

### 🎮 Gamification
- Daily streak tracking (flame icon)
- 9 achievement badges to unlock:
  - Events: Beginner, Perfect Partner, Early Bird
  - Streak: Consistent (7 days), Streak Master (30 days)
  - Checklist: Planner, Organizer
  - Gifts: Thoughtful, Generous
- Animated achievement popups
- Personal best streak tracking

### ⭐ Premium Features
- **Free Tier**: 10 events maximum
- **Monthly Plan**: 99,000đ/month
- **Yearly Plan**: 990,000đ/year (save 17%)
- Premium benefits:
  - Unlimited events
  - Advanced analytics
  - Priority support
  - Custom themes
  - Data export
  - Ad-free experience

### 🔔 Smart Notifications
- Local notifications (works offline)
- Multiple reminders per event
- Custom reminder times
- Lunar calendar event reminders

### 📱 Offline-First
- 100% functional without internet
- SQLite local database
- Auto-sync when online
- Conflict resolution
- Queue-based sync system

## Build Production

### Android APK/AAB
```bash
eas build --platform android
```

### iOS IPA
```bash
eas build --platform ios
```

### OTA Updates (không qua app store)
```bash
eas update
```

## Tính năng đã hoàn thành (100%)

### Phase 1: Core Features (3/3 tasks ✅)
- [x] **Task 1**: UI Components & Screens
  - EventCard, CountdownTimer, CategoryPicker, DatePicker
  - HomeScreen, AddEventScreen, EditEventScreen, EventDetailScreen
  - Calendar view with event display
- [x] **Task 2**: State Management
  - AuthContext, EventsContext, SyncContext
  - Context providers integrated in App.tsx
- [x] **Task 3**: Navigation & Integration
  - Stack and Tab navigation
  - Bottom tab bar (Home, Calendar, Settings)
  - Screen transitions and deep linking

### Phase 2: Enhanced Features (3/3 tasks ✅)
- [x] **Task 4**: Checklist & Todo System
  - Checklist items per event
  - Task completion tracking
  - Drag-and-drop reordering
- [x] **Task 5**: Gift Suggestions & Budget Tracking
  - Smart gift suggestions by category
  - Purchase tracking and budget management
  - 5-star rating system
- [x] **Task 6**: Analytics Dashboard
  - Event statistics and insights
  - Monthly/yearly reports
  - Spending analysis
  - Category breakdown

### Phase 3: Advanced Features (3/3 tasks ✅)
- [x] **Task 7**: Gamification System
  - Daily streak tracking (current + longest)
  - 9 achievement badges (events, streak, checklist, gifts)
  - StreakBadge and BadgeCard components
  - Achievement celebration popups
- [x] **Task 8**: Premium Features
  - Freemium model (10 event limit for free)
  - Premium subscription system (Monthly/Yearly plans)
  - Feature gating with upgrade prompts
  - PremiumScreen paywall UI
- [x] **Task 9**: Testing & Bug Fixes
  - Comprehensive testing guide
  - End-to-end test flows documented
  - Performance optimization checklist
  - Bug fixes from git history

### Technical Implementation
- [x] SQLite local database (9 tables)
- [x] Offline-first architecture
- [x] Local notifications with expo-notifications
- [x] Lunar calendar support
- [x] TypeScript types and interfaces
- [x] Service layer architecture
- [x] Context API state management
- [x] React Navigation v6
- [x] Expo SDK 52

## Documentation

Toàn bộ tài liệu chi tiết trong thư mục [docs/](./docs/):

- [IMPROVEMENT_CHECKLIST.md](./docs/IMPROVEMENT_CHECKLIST.md) - Tổng quan 9 tasks
- [TESTING_GUIDE.md](./docs/TESTING_GUIDE.md) - Hướng dẫn testing chi tiết
- [PHASE1_TASK1_UI_COMPONENTS.md](./docs/PHASE1_TASK1_UI_COMPONENTS.md) - UI Components
- [PHASE1_TASK2_STATE_MANAGEMENT.md](./docs/PHASE1_TASK2_STATE_MANAGEMENT.md) - State Management
- [PHASE1_TASK3_NAVIGATION.md](./docs/PHASE1_TASK3_NAVIGATION.md) - Navigation
- [PHASE2_TASK4_CHECKLIST.md](./docs/PHASE2_TASK4_CHECKLIST.md) - Checklist System
- [PHASE2_TASK5_GIFTS.md](./docs/PHASE2_TASK5_GIFTS.md) - Gift Suggestions
- [PHASE2_TASK6_ANALYTICS.md](./docs/PHASE2_TASK6_ANALYTICS.md) - Analytics Dashboard
- [PHASE3_TASK7_GAMIFICATION.md](./docs/PHASE3_TASK7_GAMIFICATION.md) - Gamification
- [PHASE3_TASK8_PREMIUM_FEATURES.md](./docs/PHASE3_TASK8_PREMIUM_FEATURES.md) - Premium Features

## Lưu ý quan trọng

1. **Offline-First** - App hoạt động 100% offline, test kỹ chế độ này
2. **Premium Features** - Free users giới hạn 10 events, Premium unlimited
3. **Gamification** - Daily streak và badges tăng engagement
4. **Version Control** - Mỗi thay đổi update version để xử lý conflicts
5. **Notifications** - Test trên thiết bị thật, emulator có thể không chính xác
6. **Firebase Config** - KHÔNG commit Firebase credentials lên Git
7. **Mock IAP** - Hiện tại dùng mock purchase, cần tích hợp expo-in-app-purchases cho production
8. **Database Migrations** - Schema tự động migrate khi app khởi động

## License

MIT

## Tác giả

Created with Claude Code
