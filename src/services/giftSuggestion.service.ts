import { AffiliateProduct, Event } from '../types';
import { apiService } from './api.service';

interface GiftSuggestionParams {
  event: Event;
  budget?: { min: number; max: number };
  preferences?: string;
}

export interface GiftSuggestionResult {
  suggestions: AffiliateProduct[];
  isAI: boolean;
  reasoning?: string;
}

const TAG_LABEL: Record<string, string> = {
  birthday:        'sinh nhật',
  anniversary:     'kỷ niệm',
  valentine:       'Valentine',
  women_day_8_3:   '8/3',
  women_day_20_10: '20/10',
  christmas:       'Giáng sinh',
  holiday:         'ngày lễ',
  other:           'dịp đặc biệt',
};

const TAG_OCCASION: Record<string, string> = {
  birthday:        'birthday',
  anniversary:     'anniversary',
  valentine:       'valentine',
  women_day_8_3:   'women_day_8_3',
  women_day_20_10: 'women_day_20_10',
  christmas:       'christmas',
};

function buildPrompt(params: GiftSuggestionParams): string {
  const { event, budget, preferences } = params;

  // If screen already built a rich prompt (recipient + interests + budget), use it directly
  if (preferences?.trim() && preferences.trim().length > 25) {
    return preferences.trim();
  }

  // Fallback: build from event data when preferences is minimal
  const tagText = event.tags.map((t) => TAG_LABEL[t] || t).join(', ') || 'dịp đặc biệt';
  let prompt = `Tìm quà tặng dịp ${tagText}: ${event.title}`;

  if (budget) {
    const maxK = Math.round(budget.max / 1_000);
    prompt += `, ngân sách dưới ${maxK}k`;
  }

  if (preferences?.trim()) {
    prompt += `, ${preferences.trim()}`;
  }

  return prompt;
}

async function fetchAISuggest(params: GiftSuggestionParams): Promise<GiftSuggestionResult> {
  const prompt = buildPrompt(params);
  // apiService.post returns response.data.data || response.data
  // Backend returns { products, reasoning, filters } directly (no .data wrapper)
  // So result = { products, reasoning, filters }
  const data = await apiService.post('/products/ai-suggest', { prompt });
  return {
    suggestions: (data.products as AffiliateProduct[]) || [],
    isAI: true,
    reasoning: data.reasoning as string | undefined,
  };
}

async function fetchProductSearch(params: GiftSuggestionParams): Promise<GiftSuggestionResult> {
  const primaryTag = params.event.tags[0] || 'other';
  const queryParams: Record<string, any> = {
    limit: 8,
    category: 'gift',
    sortBy: 'rating',
    sortOrder: 'DESC',
  };
  const occasion = TAG_OCCASION[primaryTag];
  if (occasion) queryParams.occasion = occasion;
  if (params.budget) queryParams.maxPrice = params.budget.max;

  // apiService.get returns response.data.data || response.data
  // Backend /products/search returns { data: [...], total, page, limit }
  // So response.data.data = [...products array...] → apiService returns array directly
  const data = await apiService.get('/products/search', { params: queryParams });
  return {
    suggestions: (data as AffiliateProduct[]) || [],
    isAI: false,
  };
}

export async function generateGiftSuggestionsWithFallback(
  _db: any,
  params: GiftSuggestionParams,
): Promise<GiftSuggestionResult> {
  try {
    return await fetchAISuggest(params);
  } catch (aiError) {
    console.warn('AI suggest failed, falling back to search:', aiError);
    try {
      return await fetchProductSearch(params);
    } catch (searchError) {
      console.error('Product search fallback also failed:', searchError);
      return { suggestions: [], isAI: false };
    }
  }
}
