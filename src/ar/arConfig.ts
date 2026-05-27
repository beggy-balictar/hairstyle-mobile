import Constants from 'expo-constants';

/** AR face engine: `mediapipe` (MediaPipe Face Landmarker) or `legacy` (ML Kit / expo-face-detector). */
export type ArFaceEngine = 'mediapipe' | 'legacy';

/**
 * Set `EXPO_PUBLIC_AR_FACE_ENGINE=legacy` in eas.json or `.env` to revert without code changes.
 * Default: MediaPipe on standalone APK, legacy in Expo Go.
 */
export function getArFaceEngine(): ArFaceEngine {
  const fromEnv = process.env.EXPO_PUBLIC_AR_FACE_ENGINE?.trim().toLowerCase();
  if (fromEnv === 'legacy' || fromEnv === 'mediapipe') return fromEnv;
  if (Constants.appOwnership === 'expo') return 'legacy';
  return 'mediapipe';
}

export function isMediaPipeArEnabled(): boolean {
  return getArFaceEngine() === 'mediapipe';
}
