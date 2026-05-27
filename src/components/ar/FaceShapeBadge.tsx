import { StyleSheet, Text, View } from 'react-native';
import type { FaceShapeName } from '../../ar/faceShapeAnalysis';
import { colors, radius, spacing } from '../../theme';

type Props = {
  shape: FaceShapeName | null;
  phase: 'aligning' | 'scanning' | 'ready' | 'idle';
  progress?: number;
};

export function FaceShapeBadge({ shape, phase, progress = 0 }: Props) {
  if (phase === 'idle') return null;

  const label =
    phase === 'aligning'
      ? 'Center your face in the frame'
      : phase === 'scanning'
        ? `Scanning face shape… ${progress}%`
        : shape
          ? `Face shape: ${shape}`
          : 'Analyzing…';

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Text style={styles.text}>{label}</Text>
      {phase === 'scanning' ? (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress}%` }]} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: colors.overlay,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    gap: 6,
  },
  text: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  track: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 999,
  },
});
