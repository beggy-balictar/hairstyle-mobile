import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import type { TrackedFace } from '../../ar/faceTracking';
import { AR_SHOW_LANDMARKS } from '../../ar/arConfig';

type Props = {
  face: TrackedFace | null;
};

// Landmark display priority — higher priority points are shown larger
const LANDMARK_PRIORITY: Record<string, number> = {
  leftEye: 2,
  rightEye: 2,
  nose: 1,
  mouth: 1,
  leftCheek: 0,
  rightCheek: 0,
  forehead: 1,
  foreheadTop: 0,
  jawLeft: 0,
  jawRight: 0,
  chin: 1,
  leftTemple: 0,
  rightTemple: 0,
};

function dotSize(key: string): number {
  const priority = LANDMARK_PRIORITY[key] ?? 0;
  if (priority === 2) return 10;
  if (priority === 1) return 8;
  return 6;
}

export function FaceMarkers({ face }: Props) {
  const scanAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!face?.detected) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      return;
    }
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    // Pulsing scan ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, [face?.detected]);

  if (!face?.detected) return null;

  const points = AR_SHOW_LANDMARKS && face.landmarks.length > 0 ? face.landmarks : [];

  const scanScale = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });
  const scanOpacity = scanAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.5, 0.85, 0.3],
  });

  return (
    <Animated.View style={{ opacity: fadeAnim }} pointerEvents="none">
      {/* Bounding frame with animated scan ring */}
      {face.bounds ? (
        <>
          <View
            pointerEvents="none"
            style={[
              styles.frame,
              {
                left: face.bounds.x,
                top: face.bounds.y,
                width: face.bounds.width,
                height: face.bounds.height,
              },
            ]}
          />
          {/* Animated scan ring */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.scanRing,
              {
                left: face.bounds.x - 6,
                top: face.bounds.y - 6,
                width: face.bounds.width + 12,
                height: face.bounds.height + 12,
                opacity: scanOpacity,
                transform: [{ scale: scanScale }],
              },
            ]}
          />
        </>
      ) : null}

      {/* Landmark dots */}
      {points.map((point) => {
        const size = dotSize(point.key);
        const half = size / 2;
        return (
          <View
            key={point.key}
            pointerEvents="none"
            style={[
              styles.marker,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                left: point.x - half,
                top: point.y - half,
              },
            ]}
          />
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  marker: {
    position: 'absolute',
    backgroundColor: colors.accent,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: colors.accent,
    shadowOpacity: 0.55,
    shadowRadius: 5,
    elevation: 4,
  },
  frame: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(246, 152, 62, 0.55)',
    borderRadius: 12,
  },
  scanRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 16,
    borderStyle: 'dashed',
  },
});
