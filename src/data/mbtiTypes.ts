// ─── MBTI Type Data ───
// Complete data for all 16 MBTI personality types, grouped by temperament.

export interface MBTITypeInfo {
  type: string;
  name: string;
  nameEn: string;
  ionIcon: string;
  shortDesc: string;
  fullDesc: string;
  strengths: string[];
  weaknesses: string[];
  loveStyle: string;
  loveTraits: string[];
  giftIdeas: string[];
  famousPeople: string[];
  compatibility: {
    best: string[];
    good: string[];
    challenging: string[];
  };
}

export interface MBTIGroup {
  id: string;
  name: string;
  nameEn: string;
  ionIcon: string;
  color: string;
  gradient: [string, string];
  description: string;
  types: string[];
}

// ─── 4 Groups ───

export const MBTI_GROUPS: MBTIGroup[] = [
  {
    id: "analyst",
    name: "Nhà phân tích",
    nameEn: "Analysts",
    ionIcon: "analytics-outline",
    color: "#7C3AED",
    gradient: ["#7C3AED", "#6D28D9"],
    description:
      "Lý trí, logic, chiến lược. Luôn tìm cách cải thiện và tối ưu mọi thứ.",
    types: ["INTJ", "INTP", "ENTJ", "ENTP"],
  },
  {
    id: "diplomat",
    name: "Nhà ngoại giao",
    nameEn: "Diplomats",
    ionIcon: "heart-outline",
    color: "#059669",
    gradient: ["#059669", "#047857"],
    description:
      "Đồng cảm, lý tưởng, truyền cảm hứng. Luôn hướng đến sự hài hòa và ý nghĩa.",
    types: ["INFJ", "INFP", "ENFJ", "ENFP"],
  },
  {
    id: "sentinel",
    name: "Người bảo vệ",
    nameEn: "Sentinels",
    ionIcon: "shield-outline",
    color: "#0EA5E9",
    gradient: ["#0EA5E9", "#0284C7"],
    description:
      "Thực tế, đáng tin cậy, có tổ chức. Là nền tảng vững chắc cho mọi mối quan hệ.",
    types: ["ISTJ", "ISFJ", "ESTJ", "ESFJ"],
  },
  {
    id: "explorer",
    name: "Nhà thám hiểm",
    nameEn: "Explorers",
    ionIcon: "flame-outline",
    color: "#F59E0B",
    gradient: ["#F59E0B", "#D97706"],
    description:
      "Năng động, linh hoạt, tự phát. Luôn sẵn sàng khám phá và trải nghiệm mới.",
    types: ["ISTP", "ISFP", "ESTP", "ESFP"],
  },
];

// ─── 4 Dimensions explained ───

export interface MBTIDimension {
  code: string;
  name: string;
  pairA: { letter: string; label: string; desc: string };
  pairB: { letter: string; label: string; desc: string };
}

export const MBTI_DIMENSIONS: MBTIDimension[] = [
  {
    code: "EI",
    name: "Nguồn năng lượng",
    pairA: {
      letter: "E",
      label: "Hướng ngoại (Extraversion)",
      desc: "Lấy năng lượng từ thế giới bên ngoài, thích giao tiếp và hoạt động nhóm.",
    },
    pairB: {
      letter: "I",
      label: "Hướng nội (Introversion)",
      desc: "Lấy năng lượng từ thế giới nội tâm, thích suy ngẫm và không gian riêng.",
    },
  },
  {
    code: "SN",
    name: "Cách thu thập thông tin",
    pairA: {
      letter: "S",
      label: "Giác quan (Sensing)",
      desc: "Chú trọng thực tế, chi tiết cụ thể, kinh nghiệm và dữ kiện.",
    },
    pairB: {
      letter: "N",
      label: "Trực giác (Intuition)",
      desc: "Chú trọng tổng thể, ý tưởng, khả năng và tầm nhìn tương lai.",
    },
  },
  {
    code: "TF",
    name: "Cách ra quyết định",
    pairA: {
      letter: "T",
      label: "Lý trí (Thinking)",
      desc: "Ra quyết định dựa trên logic, phân tích khách quan và sự nhất quán.",
    },
    pairB: {
      letter: "F",
      label: "Cảm xúc (Feeling)",
      desc: "Ra quyết định dựa trên giá trị cá nhân, sự đồng cảm và hài hòa.",
    },
  },
  {
    code: "JP",
    name: "Lối sống",
    pairA: {
      letter: "J",
      label: "Nguyên tắc (Judging)",
      desc: "Thích lên kế hoạch, có cấu trúc, quyết định sớm và hoàn thành đúng hạn.",
    },
    pairB: {
      letter: "P",
      label: "Linh hoạt (Perceiving)",
      desc: "Thích tự do, linh hoạt, để ngỏ các lựa chọn và thích ứng theo tình huống.",
    },
  },
];

// ─── 16 Types ───

