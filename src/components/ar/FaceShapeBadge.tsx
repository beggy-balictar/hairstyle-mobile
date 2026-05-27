import { StyleSheet, Text, View } from 'react-native';
import type { FaceShapeName } from '../../ar/faceShapeAnalysis';
import type { LiveScanPhase } from '../../hooks/useLiveFaceAnalysis';
import { colors, radius, spacing } from '../../theme';

type Props = {
  shape: FaceShapeName | null;
  phase: LiveScanPhase;
  scanning?: boolean;
};

export function FaceShapeBadge({ shape, phase, scanning }: Props) {
  if (phase === 'searching' || phase === 'aligning') return null;

  const label =
    scanning || !shape
      ? 'Analyzing face shape…'
      : `Face shape: ${shape}`;

  return (
    <View style={styles.badge} pointerEvents="none">
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    alignItems: 'center',
  },
  text: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 13,
    backgroundColor: colors.overlay,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});
