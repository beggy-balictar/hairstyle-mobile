/**
 * Stub for react-native-mediapipe when the native package is not installed (EAS legacy builds).
 */
export const RunningMode = { LIVE_STREAM: 'LIVE_STREAM', IMAGE: 'IMAGE', VIDEO: 'VIDEO' };
export const Delegate = { GPU: 'GPU', CPU: 'CPU' };
export function useFaceLandmarkDetection() {
  return { cameraViewLayoutChangeHandler: () => {} };
}
export function faceLandmarkDetectionModuleConstants() {
  return { knownLandmarks: {} };
}
export function framePointToView(p: { x: number; y: number }) {
  return p;
}
export const MediapipeCamera = () => null;
export type Dims = { width: number; height: number };
export type Landmark = { x: number; y: number; z?: number };
