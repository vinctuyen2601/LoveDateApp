# Build Information

## 🏗️ Build Details

**Build ID**: `6fb75472-05c7-4923-ab70-955c45646e6d`
**Platform**: Android
**Build Type**: APK (Preview)
**Build Time**: ${new Date().toLocaleString('vi-VN')}
**Status**: Building...

## 📍 Build URL
https://expo.dev/accounts/tuyenvinc/projects/important-dates-mobile/builds/6fb75472-05c7-4923-ab70-955c45646e6d

## 📦 What's included in this build

### New Features
1. ✅ **Background Task Service**
   - Auto-reschedule notifications every 12 hours
   - Works even when app is closed
   - Survives device reboot (Android)

2. ✅ **Notification Persistence**
   - Notification IDs saved to database
   - Can restore notifications after app reinstall
   - Track scheduled notifications

3. ✅ **Enhanced Permissions**
   - RECEIVE_BOOT_COMPLETED (Android)
   - Background fetch (iOS/Android)
   - Vibration support

4. ✅ **UI Improvements**
   - Inline date pickers for all recurrence types
   - Simplified category/relationship pickers
   - Removed gift ideas section
   - Reordered form sections

### Technical Updates
- **expo-task-manager**: v14.0.9
- **expo-background-fetch**: v14.0.9
- **New database table**: scheduled_notifications
- **iOS background modes**: fetch, processing
- **Android permissions**: RECEIVE_BOOT_COMPLETED, VIBRATE, USE_FULL_SCREEN_INTENT

## 🎯 After Build Completes

### 1. Download APK
EAS will provide download link when build finishes (usually 10-15 minutes)

### 2. Install on Device
```bash
# Option 1: Scan QR code from EAS dashboard
# Option 2: Download APK and install directly
```

### 3. Test Checklist
- [ ] App opens successfully
- [ ] Create event with notification
- [ ] Close app completely
- [ ] Notification appears at scheduled time
- [ ] Check NotificationDebugScreen
- [ ] Test background task status
- [ ] Test device reboot scenario

### 4. Known Issues to Watch
None expected, but monitor:
- Battery optimization conflicts
- Background task execution frequency
- Notification delivery reliability

## 📱 Installation Instructions

### Android
1. Download APK from EAS build URL
2. Enable "Install from Unknown Sources" in Settings
3. Install APK
4. Grant all permissions when prompted:
   - Notifications
   - Storage
   - Battery optimization (if asked)

### Testing Notifications
See [NOTIFICATION_TEST_GUIDE.md](./NOTIFICATION_TEST_GUIDE.md) for detailed testing steps.

## 🔍 Debugging

### View Build Logs
Visit the build URL above and click "Logs" to see detailed build process.

### If Build Fails
Common issues:
- Check eas.json configuration
- Verify app.json settings
- Check for TypeScript errors
- Review native code changes

### Contact Support
If you encounter issues:
1. Check EAS build logs
2. Review deployment guide
3. Check notification test guide

## 📊 Build Configuration

### From eas.json
```json
{
  "preview": {
    "distribution": "internal",
    "android": {
      "buildType": "apk"
    }
  }
}
```

### App Version
- Check `app.json` for current version
- Update version before production build

## 🚀 Next Steps

1. **Wait for build to complete** (~10-15 minutes)
2. **Download and install APK**
3. **Test thoroughly** using test guide
4. **Fix any issues** if found
5. **Build production version** when ready
6. **Submit to Google Play Store**

## 📝 Build Commands Used

```bash
# Prebuild with native changes
npx expo prebuild --clean

# Build preview APK
eas build --platform android --profile preview --non-interactive
```

## 🔗 Useful Links

- [EAS Build Dashboard](https://expo.dev/accounts/tuyenvinc/projects/important-dates-mobile/builds)
- [Expo Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Build Reference](https://docs.expo.dev/build-reference/simulators/)

---

**Note**: Build is currently in progress. Check the build URL above for real-time status updates.
