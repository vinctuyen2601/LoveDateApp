import React, { useState, useLayoutEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar } from "react-native-calendars";
import { useEvents } from "@contexts/EventsContext";
import { useSync } from "../contexts/SyncContext";
import { useToast } from "../contexts/ToastContext";
import { useColors } from "@contexts/ThemeContext";
import { makeStyles } from "@utils/makeStyles";
import { lunarService } from "../services/lunar.service";
import ReminderSettings from "@components/molecules/ReminderSettings";
import TimePicker from "@components/molecules/TimePicker";
import {
  getConnectionsWithQuota,
  shareEvent,
} from "../services/connections.service";
import type { ConnectionWithQuota } from "../types/connections";
import type { Event } from "../types";
import * as DB from "../services/database.service";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType = "birthday" | "memorial" | "anniversary";

const CURRENT_YEAR = new Date().getFullYear();

const TYPE_CONFIG: Record<
  EventType,
  {
    label: string;
    icon: string;
    color: string;
    tag: string;
    isLunar: boolean;
    startYearLabel: string;
    namePlaceholder: string;
    getPreview: (title: string, startYear: number) => string;
  }
> = {
  birthday: {
    label: "Sinh nhật",
    icon: "gift-outline",
    color: "#FF6B6B",
    tag: "birthday",
    isLunar: false,
    startYearLabel: "Sinh năm",
    namePlaceholder: "Tên người thân...",
    getPreview: (title, sy) => {
      const n = CURRENT_YEAR - sy;
      return n > 0 ? `Sinh nhật lần thứ ${n} của ${title}` : title;
    },
  },
  memorial: {
    label: "Ngày giỗ",
    icon: "flame-outline",
    color: "#7C3AED",
    tag: "memorial",
    isLunar: true,
    startYearLabel: "Năm mất",
    namePlaceholder: "Ngày giỗ của...",
    getPreview: (title, sy) => {
      const n = CURRENT_YEAR - sy;
      return n > 0 ? `Giỗ năm thứ ${n} của ${title}` : title;
    },
  },
  anniversary: {
    label: "Kỷ niệm",
    icon: "heart-circle-outline",
    color: "#FF69B4",
    tag: "anniversary",
    isLunar: false,
    startYearLabel: "Bắt đầu từ năm",
    namePlaceholder: "Tên sự kiện...",
    getPreview: (title, sy) => {
      const n = CURRENT_YEAR - sy;
      return n > 0 ? `Kỷ niệm ${n} năm ${title}` : title;
    },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

const AddYearlyEventScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { addEvent } = useEvents();
  const { sync } = useSync();
  const { showSuccess, showError } = useToast();
  const colors = useColors();
  const styles = useStyles();

  const eventType: EventType = route.params?.eventType ?? "birthday";
  const config = TYPE_CONFIG[eventType];

  // ── Steps: 0=Info, 1=Date, 2=Reminder ────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // ── Form state ────────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [isCatholic, setIsCatholic] = useState(false);
  const [dateText, setDateText] = useState(() => {
    const today = new Date();
    if (config.isLunar) {
      const lunar = lunarService.jsDateToLunar(today);
      const d = String(lunar.day).padStart(2, '0');
      const m = String(lunar.month).padStart(2, '0');
      const y = String(lunar.year);
      return `${d}/${m}/${y}`;
    }
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = String(today.getFullYear());
    return `${d}/${m}/${y}`;
  });

  const [remindDaysBefore, setRemindDaysBefore] = useState<number[]>([0, 1, 7]);
  const [reminderTime, setReminderTime] = useState({ hour: 9, minute: 0 });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Share modal state ─────────────────────────────────────────────────────
  const [createdEvent, setCreatedEvent] = useState<Event | null>(null);
  const [connections, setConnections] = useState<ConnectionWithQuota[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isSyncingForShare, setIsSyncingForShare] = useState(false);
  const [selectedConnIds, setSelectedConnIds] = useState<Set<string>>(
    new Set()
  );
  const [isSharing, setIsSharing] = useState(false);

  // ── Header back button ────────────────────────────────────────────────────
  useLayoutEffect(() => {
    navigation.setOptions({
      title: config.label,
      headerStyle: {
        backgroundColor: colors.surface,
      },
      headerTintColor: colors.textPrimary,
      headerLeft:
        currentStep > 0
          ? () => (
              <TouchableOpacity
                onPress={() => setCurrentStep((s) => s - 1)}
                style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="chevron-back"
                  size={26}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            )
          : undefined,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.popToTop()}
          style={{ paddingHorizontal: 16, paddingVertical: 8 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, currentStep, colors.textPrimary]);

  // ── Parse dateText (DD/MM/YYYY) ───────────────────────────────────────────
  const parsedDate = useMemo(() => {
    const parts = dateText.split("/");
    return {
      day: parseInt(parts[0]) || 0,
      month: parseInt(parts[1]) || 0,
      year: parseInt(parts[2]) || 0,
    };
  }, [dateText]);

  // ── Layer 1: pure range check, no library call ────────────────────────────
  // Lunar months max 30 days; solar max is 31 (overflow caught later).
  const isRangeValid = useMemo(() => {
    const { day, month, year } = parsedDate;
    if (month < 1 || month > 12) return false;
    if (year < 1900 || year > CURRENT_YEAR) return false;
    const maxDay = config.isLunar ? 30 : 31;
    return day >= 1 && day <= maxDay;
  }, [parsedDate, config.isLunar]);

  // ── Preview text ──────────────────────────────────────────────────────────
  const previewText = useMemo(() => {
    const { year } = parsedDate;
    if (!title.trim() || !year) return "";
    return config.getPreview(title.trim(), year);
  }, [title, parsedDate, config]);

  // ── Layer 2: calendar date string ─────────────────────────────────────────
  // Lunar  → call lunarToSolar once here (result reused by isDateValid & label).
  // Solar  → just format the numbers; overflow check is done in isDateValid.
  const calendarDateString = useMemo(() => {
    if (!isRangeValid) return null;
    const { day, month, year } = parsedDate;
    if (config.isLunar) {
      try {
        const solar = lunarService.lunarToSolar({ year, month, day, isLeapMonth: false });
        return `${solar.year}-${String(solar.month).padStart(2, "0")}-${String(solar.day).padStart(2, "0")}`;
      } catch {
        return null; // invalid lunar date (e.g. day 30 in a 29-day month)
      }
    }
    // Solar — just encode; overflow checked in isDateValid below
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }, [isRangeValid, parsedDate, config.isLunar]);

  // ── Layer 3: full validity ─────────────────────────────────────────────────
  // Lunar: range ok  +  conversion succeeded (calendarDateString !== null).
  // Solar: range ok  +  no day overflow (e.g. 30/2, 31/4).
  const isDateValid = useMemo(() => {
    if (!isRangeValid) return false;
    if (config.isLunar) {
      return calendarDateString !== null;
    }
    // Solar overflow check: new Date(2000, 1, 30) rolls over to March → invalid
    const { day, month, year } = parsedDate;
    const d = new Date(year, month - 1, day);
    return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
  }, [isRangeValid, parsedDate, config.isLunar, calendarDateString]);

  // ── Solar equivalent label for memorial ───────────────────────────────────
  const solarEquivalentLabel = useMemo(() => {
    if (!config.isLunar || !calendarDateString) return null;
    const [solarYear, m, d] = calendarDateString.split("-").map(Number);
    return `≈ Dương lịch: ${d}/${m}/${solarYear}`;
  }, [config.isLunar, calendarDateString]);

  // ── eventDate constructed from inputs ─────────────────────────────────────
  // IMPORTANT: For lunar events, store lunar coordinates encoded as ISO numbers
  // (e.g., lunar 1/3/2000 → new Date(2000, 2, 1)). extractLunarCoordinates()
  // in recurrence.ts reads getMonth()+1 / getDate() directly — NOT a solar→lunar
  // conversion. Do NOT store the solar equivalent here.
  const eventDate = useMemo(() => {
    if (!isDateValid) return new Date();
    const { day, month, year } = parsedDate;
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }, [isDateValid, parsedDate]);

  // ── Navigation / validation ───────────────────────────────────────────────
  const handleNext = () => {
    if (currentStep === 0) {
      const errs: Record<string, string> = {};
      if (!title.trim()) errs.title = "Vui lòng nhập tên";
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }
      setErrors({});
    }
    if (currentStep === 1) {
      if (!isDateValid) {
        const { day, month, year } = parsedDate;
        let msg = "Vui lòng nhập ngày/tháng/năm hợp lệ";
        if (month < 1 || month > 12) msg = "Tháng không hợp lệ (1–12)";
        else if (year < 1900 || year > CURRENT_YEAR)
          msg = `Năm phải từ 1900 đến ${CURRENT_YEAR}`;
        else if (config.isLunar) {
          if (day < 1 || day > 30) msg = "Ngày âm lịch không hợp lệ (1–30)";
          else msg = "Ngày âm lịch không tồn tại (tháng này chỉ có 29 ngày)";
        } else {
          if (day < 1 || day > 31) msg = "Ngày không hợp lệ (1–31)";
          else msg = `Tháng ${month} không có ngày ${day}`;
        }
        setErrors({ date: msg });
        return;
      }
      setErrors({});
    }
    setCurrentStep((s) => s + 1);
  };

  const toggleReminderDay = useCallback((days: number) => {
    setRemindDaysBefore((prev) =>
      prev.includes(days) ? prev.filter((d) => d !== days) : [...prev, days]
    );
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const { day: d, month: m, year: sy } = parsedDate;

    try {
      setIsSubmitting(true);

      const newEvent = await addEvent({
        title: title.trim(),
        eventDate,
        isLunarCalendar: config.isLunar,
        tags: isCatholic ? [config.tag, 'catholic'] : [config.tag],
        remindDaysBefore,
        reminderTime,
        isRecurring: true,
        startYear: sy,
        recurrencePattern: { type: "yearly", month: m, day: d },
      });

      showSuccess(`Đã thêm "${title.trim()}" thành công!`);
      setCreatedEvent(newEvent);
      setIsLoadingConnections(true);
      setIsSyncingForShare(true);
      setCurrentStep(3);
      setSelectedConnIds(new Set());

      getConnectionsWithQuota()
        .then(setConnections)
        .catch(() => setConnections([]))
        .finally(() => setIsLoadingConnections(false));

      const waitForServerId = async () => {
        for (let attempt = 0; attempt < 2; attempt++) {
          if (attempt > 0) await sync().catch(console.warn);
          for (let i = 0; i < 12; i++) {
            await new Promise((r) => setTimeout(r, 600));
            const fresh = await DB.getEventById(db, newEvent.id);
            if (fresh?.serverId) {
              setCreatedEvent((prev) =>
                prev ? { ...prev, serverId: fresh.serverId } : prev
              );
              return;
            }
          }
        }
      };
      waitForServerId().finally(() => setIsSyncingForShare(false));
    } catch (error: any) {
      showError(error.message || "Không thể thêm sự kiện");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Share handlers ────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!createdEvent?.serverId || selectedConnIds.size === 0) return;
    setIsSharing(true);
    try {
      await shareEvent(createdEvent.serverId!, [...selectedConnIds]);
      showSuccess("Đã chia sẻ thành công!");
    } catch {
      showError("Không thể chia sẻ, thử lại sau");
    } finally {
      setIsSharing(false);
      navigation.popToTop();
    }
  };

  // ── Steps config ──────────────────────────────────────────────────────────
  // Overall flow gồm 5 bước (Nhãn đã done ở AddEventScreen, offset = 1)
  const OVERALL_STEPS = 5;
  const STEP_OFFSET = 1; // "Nhãn" đã hoàn thành trước khi vào màn này
  const overallStep = currentStep + STEP_OFFSET; // 1-indexed position trong flow tổng
  const accentColor = config.tag === 'memorial' ? colors.relationshipParent : colors.primary;

  const formSteps = [
    { label: "Thông tin" },
    { label: "Ngày" },
    { label: "Nhắc nhở" },
    { label: "Chia sẻ" },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Step indicator — progress trong toàn bộ flow 5 bước */}
      <View style={styles.stepIndicator}>
        <View style={styles.stepMeta}>
          <Text style={styles.stepCount}>
            Bước {overallStep + 1}/{OVERALL_STEPS}
          </Text>
          <Text style={styles.stepLabelActive}>
            {formSteps[currentStep]?.label}
          </Text>
        </View>
        <View style={styles.stepBarTrack}>
          <View
            style={[
              styles.stepBarFill,
              { width: `${((overallStep + 1) / OVERALL_STEPS) * 100}%`, backgroundColor: accentColor },
            ]}
          />
        </View>
        <View style={styles.stepDots}>
          {Array.from({ length: OVERALL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                i < overallStep && [styles.stepDotDone, { backgroundColor: accentColor + "60" }],
                i === overallStep && [styles.stepDotActive, { backgroundColor: accentColor }],
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
        onScroll={(e) => setIsScrolled(e.nativeEvent.contentOffset.y > 10)}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Step 0: Thông tin ──────────────────────────────────────────── */}
        {currentStep === 0 && (
          <>
            {/* Type badge */}
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: config.color + "18" },
              ]}
            >
              <Ionicons
                name={config.icon as any}
                size={20}
                color={config.color}
              />
              <Text style={[styles.typeBadgeText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>

            {/* Title */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Tên <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder={config.namePlaceholder}
                placeholderTextColor={colors.textLight}
                value={title}
                onChangeText={(t) => {
                  setTitle(t);
                  setErrors((e) => ({ ...e, title: undefined as any }));
                }}
                autoFocus
              />
              {errors.title ? (
                <Text style={styles.errorText}>{errors.title}</Text>
              ) : null}
            </View>

            {/* Religion toggle — only for memorial */}
            {config.tag === 'memorial' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Tín ngưỡng</Text>
                <View style={styles.religionRow}>
                  <TouchableOpacity
                    style={[styles.religionOption, !isCatholic && styles.religionOptionActive]}
                    onPress={() => setIsCatholic(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.religionOptionText, !isCatholic && styles.religionOptionTextActive]}>
                      Truyền thống
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.religionOption, isCatholic && styles.religionOptionActive]}
                    onPress={() => setIsCatholic(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.religionOptionText, isCatholic && styles.religionOptionTextActive]}>
                      Công giáo
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {/* ── Step 1: Ngày ──────────────────────────────────────────────── */}
        {currentStep === 1 && (
          <>
            {/* Lunar warning for memorial */}
            {config.isLunar && (
              <View style={styles.lunarWarning}>
                <Ionicons
                  name="warning-outline"
                  size={16}
                  color={colors.warning}
                />
                <Text style={styles.lunarWarningText}>
                  Nhập ngày <Text style={styles.lunarWarningBold}>ÂM LỊCH</Text>
                </Text>
              </View>
            )}

            {/* Single masked date input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Ngày / Tháng / {config.startYearLabel}
                {config.isLunar ? (
                  <Text style={{ color: colors.warning }}> (Âm lịch)</Text>
                ) : (
                  ""
                )}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.date && styles.inputError]}
                placeholder="DD / MM / YYYY"
                placeholderTextColor={colors.textLight}
                value={dateText}
                onChangeText={(raw) => {
                  const digits = raw.replace(/\D/g, "").slice(0, 8);
                  let formatted = digits;
                  if (digits.length > 2)
                    formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
                  if (digits.length > 4)
                    formatted = `${digits.slice(0, 2)}/${digits.slice(
                      2,
                      4
                    )}/${digits.slice(4)}`;
                  setDateText(formatted);
                  setErrors((e) => ({ ...e, date: undefined as any }));
                }}
                keyboardType="number-pad"
                maxLength={10}
                autoFocus
              />
              {errors.date ? (
                <Text style={styles.errorText}>{errors.date}</Text>
              ) : null}
            </View>

            {/* Live preview */}
            {previewText ? (
              <View style={[styles.previewBox, { borderLeftColor: accentColor, backgroundColor: accentColor + "20" }]}>
                <Ionicons
                  name="sparkles-outline"
                  size={16}
                  color={accentColor}
                />
                <Text style={[styles.previewText, { color: accentColor }]}>{previewText}</Text>
              </View>
            ) : null}

            {/* Solar equivalent for memorial */}
            {config.isLunar && solarEquivalentLabel && (
              <View style={styles.solarEquiv}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.solarEquivText}>
                  {solarEquivalentLabel}
                </Text>
              </View>
            )}

            {/* Calendar — visual only */}
            {calendarDateString && (
              <View style={styles.calendarCard}>
                <Calendar
                  current={calendarDateString}
                  onDayPress={!config.isLunar ? (day) => {
                    const [y, m, d] = day.dateString.split('-').map(Number);
                    setDateText(
                      `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
                    );
                    setErrors((e) => ({ ...e, date: undefined as any }));
                  } : undefined}
                  markedDates={{
                    [calendarDateString]: {
                      selected: true,
                      selectedColor: config.isLunar
                        ? colors.warning
                        : colors.primary,
                    },
                  }}
                  theme={{
                    backgroundColor: "transparent",
                    calendarBackground: "transparent",
                    selectedDayBackgroundColor: config.isLunar
                      ? colors.warning
                      : colors.primary,
                    selectedDayTextColor: colors.white,
                    todayTextColor: colors.primary,
                    dayTextColor: colors.textPrimary,
                    textDisabledColor: colors.textLight,
                    arrowColor: colors.primary,
                    monthTextColor: colors.textPrimary,
                    textDayFontSize: 14,
                    textMonthFontSize: 16,
                    textDayHeaderFontSize: 12,
                  }}
                  hideExtraDays={false}
                  firstDay={1}
                  disableAllTouchEventsForDisabledDays
                  disableArrowLeft={config.isLunar}
                  disableArrowRight={config.isLunar}
                  maxDate={!config.isLunar ? `${CURRENT_YEAR}-12-31` : undefined}
                  minDate={!config.isLunar ? '1900-01-01' : undefined}
                />
                {config.isLunar && (
                  <Text style={styles.calendarNote}>
                    Lịch hiển thị ngày dương tương đương
                  </Text>
                )}
              </View>
            )}
          </>
        )}

        {/* ── Step 2: Nhắc nhở ──────────────────────────────────────────── */}
        {currentStep === 2 && (
          <>
            <ReminderSettings
              selectedDays={remindDaysBefore}
              onToggle={toggleReminderDay}
              eventDate={eventDate}
              isRecurring={true}
            />
            <TimePicker
              selectedTime={reminderTime}
              onTimeChange={setReminderTime}
            />
          </>
        )}
        {/* ── Step 3: Chia sẻ ── */}
        {currentStep === 3 && (
          <>
            {isLoadingConnections ? (
              <View style={styles.shareLoading}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.shareLoadingText}>Đang tải kết nối...</Text>
              </View>
            ) : connections.length === 0 ? (
              <View style={styles.shareEmpty}>
                <Ionicons
                  name="people-outline"
                  size={48}
                  color={colors.textLight}
                />
                <Text style={styles.shareEmptyTitle}>Chưa có kết nối</Text>
                <Text style={styles.shareEmptySub}>
                  Thêm kết nối với người thân để có thể chia sẻ sự kiện sau này
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <Text style={styles.shareHint}>
                  Chọn những người bạn muốn chia sẻ "{title.trim()}". Họ sẽ nhận
                  được thông báo và có thể thêm vào lịch của mình.
                </Text>
                {connections.map(({ connection, partner, canReceive }) => {
                  const isSelected = selectedConnIds.has(partner.id);
                  return (
                    <TouchableOpacity
                      key={connection.id}
                      style={[
                        styles.shareConnCard,
                        isSelected && styles.shareConnCardSelected,
                        !canReceive && styles.shareConnCardDisabled,
                      ]}
                      onPress={() => {
                        if (!canReceive) return;
                        setSelectedConnIds((prev) => {
                          const next = new Set(prev);
                          isSelected
                            ? next.delete(partner.id)
                            : next.add(partner.id);
                          return next;
                        });
                      }}
                      activeOpacity={canReceive ? 0.7 : 1}
                    >
                      <View
                        style={[
                          styles.shareAvatar,
                          {
                            backgroundColor: [
                              "#FF6B6B",
                              "#4ECDC4",
                              "#845EF7",
                              "#339AF0",
                            ][partner.id.charCodeAt(0) % 4],
                          },
                        ]}
                      >
                        <Text style={styles.shareAvatarText}>
                          {(partner.displayName ||
                            partner.email ||
                            "?")[0].toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.shareConnName,
                            !canReceive && { color: colors.textLight },
                          ]}
                        >
                          {partner.displayName || "Người dùng"}
                        </Text>
                        <Text style={styles.shareConnEmail} numberOfLines={1}>
                          {partner.email}
                        </Text>
                        {!canReceive && (
                          <Text style={styles.shareConnFull}>
                            Hết lượt nhận
                          </Text>
                        )}
                      </View>
                      {canReceive && (
                        <View
                          style={[
                            styles.shareCheck,
                            isSelected && {
                              backgroundColor: colors.primary,
                              borderColor: colors.primary,
                            },
                          ]}
                        >
                          {isSelected && (
                            <Ionicons
                              name="checkmark"
                              size={14}
                              color={colors.white}
                            />
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, isScrolled && styles.footerShadow]}>
        {currentStep === 3 ? (
          <View style={styles.shareFooterRow}>
            <TouchableOpacity
              style={styles.shareSkipBtn}
              onPress={() => navigation.popToTop()}
            >
              <Text style={styles.shareSkipText}>Bỏ qua</Text>
            </TouchableOpacity>
            {connections.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.shareSendBtn,
                  (selectedConnIds.size === 0 ||
                    isSharing ||
                    isSyncingForShare) &&
                    styles.shareSendBtnDisabled,
                ]}
                onPress={handleShare}
                disabled={
                  selectedConnIds.size === 0 || isSharing || isSyncingForShare
                }
              >
                {isSharing || isSyncingForShare ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Ionicons
                      name="share-outline"
                      size={18}
                      color={colors.white}
                    />
                    <Text style={styles.shareSendText}>
                      Chia sẻ
                      {selectedConnIds.size > 0
                        ? ` (${selectedConnIds.size})`
                        : ""}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        ) : currentStep < 2 ? (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.primary, "#C850C0"]}
              style={styles.submitBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.submitButtonText}>Tiếp theo</Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={colors.white}
                style={{ marginLeft: 6 }}
              />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.primary, "#C850C0"]}
              style={styles.submitBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Lưu sự kiện</Text>
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={colors.white}
                    style={{ marginLeft: 6 }}
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 16 },

  // Step indicator
  stepIndicator: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  stepMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepCount: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: "Manrope_500Medium",
  },
  stepLabelActive: {
    fontSize: 12,
    color: colors.primary,
    fontFamily: "Manrope_700Bold",
  },
  stepBarTrack: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  stepBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  stepDots: {
    flexDirection: "row",
    gap: 6,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  stepDotDone: {
    backgroundColor: colors.primary + "60",
  },
  stepDotActive: {
    width: 18,
    backgroundColor: colors.primary,
  },

  // Type badge
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  typeBadgeText: {
    fontSize: 15,
    fontFamily: "Manrope_600SemiBold",
  },

  // Religion toggle
  religionRow: {
    flexDirection: "row",
    gap: 8,
  },
  religionOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  religionOptionActive: {
    borderColor: colors.relationshipParent,
    backgroundColor: colors.relationshipParent + "15",
  },
  religionOptionText: {
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
    color: colors.textSecondary,
  },
  religionOptionTextActive: {
    color: colors.relationshipParent,
    fontFamily: "Manrope_700Bold",
  },

  // Form fields
  fieldGroup: { gap: 6 },
  label: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    color: colors.textPrimary,
  },
  required: { color: colors.error },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  inputError: { borderColor: colors.error },
  errorText: { fontSize: 12, color: colors.error, marginTop: 2 },

  // Preview box
  previewBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: colors.relationshipParent + "20",
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.relationshipParent,
  },
  previewText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    color: colors.relationshipParent,
    fontStyle: "italic",
  },

  // Date step
  lunarWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: colors.warning + "18",
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  lunarWarningText: { fontSize: 14, color: colors.warning },
  lunarWarningBold: { fontFamily: "Manrope_700Bold" },

  solarEquiv: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -4,
  },
  solarEquivText: { fontSize: 13, color: colors.textSecondary },

  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: "hidden",
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  calendarNote: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    paddingBottom: 10,
    fontStyle: "italic",
  },

  // Footer
  footer: {
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerShadow: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  submitButton: { borderRadius: 12, overflow: "hidden" },
  submitButtonDisabled: { opacity: 0.6 },
  submitBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
    color: colors.white,
  },

  // Share step
  shareLoading: { alignItems: "center", gap: 10, paddingVertical: 32 },
  shareLoadingText: { fontSize: 14, color: colors.textSecondary },
  shareEmpty: { alignItems: "center", gap: 8, paddingVertical: 32 },
  shareEmptyTitle: {
    fontSize: 16,
    fontFamily: "Manrope_600SemiBold",
    color: colors.textPrimary,
  },
  shareEmptySub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  shareHint: { fontSize: 13, color: colors.textSecondary },
  shareConnCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  shareConnCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "08",
  },
  shareConnCardDisabled: { opacity: 0.5 },
  shareAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  shareAvatarText: {
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
    color: "#fff",
  },
  shareConnName: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    color: colors.textPrimary,
  },
  shareConnEmail: { fontSize: 12, color: colors.textSecondary },
  shareConnFull: { fontSize: 11, color: colors.error },
  shareCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  shareFooterRow: { flexDirection: "row", gap: 10 },
  shareSkipBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
  },
  shareSkipText: { fontSize: 15, color: colors.textSecondary },
  shareSendBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  shareSendBtnDisabled: { opacity: 0.5 },
  shareSendText: {
    fontSize: 15,
    fontFamily: "Manrope_700Bold",
    color: colors.white,
  },
}));

export default AddYearlyEventScreen;
