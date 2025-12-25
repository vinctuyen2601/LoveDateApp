# 📱 Thông báo khi App bị tắt - Hướng dẫn & Giải thích

## ✅ TL;DR - Câu trả lời ngắn gọn

**CÓ**, thông báo **VẪN HOẠT ĐỘNG** khi app bị tắt!

App đã được cấu hình đầy đủ để thông báo hoạt động ngay cả khi:
- ✅ App bị đóng (swipe away)
- ✅ Điện thoại khởi động lại
- ✅ App bị force stop (trừ khi user tắt thủ công)

---

## 🔧 Cách hoạt động

### 1. **Scheduled Notifications (Thông báo đã lên lịch)**

Khi bạn tạo một sự kiện mới, app sẽ:
1. Lưu sự kiện vào database (SQLite local)
2. **Lên lịch thông báo trực tiếp với hệ điều hành** (Android Notification System)
3. Lưu notification ID vào database để quản lý

**Quan trọng**: Sau khi thông báo được schedule, nó thuộc về **hệ điều hành**, KHÔNG phải app. App có thể tắt hoàn toàn, thông báo vẫn sẽ được gửi đúng giờ!

### 2. **Background Task (Tác vụ nền)**

File: `src/services/backgroundTask.service.ts`

```typescript
await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
  minimumInterval: 60 * 60 * 12, // 12 giờ
  stopOnTerminate: false,  // ✅ QUAN TRỌNG: Không dừng khi app tắt
  startOnBoot: true,       // ✅ QUAN TRỌNG: Khởi động lại sau reboot
});
```

Background task chạy mỗi 12 giờ để:
- Kiểm tra và reschedule thông báo (nếu cần)
- Đảm bảo không có thông báo nào bị miss
- Sync với database

### 3. **Boot Completed Receiver**

Permissions trong `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
```

Khi điện thoại khởi động lại:
1. Android tự động kích hoạt app (nhờ `RECEIVE_BOOT_COMPLETED`)
2. Background task được đăng ký lại
3. Tất cả notifications được reschedule

---

## 🎯 Các loại thông báo

### A. **Exact Alarms (Báo thức chính xác)**

Cho sự kiện **không lặp lại** (one-time events):
```typescript
trigger = { date: notificationDate }
```

- ✅ Gửi **chính xác** vào thời gian đã lên lịch
- ✅ Không bị trì hoãn bởi Battery Optimization
- ⚠️ Cần quyền `SCHEDULE_EXACT_ALARM` (Android 12+)

### B. **Repeating Notifications (Thông báo lặp lại)**

Cho sự kiện **lặp lại hàng năm** (anniversaries, birthdays):
```typescript
trigger = {
  day: notificationDate.getDate(),
  month: notificationDate.getMonth() + 1,
  hour: 9,
  minute: 0,
  repeats: true,
}
```

- ✅ Tự động lặp lại hàng năm
- ✅ Không cần reschedule
- ✅ Hoạt động mãi mãi (cho đến khi user xóa)

---

## ⚙️ Permissions cần thiết

