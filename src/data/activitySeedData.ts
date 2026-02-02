import { ActivitySuggestion } from '../types';

/**
 * Seed data for Activity Suggestions (Phase 2 - Task 5)
 *
 * Categories:
 * - restaurant: Nhà hàng, quán ăn
 * - activity: Hoạt động giải trí (cinema, karaoke, spa, etc.)
 * - location: Địa điểm tham quan, check-in
 */

export const ACTIVITY_SEED_DATA: Omit<ActivitySuggestion, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // ==================== RESTAURANTS ====================
  {
    name: 'The Deck Saigon',
    category: 'restaurant',
    location: 'Quận 2',
    address: '38 Nguyễn U Dĩ, Thảo Điền, Quận 2, TP.HCM',
    priceRange: '₫₫₫',
    rating: 4.5,
    bookingUrl: 'https://thedecksaigon.com',
    phoneNumber: '028 3744 6632',
    description: 'Nhà hàng Âu sang trọng bên bờ sông Sài Gòn, view đẹp, không gian lãng mạn',
    tags: ['Romantic', 'European', 'River View', 'Fine Dining'],
  },
  {
    name: 'Noir Dining in the Dark',
    category: 'restaurant',
    location: 'Quận 1',
    address: '178 Hai Bà Trưng, Quận 1, TP.HCM',
    priceRange: '₫₫₫',
    rating: 4.7,
    bookingUrl: 'https://www.noirdinninginthedark.com',
    phoneNumber: '028 6291 0738',
    description: 'Trải nghiệm ăn tối trong bóng tối độc đáo, phục vụ bởi người khiếm thị',
    tags: ['Unique Experience', 'International', 'Dark Dining'],
  },
  {
    name: 'Quán Bụi',
    category: 'restaurant',
    location: 'Quận 1',
    address: '17A Ngô Văn Nam, Quận 1, TP.HCM',
    priceRange: '₫₫',
    rating: 4.3,
    bookingUrl: 'https://www.foody.vn',
    phoneNumber: '028 3829 1515',
    description: 'Ẩm thực Việt Nam truyền thống, không gian vintage ấm cúng',
    tags: ['Vietnamese', 'Traditional', 'Local Food'],
  },
  {
    name: 'Pizza 4Ps',
    category: 'restaurant',
    location: 'Quận 1',
    address: '8/15 Lê Thánh Tôn, Quận 1, TP.HCM',
    priceRange: '₫₫',
    rating: 4.6,
    bookingUrl: 'https://pizza4ps.com',
    phoneNumber: '028 3822 0500',
    description: 'Pizza phong cách Nhật Bản với phô mai tươi tự làm',
    tags: ['Pizza', 'Japanese-Italian Fusion', 'Casual Dining'],
  },
  {
    name: 'Shri Restaurant & Lounge',
    category: 'restaurant',
    location: 'Quận 1',
    address: '23 - 25 Lý Tự Trọng, Quận 1, TP.HCM',
    priceRange: '₫₫₫₫',
    rating: 4.8,
    bookingUrl: 'https://shri.vn',
    phoneNumber: '028 3823 1218',
    description: 'Nhà hàng fine dining sang trọng với view toàn cảnh thành phố',
    tags: ['Fine Dining', 'Rooftop', 'City View', 'Romantic'],
  },
  {
    name: 'Cục Gạch Quán',
    category: 'restaurant',
    location: 'Quận 1',
    address: '10 Đặng Tất, Quận 1, TP.HCM',
    priceRange: '₫₫',
    rating: 4.4,
    bookingUrl: 'https://www.foody.vn',
    phoneNumber: '028 3848 0144',
    description: 'Quán Việt Nam cổ điển, kiến trúc độc đáo với gạch ngói xưa',
    tags: ['Vietnamese', 'Traditional', 'Vintage'],
  },
  {
    name: 'L\'Usine',
    category: 'restaurant',
    location: 'Quận 1',
    address: '151/7 Đồng Khởi, Quận 1, TP.HCM',
    priceRange: '₫₫',
    rating: 4.2,
    bookingUrl: 'https://lusinespace.com',
    phoneNumber: '028 6674 3565',
    description: 'Quán café và brunch kiểu Pháp, không gian trendy',
    tags: ['Cafe', 'French', 'Brunch', 'Trendy'],
  },
  {
    name: 'Au Parc',
    category: 'restaurant',
    location: 'Quận 1',
    address: '23 Hàn Thuyên, Quận 1, TP.HCM',
    priceRange: '₫₫₫',
    rating: 4.4,
    bookingUrl: 'https://auparcsaigon.com',
    phoneNumber: '028 3829 2772',
    description: 'Nhà hàng Địa Trung Hải với không gian vườn xanh mát',
    tags: ['Mediterranean', 'Garden Setting', 'Relaxed'],
  },

  // ==================== HÀ NỘI RESTAURANTS ====================
  {
    name: 'La Badiane',
    category: 'restaurant',
    location: 'Hoàn Kiếm',
    address: '10 Nam Ngư, Hoàn Kiếm, Hà Nội',
    priceRange: '₫₫₫',
    rating: 4.6,
    bookingUrl: 'https://www.foody.vn',
    phoneNumber: '024 3942 4509',
    description: 'Nhà hàng Pháp sang trọng trong biệt thự cổ, không gian lãng mạn',
    tags: ['French', 'Fine Dining', 'Romantic', 'Historic'],
  },
  {
    name: 'Madame Hien',
    category: 'restaurant',
    location: 'Hoàn Kiếm',
    address: '15 Chân Cầm, Hoàn Kiếm, Hà Nội',
    priceRange: '₫₫',
    rating: 4.5,
    bookingUrl: 'https://www.foody.vn',
    phoneNumber: '024 3938 1588',
    description: 'Ẩm thực Việt Nam fusion, không gian colonial đẹp',
    tags: ['Vietnamese Fusion', 'Colonial', 'Traditional'],
  },

  // ==================== ACTIVITIES - CINEMA ====================
  {
    name: 'CGV Vincom Center',
    category: 'activity',
    location: 'Quận 1',
    address: '72 Lê Thánh Tôn, Quận 1, TP.HCM',
    priceRange: '₫₫',
    rating: 4.3,
    bookingUrl: 'https://www.cgv.vn',
    phoneNumber: '1900 6017',
    description: 'Rạp chiếu phim hiện đại với nhiều suất chiếu',
    tags: ['Cinema', 'Entertainment', 'Movie'],
  },
  {
    name: 'Galaxy Cinema',
    category: 'activity',
    location: 'Quận 1',
    address: '116 Nguyễn Du, Quận 1, TP.HCM',
    priceRange: '₫₫',
    rating: 4.4,
    bookingUrl: 'https://www.galaxycine.vn',
    phoneNumber: '1900 2224',
    description: 'Rạp phim với công nghệ âm thanh và hình ảnh tốt',
    tags: ['Cinema', 'Entertainment', 'Movie'],
  },
  {
    name: 'BHD Star Cineplex',
    category: 'activity',
    location: 'Quận 1',
    address: 'Vincom Center B, 45A Lý Tự Trọng, Quận 1, TP.HCM',
    priceRange: '₫₫',
    rating: 4.3,
    bookingUrl: 'https://www.bhdstar.vn',
    phoneNumber: '1900 2099',
    description: 'Rạp chiếu phim cao cấp với ghế ngồi thoải mái',
    tags: ['Cinema', 'Premium', 'Movie'],
  },

  // ==================== ACTIVITIES - ENTERTAINMENT ====================
  {
    name: 'Karaoke Nice',
    category: 'activity',
    location: 'Quận 1',
    address: '157 Pasteur, Quận 1, TP.HCM',
    priceRange: '₫₫',
    rating: 4.2,
    bookingUrl: 'https://www.foody.vn',
    phoneNumber: '028 3829 2828',
    description: 'Karaoke cao cấp với phòng VIP sang trọng',
    tags: ['Karaoke', 'Entertainment', 'Singing'],
  },
  {
    name: 'Spa Thann Sanctuary',
    category: 'activity',
    location: 'Quận 1',
    address: '2 Lê Thánh Tôn, Quận 1, TP.HCM',
    priceRange: '₫₫₫',
    rating: 4.7,
    bookingUrl: 'https://www.thann.info',
    phoneNumber: '028 3821 4101',
    description: 'Spa cao cấp với liệu trình massage thư giãn',
    tags: ['Spa', 'Relaxation', 'Wellness'],
  },
  {
    name: 'Bowling Golden Ball',
    category: 'activity',
    location: 'Quận 1',
    address: '146 Nguyễn Du, Quận 1, TP.HCM',
    priceRange: '₫₫',
    rating: 4.0,
    bookingUrl: 'https://www.foody.vn',
    phoneNumber: '028 3829 9222',
    description: 'Sân bowling hiện đại, vui chơi cùng bạn bè',
    tags: ['Bowling', 'Sports', 'Entertainment'],
  },

  // ==================== LOCATIONS - TP.HCM ====================
  {
    name: 'Landmark 81 Skyview',
    category: 'location',
    location: 'Bình Thạnh',
    address: 'Vinhomes Central Park, 720A Điện Biên Phủ, Bình Thạnh, TP.HCM',
    priceRange: '₫₫',
    rating: 4.6,
    bookingUrl: 'https://vinpearl.com/landmark81-skyview',
    phoneNumber: '028 3636 9999',
    description: 'Đài quan sát cao nhất Việt Nam, view 360 độ toàn cảnh Sài Gòn',
    tags: ['Observation Deck', 'City View', 'Sightseeing', 'Photo Spot'],
  },
  {
    name: 'Nhà Thờ Đức Bà',
    category: 'location',
    location: 'Quận 1',
    address: '01 Công xã Paris, Quận 1, TP.HCM',
    priceRange: '₫',
    rating: 4.5,
    description: 'Công trình kiến trúc Gothic nổi tiếng, điểm check-in lãng mạn',
    tags: ['Historic', 'Architecture', 'Photo Spot', 'Landmark'],
  },
  {
    name: 'Bưu Điện Trung Tâm Sài Gòn',
    category: 'location',
    location: 'Quận 1',
    address: '02 Công xã Paris, Quận 1, TP.HCM',
    priceRange: '₫',
    rating: 4.4,
    description: 'Kiến trúc cổ điển Pháp, nơi lý tưởng để gửi thiệp yêu thương',
    tags: ['Historic', 'Architecture', 'Photo Spot', 'Colonial'],
  },
  {
    name: 'Công Viên Tao Đàn',
    category: 'location',
    location: 'Quận 1',
    address: 'Trương Định, Quận 1, TP.HCM',
    priceRange: '₫',
    rating: 4.3,
    description: 'Công viên xanh mát, thích hợp đi dạo và picnic',
    tags: ['Park', 'Outdoor', 'Nature', 'Relaxing'],
  },
  {
    name: 'Phố Đi Bộ Nguyễn Huệ',
    category: 'location',
    location: 'Quận 1',
    address: 'Đường Nguyễn Huệ, Quận 1, TP.HCM',
    priceRange: '₫',
    rating: 4.4,
    description: 'Phố đi bộ sầm uất, nhiều hoạt động vui chơi và ẩm thực',
    tags: ['Walking Street', 'Entertainment', 'Street Food', 'Nightlife'],
  },
  {
    name: 'Thảo Cầm Viên Sài Gòn',
    category: 'location',
    location: 'Quận 1',
    address: '2B Nguyễn Bỉnh Khiêm, Quận 1, TP.HCM',
    priceRange: '₫',
    rating: 4.2,
    bookingUrl: 'https://saigonzoo.net',
    phoneNumber: '028 3829 1425',
    description: 'Vườn thú và thực vật lâu đời nhất Việt Nam',
    tags: ['Zoo', 'Nature', 'Family Friendly', 'Educational'],
  },

  // ==================== LOCATIONS - HÀ NỘI ====================
  {
    name: 'Hồ Hoàn Kiếm',
    category: 'location',
    location: 'Hoàn Kiếm',
    address: 'Hoàn Kiếm, Hà Nội',
    priceRange: '₫',
    rating: 4.7,
    description: 'Biểu tượng của Hà Nội, cảnh đẹp và yên bình',
    tags: ['Lake', 'Historic', 'Landmark', 'Photo Spot'],
  },
  {
    name: 'Chùa Một Cột',
    category: 'location',
    location: 'Ba Đình',
    address: 'Chùa Một Cột, Ba Đình, Hà Nội',
    priceRange: '₫',
    rating: 4.5,
    description: 'Di tích lịch sử nổi tiếng với kiến trúc độc đáo',
    tags: ['Temple', 'Historic', 'Architecture', 'Cultural'],
  },
  {
    name: 'Văn Miếu Quốc Tử Giám',
    category: 'location',
    location: 'Đống Đa',
    address: '58 Quốc Tử Giám, Đống Đa, Hà Nội',
    priceRange: '₫',
    rating: 4.6,
    phoneNumber: '024 3747 2831',
    description: 'Trường đại học đầu tiên của Việt Nam, kiến trúc cổ kính',
    tags: ['Historic', 'Temple', 'Educational', 'Cultural'],
  },
  {
    name: 'Phố Cổ Hà Nội',
    category: 'location',
    location: 'Hoàn Kiếm',
    address: 'Khu Phố Cổ, Hoàn Kiếm, Hà Nội',
    priceRange: '₫',
    rating: 4.5,
    description: 'Khu phố cổ với văn hóa truyền thống và ẩm thực đường phố',
    tags: ['Historic', 'Street Food', 'Cultural', 'Shopping'],
  },
  {
    name: 'Hồ Tây',
    category: 'location',
    location: 'Tây Hồ',
    address: 'Tây Hồ, Hà Nội',
    priceRange: '₫',
    rating: 4.4,
    description: 'Hồ nước tự nhiên lớn nhất Hà Nội, nhiều quán café view đẹp',
    tags: ['Lake', 'Nature', 'Cafe', 'Relaxing'],
  },
];

