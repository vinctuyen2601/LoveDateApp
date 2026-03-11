import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { format, addDays } from "date-fns";
import { vi } from "date-fns/locale";
import * as Notifications from "expo-notifications";
import { COLORS } from "@themes/colors";
import {
  ManualProduct,
  LocalOrder,
  SHOP_CATEGORIES,
  TIME_SLOTS,
  getManualProducts,
  getCoverageAreas,
  createOrder,
  saveOrderLocally,
  getLocalOrders,
  trackOrder,
  updateLocalOrderStatus,
} from "../services/localShopService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 32 - 12) / 2;
const DELIVERY_DATES_COUNT = 14;

// ─── Product card ─────────────────────────────────────────────────────────────

const ShopProductCard: React.FC<{
  product: ManualProduct;
  onOrder: (p: ManualProduct) => void;
}> = React.memo(({ product, onOrder }) => {
  const discount =
    product.originalPrice &&
    Number(product.originalPrice) > Number(product.price)
      ? Math.round(
          (1 - Number(product.price) / Number(product.originalPrice)) * 100
        )
      : 0;

  return (
    <View style={[styles.card, { width: CARD_WIDTH }]}>
      {product.imageUrl ? (
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.cardIconBox,
            { backgroundColor: (product.color || COLORS.primary) + "20" },
          ]}
        >
          <Ionicons name="flower-outline" size={28} color={product.color || COLORS.primary} />
        </View>
      )}

      {discount > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{discount}%</Text>
        </View>
      )}
      {product.isPopular && (
        <View style={styles.popularBadge}>
          <Ionicons name="flame" size={10} color="#fff" /><Text style={styles.popularText}> Hot</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.cardPriceRow}>
          <Text style={styles.cardPrice}>
            {Number(product.price).toLocaleString("vi-VN")}₫
          </Text>
          {product.originalPrice &&
            Number(product.originalPrice) > Number(product.price) && (
              <Text style={styles.cardOriginal}>
                {Number(product.originalPrice).toLocaleString("vi-VN")}₫
              </Text>
            )}
        </View>
        <Text style={styles.cardDelivery}>
          🕐 Giao trong {product.leadTimeHours}h
        </Text>
        <TouchableOpacity
          style={[
            styles.orderBtn,
            { backgroundColor: product.color || COLORS.primary },
          ]}
          onPress={() => onOrder(product)}
          activeOpacity={0.85}
        >
          <Text style={styles.orderBtnText}>Đặt ngay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

// ─── Order form state ─────────────────────────────────────────────────────────

interface OrderForm {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryTimeSlot: string;
  quantity: number;
  cardMessage: string;
  specialNotes: string;
}

const EMPTY_FORM: OrderForm = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  deliveryAddress: "",
  deliveryDate: "",
  deliveryTimeSlot: "10-12",
  quantity: 1,
  cardMessage: "",
  specialNotes: "",
};

// ─── Main screen ──────────────────────────────────────────────────────────────

const LocalShopScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  // Data
  const [category, setCategory] = useState("all");
  const [products, setProducts] = useState<ManualProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [coverageAreas, setCoverageAreas] = useState<string[]>([]);

  // UI state
  const [coverageModal, setCoverageModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ManualProduct | null>(
    null
  );
  const [form, setForm] = useState<OrderForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [orderId, setOrderId] = useState("");

  // My orders state
  const [ordersModal, setOrdersModal] = useState(false);
  const [myOrders, setMyOrders] = useState<LocalOrder[]>([]);
  const [trackingId, setTrackingId] = useState<string | null>(null);

  // Push notification token
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const notiListenerRef = useRef<Notifications.Subscription | null>(null);

  // Lấy expo push token và lắng nghe noti hủy đơn
  useEffect(() => {
    Notifications.getExpoPushTokenAsync()
      .then((t) => setExpoPushToken(t.data))
      .catch(() => {
        /* permission chưa grant — bỏ qua */
      });

    // Khi người dùng bấm vào notification hủy đơn → mở "Đơn hàng của tôi"
    notiListenerRef.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as any;
        if (data?.type === "order_cancelled") {
          openMyOrders();
        }
      });

    return () => {
      notiListenerRef.current?.remove();
    };
  }, []);

  // Load products + coverage areas
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [res, areas] = await Promise.all([
          getManualProducts({
            category: category !== "all" ? category : undefined,
            limit: 20,
          }),
          getCoverageAreas(),
        ]);
        if (!cancelled) {
          setProducts(res?.data ?? []);
          setCoverageAreas(areas);
        }
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [category]);

  // Show coverage modal on mount
  useEffect(() => {
    const t = setTimeout(() => setCoverageModal(true), 400);
    return () => clearTimeout(t);
  }, []);

  const openMyOrders = async () => {
    const orders = await getLocalOrders();
    setMyOrders(orders);
    setOrdersModal(true);
  };

  const handleTrackOrder = async (order: LocalOrder) => {
    setTrackingId(order.id);
    try {
      const updated = await trackOrder(order.id, order.customerPhone);
      const newStatus = updated.status ?? order.status;
      await updateLocalOrderStatus(order.id, newStatus);
      setMyOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
      );
    } catch {
      Alert.alert("Không thể kiểm tra", "Vui lòng thử lại sau.");
    } finally {
      setTrackingId(null);
    }
  };

  const handleOrderPress = (product: ManualProduct) => {
    const minDays = Math.max(1, Math.ceil(product.leadTimeHours / 24));
    const firstDate = addDays(new Date(), minDays);
    setForm({
      ...EMPTY_FORM,
      deliveryDate: format(firstDate, "yyyy-MM-dd"),
    });
    setSelectedProduct(product);
  };

  const setField = (field: keyof OrderForm, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!selectedProduct) return;

    // Basic validation
    if (!form.customerName.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập họ và tên người nhận.");
      return;
    }
    const phone = form.customerPhone.trim().replace(/\s/g, "");
    if (!/^\d{9,11}$/.test(phone)) {
      Alert.alert(
        "Số điện thoại không hợp lệ",
        "Vui lòng nhập số điện thoại đúng định dạng."
      );
      return;
    }
    if (!form.deliveryAddress.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập địa chỉ giao hàng.");
      return;
    }
    if (!form.deliveryDate) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn ngày giao hàng.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createOrder({
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productPrice: Number(selectedProduct.price),
        productImageUrl: selectedProduct.imageUrl,
        customerName: form.customerName.trim(),
        customerPhone: phone,
        customerEmail: form.customerEmail.trim() || undefined,
        deliveryAddress: form.deliveryAddress.trim(),
        deliveryDate: form.deliveryDate,
        deliveryTimeSlot: form.deliveryTimeSlot,
        quantity: form.quantity,
        totalPrice: Number(selectedProduct.price) * form.quantity,
        cardMessage: form.cardMessage.trim() || undefined,
        specialNotes: form.specialNotes.trim() || undefined,
        paymentMethod: "cod",
        expoPushToken,
      });
      const newOrderId = res?.id ?? "";
      setOrderId(newOrderId);
      setSelectedProduct(null);
      setSuccessModal(true);
      if (newOrderId) {
        await saveOrderLocally({
          id: newOrderId,
          productName: selectedProduct.name,
          productImageUrl: selectedProduct.imageUrl,
          totalPrice: Number(selectedProduct.price) * form.quantity,
          deliveryDate: form.deliveryDate,
          deliveryTimeSlot: form.deliveryTimeSlot,
          customerPhone: form.customerPhone.trim().replace(/\s/g, ""),
          status: "pending",
          createdAt: new Date().toISOString(),
        });
      }
    } catch {
      Alert.alert("Đặt hàng thất bại", "Vui lòng kiểm tra kết nối và thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  // Available delivery dates based on product lead time
  const availableDates = selectedProduct
    ? Array.from({ length: DELIVERY_DATES_COUNT }, (_, i) =>
        addDays(
          new Date(),
          Math.max(1, Math.ceil(selectedProduct.leadTimeHours / 24)) + i
        )
      )
    : [];

  const renderItem = useCallback(
    ({ item }: { item: ManualProduct }) => (
      <ShopProductCard product={item} onOrder={handleOrderPress} />
    ),
    []
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Đặt hoa, bánh và quà</Text>
          <Text style={styles.headerSub}>Giao tận nơi trong ngày</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 4 }}>
          <TouchableOpacity style={styles.iconBtn} onPress={openMyOrders}>
            <Ionicons name="receipt-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setCoverageModal(true)}
          >
            <Ionicons
              name="location-outline"
              size={22}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Category filter ── */}
      <View style={styles.categoryBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {SHOP_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.chip, category === cat.key && styles.chipActive]}
              onPress={() => setCategory(cat.key)}
            >
              <Ionicons
                name={cat.icon as any}
                size={13}
                color={
                  category === cat.key ? COLORS.white : COLORS.textSecondary
                }
              />
              <Text
                style={[
                  styles.chipText,
                  category === cat.key && styles.chipTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Product grid ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.stateText}>Đang tải sản phẩm...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="flower-outline" size={48} color={COLORS.border} />
          <Text style={styles.stateText}>
            Chưa có sản phẩm trong danh mục này
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ──────────────────────────────────────────────────────────────────────
          My Orders modal
      ────────────────────────────────────────────────────────────────────── */}
      <Modal
        visible={ordersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setOrdersModal(false)}
      >
        <View style={styles.overlay}>
          <View
            style={[
              styles.orderSheet,
              { paddingBottom: insets.bottom + 8, maxHeight: "80%" },
            ]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Đơn hàng của tôi</Text>
              <TouchableOpacity onPress={() => setOrdersModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            {myOrders.length === 0 ? (
              <View style={[styles.center, { paddingVertical: 40 }]}>
                <Text style={{ fontSize: 36 }}>📦</Text>
                <Text style={styles.stateText}>Chưa có đơn hàng nào</Text>
              </View>
            ) : (
              <ScrollView
                contentContainerStyle={{ padding: 16, gap: 12 }}
                showsVerticalScrollIndicator={false}
              >
                {myOrders.map((order) => {
                  const STATUS_MAP: Record<
                    string,
                    { label: string; color: string }
                  > = {
                    pending: { label: "Chờ xác nhận", color: "#888" },
                    confirmed: { label: "Đã xác nhận", color: "#1677ff" },
                    preparing: { label: "Đang chuẩn bị", color: "#fa8c16" },
                    delivering: { label: "Đang giao", color: "#722ed1" },
                    delivered: { label: "Đã giao", color: COLORS.success },
                    cancelled: { label: "Đã hủy", color: COLORS.error },
                  };
                  const s = STATUS_MAP[order.status] ?? {
                    label: order.status,
                    color: "#888",
                  };
                  const isTracking = trackingId === order.id;
                  return (
                    <View key={order.id} style={styles.orderHistoryCard}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        {order.productImageUrl ? (
                          <Image
                            source={{ uri: order.productImageUrl }}
                            style={styles.historyImg}
                            resizeMode="cover"
                          />
                        ) : (
                          <View
                            style={[
                              styles.historyImg,
                              {
                                backgroundColor: COLORS.background,
                                alignItems: "center",
                                justifyContent: "center",
                              },
                            ]}
                          >
                            <Ionicons name="flower-outline" size={22} color={COLORS.primary} />
                          </View>
                        )}
                        <View style={{ flex: 1, gap: 3 }}>
                          <Text style={styles.historyName} numberOfLines={1}>
                            {order.productName}
                          </Text>
                          <Text style={styles.historyPrice}>
                            {Number(order.totalPrice).toLocaleString("vi-VN")}₫
                          </Text>
                          <View style={{flexDirection:'row',alignItems:'center',gap:4}}>
                            <Ionicons name="calendar-outline" size={12} color={COLORS.textSecondary} />
                            <Text style={styles.historyDate}>{order.deliveryDate} · {order.deliveryTimeSlot}h</Text>
                          </View>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: s.color + "18" },
                            ]}
                          >
                            <Text
                              style={[styles.statusText, { color: s.color }]}
                            >
                              {s.label}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.trackBtn,
                            isTracking && { opacity: 0.5 },
                          ]}
                          onPress={() => handleTrackOrder(order)}
                          disabled={isTracking}
                        >
                          {isTracking ? (
                            <ActivityIndicator
                              size="small"
                              color={COLORS.primary}
                            />
                          ) : (
                            <Ionicons
                              name="refresh-outline"
                              size={18}
                              color={COLORS.primary}
                            />
                          )}
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.historyOrderId}>
                        Mã: {order.id.slice(0, 8).toUpperCase()}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ──────────────────────────────────────────────────────────────────────
          Coverage warning modal
      ────────────────────────────────────────────────────────────────────── */}
      <Modal
        visible={coverageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setCoverageModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.coverageCard}>
            <Text style={styles.coverageEmoji}>📍</Text>
            <Text style={styles.coverageTitle}>Khu vực giao hàng</Text>
            <Text style={styles.coverageSub}>
              Hiện tại chúng tôi đang hỗ trợ giao hàng tại:
            </Text>

            <View style={styles.areasList}>
              {coverageAreas.map((area, i) => (
                <View key={i} style={styles.areaRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={COLORS.success}
                  />
                  <Text style={styles.areaText}>{area}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.coverageNote}>
              Chúng tôi đang mở rộng thêm nhiều thành phố. Cảm ơn bạn đã ủng hộ!
              💚
            </Text>

            <TouchableOpacity
              style={styles.coverageBtn}
              onPress={() => setCoverageModal(false)}
            >
              <Text style={styles.coverageBtnText}>
                Đã hiểu, tiếp tục mua sắm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ──────────────────────────────────────────────────────────────────────
          Order form modal
      ────────────────────────────────────────────────────────────────────── */}
      <Modal
        visible={!!selectedProduct}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedProduct(null)}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={[styles.orderSheet, { paddingBottom: insets.bottom + 8 }]}
          >
            <View style={styles.sheetHandle} />

            {/* Sheet header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Thông tin đặt hàng</Text>
              <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Product summary */}
              {selectedProduct && (
                <View style={styles.productSummary}>
                  {selectedProduct.imageUrl ? (
                    <Image
                      source={{ uri: selectedProduct.imageUrl }}
                      style={styles.summaryImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.summaryImgPlaceholder,
                        {
                          backgroundColor:
                            (selectedProduct.color || COLORS.primary) + "20",
                        },
                      ]}
                    >
                      <Ionicons name="flower-outline" size={24} color={selectedProduct.color || COLORS.primary} />
                    </View>
                  )}
                  <View style={styles.summaryInfo}>
                    <Text style={styles.summaryName} numberOfLines={2}>
                      {selectedProduct.name}
                    </Text>
                    <Text style={styles.summaryPrice}>
                      {Number(selectedProduct.price).toLocaleString("vi-VN")}₫
                    </Text>
                  </View>
                </View>
              )}

              {/* Quantity */}
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Số lượng</Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() =>
                      setField("quantity", Math.max(1, form.quantity - 1))
                    }
                  >
                    <Ionicons
                      name="remove"
                      size={18}
                      color={COLORS.textPrimary}
                    />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{form.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setField("quantity", form.quantity + 1)}
                  >
                    <Ionicons name="add" size={18} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Customer info */}
              <Text style={styles.sectionLabel}>Thông tin người nhận</Text>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Họ và tên *"
                  placeholderTextColor={COLORS.textLight}
                  value={form.customerName}
                  onChangeText={(v) => setField("customerName", v)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Số điện thoại *"
                  placeholderTextColor={COLORS.textLight}
                  value={form.customerPhone}
                  onChangeText={(v) => setField("customerPhone", v)}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email (tuỳ chọn)"
                  placeholderTextColor={COLORS.textLight}
                  value={form.customerEmail}
                  onChangeText={(v) => setField("customerEmail", v)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  style={[styles.input, styles.inputMulti]}
                  placeholder="Địa chỉ giao hàng *"
                  placeholderTextColor={COLORS.textLight}
                  value={form.deliveryAddress}
                  onChangeText={(v) => setField("deliveryAddress", v)}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>

              {/* Delivery date */}
              <Text style={styles.sectionLabel}>Ngày giao hàng</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateScroll}
              >
                {availableDates.map((date) => {
                  const ds = format(date, "yyyy-MM-dd");
                  const active = form.deliveryDate === ds;
                  return (
                    <TouchableOpacity
                      key={ds}
                      style={[styles.dateChip, active && styles.dateChipActive]}
                      onPress={() => setField("deliveryDate", ds)}
                    >
                      <Text
                        style={[styles.dateDow, active && styles.dateDowActive]}
                      >
                        {format(date, "EEE", { locale: vi })}
                      </Text>
                      <Text
                        style={[styles.dateNum, active && styles.dateNumActive]}
                      >
                        {format(date, "d/M")}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Time slot */}
              <Text style={styles.sectionLabel}>Khung giờ giao</Text>
              <View style={styles.timeSlotsGrid}>
                {TIME_SLOTS.map((slot) => {
                  const active = form.deliveryTimeSlot === slot.value;
                  return (
                    <TouchableOpacity
                      key={slot.value}
                      style={[styles.timeChip, active && styles.timeChipActive]}
                      onPress={() => setField("deliveryTimeSlot", slot.value)}
                    >
                      <Text
                        style={[
                          styles.timeChipText,
                          active && styles.timeChipTextActive,
                        ]}
                      >
                        {slot.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Card message */}
              <Text style={styles.sectionLabel}>Lời thiệp (tuỳ chọn)</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholder="Lời nhắn muốn ghi trên thiệp..."
                placeholderTextColor={COLORS.textLight}
                value={form.cardMessage}
                onChangeText={(v) => setField("cardMessage", v)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Special notes */}
              <Text style={styles.sectionLabel}>Ghi chú thêm (tuỳ chọn)</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholder="Màu sắc, yêu cầu đặc biệt..."
                placeholderTextColor={COLORS.textLight}
                value={form.specialNotes}
                onChangeText={(v) => setField("specialNotes", v)}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />

              {/* Payment */}
              <View style={styles.paymentRow}>
                <Ionicons
                  name="cash-outline"
                  size={18}
                  color={COLORS.success}
                />
                <Text style={styles.paymentText}>
                  Thanh toán khi nhận hàng (COD)
                </Text>
              </View>

              {/* Total */}
              {selectedProduct && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tổng thanh toán</Text>
                  <Text style={styles.totalValue}>
                    {(
                      Number(selectedProduct.price) * form.quantity
                    ).toLocaleString("vi-VN")}
                    ₫
                  </Text>
                </View>
              )}

              {/* Submit */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  submitting && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={COLORS.white}
                    />
                    <Text style={styles.submitBtnText}>Xác nhận đặt hàng</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ──────────────────────────────────────────────────────────────────────
          Success modal
      ────────────────────────────────────────────────────────────────────── */}
      <Modal
        visible={successModal}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
            <Text style={styles.successTitle}>Đặt hàng thành công!</Text>
            <Text style={styles.successSub}>
              Chúng tôi sẽ liên hệ xác nhận đơn hàng trong vòng 30 phút.
            </Text>
            {orderId ? (
              <View style={styles.orderIdRow}>
                <Text style={styles.orderIdLabel}>Mã đơn:</Text>
                <Text style={styles.orderIdValue}>
                  {orderId.slice(0, 8).toUpperCase()}
                </Text>
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => {
                setSuccessModal(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.successBtnText}>Về trang chủ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  // Category
  categoryBar: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 8,
  },
  chipsRow: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.white,
    fontWeight: "700",
  },

  // Grid
  grid: {
    padding: 16,
    paddingBottom: 32,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
  },

  // Product card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardImage: {
    width: "100%",
    height: 120,
  },
  cardIconBox: {
    width: "100%",
    height: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  cardIconEmoji: {
    fontSize: 36,
  },
  discountBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.white,
  },
  popularBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  popularText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#E65100",
  },
  cardBody: {
    padding: 10,
    gap: 4,
  },
  cardName: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
    lineHeight: 18,
    minHeight: 36,
  },
  cardPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.success,
  },
  cardOriginal: {
    fontSize: 11,
    color: COLORS.textLight,
    textDecorationLine: "line-through",
  },
  cardDelivery: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  orderBtn: {
    marginTop: 4,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: "center",
  },
  orderBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
  },

  // Center state
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  stateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  // Overlay
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  // Coverage modal
  coverageCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    alignItems: "center",
  },
  coverageEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  coverageTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  coverageSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  areasList: {
    width: "100%",
    gap: 8,
    marginBottom: 16,
  },
  areaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  areaText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  coverageNote: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 20,
    lineHeight: 19,
  },
  coverageBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignSelf: "stretch",
    alignItems: "center",
  },
  coverageBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },

  // Order sheet
  orderSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  sheetContent: {
    padding: 20,
    gap: 4,
  },

  // Product summary
  productSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  summaryImg: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  summaryImgPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryInfo: {
    flex: 1,
    gap: 4,
  },
  summaryName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  summaryPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.success,
  },

  // Field row
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },

  // Quantity
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textPrimary,
    minWidth: 24,
    textAlign: "center",
  },

  // Section label
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },

  // Input group
  inputGroup: {
    gap: 10,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  inputMulti: {
    paddingTop: 12,
    minHeight: 60,
  },

  // Date selector
  dateScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  dateChip: {
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    minWidth: 54,
  },
  dateChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dateDow: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.textSecondary,
    textTransform: "capitalize",
  },
  dateDowActive: {
    color: "rgba(255,255,255,0.8)",
  },
  dateNum: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  dateNumActive: {
    color: COLORS.white,
  },

  // Time slots
  timeSlotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  timeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  timeChipTextActive: {
    color: COLORS.white,
    fontWeight: "700",
  },

  // Payment row
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.success + "10",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  paymentText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },

  // Total row
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
  },

  // Submit button
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },

  // Success modal
  successCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 28,
    width: "100%",
    alignItems: "center",
  },
  successEmoji: {
    fontSize: 52,
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  successSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  orderIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
  },
  orderIdLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  orderIdValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 1,
  },
  successBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  successBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },

  // Order history
  orderHistoryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  historyImg: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  historyName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  historyPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.success,
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  historyOrderId: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  trackBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default LocalShopScreen;
