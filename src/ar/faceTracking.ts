import type { FaceFeature } from 'expo-face-detector';
import type { Face } from 'react-native-vision-camera-face-detector';
import { LANDMARK_SMOOTHING } from './arConfig';
import {
  estimateFaceShapeFromLandmarks,
  type FaceShapeName,
  type LandmarkPoint,
} from './faceShapeAnalysis';

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

export type TrackedFace = {
  bounds: { x: number; y: number; width: number; height: number } | null;
  rollAngle: number;
  /** Head yaw (left/right tilt) in degrees. 0 = front-facing. Populated by MediaPipe. */
  yawAngle: number;
  /** Head pitch (up/down tilt) in degrees. 0 = front-facing. Populated by MediaPipe. */
  pitchAngle: number;
  landmarks: Array<{ key: string; x: number; y: number }>;
  /** Named landmark lookup for face-shape analysis + renderer anchoring. */
  namedLandmarks: Record<string, LandmarkPoint>;
  detected: boolean;
  /** Face-shape derived from landmarks (populated when enough data is available). */
  faceShape: FaceShapeName | null;
  /** 0–1 confidence from MediaPipe; 1 for legacy trackers (always detected). */
  presenceScore: number;
};

export type HairstylePlacement = {
  left: number;
  top: number;
  width: number;
  height: number;
  rotationDeg: number;
};

// ---------------------------------------------------------------------------
// Placement helper (2D path)
// ---------------------------------------------------------------------------

export function placementFromTrackedFace(face: TrackedFace | null): HairstylePlacement | null {
  if (!face?.detected || !face.bounds) return null;

  const { x, y, width, height } = face.bounds;
  const centerX = x + width / 2;

  // Scale overlay to sit above the face like a cap.
  // yaw correction: narrow the overlay when the face turns away.
  const yawFactor = Math.max(0.5, Math.cos((face.yawAngle * Math.PI) / 180));
  const overlayWidth = width * 1.42 * yawFactor;
  const overlayHeight = height * 0.92;

  return {
    left: centerX - overlayWidth / 2,
    top: y - overlayHeight * 0.54,
    width: overlayWidth,
    height: overlayHeight,
    rotationDeg: face.rollAngle,
  };
}

// ---------------------------------------------------------------------------
// Landmark smoothing (exponential moving average)
// ---------------------------------------------------------------------------

let _prevBounds: TrackedFace['bounds'] = null;
let _prevLandmarks: TrackedFace['landmarks'] = [];
let _prevRoll = 0;
let _prevYaw = 0;
let _prevPitch = 0;

function smoothScalar(prev: number, next: number): number {
  return prev * LANDMARK_SMOOTHING + next * (1 - LANDMARK_SMOOTHING);
}

function smoothBounds(
  prev: TrackedFace['bounds'],
  next: TrackedFace['bounds'],
): TrackedFace['bounds'] {
  if (!prev || !next) return next;
  return {
    x: smoothScalar(prev.x, next.x),
    y: smoothScalar(prev.y, next.y),
    width: smoothScalar(prev.width, next.width),
    height: smoothScalar(prev.height, next.height),
  };
}

function smoothLandmarks(
  prev: TrackedFace['landmarks'],
  next: TrackedFace['landmarks'],
): TrackedFace['landmarks'] {
  if (prev.length !== next.length) return next;
  return next.map((pt, i) => ({
    key: pt.key,
    x: smoothScalar(prev[i].x, pt.x),
    y: smoothScalar(prev[i].y, pt.y),
  }));
}

function applySmoothing(face: TrackedFace): TrackedFace {
  const bounds = smoothBounds(_prevBounds, face.bounds);
  const landmarks = smoothLandmarks(_prevLandmarks, face.landmarks);
  const roll = smoothScalar(_prevRoll, face.rollAngle);
  const yaw = smoothScalar(_prevYaw, face.yawAngle);
  const pitch = smoothScalar(_prevPitch, face.pitchAngle);

  _prevBounds = bounds;
  _prevLandmarks = landmarks;
  _prevRoll = roll;
  _prevYaw = yaw;
  _prevPitch = pitch;

  return { ...face, bounds, landmarks, rollAngle: roll, yawAngle: yaw, pitchAngle: pitch };
}

/** Call this when the screen is unmounted / camera stopped to reset state. */
export function resetFaceSmoothing(): void {
  _prevBounds = null;
  _prevLandmarks = [];
  _prevRoll = 0;
  _prevYaw = 0;
  _prevPitch = 0;
}

