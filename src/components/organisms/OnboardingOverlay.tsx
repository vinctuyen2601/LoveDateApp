import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  FlatList,
  ViewToken,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '@themes/colors';

const { width: SW, height: SH } = Dimensions.get('window');
export const ONBOARDING_KEY = '@onboarding_v2_completed';

interface OnboardingPage {
  icon: keyof typeof Ionicons.glyphMap;
  imageSource?: number;
  title: string;
  subtitle: string;
  gradient: [string, string];
  badge?: string;
}

const PAGES: OnboardingPage[] = [
  {
    icon: 'heart-circle',
    imageSource: require('../../../assets/adaptive-icon.png'),
    title: 'Chào mừng đến LoveDate 💕',
    subtitle: 'Ứng dụng giúp bạn không bao giờ quên những ngày quan trọng với người thân yêu',
    gradient: ['#FF6B9D', '#FF8E53'],
    badge: 'Miễn phí',
  },
  {
    icon: 'calendar',
    title: 'Theo dõi ngày đặc biệt',
    subtitle: 'Sinh nhật, kỷ niệm, ngày lễ — nhắc nhở tự động trước ngày diễn ra để bạn luôn chuẩn bị kịp thời',
    gradient: ['#667EEA', '#764BA2'],
  },
  {
    icon: 'sparkles',
    title: 'AI gợi ý hoạt động hẹn hò',
    subtitle: 'Nhập sở thích & ngân sách, AI lên kế hoạch hẹn hò chi tiết — từ địa điểm, thời gian đến những gì cần chuẩn bị',
    gradient: ['#43C59E', '#2196F3'],
    badge: 'AI',
  },
  {
    icon: 'gift',
    title: 'Tìm quà tặng hoàn hảo',
    subtitle: 'Làm khảo sát tính cách và để AI gợi ý những món quà phù hợp nhất — không còn lo "tặng gì bây giờ"',
    gradient: ['#F093FB', '#F5576C'],
    badge: 'AI',
  },
  {
    icon: 'person-add',
    title: 'Đăng ký để mở khóa thêm',
    subtitle: 'Tạo tài khoản miễn phí để được 10 lượt AI/ngày, đồng bộ dữ liệu và không mất dữ liệu khi đổi máy',
    gradient: ['#FF6B9D', '#C850C0'],
  },
];

interface Props {
  onComplete: () => void;
  onRegister?: () => void;
}

const OnboardingOverlay: React.FC<Props> = ({ onComplete, onRegister }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dotWidthAnims = useRef(PAGES.map((_, i) => new Animated.Value(i === 0 ? 22 : 8))).current;

  // Fade in on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Animate dot widths on page change
  useEffect(() => {
    PAGES.forEach((_, i) => {
      Animated.spring(dotWidthAnims[i], {
        toValue: currentPage === i ? 22 : 8,
        useNativeDriver: false,
      }).start();
    });
  }, [currentPage]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentPage(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const dismissedRef = useRef(false);
  const dismiss = (callback?: () => void) => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      onComplete();
      callback?.();
    });
    // Safety fallback if animation callback doesn't fire
    setTimeout(() => {
      onComplete();
      callback?.();
    }, 350);
  };

  const handleNext = () => {
    if (currentPage < PAGES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentPage + 1, animated: true });
    }
  };

  const handleComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    dismiss();
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    dismiss();
  };

  const handleRegister = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      onRegister?.();
    });
  };

  const isLastPage = currentPage === PAGES.length - 1;
  const page = PAGES[currentPage];

  const renderPage = ({ item }: { item: OnboardingPage }) => (
    <View style={styles.page}>
      {item.imageSource ? (
        <View style={styles.appIconWrap}>
          <Image source={item.imageSource} style={styles.appIcon} resizeMode="contain" />
          {item.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
          )}
        </View>
      ) : (
        <LinearGradient
          colors={item.gradient}
          style={styles.iconWrap}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={item.icon} size={72} color="#fff" />
          {item.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
          )}
        </LinearGradient>
      )}

      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <StatusBar barStyle="dark-content" />

      {/* Skip button */}
      <View style={styles.topBar}>
        {!isLastPage && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.skipText}>Bỏ qua</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={PAGES}
        renderItem={renderPage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => i.toString()}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
        style={styles.flatList}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {PAGES.map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              { width: dotWidthAnims[i] },
              currentPage === i && { backgroundColor: page.gradient[0] },
            ]}
          />
        ))}
      </View>

      {/* Bottom actions */}
      <View style={styles.bottomArea}>
        {isLastPage ? (
          <>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleRegister}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={page.gradient}
                style={styles.primaryBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="person-add" size={20} color="#fff" />
                <Text style={styles.primaryBtnText}>Đăng ký miễn phí</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ghostBtn} onPress={handleComplete}>
              <Text style={styles.ghostBtnText}>Dùng thử trước</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
            <LinearGradient
              colors={page.gradient}
              style={styles.nextBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.nextBtnText}>Tiếp theo</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

export const checkOnboardingComplete = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === 'true';
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    zIndex: 9999,
    elevation: 9999,
  },
  topBar: {
    height: 56,
    paddingTop: 12,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: COLORS.border + '80',
  },
  skipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  flatList: {
    flex: 1,
  },
  page: {
    width: SW,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingBottom: 20,
  },
  appIconWrap: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  appIcon: {
    width: 180,
    height: 180,
  },
  iconWrap: {
    width: 148,
    height: 148,
    borderRadius: 74,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 12,
  },
  primaryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  ghostBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  ghostBtnText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  nextBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default OnboardingOverlay;
