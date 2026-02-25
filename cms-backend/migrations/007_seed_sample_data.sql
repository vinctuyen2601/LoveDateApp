-- Migration: Seed Sample Data
-- Description: Sample data for testing CMS

-- ==================== SAMPLE ARTICLES ====================
INSERT INTO articles (title, category, icon, color, content, status, is_featured, tags)
VALUES
(
    'Top 10 món quà sinh nhật ý nghĩa cho người yêu',
    'gifts',
    'gift',
    '#FF6B6B',
    '<h1>Top 10 món quà sinh nhật ý nghĩa</h1><p>Sinh nhật là dịp đặc biệt để thể hiện tình cảm...</p>',
    'published',
    true,
    '["birthday", "gifts", "romantic"]'
),
(
    '12 ý tưởng hẹn hò độc đáo tại Sài Gòn',
    'dates',
    'heart',
    '#E91E63',
    '<h1>12 ý tưởng hẹn hò</h1><p>Khám phá những địa điểm hẹn hò lãng mạn...</p>',
    'published',
    true,
    '["dating", "saigon", "romantic"]'
),
(
    'Cách giao tiếp hiệu quả trong mối quan hệ',
    'communication',
    'chatbubbles',
    '#9C27B0',
    '<h1>Giao tiếp hiệu quả</h1><p>Giao tiếp là chìa khóa của mọi mối quan hệ...</p>',
    'published',
    false,
    '["communication", "relationship", "tips"]'
);

-- ==================== SAMPLE AFFILIATE PRODUCTS ====================
INSERT INTO affiliate_products (
    name, description, category, subcategory, price, rating, review_count,
    image_url, affiliate_url, icon, color, is_popular, status, occasion, budget, tags
)
VALUES
(
    'Hoa hồng Ecuador cao cấp',
    'Bó hoa hồng Ecuador 99 bông - Món quà hoàn hảo cho Valentine',
    'gift',
    'flowers',
    1500000,
    4.8,
    245,
    'https://example.com/roses.jpg',
    'https://affiliate.link/roses',
    'rose',
    '#E74C3C',
    true,
    'published',
    '["valentine", "anniversary", "birthday"]',
    '["1tr-2tr"]',
    '["romantic", "luxury", "flowers"]'
),
(
    'Nhà hàng L''Usine - Fine Dining',
    'Trải nghiệm ẩm thực Pháp cao cấp tại trung tâm Sài Gòn',
    'restaurant',
    'fine-dining',
    2000000,
    4.9,
    512,
    'https://example.com/lusine.jpg',
    'https://affiliate.link/lusine',
    'restaurant',
    '#3498DB',
    true,
    'published',
    '["anniversary", "date_night"]',
    '["2tr+"]',
    '["french", "fine-dining", "romantic"]'
),
(
    'Spa Couple Package - Zen Wellness',
    'Gói trị liệu spa cho 2 người - Massage thư giãn 90 phút',
    'spa',
    'couple-package',
    1200000,
    4.7,
    189,
    'https://example.com/spa.jpg',
    'https://affiliate.link/spa',
    'sparkles',
    '#16A085',
    false,
    'published',
    '["anniversary", "8_3", "20_10"]',
    '["1tr-2tr"]',
    '["relaxation", "wellness", "couple"]'
);

-- ==================== SAMPLE ACTIVITY SUGGESTIONS ====================
INSERT INTO activity_suggestions (
    name, category, location, address, latitude, longitude,
    price_range, rating, booking_url, image_url, description, status, tags
)
VALUES
(
    'Cà phê Rooftop The Workshop',
    'location',
    'Quận 1',
    '27 Ngô Đức Kế, Bến Nghé, Quận 1, TP.HCM',
    10.7769,
    106.7009,
    '₫₫',
    4.6,
    'https://theworkshop.vn',
    'https://example.com/workshop.jpg',
    'Quán cà phê rooftop view đẹp, không gian lãng mạn phù hợp hẹn hò',
    'published',
    '["coffee", "rooftop", "romantic", "cozy"]'
),
(
    'Nhà hàng The Deck Saigon',
    'restaurant',
    'Quận 2',
    '38 Nguyễn U Dĩ, Thảo Điền, Quận 2, TP.HCM',
    10.8060,
    106.7380,
    '₫₫₫',
    4.8,
    'https://thedecksaigon.com',
    'https://example.com/deck.jpg',
    'Nhà hàng view sông Sài Gòn, không gian sang trọng, menu đa dạng',
    'published',
    '["restaurant", "riverside", "fine-dining"]'
);

-- ==================== SAMPLE SURVEYS ====================
INSERT INTO surveys (
    title, type, description, questions, results, status, is_featured
)
VALUES
(
    'Khảo sát tính cách MBTI',
    'mbti',
    'Khám phá tính cách của bạn qua 40 câu hỏi',
    '[
        {"id": 1, "question": "Bạn thường", "optionA": "Hướng ngoại, thích giao lưu", "optionB": "Hướng nội, thích ở nhà", "dimensionA": "E", "dimensionB": "I"},
        {"id": 2, "question": "Khi ra quyết định, bạn", "optionA": "Dựa vào cảm xúc", "optionB": "Dựa vào logic", "dimensionA": "F", "dimensionB": "T"}
    ]'::jsonb,
    '{
        "INTJ": {"title": "Nhà chiến lược", "description": "Tư duy logic, độc lập", "traits": ["Chiến lược", "Sáng tạo", "Quyết đoán"]},
        "ENFP": {"title": "Người truyền cảm hứng", "description": "Nhiệt tình, sáng tạo", "traits": ["Nhiệt tình", "Sáng tạo", "Tự do"]}
    }'::jsonb,
    'published',
    true
);

