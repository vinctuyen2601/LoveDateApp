import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from '@themes/colors';

interface ChecklistProgressProps {
  completed: number;
  total: number;
  compact?: boolean; // For mini version on event cards
}

const ChecklistProgress: React.FC<ChecklistProgressProps> = ({
  completed,
  total,
  compact = false,
}) => {
  if (total === 0) {
    return null; // Don't show if no checklist items
  }

  const percentage = Math.round((completed / total) * 100);
  const isComplete = completed === total;

  if (compact) {
    // Compact version for event cards
    return (
      <View style={styles.compactContainer}>
        <Ionicons
          name={isComplete ? "checkmark-circle" : "checkmark-circle-outline"}
          size={16}
          color={isComplete ? COLORS.success : COLORS.textSecondary}
        />
        <Text
          style={[
            styles.compactText,
            isComplete && styles.compactTextComplete,
          ]}
        >
          {completed}/{total} hoàn thành
        </Text>
      </View>
    );
  }

  // Full version with progress bar
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Tiến độ checklist</Text>
        <Text style={[styles.percentage, isComplete && styles.percentageComplete]}>
          {percentage}%
        </Text>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${percentage}%` },
            isComplete && styles.progressFillComplete,
          ]}
        />
      </View>

      <Text style={styles.statusText}>
        {isComplete ? (
          <Text style={styles.statusComplete}>
            ✓ Hoàn thành tất cả {total} việc
          </Text>
        ) : (
          <Text>
            {completed}/{total} việc đã hoàn thành
          </Text>
        )}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // Compact version styles
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  compactText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  compactTextComplete: {
    color: COLORS.success,
    fontWeight: "600",
  },

  // Full version styles
  container: {
    paddingVertical: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  percentage: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  percentageComplete: {
    color: COLORS.success,
  },
  progressBar: {
    height: 8,
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressFillComplete: {
    backgroundColor: COLORS.success,
  },
  statusText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  statusComplete: {
    color: COLORS.success,
    fontWeight: "600",
  },
});

// Add success color if not defined
const SUCCESS_COLOR = "#10B981"; // Green
if (!COLORS.success) {
  (COLORS as any).success = SUCCESS_COLOR;
}

export default ChecklistProgress;
