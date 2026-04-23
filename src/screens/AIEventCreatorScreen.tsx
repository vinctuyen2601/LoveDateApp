import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEvents } from "@contexts/EventsContext";
import { useToast } from "../contexts/ToastContext";
import { useColors } from "@contexts/ThemeContext";
import { makeStyles } from "@utils/makeStyles";
import { getTagColor, getTagImage, getTagLabel } from "../types";
import type { Event } from "../types";
import type { ConnectionWithQuota } from "../types/connections";
import {
  getConnectionsWithQuota,
  shareEvent,
} from "../services/connections.service";
import * as DB from "../services/database.service";
import { useSQLiteContext } from "expo-sqlite";
import {
  ParsedEvent,
  EMPTY_PARSED,
  parseVietnamese,
  parseWithAI,
  isComplete,
  getNextQuestion,
  buildTitle,
  buildFormData,
} from "../services/aiEventNlu.service";
import AiIcon from "@components/atoms/AiIcon";
import IconImage from "@components/atoms/IconImage";
import * as Recorder from "../services/recorder.service";
import { transcribe } from "../services/stt.service";
import * as Feedback from "../services/feedback.service";

// ─── Types ────────────────────────────────────────────────────────────────────

type ScreenState =
  | "IDLE"
  | "RECORDING"
  | "PROCESSING"
  | "ASKING"
  | "CONFIRM"
  | "SHARE"
  | "SUCCESS";

// ─── Constants ────────────────────────────────────────────────────────────────