-- ==================== SAMPLE BADGE DEFINITIONS ====================
INSERT INTO badge_definitions (badge_type, name, description, icon, color, requirements, rewards, status)
VALUES
(
    'beginner',
    'Người mới',
    'Tạo sự kiện đầu tiên',
    'rocket',
    '#3498DB',
    '{"minEvents": 1}'::jsonb,
    '{"points": 10}'::jsonb,
    'published'
),
(
    'perfect_partner',
    'Đối tác hoàn hảo',
    'Tạo 10 sự kiện không quên',
    'heart',
    '#E74C3C',
    '{"minEvents": 10}'::jsonb,
    '{"points": 100, "premiumDays": 7}'::jsonb,
    'published'
),
(
    'streak_master',
    'Bậc thầy streak',
    'Duy trì streak 30 ngày',
    'trophy',
    '#27AE60',
    '{"minStreak": 30}'::jsonb,
    '{"points": 300, "premiumDays": 30}'::jsonb,
    'published'
);

-- ==================== SAMPLE SUBSCRIPTION PLANS ====================
INSERT INTO subscription_plans (plan_type, name, description, price, currency, billing_cycle, features, is_popular, display_order, status)
VALUES
(
    'free',
    'Gói Miễn phí',
    'Dùng thử miễn phí với tính năng cơ bản',
    0,
    'VND',
    'one-time',
    '{
        "maxEvents": 10,
        "hasAnalytics": false,
        "hasExport": false,
        "adFree": false,
        "featureList": ["Tạo tối đa 10 sự kiện", "Nhắc nhở cơ bản", "Giao diện mặc định"]
    }'::jsonb,
    false,
    1,
    'published'
),
(
    'monthly',
    'Gói Tháng',
    'Thanh toán hàng tháng',
    99000,
    'VND',
    'monthly',
    '{
        "maxEvents": -1,
        "hasAnalytics": true,
        "hasExport": true,
        "hasCustomThemes": true,
        "adFree": true,
        "featureList": ["Không giới hạn sự kiện", "Phân tích nâng cao", "Xuất dữ liệu", "Giao diện tùy chỉnh", "Không quảng cáo"]
    }'::jsonb,
    false,
    2,
    'published'
),
(
    'yearly',
    'Gói Năm',
    'Tiết kiệm 17% - 2 tháng miễn phí',
    990000,
    'VND',
    'yearly',
    '{
        "maxEvents": -1,
        "hasAnalytics": true,
        "hasExport": true,
        "hasCustomThemes": true,
        "adFree": true,
        "hasCloudBackup": true,
        "hasEarlyAccess": true,
        "featureList": ["Tất cả tính năng gói tháng", "Tiết kiệm 17%", "Sao lưu đám mây", "Truy cập sớm tính năng mới"]
    }'::jsonb,
    true,
    3,
    'published'
);

-- ==================== SAMPLE CHECKLIST TEMPLATES ====================
INSERT INTO checklist_templates (event_category, items, status)
VALUES
(
    'birthday',
    '[
        {"title": "Suy nghĩ ý tưởng quà tặng", "dueDaysBefore": 14, "order": 1},
        {"title": "Đặt mua quà tặng", "dueDaysBefore": 7, "order": 2},
        {"title": "Chuẩn bị thiệp chúc mừng", "dueDaysBefore": 3, "order": 3},
        {"title": "Kiểm tra lại quà đã sẵn sàng", "dueDaysBefore": 1, "order": 4},
        {"title": "Gói quà đẹp", "dueDaysBefore": 1, "order": 5}
    ]'::jsonb,
    'published'
),
(
    'anniversary',
    '[
        {"title": "Chọn nhà hàng hoặc địa điểm", "dueDaysBefore": 14, "order": 1},
        {"title": "Đặt bàn nhà hàng", "dueDaysBefore": 7, "order": 2},
        {"title": "Mua quà kỷ niệm", "dueDaysBefore": 7, "order": 3},
        {"title": "Chuẩn bị trang phục", "dueDaysBefore": 3, "order": 4},
        {"title": "Xác nhận lại đặt bàn", "dueDaysBefore": 1, "order": 5}
    ]'::jsonb,
    'published'
);

-- Verify inserted data
SELECT 'Articles:' as type, COUNT(*) as count FROM articles
UNION ALL
SELECT 'Products:', COUNT(*) FROM affiliate_products
UNION ALL
SELECT 'Activities:', COUNT(*) FROM activity_suggestions
UNION ALL
SELECT 'Surveys:', COUNT(*) FROM surveys
UNION ALL
SELECT 'Badges:', COUNT(*) FROM badge_definitions
UNION ALL
SELECT 'Plans:', COUNT(*) FROM subscription_plans
UNION ALL
SELECT 'Checklists:', COUNT(*) FROM checklist_templates;
