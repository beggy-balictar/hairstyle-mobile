import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRecommendations } from '../../src/context/RecommendationContext';
import { colors, radius, spacing } from '../../src/theme';

function formatMatchScore(score?: number): string | null {
  if (typeof score !== 'number') return null;
  const normalized = score > 1 ? score : score * 100;
  const clamped = Math.min(99, Math.max(0, Math.round(normalized)));
  return `${clamped}%`;
}

export default function SavedResultsScreen() {
  const { savedItems, clearSaved } = useRecommendations();

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>Save Results</Text>
      <Text style={styles.subtitle}>Your hearted hairstyles appear here.</Text>

      {savedItems.length > 0 ? (
        <View style={styles.listWrap}>
          {savedItems.map((item) => {
            const scoreLabel = formatMatchScore(item.score);
            return (
              <View key={`${item.name}-${item.description}`} style={styles.card}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
                {scoreLabel ? <Text style={styles.score}>Match score: {scoreLabel}</Text> : null}
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderTitle}>No Saved Results Yet</Text>
          <Text style={styles.placeholderText}>Tap the heart button in Recommendations to save hairstyles.</Text>
        </View>
      )}

      {savedItems.length > 0 ? (
        <Pressable style={styles.clearButton} onPress={clearSaved}>
          <Text style={styles.clearButtonText}>Clear Saved</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  listWrap: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  cardDescription: {
    color: colors.textMuted,
    lineHeight: 20,
  },
  score: {
    marginTop: 2,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  placeholderCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  placeholderTitle: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  placeholderText: {
    color: colors.textMuted,
  },
  clearButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.md,
    paddingVertical: 11,
  },
  clearButtonText: {
    color: colors.primary,
    fontWeight: '800',
  },
});
