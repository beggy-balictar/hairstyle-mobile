# Revert AR engine (MediaPipe → legacy)

If the MediaPipe try-on build is not good, switch back **without deleting code**:

## Option 1 — Environment variable (recommended)

In `eas.json` preview profile:

```json
"env": {
  "EXPO_PUBLIC_API_BASE_URL": "http://YOUR_IP:3000",
  "EXPO_PUBLIC_AR_FACE_ENGINE": "legacy"
}
```

Rebuild the APK: `npm run build:apk`

## Option 2 — Default in code

Edit `src/ar/arConfig.ts` and return `'legacy'` from `getArFaceEngine()`.

## What each engine uses

| Engine | Tracking | Notes |
|--------|----------|--------|
| `mediapipe` | [MediaPipe Face Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker) | Requires `face_landmarker.task` in `assets/models/` |
| `legacy` | ML Kit via `react-native-vision-camera-face-detector` | Previous behavior; works on Expo Go |
