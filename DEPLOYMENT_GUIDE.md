# Hướng dẫn Deploy App

## 📦 Build hiện tại đang chạy

Build preview APK đang được tạo với EAS Build. Bạn có thể theo dõi tiến trình tại:
- EAS Dashboard: https://expo.dev/accounts/[your-account]/projects/love-date-mobile/builds

## 🔧 Các thay đổi quan trọng trong build này

### 1. Background Tasks & Notifications
- ✅ Background fetch task mỗi 12 giờ
- ✅ Notification persistence trong database
- ✅ Auto-reschedule sau device reboot (Android)
- ✅ Permissions: RECEIVE_BOOT_COMPLETED, VIBRATE, USE_FULL_SCREEN_INTENT

### 2. Native Modules mới
- `expo-task-manager`: Quản lý background tasks
- `expo-background-fetch`: Background fetch cho iOS/Android

### 3. Database Schema Updates
- Table mới: `scheduled_notifications`
- Lưu trữ notification IDs, event relationships

## 📱 Sau khi build hoàn thành

### Bước 1: Download APK
```bash
# EAS sẽ cung cấp link download khi build xong
# Hoặc xem tại: https://expo.dev/accounts/[your-account]/projects/love-date-mobile/builds
```

### Bước 2: Install trên device
1. Download APK về máy tính hoặc trực tiếp trên Android
2. Bật "Install from Unknown Sources" trong Settings
3. Install APK
4. Cấp permissions khi được yêu cầu:
   - Notifications
   - Storage (cho database)

### Bước 3: Test Notifications

#### Test cơ bản
1. Mở app lần đầu
2. Tạo một event với reminder 5 phút sau
3. Close app hoàn toàn (swipe away)
4. Đợi 5 phút
5. **Kết quả**: Notification phải hiển thị

#### Test background task
1. Vào Settings app
2. Kiểm tra Background App Refresh enabled
3. Force close app
4. Đợi vài giờ (hoặc 1 ngày)
5. Kiểm tra logs (nếu debug build)

#### Test device reboot (Android)
1. Tạo event với reminder sau khi reboot
2. Reboot device
3. KHÔNG mở app
4. Đợi đến thời gian reminder
5. **Kết quả**: Notification vẫn phải hiển thị

### Bước 4: Debug nếu có vấn đề

#### Kiểm tra notifications
Thêm NotificationDebugScreen vào navigation để debug:

```typescript
// Trong navigation/AppNavigator.tsx
import NotificationDebugScreen from '../screens/NotificationDebugScreen';

// Thêm screen:
<Stack.Screen
  name="NotificationDebug"
  component={NotificationDebugScreen}
  options={{ title: 'Debug Notifications' }}
/>
```

#### Log notifications
Xem console logs:
```bash
npx react-native log-android  # Android
npx react-native log-ios      # iOS
```

## 🚀 Deploy Production

### Build Production APK/AAB

#### Android APK (Testing)
```bash
cd "Love Date App"
eas build --platform android --profile preview
```

#### Android AAB (Google Play)
```bash
cd "Love Date App"
eas build --platform android --profile production
```

#### iOS
```bash
cd "Love Date App"
eas build --platform ios --profile production
```

### Upload lên Store

#### Google Play Store
1. Build AAB với profile production
2. Vào Google Play Console
3. Upload AAB
4. Điền thông tin app, screenshots
5. Submit for review

#### Apple App Store
1. Build IPA với profile production
2. Vào App Store Connect
3. Upload IPA
4. Điền thông tin app, screenshots
5. Submit for review

## ⚠️ Lưu ý quan trọng

### Permissions
App yêu cầu các permissions sau:
- **Notifications**: Bắt buộc để hiển thị reminders
- **Boot Completed** (Android): Để reschedule sau reboot
- **Background Fetch**: Để background task hoạt động

### Battery Optimization (Android)
Một số manufacturers (Xiaomi, Huawei, Samsung) có battery optimization nghiêm ngặt. Hướng dẫn user:

1. Vào Settings > Apps > Love Date App
2. Battery > Unrestricted
3. Autostart > Enable
4. Background activity > Allow

### iOS Background Limitations
- Background fetch không chạy frequently như Android
- iOS ưu tiên apps được sử dụng thường xuyên
- Test trên device thật, không phải simulator

### Database Migrations
Khi update app version mới:
- Database tự động migrate schema
- Notification IDs được preserve
- Không mất data khi upgrade

## 📊 Monitoring

### Logs quan trọng
```javascript
// App initialization
'Database initialized'
'Notifications initialized'
'Background task registered'
'Initial notifications scheduled'

// Background task
'[Background Task] Running notification reschedule task'
'[Background Task] Successfully rescheduled notifications'

// Notification scheduled
'Scheduled X notifications for event: [event_title]'
```

### Tracking metrics
Implement analytics để track:
- Notification delivery rate
- Background task execution frequency
- User engagement với notifications
- App crashes/errors

## 🔄 Update Flow

### Khi có update mới
1. Update version trong app.json
2. Prebuild nếu có native changes:
   ```bash
   npx expo prebuild --clean
   ```
3. Build với EAS:
   ```bash
   eas build --platform android --profile preview
   ```
4. Test build trước khi release
5. Build production và upload lên store

### Rollback nếu có bug
1. Revert code về version trước
2. Build lại
3. Upload version cũ lên store
4. Users tự động update về version stable

## 📞 Support

### Common Issues

**Q: Notifications không hiển thị sau khi app bị tắt**
A: Kiểm tra:
- Permissions đã được cấp chưa
- Battery optimization settings
- Background task đã register chưa

**Q: Background task không chạy**
A:
- Android: Kiểm tra battery optimization
- iOS: Đảm bảo Background App Refresh enabled

**Q: Notifications bị delay**
A:
- Android: System có thể delay notifications để tiết kiệm pin
- iOS: Background fetch không realtime

## ✅ Checklist trước khi release

- [ ] Test notifications khi app close
- [ ] Test background task
- [ ] Test trên nhiều devices khác nhau
- [ ] Kiểm tra permissions
- [ ] Test database migrations
- [ ] Verify notification persistence
- [ ] Test device reboot scenario
- [ ] Check battery usage
- [ ] Review analytics integration
- [ ] Update version number
- [ ] Test production build

## 🎯 Next Steps

Sau khi build preview hoàn thành:
1. Download và install APK
2. Test thoroughly theo guide
3. Fix any bugs nếu có
4. Build production version
5. Submit lên Google Play Store

---

**Build được tạo lúc**: ${new Date().toLocaleString('vi-VN')}
**Platform**: Android Preview (APK)
**Profile**: preview
**Version**: Xem trong app.json

Good luck! 🚀
