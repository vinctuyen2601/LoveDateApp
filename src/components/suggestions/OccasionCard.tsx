import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@themes/colors';
import { useMasterData } from '../../contexts/MasterDataContext';
import PressableCard from '@components/atoms/PressableCard';
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

interface OccasionCardsProps {
  onOccasionPress: (occasionId: string) => void;
}

const OccasionCards: React.FC<OccasionCardsProps> = ({ onOccasionPress }) => {
  const styles = useStyles();
  const colors = useColors();

  const { occasions } = useMasterData();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quà theo dịp đặc biệt</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {occasions.map((occasion) => (
          <PressableCard
            key={occasion.id}
            style={[styles.card, { backgroundColor: occasion.color }]}
            onPress={() => onOccasionPress(occasion.id)}
          >
            <Ionicons name={occasion.icon as any} size={28} color={colors.white} />
            <Text style={styles.cardName}>{occasion.name}</Text>
            <Text style={styles.cardCount}>Xem gợi ý</Text>
          </PressableCard>
        ))}
      </ScrollView>
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  container: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 120,
    height: 100,
    borderRadius: 16,
    padding: 14,
    justifyContent: 'space-between',
  },
  cardName: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: colors.white,
  },
  cardCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Manrope_500Medium',
  },
}));export default React.memo(OccasionCards);
