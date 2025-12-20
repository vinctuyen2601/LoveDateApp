# Ứng dụng Nhắc Nhở Ngày Quan Trọng

Mobile App React Native Expo - Offline-First Architecture

## Tính năng chính

- ✅ **100% Offline**: Hoạt động hoàn toàn offline với SQLite local database
- ✅ **Auto Sync**: Tự động đồng bộ với backend khi có Internet
- ✅ **Local Notifications**: Nhắc nhở ngay cả khi không có mạng
- ✅ **Âm lịch**: Hỗ trợ chuyển đổi Dương lịch / Âm lịch
- ✅ **Firebase Auth**: Đăng nhập an toàn với Firebase
- ✅ **Conflict Resolution**: Xử lý xung đột dữ liệu thông minh

## Cấu trúc Source Code

```
src/
├── types/                    # TypeScript types & interfaces
│   └── index.ts
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
│   ├── database.service.ts  # SQLite operations
│   ├── notification.service.ts # Local notifications
│   ├── auth.service.ts      # Firebase authentication
│   ├── api.service.ts       # HTTP client (Axios)
│   ├── sync.service.ts      # Sync with backend
│   └── lunar.service.ts     # Lunar calendar conversion
│
├── store/                    # State management (Context API)
│   ├── AuthContext.tsx
│   ├── EventsContext.tsx
│   └── SyncContext.tsx
│
├── components/               # Reusable UI components
│   ├── EventCard.tsx
│   ├── CountdownTimer.tsx
│   ├── CategoryPicker.tsx
│   ├── DatePicker.tsx
│   ├── ReminderSettings.tsx
│   └── GiftSuggestions.tsx
│
├── screens/                  # App screens
│   ├── HomeScreen.tsx
│   ├── AddEventScreen.tsx
│   ├── EditEventScreen.tsx
│   ├── EventDetailScreen.tsx
│   ├── CalendarScreen.tsx
│   ├── SettingsScreen.tsx
│   └── AuthScreen.tsx
│
└── navigation/               # React Navigation
    ├── AppNavigator.tsx
    ├── AuthNavigator.tsx
    └── TabNavigator.tsx
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

**Bảng events:**
- `id`: Primary key
- `title`, `description`: Thông tin sự kiện
- `eventDate`: Ngày sự kiện (ISO string)
- `isLunarCalendar`: 0 = Dương lịch, 1 = Âm lịch
- `category`: birthday | anniversary | holiday | other
- `relationshipType`: wife | husband | child | parent | friend | colleague | other
- `reminderSettings`: JSON array các ngày nhắc trước
- `giftIdeas`: JSON array ý tưởng quà tặng
- `notes`: JSON array ghi chú theo năm
- `needsSync`: 0 = đã sync, 1 = cần sync
- `version`: Timestamp cho conflict resolution

## Services Layer

### DatabaseService
```typescript
import { databaseService } from './services/database.service';

// Initialize
await databaseService.init();

// CRUD operations
const event = await databaseService.createEvent({...});
const events = await databaseService.getAllEvents();
await databaseService.updateEvent(id, {...});
await databaseService.deleteEvent(id);
```

### NotificationService
```typescript
import { notificationService } from './services/notification.service';

// Initialize
await notificationService.init();

// Schedule notifications
await notificationService.scheduleEventNotifications(event);

// Cancel notifications
await notificationService.cancelEventNotifications(eventId);
```

### AuthService
```typescript
import { authService } from './services/auth.service';

// Login
const { user, tokens } = await authService.loginWithEmail(email, password);

// Register
const { user, tokens } = await authService.register(email, password, displayName);

// Auto login
const session = await authService.autoLogin();

// Logout
await authService.logout();
```

### SyncService
```typescript
import { syncService } from './services/sync.service';

// Start auto-sync (every 15 minutes)
syncService.startAutoSync();

// Force sync now
await syncService.forceSyncNow();

// Listen to sync status
syncService.addListener((status) => {
  console.log('Sync status:', status);
});
```

### LunarService
```typescript
import { lunarService } from './services/lunar.service';

// Convert solar to lunar
const lunar = lunarService.jsDateToLunar(new Date());

// Convert lunar to solar
const solarDate = lunarService.lunarToJsDate(lunarDate);

// Get next lunar occurrence
const nextDate = lunarService.getNextLunarOccurrence(lunarDate);
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

## Testing Offline Mode

1. Mở app và đăng nhập
2. Thêm vài events
3. **Tắt WiFi và Mobile Data**
4. Thử thêm/sửa/xóa events → Vẫn hoạt động bình thường
5. Bật lại Internet
6. Pull to refresh → Data tự động sync

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

## Build Production

### Android APK/AAB
```bash
expo build:android
```

### iOS IPA
```bash
expo build:ios
```

### OTA Updates (không qua app store)
```bash
expo publish
```

## Các tính năng đã implement

- [x] SQLite local database
- [x] Offline-first architecture
- [x] Local notifications
- [x] Firebase authentication
- [x] Auto-sync with backend
- [x] Conflict resolution
- [x] Lunar calendar support
- [x] TypeScript types
- [x] Utility helpers
- [x] Service layer architecture

## Tính năng cần implement (UI Layer)

- [ ] Context API (AuthContext, EventsContext, SyncContext)
- [ ] UI Components (EventCard, CountdownTimer, etc.)
- [ ] Screens (Home, AddEvent, EditEvent, etc.)
- [ ] Navigation setup
- [ ] App.tsx entry point

## Lưu ý quan trọng

1. **Luôn test offline mode** - Đây là tính năng chính của app
2. **Version control** - Mỗi thay đổi update version để xử lý conflicts
3. **Notifications** - Test trên thiết bị thật, emulator có thể không chính xác
4. **Firebase config** - KHÔNG commit Firebase credentials lên Git
5. **API timeout** - Set timeout hợp lý cho các API calls

## License

MIT

## Tác giả

Created with Claude Code
