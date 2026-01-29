import { ChecklistTemplate } from "../types";

/**
 * Checklist templates for different event types
 * Each template contains suggested tasks based on event tags
 */

// Birthday checklist template
export const BIRTHDAY_CHECKLIST: ChecklistTemplate[] = [
  {
    title: "Suy nghĩ ý tưởng quà tặng",
    dueDaysBefore: 14,
    order: 1,
  },
  {
    title: "Đặt mua quà tặng",
    dueDaysBefore: 7,
    order: 2,
  },
  {
    title: "Chuẩn bị thiệp chúc mừng",
    dueDaysBefore: 3,
    order: 3,
  },
  {
    title: "Kiểm tra lại quà đã sẵn sàng",
    dueDaysBefore: 1,
    order: 4,
  },
  {
    title: "Gói quà đẹp",
    dueDaysBefore: 1,
    order: 5,
  },
];

// Anniversary checklist template
export const ANNIVERSARY_CHECKLIST: ChecklistTemplate[] = [
  {
    title: "Chọn nhà hàng hoặc địa điểm",
    dueDaysBefore: 14,
    order: 1,
  },
  {
    title: "Đặt bàn nhà hàng",
    dueDaysBefore: 7,
    order: 2,
  },
  {
    title: "Mua quà kỷ niệm",
    dueDaysBefore: 7,
    order: 3,
  },
  {
    title: "Chuẩn bị trang phục",
    dueDaysBefore: 3,
    order: 4,
  },
  {
    title: "Xác nhận lại đặt bàn",
    dueDaysBefore: 1,
    order: 5,
  },
  {
    title: "Viết thiệp/thư tay",
    dueDaysBefore: 1,
    order: 6,
  },
];

// Holiday checklist template (Valentine, 8/3, 20/10, etc)
export const HOLIDAY_CHECKLIST: ChecklistTemplate[] = [
  {
    title: "Nghĩ ý tưởng quà và hoạt động",
    dueDaysBefore: 10,
    order: 1,
  },
  {
    title: "Đặt hoa hoặc quà tặng",
    dueDaysBefore: 5,
    order: 2,
  },
  {
    title: "Chuẩn bị kế hoạch cho ngày đặc biệt",
    dueDaysBefore: 3,
    order: 3,
  },
  {
    title: "Kiểm tra và nhận quà",
    dueDaysBefore: 1,
    order: 4,
  },
];

// Default checklist for other events
export const DEFAULT_CHECKLIST: ChecklistTemplate[] = [
  {
    title: "Chuẩn bị cho sự kiện",
    dueDaysBefore: 7,
    order: 1,
  },
  {
    title: "Mua quà hoặc chuẩn bị thứ cần thiết",
    dueDaysBefore: 3,
    order: 2,
  },
  {
    title: "Kiểm tra lại mọi thứ",
    dueDaysBefore: 1,
    order: 3,
  },
];

/**
 * Get appropriate checklist template based on event tags
 * @param tags - Event tags array
 * @returns Checklist template
 */
export function getChecklistTemplate(tags: string[]): ChecklistTemplate[] {
  // Check for birthday
  if (tags.includes("birthday")) {
    return BIRTHDAY_CHECKLIST;
  }

  // Check for anniversary
  if (tags.includes("anniversary")) {
    return ANNIVERSARY_CHECKLIST;
  }

  // Check for holidays
  const holidayTags = ["valentine", "womensday", "mothersday", "fathersday"];
  if (tags.some((tag) => holidayTags.includes(tag.toLowerCase()))) {
    return HOLIDAY_CHECKLIST;
  }

  // Default checklist for other events
  return DEFAULT_CHECKLIST;
}

/**
 * Generate custom checklist based on event title and tags using simple logic
 * This can be enhanced later with AI
 */
export function generateSmartChecklist(
  title: string,
  tags: string[]
): ChecklistTemplate[] {
  const template = getChecklistTemplate(tags);

  // Add relationship-specific items
  const relationship = tags.find((tag) =>
    ["wife", "husband", "girlfriend", "boyfriend", "mother", "father"].includes(
      tag
    )
  );

  if (relationship && tags.includes("birthday")) {
    // Add special item for close relationships
    return [
      ...template,
      {
        title: "Lên kế hoạch bất ngờ đặc biệt",
        dueDaysBefore: 5,
        order: template.length + 1,
      },
    ];
  }

  return template;
}
