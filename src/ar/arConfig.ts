/**
 * AR feature-flag config.
 *
 * AR_MODE controls which tracking + rendering pipeline is active:
 *   'legacy2D'     - Current vision-camera / expo-face-detector + 2D overlay (original behavior)
 *   'mediapipe2D'  - MediaPipe Face Landmarker landmarks with improved 2D overlay
 *   'mediapipe3D'  - MediaPipe Face Landmarker + 3D hair mesh rendering
 *
 * To rollback instantly, set AR_MODE back to 'legacy2D' and rebuild.
 * All legacy code paths are preserved behind the flag.
 */

export type ARMode = 'legacy2D' | 'mediapipe2D' | 'mediapipe3D';

// Change this single value to switch the entire AR pipeline.
export const AR_MODE: ARMode = 'mediapipe2D';

// Whether to show detailed landmark dots (useful during development).
export const AR_SHOW_LANDMARKS = true;

// Whether face-shape chip is shown on the Try-On header.
export const AR_SHOW_FACE_SHAPE_CHIP = true;

// Minimum MediaPipe face-presence confidence to accept a detection.
export const MEDIAPIPE_PRESENCE_THRESHOLD = 0.6;

// Landmark smoothing factor (0 = no smoothing, 1 = never updates).
export const LANDMARK_SMOOTHING = 0.35;

// How long (ms) to show the "Face detected" status before fading.
export const FACE_DETECTED_STATUS_HOLD_MS = 2000;

export function isLegacy(mode: ARMode): boolean {
  return mode === 'legacy2D';
}

export function uses3D(mode: ARMode): boolean {
  return mode === 'mediapipe3D';
}
