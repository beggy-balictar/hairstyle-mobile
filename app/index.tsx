import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandLogo } from '../src/components/BrandLogo';
import { colors, radius, spacing } from '../src/theme';

export default function LandingScreen() {
  const router = useRouter();

  return (
    <View style={styles.page}>
      <LinearGradient
        colors={[colors.accentSoft, colors.background, colors.secondarySoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BrandLogo width={190} height={34} style={styles.brand} />
        <Text style={styles.title}>
          Customer space for hairstyle discovery, recommendations, and confident style choices.
        </Text>
        <Text style={styles.description}>
          StyleHair is designed for customers to scan or upload photos, explore personalized
          hairstyle matches, save favorite looks, and share feedback for better recommendations.
        </Text>

        <Text style={styles.sectionLabel}>Customer Features</Text>
        <View style={styles.featureCard}>
          <Text style={styles.cardTitle}>Face & Image Analysis</Text>
          <Text style={styles.cardText}>
            Scan your face in real time or upload a gallery image to start hairstyle matching.
          </Text>
        </View>
        <View style={styles.featureCard}>
          <Text style={styles.cardTitle}>Personalized Recommendations</Text>
          <Text style={styles.cardText}>
            Browse hairstyle suggestions generated from your processed profile and preferences.
          </Text>
        </View>
        <View style={styles.featureCard}>
          <Text style={styles.cardTitle}>Saved Looks & Feedback</Text>
          <Text style={styles.cardText}>
            Keep preferred results, rate your experience, and report ideas to improve suggestions.
          </Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={() => router.push('/login')}>
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    padding: spacing.xl,
    paddingTop: 64,
    paddingBottom: spacing.xl,
  },
  brand: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    color: colors.text,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    color: colors.secondary,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  featureCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderColor: colors.border,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  cardText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
  },
  footer: {
    padding: spacing.lg,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: '#E98831',
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    color: colors.onAccent,
    fontWeight: '700',
    fontSize: 16,
  },
});
