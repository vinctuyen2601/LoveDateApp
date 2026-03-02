/**
 * Articles Data Layer
 * Centralized article management with backend sync support
 */

import { Ionicons } from '@expo/vector-icons';

// Article interface matching backend schema
export interface Article {
  id: string; // UUID from backend or local ID
  slug?: string; // URL-friendly slug for web sharing
  title: string;
  category: ArticleCategory;
  icon: keyof typeof Ionicons.glyphMap;
  color: string; // Hex color code
  content: string; // HTML content from CKEditor (supports images, videos, rich formatting, embeds, etc.)
  imageUrl?: string | number | any; // Remote image URL from CDN/backend or local require()
  author?: string; // Author name
  readTime?: number; // Estimated read time in minutes
  tags?: string[]; // Searchable tags
  likes?: number; // Like count
  views?: number; // View count
  status?: 'draft' | 'published' | 'archived'; // Status from backend API
  isFeatured?: boolean; // Featured article flag
  publishedAt?: string; // ISO date when published
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
  version?: number; // Version for conflict resolution
}

export type ArticleCategory = 'gifts' | 'dates' | 'communication' | 'zodiac' | 'personality' | 'all';

// Category metadata for UI display
export interface CategoryInfo {
  id: ArticleCategory;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  description?: string;
}

