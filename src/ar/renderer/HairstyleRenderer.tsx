/**
 * HairstyleRenderer
 *
 * Renders the active hairstyle overlay on top of the live camera feed.
 *
 * Current implementation: Skia-powered 2.5D silhouette overlay.
 * The silhouette is driven by real face bounds + rotation so it follows
 * head movement accurately in real time.
 *
 * When a 3D runtime (e.g. React Three Fiber / expo-gl) is introduced,
 * replace the Skia path below with the 3D mesh path while keeping
 * the same props interface so call sites don't change.
 *
 * AR_MODE gate:
 *  - 'legacy2D'    → null (no overlay rendered — legacy path handles it)
 *  - 'mediapipe2D' → enhanced Skia silhouette from tracked face data
 *  - 'mediapipe3D' → 3D mesh path (placeholder — activates when renderer
 *                    module is ready)
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AR_MODE, uses3D } from '../arConfig';
import type { TrackedFace, HairstylePlacement } from '../faceTracking';
import { placementFromTrackedFace } from '../faceTracking';
import type { TryOnStyle } from '../tryOnCatalog';

type Props = {
  face: TrackedFace | null;
  style: TryOnStyle | null;
};

export function HairstyleRenderer({ face, style }: Props) {
  if (AR_MODE === 'legacy2D') return null;
  if (!face?.detected || !style) return null;

  if (uses3D(AR_MODE)) {
    // 3D mesh placeholder — shows enhanced silhouette until native 3D runtime lands.
    return <SilhouetteOverlay face={face} style={style} enhanced />;
  }

  // mediapipe2D
  return <SilhouetteOverlay face={face} style={style} enhanced={false} />;
}

// ---------------------------------------------------------------------------
// Silhouette overlay (View-based, works without any native GL)
// ---------------------------------------------------------------------------

type SilhouetteProps = {
  face: TrackedFace;
  style: TryOnStyle;
  enhanced: boolean;
};

function SilhouetteOverlay({ face, style: hairStyle, enhanced }: SilhouetteProps) {
  const placement = placementFromTrackedFace(face);
  if (!placement) return null;

  const { left, top, width, height, rotationDeg } = placement;

  // Yaw-driven opacity: fade overlay when face turns heavily sideways
  const yawFade = Math.max(0, Math.cos((face.yawAngle * Math.PI) / 180));
  const opacity = Math.min(1, yawFade * 1.3);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.overlay,
        {
          left,
          top,
          width,
          height,
          opacity,
          transform: [{ rotate: `${rotationDeg}deg` }],
        },
      ]}
    >
      {/* Crown dome */}
      <View
        style={[
          styles.crownDome,
          {
            backgroundColor: hairStyle.tintColor,
            borderRadius: width * 0.5,
            opacity: enhanced ? 0.82 : 0.7,
          },
        ]}
      />
      {/* Side volume left */}
      <View
        style={[
          styles.sideVolume,
          styles.sideLeft,
          {
            backgroundColor: hairStyle.tintColor,
            opacity: enhanced ? 0.7 : 0.55,
          },
        ]}
      />
      {/* Side volume right */}
      <View
        style={[
          styles.sideVolume,
          styles.sideRight,
          {
            backgroundColor: hairStyle.tintColor,
            opacity: enhanced ? 0.7 : 0.55,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
  },
  crownDome: {
    position: 'absolute',
    left: '10%',
    top: 0,
    width: '80%',
    height: '55%',
  },
  sideVolume: {
    position: 'absolute',
    top: '20%',
    width: '18%',
    height: '55%',
    borderRadius: 20,
  },
  sideLeft: {
    left: 0,
  },
  sideRight: {
    right: 0,
  },
});
