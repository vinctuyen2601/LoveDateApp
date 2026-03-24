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
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

const LAST_UPDATED = '06/03/2026';
const APP_NAME = 'Ngày yêu thương';
const CONTACT_EMAIL = 'support@ngayyeuthuong.com';

const PrivacyPolicyScreen: React.FC = () => {
  const styles = useStyles();
  const colors = useColors();

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
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
            <B>Dữ liệu sự kiện:</B> Tên sự kiện, ngày tháng, nhắc nhở bạn nhập vào ứng dụng.
          </Bullet>
          <Bullet>
            <B>Thông tin tài khoản:</B> Email, tên hiển thị (chỉ khi bạn chọn liên kết tài khoản).
          </Bullet>
          <Bullet>
            <B>Thông tin thiết bị:</B> ID thiết bị ẩn danh dùng để tạo phiên làm việc tự động, không định danh cá nhân.
          </Bullet>
          <Bullet>
            <B>Dữ liệu sử dụng:</B> Màn hình đã xem, thao tác trong ứng dụng (thông qua Google Analytics) nhằm cải thiện trải nghiệm.
          </Bullet>
          <Bullet>
            <B>Kết quả khảo sát:</B> Kết quả MBTI và sở thích (lưu cục bộ trên thiết bị).
          </Bullet>
        </Section>

        <Section title="2. Cách chúng tôi sử dụng thông tin">
          <Bullet>Cung cấp tính năng nhắc nhở các ngày yêu thương và sự kiện quan trọng.</Bullet>
          <Bullet>Đồng bộ dữ liệu giữa các thiết bị (chỉ khi bạn đăng nhập tài khoản).</Bullet>
          <Bullet>Gợi ý quà tặng và hoạt động phù hợp với dịp của bạn.</Bullet>
          <Bullet>Phân tích ẩn danh để cải thiện tính năng ứng dụng.</Bullet>
          <Bullet>Chúng tôi <B>không bán</B> thông tin cá nhân của bạn cho bên thứ ba.</Bullet>
        </Section>

        <Section title="3. Dịch vụ bên thứ ba">
          <P>Ứng dụng sử dụng các dịch vụ bên thứ ba sau:</P>
          <Bullet>
            <B>Google Firebase:</B> Xác thực tài khoản và gửi thông báo đẩy. Firebase có thể thu thập thông tin thiết bị theo{' '}
            <B>Chính sách bảo mật của Google</B>.
          </Bullet>
          <Bullet>
            <B>Google Analytics:</B> Phân tích hành vi sử dụng ẩn danh (màn hình đã xem, tính năng đã dùng). Không thu thập thông tin định danh cá nhân.
          </Bullet>
          <Bullet>
            <B>Liên kết Affiliate:</B> Ứng dụng có liên kết đến sản phẩm/dịch vụ đối tác. Khi bạn mua hàng qua liên kết này, chúng tôi có thể nhận hoa hồng nhỏ — <B>không tốn thêm chi phí của bạn</B>.
          </Bullet>
        </Section>

        <Section title="4. Lưu trữ và bảo mật dữ liệu">
          <Bullet>
            Dữ liệu sự kiện được lưu <B>cục bộ trên thiết bị</B> của bạn bằng SQLite.
          </Bullet>
          <Bullet>
            Nếu bạn liên kết tài khoản, dữ liệu được đồng bộ lên máy chủ bảo mật qua <B>HTTPS</B>.
          </Bullet>
          <Bullet>
            Mã xác thực (token) được lưu trong bộ nhớ an toàn của thiết bị.
          </Bullet>
          <Bullet>
            Chúng tôi lưu trữ dữ liệu chừng nào tài khoản của bạn còn hoạt động hoặc cần thiết để cung cấp dịch vụ.
          </Bullet>
        </Section>

        <Section title="5. Quyền của bạn">
          <Bullet>
            <B>Xem dữ liệu:</B> Toàn bộ dữ liệu bạn nhập luôn hiển thị trong ứng dụng.
          </Bullet>
          <Bullet>
            <B>Xóa tài khoản:</B> Bạn có thể xóa tài khoản trực tiếp trong phần Cài đặt của ứng dụng.
          </Bullet>
          <Bullet>
            <B>Xuất / Xóa dữ liệu:</B> Liên hệ chúng tôi qua email để yêu cầu xuất hoặc xóa toàn bộ dữ liệu.
          </Bullet>
          <Bullet>
            <B>Tắt Analytics:</B> Bạn có thể tắt theo dõi Analytics trong Cài đặt hệ thống (Quyền riêng tư → Theo dõi).
          </Bullet>
        </Section>

        <Section title="6. Thông báo (Push Notifications)">
          <P>
            Ứng dụng gửi thông báo nhắc nhở các ngày yêu thương quan trọng qua <B>Firebase Cloud Messaging</B>.
            Bạn có thể bật/tắt thông báo bất cứ lúc nào trong Cài đặt của thiết bị.
          </P>
        </Section>

        <Section title="7. Trẻ em">
          <P>
            Ứng dụng <B>không hướng đến trẻ em dưới 13 tuổi</B> và không cố ý thu thập thông tin
            cá nhân của trẻ em. Nếu phát hiện chúng tôi vô tình thu thập dữ liệu của trẻ em,
            vui lòng liên hệ ngay để chúng tôi xóa thông tin đó.
          </P>
        </Section>

        <Section title="8. Thay đổi chính sách">
          <P>
            Chúng tôi có thể cập nhật chính sách này theo thời gian. Mọi thay đổi quan trọng sẽ
            được thông báo qua ứng dụng. Việc tiếp tục sử dụng ứng dụng sau khi chính sách thay
            đổi đồng nghĩa với việc bạn chấp nhận các thay đổi đó.
          </P>
        </Section>

        <Section title="9. Liên hệ">
          <P>
            Nếu bạn có câu hỏi về chính sách bảo mật, vui lòng liên hệ:{'\n'}
            <B>{CONTACT_EMAIL}</B>
          </P>
          <P>Website: <B>https://ngayyeuthuong.com</B></P>
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

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
};

const P: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const styles = useStyles();
  return <Text style={styles.paragraph}>{children}</Text>;
};

const Bullet: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const styles = useStyles();
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
};

const B: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const styles = useStyles();
  return <Text style={styles.bold}>{children}</Text>;
};

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textPrimary,
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
    color: colors.textSecondary,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    color: colors.textSecondary,
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
    color: colors.primary,
    marginRight: 8,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  bold: {
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  footer: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
}));export default PrivacyPolicyScreen;
