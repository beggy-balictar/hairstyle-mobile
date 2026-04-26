import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';

type SatisfactionModalProps = {
  visible: boolean;
  rating: number;
  onRate: (rating: number) => void;
  onClose: () => void;
};

export const SatisfactionModal = ({ visible, rating, onRate, onClose }: SatisfactionModalProps) => {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>How satisfied are you?</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => onRate(star)} style={styles.star}>
                <Feather
                  name={star <= rating ? 'star' : 'star'}
                  size={26}
                  color={star <= rating ? colors.accent : colors.borderMuted}
                />
              </Pressable>
            ))}
          </View>
          <Pressable style={({ pressed }) => [styles.close, pressed && styles.closePressed]} onPress={onClose}>
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
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
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: spacing.md,
  },
  stars: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  star: {
    padding: 8,
  },
  close: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closePressed: {
    backgroundColor: colors.secondary,
    transform: [{ scale: 0.98 }],
  },
  closeText: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
});
