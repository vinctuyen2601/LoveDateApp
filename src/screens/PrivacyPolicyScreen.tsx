import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@themes/colors';

const LAST_UPDATED = '27/02/2025';
const APP_NAME = 'Ngày Quan Trọng';
const CONTACT_EMAIL = 'support@ngayquantrong.app';

const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chính sách bảo mật</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Cập nhật lần cuối: {LAST_UPDATED}</Text>

        <Section title="1. Thông tin chúng tôi thu thập">
          <P>
            Ứng dụng <B>{APP_NAME}</B> thu thập các thông tin sau để cung cấp dịch vụ:
          </P>
          <Bullet>
            <B>Dữ liệu sự kiện:</B> Tên sự kiện, ngày tháng, ghi chú bạn nhập vào ứng dụng.
          </Bullet>
          <Bullet>
            <B>Thông tin tài khoản:</B> Email, tên hiển thị (nếu bạn chọn liên kết tài khoản).
          </Bullet>
          <Bullet>
            <B>Thông tin thiết bị:</B> ID thiết bị ẩn danh dùng để tạo phiên làm việc tự động.
          </Bullet>
          <Bullet>
            <B>Dữ liệu sử dụng:</B> Kết quả khảo sát MBTI (lưu cục bộ trên thiết bị).
          </Bullet>
        </Section>

        <Section title="2. Cách chúng tôi sử dụng thông tin">
          <Bullet>Cung cấp tính năng nhắc nhở ngày quan trọng.</Bullet>
          <Bullet>Đồng bộ dữ liệu giữa các thiết bị (nếu bạn đăng nhập).</Bullet>
          <Bullet>Gợi ý quà tặng và hoạt động phù hợp với dịp của bạn.</Bullet>
          <Bullet>Chúng tôi <B>không bán</B> thông tin cá nhân của bạn cho bên thứ ba.</Bullet>
        </Section>

        <Section title="3. Liên kết affiliate">
          <P>
            Ứng dụng có chứa <B>liên kết affiliate</B> đến các sản phẩm và dịch vụ của đối tác.
            Khi bạn nhấn vào các liên kết này và thực hiện mua hàng, chúng tôi có thể nhận được
            một khoản hoa hồng nhỏ — <B>không tốn thêm chi phí nào của bạn</B>.
          </P>
          <P>
            Tất cả liên kết affiliate đều được đánh dấu rõ ràng. Chúng tôi chỉ giới thiệu các
            sản phẩm chúng tôi tin là phù hợp và có giá trị với người dùng.
          </P>
        </Section>

        <Section title="4. Lưu trữ và bảo mật dữ liệu">
          <Bullet>
            Dữ liệu sự kiện được lưu <B>cục bộ trên thiết bị</B> của bạn bằng SQLite.
          </Bullet>
          <Bullet>
            Nếu bạn liên kết tài khoản, dữ liệu được đồng bộ lên máy chủ bảo mật qua HTTPS.
          </Bullet>
          <Bullet>
            Mã xác thực (token) được lưu mã hóa trong bộ nhớ an toàn của thiết bị.
          </Bullet>
        </Section>

        <Section title="5. Quyền của bạn">
          <Bullet>
            <B>Xem dữ liệu:</B> Toàn bộ dữ liệu bạn nhập luôn hiển thị trong ứng dụng.
          </Bullet>
          <Bullet>
            <B>Xóa / Xuất dữ liệu:</B> Liên hệ chúng tôi qua email để yêu cầu xóa hoặc xuất
            toàn bộ dữ liệu của bạn.
          </Bullet>
        </Section>

        <Section title="6. Thông báo (Push Notifications)">
          <P>
            Ứng dụng gửi thông báo nhắc nhở các ngày quan trọng. Bạn có thể bật/tắt thông báo
            bất cứ lúc nào trong cài đặt hệ thống của thiết bị.
          </P>
        </Section>

        <Section title="7. Thay đổi chính sách">
          <P>
            Chúng tôi có thể cập nhật chính sách này theo thời gian. Mọi thay đổi quan trọng sẽ
            được thông báo qua ứng dụng. Việc tiếp tục sử dụng ứng dụng sau khi chính sách thay
            đổi đồng nghĩa với việc bạn chấp nhận các thay đổi đó.
          </P>
        </Section>

        <Section title="8. Liên hệ">
          <P>
            Nếu bạn có câu hỏi về chính sách bảo mật, vui lòng liên hệ:{'\n'}
            <B>{CONTACT_EMAIL}</B>
          </P>
        </Section>

        <View style={styles.divider} />
        <Text style={styles.footer}>
          Bằng cách sử dụng {APP_NAME}, bạn đồng ý với chính sách bảo mật này.
        </Text>
      </ScrollView>
    </View>
  );
};

// ── Small helper components ───────────────────────────────────────────────────

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={styles.paragraph}>{children}</Text>
);

const Bullet: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.bulletRow}>
    <Text style={styles.bulletDot}>•</Text>
    <Text style={styles.bulletText}>{children}</Text>
  </View>
);

const B: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={styles.bold}>{children}</Text>
);

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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  updated: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 4,
  },
  bulletDot: {
    fontSize: 14,
    color: COLORS.primary,
    marginRight: 8,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
  },
  footer: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});

export default PrivacyPolicyScreen;
