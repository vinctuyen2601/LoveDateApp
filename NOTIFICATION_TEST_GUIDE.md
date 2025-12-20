# Hướng dẫn Test Notification khi App bị tắt

## Tổng quan các cải tiến đã thực hiện

### 1. Background Task Service
- **File**: `src/services/backgroundTask.service.ts`
- **Chức năng**: Tự động reschedule notifications mỗi 12 giờ, ngay cả khi app bị tắt
- **Platform support**:
  - iOS: Sử dụng background fetch
  - Android: Chạy sau khi device khởi động lại (RECEIVE_BOOT_COMPLETED)

### 2. Notification Persistence
- **Table mới**: `scheduled_notifications` trong SQLite database
- **Lưu trữ**: notification IDs, eventId, daysBefore, scheduledAt
- **Mục đích**: Track và restore notifications sau khi app bị kill hoặc device reboot

### 3. Cấu hình đã thêm

#### app.json
```json
{
  "ios": {
    "infoPlist": {
      "UIBackgroundModes": [
        "remote-notification",
        "fetch",           // Mới thêm
        "processing"       // Mới thêm
      ]
    }
  },
  "android": {
    "permissions": [
      "RECEIVE_BOOT_COMPLETED",  // Đã có
      "VIBRATE",                  // Đã có
      "USE_FULL_SCREEN_INTENT"   // Đã có
    ]
  },
  "plugins": [
    // ...existing plugins
    "expo-task-manager",        // Mới thêm
    "expo-background-fetch"     // Mới thêm
  ]
}
```

## Các bước test

### Test 1: Notification khi app ở background
1. Mở app và tạo một event với reminder trong vài phút tới
2. Nhấn Home button để đưa app vào background (KHÔNG force close)
3. Đợi đến thời gian reminder
4. **Kết quả mong đợi**: Notification hiển thị bình thường

### Test 2: Notification khi app bị force close
1. Mở app và tạo event với reminder trong vài phút tới
2. Force close app (swipe away từ app switcher)
3. Đợi đến thời gian reminder
4. **Kết quả mong đợi**: Notification vẫn hiển thị

### Test 3: Notification sau khi device reboot (Android)
1. Tạo event với reminder sau khi device khởi động lại
2. Reboot thiết bị Android
3. KHÔNG mở app
4. Đợi đến thời gian reminder
5. **Kết quả mong đợi**: Notification hiển thị

### Test 4: Background fetch task (iOS)
**Lưu ý**: iOS giới hạn background fetch, cần test trên device thật
1. Cài đặt app trên iPhone
2. Force close app
3. Đợi vài giờ (iOS sẽ tự động chạy background task)
4. Kiểm tra logs để xác nhận task đã chạy

### Test 5: Kiểm tra persistence
1. Tạo event với nhiều reminders
2. Kiểm tra database:
```javascript
// Trong app, log ra
const notifs = await databaseService.getScheduledNotifications(eventId);
console.log('Scheduled notifications:', notifs);
```
3. Force close và mở lại app
4. Kiểm tra lại database
5. **Kết quả mong đợi**: Notifications vẫn được lưu trong database

## Debug Commands

### Kiểm tra scheduled notifications
```javascript
// Trong app code hoặc debug console
const allScheduled = await notificationService.getAllScheduledNotifications();
console.log('All scheduled notifications:', allScheduled);
```

### Kiểm tra background task status
```javascript
const status = await backgroundTaskService.getStatus();
const isRegistered = await backgroundTaskService.isTaskRegistered();
console.log('Background fetch status:', status);
console.log('Task registered:', isRegistered);
```

### Kiểm tra notification IDs trong database
```javascript
const notificationIds = await databaseService.getAllScheduledNotificationIds();
console.log('Saved notification IDs:', notificationIds);
```

## Troubleshooting

### Notifications không hiển thị sau khi app bị tắt

**Nguyên nhân có thể:**
1. Permissions chưa được cấp đúng
2. Background task chưa được register
3. Device battery optimization kill app

**Giải pháp:**
```javascript
// Kiểm tra permissions
const permissions = await Notifications.getPermissionsAsync();
console.log('Permissions:', permissions);

// Re-register background task
await backgroundTaskService.unregisterBackgroundTask();
await backgroundTaskService.registerBackgroundTask();
```

### iOS không chạy background task

**Nguyên nhân:**
- iOS giới hạn background fetch rất nghiêm ngặt
- Chỉ chạy khi device đủ pin và có kết nối mạng
- Ưu tiên apps được sử dụng thường xuyên

**Giải pháp:**
- Test trên device thật, không phải simulator
- Sử dụng app thường xuyên trong vài ngày
- Kiểm tra Settings > General > Background App Refresh

### Android battery optimization

**Nguyên nhân:**
- Android có thể kill app để tiết kiệm pin
- Một số manufacturers (Xiaomi, Huawei) có battery optimization aggressively

**Giải pháp:**
- Hướng dẫn user disable battery optimization cho app
- Settings > Apps > [Your App] > Battery > Unrestricted

## Lưu ý quan trọng

### Giới hạn của Background Tasks

1. **iOS**:
   - Background fetch chỉ chạy khi system quyết định
   - Không đảm bảo chạy đúng 12 giờ 1 lần
   - Cần device có pin và kết nối mạng

2. **Android**:
   - Battery optimization có thể kill app
   - BOOT_COMPLETED chỉ trigger sau khi device reboot
   - Background service có thể bị restrict từ Android 8.0+

### Best Practices

1. **Scheduled Notifications**:
   - Expo notifications sử dụng exact alarms (Android) và local notifications (iOS)
   - Notifications được schedule sẽ fire ngay cả khi app bị tắt
   - KHÔNG cần app chạy để notifications hiển thị

2. **Background Tasks**:
   - Chỉ dùng để reschedule/sync notifications
   - Không phụ thuộc vào background task để fire notifications
   - Background task là "backup" mechanism

3. **Testing**:
   - Test trên device thật, không phải emulator/simulator
   - Test với nhiều scenarios khác nhau
   - Monitor battery usage

## Build cho Production

### Bước 1: Rebuild app với native changes
```bash
cd "Love Date App"
npx expo prebuild --clean
```

### Bước 2: Build cho Android
```bash
eas build --platform android
```

### Bước 3: Build cho iOS
```bash
eas build --platform ios
```

### Bước 4: Test trên device
- Install APK/IPA trên device thật
- Test tất cả scenarios ở trên

## Monitoring & Analytics

### Log notifications
```javascript
// Thêm vào notification listener
Notifications.addNotificationReceivedListener((notification) => {
  console.log('📱 Notification received:', {
    time: new Date().toISOString(),
    title: notification.request.content.title,
    eventId: notification.request.content.data?.eventId,
  });
});
```

### Log background task execution
```javascript
// Đã có trong backgroundTask.service.ts
console.log('[Background Task] Running notification reschedule task');
```

## Kết luận

Hệ thống notification hiện tại đã được cải thiện với:
1. ✅ Background task tự động reschedule
2. ✅ Persistence notification IDs vào database
3. ✅ Support cho device reboot (Android)
4. ✅ Background fetch (iOS)
5. ✅ Proper permissions và configurations

Notifications sẽ hoạt động ngay cả khi app bị tắt hoàn toàn!
