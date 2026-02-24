import { ChecklistTemplate, ChecklistTemplateItem } from "../types";

/**
 * Checklist templates for different event types (CMS-ready structure)
 * Each template is a container with items array
 */

// Birthday checklist items
const BIRTHDAY_ITEMS: ChecklistTemplateItem[] = [
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

// Birthday checklist template
export const BIRTHDAY_CHECKLIST: ChecklistTemplate = {
  id: 'birthday_template',
  eventCategory: 'birthday',
  items: BIRTHDAY_ITEMS,
};

// Anniversary checklist items
const ANNIVERSARY_ITEMS: ChecklistTemplateItem[] = [
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

// Anniversary checklist template
export const ANNIVERSARY_CHECKLIST: ChecklistTemplate = {
  id: 'anniversary_template',
  eventCategory: 'anniversary',
  items: ANNIVERSARY_ITEMS,
};

// Holiday checklist items (Valentine, 8/3, 20/10, etc)
const HOLIDAY_ITEMS: ChecklistTemplateItem[] = [
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

// Holiday checklist template
export const HOLIDAY_CHECKLIST: ChecklistTemplate = {
  id: 'holiday_template',
  eventCategory: 'holiday',
  items: HOLIDAY_ITEMS,
};

// Default checklist items for other events
const DEFAULT_ITEMS: ChecklistTemplateItem[] = [
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

// Default checklist template
export const DEFAULT_CHECKLIST: ChecklistTemplate = {
  id: 'default_template',
  eventCategory: 'default',
  items: DEFAULT_ITEMS,
};

/**
 * Get appropriate checklist template based on event tags
 * @param tags - Event tags array
 * @returns Checklist template (CMS-ready structure)
 */
export function getChecklistTemplate(tags: string[]): ChecklistTemplate {
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
): ChecklistTemplate {
  const template = getChecklistTemplate(tags);

  // Add relationship-specific items
  const relationship = tags.find((tag) =>
    ["wife", "husband", "girlfriend", "boyfriend", "mother", "father"].includes(
      tag
    )
  );

  if (relationship && tags.includes("birthday")) {
    // Add special item for close relationships
    return {
      ...template,
      items: [
        ...template.items,
        {
          title: "Lên kế hoạch bất ngờ đặc biệt",
          dueDaysBefore: 5,
          order: template.items.length + 1,
        },
      ],
    };
  }

  return template;
}
