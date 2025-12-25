import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEvents } from "../store/EventsContext";
import { useToast } from "../contexts/ToastContext";
import {
  EventCategory,
  RelationshipType,
  EventFormData,
  RecurrenceType,
} from "../types";
import { COLORS } from "../constants/colors";
import { STRINGS } from "../constants/strings";
import { ValidationUtils } from "../utils/validation.utils";
import CategoryPicker from "../components/CategoryPicker";
import RelationshipPicker from "../components/RelationshipPicker";
import ReminderSettings from "../components/ReminderSettings";
import TimePicker from "../components/TimePicker";
import RecurrenceTypePicker from "../components/RecurrenceTypePicker";

const AddEventScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { addEvent, updateEvent, getEventById } = useEvents();
  const { showSuccess, showError } = useToast();

  // Check if this is Edit mode
  const eventId = route.params?.eventId;
  const isEditMode = !!eventId;
  const existingEvent = isEditMode ? getEventById(eventId) : undefined;

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    eventDate: new Date(),
    isLunarCalendar: false,
    category: "anniversary" as EventCategory,
    relationshipType: "wife" as RelationshipType,
    remindDaysBefore: [1, 7],
    reminderTime: { hour: 10, minute: 0 },
    giftIdeas: [],
    isRecurring: true, // Default yearly recurring
  });

  const [recurrenceType, setRecurrenceType] =
    useState<RecurrenceType>("yearly");
  const [dayOfWeek, setDayOfWeek] = useState<number>(new Date().getDay());
  const [dayOfMonth, setDayOfMonth] = useState<number>(new Date().getDate());

  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing event data when in Edit mode
  useEffect(() => {
    if (isEditMode && existingEvent) {
      const eventDate = new Date(existingEvent.eventDate);

      setFormData({
        title: existingEvent.title,
        eventDate,
        isLunarCalendar: existingEvent.isLunarCalendar,
        category: existingEvent.category,
        relationshipType: existingEvent.relationshipType,
        remindDaysBefore: existingEvent.reminderSettings.remindDaysBefore,
        reminderTime: existingEvent.reminderSettings.reminderTime || { hour: 10, minute: 0 },
        giftIdeas: existingEvent.giftIdeas,
        isRecurring: existingEvent.isRecurring,
        recurrencePattern: existingEvent.recurrencePattern,
      });

      // Set recurrence type based on existing pattern
      if (existingEvent.recurrencePattern) {
        setRecurrenceType(existingEvent.recurrencePattern.type);

        if (existingEvent.recurrencePattern.type === 'weekly' && existingEvent.recurrencePattern.dayOfWeek !== undefined) {
          setDayOfWeek(existingEvent.recurrencePattern.dayOfWeek);
        } else if (existingEvent.recurrencePattern.type === 'monthly' && existingEvent.recurrencePattern.dayOfMonth !== undefined) {
          setDayOfMonth(existingEvent.recurrencePattern.dayOfMonth);
        }
      } else if (!existingEvent.isRecurring) {
        setRecurrenceType('once');
      }
    }
  }, [isEditMode, eventId]);

  const handleSubmit = async () => {
    // Validate
    const validationErrors = ValidationUtils.validateEventForm(formData);
    if (ValidationUtils.hasErrors(validationErrors)) {
      setErrors(validationErrors);
      Alert.alert("Lỗi", "Vui lòng kiểm tra lại thông tin");
      return;
    }

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
        await addEvent({ ...formData, recurrencePattern });
        showSuccess(`✨ Đã thêm sự kiện "${formData.title}" thành công!`);
      }

      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error: any) {
      showError(error.message || (isEditMode ? "Không thể cập nhật sự kiện" : "Không thể thêm sự kiện"));
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>
            {STRINGS.event_name} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="VD: Sinh nhật vợ"
            value={formData.title}
            onChangeText={(text) => {
              setFormData({ ...formData, title: text });
              setErrors({ ...errors, title: undefined });
            }}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
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
                  current={formData.eventDate.toISOString().split("T")[0]}
                  onDayPress={(day: DateData) => {
                    const selectedDate = new Date(day.timestamp);
                    setFormData({ ...formData, eventDate: selectedDate });
                  }}
                  markedDates={{
                    [formData.eventDate.toISOString().split("T")[0]]: {
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

        {/* Reminders */}
        <ReminderSettings
          selectedDays={formData.remindDaysBefore}
          onToggle={toggleReminderDay}
        />

        {/* Reminder Time */}
        <TimePicker
          selectedTime={formData.reminderTime || { hour: 10, minute: 0 }}
          onTimeChange={(time) =>
            setFormData({ ...formData, reminderTime: time })
          }
        />

        {/* Category */}
        <CategoryPicker
          selectedCategory={formData.category}
          onSelect={(category) => setFormData({ ...formData, category })}
        />

        {/* Relationship */}
        <RelationshipPicker
          selectedRelationship={formData.relationshipType}
          onSelect={(relationship) =>
            setFormData({ ...formData, relationshipType: relationship })
          }
        />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? "Đang lưu..." : (isEditMode ? "Cập nhật" : STRINGS.save)}
          </Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
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
});

export default AddEventScreen;
