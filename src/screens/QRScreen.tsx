import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '@themes/colors';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getMyQRData, resolveQR, sendConnectionRequest } from '../services/connections.service';
import type { QRData, ConnectionSearchResult } from '../types/connections';

type ViewMode = 'my-qr' | 'scan';

const QRScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [mode, setMode] = useState<ViewMode>('my-qr');
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [isLoadingQR, setIsLoadingQR] = useState(true);

  // Scan / manual entry state
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState<ConnectionSearchResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  useEffect(() => {
    loadQRData();
  }, []);

  const loadQRData = async () => {
    setIsLoadingQR(true);
    try {
      const data = await getMyQRData();
      setQrData(data);
    } catch (e) {
      // fallback to user id
      if (user?.id) setQrData({ userId: user.id, displayName: user.displayName });
    } finally {
      setIsLoadingQR(false);
    }
  };

  // QR image URL from public API (no extra package needed)
  const getQRImageUrl = (userId: string) => {
    const data = encodeURIComponent(`lovedate://connect/${userId}`);
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${data}&bgcolor=FFFFFF&color=2C3E50&qzone=2`;
  };

  const handleShare = async () => {
    if (!qrData) return;
    try {
      await Share.share({
        message: `Kết nối với tôi trên Love Date!\n\nMã kết nối: ${qrData.userId}`,
        title: 'Love Date - Lời mời kết nối',
      });
    } catch (e) {
      // user cancelled
    }
  };

  const handleCopyCode = () => {
    if (!qrData) return;
    // Show code in a selectable alert so user can copy manually
    Alert.alert(
      'Mã kết nối của bạn',
      qrData.userId,
      [
        { text: 'Chia sẻ', onPress: handleShare },
        { text: 'Đóng', style: 'cancel' },
      ],
    );
  };

  // ── Manual code lookup ────────────────────────────────────────────────────

  const handleLookupCode = async () => {
    const code = manualCode.trim();
    if (!code) return;
    if (code === user?.id) {
      showError('Không thể kết nối với chính bạn');
      return;
    }
    setIsProcessing(true);
    setScanResult(null);
    try {
      // code may be raw userId or deep link format
      let userId = code;
      const match = code.match(/lovedate:\/\/connect\/(.+)/);
      if (match) userId = match[1];
      const result = await resolveQR(userId);
      setScanResult(result);
    } catch (e: any) {
      showError(e.message || 'Không tìm thấy người dùng với mã này');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendRequest = async () => {
    if (!scanResult) return;
    setIsSendingRequest(true);
    try {
      await sendConnectionRequest(scanResult.user.id);
      showSuccess('Đã gửi lời mời kết nối!');
      setScanResult(null);
      setMode('my-qr');
      navigation.goBack();
    } catch (e: any) {
      showError(e.message || 'Không thể gửi lời mời');
    } finally {
      setIsSendingRequest(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === 'my-qr' ? 'Mã QR của tôi' : 'Quét mã QR'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Mode tabs */}
      <View style={styles.modeTabs}>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'my-qr' && styles.modeTabActive]}
          onPress={() => setMode('my-qr')}
        >
          <Ionicons
            name="qr-code-outline"
            size={18}
            color={mode === 'my-qr' ? COLORS.white : COLORS.textSecondary}
          />
          <Text style={[styles.modeTabText, mode === 'my-qr' && styles.modeTabTextActive]}>
            Mã của tôi
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'scan' && styles.modeTabActive]}
          onPress={() => { setScanResult(null); setManualCode(''); setMode('scan'); }}
        >
          <Ionicons
            name="enter-outline"
            size={18}
            color={mode === 'scan' ? COLORS.white : COLORS.textSecondary}
          />
          <Text style={[styles.modeTabText, mode === 'scan' && styles.modeTabTextActive]}>
            Nhập mã
          </Text>
        </TouchableOpacity>
      </View>

      {/* My QR view */}
      {mode === 'my-qr' && (
        <ScrollView contentContainerStyle={styles.qrContent}>
          <View style={styles.qrCard}>
            {isLoadingQR ? (
              <View style={styles.qrLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.qrLoadingText}>Đang tạo mã QR...</Text>
              </View>
            ) : qrData ? (
              <>
                <Image
                  source={{ uri: getQRImageUrl(qrData.userId) }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
                <Text style={styles.qrName}>{qrData.displayName || user?.displayName || 'Bạn'}</Text>
                <Text style={styles.qrEmail}>{user?.email}</Text>
                <View style={styles.qrIdRow}>
                  <Text style={styles.qrIdLabel}>ID: </Text>
                  <Text style={styles.qrIdValue} numberOfLines={1}>{qrData.userId}</Text>
                </View>
              </>
            ) : (
              <Text style={styles.qrError}>Không thể tạo mã QR</Text>
            )}
          </View>

          <Text style={styles.qrHint}>
            Cho bạn bè quét mã này để gửi lời mời kết nối đến bạn
          </Text>

          <View style={styles.shareButtons}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color={COLORS.white} />
              <Text style={styles.shareButtonText}>Chia sẻ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
              <Ionicons name="copy-outline" size={20} color={COLORS.secondary} />
              <Text style={styles.copyButtonText}>Sao chép mã</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Manual code entry view */}
      {mode === 'scan' && (
        <ScrollView contentContainerStyle={styles.enterCodeContent}>
          <View style={styles.enterCodeCard}>
            <View style={styles.enterCodeIcon}>
              <Ionicons name="enter-outline" size={36} color={COLORS.secondary} />
            </View>
            <Text style={styles.enterCodeTitle}>Nhập mã kết nối</Text>
            <Text style={styles.enterCodeHint}>
              Yêu cầu bạn bè chia sẻ mã kết nối của họ, sau đó dán vào đây
            </Text>

            <View style={styles.codeInputRow}>
              <TextInput
                style={styles.codeInput}
                placeholder="Dán hoặc nhập mã kết nối..."
                placeholderTextColor={COLORS.textLight}
                value={manualCode}
                onChangeText={(v) => { setManualCode(v); setScanResult(null); }}
                autoCapitalize="none"
                autoCorrect={false}
                multiline={false}
              />
              <TouchableOpacity
                style={[styles.lookupBtn, (!manualCode.trim() || isProcessing) && styles.lookupBtnDisabled]}
                onPress={handleLookupCode}
                disabled={!manualCode.trim() || isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size={18} color={COLORS.white} />
                ) : (
                  <Ionicons name="search" size={20} color={COLORS.white} />
                )}
              </TouchableOpacity>
            </View>

            {/* Result */}
            {scanResult && (
              <View style={styles.scanResultCard}>
                <View style={styles.scanResultIcon}>
                  <Ionicons name="checkmark-circle" size={40} color={COLORS.success} />
                </View>
                <Text style={styles.scanResultTitle}>Đã tìm thấy!</Text>

                <View style={styles.scanResultUser}>
                  <View style={styles.scanResultAvatar}>
                    {scanResult.user.photoUrl ? (
                      <Image
                        source={{ uri: scanResult.user.photoUrl }}
                        style={{ width: 64, height: 64, borderRadius: 32 }}
                      />
                    ) : (
                      <View style={styles.scanResultAvatarPlaceholder}>
                        <Text style={styles.scanResultAvatarText}>
                          {(scanResult.user.displayName || scanResult.user.email || '?')[0].toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.scanResultName}>
                    {scanResult.user.displayName || 'Người dùng'}
                  </Text>
                  <Text style={styles.scanResultEmail}>{scanResult.user.email}</Text>

                  {scanResult.connectionStatus === 'accepted' && (
                    <View style={styles.alreadyConnectedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                      <Text style={styles.alreadyConnectedText}>Đã kết nối</Text>
                    </View>
                  )}
                  {scanResult.connectionStatus === 'pending' && (
                    <View style={styles.pendingBadge}>
                      <Ionicons name="time-outline" size={16} color={COLORS.warning} />
                      <Text style={styles.pendingBadgeText}>Đang chờ xác nhận</Text>
                    </View>
                  )}
                </View>

                {scanResult.connectionStatus === null && (
                  <TouchableOpacity
                    style={styles.connectButton}
                    onPress={handleSendRequest}
                    disabled={isSendingRequest}
                  >
                    {isSendingRequest ? (
                      <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                      <>
                        <Ionicons name="person-add" size={20} color={COLORS.white} />
                        <Text style={styles.connectButtonText}>Gửi lời mời kết nối</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default QRScreen;

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 4,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 11,
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: COLORS.primary,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  modeTabTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  // My QR
  qrContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 20,
  },
  qrCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    gap: 12,
  },
  qrLoading: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  qrLoadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  qrImage: {
    width: 240,
    height: 240,
    borderRadius: 8,
  },
  qrName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  qrEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  qrIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: '100%',
  },
  qrIdLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  qrIdValue: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  qrError: {
    color: COLORS.error,
    fontSize: 14,
    paddingVertical: 20,
  },
  qrHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.secondary,
    paddingVertical: 14,
    borderRadius: 28,
  },
  shareButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
  },
  copyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.secondary + '18',
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.secondary + '40',
  },
  copyButtonText: {
    color: COLORS.secondary,
    fontWeight: '600',
    fontSize: 15,
  },
  // Manual code entry
  enterCodeContent: {
    padding: 24,
    alignItems: 'center',
  },
  enterCodeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    gap: 14,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  enterCodeIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.secondary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterCodeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  enterCodeHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  codeInputRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  codeInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lookupBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lookupBtnDisabled: {
    backgroundColor: COLORS.textLight,
  },
  // Lookup result (reused for both modes)
  scanResultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    gap: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  scanResultIcon: {
    marginBottom: 4,
  },
  scanResultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scanResultUser: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  scanResultAvatar: {
    marginBottom: 4,
  },
  scanResultAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanResultAvatarText: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '700',
  },
  scanResultName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  scanResultEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  alreadyConnectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.success + '18',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  alreadyConnectedText: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '600',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.warning + '18',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pendingBadgeText: {
    color: COLORS.warning,
    fontSize: 13,
    fontWeight: '600',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 8,
    width: '100%',
    justifyContent: 'center',
  },
  connectButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
  },
  scanAgainButton: {
    paddingVertical: 10,
  },
  scanAgainText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});
