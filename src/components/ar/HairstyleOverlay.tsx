import { StyleSheet, View } from 'react-native';
import type { HairstylePlacement } from '../../ar/faceTracking';
import type { TryOnStyle } from '../../ar/tryOnCatalog';

type Props = {
  style: TryOnStyle;
  placement: HairstylePlacement | null;
};

export function HairstyleOverlay({ style, placement }: Props) {
  if (!placement) return null;

  const transform = [{ rotate: `${placement.rotationDeg}deg` }];

  return (
    <View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          left: placement.left,
          top: placement.top,
          width: placement.width,
          height: placement.height,
          transform,
        },
      ]}
    >
      <View style={[styles.silhouette, { backgroundColor: style.tintColor }]}>
        <View style={[styles.hairCap, { backgroundColor: style.tintColor }]} />
        <View style={[styles.hairSideLeft, { backgroundColor: style.tintColor }]} />
        <View style={[styles.hairSideRight, { backgroundColor: style.tintColor }]} />
        <View style={[styles.hairFringe, { backgroundColor: style.tintColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  silhouette: {
    width: '100%',
    height: '100%',
    opacity: 0.88,
  },
  hairCap: {
    position: 'absolute',
    top: '4%',
    left: '8%',
    width: '84%',
    height: '58%',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  hairSideLeft: {
    position: 'absolute',
    top: '28%',
    left: '-4%',
    width: '28%',
    height: '52%',
    borderRadius: 40,
  },
  hairSideRight: {
    position: 'absolute',
    top: '28%',
    right: '-4%',
    width: '28%',
    height: '52%',
    borderRadius: 40,
  },
  hairFringe: {
    position: 'absolute',
    bottom: '18%',
    left: '18%',
    width: '64%',
    height: '22%',
    borderRadius: 24,
    opacity: 0.85,
  },
});
