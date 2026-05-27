import type { TrackedFace } from './faceTracking';

export type FaceShapeName = 'Oval' | 'Round' | 'Square' | 'Heart' | 'Diamond';

const SHAPES: FaceShapeName[] = ['Oval', 'Round', 'Square', 'Heart', 'Diamond'];

export function normalizeFaceShape(value?: string | null): FaceShapeName | null {
  if (!value) return null;
  const t = value.trim().toLowerCase();
  const hit = SHAPES.find((s) => s.toLowerCase() === t);
  return hit ?? null;
}

export function faceShapeMatchesTag(active: FaceShapeName | null, tag?: string | null): boolean {
  if (!active || !tag) return false;
  return normalizeFaceShape(tag) === active;
}

function landmarkMap(face: TrackedFace): Map<string, { x: number; y: number }> {
  return new Map(face.landmarks.map((p) => [p.key, p]));
}

function dist(
  a: { x: number; y: number } | undefined,
  b: { x: number; y: number } | undefined,
): number {
  if (!a || !b) return 0;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Heuristic face-shape classifier from 2D landmarks (ML Kit / MediaPipe-style points).
 * Not clinical — tuned for stable AR catalog highlighting.
 */
export function inferFaceShapeFromFace(face: TrackedFace | null): FaceShapeName | null {
  if (!face?.detected || !face.bounds) return null;

  const lm = landmarkMap(face);
  const forehead = lm.get('forehead');
  const chin = lm.get('chin');
  const leftEye = lm.get('leftEye');
  const rightEye = lm.get('rightEye');
  const leftCheek = lm.get('leftCheek');
  const rightCheek = lm.get('rightCheek');
  const jawLeft = lm.get('jawLeft');
  const jawRight = lm.get('jawRight');

  const faceHeight = dist(forehead, chin) || face.bounds.height;
  const jawWidth = dist(jawLeft, jawRight) || face.bounds.width;
  const cheekWidth = dist(leftCheek, rightCheek) || jawWidth;
  const eyeSpan = dist(leftEye, rightEye) || jawWidth * 0.55;
  const foreheadWidth = eyeSpan * 1.15;

  if (faceHeight < 40 || jawWidth < 40) return null;

  const ratio = faceHeight / jawWidth;
  const cheekToJaw = cheekWidth / jawWidth;
  const foreheadToJaw = foreheadWidth / jawWidth;

  if (cheekToJaw > 1.08 && foreheadToJaw < 0.92) return 'Diamond';
  if (foreheadToJaw > 1.05 && jawWidth < cheekWidth * 0.95) return 'Heart';
  if (ratio < 1.15 && foreheadToJaw > 0.95 && cheekToJaw < 1.05) return 'Round';
  if (ratio < 1.28 && Math.abs(foreheadToJaw - 1) < 0.08 && cheekToJaw < 1.04) return 'Square';
  return 'Oval';
}

/** Smooth shape changes so the badge does not flicker frame-to-frame. */
export function smoothFaceShape(
  previous: FaceShapeName | null,
  next: FaceShapeName | null,
  sameCount: number,
): { shape: FaceShapeName | null; stableCount: number } {
  if (!next) return { shape: previous, stableCount: 0 };
  if (next === previous) return { shape: previous, stableCount: sameCount + 1 };
  if (sameCount >= 2) return { shape: next, stableCount: 1 };
  return { shape: previous, stableCount: sameCount + 1 };
}
