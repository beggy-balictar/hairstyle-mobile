import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ActionCard } from '../../src/components/ActionCard';
import { FeedbackModal } from '../../src/components/FeedbackModal';
import { SatisfactionModal } from '../../src/components/SatisfactionModal';
import { useAuth } from '../../src/context/AuthContext';
import { submitCustomerReport, submitSatisfaction } from '../../src/services/authApi';
import { colors, radius, spacing } from '../../src/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [satisfactionVisible, setSatisfactionVisible] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [rating, setRating] = useState(0);
  const [actionMessage, setActionMessage] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const onRate = async (value: number) => {
    setRating(value);
    setActionMessage('');
    try {
      await submitSatisfaction(value, user?.token);
      setActionMessage('Thanks! Your rating was submitted.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not submit rating.';
      setActionMessage(message);
    }
  };

  const submitFeedback = async () => {
    if (!feedback.trim()) {
      setFeedbackError('Please enter your concern or suggestion.');
      return;
    }
    setSubmittingReport(true);
    setActionMessage('');
    try {
      await submitCustomerReport(feedback.trim(), user?.token);
      setActionMessage('Thank you. Your feedback was submitted.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not submit feedback.';
      setFeedbackError(message);
      setSubmittingReport(false);
      return;
    }
    setSubmittingReport(false);
    setFeedbackError('');
    setFeedback('');
    setFeedbackVisible(false);
  };

  return (
    <View style={styles.page}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: spacing.xl + Math.max(insets.bottom, 8) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Customer Dashboard</Text>
        <Text style={styles.subtitle}>Select an action to continue your hairstyle journey.</Text>

        <ActionCard
          icon="camera"
          title="Scan Face"
          subtitle="Open camera with face scan preparation."
          onPress={() => router.push('/(tabs)/scan')}
        />
        <ActionCard
          icon="maximize"
          title="AR Try-On"
          subtitle="Live camera — try hairstyles on your face in real time."
          onPress={() => router.push('/(tabs)/try-on')}
        />
        <ActionCard
          icon="image"
          title="Upload Image"
          subtitle="Choose a photo from your gallery."
          onPress={() => router.push('/(tabs)/upload')}
        />
        <ActionCard
          icon="scissors"
          title="View Recommendations"
          subtitle="See hairstyle suggestions from analysis."
          onPress={() => router.push('/(tabs)/recommendations')}
        />
        <ActionCard
          icon="bookmark"
          title="Save Results"
          subtitle="Keep your preferred hairstyle outputs."
          onPress={() => router.push('/(tabs)/saved')}
        />

        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackSectionLabel}>Share your experience</Text>
          {actionMessage ? <Text style={styles.actionMessage}>{actionMessage}</Text> : null}
          <View style={styles.feedbackCard}>
            <Pressable
              style={({ pressed }) => [styles.feedbackRow, pressed && styles.feedbackRowPressed]}
              onPress={() => setSatisfactionVisible(true)}
            >
              <View style={styles.feedbackIconWrap}>
                <Feather name="star" size={20} color={colors.accent} />
              </View>
              <View style={styles.feedbackTextWrap}>
                <Text style={styles.feedbackRowTitle}>Satisfaction</Text>
                <Text style={styles.feedbackRowSubtitle}>Rate your visit from 1 to 5 stars</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.feedbackRow,
                styles.feedbackRowSecond,
                pressed && styles.feedbackRowPressed,
              ]}
              onPress={() => setFeedbackVisible(true)}
            >
              <View style={styles.feedbackIconWrap}>
                <Feather name="message-circle" size={20} color={colors.primary} />
              </View>
              <View style={styles.feedbackTextWrap}>
                <Text style={styles.feedbackRowTitle}>Report / Feedback</Text>
                <Text style={styles.feedbackRowSubtitle}>Tell us about issues or ideas</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <SatisfactionModal
        visible={satisfactionVisible}
        rating={rating}
        onRate={onRate}
        onClose={() => setSatisfactionVisible(false)}
      />

      <FeedbackModal
        visible={feedbackVisible}
        value={feedback}
        error={feedbackError}
        onChangeText={(text) => {
          setFeedback(text);
          if (feedbackError) setFeedbackError('');
        }}
        onSubmit={submitFeedback}
        onClose={() => {
          if (submittingReport) return;
          setFeedbackVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    flexGrow: 1,
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
  feedbackSection: {
    marginTop: spacing.lg,
  },
  feedbackSectionLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  actionMessage: {
    marginBottom: spacing.sm,
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  feedbackCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  feedbackRowSecond: {
    marginTop: spacing.sm,
  },
  feedbackRowPressed: {
    backgroundColor: colors.primarySoft,
  },
  feedbackIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  feedbackTextWrap: {
    flex: 1,
  },
  feedbackRowTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 2,
  },
  feedbackRowSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