const QUICK_CHIPS = [
  { tag: "birthday", label: "Sinh nhật vợ/chồng", prompt: "Sinh nhật vợ" },
  {
    tag: "anniversary",
    label: "Kỷ niệm ngày cưới",
    prompt: "Kỷ niệm ngày cưới",
  },
  { tag: "memorial", label: "Ngày giỗ ông bà", prompt: "Ngày giỗ ông nội" },
  { tag: "other", label: "Sự kiện quan trọng", prompt: "Sự kiện quan trọng" },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

const AIEventCreatorScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const colors = useColors();
  const styles = useStyles();
  const { addEvent } = useEvents();
  const { showError, showSuccess } = useToast();

  // ── State ──
  const [screenState, setScreenState] = useState<ScreenState>("IDLE");
  const [inputText, setInputText] = useState("");
  const [parsedEvent, setParsedEvent] = useState<ParsedEvent>(EMPTY_PARSED);
  const [isSaving, setIsSaving] = useState(false);

  // Share state
  const [createdEvent, setCreatedEvent] = useState<Event | null>(null);
  const [connections, setConnections] = useState<ConnectionWithQuota[]>([]);
  const [selectedConnIds, setSelectedConnIds] = useState<Set<string>>(
    new Set()
  );
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isSyncingForShare, setIsSyncingForShare] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Derived tag color — follows event type, used in CONFIRM card + save button
  const confirmTagColor = getTagColor(parsedEvent.eventType ?? "other");

  // ── Refs ──
  const inputRef = useRef<TextInput>(null);
  const isRecordingRef = useRef(false);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref để đọc parsedEvent mới nhất trong callbacks (tránh stale closure)
  const parsedEventRef = useRef<ParsedEvent>(EMPTY_PARSED);
  useEffect(() => {
    parsedEventRef.current = parsedEvent;
  }, [parsedEvent]);

  // ── Animations ──
  const waveAnims = useRef(
    [0.3, 0.6, 0.9, 1.0, 0.8, 0.55, 0.3].map((v) => new Animated.Value(v))
  ).current;
  const ringAnims = useRef(
    [0, 1].map(() => ({
      scale: new Animated.Value(1),
      opacity: new Animated.Value(0.5),
    }))
  ).current;
  const recDotAnim = useRef(new Animated.Value(1)).current;
  const recMicScale = useRef(new Animated.Value(1)).current;
  const [recSeconds, setRecSeconds] = useState(0);
  const recIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Hero icon effects (IDLE state)
  const heroGlowAnims = useRef(
    [0, 1].map(() => ({
      scale: new Animated.Value(1),
      opacity: new Animated.Value(0.35),
    }))
  ).current;
  const heroSpinAnim = useRef(new Animated.Value(0)).current;
  const heroBreathAnim = useRef(new Animated.Value(1)).current;

  // Waveform
  useEffect(() => {
    if (screenState !== "RECORDING") return;
    const peaks = [0.5, 0.8, 1.0, 1.0, 0.85, 0.65, 0.4];
    const upMs = [190, 160, 220, 130, 200, 170, 240];
    const downMs = [210, 280, 170, 250, 190, 230, 180];
    const loops = waveAnims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: peaks[i],
            duration: upMs[i],
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.15,
            duration: downMs[i],
            useNativeDriver: true,
          }),
        ])
      )
    );
    const combined = Animated.parallel(loops);
    combined.start();
    return () => combined.stop();
  }, [screenState]);

  // Ripple rings
  useEffect(() => {
    if (screenState !== "RECORDING") return;
    const loops = ringAnims.map((ring, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 600),
          Animated.parallel([
            Animated.timing(ring.scale, {
              toValue: 2.2,
              duration: 1400,
              useNativeDriver: true,
            }),
            Animated.timing(ring.opacity, {
              toValue: 0,
              duration: 1400,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(ring.scale, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(ring.opacity, {
              toValue: 0.5,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      )
    );
    const combined = Animated.parallel(loops);
    combined.start();
    return () => combined.stop();
  }, [screenState]);

  // Blinking record dot
  useEffect(() => {
    if (screenState !== "RECORDING") {
      recDotAnim.setValue(1);
      return;
    }
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(recDotAnim, {
          toValue: 0.15,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(recDotAnim, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, [screenState]);

  // Mic breathe
  useEffect(() => {
    if (screenState !== "RECORDING") {
      recMicScale.setValue(1);
      return;
    }
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(recMicScale, {
          toValue: 1.1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(recMicScale, {
          toValue: 1.0,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    breathe.start();
    return () => breathe.stop();
  }, [screenState]);

  // Recording timer
  useEffect(() => {
    if (screenState !== "RECORDING") {
      setRecSeconds(0);
      if (recIntervalRef.current) {
        clearInterval(recIntervalRef.current);
        recIntervalRef.current = null;
      }
      return;
    }
    setRecSeconds(0);
    recIntervalRef.current = setInterval(
      () => setRecSeconds((s) => s + 1),
      1000
    );
    return () => {
      if (recIntervalRef.current) {
        clearInterval(recIntervalRef.current);
        recIntervalRef.current = null;
      }
    };
  }, [screenState]);

  // ── Hero icon effects (IDLE) ─────────────────────────────────────────────

  // Glow rings — expand + fade, 2 rings staggered 900 ms apart
  useEffect(() => {
    if (screenState !== "IDLE") {
      heroGlowAnims.forEach((r) => {
        r.scale.setValue(1);
        r.opacity.setValue(0.35);
      });
      return;
    }
    const loops = heroGlowAnims.map((ring, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 900),
          Animated.parallel([
            Animated.timing(ring.scale, {
              toValue: 1.7,
              duration: 1800,
              useNativeDriver: true,
            }),
            Animated.timing(ring.opacity, {
              toValue: 0,
              duration: 1800,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(ring.scale, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(ring.opacity, {
              toValue: 0.35,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      )
    );
    const combined = Animated.parallel(loops);
    combined.start();
    return () => combined.stop();
  }, [screenState]);

  // Sparkle slow rotation — one full turn every 18 s
  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(heroSpinAnim, {
        toValue: 1,
        duration: 18000,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, []);

  // Icon breathe — gentle scale 1.0 → 1.06 → 1.0 (IDLE only)
  useEffect(() => {
    if (screenState !== "IDLE") {
      heroBreathAnim.setValue(1);
      return;
    }
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(heroBreathAnim, {
          toValue: 1.07,
          duration: 1700,
          useNativeDriver: true,
        }),
        Animated.timing(heroBreathAnim, {
          toValue: 1.0,
          duration: 1700,
          useNativeDriver: true,
        }),
      ])
    );
    breathe.start();
    return () => breathe.stop();
  }, [screenState]);

  // ── Input logic ──

  const handleTextSubmit = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText("");
    setScreenState("PROCESSING");
    const base = screenState === "ASKING" ? parsedEvent : EMPTY_PARSED;
    const parsed = await parseWithAI(text, base);
    setParsedEvent(parsed);
    if (isComplete(parsed)) {
      Feedback.transition();
      setScreenState("CONFIRM");
    } else {
      setScreenState("ASKING");
    }
  }, [inputText, screenState, parsedEvent]);

  const handleChipPress = useCallback((prompt: string) => {
    Feedback.select();
    setScreenState("PROCESSING");
    setTimeout(() => {
      const parsed = parseVietnamese(prompt, EMPTY_PARSED);
      setParsedEvent(parsed);
      if (isComplete(parsed)) {
        Feedback.transition();
        setScreenState("CONFIRM");
      } else {
        setScreenState("ASKING");
      }
    }, 400);
  }, []);

  // ── Mock voice recording ──
  // ── Voice recording (expo-av + STT) ──────────────────────────────────────

  const stopRecording = useCallback(async () => {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setScreenState("PROCESSING");
    try {
      const uri = await Recorder.stopRecording();
      Feedback.recordStop();
      console.log('[STT] uri:', uri);
      if (!uri) throw new Error("no audio");
      const text = await transcribe(uri);
      console.log('[STT] text:', text);
      if (!text.trim()) throw new Error("empty transcript");
      // Luôn merge với parsedEvent hiện tại qua ref
      // (nếu đang ở IDLE thì parsedEventRef = EMPTY_PARSED → tương đương fresh parse)
      const parsed = await parseWithAI(text, parsedEventRef.current);
      setParsedEvent(parsed);
      if (isComplete(parsed)) {
        Feedback.transition();
        setScreenState("CONFIRM");
      } else {
        setScreenState("ASKING");
      }
    } catch (e) {
      console.error('[STT] error:', e);
      Feedback.error();
      showError("Tôi chưa nghe rõ. Bạn thử nhập chữ nhé!");
      setScreenState("IDLE");
    }
  }, [showError]);

  const handleMicPressIn = useCallback(async () => {
    const granted = await Recorder.requestPermission();
    if (!granted) {
      showError("Cần quyền truy cập micro để ghi âm.");
      return;
    }
    try {
      await Recorder.startRecording();
      isRecordingRef.current = true;
      Feedback.recordStart();
      setScreenState("RECORDING");
      // Auto-stop after 8 s
      recordingTimerRef.current = setTimeout(() => stopRecording(), 8000);
    } catch (e) {
      showError(
        e instanceof Error
          ? e.message
          : "Không thể bắt đầu ghi âm. Thử lại nhé test 1!"
      );
    }
  }, [stopRecording, showError]);

  const handleMicPressOut = useCallback(() => {
    stopRecording();
  }, [stopRecording]);

  const handleSave = useCallback(async () => {
    if (!isComplete(parsedEvent)) return;
    setIsSaving(true);
    try {
      const newEvent = await addEvent(buildFormData(parsedEvent));
      Feedback.success();
      setCreatedEvent(newEvent);
      setSelectedConnIds(new Set());
      setIsLoadingConnections(true);
      setIsSyncingForShare(true);
      setScreenState("SHARE");

      // Load connections — skip SHARE if none
      getConnectionsWithQuota()
        .then((conns) => {
          setConnections(conns);
          if (conns.length === 0) setScreenState("SUCCESS");
        })
        .catch(() => {
          setConnections([]);
          setScreenState("SUCCESS");
        })
        .finally(() => setIsLoadingConnections(false));

      // Poll for serverId (needed before sharing)
      const waitForServerId = async () => {
        for (let i = 0; i < 15; i++) {
          await new Promise((r) => setTimeout(r, 600));
          const fresh = await DB.getEventById(db, newEvent.id);
          if (fresh?.serverId) {
            setCreatedEvent((prev) =>
              prev ? { ...prev, serverId: fresh.serverId } : prev
            );
            return;
          }
        }
      };
      waitForServerId().finally(() => setIsSyncingForShare(false));
    } catch {
      Feedback.error();
      showError("Không thể lưu. Thử lại nhé!");
    } finally {
      setIsSaving(false);
    }
  }, [parsedEvent, addEvent, db, showError]);

  const handleShare = useCallback(async () => {
    if (!createdEvent?.serverId || selectedConnIds.size === 0) return;
    setIsSharing(true);
    try {
      await shareEvent(createdEvent.serverId, [...selectedConnIds]);
      Feedback.success();
      showSuccess("Đã chia sẻ thành công!");
    } catch {
      Feedback.error();
      showError("Không thể chia sẻ, thử lại sau");
    } finally {
      setIsSharing(false);
      setScreenState("SUCCESS");
    }
  }, [createdEvent, selectedConnIds, showSuccess, showError]);

  const handleReset = useCallback(() => {
    setParsedEvent(EMPTY_PARSED);
    setInputText("");
    setScreenState("IDLE");
  }, []);

  const handleGoManual = useCallback(
    () => {
      const current = parsedEventRef.current;
      const hasData = current.eventType || current.day || current.month || current.personName;
      navigation.navigate("AddEvent", hasData ? { prefill: buildFormData(current) } : undefined);
    },
    [navigation]
  );

  // ─── Render helpers ────────────────────────────────────────────────────────

  const renderIdle = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.idleRoot}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        {/* Icon wrapper — rings overflow visually, don't affect layout */}
        <View style={styles.heroIconWrap}>
          {/* Pulsing glow rings */}
          {heroGlowAnims.map((ring, i) => (
            <Animated.View
              key={i}
              style={[
                styles.heroRing,
                { borderColor: colors.aiPrimary },
                { transform: [{ scale: ring.scale }], opacity: ring.opacity },
              ]}
            />
          ))}

          {/* Gradient circle — breathes */}
          <Animated.View style={{ transform: [{ scale: heroBreathAnim }] }}>
            <LinearGradient
              colors={[colors.aiPrimary, colors.aiSecondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroIcon}
            >
              {/* Sparkle rotates slowly */}
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: heroSpinAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                      }),
                    },
                  ],
                }}
              >
                <AiIcon
                  size={42}
                  primaryColor={colors.aiPrimary}
                  secondaryColor={colors.aiSecondary}
                />
              </Animated.View>
            </LinearGradient>
          </Animated.View>
        </View>

        <Text style={styles.heroTitle}>Thêm sự kiện</Text>
        <Text style={styles.heroSub}>Nói hoặc nhập, tôi sẽ lưu giúp bạn</Text>
      </View>

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          ref={inputRef}
          style={styles.inputText}
          placeholder="Nhập hoặc nói sự kiện..."
          placeholderTextColor={colors.textLight}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleTextSubmit}
          returnKeyType="send"
          underlineColorAndroid="transparent"
        />
        <Pressable onPressIn={handleMicPressIn} onPressOut={handleMicPressOut}>
          <LinearGradient
            colors={[colors.aiPrimary, colors.aiSecondary]}
            style={styles.micBtn}
          >
            <Ionicons name="mic" size={18} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>

      {/* Chips */}
      <Text style={styles.chipsLabel}>Gợi ý nhanh</Text>
      <View style={styles.chipsGrid}>
        {QUICK_CHIPS.map((c, i) => {
          const tagColor = getTagColor(c.tag);
          return (
            <TouchableOpacity
              key={i}
              style={styles.chip}
              onPress={() => handleChipPress(c.prompt)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.chipIconWrap,
                  { backgroundColor: tagColor + "18" },
                ]}
              >
                <IconImage
                  source={getTagImage(c.tag)}
                  style={{ width: 20, height: 20 }}
                />
              </View>
              <Text style={styles.chipLabel}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity onPress={handleGoManual} style={styles.manualBtn}>
        <Text style={styles.manualBtnText}>Nhập thủ công</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderRecordingOverlay = () => {
    const mm = String(Math.floor(recSeconds / 60)).padStart(2, "0");
    const ss = String(recSeconds % 60).padStart(2, "0");
    return (
      <View style={styles.recordingOverlay}>
        <Text style={styles.recTimer}>
          {mm}:{ss}
        </Text>
        <View style={styles.recIndicator}>
          <Animated.View style={[styles.recDot, { opacity: recDotAnim }]} />
          <Text style={styles.recIndicatorTxt}>Đang ghi âm</Text>
        </View>
        {ringAnims.map((ring, i) => (
          <Animated.View
            key={i}
            style={[
              styles.ring,
              { transform: [{ scale: ring.scale }], opacity: ring.opacity },
            ]}
          />
        ))}
        <Pressable onPressOut={handleMicPressOut} style={styles.recMicWrap}>
          <Animated.View style={{ transform: [{ scale: recMicScale }] }}>
            <LinearGradient
              colors={[colors.aiPrimary, colors.aiSecondary]}
              style={styles.recMic}
            >
              <Ionicons name="mic" size={36} color="#fff" />
            </LinearGradient>
          </Animated.View>
        </Pressable>
        <View style={styles.waveform}>
          {waveAnims.map((anim, i) => (
            <Animated.View
              key={i}
              style={[styles.waveBar, { transform: [{ scaleY: anim }] }]}
            />
          ))}
        </View>
        <Text style={styles.recHint}>Thả tay để dừng</Text>
      </View>
    );
  };

  const renderAsking = () => {
    const question = getNextQuestion(parsedEvent);
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.askingRoot}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          {/* AI question bubble */}
          <View style={styles.askingBubbleRow}>
            <LinearGradient
              colors={[colors.aiPrimary, colors.aiSecondary]}
              style={styles.askingAvatar}
            >
              <AiIcon size={16} />
            </LinearGradient>
            <View style={styles.askingBubble}>
              <Text style={styles.askingBubbleTxt}>{question}</Text>
            </View>
          </View>

          {/* Phần đã có — hiện nếu parsedEvent có data */}
          {!!parsedEvent.eventType && (
            <View style={styles.askingContext}>
              <Text style={styles.askingContextTxt}>
                Đã ghi nhận: {buildTitle(parsedEvent)}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input bar — giống IDLE */}
        <View style={styles.askingInputWrap}>
          <View style={styles.inputBar}>
            <TextInput
              ref={inputRef}
              style={styles.inputText}
              placeholder="Nhập câu trả lời..."
              placeholderTextColor={colors.textLight}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleTextSubmit}
              returnKeyType="send"
              underlineColorAndroid="transparent"
              autoFocus
            />
            <Pressable
              onPressIn={handleMicPressIn}
              onPressOut={handleMicPressOut}
            >
              <LinearGradient
                colors={[colors.aiPrimary, colors.aiSecondary]}
                style={styles.micBtn}
              >
                <Ionicons name="mic" size={18} color="#fff" />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  };

  const renderProcessing = () => (
    <View style={styles.processingWrap}>
      <ActivityIndicator color={colors.aiPrimary} size="large" />
      <Text style={styles.processingText}>Đang xử lý...</Text>
    </View>
  );

  const renderConfirm = () => {
    const tag = parsedEvent.eventType ?? "other";
    const tagColor = confirmTagColor;
    const tagLabel = getTagLabel(tag);
    const tagImage = getTagImage(tag);
    const title = buildTitle(parsedEvent);
    const dateText =
      parsedEvent.day && parsedEvent.month
        ? `Ngày ${parsedEvent.day} tháng ${parsedEvent.month}`
        : "—";

    return (
      <ScrollView
        style={styles.confirmScroll}
        contentContainerStyle={styles.confirmContent}
        showsVerticalScrollIndicator={false}
      >
        {!!parsedEvent.rawText && (
          <View style={styles.transcriptChip}>
            <Ionicons name="mic-outline" size={14} color={colors.aiPrimary} />
            <Text style={styles.transcriptText} numberOfLines={2}>
              "{parsedEvent.rawText}"
            </Text>
          </View>
        )}

        <View style={styles.card}>
          {/* Left accent bar */}
          <View style={[styles.cardAccent, { backgroundColor: tagColor }]} />

          {/* Card header */}
          <View
            style={[styles.cardHeader, { backgroundColor: tagColor + "18" }]}
          >
            <View
              style={[styles.cardIcon, { backgroundColor: tagColor + "22" }]}
            >
              <IconImage source={tagImage} style={{ width: 26, height: 26 }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardSub}>{tagLabel} · Hàng năm</Text>
            </View>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: tagColor + "18",
                  borderColor: tagColor + "33",
                },
              ]}
            >
              <Text style={[styles.badgeTxt, { color: tagColor }]}>
                {tagLabel}
              </Text>
            </View>
          </View>

          <View>
            <View
              style={[
                styles.cardRow,
                (!parsedEvent.day || !parsedEvent.month) && {
                  borderBottomWidth: 0,
                },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={tagColor}
                style={styles.cardRowIcon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardRowTxt}>{dateText}</Text>
                <Text style={styles.cardRowSub}>
                  {parsedEvent.isLunar ? "Âm lịch" : "Dương lịch"}
                </Text>
              </View>
              {parsedEvent.isLunar && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: tagColor + "18",
                      borderColor: tagColor + "33",
                    },
                  ]}
                >
                  <Text style={[styles.badgeTxt, { color: tagColor }]}>Âm</Text>
                </View>
              )}
            </View>

            <View style={styles.cardRow}>
              <Ionicons
                name="notifications-outline"
                size={18}
                color={colors.textSecondary}
                style={styles.cardRowIcon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardRowTxt}>Nhắc nhở</Text>
                <Text style={styles.cardRowSub}>
                  Trước 7 ngày, 1 ngày, hôm đó
                </Text>
              </View>
            </View>

            {!!parsedEvent.year && (
              <View style={[styles.cardRow, { borderBottomWidth: 0 }]}>
                <Ionicons
                  name="book-outline"
                  size={18}
                  color={colors.textSecondary}
                  style={styles.cardRowIcon}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardRowTxt}>
                    Sinh năm {parsedEvent.year}
                  </Text>
                  <Text style={styles.cardRowSub}>Tính tuổi tự động</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity onPress={handleGoManual} style={styles.editLink}>
          <Text style={styles.editLinkTxt}>Chỉnh sửa chi tiết</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // ─── SHARE ────────────────────────────────────────────────────────────────

  const renderShare = () => (
    <ScrollView
      style={styles.confirmScroll}
      contentContainerStyle={styles.confirmContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.shareHeadRow}>
        <LinearGradient
          colors={[colors.aiPrimary, colors.aiSecondary]}
          style={styles.shareAiAvatar}
        >
          <AiIcon size={20} />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.shareHeadTitle}>Chia sẻ sự kiện</Text>
          <Text style={styles.shareHeadSub}>
            Chọn người thân để họ cùng nhớ ngày này
          </Text>
        </View>
      </View>

      {isLoadingConnections ? (
        <View style={styles.shareLoading}>
          <ActivityIndicator color={colors.aiPrimary} />
          <Text style={styles.shareLoadingText}>
            Đang tải danh sách kết nối...
          </Text>
        </View>
      ) : connections.length === 0 ? (
        <View style={styles.shareEmpty}>
          <Ionicons name="people-outline" size={48} color={colors.textLight} />
          <Text style={styles.shareEmptyTitle}>Chưa có kết nối</Text>
          <Text style={styles.shareEmptySub}>
            Thêm kết nối với người thân qua QR hoặc email để chia sẻ sự kiện
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {connections.map(({ connection, partner, canReceive }) => {
            const isSelected = selectedConnIds.has(partner.id);
            const avatarColor = ["#FF6B6B", "#4ECDC4", "#845EF7", "#339AF0"][
              partner.id.charCodeAt(0) % 4
            ];
            return (
              <TouchableOpacity
                key={connection.id}
                style={[
                  styles.shareCard,
                  isSelected && [
                    styles.shareCardSelected,
                    { borderColor: confirmTagColor },
                  ],
                  !canReceive && styles.shareCardDisabled,
                ]}
                onPress={() => {
                  if (!canReceive) return;
                  Feedback.select();
                  setSelectedConnIds((prev) => {
                    const next = new Set(prev);
                    isSelected ? next.delete(partner.id) : next.add(partner.id);
                    return next;
                  });
                }}
                activeOpacity={canReceive ? 0.7 : 1}
              >
                <View
                  style={[styles.shareAvatar, { backgroundColor: avatarColor }]}
                >
                  <Text style={styles.shareAvatarTxt}>
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
                    <Text style={styles.shareConnFull}>Hết lượt nhận</Text>
                  )}
                </View>
                {canReceive && (
                  <View
                    style={[
                      styles.shareCheck,
                      isSelected && {
                        backgroundColor: confirmTagColor,
                        borderColor: confirmTagColor,
                      },
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );

  // ─── SUCCESS ──────────────────────────────────────────────────────────────

  const renderSuccess = () => {
    const tag = parsedEvent.eventType ?? "other";
    const tagColor = confirmTagColor;
    const tagLabel = getTagLabel(tag);
    const tagImage = getTagImage(tag);
    const title = buildTitle(parsedEvent);
    const dateText =
      parsedEvent.day && parsedEvent.month
        ? `ngày ${parsedEvent.day} tháng ${parsedEvent.month}`
        : "";
    const calendarType = parsedEvent.isLunar ? "âm lịch" : "dương lịch";

    return (
      <View style={styles.successWrap}>
        {/* Check circle */}
        <View
          style={[styles.successCircle, { backgroundColor: tagColor + "18" }]}
        >
          <View
            style={[styles.successCircleInner, { backgroundColor: tagColor }]}
          >
            <Ionicons name="checkmark" size={32} color="#fff" />
          </View>
        </View>

        <Text style={styles.successHeading}>Đã lưu sự kiện!</Text>

        {/* Event summary card */}
        <View style={styles.successCard}>
          <View style={[styles.cardAccent, { backgroundColor: tagColor }]} />
          <View
            style={[
              styles.successCardHeader,
              { backgroundColor: tagColor + "18" },
            ]}
          >
            <View
              style={[styles.cardIcon, { backgroundColor: tagColor + "22" }]}
            >
              <IconImage source={tagImage} style={{ width: 26, height: 26 }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardSub}>
                {tagLabel} · {dateText} · {calendarType}
              </Text>
            </View>
          </View>

          {/* Reminder message */}
          <View style={styles.successReminderRow}>
            <LinearGradient
              colors={[colors.aiPrimary, colors.aiSecondary]}
              style={styles.successAiAvatar}
            >
              <AiIcon size={16} />
            </LinearGradient>
            <View style={styles.successReminderBubble}>
              <Text style={styles.successReminderTxt}>
                Tôi sẽ báo bạn trước{" "}
                <Text style={{ fontFamily: "Manrope_700Bold" }}>7 ngày</Text>,{" "}
                <Text style={{ fontFamily: "Manrope_700Bold" }}>1 ngày</Text> và{" "}
                <Text style={{ fontFamily: "Manrope_700Bold" }}>
                  ngay hôm đó
                </Text>{" "}
                để bạn kịp chuẩn bị nhé!
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.successDoneBtn, { backgroundColor: tagColor }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnTxt}>Xong</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setParsedEvent(EMPTY_PARSED);
            setScreenState("IDLE");
          }}
        >
          <Text style={styles.retryBtnTxt}>Thêm sự kiện khác</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ─── Main render ──────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header — hidden on SUCCESS */}
      {screenState !== "SUCCESS" && (
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {screenState === "CONFIRM"
              ? "Xác nhận sự kiện"
              : screenState === "SHARE"
              ? "Chia sẻ sự kiện"
              : screenState === "ASKING"
              ? "Thêm sự kiện"
              : "Thêm nhanh"}
          </Text>
          <View style={{ width: 36 }} />
        </View>
      )}

      {screenState === "ASKING" ? (
        renderAsking()
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {(screenState === "IDLE" || screenState === "RECORDING") &&
            renderIdle()}
          {screenState === "PROCESSING" && renderProcessing()}
          {screenState === "CONFIRM" && renderConfirm()}
          {screenState === "SHARE" && renderShare()}
          {screenState === "SUCCESS" && renderSuccess()}
        </KeyboardAvoidingView>
      )}

      {/* Recording overlay — always dark */}
      {screenState === "RECORDING" && renderRecordingOverlay()}

      {/* Save / Retry (CONFIRM only) */}
      {screenState === "CONFIRM" && (
        <View
          style={[
            styles.actions,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <TouchableOpacity
            style={[styles.saveBtnWrap, isSaving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[confirmTagColor, confirmTagColor + "CC"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtnGrad}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveBtnTxt}>Lưu sự kiện</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.retryBtn} onPress={handleReset}>
            <Text style={styles.retryBtnTxt}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Share footer */}
      {screenState === "SHARE" && (
        <View
          style={[
            styles.actions,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          {/* Sync timeout warning */}
          {!isSyncingForShare && !createdEvent?.serverId && (
            <Text style={styles.shareSyncWarn}>
              ⚠️ Chưa đồng bộ xong — không thể chia sẻ lúc này
            </Text>
          )}
          <View style={styles.shareFooterRow}>
            <TouchableOpacity
              style={styles.shareSkipBtn}
              onPress={() => setScreenState("SUCCESS")}
            >
              <Text style={styles.shareSkipTxt}>Bỏ qua</Text>
            </TouchableOpacity>
            {connections.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.shareSendBtn,
                  { backgroundColor: confirmTagColor },
                  (selectedConnIds.size === 0 ||
                    isSharing ||
                    isSyncingForShare ||
                    !createdEvent?.serverId) &&
                    styles.shareSendBtnDisabled,
                ]}
                onPress={handleShare}
                disabled={
                  selectedConnIds.size === 0 ||
                  isSharing ||
                  isSyncingForShare ||
                  !createdEvent?.serverId
                }
              >
                {isSharing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.shareSendTxt}>
                    {isSyncingForShare
                      ? "Đang đồng bộ..."
                      : `Chia sẻ${
                          selectedConnIds.size > 0
                            ? ` (${selectedConnIds.size})`
                            : ""
                        }`}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

// ─── Styles (theme-aware) ─────────────────────────────────────────────────────

const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: "Manrope_600SemiBold",
  },

  // ── IDLE ──
  idleRoot: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 20,
  },
  hero: {
    alignItems: "center",
    paddingBottom: 28,
  },
  // Rings overflow outside this box — overflow:visible is RN default
  heroIconWrap: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroRing: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    // borderColor set inline so we can use colors.aiPrimary
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.aiPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 10,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.3,
    fontFamily: "Manrope_700Bold",
  },
  heroSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 6,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 12,
    gap: 10,
    marginBottom: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    padding: 0,
  },
  micBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.aiPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  chipsLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 10,
    fontWeight: "500",
  },
  chipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    width: "47%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  chipIcon: { fontSize: 20 },
  chipIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  manualBtn: {
    alignSelf: "center",
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  manualBtnText: {
    fontSize: 13,
    color: colors.textSecondary,
    textDecorationLine: "underline",
    textDecorationColor: colors.border,
  },

  // ── ASKING ──
  askingRoot: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    gap: 16,
  },
  askingBubbleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  askingAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  askingBubble: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  askingBubbleTxt: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
    fontFamily: "Manrope_400Regular",
  },
  askingContext: {
    alignSelf: "flex-end",
    backgroundColor: colors.aiPrimary + "12",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.aiPrimary + "30",
  },
  askingContextTxt: {
    fontSize: 13,
    color: colors.aiPrimary,
    fontWeight: "500",
  },
  askingInputWrap: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 4,
  },

  // ── RECORDING overlay (always dark) ──
  recordingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.93)",
    alignItems: "center",
    justifyContent: "center",
  },
  recTimer: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 2,
    fontFamily: "Manrope_700Bold",
    marginBottom: 8,
  },
  recIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 40,
  },
  recDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#EF4444",
  },
  recIndicatorTxt: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 0.5,
  },
  ring: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    borderColor: "rgba(124,58,237,0.5)",
  },
  recMicWrap: { zIndex: 2 },
  recMic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.65,
    shadowRadius: 22,
    elevation: 18,
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 44,
    marginTop: 36,
  },
  waveBar: {
    width: 5,
    height: 36,
    borderRadius: 3,
    backgroundColor: "#7C3AED",
  },
  recHint: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 14,
    marginTop: 14,
  },

  // ── PROCESSING ──
  processingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  processingText: {
    color: colors.textSecondary,
    fontSize: 15,
  },

  // ── CONVERSATION ──
  convWrap: { flex: 1 },
  msgList: { flex: 1 },
  msgListContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  msgRowAI: { justifyContent: "flex-start" },
  msgRowUser: { flexDirection: "row-reverse" },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    flexShrink: 0,
  },
  bubble: {
    maxWidth: "73%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  bubbleAI: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleUser: {
    backgroundColor: colors.aiPrimary,
    borderBottomRightRadius: 4,
    shadowColor: colors.aiPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bubbleTxt: { fontSize: 14.5, lineHeight: 21 },
  bubbleTxtAI: { color: colors.textPrimary },
  bubbleTxtUser: { color: "#fff" },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textLight,
  },
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  replyInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
  },
  replyMic: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── CONFIRM ──
  confirmScroll: { flex: 1 },
  confirmContent: {
    padding: 20,
    gap: 16,
  },
  transcriptChip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
  },
  transcriptText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: "italic",
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    fontFamily: "Manrope_700Bold",
  },
  cardSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  cardRowIcon: { width: 24, marginRight: 4, alignSelf: "center" },
  cardRowTxt: { fontSize: 14.5, color: colors.textPrimary },
  cardRowSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  badge: {
    marginLeft: "auto",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  badgeTxt: { fontSize: 11, fontWeight: "600" },
  editLink: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  editLinkTxt: {
    fontSize: 13,
    color: colors.textSecondary,
    textDecorationLine: "underline",
    textDecorationColor: colors.border,
  },

  // ── Actions ──
  actions: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveBtnWrap: { borderRadius: 16, overflow: "hidden" },
  saveBtnGrad: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnTxt: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Manrope_700Bold",
  },
  saveBtnDisabled: { opacity: 0.6 },
  retryBtn: { paddingVertical: 12, alignItems: "center" },
  retryBtnTxt: { fontSize: 15, color: colors.textSecondary },

  // ── SUCCESS ──
  successWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 20,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  successCircleInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  successHeading: {
    fontSize: 22,
    fontFamily: "Manrope_700Bold",
    color: colors.textPrimary,
  },
  successCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  successCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  successReminderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  successAiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  successReminderBubble: {
    flex: 1,
    backgroundColor: colors.aiPrimary + "0D",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  successReminderTxt: {
    fontSize: 13.5,
    fontFamily: "Manrope_400Regular",
    color: colors.textSecondary,
    lineHeight: 20,
  },
  successDoneBtn: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },

  // ── SHARE ──
  shareHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  shareAiAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  shareHeadTitle: {
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
    color: colors.textPrimary,
  },
  shareHeadSub: {
    fontSize: 13,
    fontFamily: "Manrope_400Regular",
    color: colors.textSecondary,
    marginTop: 2,
  },
  shareLoading: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 40,
  },
  shareLoadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  shareEmpty: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 36,
  },
  shareEmptyTitle: {
    fontSize: 16,
    fontFamily: "Manrope_600SemiBold",
    color: colors.textPrimary,
  },
  shareEmptySub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  shareCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  shareCardSelected: {
    borderWidth: 1.5,
  },
  shareCardDisabled: {
    opacity: 0.5,
  },
  shareAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  shareAvatarTxt: {
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
    color: "#fff",
  },
  shareConnName: {
    fontSize: 14.5,
    fontFamily: "Manrope_600SemiBold",
    color: colors.textPrimary,
  },
  shareConnEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  shareConnFull: {
    fontSize: 11,
    color: "#EF4444",
    marginTop: 2,
  },
  shareCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  shareFooterRow: {
    flexDirection: "row",
    gap: 12,
  },
  shareSkipBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
  },
  shareSkipTxt: {
    fontSize: 15,
    fontFamily: "Manrope_600SemiBold",
    color: colors.textSecondary,
  },
  shareSendBtn: {
    flex: 2,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
  },
  shareSendBtnDisabled: {
    opacity: 0.45,
  },
  shareSyncWarn: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 8,
  },
  shareSendTxt: {
    fontSize: 15,
    fontFamily: "Manrope_700Bold",
    color: "#fff",
  },
}));

export default AIEventCreatorScreen;
