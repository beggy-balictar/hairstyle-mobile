# AR Try-On (live v2)

## What it does

- Live front camera with face landmarks (eyes, nose, cheeks, jaw, forehead)
- Short align → scan progress → live face-shape label (Oval, Round, Square, Heart, Diamond)
- Hairstyle catalog from existing recommendation context (no new backend calls)
- Tap a style: tinted silhouette follows head movement in real time
- **Best match** chips for styles suited to detected shape
- Save preview to gallery

Landmarks on APK builds use **ML Kit** via `react-native-vision-camera-face-detector`, which matches the role of [MediaPipe Face Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker) for live placement and shape heuristics.

## Revert to previous Try-On UI

Edit `src/config/arFeatures.ts`:

```ts
export const AR_FEATURES = {
  liveTryOnV2: false,  // ← set false
  // ...
};
```

Or restore `app/(tabs)/try-on.tsx` from `app/(tabs)/try-on.legacy.tsx`.

## Toggle overlay / shape features

| Flag | Effect |
|------|--------|
| `overlayMode: 'off'` | No hairstyle on head, markers only |
| `showLiveFaceShape: false` | No shape badge / Best match highlights |
| `showScanPhases: false` | Skip scan progress, go straight to live |

## 3D assets (Sketchfab / Meshy) — next step

Full GLB try-on needs `expo-gl` + Three.js / React Three Fiber and `.glb` files (e.g. from [Sketchfab haircut collection](https://sketchfab.com/bonku/collections/haircut-3dcd6b5275c14fc982b868fae55d0dfe) or [Meshy](https://www.meshy.ai/workspace)). Current v2 uses lightweight silhouettes for smooth mobile performance until those assets are wired in.
