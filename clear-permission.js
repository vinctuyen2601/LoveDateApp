/**
 * Script để xóa flag permission trong AsyncStorage
 * Chạy script này để reset và test lại permission modal
 *
 * Cách dùng:
 * 1. Thêm script này vào SettingsScreen
 * 2. Hoặc chạy qua adb shell
 */

// Cho Android
// adb shell run-as com.lovedateapp rm -rf /data/data/com.lovedateapp/files/RKStorage

// Hoặc thêm button vào SettingsScreen:
/*
import AsyncStorage from '@react-native-async-storage/async-storage';

const clearPermissionFlag = async () => {
  await AsyncStorage.removeItem('@notification_permission_asked');
  console.log('Permission flag cleared!');
  Alert.alert('Success', 'Please restart the app to see permission modal');
};

// Trong render:
<TouchableOpacity onPress={clearPermissionFlag}>
  <Text>Clear Permission Flag (Debug)</Text>
</TouchableOpacity>
*/

console.log('Use the code above in SettingsScreen for debugging');