// Default articles data (fallback when offline or backend unavailable)
export const DEFAULT_ARTICLES: Article[] = [
  {
    id: 'article_001',
    title: 'Top 10 món quà ý nghĩa cho sinh nhật người yêu',
    category: 'gifts',
    icon: 'gift',
    color: '#FF6B6B',
    imageUrl: 'https://picsum.photos/seed/gift-birthday/640/360',
    readTime: 5,
    tags: ['quà tặng', 'sinh nhật', 'người yêu', 'top 10'],
    status: 'published',
    isFeatured: true,
    content: `
<h3>1. Hoa tươi &amp; Socola cao cấp</h3>
<p>Combo truyền thống nhưng không bao giờ lỗi mốt. Chọn hoa hồng đỏ hoặc hoa tulip kết hợp với socola nhập khẩu. <strong>Mẹo:</strong> Đặt hoa trước 1 ngày để đảm bảo độ tươi.</p>

<h3>2. Trang sức (Dây chuyền, nhẫn)</h3>
<p>Món quà vĩnh cửu thể hiện tình yêu bền vững. Chọn thiết kế đơn giản, thanh lịch có thể đeo hàng ngày. Khắc tên hoặc ngày kỷ niệm để tăng ý nghĩa.</p>

<h3>3. Nước hoa</h3>
<p>Hương thơm đặc trưng giúp người yêu luôn nhớ đến bạn. Nên tìm hiểu mùi hương ưa thích trước hoặc chọn các dòng unisex an toàn như <em>Chanel, Dior</em>.</p>

<h3>4. Đồng hồ</h3>
<p>Món quà thiết thực và sang trọng. <strong>Ý nghĩa:</strong> "Mỗi giây phút đều nghĩ về em". Chọn thương hiệu uy tín như Daniel Wellington, Casio, hoặc Michael Kors.</p>

<h3>5. Túi xách/Ví da</h3>
<p>Phụ kiện thời trang cao cấp, dùng được lâu dài. Quan sát style của người yêu để chọn màu và kiểu dáng phù hợp.</p>

<h3>6. Voucher Spa/Massage</h3>
<p>Tặng trải nghiệm thư giãn, chăm sóc bản thân. Lựa chọn spa uy tín, có thể đặt thêm gói couple để cùng trải nghiệm.</p>

<h3>7. Chuyến du lịch ngắn ngày</h3>
<p>Kỷ niệm đáng nhớ cùng nhau. <strong>Đà Lạt</strong> (lãng mạn), <strong>Phú Quốc</strong> (biển đẹp), hoặc <strong>Hội An</strong> (cổ kính). Chuẩn bị kế hoạch chi tiết để tạo bất ngờ.</p>

<h3>8. Album ảnh handmade</h3>
<p>Quà DIY chứa đựng kỷ niệm, cảm xúc chân thành nhất. In ảnh chất lượng cao, viết lời nhắn tay bên cạnh mỗi tấm ảnh.</p>

<h3>9. Thiết bị công nghệ</h3>
<p>Món quà hiện đại, thiết thực cho người yêu công nghệ như <strong>AirPods, iPad, Smartwatch</strong>. Tìm hiểu nhu cầu trước khi mua để không bị trùng.</p>

<h3>10. Bữa tối lãng mạn</h3>
<p>Đặt bàn tại nhà hàng sang trọng với view đẹp, trang trí nến, hoa và quà nhỏ. Hoặc tự nấu món yêu thích của người ấy tại nhà - <em>chân thành hơn nhiều!</em></p>
`,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    version: 1,
  },
  {
    id: 'article_002',
    title: 'Cách chọn quà theo cung hoàng đạo của người yêu',
    category: 'zodiac',
    icon: 'sparkles',
    color: '#F39C12',
    imageUrl: 'https://picsum.photos/seed/zodiac-stars/640/360',
    readTime: 7,
    tags: ['cung hoàng đạo', 'quà tặng', 'tính cách'],
    status: 'published',
    content: `**♈ Bạch Dương (21/3 - 19/4)**
Năng động, thích phiêu lưu → Quà: Dụng cụ thể thao, vé xem concert, đồ công nghệ.

**♉ Kim Ngưu (20/4 - 20/5)**
Thực tế, yêu vật chất → Quà: Trang sức, nước hoa, đồ ăn cao cấp.

**♊ Song Tử (21/5 - 20/6)**
Tò mò, thích giao tiếp → Quà: Sách hay, gadget công nghệ, workshop.

**♋ Cự Giải (21/6 - 22/7)**
Gia đình, tình cảm → Quà: Album ảnh, đồ handmade, nấu ăn tại nhà.

**♌ Sư Tử (23/7 - 22/8)**
Sang trọng, muốn nổi bật → Quà: Đồ hiệu, trang sức lấp lánh, tiệc surprise.

**♍ Xử Nữ (23/8 - 22/9)**
Hoàn hảo, thực dụng → Quà: Đồ dùng chất lượng, sổ planner, voucher spa.

**♎ Thiên Bình (23/9 - 22/10)**
Thẩm mỹ, cân bằng → Quà: Nghệ thuật, nến thơm, trang trí nội thất.

**♏ Bọ Cạp (23/10 - 21/11)**
Bí ẩn, đam mê → Quà: Nước hoa độc đáo, đồ kỳ bí, trải nghiệm đặc biệt.

**♐ Nhân Mã (22/11 - 21/12)**
Tự do, yêu du lịch → Quà: Vé máy bay, ba lô, camera.

**♑ Ma Kết (22/12 - 19/1)**
Nghiêm túc, tham vọng → Quà: Sách kinh doanh, đồng hồ, cặp da.

**♒ Bảo Bình (20/1 - 18/2)**
Độc đáo, sáng tạo → Quà: Đồ handmade độc lạ, công nghệ mới, workshop nghệ thuật.

**♓ Song Ngư (19/2 - 20/3)**
Lãng mạn, mơ mộng → Quà: Thơ, nhạc, tranh, buổi hẹn lãng mạn.`,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    version: 1,
  },
  {
    id: 'article_003',
    title: 'Ý tưởng hẹn hò lãng mạn mà không tốn kém',
    category: 'dates',
    icon: 'heart',
    color: '#FF69B4',
    imageUrl: 'https://picsum.photos/seed/romantic-couple/640/360',
    readTime: 4,
    tags: ['hẹn hò', 'lãng mạn', 'tiết kiệm', 'date ideas'],
    status: 'published',
    isFeatured: true,
    content: `**1. Picnic công viên**
Chuẩn bị thức ăn, khăn trải, ngồi dưới bóng cây trò chuyện.

**2. Xem hoàng hôn/Bình minh**
Tìm địa điểm đẹp, mang theo đồ ăn nhẹ, ngắm cảnh cùng nhau.

**3. Nấu ăn tại nhà**
Cùng vào bếp, nấu món yêu thích, thắp nến, mở nhạc.

**4. Xem phim tại nhà**
Tạo không gian rạp mini: bỏng ngô, chăn ấm, phim hay.

**5. Đạp xe dạo phố**
Khám phá thành phố về đêm, ghé quán cafe nhỏ.

**6. Thăm triển lãm miễn phí**
Bảo tàng, triển lãm nghệ thuật, sự kiện văn hóa.

**7. Dạo chợ đêm**
Ăn vặt, mua sắm, chụp ảnh cùng nhau.

**8. Ngắm sao**
Lên cao, mang theo chăn, nằm ngắm bầu trời đêm.

**9. Chơi game cùng nhau**
Board game, video game, hoặc game mobile 2 người.

**10. Viết thư tay cho nhau**
Cùng ngồi viết, sau đó đọc cho nhau nghe.`,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    version: 1,
  },
  {
    id: 'article_004',
    title: '5 ngôn ngữ yêu thương - Hiểu để yêu đúng cách',
    category: 'communication',
    icon: 'chatbubbles',
    color: '#3498DB',
    imageUrl: 'https://picsum.photos/seed/love-language/640/360',
    readTime: 6,
    tags: ['ngôn ngữ yêu thương', 'love languages', 'giao tiếp'],
    status: 'published',
    isFeatured: true,
    content: `**1. Words of Affirmation (Lời nói khẳng định)**
Người này cần nghe: "Anh yêu em", "Em làm tốt lắm", "Anh tự hào về em".

→ Làm họ hạnh phúc: Nhắn tin ngọt ngào, khen ngợi, động viên.

**2. Quality Time (Thời gian chất lượng)**
Họ muốn được ở bên bạn, trò chuyện, làm điều gì đó cùng nhau.

→ Làm họ hạnh phúc: Dành thời gian trọn vẹn, không lướt điện thoại.

**3. Receiving Gifts (Nhận quà)**
Quà không cần đắt, nhưng phải có ý nghĩa, thể hiện bạn nghĩ về họ.

→ Làm họ hạnh phúc: Quà nhỏ bất ngờ, handmade, có tâm.

**4. Acts of Service (Hành động phục vụ)**
Họ cảm nhận yêu thương qua việc bạn làm cho họ.

→ Làm họ hạnh phúc: Nấu ăn, rửa bát, sửa đồ, làm việc họ ghét.

**5. Physical Touch (Chạm chạm thể xác)**
Họ cần ôm, nắm tay, hôn, vuốt ve.

→ Làm họ hạnh phúc: Ôm thường xuyên, nắm tay khi đi, massage.

**💡 Mẹo:**
- Quan sát người yêu thường làm gì để thể hiện tình cảm
- Hỏi trực tiếp: "Em muốn anh thể hiện yêu thương như thế nào?"
- Kết hợp nhiều ngôn ngữ yêu thương`,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    version: 1,
  },
  {
    id: 'article_005',
    title: 'Quà tặng theo giai đoạn mối quan hệ',
    category: 'gifts',
    icon: 'gift',
    color: '#FF6B6B',
    imageUrl: 'https://picsum.photos/seed/couple-journey/640/360',
    readTime: 5,
    tags: ['quà tặng', 'mối quan hệ', 'giai đoạn yêu'],
    status: 'published',
    content: `**Giai đoạn 1: Mới quen (1-3 tháng)**
❌ Tránh: Quà quá đắt, quá riêng tư (nội y, trang sức đắt tiền)
✅ Nên: Hoa, socola, sách, voucher cafe, móc khóa cute

**Giai đoạn 2: Đang tìm hiểu (3-6 tháng)**
❌ Tránh: Quà quá cam kết (nhẫn đính hôn), quá cá nhân
✅ Nên: Nước hoa, gấu bông, đồng hồ, túi xách, đồ handmade

**Giai đoạn 3: Yêu chính thức (6-12 tháng)**
❌ Tránh: Quà chung chung, không có ý nghĩa
✅ Nên: Trang sức, đồng hồ đôi, album ảnh, chuyến đi, đồ công nghệ

**Giai đoạn 4: Yêu lâu (1-3 năm)**
❌ Tránh: Lặp lại quà cũ, thiếu sáng tạo
✅ Nên: Quà cao cấp hơn, trải nghiệm đặc biệt, đồ định chế

**Giai đoạn 5: Chuẩn bị kết hôn (3+ năm)**
❌ Tránh: Quà vô nghĩa, không thiết thực
✅ Nên: Nhẫn cưới, đồ gia dụng, kế hoạch tương lai, du lịch xa

**💡 Nguyên tắc vàng:**
- Quà không nhất thiết đắt, nhưng phải có tâm
- Quan sát sở thích, nhu cầu của người yêu
- Kết hợp quà vật chất + trải nghiệm`,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    version: 1,
  },
  {
    id: 'article_006',
    title: 'Hiểu tính cách người yêu qua MBTI',
    category: 'personality',
    icon: 'people',
    color: '#2ECC71',
    imageUrl: 'https://picsum.photos/seed/personality-type/640/360',
    readTime: 6,
    tags: ['MBTI', 'tính cách', 'personality'],
    status: 'published',
    content: `**Nhóm Analyst (NT) - Nhà phân tích**
INTJ, INTP, ENTJ, ENTP
→ Thích: Logic, tri thức, thảo luận sâu
→ Quà: Sách, khóa học, game trí tuệ, đồ công nghệ

**Nhóm Diplomat (NF) - Nhà ngoại giao**
INFJ, INFP, ENFJ, ENFP
→ Thích: Ý nghĩa, cảm xúc, sáng tạo
→ Quà: Handmade, nghệ thuật, trải nghiệm đặc biệt

**Nhóm Sentinel (SJ) - Người bảo vệ**
ISTJ, ISFJ, ESTJ, ESFJ
→ Thích: Truyền thống, ổn định, thực tế
→ Quà: Đồ chất lượng, thiết thực, lâu bền

**Nhóm Explorer (SP) - Nhà thám hiểm**
ISTP, ISFP, ESTP, ESFP
→ Thích: Hành động, phiêu lưu, trải nghiệm
→ Quà: Dụng cụ thể thao, du lịch, hoạt động ngoài trời

**Cách sử dụng:**
1. Test MBTI cùng nhau: 16personalities.com
2. Đọc mô tả tính cách
3. Chọn quà/hoạt động phù hợp
4. Hiểu cách giao tiếp, yêu thương`,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    version: 1,
  },
];

