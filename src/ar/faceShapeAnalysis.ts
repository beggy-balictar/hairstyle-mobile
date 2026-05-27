export type FaceShapeName = 'Oval' | 'Round' | 'Square' | 'Heart' | 'Diamond';

const SHAPES: FaceShapeName[] = ['Oval', 'Round', 'Square', 'Heart', 'Diamond'];

export function normalizeFaceShape(tag?: string | null): FaceShapeName | null {
  if (!tag?.trim()) return null;
  const key = tag.trim().toLowerCase();
  return SHAPES.find((s) => s.toLowerCase() === key) ?? null;
}

export function faceShapeMatchesTag(
  activeShape: FaceShapeName | null,
  tag?: string | null,
): boolean {
  if (!activeShape || !tag) return false;
  return normalizeFaceShape(tag) === activeShape;
}

type Point = { x: number; y: number };

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Heuristic face-shape classifier from 2D landmarks (MediaPipe-style layout).
 * Ratios are approximate; tuned for front-camera try-on.
 */
export function inferFaceShapeFromLandmarks(landmarks: Point[]): FaceShapeName | null {
  if (landmarks.length < 10) return null;

  const ys = landmarks.map((p) => p.y);
  const xs = landmarks.map((p) => p.x);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const height = maxY - minY;
  const width = maxX - minX;
  if (height < 8 || width < 8) return null;

  const aspect = width / height;
  const centerX = (minX + maxX) / 2;
  const topBand = landmarks.filter((p) => p.y < minY + height * 0.35);
  const midBand = landmarks.filter(
    (p) => p.y >= minY + height * 0.35 && p.y <= minY + height * 0.7,
  );
  const bottomBand = landmarks.filter((p) => p.y > minY + height * 0.7);

  const bandWidth = (pts: Point[]) => {
    if (pts.length < 2) return width;
    return Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x));
  };

  const foreheadW = bandWidth(topBand);
  const cheekW = bandWidth(midBand);
  const jawW = bandWidth(bottomBand);

  if (cheekW > foreheadW * 1.12 && cheekW > jawW * 1.08) return 'Diamond';
  if (foreheadW > jawW * 1.1 && aspect >= 0.88) return 'Heart';
  if (aspect >= 0.92 && aspect <= 1.05) return 'Round';
  if (aspect > 1.02 && Math.abs(foreheadW - jawW) / cheekW < 0.12) return 'Square';
  if (aspect >= 0.78 && aspect <= 0.95) return 'Oval';
  return 'Oval';
}
