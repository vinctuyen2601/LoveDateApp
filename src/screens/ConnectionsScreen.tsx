import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { COLORS } from '@themes/colors';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  getMyConnections,
  getPendingRequests,
  getMyLimits,
  sendConnectionRequest,
  acceptConnection,
  declineConnection,
  removeConnection,
  searchByEmail,
} from '../services/connections.service';
import type {
  UserConnection,
  MyLimits,
  ConnectionSearchResult,
} from '../types/connections';

type TabKey = 'connections' | 'requests';

// ── Helper ────────────────────────────────────────────────────────────────────

const getInitials = (name?: string, email?: string): string => {
  const src = name?.trim() || email?.trim() || '?';
  const words = src.split(/\s+/);
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const AVATAR_COLORS = ['#FF6B6B', '#4ECDC4', '#845EF7', '#339AF0', '#51CF66', '#F06595'];
const getAvatarColor = (id: string) =>
  AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];

// ── Avatar component ──────────────────────────────────────────────────────────

const UserAvatar: React.FC<{ photoUrl?: string; name?: string; email?: string; size?: number }> = ({
  photoUrl, name, email, size = 44,
}) => {
  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  const initials = getInitials(name, email);
  const color = getAvatarColor(name || email || '?');
  return (
    <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.avatarInitials, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────

const ConnectionsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isAnonymous } = useAuth();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>('connections');
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [requests, setRequests] = useState<UserConnection[]>([]);
  const [limits, setLimits] = useState<MyLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Add connection modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<ConnectionSearchResult | null>(null);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [conns, reqs, lims] = await Promise.all([
        getMyConnections(),
        getPendingRequests(),
        getMyLimits(),
      ]);
      setConnections(conns);
      setRequests(reqs);
      setLimits(lims);
    } catch (e: any) {
      if (!silent) showError('Không thể tải danh sách kết nối');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData(true);
  };

  // ── Add connection ──────────────────────────────────────────────────────────

  const handleSearch = async () => {
    const email = searchEmail.trim().toLowerCase();
    if (!email) return;
    setIsSearching(true);
    setSearchResult(null);
    try {
      const result = await searchByEmail(email);
      setSearchResult(result);
    } catch (e: any) {
      showError(e.message || 'Không tìm thấy người dùng');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!searchResult) return;
    setIsSendingRequest(true);
    try {
      await sendConnectionRequest(searchResult.user.id);
      showSuccess('Đã gửi lời mời kết nối!');
      setShowAddModal(false);
      setSearchEmail('');
      setSearchResult(null);
      loadData(true);
    } catch (e: any) {
      showError(e.message || 'Không thể gửi lời mời');
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setSearchEmail('');
    setSearchResult(null);
  };

  // ── Accept / Decline ────────────────────────────────────────────────────────

  const handleAccept = async (conn: UserConnection) => {
    setActionLoading(conn.id);
    try {
      await acceptConnection(conn.id);
      showSuccess('Đã chấp nhận lời mời!');
      loadData(true);
    } catch (e: any) {
      showError(e.message || 'Không thể chấp nhận');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (conn: UserConnection) => {
    setActionLoading(conn.id);
    try {
      await declineConnection(conn.id);
      showSuccess('Đã từ chối lời mời');
      loadData(true);
    } catch (e: any) {
      showError(e.message || 'Không thể từ chối');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = (conn: UserConnection) => {
    const partner = getPartner(conn);
    Alert.alert(
      'Xoá kết nối',
      `Bạn có chắc muốn xoá kết nối với ${partner.displayName || partner.email}?`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(conn.id);
            try {
              await removeConnection(conn.id);
              showSuccess('Đã xoá kết nối');
              loadData(true);
            } catch (e: any) {
              showError(e.message || 'Không thể xoá kết nối');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const getPartner = (conn: UserConnection) => {
    // The "partner" is the other side of the connection from current user
    // We don't have current userId here, so we rely on a heuristic:
    // from getMyConnections, requester is always "me" or receiver is "me"
    // We just show whichever has a display name, preferring non-"me" side
    return conn.requester ?? conn.receiver;
  };

  // Since getMyConnections returns accepted connections and we need to show the partner,
  // we'll use a simple approach: show both sides in card
  const getPartnerFromConnection = (conn: UserConnection, myId?: string): import('../types/connections').ConnectionUser => {
    if (!myId) return conn.requester;
    return conn.requester.id === myId ? conn.receiver : conn.requester;
  };

  const { user } = useAuth();

  // ── Render guards ───────────────────────────────────────────────────────────

  if (isAnonymous) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Kết nối</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="person-add-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>Cần đăng nhập</Text>
          <Text style={styles.emptySubtitle}>
            Vui lòng đăng nhập để sử dụng tính năng kết nối với người thân
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.primaryButtonText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Quota bar ───────────────────────────────────────────────────────────────

  const QuotaBar = () => {
    if (!limits) return null;
    return (
      <View style={styles.quotaBar}>
        <View style={styles.quotaItem}>
          <Ionicons name="people-outline" size={16} color={COLORS.secondary} />
          <Text style={styles.quotaText}>
            {limits.connectionsUsed}/{limits.connectionsMax} kết nối
          </Text>
        </View>
        <View style={styles.quotaSep} />
        <View style={styles.quotaItem}>
          <Ionicons name="share-outline" size={16} color={COLORS.primary} />
          <Text style={styles.quotaText}>
            {limits.sharedOutUsed}/{limits.sharedOutMax} đã chia sẻ
          </Text>
        </View>
        <View style={styles.quotaSep} />
        <View style={styles.quotaItem}>
          <Ionicons name="download-outline" size={16} color={COLORS.info} />
          <Text style={styles.quotaText}>
            {limits.sharedInUsed}/{limits.sharedInMax} đã nhận
          </Text>
        </View>
      </View>
    );
  };

  // ── Connection card ──────────────────────────────────────────────────────────

  const ConnectionCard: React.FC<{ conn: UserConnection }> = ({ conn }) => {
    const partner = getPartnerFromConnection(conn, user?.id);
    const isActing = actionLoading === conn.id;
    return (
      <View style={styles.card}>
        <UserAvatar photoUrl={partner.photoUrl} name={partner.displayName} email={partner.email} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {partner.displayName || 'Người dùng'}
          </Text>
          <Text style={styles.cardEmail} numberOfLines={1}>{partner.email}</Text>
        </View>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemove(conn)}
          disabled={isActing}
        >
          {isActing ? (
            <ActivityIndicator size={18} color={COLORS.error} />
          ) : (
            <Ionicons name="person-remove-outline" size={20} color={COLORS.error} />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // ── Request card ─────────────────────────────────────────────────────────────

  const RequestCard: React.FC<{ conn: UserConnection }> = ({ conn }) => {
    const requester = conn.requester;
    const isActing = actionLoading === conn.id;
    return (
      <View style={styles.card}>
        <UserAvatar photoUrl={requester.photoUrl} name={requester.displayName} email={requester.email} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {requester.displayName || 'Người dùng'}
          </Text>
          <Text style={styles.cardEmail} numberOfLines={1}>{requester.email}</Text>
          <Text style={styles.cardBadge}>Muốn kết nối với bạn</Text>
        </View>
        {isActing ? (
          <ActivityIndicator size={20} color={COLORS.primary} style={{ marginLeft: 8 }} />
        ) : (
          <View style={styles.requestActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={() => handleAccept(conn)}
            >
              <Ionicons name="checkmark" size={18} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.declineBtn]}
              onPress={() => handleDecline(conn)}
            >
              <Ionicons name="close" size={18} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const canAddMore = !limits || limits.connectionsUsed < limits.connectionsMax;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kết nối</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('QRScreen')}
          >
            <Ionicons name="qr-code-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, styles.addBtn]}
            onPress={() => {
              if (!canAddMore) {
                Alert.alert(
                  'Hết lượt kết nối',
                  `Bạn đã dùng hết ${limits?.connectionsMax} kết nối. Liên hệ admin để được nâng giới hạn.`,
                );
                return;
              }
              setShowAddModal(true);
            }}
          >
            <Ionicons name="person-add-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quota */}
      <QuotaBar />

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'connections' && styles.tabActive]}
          onPress={() => setActiveTab('connections')}
        >
          <Text style={[styles.tabLabel, activeTab === 'connections' && styles.tabLabelActive]}>
            Đang kết nối
          </Text>
          {connections.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{connections.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabLabel, activeTab === 'requests' && styles.tabLabelActive]}>
            Lời mời
          </Text>
          {requests.length > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: COLORS.error }]}>
              <Text style={styles.tabBadgeText}>{requests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
          }
        >
          {activeTab === 'connections' && (
            <>
              {connections.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={56} color={COLORS.textLight} />
                  <Text style={styles.emptyTitle}>Chưa có kết nối</Text>
                  <Text style={styles.emptySubtitle}>
                    Thêm người thân hoặc bạn bè để chia sẻ những ngày quan trọng cùng nhau
                  </Text>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => setShowAddModal(true)}
                  >
                    <Ionicons name="person-add-outline" size={18} color={COLORS.white} style={{ marginRight: 6 }} />
                    <Text style={styles.primaryButtonText}>Thêm kết nối</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                connections.map((conn) => <ConnectionCard key={conn.id} conn={conn} />)
              )}
            </>
          )}

          {activeTab === 'requests' && (
            <>
              {requests.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="mail-open-outline" size={56} color={COLORS.textLight} />
                  <Text style={styles.emptyTitle}>Không có lời mời</Text>
                  <Text style={styles.emptySubtitle}>
                    Khi ai đó gửi lời mời kết nối đến bạn, họ sẽ xuất hiện ở đây
                  </Text>
                </View>
              ) : (
                requests.map((conn) => <RequestCard key={conn.id} conn={conn} />)
              )}
            </>
          )}

          {/* Shared Inbox shortcut */}
          <TouchableOpacity
            style={styles.inboxBanner}
            onPress={() => navigation.navigate('SharedInbox')}
            activeOpacity={0.85}
          >
            <View style={styles.inboxBannerLeft}>
              <Ionicons name="calendar-outline" size={22} color={COLORS.secondary} />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.inboxBannerTitle}>Sự kiện được chia sẻ</Text>
                <Text style={styles.inboxBannerSub}>Xem sự kiện người khác gửi cho bạn</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Add Connection Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseAddModal}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top + 8 }]}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Thêm kết nối</Text>
            <TouchableOpacity onPress={handleCloseAddModal}>
              <Ionicons name="close" size={26} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {/* QR option */}
            <TouchableOpacity
              style={styles.qrOption}
              onPress={() => {
                handleCloseAddModal();
                navigation.navigate('QRScreen');
              }}
            >
              <View style={styles.qrOptionIcon}>
                <Ionicons name="qr-code" size={28} color={COLORS.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.qrOptionTitle}>Quét mã QR</Text>
                <Text style={styles.qrOptionSub}>Quét mã QR từ điện thoại của họ để kết nối nhanh</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>hoặc tìm theo email</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email search */}
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Nhập email người dùng..."
                placeholderTextColor={COLORS.textLight}
                value={searchEmail}
                onChangeText={setSearchEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <TouchableOpacity
                style={[styles.searchBtn, (!searchEmail.trim() || isSearching) && styles.searchBtnDisabled]}
                onPress={handleSearch}
                disabled={!searchEmail.trim() || isSearching}
              >
                {isSearching ? (
                  <ActivityIndicator size={18} color={COLORS.white} />
                ) : (
                  <Ionicons name="search" size={20} color={COLORS.white} />
                )}
              </TouchableOpacity>
            </View>

            {/* Search result */}
            {searchResult && (
              <View style={styles.searchResultCard}>
                <UserAvatar
                  photoUrl={searchResult.user.photoUrl}
                  name={searchResult.user.displayName}
                  email={searchResult.user.email}
                  size={48}
                />
                <View style={styles.searchResultInfo}>
                  <Text style={styles.searchResultName}>
                    {searchResult.user.displayName || 'Người dùng'}
                  </Text>
                  <Text style={styles.searchResultEmail}>{searchResult.user.email}</Text>
                  {searchResult.connectionStatus === 'accepted' && (
                    <Text style={styles.alreadyConnected}>Đã kết nối</Text>
                  )}
                  {searchResult.connectionStatus === 'pending' && (
                    <Text style={styles.pendingStatus}>Đang chờ xác nhận</Text>
                  )}
                </View>

                {searchResult.connectionStatus === null && (
                  <TouchableOpacity
                    style={styles.sendRequestBtn}
                    onPress={handleSendRequest}
                    disabled={isSendingRequest}
                  >
                    {isSendingRequest ? (
                      <ActivityIndicator size={16} color={COLORS.white} />
                    ) : (
                      <>
                        <Ionicons name="person-add" size={16} color={COLORS.white} />
                        <Text style={styles.sendRequestText}>Kết nối</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Tips */}
            <View style={styles.tipBox}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
              <Text style={styles.tipText}>
                Mỗi tài khoản có thể kết nối tối đa {limits?.connectionsMax ?? 5} người. Cả hai bên đều cần chấp nhận để hoàn thành kết nối.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ConnectionsScreen;

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
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
  },
  quotaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  quotaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    justifyContent: 'center',
  },
  quotaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  quotaSep: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.border,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: COLORS.white,
    fontWeight: '700',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  cardEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cardBadge: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 3,
    fontWeight: '500',
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error + '15',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    backgroundColor: COLORS.success,
  },
  declineBtn: {
    backgroundColor: COLORS.error + '18',
    borderWidth: 1,
    borderColor: COLORS.error + '40',
  },
  inboxBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.secondary + '40',
  },
  inboxBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inboxBannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  inboxBannerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  qrOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qrOptionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.secondary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  qrOptionSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchInput: {
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
  searchBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnDisabled: {
    backgroundColor: COLORS.textLight,
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  searchResultEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  alreadyConnected: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 3,
    fontWeight: '500',
  },
  pendingStatus: {
    fontSize: 12,
    color: COLORS.warning,
    marginTop: 3,
    fontWeight: '500',
  },
  sendRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  sendRequestText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.info + '12',
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
