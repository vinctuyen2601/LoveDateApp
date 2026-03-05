import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api.service';

export interface ManualProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  galleryUrls: string[];
  leadTimeHours: number;
  deliveryAreas: string[];
  occasion: string[];
  tags: string[];
  icon: string;
  color: string;
  isFeatured: boolean;
  isPopular: boolean;
  slug: string;
}

export interface ManualProductListResponse {
  data: ManualProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateOrderPayload {
  productId: string;
  productName: string;
  productPrice: number;
  productImageUrl?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryTimeSlot: string;
  quantity: number;
  totalPrice: number;
  cardMessage?: string;
  specialNotes?: string;
  paymentMethod: string;
  expoPushToken?: string;
}

export const SHOP_CATEGORIES = [
  { key: 'all',      label: 'Tất cả',  icon: 'grid-outline'    },
  { key: 'flower',   label: 'Hoa tươi', icon: 'flower-outline'  },
  { key: 'cake',     label: 'Bánh',    icon: 'gift-outline'    },
  { key: 'combo',    label: 'Combo',   icon: 'basket-outline'  },
  { key: 'handmade', label: 'Handmade', icon: 'heart-outline'   },
] as const;

export const TIME_SLOTS = [
  { value: '8-10',  label: '8:00 – 10:00'  },
  { value: '10-12', label: '10:00 – 12:00' },
  { value: '12-14', label: '12:00 – 14:00' },
  { value: '14-16', label: '14:00 – 16:00' },
  { value: '16-18', label: '16:00 – 18:00' },
];

export async function getManualProducts(params?: {
  category?: string;
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ManualProductListResponse> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== 'all') query.append('category', params.category);
  if (params?.page)   query.append('page',  String(params.page));
  if (params?.limit)  query.append('limit', String(params.limit));
  if (params?.search) query.append('search', params.search);
  const qs = query.toString();
  // getRaw() để giữ nguyên { data, total, page, totalPages } thay vì unwrap .data
  return apiService.getRaw(`/manual-products${qs ? `?${qs}` : ''}`);
}

export async function getCoverageAreas(): Promise<string[]> {
  try {
    const value = await apiService.get('/site-config/local_shop_areas');
    return Array.isArray(value) ? value : [];
  } catch {
    return ['Hà Nội', 'TP.HCM', 'Đà Nẵng'];
  }
}

export async function createOrder(payload: CreateOrderPayload): Promise<{ id: string }> {
  return apiService.post('/orders', payload);
}

// ─── Local order history ───────────────────────────────────────────────────────

export interface LocalOrder {
  id: string;
  productName: string;
  productImageUrl?: string;
  totalPrice: number;
  deliveryDate: string;
  deliveryTimeSlot: string;
  customerPhone: string;
  status: string;
  createdAt: string;
}

const LOCAL_ORDERS_KEY = 'local_shop_orders';

export async function saveOrderLocally(order: LocalOrder): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_ORDERS_KEY);
    const existing: LocalOrder[] = raw ? JSON.parse(raw) : [];
    existing.unshift(order); // newest first
    await AsyncStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(existing.slice(0, 50)));
  } catch { /* noop */ }
}

export async function getLocalOrders(): Promise<LocalOrder[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function trackOrder(orderId: string, phone: string): Promise<LocalOrder & { adminNotes?: string }> {
  return apiService.get(`/orders/track?orderId=${encodeURIComponent(orderId)}&phone=${encodeURIComponent(phone)}`);
}

export async function updateLocalOrderStatus(orderId: string, status: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_ORDERS_KEY);
    if (!raw) return;
    const orders: LocalOrder[] = JSON.parse(raw);
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      orders[idx].status = status;
      await AsyncStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
    }
  } catch { /* noop */ }
}
