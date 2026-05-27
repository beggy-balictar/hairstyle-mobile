import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import type { TryOnStyle } from '../../ar/tryOnCatalog';
import type { FaceShapeName } from '../../ar/faceShapeAnalysis';
import { AR_SHOW_FACE_SHAPE_CHIP } from '../../ar/arConfig';
import { Feather } from '@expo/vector-icons';

type Props = {
  styles: TryOnStyle[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Detected face shape from live tracking (null if not yet determined). */
  faceShape?: FaceShapeName | null;
};

const FACE_SHAPE_ICON: Record<FaceShapeName, string> = {
  Oval: 'circle',
  Round: 'disc',
  Square: 'square',
  Heart: 'heart',
  Diamond: 'diamond',
} as const;

export function HairstylePicker({ styles: catalog, selectedId, onSelect, faceShape }: Props) {
  return (
    <View style={styles.panel}>
      {AR_SHOW_FACE_SHAPE_CHIP && faceShape ? (
        <View style={styles.shapeChipRow}>
          <View style={styles.shapeChip}>
            <Feather name="user" size={11} color={colors.accent} />
            <Text style={styles.shapeChipText}>{faceShape} face</Text>
          </View>
          <Text style={styles.shapeHint}>Highlighted styles suit your face shape</Text>
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {catalog.map((item) => {
          const active = item.id === selectedId;
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelect(item.id)}
              style={[styles.chip, active && styles.chipActive, item.recommended && !active && styles.chipRecommended]}
            >
              {item.recommended && !active ? (
                <View style={styles.recBadge}>
                  <Text style={styles.recBadgeText}>✓</Text>
                </View>
              ) : null}
              {item.imageUri ? (
                <Image source={{ uri: item.imageUri }} style={styles.thumb} resizeMode="cover" />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: item.tintColor }]} />
              )}
              <Text style={[styles.chipText, active && styles.chipTextActive, item.recommended && styles.chipTextRec]} numberOfLines={1}>
                {item.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    paddingVertical: spacing.xs,
    backgroundColor: 'transparent',
  },
  shapeChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.sm,
    marginBottom: 6,
  },
  shapeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(246,152,62,0.2)',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  shapeChipText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  shapeHint: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    flexShrink: 1,
  },
  row: {
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    width: 88,
    alignItems: 'center',
    padding: 6,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(246,152,62,0.22)',
  },
  chipRecommended: {
    borderColor: 'rgba(246,152,62,0.5)',
    backgroundColor: 'rgba(246,152,62,0.10)',
  },
  recBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  recBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    marginBottom: 4,
  },
  thumbFallback: {
    opacity: 0.9,
  },
  chipText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  chipTextActive: {
    color: colors.onPrimary,
    fontWeight: '800',
  },
  chipTextRec: {
    color: colors.accent,
  },
});