// Category definitions
export const ARTICLE_CATEGORIES: CategoryInfo[] = [
  {
    id: 'all',
    name: 'Tất cả',
    icon: 'apps',
    color: '#FF6B6B',
    description: 'Tất cả bài viết'
  },
  {
    id: 'gifts',
    name: 'Quà tặng',
    icon: 'gift',
    color: '#FF6B6B',
    description: 'Gợi ý quà tặng ý nghĩa'
  },
  {
    id: 'dates',
    name: 'Hẹn hò',
    icon: 'heart',
    color: '#FF69B4',
    description: 'Ý tưởng hẹn hò lãng mạn'
  },
  {
    id: 'communication',
    name: 'Giao tiếp',
    icon: 'chatbubbles',
    color: '#3498DB',
    description: 'Kỹ năng giao tiếp trong tình yêu'
  },
  {
    id: 'zodiac',
    name: 'Cung hoàng đạo',
    icon: 'sparkles',
    color: '#F39C12',
    description: 'Hiểu người yêu qua cung hoàng đạo'
  },
  {
    id: 'personality',
    name: 'Tính cách',
    icon: 'people',
    color: '#2ECC71',
    description: 'Phân tích tính cách và hành vi'
  },
];

// Helper function to get category info
export const getCategoryInfo = (categoryId: ArticleCategory): CategoryInfo | undefined => {
  return ARTICLE_CATEGORIES.find(cat => cat.id === categoryId);
};

