import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ImageSourcePropType } from "react-native";
import { useEvents } from "./EventsContext";
import { addDays } from "date-fns";
import {
  TAG_IMAGES,
  ACTIVITY_IMAGES,
  SPECIAL_DATE_IMAGES,
} from "@lib/iconImages";

interface NotificationContextValue {
  message: string;
  image: ImageSourcePropType;
  upcomingEventsCount: number;
  hasUpcomingEvents: boolean;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

interface NotificationProviderProps {
  children: ReactNode;
}

const LOVE_QUOTES: { text: string; image: ImageSourcePropType }[] = [
  {
    text: "Hãy tận hưởng từng khoảnh khắc bên người mình thương",
    image: TAG_IMAGES.anniversary,
  },
  {
    text: "Những ngày quan trọng là để tạo nên kỷ niệm đẹp",
    image: TAG_IMAGES.other,
  },
  {
    text: "Tình yêu là sự quan tâm trong những điều nhỏ nhặt",
    image: TAG_IMAGES.anniversary,
  },
  {
    text: "Mỗi ngày bên nhau đều là một món quà quý giá",
    image: TAG_IMAGES.birthday,
  },
  {
    text: "Hạnh phúc là được ở bên người ta yêu mỗi ngày",
    image: SPECIAL_DATE_IMAGES.sys_quocte_phunu,
  },
  {
    text: "Thời gian dành cho người thương không bao giờ là lãng phí",
    image: ACTIVITY_IMAGES.sunset,
  },
  {
    text: "Yêu thương là ghi nhớ những ngày đặc biệt của nhau",
    image: TAG_IMAGES.anniversary,
  },
  {
    text: "Tình yêu đích thực nằm ở những hành động nhỏ bé",
    image: SPECIAL_DATE_IMAGES.sys_quocte_phunu,
  },
];

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const { events } = useEvents();
  const [dailyQuote, setDailyQuote] = useState<{
    text: string;
    image: ImageSourcePropType;
  }>(LOVE_QUOTES[0]);

  useEffect(() => {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        86400000
    );
    setDailyQuote(LOVE_QUOTES[dayOfYear % LOVE_QUOTES.length]);
  }, []);

  const upcomingEvents = (() => {
    const now = new Date();
    const sevenDaysLater = addDays(now, 7);
    return events
      .filter((event) => {
        const eventDate = new Date(event.eventDate);
        return eventDate >= now && eventDate <= sevenDaysLater;
      })
      .sort(
        (a, b) =>
          new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
      );
  })();

  const upcomingEventsCount = upcomingEvents.length;
  const hasUpcomingEvents = upcomingEventsCount > 0;

  const message = hasUpcomingEvents
    ? `Bạn có ${upcomingEventsCount} sự kiện sắp diễn ra trong 7 ngày tới • Đừng quên chuẩn bị quà nhé!`
    : dailyQuote.text;

  const value: NotificationContextValue = {
    message,
    image: hasUpcomingEvents ? TAG_IMAGES.holiday : dailyQuote.image,
    upcomingEventsCount,
    hasUpcomingEvents,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
