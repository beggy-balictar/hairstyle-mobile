import type { FaceFeature } from 'expo-face-detector';
// Face type from vision-camera-face-detector (legacy path only; inlined to avoid native install issues)
type Face = {
  bounds?: { x: number; y: number; width: number; height: number } | null;
  rollAngle?: number;
  landmarks?: {
    LEFT_EYE?: { x: number; y: number };
    RIGHT_EYE?: { x: number; y: number };
    NOSE_BASE?: { x: number; y: number };
    MOUTH_BOTTOM?: { x: number; y: number };
    LEFT_CHEEK?: { x: number; y: number };
    RIGHT_CHEEK?: { x: number; y: number };
  };
};

export type TrackedFace = {
  bounds: { x: number; y: number; width: number; height: number } | null;
  rollAngle: number;
  landmarks: Array<{ key: string; x: number; y: number }>;
  detected: boolean;
};

export type HairstylePlacement = {
  left: number;
  top: number;
  width: number;
  height: number;
  rotationDeg: number;
};

export function placementFromTrackedFace(face: TrackedFace | null): HairstylePlacement | null {
  if (!face?.detected || !face.bounds) return null;

  const { x, y, width, height } = face.bounds;
  const centerX = x + width / 2;
  const overlayWidth = width * 1.42;
  const overlayHeight = height * 0.92;

  return {
    left: centerX - overlayWidth / 2,
    top: y - overlayHeight * 0.54,
    width: overlayWidth,
    height: overlayHeight,
    rotationDeg: face.rollAngle,
  };
}

export function trackedFaceFromVision(face: Face | undefined): TrackedFace {
  if (!face) {
    return { bounds: null, rollAngle: 0, landmarks: [], detected: false };
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

  return enrichLandmarks(
    {
      bounds: face.bounds ?? null,
      rollAngle: face.rollAngle ?? 0,
      landmarks,
      detected: true,
    },
  );
}

export function trackedFaceFromExpo(
  face: FaceFeature | undefined,
  imageWidth: number,
  imageHeight: number,
  previewWidth: number,
  previewHeight: number,
): TrackedFace {
  if (!face?.bounds) {
    return { bounds: null, rollAngle: 0, landmarks: [], detected: false };
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

  return enrichLandmarks({
    bounds: {
      x: origin.x * scaleX,
      y: origin.y * scaleY,
      width: size.width * scaleX,
      height: size.height * scaleY,
    },
    rollAngle: face.rollAngle ?? 0,
    landmarks,
    detected: true,
  });
}

export function enrichLandmarks(face: TrackedFace): TrackedFace {
  if (!face.bounds) return face;

  const { x, y, width, height } = face.bounds;
  const keys = new Set(face.landmarks.map((p) => p.key));
  const extra: TrackedFace['landmarks'] = [];

  if (!keys.has('forehead')) {
    extra.push({ key: 'forehead', x: x + width / 2, y: y + height * 0.12 });
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

  return { ...face, landmarks: [...face.landmarks, ...extra] };
}
