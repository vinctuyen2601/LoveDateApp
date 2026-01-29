import * as SQLite from "expo-sqlite";
import { AIGiftSuggestion, Event, GiftHistoryItem } from "../types";
import { getPastSuccessfulGifts } from "./giftHistory.service";

/**
 * AI Gift Suggestion Service - Generate personalized gift suggestions using OpenAI
 */

// OpenAI API configuration
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || "";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

interface GiftSuggestionParams {
  event: Event;
  budget?: { min: number; max: number };
  preferences?: string;
  pastGifts?: GiftHistoryItem[];
}

/**
 * Build context for AI prompt based on event and history
 */
function buildPromptContext(params: GiftSuggestionParams): string {
  const { event, budget, preferences, pastGifts } = params;

  let context = `Sự kiện: ${event.title}\n`;
  context += `Tags: ${event.tags.join(", ")}\n`;
  context += `Ngày sự kiện: ${new Date(event.eventDate).toLocaleDateString("vi-VN")}\n`;

  if (budget) {
    context += `Ngân sách: ${budget.min.toLocaleString("vi-VN")} - ${budget.max.toLocaleString("vi-VN")} VNĐ\n`;
  }

  if (preferences) {
    context += `Sở thích/Ghi chú: ${preferences}\n`;
  }

  if (pastGifts && pastGifts.length > 0) {
    context += `\nQuà đã tặng trước đây (thành công):\n`;
    pastGifts.forEach((gift) => {
      context += `- ${gift.giftName}`;
      if (gift.rating) {
        context += ` (đánh giá: ${gift.rating}/5 ⭐)`;
      }
      if (gift.notes) {
        context += ` - ${gift.notes}`;
      }
      context += `\n`;
    });
  }

  return context;
}

/**
 * Build system prompt for AI
 */
function buildSystemPrompt(): string {
  return `Bạn là một chuyên gia tư vấn quà tặng tại Việt Nam. Nhiệm vụ của bạn là đề xuất 5 món quà phù hợp và ý nghĩa dựa trên thông tin sự kiện.

Yêu cầu:
- Đề xuất những món quà thực tế, dễ mua tại Việt Nam
- Phân tích tại sao món quà này phù hợp với người nhận
- Đưa ra khoảng giá cụ thể bằng VNĐ
- Phân loại món quà (ví dụ: trang sức, công nghệ, thời trang, trải nghiệm, etc.)
- Nếu có thông tin về quà đã tặng trước đây, tránh đề xuất những món tương tự
- Ưu tiên những món quà có ý nghĩa cá nhân và độc đáo

Trả về JSON array với format:
[
  {
    "name": "Tên món quà",
    "description": "Mô tả chi tiết món quà",
    "priceRange": "Khoảng giá VNĐ",
    "category": "Danh mục",
    "reasoning": "Lý do tại sao món quà này phù hợp",
    "purchaseLinks": ["Link mua hàng 1", "Link mua hàng 2"]
  }
]

QUAN TRỌNG: Chỉ trả về JSON array, không thêm text hoặc markdown.`;
}

/**
 * Call OpenAI API to generate gift suggestions
 */
async function callOpenAI(
  systemPrompt: string,
  userPrompt: string
): Promise<AIGiftSuggestion[]> {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Cost-effective model
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8, // Balance between creativity and consistency
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Parse JSON response
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", content);
      throw new Error("Invalid JSON response from OpenAI");
    }

    // Handle both array and object with suggestions array
    const suggestions = Array.isArray(parsedContent)
      ? parsedContent
      : parsedContent.suggestions || [];

    return suggestions.map((item: any) => ({
      name: item.name || "Món quà đặc biệt",
      description: item.description || "",
      priceRange: item.priceRange || "Liên hệ",
      category: item.category || "Khác",
      reasoning: item.reasoning || "",
      purchaseLinks: item.purchaseLinks || [],
    }));
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw error;
  }
}

/**
 * Generate AI gift suggestions for an event
 */
export async function generateGiftSuggestions(
  db: SQLite.SQLiteDatabase,
  params: GiftSuggestionParams
): Promise<AIGiftSuggestion[]> {
  try {
    // Get past successful gifts for context
    let pastGifts = params.pastGifts;
    if (!pastGifts) {
      pastGifts = await getPastSuccessfulGifts(db, params.event.id);
    }

    // Build prompts
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildPromptContext({ ...params, pastGifts });

    console.log("🤖 Generating AI gift suggestions...");
    console.log("Context:", userPrompt);

    // Call OpenAI
    const suggestions = await callOpenAI(systemPrompt, userPrompt);

    console.log(`✅ Generated ${suggestions.length} gift suggestions`);

    return suggestions;
  } catch (error) {
    console.error("Error generating gift suggestions:", error);
    throw error;
  }
}

