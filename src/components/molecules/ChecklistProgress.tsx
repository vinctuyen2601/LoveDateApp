import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from '@themes/colors';
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

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
  const styles = useStyles();
  const colors = useColors();

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
          color={isComplete ? colors.success : colors.textSecondary}
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

const useStyles = makeStyles((colors) => ({
  // Compact version styles
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  compactText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  compactTextComplete: {
    color: colors.success,
    fontFamily: 'Manrope_600SemiBold',
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
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textPrimary,
  },
  percentage: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    color: colors.primary,
  },
  percentageComplete: {
    color: colors.success,
  },
  progressBar: {
    height: 8,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressFillComplete: {
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusComplete: {
    color: colors.success,
    fontFamily: 'Manrope_600SemiBold',
  },
}));

export default ChecklistProgress;
