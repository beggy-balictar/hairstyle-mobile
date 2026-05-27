import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import type { TryOnStyle } from '../../ar/tryOnCatalog';

type Props = {
  styles: TryOnStyle[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function HairstylePicker({ styles: catalog, selectedId, onSelect }: Props) {
  return (
    <View style={styles.panel}>
      <Text style={styles.label}>Tap a style to try it live</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {catalog.map((item) => {
          const active = item.id === selectedId;
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelect(item.id)}
              style={[styles.chip, active && styles.chipActive]}
            >
              {item.imageUri ? (
                <Image source={{ uri: item.imageUri }} style={styles.thumb} resizeMode="cover" />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: item.tintColor }]} />
              )}
              <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  label: {
    color: colors.onPrimary,
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
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
});
