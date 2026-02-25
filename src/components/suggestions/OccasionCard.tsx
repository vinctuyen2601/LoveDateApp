import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@themes/colors';
import { useMasterData } from '../../contexts/MasterDataContext';
import { getProductsByOccasion } from '../../services/affiliateProductService';
import PressableCard from '@components/atoms/PressableCard';

interface OccasionCardsProps {
  onOccasionPress: (occasionId: string) => void;
}

const OccasionCards: React.FC<OccasionCardsProps> = ({ onOccasionPress }) => {
  const { occasions } = useMasterData();
  const [occasionCounts, setOccasionCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const results = await Promise.all(
          occasions.map((occasion) =>
            getProductsByOccasion(occasion.id, 50)
              .then((products) => ({ id: occasion.id, count: products.length }))
              .catch(() => ({ id: occasion.id, count: 0 }))
          )
        );
        const counts: Record<string, number> = {};
        results.forEach(({ id, count }: { id: string; count: number }) => { counts[id] = count; });
        setOccasionCounts(counts);
      } catch {
        // Fallback - show 0 for all
      }
    };
    loadCounts();
  }, [occasions]);

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
            <Ionicons name={occasion.icon as any} size={28} color={COLORS.white} />
            <Text style={styles.cardName}>{occasion.name}</Text>
            <Text style={styles.cardCount}>
              {occasionCounts[occasion.id] ?? '...'} gợi ý
            </Text>
          </PressableCard>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
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
    fontWeight: '700',
    color: COLORS.white,
  },
  cardCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
});

export default React.memo(OccasionCards);
