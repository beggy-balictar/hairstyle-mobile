import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../src/theme';

export default function SavedResultsScreen() {
  return (
    <View style={styles.page}>
      <Text style={styles.title}>Save Results</Text>
      <Text style={styles.subtitle}>
        Preferred hairstyle outputs will be listed here for future access after integration.
      </Text>
      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderTitle}>Saved Results Area</Text>
        <Text style={styles.placeholderText}>
          Minimal structure only. No sample results are rendered.
        </Text>
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
