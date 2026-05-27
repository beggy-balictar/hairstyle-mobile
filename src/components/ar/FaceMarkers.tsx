import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import type { TrackedFace } from '../../ar/faceTracking';

type Props = {
  face: TrackedFace | null;
};

export function FaceMarkers({ face }: Props) {
  if (!face?.detected) return null;

  const points = face.landmarks.length > 0 ? face.landmarks : [];

  return (
    <>
      {points.map((point) => (
        <View
          key={point.key}
          pointerEvents="none"
          style={[
            styles.marker,
            {
              left: point.x - 6,
              top: point.y - 6,
            },
          ]}
        />
      ))}
      {face.bounds ? (
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
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  marker: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: colors.accent,
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  frame: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(246, 152, 62, 0.55)',
    borderRadius: 12,
  },
});
