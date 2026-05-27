import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';

type Props = {
  progress: number;
  visible: boolean;
};

export function ScanProgressBar({ progress, visible }: Props) {
  if (!visible) return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Text style={styles.label}>Live face scan {Math.round(progress)}%</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, progress)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 52,
  },
  label: {
    color: colors.onPrimary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
  },
});
