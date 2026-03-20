import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Switch,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar, DateData } from "react-native-calendars";
import { COLORS } from "@themes/colors";
import { EventFormData } from "../../types";
import { HolidaySuggestion } from "@constants/holidaySuggestions";

const GRADIENT_PRIMARY: [string, string] = ["#FF6B9D", "#FF8E53"];

interface Props {
  suggestion: HolidaySuggestion;
  onComplete: () => void;
  onSkip: () => void;
  addEvent?: (formData: EventFormData) => Promise<any>;
}

const getDaysUntil = (month: number, day: number): number => {
  const today = new Date();
  const thisYear = today.getFullYear();
  let next = new Date(thisYear, month, day);
  if (next <= today) next = new Date(thisYear + 1, month, day);
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const HolidaySuggestionOverlay: React.FC<Props> = ({
  suggestion,
  onComplete,
  onSkip,
  addEvent,
}) => {
  const [step, setStep] = useState(0); // 0: input, 1: confirmation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [name, setName] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateSelected, setDateSelected] = useState(false);
  const [isLunar, setIsLunar] = useState(suggestion.isLunar ?? false);
  const [daysUntil, setDaysUntil] = useState(0);
  const [savedName, setSavedName] = useState("");

  const goToStep = (next: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setStep(next);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleSave = async () => {
    const displayName = name.trim() || suggestion.defaultTitle;
    setSavedName(displayName);
    const days = getDaysUntil(selectedDate.getMonth(), selectedDate.getDate());
    setDaysUntil(days);
    goToStep(1);

    if (addEvent) {
      const today = new Date();
      const thisYear = today.getFullYear();
      let eventDate = new Date(thisYear, selectedDate.getMonth(), selectedDate.getDate());
      if (eventDate <= today) {
        eventDate = new Date(thisYear + 1, selectedDate.getMonth(), selectedDate.getDate());
      }
      addEvent({
        title: displayName,
        eventDate,
        isLunarCalendar: isLunar,
        tags: [suggestion.tag],
        remindDaysBefore: [0, 1, 7],
        reminderTime: { hour: 9, minute: 0 },
        isRecurring: suggestion.tag !== "memorial",
        recurrencePattern:
          suggestion.tag !== "memorial"
            ? {
                type: "yearly",
                month: selectedDate.getMonth() + 1,
                day: selectedDate.getDate(),
              }
            : undefined,
      }).catch((e: unknown) => console.warn("HolidaySuggestion: failed to create event", e));
    }
  };

  const displayLabel = name.trim() || suggestion.defaultTitle;

  return (
    <View style={styles.overlay}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Để sau</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.stepContainer,
          { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
        ]}
      >
        {/* ── STEP 0: INPUT ── */}
        {step === 0 && (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
            >
              <Image
                source={suggestion.image}
                style={styles.holidayIcon}
                resizeMode="contain"
              />
              <Text style={styles.question}>{suggestion.question}</Text>

              {/* Name input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tên gọi</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={`Ví dụ: ${suggestion.defaultTitle}...`}
                  placeholderTextColor={COLORS.textSecondary + "80"}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="done"
                  maxLength={30}
                />
              </View>

              {/* Lunar toggle — chỉ hiện khi suggestion.isLunar */}
              {suggestion.isLunar && (
                <View style={styles.lunarRow}>
                  <Ionicons name="moon-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.lunarLabel}>Ngày âm lịch</Text>
                  <Switch
                    value={isLunar}
                    onValueChange={setIsLunar}
                    trackColor={{ false: COLORS.border, true: COLORS.primary + "60" }}
                    thumbColor={isLunar ? COLORS.primary : COLORS.textLight}
                  />
                </View>
              )}

              {/* Date label */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {isLunar ? "Ngày âm lịch" : "Chọn ngày"}
                </Text>
              </View>

              <View style={styles.calendarCard}>
                <Calendar
                  current={selectedDate.toISOString().split("T")[0]}
                  monthFormat="MMMM"
                  onDayPress={(day: DateData) => {
                    const [year, month, date] = day.dateString.split("-").map(Number);
                    setSelectedDate(new Date(year, month - 1, date, 12, 0, 0, 0));
                    setDateSelected(true);
                  }}
                  markedDates={{
                    [selectedDate.toISOString().split("T")[0]]: dateSelected
                      ? { selected: true, selectedColor: COLORS.primary }
                      : {},
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
                    arrowColor: COLORS.primary,
                    monthTextColor: COLORS.textPrimary,
                    textDayFontSize: 15,
                    textMonthFontSize: 17,
                    textDayHeaderFontSize: 13,
                  }}
                  enableSwipeMonths={true}
                  hideExtraDays={false}
                  firstDay={1}
                  renderArrow={(direction: string) => (
                    <Ionicons
                      name={direction === "left" ? "chevron-back" : "chevron-forward"}
                      size={24}
                      color={COLORS.primary}
                    />
                  )}
                />
              </View>
            </ScrollView>

            <View style={styles.bottomArea}>
              <TouchableOpacity
                style={[styles.primaryBtn, !dateSelected && styles.primaryBtnDisabled]}
                onPress={handleSave}
                disabled={!dateSelected}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={dateSelected ? GRADIENT_PRIMARY : ["#ccc", "#aaa"]}
                  style={styles.primaryBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="heart" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Lưu lại</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}

        {/* ── STEP 1: CONFIRMATION ── */}
        {step === 1 && (
          <View style={styles.flex}>
            <View style={styles.centerContent}>
              <Text style={styles.confirmTitle}>Đã lưu rồi! 🎉</Text>

              <View style={styles.countdownCard}>
                <Text style={styles.countdownNumber}>{daysUntil}</Text>
                <Text style={styles.countdownLabel}>ngày nữa thôi</Text>
              </View>

              <View style={styles.confirmCard}>
                <Text style={styles.confirmMain}>
                  <Text style={styles.confirmHighlight}>{savedName}</Text>
                  {" "}đã được lưu vào lịch
                </Text>
                <Text style={styles.confirmSub}>
                  Bạn sẽ được nhắc trước{" "}
                  <Text style={styles.confirmHighlight}>7 ngày</Text>,{" "}
                  <Text style={styles.confirmHighlight}>1 ngày</Text> và{" "}
                  <Text style={styles.confirmHighlight}>đúng ngày</Text>
                </Text>
              </View>
            </View>

            <View style={styles.bottomArea}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={onComplete}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={GRADIENT_PRIMARY}
                  style={styles.primaryBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.primaryBtnText}>Tuyệt vời!</Text>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    zIndex: 9998,
    elevation: 9998,
  },
  flex: { flex: 1 },
  header: {
    paddingTop: 52,
    paddingHorizontal: 24,
    alignItems: "flex-end",
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: COLORS.border + "80",
  },
  skipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  stepContainer: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    alignItems: "center",
  },
  holidayIcon: {
    width: 96,
    height: 96,
    marginBottom: 16,
    marginTop: 4,
  },
  question: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    lineHeight: 28,
    marginBottom: 20,
  },
  inputGroup: {
    width: "100%",
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lunarRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginTop: 16,
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lunarLabel: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  calendarCard: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  countdownCard: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 4,
  },
  countdownNumber: {
    fontSize: 72,
    fontWeight: "800",
    color: COLORS.primary,
    lineHeight: 80,
  },
  countdownLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginTop: 2,
  },
  confirmCard: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.primary + "20",
    gap: 10,
  },
  confirmMain: {
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlign: "center",
    lineHeight: 22,
  },
  confirmHighlight: {
    fontWeight: "700",
    color: COLORS.primary,
  },
  confirmSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 21,
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 12,
  },
  primaryBtn: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#FF6B9D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryBtnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});

export default HolidaySuggestionOverlay;
