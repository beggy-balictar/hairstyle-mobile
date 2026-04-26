import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../src/theme';

export default function RecommendationsScreen() {
  return (
    <View style={styles.page}>
      <Text style={styles.title}>View Recommendations</Text>
      <Text style={styles.subtitle}>
        Hairstyle suggestions based on the processed image will appear here after backend
        integration.
      </Text>
      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderTitle}>Recommendations Area</Text>
        <Text style={styles.placeholderText}>No mock data included. Ready for API connection.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
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
});
