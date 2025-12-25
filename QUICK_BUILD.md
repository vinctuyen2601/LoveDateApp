# ⚡ Quick Build - Chạy ngay 3 lệnh này!

## 🚀 Build APK để test thông báo (KHUYẾN NGHỊ)

### Bước 1: Cài EAS CLI (nếu chưa có)
```bash
npm install -g eas-cli
```

### Bước 2: Login EAS
```bash
eas login
```
> Nhập email/password Expo account. Nếu chưa có, tạo tại: https://expo.dev/signup

### Bước 3: Build APK
```bash
npm run build:preview
```

**Hoặc dùng lệnh đầy đủ:**
```bash
eas build --platform android --profile preview
```

---

## ⏱️ Thời gian build: 10-15 phút

Trong lúc đợi build:
- ✅ EAS sẽ build trên cloud
- ✅ Không cần Android Studio
- ✅ Không tốn tài nguyên máy local
- ✅ Khi xong sẽ có link download APK

---

## 📱 Sau khi build xong

### 1. Download APK
- Mở link từ terminal/email
- Hoặc quét QR code
- Hoặc vào: https://expo.dev/accounts/[your-username]/builds

### 2. Cài APK lên điện thoại
**Cách 1:** Download trực tiếp trên điện thoại
- Quét QR code → Download → Cài đặt
- Bật "Cài từ nguồn không xác định" nếu cần

**Cách 2:** Qua USB/ADB
```bash
adb install app.apk
```

### 3. Test thông báo
```
1. Mở app
2. Settings → Thông báo
3. Bật toggle "Bật thông báo"
4. Nhấn "Test thông báo khi app tắt"
5. Tắt hoàn toàn app
6. Chờ 1 phút
7. ✅ Nhận được thông báo = HOẠT ĐỘNG!
```

---

## 🎯 Các lệnh build khác

### Build Development (có debug tools)
```bash
npm run build:dev
```

### Build Production (lên CH Play)
```bash
npm run build:prod
```

### Build Local (nhanh hơn, cần Android SDK)
```bash
npm run build:local
```

---

## ✅ Checklist

- [ ] Đã cài `eas-cli`: `npm install -g eas-cli`
- [ ] Đã login: `eas whoami` (kiểm tra)
- [ ] Chạy build: `npm run build:preview`
- [ ] Đợi 10-15 phút
- [ ] Download APK từ link
- [ ] Cài APK lên điện thoại
- [ ] Test thông báo!

---

## 🐛 Nếu gặp lỗi

### "eas: command not found"
```bash
npm install -g eas-cli
```

### "You must be logged in"
```bash
eas login
```

### Build failed - credentials
```bash
eas credentials
# Chọn: Configure credentials
# Chọn: Android Keystore
# Chọn: Generate new keystore
```

### Build quá lâu (>30 phút)
- Vào https://expo.dev → Projects → Love Date App → Builds
- Cancel build cũ
- Build lại: `npm run build:preview`

---

## 💡 Tips

1. **Xem build status:**
   ```bash
   eas build:list
   ```

2. **Xem logs chi tiết:**
   ```bash
   eas build:view [BUILD_ID] --logs
   ```

3. **Build kèm message:**
   ```bash
   npm run build:preview -- --message "Added notification permissions"
   ```

---

## 🎉 Done!

Sau khi cài APK xong, bạn sẽ có app với:
- ✅ Toast notifications đẹp
- ✅ Thông báo hoạt động khi app tắt
- ✅ Permissions đầy đủ cho Android 12+
- ✅ Test tools để verify

**Hãy test và enjoy! 🚀**
