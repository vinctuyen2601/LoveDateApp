# 🚀 Hướng dẫn Build App với EAS

## 📋 Chuẩn bị

### 1. Cài đặt EAS CLI (nếu chưa có)
```bash
npm install -g eas-cli
```

### 2. Đăng nhập EAS
```bash
eas login
```
Nhập email và mật khẩu Expo account của bạn.

### 3. Kiểm tra đã login thành công
```bash
eas whoami
```

---

## 🔨 Build Commands

### **Option 1: Build APK để test (Khuyến nghị)**

Build APK nhanh để cài lên điện thoại test:

```bash
eas build --platform android --profile preview
```

**Ưu điểm:**
- ✅ Build nhanh hơn (10-15 phút)
- ✅ File APK nhỏ, dễ share và cài đặt
- ✅ Không cần Google Play Console
- ✅ Có thể cài trực tiếp lên điện thoại

**Sau khi build xong:**
1. EAS sẽ cho link download APK
2. Tải APK về điện thoại
3. Cài đặt APK (cho phép cài từ nguồn không xác định)
4. Mở app và test thông báo

---

### **Option 2: Build Development (Để debug)**

Build với development client (có live reload):

```bash
eas build --platform android --profile development
```

**Ưu điểm:**
- ✅ Có thể debug realtime
- ✅ Hot reload khi code thay đổi
- ✅ Dev tools đầy đủ

**Lưu ý:** Cần chạy `npx expo start --dev-client` sau khi cài app

---

### **Option 3: Build Production (Để lên CH Play)**

Build AAB để upload lên Google Play Store:

```bash
eas build --platform android --profile production
```

**Khi nào dùng:**
- 📱 Khi ready để publish lên Google Play
- 🎯 Build release cuối cùng
- 🔒 Cần signing và optimization

---

## ⚡ Build Local (Nhanh hơn, không tốn credits)

Nếu bạn có Android Studio và setup đầy đủ:

```bash
eas build --platform android --profile preview --local
```

**Ưu điểm:**
- ⚡ Build trên máy local (nhanh hơn)
- 💰 Không tốn EAS credits
- 🔧 Full control

**Yêu cầu:**
- Java JDK 17
- Android SDK
- Android Studio

---

## 📱 Cài đặt APK sau khi build

### Cách 1: Download trực tiếp trên điện thoại
1. Mở link EAS build trên điện thoại
2. Tải APK
3. Cho phép cài từ nguồn không xác định
4. Cài đặt

### Cách 2: Qua ADB
```bash
adb install path/to/app.apk
```

### Cách 3: QR Code
EAS sẽ tạo QR code, quét để download APK

---

## 🔍 Kiểm tra Build Status

### Xem build đang chạy
```bash
eas build:list
```

### Xem chi tiết build cụ thể
```bash
eas build:view [BUILD_ID]
```

### Xem logs
```bash
eas build:view [BUILD_ID] --logs
```

---

## ✅ Sau khi build và cài đặt xong

### 1. Kiểm tra Permissions
Mở app → Settings → Thông báo:
- [ ] Bật thông báo (toggle switch)
- [ ] Kiểm tra quyền Báo thức chính xác
- [ ] Test thông báo 5 giây
- [ ] **Test thông báo khi app tắt (1 phút)**

### 2. Test thông báo khi app tắt
```
1. Settings → Thông báo
2. Nhấn "Test thông báo khi app tắt"
3. Đọc hướng dẫn
4. Tắt hoàn toàn app (swipe away)
5. Chờ 1 phút
6. Kiểm tra notification
```

### 3. Verify permissions qua ADB
```bash
# Xem tất cả permissions
adb shell dumpsys package com.yourcompany.importantdates | grep permission

# Xem scheduled alarms
adb shell dumpsys alarm | grep com.yourcompany.importantdates

# Xem notification settings
adb shell dumpsys notification | grep com.yourcompany.importantdates
```

---

## 🐛 Troubleshooting

### Build failed - Missing credentials
```bash
# Tạo credentials mới
eas credentials
```

### Build failed - Android SDK issue
```bash
# Clear build cache và build lại
eas build --platform android --profile preview --clear-cache
```

### Build quá lâu (>30 phút)
- Kiểm tra Expo dashboard: https://expo.dev/accounts/[your-username]/projects
- Cancel build cũ và retry:
```bash
eas build:cancel [BUILD_ID]
eas build --platform android --profile preview
```

### APK không cài được
- Bật "Cài đặt từ nguồn không xác định" trong Settings
- Hoặc dùng ADB: `adb install -r app.apk`

---

## 💡 Tips

### 1. Tăng tốc build time
- Dùng `--local` nếu có setup Android SDK
- Cache dependencies sẽ giúp build nhanh hơn từ lần 2

### 2. Auto increment version
Thêm vào `eas.json`:
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "autoIncrement": true
      }
    }
  }
}
```

### 3. Build kèm metadata
```bash
eas build --platform android --profile preview --message "Added notification permissions"
```

---

## 📊 Build Profiles đã có

### `development`
- Development client
- Internal distribution
- Để debug

### `preview`
- APK build
- Internal distribution
- **DÙNG CÁI NÀY để test!** ⭐

### `production`
- AAB bundle
- Để upload CH Play
- Optimized & signed

---

## 🎯 Recommended: Build ngay

```bash
# Bước 1: Login (nếu chưa)
eas login

# Bước 2: Build APK preview
eas build --platform android --profile preview

# Bước 3: Đợi ~10-15 phút

# Bước 4: Download APK từ link hoặc QR code

# Bước 5: Cài đặt và test!
```

---

## 📞 Support

- EAS Build Docs: https://docs.expo.dev/build/introduction/
- Expo Discord: https://chat.expo.dev/
- Dashboard: https://expo.dev/
