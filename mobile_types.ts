// src/types/index.ts

export enum EventCategory {
  BIRTHDAY = 'birthday',
  ANNIVERSARY = 'anniversary',
  HOLIDAY = 'holiday',
  OTHER = 'other',
}

export enum RelationshipType {
  WIFE = 'wife',
  HUSBAND = 'husband',
  CHILD = 'child',
  PARENT = 'parent',
  SIBLING = 'sibling',
  FRIEND = 'friend',
  COLLEAGUE = 'colleague',
  OTHER = 'other',
}

export interface ReminderSettings {
  remindDaysBefore: number[];
  customTimes?: string[];
}

export interface EventNote {
  year: number;
  gift?: string;
  activity?: string;
  notes?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  eventDate: Date;
  isLunarCalendar: boolean;
  category: EventCategory;
  relationshipType: RelationshipType;
  reminderSettings: ReminderSettings;
  giftIdeas: string[];
  notes: EventNote[];
  isRecurring: boolean;
  isDeleted: boolean;
  localId?: string;
  serverId?: string;
  version: number;
  needsSync?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
  firebaseUid?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncAt: Date | null;
  lastSyncVersion: number;
  error: string | null;
}

// Gift suggestion data
export const GIFT_SUGGESTIONS: Record<RelationshipType, string[]> = {
  [RelationshipType.WIFE]: [
    'Hoa hồng',
    'Nước hoa',
    'Trang sức',
    'Túi xách',
    'Spa voucher',
    'Đồng hồ',
    'Điện thoại mới',
    'Du lịch',
  ],
  [RelationshipType.HUSBAND]: [
    'Đồng hồ',
    'Ví da',
    'Nước hoa',
    'Áo sơ mi',
    'Giày da',
    'Điện thoại',
    'Tai nghe',
    'Du lịch',
  ],
  [RelationshipType.CHILD]: [
    'Đồ chơi',
    'Sách',
    'Quần áo',
    'Xe đạp',
    'Điện thoại',
    'Laptop',
    'Dụng cụ học tập',
    'Tiền mừng tuổi',
  ],
  [RelationshipType.PARENT]: [
    'Quà sức khỏe',
    'Máy massage',
    'Chăn ấm',
    'Quần áo',
    'Đồng hồ',
    'Du lịch',
    'Tiền mặt',
    'Điện thoại',
  ],
  [RelationshipType.SIBLING]: [
    'Quần áo',
    'Mỹ phẩm',
    'Sách',
    'Tai nghe',
    'Ví',
    'Đồng hồ',
    'Voucher',
    'Tiền mặt',
  ],
  [RelationshipType.FRIEND]: [
    'Quà handmade',
    'Sách',
    'Voucher',
    'Thú nhồi bông',
    'Cây cảnh',
    'Ly/cốc',
    'Chocolate',
    'Quà lưu niệm',
  ],
  [RelationshipType.COLLEAGUE]: [
    'Voucher cà phê',
    'Sách',
    'Cây cảnh',
    'Ly/cốc',
    'Sổ tay',
    'Bút',
    'Chocolate',
    'Quà tặng văn phòng',
  ],
  [RelationshipType.OTHER]: [
    'Voucher',
    'Sách',
    'Hoa',
    'Chocolate',
    'Quà handmade',
    'Tiền mặt',
  ],
};

// Activity suggestions
export const ACTIVITY_SUGGESTIONS: Record<EventCategory, string[]> = {
  [EventCategory.BIRTHDAY]: [
    'Tổ chức tiệc sinh nhật',
    'Đi ăn nhà hàng',
    'Karaoke',
    'Du lịch ngắn ngày',
    'Tiệc tại nhà',
    'Gặp gỡ bạn bè',
  ],
  [EventCategory.ANNIVERSARY]: [
    'Đi ăn tối lãng mạn',
    'Du lịch',
    'Xem phim',
    'Spa cùng nhau',
    'Chụp ảnh kỷ niệm',
    'Picnic',
  ],
  [EventCategory.HOLIDAY]: [
    'Sum họp gia đình',
    'Nấu ăn cùng nhau',
    'Thăm ông bà',
    'Đi chùa',
    'Du lịch',
  ],
  [EventCategory.OTHER]: [
    'Tặng quà',
    'Gọi điện chúc mừng',
    'Gửi thiệp',
    'Gặp mặt',
  ],
};

// Category labels in Vietnamese
export const CATEGORY_LABELS: Record<EventCategory, string> = {
  [EventCategory.BIRTHDAY]: 'Sinh nhật',
  [EventCategory.ANNIVERSARY]: 'Kỷ niệm',
  [EventCategory.HOLIDAY]: 'Ngày lễ',
  [EventCategory.OTHER]: 'Khác',
};

// Relationship labels in Vietnamese
export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  [RelationshipType.WIFE]: 'Vợ',
  [RelationshipType.HUSBAND]: 'Chồng',
  [RelationshipType.CHILD]: 'Con',
  [RelationshipType.PARENT]: 'Bố/Mẹ',
  [RelationshipType.SIBLING]: 'Anh/Chị/Em',
  [RelationshipType.FRIEND]: 'Bạn bè',
  [RelationshipType.COLLEAGUE]: 'Đồng nghiệp',
  [RelationshipType.OTHER]: 'Khác',
};