### 1. **POST_NOTIFICATIONS** (Android 13+)
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```
- Bắt buộc để hiển thị thông báo
- User phải cấp quyền lần đầu

### 2. **SCHEDULE_EXACT_ALARM** (Android 12+)
```xml
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>
<uses-permission android:name="android.permission.USE_EXACT_ALARM"/>
```
- Cần thiết cho thông báo đúng giờ
- Tránh bị delay bởi Doze mode

### 3. **RECEIVE_BOOT_COMPLETED**
```xml
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
```
- Reschedule notifications sau khi reboot
- Đảm bảo không mất thông báo

---

## 🚨 Các trường hợp thông báo CÓ THỂ KHÔNG hoạt động

### ❌ User tắt quyền thông báo
- Settings > Apps > Love Date App > Notifications > **TẮT**
- **Giải pháp**: Hướng dẫn user bật lại trong Settings screen

### ❌ User Force Stop app
- Settings > Apps > Love Date App > **Force Stop**
- Trên một số thiết bị, force stop sẽ cancel tất cả alarms
- **Giải pháp**: App tự động reschedule khi user mở lại

### ❌ Battery Optimization quá mức
- Một số ROM (Xiaomi, Oppo, Vivo) có battery optimization rất aggressive
- **Giải pháp**: Hướng dẫn user thêm app vào whitelist

### ❌ Thiếu quyền Exact Alarm (Android 12+)
- Thông báo có thể bị delay 10-30 phút
- **Giải pháp**: Check và request quyền trong Settings screen

---

## 🧪 Cách test thông báo khi app tắt

### Test 1: Notification cơ bản
```typescript
// Trong Settings screen
handleTestNotification = async () => {
  // Lên lịch notification 1 phút sau
  const testDate = new Date();
  testDate.setMinutes(testDate.getMinutes() + 1);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🧪 Test - App đã tắt",
      body: "Nếu nhận được thông báo này, notifications hoạt động OK!",
    },
    trigger: { date: testDate },
  });
}
```

**Các bước test**:
1. Mở app → Settings → Gửi thông báo test (1 phút)
2. **Tắt hoàn toàn app** (swipe away từ Recent apps)
3. Chờ 1 phút
4. ✅ Nếu nhận được thông báo → **HOẠT ĐỘNG!**

### Test 2: Test sau khi reboot
1. Tạo 1 sự kiện với thông báo 5 phút sau
2. Khởi động lại điện thoại
3. Chờ 5 phút (không mở app)
4. ✅ Nếu nhận được thông báo → **HOẠT ĐỘNG!**

### Test 3: Test background task
1. Vào Settings > Developer Options
2. Bật "Don't keep activities"
3. Tạo sự kiện mới
4. Tắt app
5. Chờ 12 giờ (hoặc force run background task qua ADB)
6. Kiểm tra logs

---

## 📊 Flow hoạt động của Notification

```
┌─────────────────────────────────────────────────────────┐
│ User tạo sự kiện mới                                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 1. Lưu event vào SQLite database                        │
│ 2. Schedule notification với Android OS                 │
│ 3. Lưu notification ID vào database                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Notification được ĐĂNG KÝ VỚI HỆ ĐIỀU HÀNH             │
│ (App có thể tắt, notification vẫn tồn tại)             │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Background Task chạy mỗi 12 giờ                        │
│ - Reschedule nếu cần                                    │
│ - Sync với database                                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Đến giờ đã lên lịch                                    │
│ → Android OS hiển thị notification                      │
│ → User nhấn → App mở tới EventDetail screen            │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 Lưu ý quan trọng

1. **Notifications độc lập với app lifecycle**
   - Sau khi schedule, notification thuộc về OS, không phải app
   - App chỉ cần chạy 1 lần để schedule, sau đó có thể tắt

2. **Database persistence**
   - Tất cả sự kiện lưu trong SQLite (không phải memory)
   - Database không bị xóa khi app tắt

3. **Background Task limitations**
   - Android có thể delay background task nếu pin thấp
   - Không ảnh hưởng đến scheduled notifications

4. **Best practices**
   - Reschedule notifications khi app mở (đã implement)
   - Handle app resume/background state (đã implement)
   - Check permissions mỗi khi app mở (đã implement)

---

## 🔍 Debug & Troubleshooting

### Xem scheduled notifications
```typescript
const scheduled = await Notifications.getAllScheduledNotificationsAsync();
console.log('Scheduled notifications:', scheduled);
```

### Check background task status
```typescript
const status = await BackgroundFetch.getStatusAsync();
// Status values:
// 0 = Denied/Restricted
// 1 = Available
// 2 = Restricted
```

### Xem notification permissions
```typescript
const { status } = await Notifications.getPermissionsAsync();
console.log('Permission status:', status);
// 'granted' | 'denied' | 'undetermined'
```

### ADB commands hữu ích
```bash
# Xem tất cả alarms của app
adb shell dumpsys alarm | grep com.yourcompany.importantdates

# Force run background fetch (Android 12+)
adb shell cmd jobscheduler run -f com.yourcompany.importantdates

# Xem logs realtime
adb logcat | grep -i notification
```

---

## ✅ Checklist đảm bảo notifications hoạt động

- [x] Permissions trong AndroidManifest.xml
- [x] Permissions trong app.json
- [x] Request permissions khi app khởi động
- [x] Background task với stopOnTerminate: false
- [x] startOnBoot: true
- [x] Schedule notifications với trigger chính xác
- [x] Lưu notification IDs vào database
- [x] Reschedule on app resume
- [x] Handle notification tap (navigate to event)
- [x] Notification channels (Android)
- [x] Exact alarm permissions (Android 12+)

---

## 🎉 Kết luận

**Thông báo HOẠT ĐỘNG hoàn toàn khi app bị tắt!**

App đã được thiết kế và implement đầy đủ để đảm bảo notifications hoạt động trong mọi trường hợp. Hệ thống sử dụng:
- ✅ Android native notification scheduling
- ✅ Background tasks với lifecycle persistence
- ✅ Database để track notifications
- ✅ Auto-reschedule mechanisms

Chỉ cần đảm bảo user cấp đầy đủ permissions, notifications sẽ hoạt động đúng giờ ngay cả khi app đã tắt từ lâu! 🚀