/**
 * Helper function to generate unique IDs for seed data
 */
export function generateActivityId(index: number): string {
  return `activity_seed_${Date.now()}_${index}`;
}

/**
 * Convert seed data to full ActivitySuggestion objects with IDs and timestamps
 */
export function getActivitySeedData(): ActivitySuggestion[] {
  const now = new Date().toISOString();
  return ACTIVITY_SEED_DATA.map((activity, index) => ({
    ...activity,
    id: generateActivityId(index),
    createdAt: now,
    updatedAt: now,
  }));
}

/**
 * Filter activities by category
 */
export function getActivitiesByCategory(category: 'restaurant' | 'activity' | 'location'): ActivitySuggestion[] {
  return getActivitySeedData().filter(activity => activity.category === category);
}

/**
 * Filter activities by location
 */
export function getActivitiesByLocation(location: string): ActivitySuggestion[] {
  return getActivitySeedData().filter(activity =>
    activity.location?.toLowerCase().includes(location.toLowerCase())
  );
}

/**
 * Filter activities by price range
 */
export function getActivitiesByPriceRange(priceRange: string): ActivitySuggestion[] {
  return getActivitySeedData().filter(activity => activity.priceRange === priceRange);
}

/**
 * Get top-rated activities
 */
export function getTopRatedActivities(limit: number = 5): ActivitySuggestion[] {
  return getActivitySeedData()
    .filter(activity => activity.rating !== undefined)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, limit);
}
