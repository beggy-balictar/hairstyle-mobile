/**
 * AR Try-On feature flags — flip these to revert behavior without deleting code.
 *
 * liveTryOnV2: false  → uses app/(tabs)/try-on.legacy.tsx (previous UI)
 * overlayMode: 'off'  → face markers only, no hairstyle on head
 */
export const AR_FEATURES = {
  /** Master switch: new live AR experience vs legacy screen. */
  liveTryOnV2: true,
  /** Hairstyle on head: tinted silhouette (not reference photos). */
  overlayMode: 'silhouette' as 'silhouette' | 'off',
  /** Live face-shape badge + catalog highlights. */
  showLiveFaceShape: true,
  /** Short align/scan progress before showing shape (feels like live scan). */
  showScanPhases: true,
  /**
   * Uses ML Kit landmarks via react-native-vision-camera-face-detector on APK builds.
   * Same role as MediaPipe Face Landmarker (478-point mesh) for placement & shape heuristics.
   * @see https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker
   */
  useVisionFaceLandmarks: true,
} as const;
