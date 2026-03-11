import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "@themes/colors";
import { MBTI_TYPES, getGroupForType } from "../data/mbtiTypes";

const MBTITypeDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { type: typeCode } = route.params;

  const typeInfo = MBTI_TYPES[typeCode];
  const group = getGroupForType(typeCode);

  if (!typeInfo || !group) {
    return (
      <View style={styles.container}>
        <Text>Không tìm thấy thông tin</Text>
      </View>
    );
  }

  const renderCompatCard = (
    label: string,
    icon: keyof typeof Ionicons.glyphMap,
    types: string[],
    bgColor: string
  ) => (
    <View style={[styles.compatCard, { backgroundColor: bgColor }]}>
      <View style={{flexDirection:'row',alignItems:'center',gap:5,marginBottom:8}}>
        <Ionicons name={icon} size={14} color={COLORS.textSecondary} />
        <Text style={[styles.compatLabel,{marginBottom:0}]}>{label}</Text>
      </View>
      <View style={styles.compatTypes}>
        {types.map((t) => {
          const info = MBTI_TYPES[t];
          return (
            <TouchableOpacity
              key={t}
              style={styles.compatChip}
              onPress={() => navigation.push("MBTITypeDetail", { type: t })}
            >
              <Text style={styles.compatChipText}>{t} — {info?.name || ""}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={group.gradient}
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>{typeInfo.emoji}</Text>
          <Text style={styles.headerCode}>{typeCode}</Text>
          <Text style={styles.headerName}>{typeInfo.name}</Text>
          <Text style={styles.headerNameEn}>{typeInfo.nameEn}</Text>
          <View style={styles.groupBadge}>
            <Text style={styles.groupBadgeText}>
              {group.emoji} {group.name}
            </Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.descText}>{typeInfo.fullDesc}</Text>
        </View>

        {/* Strengths */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💪 Điểm mạnh</Text>
          {typeInfo.strengths.map((s, i) => (
            <View key={i} style={styles.listItem}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color="#10B981"
                style={styles.listIcon}
              />
              <Text style={styles.listText}>{s}</Text>
            </View>
          ))}
        </View>

        {/* Weaknesses */}
        <View style={styles.section}>
          <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:12}}>
            <Ionicons name="flash-outline" size={17} color="#F59E0B" />
            <Text style={[styles.sectionTitle,{marginBottom:0}]}>Điểm cần cải thiện</Text>
          </View>
          {typeInfo.weaknesses.map((w, i) => (
            <View key={i} style={styles.listItem}>
              <Ionicons
                name="alert-circle"
                size={18}
                color="#F59E0B"
                style={styles.listIcon}
              />
              <Text style={styles.listText}>{w}</Text>
            </View>
          ))}
        </View>

        {/* Love Style */}
        <View style={styles.section}>
          <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:12}}>
            <Ionicons name="heart" size={17} color={COLORS.primary} />
            <Text style={[styles.sectionTitle,{marginBottom:0}]}>Phong cách yêu</Text>
          </View>
          <View style={styles.loveCard}>
            <Text style={styles.loveText}>{typeInfo.loveStyle}</Text>
          </View>
          <View style={styles.loveTraits}>
            {typeInfo.loveTraits.map((trait, i) => (
              <View key={i} style={styles.loveTraitItem}>
                <Ionicons
                  name="heart"
                  size={14}
                  color={group.color}
                  style={styles.listIcon}
                />
                <Text style={styles.loveTraitText}>{trait}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Gift Ideas */}
        <View style={styles.section}>
          <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:12}}>
            <Ionicons name="gift-outline" size={17} color={COLORS.textPrimary} />
            <Text style={[styles.sectionTitle,{marginBottom:0}]}>Gợi ý quà tặng</Text>
          </View>
          <View style={styles.giftGrid}>
            {typeInfo.giftIdeas.map((gift, i) => (
              <View
                key={i}
                style={[
                  styles.giftChip,
                  { backgroundColor: group.color + "10" },
                ]}
              >
                <Ionicons
                  name="gift-outline"
                  size={14}
                  color={group.color}
                />
                <Text style={[styles.giftText, { color: group.color }]}>
                  {gift}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Compatibility */}
        <View style={styles.section}>
          <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:12}}>
            <Ionicons name="people-outline" size={17} color={COLORS.textPrimary} />
            <Text style={[styles.sectionTitle,{marginBottom:0}]}>Độ tương thích</Text>
          </View>
          {renderCompatCard(
            "Rất hợp",
            "sparkles",
            typeInfo.compatibility.best,
            "#ECFDF5"
          )}
          {renderCompatCard(
            "Khá hợp",
            "thumbs-up-outline",
            typeInfo.compatibility.good,
            "#EFF6FF"
          )}
          {renderCompatCard(
            "Thử thách",
            "barbell-outline",
            typeInfo.compatibility.challenging,
            "#FEF3C7"
          )}
        </View>

        {/* Famous People */}
        {typeInfo.famousPeople.length > 0 && (
          <View style={styles.section}>
            <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:12}}>
              <Ionicons name="star" size={17} color="#F59E0B" />
              <Text style={[styles.sectionTitle,{marginBottom:0}]}>Người nổi tiếng</Text>
            </View>
            <View style={styles.famousRow}>
              {typeInfo.famousPeople.map((person, i) => (
                <View key={i} style={styles.famousChip}>
                  <Text style={styles.famousText}>{person}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate("MBTISurvey")}
        >
          <LinearGradient
            colors={group.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={styles.ctaText}>
              Bạn có phải {typeCode}? Làm khảo sát ngay!
            </Text>
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
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  headerCode: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 3,
  },
  headerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(255,255,255,0.95)",
    marginTop: 2,
  },
  headerNameEn: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  groupBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  groupBadgeText: {
    fontSize: 12,
    fontWeight: "600",
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
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  descText: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textSecondary,
  },

  // Lists
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  listIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },

  // Love style
  loveCard: {
    backgroundColor: "#FDF2F8",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  loveText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#831843",
    fontStyle: "italic",
  },
  loveTraits: {
    gap: 6,
  },
  loveTraitItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  loveTraitText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },

  // Gifts
  giftGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  giftChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  giftText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // Compatibility
  compatCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  compatLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  compatTypes: {
    flexDirection: "column",
    gap: 8,
  },
  compatChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  compatChipEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  compatChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    flex: 1,
  },

  // Famous
  famousRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  famousChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  famousText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
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
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});

export default MBTITypeDetailScreen;