/**
 * Fallback gift suggestions if AI fails
 */
export function getFallbackSuggestions(
  event: Event,
  budget?: { min: number; max: number }
): AIGiftSuggestion[] {
  const suggestions: AIGiftSuggestion[] = [];

  // Birthday suggestions
  if (event.tags.includes("birthday")) {
    suggestions.push(
      {
        name: "Hoa tươi cao cấp",
        description: "Bó hoa hồng hoặc hoa tulip tươi tắn, được bó đẹp mắt",
        priceRange: "300,000 - 800,000 VNĐ",
        category: "Hoa & Quà tặng",
        reasoning:
          "Hoa luôn là món quà cổ điển và ý nghĩa cho sinh nhật, mang lại niềm vui và sự tươi mới.",
        purchaseLinks: [],
      },
      {
        name: "Nước hoa cao cấp",
        description: "Nước hoa thương hiệu nổi tiếng phù hợp với cá tính người nhận",
        priceRange: "1,000,000 - 3,000,000 VNĐ",
        category: "Mỹ phẩm & Làm đẹp",
        reasoning:
          "Nước hoa là món quà sang trọng, thể hiện sự tinh tế và quan tâm đến sở thích cá nhân.",
        purchaseLinks: [],
      }
    );
  }

  // Anniversary suggestions
  if (event.tags.includes("anniversary")) {
    suggestions.push(
      {
        name: "Trang sức bạc/vàng",
        description: "Dây chuyền, nhẫn hoặc vòng tay bạc/vàng có khắc tên hoặc ngày kỷ niệm",
        priceRange: "2,000,000 - 10,000,000 VNĐ",
        category: "Trang sức",
        reasoning:
          "Trang sức là biểu tượng của tình yêu bền vững, có thể khắc lời nhắn riêng để tăng ý nghĩa.",
        purchaseLinks: [],
      },
      {
        name: "Chuyến du lịch ngắn ngày",
        description: "Kỳ nghỉ 2-3 ngày tại resort hoặc khách sạn cao cấp",
        priceRange: "5,000,000 - 15,000,000 VNĐ",
        category: "Trải nghiệm",
        reasoning:
          "Trải nghiệm chung là món quà tạo kỷ niệm đẹp, giúp hai người có thời gian bên nhau.",
        purchaseLinks: [],
      }
    );
  }

  // General suggestions
  if (suggestions.length < 5) {
    suggestions.push(
      {
        name: "Đồng hồ thông minh",
        description: "Apple Watch hoặc Samsung Galaxy Watch với nhiều tính năng sức khỏe",
        priceRange: "5,000,000 - 12,000,000 VNĐ",
        category: "Công nghệ",
        reasoning:
          "Đồng hồ thông minh vừa thời trang vừa hữu ích, thể hiện sự quan tâm đến sức khỏe.",
        purchaseLinks: [],
      },
      {
        name: "Voucher Spa/Massage",
        description: "Gói chăm sóc sức khỏe và làm đẹp tại spa cao cấp",
        priceRange: "1,000,000 - 3,000,000 VNĐ",
        category: "Chăm sóc sức khỏe",
        reasoning:
          "Giúp người nhận thư giãn và chăm sóc bản thân sau những ngày làm việc căng thẳng.",
        purchaseLinks: [],
      },
      {
        name: "Bộ quà handmade cá nhân hóa",
        description: "Album ảnh DIY, sổ tay handmade với lời nhắn riêng",
        priceRange: "200,000 - 800,000 VNĐ",
        category: "Handmade & Cá nhân hóa",
        reasoning:
          "Món quà handmade thể hiện sự chân thành và công sức bỏ ra, mang giá trị tinh thần cao.",
        purchaseLinks: [],
      }
    );
  }

  return suggestions.slice(0, 5);
}

/**
 * Generate gift suggestions with fallback
 * This is the main export that should be used
 */
export async function generateGiftSuggestionsWithFallback(
  db: SQLite.SQLiteDatabase,
  params: GiftSuggestionParams
): Promise<{ suggestions: AIGiftSuggestion[]; isAI: boolean }> {
  try {
    // Try AI suggestions first
    const suggestions = await generateGiftSuggestions(db, params);
    return { suggestions, isAI: true };
  } catch (error) {
    console.error("AI suggestion failed, using fallback:", error);
    // Fall back to predefined suggestions
    const suggestions = getFallbackSuggestions(params.event, params.budget);
    return { suggestions, isAI: false };
  }
}
