import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

type FeedbackModalProps = {
  visible: boolean;
  value: string;
  error?: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export const FeedbackModal = ({
  visible,
  value,
  error,
  onChangeText,
  onSubmit,
  onClose,
}: FeedbackModalProps) => {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Report / Feedback</Text>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            multiline
            numberOfLines={5}
            placeholder="Type your concern, issue, or suggestion..."
            placeholderTextColor={colors.textMuted}
            style={[styles.input, error ? styles.inputError : undefined]}
            textAlignVertical="top"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.secondaryPressed]}
              onPress={onClose}
            >
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.button, styles.primary, pressed && styles.primaryPressed]}
              onPress={onSubmit}
            >
              <Text style={styles.primaryText}>Submit</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minHeight: 120,
    padding: spacing.md,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    marginTop: 6,
    fontSize: 12,
  },
  actions: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  button: {
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  secondary: {
    backgroundColor: colors.primarySoft,
  },
  secondaryPressed: {
    backgroundColor: colors.secondarySoft,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  primaryPressed: {
    backgroundColor: colors.secondary,
  },
  secondaryText: {
    color: colors.primary,
    fontWeight: '700',
  },
  primaryText: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
});
