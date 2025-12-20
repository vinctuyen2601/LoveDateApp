# NotificationContext

## Tổng quan

NotificationContext quản lý thông báo toàn cục (global notification banner) hiển thị trên tất cả các màn hình trong ứng dụng.

## Kiến trúc

```
App.tsx
└── NotificationProvider (wrap toàn bộ app)
    └── TabNavigator
        ├── GlobalNotificationBanner (hiển thị global)
        ├── HomeScreen
        ├── CalendarScreen
        ├── SuggestionsScreen
        └── SettingsScreen
```

## Cách hoạt động

### 1. NotificationProvider (src/store/NotificationContext.tsx)

Provider này:
- Tự động tính toán upcoming events (sự kiện sắp diễn ra trong 7 ngày tới)
- Chọn message phù hợp:
  - Nếu có upcoming events: hiển thị số lượng sự kiện
  - Nếu không có: hiển thị daily quote (câu trích dẫn theo ngày)
- Cung cấp các giá trị qua Context:
  - `message`: Nội dung thông báo
  - `icon`: Icon hiển thị (notifications hoặc book)
  - `upcomingEventsCount`: Số lượng sự kiện sắp tới
  - `hasUpcomingEvents`: Boolean cho biết có sự kiện sắp tới hay không

### 2. GlobalNotificationBanner (src/components/GlobalNotificationBanner.tsx)

Component này:
- Được đặt ở TabNavigator (global level)
- Tự động subscribe vào NotificationContext
- Luôn hiển thị trên mọi màn hình (Home, Calendar, Suggestions, Settings)
- Tự động cập nhật khi có thay đổi về events

### 3. NotificationBanner (src/components/NotificationBanner.tsx)

Component UI cơ bản:
- Nhận `message` và `icon` làm props
- Hiển thị banner cố định ở đầu màn hình
- Scroll ngang cho message dài

## Ưu điểm của kiến trúc này

### ✅ Centralized Logic
- Logic tính toán chỉ ở một nơi (NotificationContext)
- Dễ maintain và debug
- Tránh duplicate code

### ✅ Global Display
- Banner hiển thị trên tất cả màn hình
- Không cần import và thêm vào từng screen
- Consistent UI/UX

### ✅ Automatic Updates
- Tự động cập nhật khi events thay đổi
- Real-time reflection
- No manual refresh needed

### ✅ Easy Access
- Bất kỳ component nào cũng có thể access notification data
- Sử dụng hook `useNotification()`

## Cách sử dụng trong components khác

Nếu bạn cần truy cập notification data trong component khác:

```typescript
import { useNotification } from '../store/NotificationContext';

const YourComponent = () => {
  const { message, icon, upcomingEventsCount, hasUpcomingEvents } = useNotification();

  return (
    <View>
      <Text>{message}</Text>
      {hasUpcomingEvents && (
        <Text>Bạn có {upcomingEventsCount} sự kiện sắp tới!</Text>
      )}
    </View>
  );
};
```

## Customization

### Thay đổi thời gian upcoming events

Mặc định là 7 ngày, có thể thay đổi trong `NotificationContext.tsx`:

```typescript
const sevenDaysLater = addDays(now, 7); // Đổi 7 thành số ngày mong muốn
```

### Thêm quote mới

Thêm vào mảng `LOVE_QUOTES` trong `NotificationContext.tsx`:

```typescript
const LOVE_QUOTES = [
  "Quote mới của bạn 💕",
  // ... existing quotes
];
```

### Thay đổi icon

Sửa trong `NotificationContext.tsx`:

```typescript
icon: hasUpcomingEvents ? 'notifications' : 'heart' // Thay 'book' bằng 'heart'
```

## Dependencies

- `EventsContext`: Cung cấp danh sách events
- `date-fns`: Tính toán ngày tháng
- `@expo/vector-icons`: Icons

## Files liên quan

- `src/store/NotificationContext.tsx` - Provider và logic
- `src/components/GlobalNotificationBanner.tsx` - Global component wrapper
- `src/components/NotificationBanner.tsx` - UI component
- `src/navigation/TabNavigator.tsx` - Nơi đặt GlobalNotificationBanner
- `App.tsx` - Nơi wrap NotificationProvider