export const MBTI_TYPES: Record<string, MBTITypeInfo> = {
  // ── Analyst (NT) ──
  INTJ: {
    type: "INTJ",
    name: "Kiến trúc sư",
    nameEn: "Architect",
    ionIcon: "construct-outline",
    shortDesc: "Nhà chiến lược tầm nhìn xa, luôn xây dựng kế hoạch hoàn hảo cho mọi thứ — kể cả tình yêu",
    fullDesc:
      "INTJ là một trong những kiểu tính cách hiếm nhất, chỉ chiếm khoảng 2% dân số. Họ là những nhà tư duy chiến lược bẩm sinh với khả năng nhìn thấy bức tranh toàn cảnh mà ít người nhận ra. INTJ không chỉ đặt mục tiêu — họ xây dựng cả hệ thống để đạt được mục tiêu đó.\n\nTrong công việc và cuộc sống, INTJ nổi bật với sự độc lập và tự chủ. Họ không cần sự công nhận từ đám đông, mà được thúc đẩy bởi tiêu chuẩn nội tại rất cao. Khi đối mặt với vấn đề phức tạp, INTJ sẽ kiên nhẫn phân tích từng khía cạnh cho đến khi tìm ra giải pháp tối ưu nhất.\n\nTrong tình yêu, INTJ là kiểu người \"chậm mà chắc\". Họ không dễ rung động, nhưng một khi đã chọn ai đó, sự cam kết của họ gần như tuyệt đối. INTJ thể hiện tình cảm không qua lời nói hoa mỹ mà qua hành động thiết thực: lập kế hoạch tương lai chung, giải quyết vấn đề cho người yêu, và luôn giữ lời hứa. Họ cần một người bạn đời thông minh, có chiều sâu và tôn trọng không gian cá nhân của nhau.\n\nĐiểm đáng chú ý: INTJ có thể vô tình làm tổn thương người khác bằng sự thẳng thắn quá mức, nhưng đó xuất phát từ sự chân thành — họ tin rằng trung thực là nền tảng của mọi mối quan hệ bền vững.",
    strengths: [
      "Tư duy logic mạnh mẽ",
      "Độc lập, tự chủ",
      "Có tầm nhìn xa",
      "Quyết đoán và kiên định",
    ],
    weaknesses: [
      "Khó bộc lộ cảm xúc",
      "Hay phê phán và đòi hỏi cao",
      "Có thể trở nên xa cách",
    ],
    loveStyle:
      "Yêu bằng lý trí, thích sự chân thành và trung thực. Cần không gian riêng tư để suy ngẫm. Khi đã yêu, INTJ sẽ đầu tư toàn lực vào mối quan hệ.",
    loveTraits: [
      "Trung thành tuyệt đối",
      "Lên kế hoạch cho tương lai chung",
      "Giải quyết vấn đề nhanh chóng",
      "Tôn trọng sự độc lập của đối phương",
    ],
    giftIdeas: [
      "Sách chuyên môn, tri thức",
      "Đồ công nghệ cao cấp",
      "Khóa học online nâng cao",
      "Trò chơi trí tuệ, puzzle",
    ],
    famousPeople: ["Elon Musk", "Mark Zuckerberg", "Christopher Nolan"],
    compatibility: {
      best: ["ENFP", "ENTP", "INFJ"],
      good: ["INTJ", "ENTJ", "INTP"],
      challenging: ["ESFP", "ESTP", "ISFJ"],
    },
  },
  INTP: {
    type: "INTP",
    name: "Nhà logic học",
    nameEn: "Logician",
    ionIcon: "flask-outline",
    shortDesc: "Bộ não không ngừng phân tích, luôn tò mò khám phá bản chất sâu xa của mọi thứ",
    fullDesc:
      "INTP được ví như \"nhà khoa học\" trong 16 kiểu tính cách — bộ não của họ luôn hoạt động, phân tích và đặt câu hỏi \"Tại sao?\" cho mọi thứ. Chiếm khoảng 3% dân số, INTP sống trong thế giới của ý tưởng và lý thuyết, nơi mà logic là ngôn ngữ chính.\n\nINTP có khả năng nhìn thấy các mô hình và kết nối mà người khác bỏ qua. Họ thích phân tích vấn đề từ mọi góc độ, thường dành hàng giờ đắm chìm trong suy nghĩ về một chủ đề thú vị. Sự sáng tạo của INTP không nằm ở nghệ thuật truyền thống, mà ở khả năng tìm ra giải pháp độc đáo cho những vấn đề phức tạp.\n\nTrong tình yêu, INTP có thể khiến đối phương bối rối vì sự im lặng — nhưng đó không phải là sự thờ ơ. Khi INTP im lặng, họ đang xử lý cảm xúc theo cách riêng. Họ yêu bằng trí tuệ: thích thảo luận sâu về mọi chủ đề, chia sẻ những khám phá thú vị, và giải quyết vấn đề cho người yêu. INTP cần một người kiên nhẫn, tôn trọng không gian suy nghĩ của họ, và có thể kết nối ở mức trí tuệ.\n\nĐiểm đáng chú ý: INTP đôi khi quên mất thế giới thực vì quá chìm đắm trong suy nghĩ. Họ cần người yêu nhẹ nhàng \"kéo\" họ về với thực tại — và khi tìm được người đó, INTP sẽ trung thành và biết ơn sâu sắc.",
    strengths: [
      "Tư duy phân tích sắc bén",
      "Sáng tạo không ngừng",
      "Trung thực, thẳng thắn",
      "Ham học hỏi",
    ],
    weaknesses: [
      "Hay mơ mộng, lạc trong suy nghĩ",
      "Khó ra quyết định",
      "Không thích giao tiếp xã hội",
    ],
    loveStyle:
      "Yêu bằng trí tuệ, thích thảo luận sâu về mọi chủ đề. Cần người hiểu rằng sự im lặng không phải là sự thờ ơ, mà là đang suy ngẫm.",
    loveTraits: [
      "Thích thảo luận tri thức với người yêu",
      "Trung thành khi đã tìm được người phù hợp",
      "Tôn trọng sự khác biệt",
      "Thể hiện tình yêu qua giải quyết vấn đề",
    ],
    giftIdeas: [
      "Đồ chơi logic, puzzle",
      "Sách khoa học, triết học",
      "Công cụ phân tích, coding",
      "Gadget công nghệ độc đáo",
    ],
    famousPeople: ["Albert Einstein", "Bill Gates", "Marie Curie"],
    compatibility: {
      best: ["ENTJ", "ESTJ", "INFJ"],
      good: ["INTP", "INTJ", "ENTP"],
      challenging: ["ESFJ", "ISFJ", "ESFP"],
    },
  },
  ENTJ: {
    type: "ENTJ",
    name: "Tư lệnh",
    nameEn: "Commander",
    ionIcon: "trophy-outline",
    shortDesc: "Nhà lãnh đạo bẩm sinh với ý chí sắt đá, biến mọi tầm nhìn thành hiện thực",
    fullDesc:
      "ENTJ là \"vị tướng\" trong thế giới MBTI — quyết đoán, tham vọng và luôn dẫn đầu. Chiếm khoảng 3% dân số, họ có năng lực lãnh đạo tự nhiên mà ít kiểu tính cách nào sánh được. Khi ENTJ đặt mục tiêu, họ sẽ xây dựng chiến lược, tập hợp nguồn lực và kiên trì cho đến khi đạt được.\n\nENTJ nhìn thấy sự thiếu hiệu quả ở khắp nơi và có bản năng muốn cải thiện mọi thứ. Họ là người ra quyết định nhanh, không ngại đối mặt với thử thách, và có khả năng truyền cảm hứng để người khác hành động. Tuy nhiên, sự quyết đoán đôi khi biến thành áp đặt — ENTJ cần học cách lắng nghe và tôn trọng nhịp độ của người khác.\n\nTrong tình yêu, ENTJ yêu mãnh liệt và bảo vệ. Họ coi mối quan hệ như một \"dự án đầu tư\" quan trọng nhất và sẵn sàng nỗ lực hết mình để nó thành công. ENTJ sẽ lên kế hoạch hẹn hò chu đáo, xây dựng nền tảng tài chính vững chắc cho tương lai, và luôn khuyến khích người yêu phát triển bản thân. Họ thích một người bạn đời có tư duy, có tham vọng riêng và dám nói thẳng — ENTJ không thích người quá phụ thuộc.\n\nĐiểm đáng chú ý: Dưới vẻ ngoài mạnh mẽ, ENTJ cũng có một khía cạnh dịu dàng ít ai thấy. Khi thực sự yêu, họ sẵn sàng bỏ xuống \"áo giáp\" và trở nên dễ tổn thương — nhưng chỉ với người họ tin tưởng tuyệt đối.",
    strengths: [
      "Lãnh đạo tự nhiên",
      "Tự tin, quyết đoán",
      "Tầm nhìn chiến lược",
      "Hiệu quả và có kỷ luật",
    ],
    weaknesses: [
      "Hay áp đặt quan điểm",
      "Thiếu kiên nhẫn",
      "Khó thể hiện cảm xúc mềm mại",
    ],
    loveStyle:
      "Yêu mạnh mẽ và trung thành. Thích người có tư duy, tham vọng và dám thử thách. ENTJ sẽ dẫn dắt mối quan hệ đến những tầm cao mới.",
    loveTraits: [
      "Bảo vệ và lo lắng cho người yêu",
      "Lên kế hoạch hẹn hò chu đáo",
      "Khuyến khích đối phương phát triển",
      "Trung thành và cam kết cao",
    ],
    giftIdeas: [
      "Sách kinh doanh, lãnh đạo",
      "Phụ kiện sang trọng",
      "Khóa học chuyên sâu",
      "Trải nghiệm VIP",
    ],
    famousPeople: ["Steve Jobs", "Margaret Thatcher", "Gordon Ramsay"],
    compatibility: {
      best: ["INTP", "INFP", "ENFP"],
      good: ["ENTJ", "INTJ", "ENTP"],
      challenging: ["ISFP", "ESFP", "ISFJ"],
    },
  },
  ENTP: {
    type: "ENTP",
    name: "Nhà tranh luận",
    nameEn: "Debater",
    ionIcon: "bulb-outline",
    shortDesc: "Bộ não sáng tạo không giới hạn, biến mọi cuộc trò chuyện thành cuộc phiêu lưu trí tuệ",
    fullDesc:
      "ENTP là \"nhà phát minh\" trong thế giới tính cách — luôn tràn ngập ý tưởng mới và có khả năng nhìn thấy khả năng ở những nơi người khác chỉ thấy giới hạn. Chiếm khoảng 3% dân số, ENTP nổi bật bởi sự nhanh trí, hài hước và sức hút giao tiếp đặc biệt.\n\nENTP có bộ não hoạt động không ngừng, luôn kết nối ý tưởng từ nhiều lĩnh vực khác nhau. Họ thích tranh luận — không phải để \"thắng\" mà vì quá trình thảo luận giúp họ khám phá thêm góc nhìn mới. Sự sáng tạo của ENTP là vô tận: họ có thể đưa ra 10 giải pháp cho một vấn đề, nhưng thường gặp khó khăn trong việc chọn và theo đuổi một giải pháp đến cùng.\n\nTrong tình yêu, hẹn hò với ENTP giống như lên tàu lượn siêu tốc — đầy kích thích và không bao giờ biết trước điều gì sẽ xảy ra. Họ mang đến sự mới mẻ, tiếng cười và những cuộc trò chuyện kéo dài đến tận khuya. ENTP yêu bằng trí tuệ và cần đối phương có thể đáp lại những cuộc tranh luận vui vẻ. Tuy nhiên, ENTP cần học cách kiên nhẫn với chi tiết nhỏ và cam kết lâu dài — khi đã tìm được người có thể \"theo kịp\" bộ não của mình, ENTP sẽ trở thành người bạn đời thú vị và trung thành.\n\nĐiểm đáng chú ý: ENTP đôi khi vô tình tranh luận về những điều nhạy cảm mà không nhận ra cảm xúc của đối phương. Nếu bạn yêu một ENTP, hãy nói thẳng cảm xúc của mình — họ sẽ lập tức điều chỉnh vì thực ra rất quan tâm đến người mình yêu.",
    strengths: [
      "Sáng tạo không giới hạn",
      "Tư duy nhanh nhạy",
      "Linh hoạt, thích ứng tốt",
      "Hài hước, duyên dáng",
    ],
    weaknesses: [
      "Thiếu kiên nhẫn với chi tiết",
      "Hay tranh luận quá mức",
      "Khó tập trung dài hạn",
    ],
    loveStyle:
      "Yêu sôi nổi, thích kích thích trí tuệ. Cần tự do và không gian sáng tạo. Với ENTP, tình yêu là một cuộc phiêu lưu trí tuệ đầy thú vị.",
    loveTraits: [
      "Luôn mang đến điều mới mẻ",
      "Hẹn hò sáng tạo, không nhàm chán",
      "Thích tranh luận vui vẻ với người yêu",
      "Tôn trọng sự tự do của nhau",
    ],
    giftIdeas: [
      "Trò chơi chiến thuật",
      "Sách phi hư cấu độc đáo",
      "Vé sự kiện, hội thảo",
      "Gadget công nghệ mới lạ",
    ],
    famousPeople: ["Robert Downey Jr.", "Tom Hanks", "Mark Twain"],
    compatibility: {
      best: ["INFJ", "INTJ", "ENFJ"],
      good: ["ENTP", "ENTJ", "INTP"],
      challenging: ["ISFJ", "ISTJ", "ESFJ"],
    },
  },

  // ── Diplomat (NF) ──
  INFJ: {
    type: "INFJ",
    name: "Người cố vấn",
    nameEn: "Advocate",
    ionIcon: "planet-outline",
    shortDesc: "Kiểu tính cách hiếm nhất thế giới, có khả năng đọc vị con người và trực giác phi thường",
    fullDesc:
      "INFJ là kiểu tính cách hiếm nhất trong 16 kiểu, chỉ chiếm khoảng 1-2% dân số thế giới. Họ được ví như \"nhà tiên tri\" — có trực giác mạnh mẽ đến mức đôi khi hiểu người khác hơn cả chính người đó hiểu mình. INFJ kết hợp độc đáo giữa sự nhạy cảm sâu sắc và tư duy chiến lược, tạo nên một kiểu tính cách vừa mơ mộng vừa thực tế.\n\nINFJ sống với sứ mệnh — họ cần tìm thấy ý nghĩa trong mọi việc mình làm. Không chỉ muốn giúp đỡ người khác, INFJ muốn thay đổi thế giới theo hướng tốt đẹp hơn. Họ có \"chiếc radar cảm xúc\" cực kỳ nhạy bén, có thể cảm nhận được tâm trạng của người xung quanh chỉ qua ngôn ngữ cơ thể và giọng nói.\n\nTrong tình yêu, INFJ tìm kiếm sự kết nối linh hồn — không chỉ là sự hấp dẫn bề ngoài mà là sự thấu hiểu ở mức sâu nhất. Khi yêu, INFJ cống hiến hoàn toàn: họ ghi nhớ mọi chi tiết nhỏ về người yêu, dự đoán được nhu cầu trước khi đối phương nói ra, và tạo một không gian cảm xúc an toàn tuyệt đối. Tuy nhiên, INFJ có \"cánh cửa đóng sập\" (INFJ door slam) — khi bị tổn thương quá nhiều lần, họ có thể cắt đứt mối quan hệ hoàn toàn và không bao giờ quay lại.\n\nĐiểm đáng chú ý: INFJ dễ bị kiệt sức cảm xúc vì \"hấp thụ\" cảm xúc của người khác. Họ cần những khoảng thời gian một mình để \"sạc lại năng lượng\" — người yêu INFJ cần hiểu rằng việc cần không gian riêng không phải là dấu hiệu của sự xa cách, mà là cách họ giữ cho mình khỏe mạnh để yêu thương tốt hơn.",
    strengths: [
      "Đồng cảm sâu sắc",
      "Trực giác mạnh mẽ",
      "Quyết tâm và kiên định",
      "Sáng tạo, giàu trí tưởng tượng",
    ],
    weaknesses: [
      "Quá nhạy cảm, dễ tổn thương",
      "Dễ bị kiệt sức cảm xúc",
      "Có xu hướng hoàn hảo chủ nghĩa",
    ],
    loveStyle:
      "Yêu sâu đậm và chân thành. Tìm kiếm mối quan hệ có ý nghĩa sâu sắc, không bao giờ hời hợt. INFJ coi tình yêu là sự kết nối linh hồn.",
    loveTraits: [
      "Hiểu người yêu không cần nói",
      "Sẵn sàng hy sinh vì người mình yêu",
      "Tạo không gian an toàn về cảm xúc",
      "Ghi nhớ mọi chi tiết nhỏ",
    ],
    giftIdeas: [
      "Nhật ký handmade",
      "Sách tâm lý, triết học",
      "Trải nghiệm ý nghĩa (thiền, yoga)",
      "Quà handmade có tâm",
    ],
    famousPeople: ["Martin Luther King Jr.", "Mother Teresa", "Lady Gaga"],
    compatibility: {
      best: ["ENTP", "ENFP", "INTJ"],
      good: ["INFJ", "ENFJ", "INFP"],
      challenging: ["ESTP", "ISTP", "ESFP"],
    },
  },
  INFP: {
    type: "INFP",
    name: "Người hòa giải",
    nameEn: "Mediator",
    ionIcon: "leaf-outline",
    shortDesc: "Trái tim lãng mạn với thế giới nội tâm phong phú, luôn tìm kiếm vẻ đẹp và ý nghĩa sâu xa",
    fullDesc:
      "INFP là \"nhà thơ\" trong thế giới tính cách — họ sống với trái tim nhạy cảm và thế giới nội tâm phong phú đến kinh ngạc. Chiếm khoảng 4% dân số, INFP nhìn thấy vẻ đẹp và ý nghĩa ở những nơi người khác bỏ qua: một tia nắng chiều, một câu nói bất chợt, hay nụ cười của người lạ trên phố.\n\nINFP có hệ giá trị nội tâm vô cùng mạnh mẽ — họ không dễ bị ảnh hưởng bởi đám đông hay xu hướng xã hội. Điều họ coi trọng nhất là sự chân thật: chân thật với bản thân, với người mình yêu, và với giá trị mình tin tưởng. INFP sáng tạo theo cách rất riêng — không ồn ào nhưng sâu sắc, thường thể hiện qua văn chương, âm nhạc, nghệ thuật hoặc cách họ sống cuộc đời.\n\nTrong tình yêu, INFP là người lãng mạn nhất trong 16 kiểu tính cách. Họ yêu như trong tiểu thuyết — sâu đậm, chân thành và hết mình. INFP sẽ viết thư tình, ghi nhớ kỷ niệm nhỏ nhất, và biến những khoảnh khắc bình thường thành đặc biệt. Tuy nhiên, INFP cũng dễ lý tưởng hóa đối phương, tạo ra hình ảnh \"hoàn hảo\" trong đầu rồi thất vọng khi thực tế không khớp. Họ cần học cách chấp nhận người yêu với cả ưu và khuyết điểm.\n\nĐiểm đáng chú ý: INFP thường giữ nỗi buồn cho riêng mình vì không muốn làm phiền người khác. Nếu bạn yêu một INFP, hãy chủ động hỏi han — đôi khi họ cần được \"cho phép\" mới dám chia sẻ những gì đang cảm thấy.",
    strengths: [
      "Giàu trí tưởng tượng",
      "Đồng cảm cao",
      "Trung thành với giá trị",
      "Linh hoạt, cởi mở",
    ],
    weaknesses: [
      "Quá lý tưởng hóa",
      "Dễ bị tổn thương",
      "Khó đưa ra quyết định thực tế",
    ],
    loveStyle:
      "Yêu lãng mạn và chân thành. Cần người hiểu và tôn trọng giá trị nội tâm. Với INFP, tình yêu là nguồn cảm hứng sáng tạo vô tận.",
    loveTraits: [
      "Viết thư tình, ghi chú ngọt ngào",
      "Luôn lắng nghe và thấu hiểu",
      "Sáng tạo trong cách thể hiện tình cảm",
      "Trung thành và chung thủy",
    ],
    giftIdeas: [
      "Sách thơ, văn học",
      "Dụng cụ nghệ thuật",
      "Vinyl nhạc indie",
      "Quà có ý nghĩa sâu xa, câu chuyện riêng",
    ],
    famousPeople: ["William Shakespeare", "J.R.R. Tolkien", "Johnny Depp"],
    compatibility: {
      best: ["ENFJ", "ENTJ", "INFJ"],
      good: ["INFP", "ENFP", "INTP"],
      challenging: ["ESTJ", "ISTJ", "ESTP"],
    },
  },
  ENFJ: {
    type: "ENFJ",
    name: "Người dẫn dắt",
    nameEn: "Protagonist",
    ionIcon: "star-outline",
    shortDesc: "Nhà lãnh đạo bằng trái tim, có khả năng truyền cảm hứng và kết nối mọi người xung quanh",
    fullDesc:
      "ENFJ là \"ngọn hải đăng\" trong thế giới tính cách — họ tỏa sáng bằng sự ấm áp và có khả năng nâng đỡ mọi người xung quanh. Chiếm khoảng 2-3% dân số, ENFJ kết hợp giữa kỹ năng lãnh đạo xuất sắc và trái tim đầy đồng cảm, tạo nên một kiểu tính cách vừa mạnh mẽ vừa dịu dàng.\n\nENFJ có \"radar tình cảm\" rất nhạy — họ có thể bước vào phòng và ngay lập tức cảm nhận được ai đang vui, ai đang buồn, ai cần được quan tâm. Không chỉ cảm nhận, ENFJ còn hành động: họ sẽ chủ động lắng nghe, khuyến khích và giúp người khác trở thành phiên bản tốt nhất của chính mình. Đây là lý do ENFJ thường được mọi người yêu mến và tin tưởng.\n\nTrong tình yêu, ENFJ là người bạn đời tận tụy và chu đáo nhất. Họ đặt hạnh phúc của người yêu lên hàng đầu, thường quên cả nhu cầu bản thân. ENFJ sẽ nhớ mọi dịp quan trọng, tổ chức buổi hẹn ý nghĩa, luôn khuyến khích và động viên đối phương. Họ yêu với cả trái tim và muốn xây dựng một mối quan hệ sâu sắc, có ý nghĩa — không chỉ là yêu đương mà là cùng nhau trưởng thành.\n\nĐiểm đáng chú ý: ENFJ dễ bị \"kiệt sức vì yêu\" do luôn đặt người khác lên trước. Họ cần học cách nói \"không\", đặt ra giới hạn, và hiểu rằng chăm sóc bản thân không phải là ích kỷ — mà là cách để yêu thương bền vững hơn.",
    strengths: [
      "Giao tiếp xuất sắc",
      "Truyền cảm hứng mạnh mẽ",
      "Đồng cảm và quan tâm",
      "Có tổ chức, đáng tin cậy",
    ],
    weaknesses: [
      "Quá quan tâm đến người khác",
      "Dễ bị kiệt sức cảm xúc",
      "Nhạy cảm với phê bình",
    ],
    loveStyle:
      "Yêu nhiệt thành và quan tâm sâu sắc. Thích chăm sóc, hỗ trợ và khuyến khích đối phương trở thành phiên bản tốt nhất của họ.",
    loveTraits: [
      "Chăm sóc chu đáo từng chi tiết",
      "Luôn khuyến khích và động viên",
      "Tổ chức hẹn hò ý nghĩa",
      "Ghi nhớ mọi dịp quan trọng",
    ],
    giftIdeas: [
      "Khóa học phát triển bản thân",
      "Sách tâm lý, coaching",
      "Trải nghiệm ý nghĩa cùng nhau",
      "Quà từ thiện nhân danh người yêu",
    ],
    famousPeople: ["Barack Obama", "Oprah Winfrey", "Ben Affleck"],
    compatibility: {
      best: ["INFP", "ISFP", "INTP"],
      good: ["ENFJ", "INFJ", "ENFP"],
      challenging: ["ISTP", "ESTP", "ISTJ"],
    },
  },
  ENFP: {
    type: "ENFP",
    name: "Người truyền cảm hứng",
    nameEn: "Campaigner",
    ionIcon: "color-palette-outline",
    shortDesc: "Ngọn lửa nhiệt huyết không bao giờ tắt, biến mỗi ngày thành một cuộc phiêu lưu đầy sắc màu",
    fullDesc:
      "ENFP là \"cầu vồng\" trong thế giới tính cách — tràn đầy màu sắc, năng lượng và khả năng truyền cảm hứng. Chiếm khoảng 7% dân số, ENFP có sức hút tự nhiên khiến mọi người muốn ở gần. Họ nhìn thấy tiềm năng ở khắp nơi và có khả năng biến những ý tưởng điên rồ nhất thành hiện thực.\n\nENFP sống với niềm đam mê cháy bỏng — khi họ hứng thú với điều gì đó, năng lượng của họ gần như vô tận. Họ kết nối ý tưởng từ nhiều lĩnh vực khác nhau, luôn nhìn ra cơ hội mà người khác bỏ qua. Tuy nhiên, ENFP cũng dễ bị \"hội chứng con sóc\" — nhảy từ dự án này sang dự án khác khi có thứ mới hấp dẫn hơn xuất hiện.\n\nTrong tình yêu, ENFP là người bạn đời thú vị nhất bạn có thể gặp. Họ biến mỗi buổi hẹn thành cuộc phiêu lưu: hôm nay có thể đi ăn ở quán nhỏ trong hẻm, ngày mai bất ngờ lên kế hoạch du lịch cuối tuần. ENFP yêu nồng nhiệt, lãng mạn và luôn khuyến khích người yêu theo đuổi ước mơ. Họ nhìn thấy phiên bản tốt nhất của đối phương và không ngừng khuyến khích họ hướng tới đó.\n\nĐiểm đáng chú ý: ENFP đôi khi quá lạc quan và hứa hẹn nhiều hơn khả năng thực hiện. Họ cần một người bạn đời giúp \"neo\" lại thực tế, nhưng không phải bằng cách dập tắt nhiệt huyết, mà bằng sự nhẹ nhàng giúp họ ưu tiên và hoàn thành những gì quan trọng nhất.",
    strengths: [
      "Nhiệt tình, lạc quan",
      "Sáng tạo phong phú",
      "Giao tiếp tốt, duyên dáng",
      "Linh hoạt, thích ứng nhanh",
    ],
    weaknesses: [
      "Thiếu tập trung dài hạn",
      "Quá lạc quan, thiếu thực tế",
      "Khó tuân theo kế hoạch",
    ],
    loveStyle:
      "Yêu nồng nhiệt và lãng mạn. Thích khám phá, trải nghiệm mới cùng người yêu. ENFP biến mỗi ngày thành một cuộc phiêu lưu.",
    loveTraits: [
      "Luôn nghĩ ra điều bất ngờ",
      "Nhiệt tình và lãng mạn",
      "Ủng hộ ước mơ của người yêu",
      "Hẹn hò sáng tạo, không bao giờ nhàm chán",
    ],
    giftIdeas: [
      "Vé du lịch bất ngờ",
      "Workshop sáng tạo",
      "Nhật ký du lịch, scrapbook",
      "Trải nghiệm mới lạ, độc đáo",
    ],
    famousPeople: ["Robin Williams", "Robert Downey Jr.", "Walt Disney"],
    compatibility: {
      best: ["INTJ", "INFJ", "ENTJ"],
      good: ["ENFP", "ENFJ", "INFP"],
      challenging: ["ISTJ", "ESTJ", "ISTP"],
    },
  },

  // ── Sentinel (SJ) ──
  ISTJ: {
    type: "ISTJ",
    name: "Người trách nhiệm",
    nameEn: "Logistician",
    ionIcon: "clipboard-outline",
    shortDesc: "Trụ cột vững chắc nhất, luôn giữ lời hứa và hoàn thành mọi cam kết đến cùng",
    fullDesc:
      "ISTJ là \"nền móng\" của xã hội — nếu thế giới vận hành được, phần lớn là nhờ những người ISTJ đang âm thầm giữ cho mọi thứ đúng trật tự. Chiếm khoảng 13% dân số (một trong những kiểu phổ biến nhất), ISTJ nổi bật với tinh thần trách nhiệm cực cao và sự đáng tin cậy tuyệt đối.\n\nISTJ coi trọng truyền thống, sự ổn định và lời hứa. Khi họ nói \"tôi sẽ làm\", bạn có thể yên tâm 100% rằng điều đó sẽ xảy ra. Họ có trí nhớ tuyệt vời về chi tiết, luôn có kế hoạch rõ ràng, và hiếm khi trễ deadline. ISTJ không phải kiểu người \"nổ\" — họ chứng minh giá trị bằng hành động bền bỉ, ngày qua ngày.\n\nTrong tình yêu, ISTJ thể hiện tình cảm theo cách rất thực tế: đưa đón đúng giờ, sửa chữa đồ đạc trong nhà, đảm bảo tài chính ổn định, nhớ mọi dịp quan trọng. Họ không giỏi nói lời ngọt ngào hay viết thư tình, nhưng sự có mặt đáng tin cậy của ISTJ chính là \"lời nói yêu\" mạnh mẽ nhất. Khi đã cam kết, ISTJ sẽ trung thành tuyệt đối — ly hôn hay chia tay không nằm trong từ điển của họ trừ khi bị phản bội.\n\nĐiểm đáng chú ý: ISTJ đôi khi quá cứng nhắc với quy tắc và khó thích ứng với thay đổi đột ngột. Nếu yêu một ISTJ, hãy kiên nhẫn giúp họ mở rộng vùng an toàn từ từ — đừng ép họ thay đổi một sớm một chiều, vì họ cần thời gian để xử lý và chấp nhận cái mới.",
    strengths: [
      "Trách nhiệm cao",
      "Thực tế, đáng tin cậy",
      "Có tổ chức, kỷ luật",
      "Trung thành tuyệt đối",
    ],
    weaknesses: [
      "Có thể cứng nhắc",
      "Khó thích ứng với thay đổi",
      "Ít bộc lộ cảm xúc",
    ],
    loveStyle:
      "Yêu bằng hành động, trung thành tuyệt đối. Thể hiện tình yêu qua việc chăm sóc thực tế — sửa nhà, nấu ăn, đưa đón đúng giờ.",
    loveTraits: [
      "Luôn giữ lời hứa",
      "Chăm sóc thiết thực, đáng tin cậy",
      "Bảo vệ gia đình",
      "Nhớ mọi dịp quan trọng",
    ],
    giftIdeas: [
      "Đồ dùng chất lượng cao",
      "Sách hướng dẫn thực hành",
      "Công cụ làm việc tốt",
      "Quà thực tế, bền bỉ",
    ],
    famousPeople: ["Angela Merkel", "Warren Buffett", "Natalie Portman"],
    compatibility: {
      best: ["ESFP", "ESTP", "ISFP"],
      good: ["ISTJ", "ESTJ", "ISFJ"],
      challenging: ["ENFP", "INFP", "ENTP"],
    },
  },
  ISFJ: {
    type: "ISFJ",
    name: "Người nuôi dưỡng",
    nameEn: "Defender",
    ionIcon: "heart-circle-outline",
    shortDesc: "Người chăm sóc ấm áp nhất, ghi nhớ mọi chi tiết nhỏ và yêu thương bằng hành động tận tụy",
    fullDesc:
      "ISFJ là \"thiên thần hộ mệnh\" trong thế giới tính cách — lặng lẽ chăm sóc mọi người xung quanh mà ít khi đòi hỏi sự đền đáp. Chiếm khoảng 13% dân số, ISFJ là kiểu tính cách phổ biến nhất và cũng là \"chất keo\" giữ cho các mối quan hệ và cộng đồng gắn kết.\n\nISFJ có trí nhớ phi thường về chi tiết — họ nhớ bạn thích uống gì, sợ gì, sinh nhật của ai, và thậm chí cả câu chuyện bạn kể từ 3 năm trước. Sự quan tâm của ISFJ không ồn ào nhưng vô cùng tỉ mỉ: họ sẽ chuẩn bị sẵn chiếc áo khoác trước khi bạn biết trời sắp lạnh, nấu món bạn thích khi biết bạn mệt mỏi.\n\nTrong tình yêu, ISFJ là người bạn đời tận tụy và ấm áp nhất. Họ thể hiện tình yêu qua ngôn ngữ của sự chăm sóc: bữa ăn ngon, ngôi nhà gọn gàng, sự quan tâm lặng lẽ nhưng liên tục. ISFJ không cần buổi hẹn hò xa hoa — họ tìm thấy hạnh phúc trong những khoảnh khắc bình dị bên người mình yêu. Khi đã yêu, ISFJ sẵn sàng hy sinh rất nhiều cho mối quan hệ.\n\nĐiểm đáng chú ý: ISFJ có xu hướng cho đi quá nhiều mà quên mất bản thân. Họ thường giấu cảm xúc tiêu cực, sợ làm phiền người khác, cho đến khi \"tràn ly\" và bùng nổ bất ngờ. Nếu yêu một ISFJ, hãy chủ động hỏi \"Em/Anh có ổn không?\" và tạo không gian an toàn để họ chia sẻ — đó là món quà quý giá nhất bạn có thể tặng họ.",
    strengths: [
      "Chu đáo, quan tâm",
      "Trách nhiệm và tận tâm",
      "Đáng tin cậy, kiên nhẫn",
      "Ghi nhớ chi tiết",
    ],
    weaknesses: [
      "Khó từ chối người khác",
      "Quá khiêm tốn, ít nói về mình",
      "Sợ thay đổi lớn",
    ],
    loveStyle:
      "Yêu chân thành, chăm sóc tỉ mỉ từng ngày. Thể hiện tình yêu qua bữa ăn ngon, ngôi nhà gọn gàng, và sự quan tâm lặng lẽ.",
    loveTraits: [
      "Nấu ăn ngon cho người yêu",
      "Ghi nhớ mọi sở thích, thói quen",
      "Chăm sóc khi ốm đau",
      "Tạo không gian ấm cúng",
    ],
    giftIdeas: [
      "Đồ handmade, tự làm",
      "Album ảnh kỷ niệm",
      "Đồ gia dụng chất lượng",
      "Quà tự tay làm có tâm",
    ],
    famousPeople: ["Beyoncé", "Kate Middleton", "Halle Berry"],
    compatibility: {
      best: ["ESFP", "ESTP", "ISFP"],
      good: ["ISFJ", "ISTJ", "ESFJ"],
      challenging: ["ENTP", "INTP", "ENFP"],
    },
  },
  ESTJ: {
    type: "ESTJ",
    name: "Người quản lý",
    nameEn: "Executive",
    ionIcon: "bar-chart-outline",
    shortDesc: "Người tổ chức xuất sắc, coi trọng trật tự và luôn bảo vệ những giá trị truyền thống",
    fullDesc:
      "ESTJ là \"người quản lý\" trong thế giới tính cách — có khả năng tổ chức, lên kế hoạch và đưa mọi thứ vào quy củ. Chiếm khoảng 11% dân số, ESTJ là những người giữ cho xã hội vận hành trơn tru, từ gia đình đến công ty, từ cộng đồng đến quốc gia.\n\nESTJ tin vào quy tắc, truyền thống và hệ thống đã được chứng minh. Họ không phải kiểu người \"phá vỡ khuôn khổ\" — thay vào đó, họ hoàn thiện và bảo vệ những gì đang hoạt động tốt. ESTJ quyết đoán, dứt khoát và không ngại đứng lên bảo vệ quan điểm của mình. Khi lãnh đạo, họ rõ ràng về kỳ vọng và luôn đánh giá bằng kết quả thực tế.\n\nTrong tình yêu, ESTJ là người bạn đời đáng tin cậy và có trách nhiệm. Họ thể hiện tình yêu bằng cách xây dựng nền tảng vững chắc cho gia đình: tài chính ổn định, nhà cửa ngăn nắp, kế hoạch tương lai rõ ràng. ESTJ coi trọng cam kết và lời hứa — khi đã nói \"anh/em sẽ lo\", họ sẽ lo đến nơi đến chốn. Tuy nhiên, ESTJ cần học cách lắng nghe cảm xúc nhiều hơn, vì đôi khi người yêu cần sự thấu hiểu hơn là giải pháp.\n\nĐiểm đáng chú ý: ESTJ đôi khi bị coi là \"cứng nhắc\" hay \"kiểm soát\" — nhưng thực ra đó xuất phát từ sự quan tâm. Họ muốn mọi thứ tốt đẹp cho người mình yêu và gia đình. Nếu yêu một ESTJ, hãy thẳng thắn chia sẻ khi cần không gian — họ sẽ tôn trọng nếu hiểu lý do.",
    strengths: [
      "Lãnh đạo và tổ chức tốt",
      "Trách nhiệm cao",
      "Quyết đoán, dứt khoát",
      "Thực tế, hiệu quả",
    ],
    weaknesses: [
      "Có thể cứng nhắc",
      "Hay áp đặt ý kiến",
      "Khó thấu hiểu cảm xúc phức tạp",
    ],
    loveStyle:
      "Yêu truyền thống và ổn định. Thể hiện tình yêu qua trách nhiệm, bảo vệ và xây dựng nền tảng vững chắc cho gia đình.",
    loveTraits: [
      "Lo lắng tài chính gia đình",
      "Lên kế hoạch tương lai rõ ràng",
      "Bảo vệ và che chở",
      "Giữ cam kết và lời hứa",
    ],
    giftIdeas: [
      "Đồ công sở cao cấp",
      "Sách quản lý, kinh doanh",
      "Phụ kiện sang trọng",
      "Quà thực dụng, chất lượng",
    ],
    famousPeople: ["Judge Judy", "Frank Sinatra", "Emma Watson"],
    compatibility: {
      best: ["ISFP", "ISTP", "INTP"],
      good: ["ESTJ", "ISTJ", "ESFJ"],
      challenging: ["INFP", "ENFP", "INFJ"],
    },
  },
  ESFJ: {
    type: "ESFJ",
    name: "Người quan tâm",
    nameEn: "Consul",
    ionIcon: "people-outline",
    shortDesc: "Trái tim ấm áp nhất, luôn kết nối và chăm sóc mọi người bằng tình yêu thương chân thành",
    fullDesc:
      "ESFJ là \"bà mẹ\" (hoặc \"ông bố\") trong thế giới tính cách — dù có phải cha mẹ thật hay không, họ luôn tự nhiên chăm sóc và lo lắng cho người xung quanh. Chiếm khoảng 12% dân số, ESFJ là kiểu tính cách hướng ngoại ấm áp nhất, có khả năng tạo ra những mối liên kết xã hội bền chặt.\n\nESFJ sống để kết nối — họ ghi nhớ tên, sở thích, và câu chuyện của mọi người. Ở đâu có ESFJ, ở đó có sự hài hòa: họ là người tổ chức bữa tiệc gia đình, nhớ sinh nhật của tất cả bạn bè, và luôn kiểm tra xem ai cần giúp đỡ. ESFJ coi trọng sự hòa thuận và không thích xung đột, đôi khi dẫn đến việc họ tránh đối mặt với vấn đề khó.\n\nTrong tình yêu, ESFJ là người bạn đời chăm sóc tận tụy và chu đáo. Họ thể hiện tình yêu qua nấu ăn, trang trí nhà cửa, tổ chức sự kiện gia đình, và đảm bảo mọi người đều hạnh phúc. ESFJ coi trọng truyền thống trong tình yêu: hẹn hò đúng nghĩa, ra mắt gia đình, các dịp kỷ niệm. Họ muốn xây dựng một mái ấm thực sự — nơi mọi người cảm thấy được yêu thương và thuộc về.\n\nĐiểm đáng chú ý: ESFJ rất nhạy cảm với lời phê bình, đặc biệt từ người mình yêu. Một câu nói bất cẩn có thể khiến họ đau lòng lâu hơn bạn tưởng. Nếu cần góp ý với ESFJ, hãy bắt đầu bằng lời khen chân thành trước — họ sẽ lắng nghe tốt hơn khi cảm thấy được trân trọng.",
    strengths: [
      "Giao tiếp tốt, thân thiện",
      "Chu đáo, quan tâm",
      "Có tổ chức, đáng tin cậy",
      "Trách nhiệm với gia đình",
    ],
    weaknesses: [
      "Cần được công nhận",
      "Nhạy cảm với phê bình",
      "Khó chấp nhận thay đổi",
    ],
    loveStyle:
      "Yêu ấm áp, quan tâm sâu sắc. Thích chăm sóc, tổ chức bữa tiệc gia đình và tạo không gian ấm cúng cho người yêu.",
    loveTraits: [
      "Tổ chức sự kiện, tiệc gia đình",
      "Ghi nhớ sở thích của mọi người",
      "Nấu ăn ngon, chăm sóc nhà cửa",
      "Kết nối gia đình hai bên",
    ],
    giftIdeas: [
      "Đồ gia đình, nội thất",
      "Trải nghiệm nhóm, du lịch gia đình",
      "Quà handmade ấm cúng",
      "Đồ trang trí nhà cửa",
    ],
    famousPeople: ["Taylor Swift", "Jennifer Lopez", "Ed Sheeran"],
    compatibility: {
      best: ["ISFP", "ISTP", "ISFJ"],
      good: ["ESFJ", "ESTJ", "ISFJ"],
      challenging: ["INTP", "ENTP", "INTJ"],
    },
  },

  // ── Explorer (SP) ──
  ISTP: {
    type: "ISTP",
    name: "Thợ thủ công",
    nameEn: "Virtuoso",
    ionIcon: "build-outline",
    shortDesc: "Bậc thầy xử lý tình huống, bình tĩnh tuyệt đối và thích tìm hiểu cách mọi thứ vận hành",
    fullDesc:
      "ISTP là \"MacGyver\" trong thế giới tính cách — bình tĩnh, khéo léo và có khả năng giải quyết mọi tình huống bằng những gì có sẵn. Chiếm khoảng 5% dân số, ISTP là kiểu người hành động, thích \"tháo ra xem bên trong\" mọi thứ — từ máy móc, xe cộ đến các hệ thống phức tạp.\n\nISTP sống trong khoảnh khắc hiện tại với sự bình tĩnh đáng kinh ngạc. Khi người khác hoảng loạn, ISTP là người đứng ra giải quyết vấn đề với đầu óc sáng suốt. Họ học bằng cách làm — không cần đọc hướng dẫn 100 trang, chỉ cần bắt tay vào và tìm ra cách. ISTP có khả năng tập trung cao độ khi đang \"vào guồng\" nhưng cũng cần rất nhiều tự do và không gian riêng.\n\nTrong tình yêu, ISTP là kiểu người \"ít nói, nhiều làm\". Họ không giỏi viết thư tình hay nói lời ngọt ngào, nhưng sẽ sửa hết đồ đạc hỏng trong nhà, lái xe đưa bạn đi bất cứ đâu lúc nửa đêm, và luôn có mặt khi bạn cần giúp. Với ISTP, hành động nói to hơn lời nói. Họ cần một người bạn đời tôn trọng sự tự do, không quá đòi hỏi về mặt cảm xúc, và có thể cùng nhau tận hưởng những hoạt động phiêu lưu.\n\nĐiểm đáng chú ý: ISTP đôi khi bị hiểu lầm là \"lạnh lùng\" hay \"không quan tâm\" vì ít bộc lộ cảm xúc bằng lời. Thực tế, họ quan tâm rất nhiều — chỉ là ngôn ngữ yêu thương của ISTP là hành động, không phải lời nói. Hãy nhìn vào những gì ISTP làm, không phải những gì họ nói.",
    strengths: [
      "Thực hành xuất sắc",
      "Linh hoạt, bình tĩnh",
      "Giải quyết vấn đề nhanh",
      "Sáng tạo trong thực tế",
    ],
    weaknesses: [
      "Khó cam kết lâu dài",
      "Ít bộc lộ cảm xúc bằng lời",
      "Hay mạo hiểm",
    ],
    loveStyle:
      "Yêu tự do, thích hành động hơn lời nói. Thể hiện tình yêu bằng việc sửa chữa, giúp đỡ và luôn có mặt khi cần.",
    loveTraits: [
      "Sửa chữa mọi thứ trong nhà",
      "Luôn có mặt khi cần giúp",
      "Hẹn hò phiêu lưu, thú vị",
      "Tôn trọng không gian riêng",
    ],
    giftIdeas: [
      "Dụng cụ DIY chất lượng",
      "Đồ thể thao, mạo hiểm",
      "Công cụ kỹ thuật cao cấp",
      "Trải nghiệm thực tế (off-road, camping)",
    ],
    famousPeople: ["Bruce Lee", "Clint Eastwood", "Tom Cruise"],
    compatibility: {
      best: ["ESFJ", "ESTJ", "ISFJ"],
      good: ["ISTP", "ESTP", "ISTJ"],
      challenging: ["ENFJ", "INFJ", "ENFP"],
    },
  },
  ISFP: {
    type: "ISFP",
    name: "Nghệ sĩ",
    nameEn: "Adventurer",
    ionIcon: "musical-notes-outline",
    shortDesc: "Tâm hồn nghệ sĩ tinh tế, sống trọn vẹn trong khoảnh khắc và tìm vẻ đẹp ở khắp nơi",
    fullDesc:
      "ISFP là \"nghệ sĩ\" trong thế giới tính cách — họ trải nghiệm cuộc sống qua lăng kính thẩm mỹ tinh tế mà ít kiểu tính cách nào có được. Chiếm khoảng 9% dân số, ISFP sống trọn vẹn trong khoảnh khắc hiện tại, trân trọng vẻ đẹp của những điều nhỏ bé mà người khác thường bỏ qua.\n\nISFP có đôi mắt nhìn thấy cái đẹp ở khắp nơi: ánh hoàng hôn, bông hoa dại bên đường, cách ánh sáng rơi qua cửa sổ. Họ thể hiện bản thân qua nghệ thuật — có thể là vẽ tranh, viết nhạc, nấu ăn, trang trí, hay đơn giản là cách họ phối đồ mỗi ngày. ISFP không thích bị gò bó trong quy tắc cứng nhắc; họ cần tự do để khám phá và sáng tạo theo cách riêng.\n\nTrong tình yêu, ISFP nhẹ nhàng nhưng sâu sắc. Họ không phải kiểu tuyên bố tình yêu giữa đám đông — thay vào đó, ISFP vẽ cho bạn một bức tranh, nấu món ăn yêu thích của bạn, hay dắt bạn đi ngắm hoàng hôn ở một nơi chỉ hai người biết. Mỗi khoảnh khắc bên ISFP đều được \"phủ\" lên một lớp thẩm mỹ đặc biệt. Họ yêu chân thành, không vụ lợi, và mong muốn một mối quan hệ tự nhiên, không giả tạo.\n\nĐiểm đáng chú ý: ISFP rất sợ xung đột và có xu hướng tránh né vấn đề thay vì đối mặt. Khi buồn, họ thường rút vào thế giới nội tâm và im lặng. Nếu yêu một ISFP, hãy tạo không gian an toàn để họ chia sẻ, đừng ép họ phải giải thích cảm xúc bằng logic — đôi khi một cái ôm nói nhiều hơn mọi cuộc phân tích.",
    strengths: [
      "Cảm thụ nghệ thuật tinh tế",
      "Linh hoạt, nhẹ nhàng",
      "Nhạy cảm, đồng cảm",
      "Quan sát tốt, tinh tế",
    ],
    weaknesses: [
      "Dễ bị căng thẳng",
      "Khó lập kế hoạch dài hạn",
      "Hay tránh xung đột",
    ],
    loveStyle:
      "Yêu nhẹ nhàng và lãng mạn. Thể hiện tình yêu qua nghệ thuật — vẽ tranh, viết nhạc, nấu ăn đẹp mắt. Mỗi khoảnh khắc bên nhau đều được ISFP biến thành tác phẩm.",
    loveTraits: [
      "Tạo ra những khoảnh khắc đẹp",
      "Nhạy cảm với cảm xúc người yêu",
      "Thích hẹn hò ngoài trời, thiên nhiên",
      "Thể hiện tình yêu qua nghệ thuật",
    ],
    giftIdeas: [
      "Dụng cụ vẽ, sáng tạo",
      "Nhạc cụ yêu thích",
      "Quà handmade từ trái tim",
      "Trải nghiệm nghệ thuật (triển lãm, concert)",
    ],
    famousPeople: ["Bob Dylan", "Frida Kahlo", "Michael Jackson"],
    compatibility: {
      best: ["ENFJ", "ESFJ", "ESTJ"],
      good: ["ISFP", "ISTP", "ESFP"],
      challenging: ["ENTJ", "INTJ", "ENTP"],
    },
  },
  ESTP: {
    type: "ESTP",
    name: "Doanh nhân",
    nameEn: "Entrepreneur",
    ionIcon: "rocket-outline",
    shortDesc: "Người hành động năng động nhất, sống hết mình trong khoảnh khắc với năng lượng bùng nổ",
    fullDesc:
      "ESTP là \"ngôi sao hành động\" trong thế giới tính cách — năng động, táo bạo và luôn sống hết mình. Chiếm khoảng 4% dân số, ESTP là kiểu người khiến cuộc sống trở nên sôi nổi và thú vị hơn. Họ không ngồi lập kế hoạch — họ nhảy vào và hành động ngay.\n\nESTP có khả năng đọc tình huống cực nhanh và phản ứng tức thì. Trong khi người khác còn đang suy nghĩ, ESTP đã hành động và tìm ra giải pháp. Họ có sức hút giao tiếp đặc biệt: hài hước, tự tin, duyên dáng và biết cách khiến mọi người cảm thấy thoải mái. ESTP sống trong thế giới thực — họ coi trọng trải nghiệm hơn lý thuyết, kết quả hơn kế hoạch.\n\nTrong tình yêu, hẹn hò với ESTP giống như một bộ phim hành động — đầy kịch tính, bất ngờ và adrenaline. Họ sẽ đưa bạn đi những nơi bạn chưa từng đến, thử những điều bạn chưa bao giờ nghĩ mình sẽ làm, và biến mỗi buổi hẹn thành một kỷ niệm đáng nhớ. ESTP thể hiện tình yêu bằng sự có mặt: khi bạn gọi, họ xuất hiện — ngay lập tức, không cần hỏi lý do.\n\nĐiểm đáng chú ý: ESTP có thể khiến đối phương cảm thấy bất an vì lối sống tự do và thích mạo hiểm. Họ cần học cách chậm lại đôi khi, lắng nghe cảm xúc của người yêu, và hiểu rằng sự cam kết không phải là \"nhà tù\" — mà là nền tảng để những cuộc phiêu lưu trở nên ý nghĩa hơn.",
    strengths: [
      "Năng động, sôi nổi",
      "Thực tế, quyết đoán",
      "Linh hoạt, nhanh nhạy",
      "Giao tiếp xuất sắc",
    ],
    weaknesses: [
      "Thiếu kiên nhẫn với lý thuyết",
      "Hay mạo hiểm quá mức",
      "Khó tập trung vào một điều lâu",
    ],
    loveStyle:
      "Yêu sôi nổi, thích phiêu lưu và trải nghiệm. Thể hiện tình yêu qua hành động thú vị, hẹn hò bất ngờ và luôn giữ cho mối quan hệ không bao giờ nhàm chán.",
    loveTraits: [
      "Hẹn hò phiêu lưu, bất ngờ",
      "Năng lượng tích cực, vui vẻ",
      "Giải quyết vấn đề nhanh chóng",
      "Thích tặng quà bất ngờ",
    ],
    giftIdeas: [
      "Vé sự kiện thể thao",
      "Trải nghiệm mạo hiểm (nhảy dù, lặn biển)",
      "Gadget hiện đại",
      "Quà bất ngờ, không báo trước",
    ],
    famousPeople: ["Ernest Hemingway", "Madonna", "Eddie Murphy"],
    compatibility: {
      best: ["ISFJ", "ISTJ", "ESFJ"],
      good: ["ESTP", "ISTP", "ESFP"],
      challenging: ["INFJ", "INFP", "INTJ"],
    },
  },
  ESFP: {
    type: "ESFP",
    name: "Người trình diễn",
    nameEn: "Entertainer",
    ionIcon: "mic-outline",
    shortDesc: "Linh hồn của mọi bữa tiệc, tỏa sáng bằng niềm vui và biến cuộc sống thành sân khấu",
    fullDesc:
      "ESFP là \"ngôi sao\" trong thế giới tính cách — ở đâu có ESFP, ở đó có tiếng cười, năng lượng tích cực và sự vui vẻ. Chiếm khoảng 9% dân số, ESFP là kiểu người có khả năng bẩm sinh biến mọi tình huống thành một bữa tiệc. Họ sống trọn vẹn trong khoảnh khắc hiện tại và truyền nguồn năng lượng đó cho tất cả mọi người xung quanh.\n\nESFP có \"bộ cảm biến\" tinh nhạy về không khí — họ biết khi nào cần kể chuyện cười, khi nào cần lắng nghe, và khi nào cần kéo mọi người lên sàn nhảy. Họ thân thiện với tất cả mọi người, từ người lạ trên phố đến CEO trong phòng họp. ESFP sống bằng trải nghiệm: họ muốn nhìn, nghe, chạm, nếm và cảm nhận mọi thứ cuộc sống có thể mang lại.\n\nTrong tình yêu, ESFP là người bạn đời mang lại nhiều tiếng cười nhất. Họ hào phóng trong cảm xúc, thích tặng quà bất ngờ, tổ chức sự kiện kỷ niệm hoành tráng, và biến mỗi ngày bên nhau thành một ngày đáng nhớ. ESFP yêu tự nhiên, không tính toán — khi họ yêu, cả thế giới đều biết. Họ cần một người bạn đời có thể cùng tận hưởng cuộc sống nhưng cũng giúp họ \"neo\" lại khi cần.\n\nĐiểm đáng chú ý: ESFP có xu hướng tránh đối mặt với vấn đề nghiêm túc bằng cách \"đùa qua\" hoặc chuyển chủ đề. Khi gặp xung đột, họ muốn mọi thứ nhanh chóng vui vẻ trở lại thay vì giải quyết tận gốc. Nếu yêu một ESFP, hãy kiên nhẫn dẫn dắt những cuộc trò chuyện khó — nhưng giữ không khí nhẹ nhàng, không quá nặng nề.",
    strengths: [
      "Vui vẻ, lạc quan",
      "Thân thiện, hào phóng",
      "Thực tế, sống trong hiện tại",
      "Linh hoạt, dễ thích ứng",
    ],
    weaknesses: [
      "Thiếu kế hoạch dài hạn",
      "Dễ bị phân tâm",
      "Hay tránh xung đột, vấn đề nghiêm túc",
    ],
    loveStyle:
      "Yêu vui vẻ và tự nhiên. Thích tạo kỷ niệm đáng nhớ, hẹn hò sáng tạo và luôn giữ cho tình yêu tràn đầy tiếng cười.",
    loveTraits: [
      "Luôn mang đến tiếng cười",
      "Hẹn hò sáng tạo, thú vị",
      "Hào phóng tặng quà",
      "Biến mỗi ngày thành ngày đặc biệt",
    ],
    giftIdeas: [
      "Vé concert, show diễn",
      "Trải nghiệm giải trí đặc biệt",
      "Quà tặng bất ngờ, sáng tạo",
      "Đồ thời trang trendy",
    ],
    famousPeople: ["Marilyn Monroe", "Adele", "Jamie Oliver"],
    compatibility: {
      best: ["ISFJ", "ISTJ", "ESFJ"],
      good: ["ESFP", "ESTP", "ISFP"],
      challenging: ["INTJ", "INFJ", "INTP"],
    },
  },
};

// ─── Helpers ───

export function getGroupForType(type: string): MBTIGroup | undefined {
  return MBTI_GROUPS.find((g) => g.types.includes(type));
}

export function getTypeInfo(type: string): MBTITypeInfo | undefined {
  return MBTI_TYPES[type];
}