// ---------------------------------------------------------------------------
// Named-landmark builder
// ---------------------------------------------------------------------------

function buildNamedLandmarks(
  landmarks: TrackedFace['landmarks'],
): Record<string, LandmarkPoint> {
  const result: Record<string, LandmarkPoint> = {};
  for (const pt of landmarks) {
    result[pt.key] = { x: pt.x, y: pt.y };
  }
  return result;
}

// ---------------------------------------------------------------------------
// Synthetic-landmark enrichment (fills in missing derived points)
// ---------------------------------------------------------------------------

function enrichLandmarks(face: TrackedFace): TrackedFace {
  if (!face.bounds) return face;

  const { x, y, width, height } = face.bounds;
  const keys = new Set(face.landmarks.map((p) => p.key));
  const extra: TrackedFace['landmarks'] = [];

  if (!keys.has('forehead')) {
    extra.push({ key: 'forehead', x: x + width / 2, y: y + height * 0.08 });
  }
  if (!keys.has('foreheadTop')) {
    extra.push({ key: 'foreheadTop', x: x + width / 2, y: y + height * 0.04 });
  }
  if (!keys.has('jawLeft')) {
    extra.push({ key: 'jawLeft', x: x + width * 0.22, y: y + height * 0.88 });
  }
  if (!keys.has('jawRight')) {
    extra.push({ key: 'jawRight', x: x + width * 0.78, y: y + height * 0.88 });
  }
  if (!keys.has('chin')) {
    extra.push({ key: 'chin', x: x + width / 2, y: y + height * 0.96 });
  }
  if (!keys.has('leftTemple')) {
    extra.push({ key: 'leftTemple', x: x + width * 0.05, y: y + height * 0.24 });
  }
  if (!keys.has('rightTemple')) {
    extra.push({ key: 'rightTemple', x: x + width * 0.95, y: y + height * 0.24 });
  }

  const enriched: TrackedFace['landmarks'] = [...face.landmarks, ...extra];
  const namedLandmarks = buildNamedLandmarks(enriched);
  const faceShape = estimateFaceShapeFromLandmarks(namedLandmarks, face.bounds);

  return { ...face, landmarks: enriched, namedLandmarks, faceShape };
}

// ---------------------------------------------------------------------------
// VisionCamera path
// ---------------------------------------------------------------------------

export function trackedFaceFromVision(face: Face | undefined): TrackedFace {
  if (!face) {
    return {
      bounds: null,
      rollAngle: 0,
      yawAngle: 0,
      pitchAngle: 0,
      landmarks: [],
      namedLandmarks: {},
      detected: false,
      faceShape: null,
      presenceScore: 0,
    };
  }

  const landmarks: TrackedFace['landmarks'] = [];
  const map = face.landmarks;
  if (map) {
    const entries: Array<[string, { x: number; y: number } | undefined]> = [
      ['leftEye', map.LEFT_EYE],
      ['rightEye', map.RIGHT_EYE],
      ['nose', map.NOSE_BASE],
      ['mouth', map.MOUTH_BOTTOM],
      ['leftCheek', map.LEFT_CHEEK],
      ['rightCheek', map.RIGHT_CHEEK],
    ];
    for (const [key, point] of entries) {
      if (point) landmarks.push({ key, x: point.x, y: point.y });
    }
  }

  const raw: TrackedFace = {
    bounds: face.bounds,
    rollAngle: face.rollAngle ?? 0,
    yawAngle: face.yawAngle ?? 0,
    pitchAngle: face.pitchAngle ?? 0,
    landmarks,
    namedLandmarks: {},
    detected: true,
    faceShape: null,
    presenceScore: 1,
  };

  return applySmoothing(enrichLandmarks(raw));
}

// ---------------------------------------------------------------------------
// Expo Camera fallback path
// ---------------------------------------------------------------------------

