import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@themes/colors';
import { SubscriptionProduct, PremiumSubscription } from '../types';
import * as PremiumService from '../services/premium.service';
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

const PremiumScreen: React.FC = () => {
  const styles = useStyles();
  const colors = useColors();

  const db = useSQLiteContext();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [selectedProduct, setSelectedProduct] = useState<SubscriptionProduct>(
    PremiumService.SUBSCRIPTION_PRODUCTS[1] // Default to yearly (popular)
  );
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<PremiumSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setIsLoading(true);
      const subscription = await PremiumService.getUserSubscription(db, 'default-user');
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    try {
      setIsPurchasing(true);

      // In production, this would use expo-in-app-purchases or react-native-iap
      // For now, use mock purchase
      Alert.alert(
        'Xác nhận mua hàng',
        `Bạn muốn mua ${selectedProduct.name} với giá ${selectedProduct.price}?`,
        [
          {
            text: 'Hủy',
            style: 'cancel',
            onPress: () => setIsPurchasing(false),
          },
          {
            text: 'Mua ngay',
            onPress: async () => {
              try {
                await PremiumService.mockPurchase(
                  db,
                  'default-user',
                  selectedProduct.id,
                  Platform.OS as 'ios' | 'android'
                );

                Alert.alert(
                  'Thành công!',
                  'Cảm ơn bạn đã nâng cấp lên Premium! Tất cả tính năng đã được mở khóa.',
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack(),
                    },
                  ]
                );
              } catch (error: any) {
                Alert.alert('Lỗi', error.message || 'Không thể hoàn tất giao dịch');
              } finally {
                setIsPurchasing(false);
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Lỗi', error.message);
      setIsPurchasing(false);
    }
  };

  const handleRestorePurchase = async () => {
    Alert.alert(
      'Khôi phục mua hàng',
      'Tính năng này sẽ kiểm tra và khôi phục các giao dịch mua trước đó của bạn.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Khôi phục',
          onPress: () => {
            Alert.alert('Thông báo', 'Chức năng khôi phục sẽ được tích hợp với IAP thực tế');
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  // If already premium, show status
  if (currentSubscription && currentSubscription.status === 'active') {
    return (
      <ScrollView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.activePremiumContainer}>
          <View style={styles.premiumBadge}>
            <Ionicons name="checkmark-circle" size={80} color={colors.success} />
          </View>
          <Text style={styles.activePremiumTitle}>Bạn đang dùng Premium!</Text>
          <Text style={styles.activePremiumSubtitle}>
            Cảm ơn bạn đã ủng hộ ứng dụng
          </Text>

          <View style={styles.subscriptionInfoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Gói:</Text>
              <Text style={styles.infoValue}>
                {currentSubscription.subscriptionType === 'monthly' ? 'Tháng' : 'Năm'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ngày mua:</Text>
              <Text style={styles.infoValue}>
                {new Date(currentSubscription.purchaseDate).toLocaleDateString('vi-VN')}
              </Text>
            </View>
            {currentSubscription.expiryDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Hết hạn:</Text>
                <Text style={styles.infoValue}>
                  {new Date(currentSubscription.expiryDate).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.featuresTitle}>Tính năng đã mở khóa:</Text>
          <View style={styles.featuresList}>
            {(selectedProduct.features.featureList || []).map((feature: string, index: number) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.premiumIconContainer}>
          <Ionicons name="star" size={60} color={colors.warning} />
        </View>
        <Text style={styles.heroTitle}>Nâng cấp lên Premium</Text>
        <Text style={styles.heroSubtitle}>
          Mở khóa tất cả tính năng và tận hưởng trải nghiệm tốt nhất
        </Text>
      </View>

      {/* Subscription Plans */}
      <View style={styles.plansSection}>
        <Text style={styles.sectionTitle}>Chọn gói phù hợp</Text>

        {PremiumService.SUBSCRIPTION_PRODUCTS.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={[
              styles.planCard,
              selectedProduct.id === product.id && styles.planCardSelected,
              product.isPopular && styles.planCardPopular,
            ]}
            onPress={() => setSelectedProduct(product)}
            activeOpacity={0.7}
          >
            {product.isPopular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>PHỔ BIẾN</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <View>
                <Text style={styles.planName}>{product.name}</Text>
                <Text style={styles.planDescription}>{product.description}</Text>
              </View>
              <View style={styles.planPriceContainer}>
                <Text style={styles.planPrice}>{product.price.toLocaleString('vi-VN')}đ</Text>
                <Text style={styles.planDuration}>/ {product.billingCycle === 'monthly' ? 'tháng' : 'năm'}</Text>
              </View>
            </View>

            {selectedProduct.id === product.id && (
              <View style={styles.selectedIndicator}>
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Features List */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Tính năng Premium</Text>

        {(selectedProduct.features.featureList || []).map((feature: string, index: number) => (
          <View key={index} style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {/* Purchase Button */}
      <View style={styles.purchaseSection}>
        <TouchableOpacity
          style={[styles.purchaseButton, isPurchasing && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={isPurchasing}
        >
          {isPurchasing ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="lock-open" size={20} color={colors.white} />
              <Text style={styles.purchaseButtonText}>
                Mua {selectedProduct.name} - {selectedProduct.price}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreButton} onPress={handleRestorePurchase}>
          <Text style={styles.restoreButtonText}>Khôi phục mua hàng</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Thanh toán sẽ được tính vào tài khoản {Platform.OS === 'ios' ? 'Apple' : 'Google Play'} của bạn.
          Gói đăng ký sẽ tự động gia hạn trừ khi bạn hủy trước 24h.
        </Text>
      </View>

      {/* Bottom Spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 32,
  },
  premiumIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.warning}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  plansSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}05`,
  },
  planCardPopular: {
    borderColor: colors.warning,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: colors.white,
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: 18,
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  planPriceContainer: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 24,
    fontFamily: 'Manrope_700Bold',
    color: colors.primary,
  },
  planDuration: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  featuresSection: {
    paddingHorizontal: 16,
    marginTop: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  purchaseSection: {
    paddingHorizontal: 16,
    marginTop: 32,
  },
  purchaseButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    fontSize: 17,
    fontFamily: 'Manrope_700Bold',
    color: colors.white,
  },
  restoreButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  restoreButtonText: {
    fontSize: 15,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.primary,
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  activePremiumContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  premiumBadge: {
    marginBottom: 24,
  },
  activePremiumTitle: {
    fontSize: 28,
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  activePremiumSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  subscriptionInfoCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textPrimary,
  },
  featuresTitle: {
    fontSize: 18,
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  featuresList: {
    width: '100%',
  },
}));export default PremiumScreen;