// Helper function to filter articles by category
export const filterArticlesByCategory = (
  articles: Article[],
  category: ArticleCategory
): Article[] => {
  if (category === 'all') {
    return articles.filter(article => article.status !== 'draft' && article.status !== 'archived');
  }
  return articles.filter(
    article => article.category === category && article.status !== 'draft' && article.status !== 'archived'
  );
};

// Helper function to get featured articles
export const getFeaturedArticles = (articles: Article[]): Article[] => {
  return articles.filter(article => article.isFeatured === true && article.status !== 'draft' && article.status !== 'archived');
};

// Helper function to search articles
export const searchArticles = (articles: Article[], query: string): Article[] => {
  const lowerQuery = query.toLowerCase();
  return articles.filter(article => {
    const titleMatch = article.title.toLowerCase().includes(lowerQuery);
    const contentMatch = article.content.toLowerCase().includes(lowerQuery);
    const tagsMatch = article.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
    return (titleMatch || contentMatch || tagsMatch) && article.status !== 'draft' && article.status !== 'archived';
  });
};

// Helper function to sort articles
export const sortArticles = (
  articles: Article[],
  sortBy: 'date' | 'views' | 'likes' | 'title' = 'date'
): Article[] => {
  return [...articles].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      case 'views':
        return (b.views || 0) - (a.views || 0);
      case 'likes':
        return (b.likes || 0) - (a.likes || 0);
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });
};

// Helper function to get related articles (same category, exclude current)
export const getRelatedArticles = (
  currentArticle: Article,
  allArticles: Article[],
  limit: number = 3
): Article[] => {
  return allArticles
    .filter(
      a => a.id !== currentArticle.id &&
           a.category === currentArticle.category &&
           a.status !== 'draft' && a.status !== 'archived'
    )
    .slice(0, limit);
};
