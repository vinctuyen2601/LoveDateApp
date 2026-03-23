import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  BackHandler,
  Modal,
  ActivityIndicator,
  Image,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import IconImage from "@components/atoms/IconImage";
import { getTagImage } from "@lib/iconImages";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEvents } from "@contexts/EventsContext";
import { useSync } from "../contexts/SyncContext";
import { useToast } from "../contexts/ToastContext";
import * as DB from "../services/database.service";
import { EventFormData, RecurrenceType, PREDEFINED_TAGS, Event } from "../types";
import { getConnectionsWithQuota, shareEvent } from "../services/connections.service";
import type { ConnectionWithQuota } from "../types/connections";
import { COLORS } from "@themes/colors";
import { STRINGS } from "../constants/strings";
import { DateUtils } from "@lib/date.utils";
import { ValidationUtils } from "@lib/validation.utils";
import ReminderSettings from "@components/molecules/ReminderSettings";
import TimePicker from "@components/molecules/TimePicker";
import RecurrenceTypePicker from "@components/molecules/RecurrenceTypePicker";
// TODO(monetization): import * as PremiumService from "../services/premium.service";
import { MAX_TITLE_LENGTH } from "../constants/config";

const AddEventScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { addEvent, updateEvent, getEventById } = useEvents();
  const { sync } = useSync();
  const { showSuccess, showError } = useToast();

  // Check if this is Edit mode
  const eventId = route.params?.eventId;
  const isEditMode = !!eventId;
  const existingEvent = isEditMode ? getEventById(eventId) : undefined;

  const now = new Date();
  // Create default date at 12:00 to avoid timezone issues
  const defaultDate = new Date();
  defaultDate.setHours(12, 0, 0, 0);

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    eventDate: defaultDate,
    isLunarCalendar: false,
    tags: [],
    remindDaysBefore: [1, 7],
    reminderTime: { hour: 9, minute: 0 },
    isRecurring: true, // Default yearly recurring
  });

  const [recurrenceType, setRecurrenceType] =
    useState<RecurrenceType>("yearly");
  const [dayOfWeek, setDayOfWeek] = useState<number>(new Date().getDay());
  const [dayOfMonth, setDayOfMonth] = useState<number>(new Date().getDate());

  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0=Tên, 1=Nhãn, 2=Thời gian, 3=Nhắc nhở

  // Share modal after event creation
  const [showShareModal, setShowShareModal] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<Event | null>(null);
  const [connections, setConnections] = useState<ConnectionWithQuota[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isSyncingForShare, setIsSyncingForShare] = useState(false);
  const [selectedConnIds, setSelectedConnIds] = useState<Set<string>>(new Set());
  const [isSharing, setIsSharing] = useState(false);

  // Load existing event data when in Edit mode
  useEffect(() => {
    if (isEditMode && existingEvent) {
      const eventDate = new Date(existingEvent.eventDate);

      setFormData({
        title: existingEvent.title,
        eventDate,
        isLunarCalendar: existingEvent.isLunarCalendar,
        tags: existingEvent.tags, // Load tags from existing event
        remindDaysBefore: existingEvent.reminderSettings.remindDaysBefore,
        reminderTime: existingEvent.reminderSettings.reminderTime || {
          hour: now.getHours(),
          minute: now.getMinutes(),
        },
        isRecurring: existingEvent.isRecurring,
        recurrencePattern: existingEvent.recurrencePattern,
      });

      // Set recurrence type based on existing pattern
      if (existingEvent.recurrencePattern) {
        setRecurrenceType(existingEvent.recurrencePattern.type);

        if (
          existingEvent.recurrencePattern.type === "weekly" &&
          existingEvent.recurrencePattern.dayOfWeek !== undefined
        ) {
          setDayOfWeek(existingEvent.recurrencePattern.dayOfWeek);
        } else if (
          existingEvent.recurrencePattern.type === "monthly" &&
          existingEvent.recurrencePattern.dayOfMonth !== undefined
        ) {
          setDayOfMonth(existingEvent.recurrencePattern.dayOfMonth);
        }
      } else if (!existingEvent.isRecurring) {
        setRecurrenceType("once");
      }
    }
  }, [isEditMode, eventId]);

  // Override header back button to go to previous step instead of exiting
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () =>
        currentStep > 0 ? (
          <TouchableOpacity
            onPress={() => setCurrentStep((s) => s - 1)}
            style={{ paddingHorizontal: 12, paddingVertical: 8 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={26} color={COLORS.textPrimary} />
          </TouchableOpacity>
        ) : undefined,
    });
  }, [navigation, currentStep]);

  // Android hardware back — navigate to previous step instead of exiting
  useEffect(() => {
    const onBack = () => {
      if (currentStep > 0) {
        setCurrentStep((s) => s - 1);
        return true; // consume event
      }
      return false; // let default behavior (exit) happen
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => sub.remove();
  }, [currentStep]);

  // Validate current step before advancing
  const handleNext = () => {
    if (currentStep === 0) {
      if (!formData.title.trim()) {
        setErrors({ title: "Vui lòng nhập tên sự kiện" });
        return;
      }
      setErrors({});
    }
    setCurrentStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    // Validate
    const validationErrors = ValidationUtils.validateEventForm(formData);
    if (ValidationUtils.hasErrors(validationErrors)) {
      setErrors(validationErrors);
      Alert.alert("Lỗi", "Vui lòng kiểm tra lại thông tin");
      return;
    }

    // TODO(monetization): Re-enable event limit khi có đủ user base
    // if (!isEditMode) {
    //   const { canCreate, reason, limit } = await PremiumService.canCreateEvent(db, 'default-user');
    //   if (!canCreate) { ... navigate('Premium') ... }
    // }

    try {
      setIsSubmitting(true);

      // Build recurrence pattern based on type
      let recurrencePattern = undefined;
      if (formData.isRecurring) {
        if (recurrenceType === "weekly") {
          recurrencePattern = {
            type: recurrenceType,
            dayOfWeek,
          };
        } else if (recurrenceType === "monthly") {
          recurrencePattern = {
            type: recurrenceType,
            dayOfMonth,
          };
        } else if (recurrenceType === "yearly") {
          recurrencePattern = {
            type: recurrenceType,
            month: formData.eventDate.getMonth() + 1, // 1-12
            day: formData.eventDate.getDate(), // 1-31
          };
        } else {
          // 'once' - no pattern needed
          recurrencePattern = {
            type: recurrenceType,
          };
        }
      }

      if (isEditMode) {
        // Update existing event
        await updateEvent(eventId, { ...formData, recurrencePattern });
        showSuccess(`✨ Đã cập nhật sự kiện "${formData.title}" thành công!`);
      } else {
        // Add new event
        // EventsContext.addEvent already handles checklist auto-generation
        const newEvent = await addEvent({ ...formData, recurrencePattern });
        showSuccess(`✨ Đã thêm sự kiện "${formData.title}" thành công!`);
        // Offer to share with connections if user has any
        setCreatedEvent(newEvent);
        setIsLoadingConnections(true);
        setIsSyncingForShare(true);
        setShowShareModal(true);
        setSelectedConnIds(new Set());
        // Fetch connections and sync to get serverId — run in parallel
        getConnectionsWithQuota()
          .then(setConnections)
          .catch(() => setConnections([]))
          .finally(() => setIsLoadingConnections(false));
        sync()
          .then(async () => {
            // Read serverId from DB directly after sync
            const fresh = await DB.getEventById(db, newEvent.id);
            if (fresh?.serverId) {
              setCreatedEvent((prev) => prev ? { ...prev, serverId: fresh.serverId } : prev);
            }
          })
          .catch(console.warn)
          .finally(() => setIsSyncingForShare(false));
        return; // Don't navigate yet; share modal handles navigation
      }

      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error: any) {
      showError(
        error.message ||
          (isEditMode ? "Không thể cập nhật sự kiện" : "Không thể thêm sự kiện")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleReminderDay = (days: number) => {
    const currentDays = formData.remindDaysBefore;
    const newDays = currentDays.includes(days)
      ? currentDays.filter((d) => d !== days)
      : [...currentDays, days];

    setFormData({ ...formData, remindDaysBefore: newDays });
  };

  // Auto-deselect invalid reminder options when event date changes (one-time events only)
  useEffect(() => {
    if (formData.isRecurring) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    setFormData((prev) => {
      if (prev.isRecurring) return prev;

      const validDays = prev.remindDaysBefore.filter((daysBefore) => {
        const notifDate = new Date(prev.eventDate);
        notifDate.setHours(0, 0, 0, 0);
        notifDate.setDate(notifDate.getDate() - daysBefore);
        return notifDate >= today;
      });

      if (validDays.length === prev.remindDaysBefore.length) return prev;
      return { ...prev, remindDaysBefore: validDays };
    });
  }, [formData.eventDate, formData.isRecurring]);

  // Compute minTime for TimePicker: only when a selected reminder fires today (one-time events)
  const getReminderMinTime = () => {
    if (formData.isRecurring) return undefined;

    const now = new Date();
    const todayOnly = new Date(now);
    todayOnly.setHours(0, 0, 0, 0);

    const hasReminderToday = formData.remindDaysBefore.some((daysBefore) => {
      const notifDate = new Date(formData.eventDate);
      notifDate.setHours(0, 0, 0, 0);
      notifDate.setDate(notifDate.getDate() - daysBefore);
      return notifDate.getTime() === todayOnly.getTime();
    });

    if (hasReminderToday) {
      return { hour: now.getHours(), minute: now.getMinutes() };
    }
    return undefined;
  };

  // ── Share modal handlers ──────────────────────────────────────────────────

  const handleShareDone = async (skip: boolean) => {
    if (!skip && selectedConnIds.size > 0 && createdEvent?.serverId) {
      setIsSharing(true);
      try {
        await shareEvent(createdEvent.serverId, Array.from(selectedConnIds));
        showSuccess(`Đã chia sẻ với ${selectedConnIds.size} người!`);
      } catch (e: any) {
        showError(e.message || 'Không thể chia sẻ');
      } finally {
        setIsSharing(false);
      }
    }
    setShowShareModal(false);
    navigation.goBack();
  };

  const toggleConnSelection = (connId: string, canReceive: boolean) => {
    if (!canReceive) return;
    setSelectedConnIds((prev) => {
      const next = new Set(prev);
      if (next.has(connId)) next.delete(connId);
      else next.add(connId);
      return next;
    });
  };

  // ── Form steps for progress indicator ────────────────────────────────────

  const formSteps = [
    { label: "Tên", icon: "text-outline" as const },
    { label: "Nhãn", icon: "pricetag-outline" as const },
    { label: "Thời gian", icon: "calendar-outline" as const },
    { label: "Nhắc nhở", icon: "notifications-outline" as const },
  ];

  return (
    <View style={styles.container}>
      {/* Step Progress Indicator */}
      <View style={styles.stepIndicator}>
        {formSteps.map((step, index) => {
          const isActive = index === currentStep;
          const isDone = index < currentStep;
          return (
            <View key={step.label} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: isActive
                      ? COLORS.primary
                      : isDone
                      ? COLORS.primary + "60"
                      : COLORS.primary + "25",
                  },
                ]}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={14} color={COLORS.white} />
                ) : (
                  <Ionicons
                    name={step.icon}
                    size={14}
                    color={isActive ? COLORS.white : COLORS.primary}
                  />
                )}
              </View>
              <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                {step.label}
              </Text>
              {index < formSteps.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    isDone && { backgroundColor: COLORS.primary + "60" },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        onScroll={(e) => setIsScrolled(e.nativeEvent.contentOffset.y > 10)}
        scrollEventThrottle={16}
      >
        {/* ── Step 0: Tên sự kiện ── */}
        {(currentStep === 0 || isEditMode) && <>
        <View style={styles.sectionDivider}>
          <Ionicons name="text-outline" size={16} color={COLORS.primary} />
          <Text style={styles.sectionDividerText}>Tên sự kiện</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>
            {STRINGS.event_name} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="VD: Sinh nhật vợ"
            placeholderTextColor={`${COLORS.textSecondary}99`}
            value={formData.title}
            onChangeText={(text) => {
              setFormData({ ...formData, title: text });
              setErrors({ ...errors, title: undefined });
            }}
            maxLength={MAX_TITLE_LENGTH}
            autoFocus
          />
          <View style={styles.inputFooter}>
            {errors.title ? (
              <Text style={styles.errorText}>{errors.title}</Text>
            ) : (
              <View />
            )}
            <Text
              style={[
                styles.charCount,
                formData.title.length >= MAX_TITLE_LENGTH &&
                  styles.charCountLimit,
              ]}
            >
              {formData.title.length}/{MAX_TITLE_LENGTH}
            </Text>
          </View>
        </View>
        </>}

        {/* ── Step 1: Nhãn ── */}
        {(currentStep === 1 || isEditMode) && <>
        <View style={styles.sectionDivider}>
          <Ionicons name="pricetag-outline" size={16} color={COLORS.primary} />
          <Text style={styles.sectionDividerText}>Nhãn sự kiện <Text style={styles.optionalLabel}>(Tuỳ chọn)</Text></Text>
        </View>

        {/* Tags Picker */}
        <View style={styles.section}>
          <View style={styles.tagsContainer}>
            {PREDEFINED_TAGS.map((tag) => {
              const isSelected = formData.tags.includes(tag.value);
              return (
                <TouchableOpacity
                  key={tag.value}
                  style={[
                    styles.tagChip,
                    isSelected && { backgroundColor: tag.color, borderColor: tag.color },
                    !isSelected && { borderColor: COLORS.border },
                  ]}
                  onPress={() => {
                    const newTags = isSelected ? [] : [tag.value];
                    setFormData({ ...formData, tags: newTags });
                  }}
                >
                  <IconImage source={getTagImage(tag.value)} size={20} />
                  <Text
                    style={[
                      styles.tagText,
                      { color: isSelected ? COLORS.white : COLORS.textPrimary },
                    ]}
                  >
                    {tag.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.helperText}>
            Chọn một nhãn để phân loại sự kiện — app sẽ gợi ý quà và tạo checklist phù hợp
          </Text>
        </View>
        </>}

        {/* ── Step 2: Thời gian ── */}
        {(currentStep === 2 || isEditMode) && <>
        <View style={styles.sectionDivider}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
          <Text style={styles.sectionDividerText}>Thời gian & Lặp lại</Text>
        </View>

        {/* Recurrence Type Picker */}
        <View style={styles.sectionTab}>
          <Text style={styles.label}>
            Kiểu lặp lại <Text style={styles.required}>*</Text>
          </Text>
          <RecurrenceTypePicker
            value={recurrenceType}
            onChange={(type) => {
              setRecurrenceType(type);
              // Auto set isRecurring based on type
              setFormData({ ...formData, isRecurring: type !== "once" });
            }}
          />
        </View>

        {/* Date Picker - Inline UI for all types */}
        <View style={styles.section}>
          {/* <Text style={styles.label}>
            {recurrenceType === "weekly" && "Chọn thứ trong tuần"}
            {recurrenceType === "monthly" && "Chọn ngày trong tháng"}
            {(recurrenceType === "once" || recurrenceType === "yearly") &&
              STRINGS.event_date}
            <Text style={styles.required}> *</Text>
          </Text> */}

          {/* Weekly: Show day of week picker inline */}
          {recurrenceType === "weekly" && (
            <View style={styles.inlinePickerContainer}>
              <View style={styles.weekGridInline}>
                {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map(
                  (dayShort, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.weekButtonInline,
                        dayOfWeek === index && styles.weekButtonInlineSelected,
                      ]}
                      onPress={() => {
                        setDayOfWeek(index);
                        const newDate = new Date(formData.eventDate);
                        const currentDay = newDate.getDay();
                        const diff = index - currentDay;
                        newDate.setDate(newDate.getDate() + diff);
                        setFormData({ ...formData, eventDate: newDate });
                      }}
                    >
                      <Text
                        style={[
                          styles.weekButtonTextInline,
                          dayOfWeek === index &&
                            styles.weekButtonTextInlineSelected,
                        ]}
                      >
                        {dayShort}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
              <Text style={styles.selectedInfoText}>
                Đã chọn:{" "}
                {
                  [
                    "Chủ nhật",
                    "Thứ 2",
                    "Thứ 3",
                    "Thứ 4",
                    "Thứ 5",
                    "Thứ 6",
                    "Thứ 7",
                  ][dayOfWeek]
                }
              </Text>
            </View>
          )}

          {/* Monthly: Show day of month picker inline */}
          {recurrenceType === "monthly" && (
            <View style={styles.inlinePickerContainer}>
              {/* Row 1: Days 1-7 */}
              <View style={styles.monthlyRowGrid}>
                {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.monthlyDayButton,
                      dayOfMonth === day && styles.monthlyDayButtonSelected,
                    ]}
                    onPress={() => {
                      setDayOfMonth(day);
                      const newDate = new Date(formData.eventDate);
                      newDate.setDate(day);
                      setFormData({ ...formData, eventDate: newDate });
                    }}
                  >
                    <Text
                      style={[
                        styles.monthlyDayButtonText,
                        dayOfMonth === day &&
                          styles.monthlyDayButtonTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Row 2: Days 8-14 */}
              <View style={styles.monthlyRowGrid}>
                {Array.from({ length: 7 }, (_, i) => i + 8).map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.monthlyDayButton,
                      dayOfMonth === day && styles.monthlyDayButtonSelected,
                    ]}
                    onPress={() => {
                      setDayOfMonth(day);
                      const newDate = new Date(formData.eventDate);
                      newDate.setDate(day);
                      setFormData({ ...formData, eventDate: newDate });
                    }}
                  >
                    <Text
                      style={[
                        styles.monthlyDayButtonText,
                        dayOfMonth === day &&
                          styles.monthlyDayButtonTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Row 3: Days 15-21 */}
              <View style={styles.monthlyRowGrid}>
                {Array.from({ length: 7 }, (_, i) => i + 15).map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.monthlyDayButton,
                      dayOfMonth === day && styles.monthlyDayButtonSelected,
                    ]}
                    onPress={() => {
                      setDayOfMonth(day);
                      const newDate = new Date(formData.eventDate);
                      newDate.setDate(day);
                      setFormData({ ...formData, eventDate: newDate });
                    }}
                  >
                    <Text
                      style={[
                        styles.monthlyDayButtonText,
                        dayOfMonth === day &&
                          styles.monthlyDayButtonTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Row 4: Days 22-28 */}
              <View style={styles.monthlyRowGrid}>
                {Array.from({ length: 7 }, (_, i) => i + 22).map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.monthlyDayButton,
                      dayOfMonth === day && styles.monthlyDayButtonSelected,
                    ]}
                    onPress={() => {
                      setDayOfMonth(day);
                      const newDate = new Date(formData.eventDate);
                      newDate.setDate(day);
                      setFormData({ ...formData, eventDate: newDate });
                    }}
                  >
                    <Text
                      style={[
                        styles.monthlyDayButtonText,
                        dayOfMonth === day &&
                          styles.monthlyDayButtonTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Row 5: Days 29-31 */}
              <View style={styles.monthlyRowGrid}>
                {Array.from({ length: 3 }, (_, i) => i + 29).map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.monthlyDayButton,
                      dayOfMonth === day && styles.monthlyDayButtonSelected,
                    ]}
                    onPress={() => {
                      setDayOfMonth(day);
                      const newDate = new Date(formData.eventDate);
                      newDate.setDate(day);
                      setFormData({ ...formData, eventDate: newDate });
                    }}
                  >
                    <Text
                      style={[
                        styles.monthlyDayButtonText,
                        dayOfMonth === day &&
                          styles.monthlyDayButtonTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
                {/* Empty placeholders for alignment */}
                {Array.from({ length: 4 }).map((_, i) => (
                  <View
                    key={`empty-${i}`}
                    style={styles.monthlyDayButtonEmpty}
                  />
                ))}
              </View>

              <Text style={styles.selectedInfoText}>
                Sự kiện sẽ lặp lại vào ngày {dayOfMonth} hàng tháng
              </Text>
            </View>
          )}

          {/* Once/Yearly: Show calendar inline */}
          {(recurrenceType === "once" || recurrenceType === "yearly") && (
            <View style={styles.inlinePickerContainer}>
              <View style={styles.calendarCard}>
                <Calendar
                  current={DateUtils.toLocalDateString(formData.eventDate)}
                  onDayPress={(day: DateData) => {
                    // Use dateString to avoid timezone issues
                    const [year, month, date] = day.dateString
                      .split("-")
                      .map(Number);
                    const selectedDate = new Date(
                      year,
                      month - 1,
                      date,
                      12,
                      0,
                      0,
                      0
                    );
                    setFormData({ ...formData, eventDate: selectedDate });
                  }}
                  markedDates={{
                    [DateUtils.toLocalDateString(formData.eventDate)]: {
                      selected: true,
                      selectedColor: COLORS.primary,
                    },
                  }}
                  theme={{
                    backgroundColor: "transparent",
                    calendarBackground: "transparent",
                    textSectionTitleColor: COLORS.textSecondary,
                    selectedDayBackgroundColor: COLORS.primary,
                    selectedDayTextColor: COLORS.white,
                    todayTextColor: COLORS.primary,
                    dayTextColor: COLORS.textPrimary,
                    textDisabledColor: COLORS.textLight,
                    dotColor: COLORS.primary,
                    selectedDotColor: COLORS.white,
                    arrowColor: COLORS.primary,
                    monthTextColor: COLORS.textPrimary,
                    indicatorColor: COLORS.primary,
                    textDayFontFamily: "System",
                    textMonthFontFamily: "System",
                    textDayHeaderFontFamily: "System",
                    textDayFontWeight: "400",
                    textMonthFontWeight: "600",
                    textDayHeaderFontWeight: "500",
                    textDayFontSize: 15,
                    textMonthFontSize: 17,
                    textDayHeaderFontSize: 13,
                  }}
                  enableSwipeMonths={true}
                  hideExtraDays={false}
                  firstDay={1}
                  renderArrow={(direction: string) => (
                    <Ionicons
                      name={
                        direction === "left"
                          ? "chevron-back"
                          : "chevron-forward"
                      }
                      size={24}
                      color={COLORS.primary}
                    />
                  )}
                />
              </View>
              <Text style={styles.selectedInfoText}>
                Đã chọn:{" "}
                {formData.eventDate.toLocaleDateString("vi-VN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
          )}

          {/* Lunar calendar toggle - only for 'once' and 'yearly' */}
          {(recurrenceType === "once" || recurrenceType === "yearly") && (
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                {STRINGS.event_lunar_calendar}
              </Text>
              <Switch
                value={formData.isLunarCalendar}
                onValueChange={(value) =>
                  setFormData({ ...formData, isLunarCalendar: value })
                }
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={
                  formData.isLunarCalendar ? COLORS.primary : COLORS.surface
                }
              />
            </View>
          )}
        </View>

        </>}

        {/* ── Step 3: Nhắc nhở ── */}
        {(currentStep === 3 || isEditMode) && <>
        <View style={styles.sectionDivider}>
          <Ionicons
            name="notifications-outline"
            size={16}
            color={COLORS.primary}
          />
          <Text style={styles.sectionDividerText}>Nhắc nhở <Text style={styles.optionalLabel}>(Tuỳ chọn)</Text></Text>
        </View>

        {/* Reminders */}
        <ReminderSettings
          selectedDays={formData.remindDaysBefore}
          onToggle={toggleReminderDay}
          eventDate={formData.eventDate}
          isRecurring={formData.isRecurring}
        />

        {/* Reminder Time */}
        <TimePicker
          selectedTime={formData.reminderTime || { hour: 9, minute: 0 }}
          onTimeChange={(time) =>
            setFormData({ ...formData, reminderTime: time })
          }
          minTime={getReminderMinTime()}
        />

        </>}

      </ScrollView>

      {/* Footer: Tiếp theo (create step 0-2) hoặc Lưu (step 3 hoặc edit mode) */}
      <View style={[styles.footer, isScrolled && styles.footerShadow]}>
        {currentStep < 3 && !isEditMode ? (
          <TouchableOpacity style={styles.submitButton} onPress={handleNext} activeOpacity={0.85}>
            <LinearGradient
              colors={[COLORS.primary, "#C850C0"]}
              style={styles.submitBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.submitButtonText}>Tiếp theo</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.white} style={{ marginLeft: 6 }} />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[COLORS.primary, "#C850C0"]}
              style={styles.submitBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "Đang lưu..." : isEditMode ? "Cập nhật" : STRINGS.save}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Share with connections modal ──────────────────────────────────── */}
      <Modal
        visible={showShareModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => handleShareDone(true)}
      >
        <View style={[styles.shareModalContainer, { paddingTop: insets.top }]}>
          <View style={styles.shareModalHeader}>
            <View>
              <Text style={styles.shareModalTitle}>Chia sẻ sự kiện</Text>
              <Text style={styles.shareModalSub}>
                {createdEvent?.title}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleShareDone(true)} style={styles.shareModalCloseBtn}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {isLoadingConnections || isSyncingForShare ? (
            <View style={styles.shareModalLoading}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.shareModalLoadingText}>
                {isSyncingForShare ? 'Đang đồng bộ sự kiện...' : 'Đang tải danh sách kết nối...'}
              </Text>
            </View>
          ) : connections.length === 0 ? (
            <View style={styles.shareModalEmpty}>
              <Ionicons name="people-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.shareModalEmptyTitle}>Chưa có kết nối</Text>
              <Text style={styles.shareModalEmptySub}>
                Thêm kết nối với người thân để có thể chia sẻ sự kiện sau này
              </Text>
            </View>
          ) : !createdEvent?.serverId ? (
            <View style={styles.shareModalEmpty}>
              <Ionicons name="cloud-offline-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.shareModalEmptyTitle}>Không đồng bộ được</Text>
              <Text style={styles.shareModalEmptySub}>
                Kiểm tra kết nối internet và thử lại. Bạn vẫn có thể chia sẻ sau từ chi tiết sự kiện.
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.shareModalList} contentContainerStyle={{ padding: 16, gap: 10 }}>
              <Text style={styles.shareModalHint}>
                Chọn những người bạn muốn chia sẻ "{createdEvent?.title}". Họ sẽ nhận được thông báo và có thể thêm vào lịch của mình.
              </Text>
              {connections.map(({ connection, partner, canReceive }) => {
                const isSelected = selectedConnIds.has(connection.id);
                return (
                  <TouchableOpacity
                    key={connection.id}
                    style={[
                      styles.shareConnCard,
                      isSelected && styles.shareConnCardSelected,
                      !canReceive && styles.shareConnCardDisabled,
                    ]}
                    onPress={() => toggleConnSelection(connection.id, canReceive)}
                    activeOpacity={canReceive ? 0.7 : 1}
                  >
                    <View style={[
                      styles.shareConnAvatar,
                      { backgroundColor: ['#FF6B6B','#4ECDC4','#845EF7','#339AF0'][partner.id.charCodeAt(0) % 4] },
                    ]}>
                      {partner.photoUrl ? (
                        <Image source={{ uri: partner.photoUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                      ) : (
                        <Text style={styles.shareConnAvatarText}>
                          {(partner.displayName || partner.email || '?')[0].toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.shareConnName, !canReceive && { color: COLORS.textLight }]}>
                        {partner.displayName || 'Người dùng'}
                      </Text>
                      <Text style={styles.shareConnEmail} numberOfLines={1}>{partner.email}</Text>
                      {!canReceive && (
                        <Text style={styles.shareConnFull}>Hết lượt nhận</Text>
                      )}
                    </View>
                    {canReceive && (
                      <View style={[
                        styles.shareConnCheck,
                        isSelected && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
                      ]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.shareModalFooter}>
            <TouchableOpacity
              style={styles.shareModalSkipBtn}
              onPress={() => handleShareDone(true)}
            >
              <Text style={styles.shareModalSkipText}>Bỏ qua</Text>
            </TouchableOpacity>
            {connections.length > 0 && !isSyncingForShare && createdEvent?.serverId && (
              <TouchableOpacity
                style={[
                  styles.shareModalSendBtn,
                  (selectedConnIds.size === 0 || isSharing) && styles.shareModalSendBtnDisabled,
                ]}
                onPress={() => handleShareDone(false)}
                disabled={selectedConnIds.size === 0 || isSharing}
              >
                {isSharing ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="share-outline" size={18} color={COLORS.white} />
                    <Text style={styles.shareModalSendText}>
                      Chia sẻ{selectedConnIds.size > 0 ? ` (${selectedConnIds.size})` : ''}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTab: {
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  required: {
    color: COLORS.error,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  optionalLabel: {
    fontSize: 12,
    fontWeight: "400",
    color: COLORS.textSecondary,
  },
  inlinePickerContainer: {
    marginTop: 12,
    width: "100%",
    alignItems: "center",
  },
  calendarCard: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  weekGridInline: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
  },
  weekButtonInline: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  weekButtonInlineSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  weekButtonTextInline: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  weekButtonTextInlineSelected: {
    color: COLORS.white,
    fontWeight: "700",
  },
  monthlyRowGrid: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  monthlyDayButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  monthlyDayButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  monthlyDayButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  monthlyDayButtonTextSelected: {
    color: COLORS.white,
    fontWeight: "700",
  },
  monthlyDayButtonEmpty: {
    flex: 1,
  },
  selectedInfoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.primaryLight + "15",
    borderRadius: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: COLORS.surface,
    gap: 6,
  },
  tagEmoji: {
    fontSize: 18,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "600",
  },
  helperText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
    fontStyle: "italic",
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  stepLabelActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  stepLine: {
    width: 20,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 6,
  },
  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionDividerText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
  },
  footerShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  inputFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  charCountLimit: {
    color: COLORS.error,
  },
  // ── Share modal styles ──────────────────────────────────────────────────────
  shareModalContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  shareModalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  shareModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  shareModalSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  shareModalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  shareModalLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  shareModalLoadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  shareModalEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  shareModalEmptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  shareModalEmptySub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  shareModalList: {
    flex: 1,
  },
  shareModalHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  shareConnCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 12,
  },
  shareConnCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "08",
  },
  shareConnCardDisabled: {
    opacity: 0.5,
  },
  shareConnAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  shareConnAvatarText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  shareConnName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  shareConnEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  shareConnFull: {
    fontSize: 11,
    color: COLORS.error,
    marginTop: 2,
    fontWeight: "500",
  },
  shareConnCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  shareModalFooter: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  shareModalSkipBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  shareModalSkipText: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  shareModalSendBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
  },
  shareModalSendBtnDisabled: {
    backgroundColor: COLORS.textLight,
  },
  shareModalSendText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.white,
  },
});

export default AddEventScreen;
