import { framePointToView, type Dims, type Landmark } from 'react-native-mediapipe';
import type { TrackedFace } from '../faceTracking';
import { enrichLandmarks } from '../faceTracking';

/** MediaPipe Face Mesh indices (subset used for UI + shape analysis). */
const MP = {
  forehead: 10,
  nose: 1,
  chin: 152,
  leftEye: 33,
  rightEye: 263,
  mouth: 13,
  leftCheek: 234,
  rightCheek: 454,
} as const;

function toScreen(
  landmarks: Landmark[],
  index: number,
  frame: Dims,
  view: Dims,
  mirrored: boolean,
): { x: number; y: number } | null {
  const lm = landmarks[index];
  if (!lm) return null;
  const p = framePointToView(lm, frame, view, 'cover', mirrored);
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
  return p;
}

export function trackedFaceFromMediaPipe(
  landmarks: Landmark[],
  frame: Dims,
  view: Dims,
  mirrored: boolean,
): TrackedFace {
  if (!landmarks.length) {
    return { bounds: null, rollAngle: 0, landmarks: [], detected: false };
  }

  const named: Array<[string, number]> = [
    ['forehead', MP.forehead],
    ['nose', MP.nose],
    ['mouth', MP.mouth],
    ['leftEye', MP.leftEye],
    ['rightEye', MP.rightEye],
    ['leftCheek', MP.leftCheek],
    ['rightCheek', MP.rightCheek],
    ['jawLeft', MP.leftCheek],
    ['jawRight', MP.rightCheek],
    ['chin', MP.chin],
  ];

  const points: TrackedFace['landmarks'] = [];
  for (const [key, idx] of named) {
    const p = toScreen(landmarks, idx, frame, view, mirrored);
    if (p) points.push({ key, ...p });
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const lm of landmarks) {
    const p = framePointToView(lm, frame, view, 'cover', mirrored);
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  if (!Number.isFinite(minX)) {
    return { bounds: null, rollAngle: 0, landmarks: [], detected: false };
  }

  const leftEye = toScreen(landmarks, MP.leftEye, frame, view, mirrored);
  const rightEye = toScreen(landmarks, MP.rightEye, frame, view, mirrored);
  let rollAngle = 0;
  if (leftEye && rightEye) {
    rollAngle = (Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180) / Math.PI;
  }

  return enrichLandmarks({
    bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
    rollAngle,
    landmarks: points,
    detected: true,
  });
}
