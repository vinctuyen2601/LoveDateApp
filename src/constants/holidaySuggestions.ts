// Holiday-Triggered Data Collection
// Mỗi ngày lễ là cơ hội tự nhiên để hỏi user về người thân

import { ImageSourcePropType } from "react-native";

export interface HolidaySuggestion {
  id: string;
  /** ID từ specialDates.ts */
  holidayId: string;
  /** Hiện trước bao nhiêu ngày */
  daysBeforeToShow: number;
  /** Câu hỏi hiển thị trong overlay */
  question: string;
  /** Tên event mặc định (user có thể sửa) */
  defaultTitle: string;
  /** Tag event */
  tag: "birthday" | "anniversary" | "memorial";
  /** Icon từ assets/icons/special/ */
  image: ImageSourcePropType;
  /** Ngày âm lịch hay không */
  isLunar?: boolean;
}

export const HOLIDAY_SUGGESTIONS: HolidaySuggestion[] = [
  {
    id: "suggestion_valentine_anniversary",
    holidayId: "sys_valentine",
    daysBeforeToShow: 7,
    question: "Valentine sắp đến — Bạn còn nhớ ngày kỉ niệm của nhau không?",
    defaultTitle: "Ngày kỷ niệm",
    tag: "anniversary",
    image: require("../../assets/icons/special/valentine.png"),
  },
  {
    id: "suggestion_83_mom",
    holidayId: "sys_quocte_phunu",
    daysBeforeToShow: 7,
    question: "8/3 sắp đến — sinh nhật của những người phụ nữ quan trọng của bạn là ngày nào?",
    defaultTitle: "Sinh nhật những người phụ nữ quan trọng",
    tag: "birthday",
    image: require("../../assets/icons/special/womens-day.png"),
  },
  {
    id: "suggestion_mothers_day_mom",
    holidayId: "sys_ngay_me",
    daysBeforeToShow: 7,
    question: "Ngày của Mẹ sắp đến — sinh nhật mẹ bạn là ngày nào?",
    defaultTitle: "Sinh nhật mẹ",
    tag: "birthday",
    image: require("../../assets/icons/special/mothers-day.png"),
  },
  {
    id: "suggestion_thieu_nhi_child",
    holidayId: "sys_thieu_nhi",
    daysBeforeToShow: 7,
    question: "Tết Thiếu Nhi sắp đến — sinh nhật bé nhà bạn là ngày nào?",
    defaultTitle: "Sinh nhật bé nhà bạn",
    tag: "birthday",
    image: require("../../assets/icons/special/childrens-day.png"),
  },
  {
    id: "suggestion_fathers_day_dad",
    holidayId: "sys_ngay_cha",
    daysBeforeToShow: 7,
    question: "Ngày của Cha sắp đến — bạn có nhớ sinh nhật cha bạn không?",
    defaultTitle: "Sinh nhật bố",
    tag: "birthday",
    image: require("../../assets/icons/special/fathers-day.png"),
  },
  {
    id: "suggestion_vu_lan_memorial",
    holidayId: "sys_vu_lan",
    daysBeforeToShow: 7,
    question: "Vu Lan báo hiếu sắp đến — hãy lưu ngày giỗ của người thân trong gia đình bạn!",
    defaultTitle: "Ngày giỗ",
    tag: "memorial",
    isLunar: true,
    image: require("../../assets/icons/special/vu-lan.png"),
  },
  {
    id: "suggestion_2010_mom",
    holidayId: "sys_phunu_vn",
    daysBeforeToShow: 7,
    question: "20/10 sắp đến — sinh nhật mẹ/chị/em gái bạn đã lưu chưa?",
    defaultTitle: "Sinh nhật mẹ",
    tag: "birthday",
    image: require("../../assets/icons/special/womens-day-vn.png"),
  },
  {
    id: "suggestion_2011_teacher",
    holidayId: "sys_nha_giao",
    daysBeforeToShow: 7,
    question: "20/11 sắp đến — có thầy cô đặc biệt bạn muốn nhớ không?",
    defaultTitle: "Sinh nhật thầy/cô",
    tag: "birthday",
    image: require("../../assets/icons/special/teachers-day.png"),
  },
];
