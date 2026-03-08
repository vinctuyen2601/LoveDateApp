import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "@themes/colors";
import {
  MBTI_GROUPS,
  MBTI_DIMENSIONS,
  MBTI_TYPES,
  MBTIGroup,
} from "../data/mbtiTypes";

const MBTIGuideScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const filteredTypes = selectedGroup
    ? MBTI_GROUPS.find((g) => g.id === selectedGroup)?.types || []
    : Object.keys(MBTI_TYPES);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#0EA5E9", "#6366F1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tìm hiểu MBTI</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* What is MBTI */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧩 MBTI là gì?</Text>
          <Text style={styles.paragraph}>
            MBTI (Myers-Briggs Type Indicator) là công cụ đánh giá tính cách
            phổ biến nhất thế giới, chia con người thành{" "}
            <Text style={styles.bold}>16 nhóm tính cách</Text> dựa trên 4 chiều
            đối lập.
          </Text>
          <Text style={styles.paragraph}>
            Hiểu MBTI giúp bạn hiểu rõ hơn về bản thân, người yêu và cách hai
            người giao tiếp, yêu thương nhau hiệu quả hơn.
          </Text>
        </View>

        {/* 4 Dimensions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📐 4 chiều tính cách</Text>
          {MBTI_DIMENSIONS.map((dim) => (
            <View key={dim.code} style={styles.dimensionCard}>
              <Text style={styles.dimensionName}>{dim.name}</Text>
              <View style={styles.dimensionPair}>
                <View style={[styles.dimensionSide, styles.dimensionLeft]}>
                  <Text style={styles.dimensionLetter}>{dim.pairA.letter}</Text>
                  <Text style={styles.dimensionLabel}>{dim.pairA.label}</Text>
                  <Text style={styles.dimensionDesc}>{dim.pairA.desc}</Text>
                </View>
                <View style={styles.dimensionVs}>
                  <Text style={styles.dimensionVsText}>VS</Text>
                </View>
                <View style={[styles.dimensionSide, styles.dimensionRight]}>
                  <Text style={styles.dimensionLetter}>{dim.pairB.letter}</Text>
                  <Text style={styles.dimensionLabel}>{dim.pairB.label}</Text>
                  <Text style={styles.dimensionDesc}>{dim.pairB.desc}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* 4 Groups filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 4 nhóm tính cách</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.groupScroll}
            contentContainerStyle={{ gap: 8 }}
          >
            <TouchableOpacity
              style={[
                styles.groupChip,
                !selectedGroup && styles.groupChipActive,
              ]}
              onPress={() => setSelectedGroup(null)}
            >
              <Text
                style={[
                  styles.groupChipText,
                  !selectedGroup && styles.groupChipTextActive,
                ]}
              >
                Tất cả
              </Text>
            </TouchableOpacity>
            {MBTI_GROUPS.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.groupChip,
                  selectedGroup === group.id && {
                    backgroundColor: group.color,
                    borderColor: group.color,
                  },
                ]}
                onPress={() =>
                  setSelectedGroup(
                    selectedGroup === group.id ? null : group.id
                  )
                }
              >
                <Text
                  style={[
                    styles.groupChipText,
                    selectedGroup === group.id && { color: "#fff" },
                  ]}
                >
                  {group.emoji} {group.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Group description */}
          {selectedGroup && (
            <View
              style={[
                styles.groupDescCard,
                {
                  backgroundColor:
                    (MBTI_GROUPS.find((g) => g.id === selectedGroup)?.color ||
                      "#666") + "10",
                  borderLeftColor:
                    MBTI_GROUPS.find((g) => g.id === selectedGroup)?.color ||
                    "#666",
                },
              ]}
            >
              <Text style={styles.groupDescText}>
                {MBTI_GROUPS.find((g) => g.id === selectedGroup)?.description}
              </Text>
            </View>
          )}
        </View>

        {/* 16 Types grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🎯 {selectedGroup ? `Nhóm ${MBTI_GROUPS.find((g) => g.id === selectedGroup)?.name}` : "16 nhóm tính cách"}
          </Text>
          <View style={styles.typesGrid}>
            {filteredTypes.map((typeCode) => {
              const typeInfo = MBTI_TYPES[typeCode];
              if (!typeInfo) return null;
              const group = MBTI_GROUPS.find((g) =>
                g.types.includes(typeCode)
              );
              return (
                <TouchableOpacity
                  key={typeCode}
                  style={styles.typeCard}
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation.navigate("MBTITypeDetail", { type: typeCode })
                  }
                >
                  <View
                    style={[
                      styles.typeCardAccent,
                      { backgroundColor: group?.color || "#666" },
                    ]}
                  />
                  <View style={styles.typeCardBody}>
                    <View style={styles.typeCardTop}>
                      <Text style={styles.typeCardEmoji}>{typeInfo.emoji}</Text>
                      <View style={styles.typeCardInfo}>
                        <Text
                          style={[
                            styles.typeCardCode,
                            { color: group?.color || "#666" },
                          ]}
                        >
                          {typeCode}
                        </Text>
                        <Text style={styles.typeCardName}>
                          {typeInfo.name}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={COLORS.textLight}
                      />
                    </View>
                    <Text style={styles.typeCardDesc} numberOfLines={2}>
                      {typeInfo.shortDesc}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate("MBTISurvey")}
        >
          <LinearGradient
            colors={["#0EA5E9", "#6366F1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={styles.ctaText}>Làm bài khảo sát MBTI</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  body: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  bold: {
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  // Dimensions
  dimensionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  dimensionName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 10,
  },
  dimensionPair: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  dimensionSide: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
  },
  dimensionLeft: {
    backgroundColor: "#EFF6FF",
    marginRight: 4,
  },
  dimensionRight: {
    backgroundColor: "#FEF3C7",
    marginLeft: 4,
  },
  dimensionLetter: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  dimensionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 2,
    marginBottom: 6,
  },
  dimensionDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    textAlign: "center",
  },
  dimensionVs: {
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  dimensionVsText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textLight,
  },

  // Groups
  groupScroll: {
    marginBottom: 12,
  },
  groupChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  groupChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  groupChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  groupChipTextActive: {
    color: "#fff",
  },
  groupDescCard: {
    borderLeftWidth: 3,
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
  },
  groupDescText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Types grid
  typesGrid: {
    gap: 8,
  },
  typeCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  typeCardAccent: {
    width: 4,
  },
  typeCardBody: {
    flex: 1,
    padding: 12,
  },
  typeCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  typeCardEmoji: {
    fontSize: 28,
    marginRight: 10,
  },
  typeCardInfo: {
    flex: 1,
  },
  typeCardCode: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
  },
  typeCardName: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  typeCardDesc: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 6,
    lineHeight: 17,
  },

  // CTA
  ctaButton: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 14,
    overflow: "hidden",
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});

export default MBTIGuideScreen;