export function trackedFaceFromExpo(
  face: FaceFeature | undefined,
  imageWidth: number,
  imageHeight: number,
  previewWidth: number,
  previewHeight: number,
): TrackedFace {
  if (!face?.bounds) {
    return {
      bounds: null,
      rollAngle: 0,
      yawAngle: 0,
      pitchAngle: 0,
      landmarks: [],
      namedLandmarks: {},
      detected: false,
      faceShape: null,
      presenceScore: 0,
    };
  }

  const scaleX = previewWidth / imageWidth;
  const scaleY = previewHeight / imageHeight;

  const mapPoint = (point?: { x: number; y: number }) => {
    if (!point) return null;
    return { x: point.x * scaleX, y: point.y * scaleY };
  };

  const { origin, size } = face.bounds;
  const landmarks: TrackedFace['landmarks'] = [];
  const pairs: Array<[string, { x: number; y: number } | undefined]> = [
    ['leftEye', face.leftEyePosition],
    ['rightEye', face.rightEyePosition],
    ['nose', face.noseBasePosition],
    ['mouth', face.mouthPosition],
    ['leftCheek', face.leftCheekPosition],
    ['rightCheek', face.rightCheekPosition],
  ];
  for (const [key, point] of pairs) {
    const mapped = mapPoint(point);
    if (mapped) landmarks.push({ key, ...mapped });
  }

  const raw: TrackedFace = {
    bounds: {
      x: origin.x * scaleX,
      y: origin.y * scaleY,
      width: size.width * scaleX,
      height: size.height * scaleY,
    },
    rollAngle: face.rollAngle ?? 0,
    yawAngle: face.yawAngle ?? 0,
    pitchAngle: 0,
    landmarks,
    namedLandmarks: {},
    detected: true,
    faceShape: null,
    presenceScore: 1,
  };

  return applySmoothing(enrichLandmarks(raw));
}

// ---------------------------------------------------------------------------
// MediaPipe path (Phase 2 — wired into useLiveFaceScan hook)
// ---------------------------------------------------------------------------

/**
 * Converts a MediaPipe-style landmark array (478 points) into TrackedFace.
 * Indices follow the standard MediaPipe Face Mesh topology.
 * https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker
 */
export type MediaPipeLandmark = { x: number; y: number; z: number; visibility?: number };

// Key landmark indices in the 478-point MediaPipe mesh
const MP_IDX = {
  noseBase: 4,
  noseTip: 1,
  leftEye: 468,       // left iris center (if present), else 33
  rightEye: 473,      // right iris center (if present), else 263
  leftEyeOuter: 33,
  rightEyeOuter: 263,
  leftCheek: 234,
  rightCheek: 454,
  jawLeft: 172,
  jawRight: 397,
  chin: 152,
  foreheadTop: 10,
  leftTemple: 127,
  rightTemple: 356,
  mouthTop: 13,
  mouthBottom: 14,
};

export function trackedFaceFromMediaPipe(
  rawLandmarks: MediaPipeLandmark[],
  imageWidth: number,
  imageHeight: number,
  presenceScore: number,
  headAngles?: { roll: number; yaw: number; pitch: number },
): TrackedFace {
  if (!rawLandmarks || rawLandmarks.length < 100) {
    return {
      bounds: null,
      rollAngle: 0,
      yawAngle: 0,
      pitchAngle: 0,
      landmarks: [],
      namedLandmarks: {},
      detected: false,
      faceShape: null,
      presenceScore: 0,
    };
  }

  // MediaPipe normalises to [0,1]; scale to pixel coords
  const toPixel = (lm: MediaPipeLandmark) => ({
    x: lm.x * imageWidth,
    y: lm.y * imageHeight,
  });

  // Build named landmarks from key indices
  const named: Record<string, LandmarkPoint> = {};
  for (const [name, idx] of Object.entries(MP_IDX)) {
    const lm = rawLandmarks[idx];
    if (lm) named[name] = toPixel(lm);
  }

  // Compute bounding box from a subset of perimeter landmarks
  const perimeterIdx = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397,
    365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
    162, 21, 54, 103, 67, 109];
  let minX = Infinity; let maxX = -Infinity;
  let minY = Infinity; let maxY = -Infinity;
  for (const idx of perimeterIdx) {
    const lm = rawLandmarks[idx];
    if (!lm) continue;
    const px = lm.x * imageWidth;
    const py = lm.y * imageHeight;
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
  }

  const bounds = {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };

  // Build ordered landmark list for FaceMarkers display
  const landmarks: TrackedFace['landmarks'] = Object.entries(named).map(([key, pt]) => ({
    key,
    x: pt.x,
    y: pt.y,
  }));

  const faceShape = estimateFaceShapeFromLandmarks(named, bounds);

  const raw: TrackedFace = {
    bounds,
    rollAngle: headAngles?.roll ?? 0,
    yawAngle: headAngles?.yaw ?? 0,
    pitchAngle: headAngles?.pitch ?? 0,
    landmarks,
    namedLandmarks: named,
    detected: true,
    faceShape,
    presenceScore,
  };

  return applySmoothing(raw);
}
