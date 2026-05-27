/**
 * Face-shape analysis utilities.
 *
 * Provides:
 *  - FaceShapeName canonical type
 *  - Live face-shape estimation from MediaPipe landmark ratios
 *  - Normalise helpers used by catalog / Try-On UI
 */

export type FaceShapeName = 'Oval' | 'Round' | 'Square' | 'Heart' | 'Diamond';

const CANONICAL_SHAPES: FaceShapeName[] = ['Oval', 'Round', 'Square', 'Heart', 'Diamond'];

export function normalizeFaceShape(raw?: string | null): FaceShapeName | null {
  if (!raw) return null;
  const lower = raw.trim().toLowerCase();
  const match = CANONICAL_SHAPES.find((s) => s.toLowerCase() === lower);
  return match ?? null;
}

export function faceShapeMatchesTag(
  activeShape: FaceShapeName | null,
  tag?: string | null,
): boolean {
  if (!activeShape || !tag) return false;
  return tag.trim().toLowerCase() === activeShape.toLowerCase();
}

/**
 * Estimate face shape from key landmark distances.
 *
 * Landmark indices used (MediaPipe 468-point mesh):
 *   - Forehead top: 10
 *   - Chin bottom:  152
 *   - Left cheek:   234
 *   - Right cheek:  454
 *   - Left jaw:     172
 *   - Right jaw:    397
 *   - Left temple:  127
 *   - Right temple: 356
 *
 * If a simplified set (expo-face-detector or VisionCamera basic) is passed,
 * we fall back to a bounding-box heuristic.
 */
export type LandmarkPoint = { x: number; y: number };

export function estimateFaceShapeFromLandmarks(
  landmarks: Record<string, LandmarkPoint>,
  bounds?: { width: number; height: number } | null,
): FaceShapeName {
  // Full MediaPipe path - prefer landmark ratios
  const foreheadTop = landmarks['foreheadTop'];
  const chin = landmarks['chin'];
  const leftCheek = landmarks['leftCheek'];
  const rightCheek = landmarks['rightCheek'];
  const leftJaw = landmarks['jawLeft'];
  const rightJaw = landmarks['jawRight'];
  const leftTemple = landmarks['leftTemple'];
  const rightTemple = landmarks['rightTemple'];

  if (foreheadTop && chin && leftCheek && rightCheek && leftJaw && rightJaw) {
    const faceHeight = Math.abs(chin.y - foreheadTop.y);
    const cheekWidth = Math.abs(rightCheek.x - leftCheek.x);
    const jawWidth = Math.abs(rightJaw.x - leftJaw.x);
    const foreheadWidth = leftTemple && rightTemple
      ? Math.abs(rightTemple.x - leftTemple.x)
      : cheekWidth * 0.92;

    if (faceHeight <= 0 || cheekWidth <= 0) {
      return estimateFaceShapeFromBounds(bounds);
    }

    const heightToWidthRatio = faceHeight / cheekWidth;
    const jawToForeheadRatio = jawWidth / foreheadWidth;
    const jawToCheekRatio = jawWidth / cheekWidth;

    // Oval: slightly longer than wide, balanced widths
    if (heightToWidthRatio > 1.25 && jawToForeheadRatio > 0.85 && jawToCheekRatio > 0.82) {
      return 'Oval';
    }
    // Round: close to 1:1, soft jaw
    if (heightToWidthRatio < 1.15 && jawToCheekRatio > 0.85) {
      return 'Round';
    }
    // Square: wide jaw close to cheek and forehead width
    if (jawToCheekRatio > 0.9 && jawToForeheadRatio > 0.9) {
      return 'Square';
    }
    // Heart: wide forehead, narrow jaw
    if (foreheadWidth > jawWidth * 1.15 && jawToCheekRatio < 0.75) {
      return 'Heart';
    }
    // Diamond: narrow forehead + narrow jaw, wide cheeks
    if (cheekWidth > foreheadWidth * 1.1 && cheekWidth > jawWidth * 1.1) {
      return 'Diamond';
    }
    // Default Oval for intermediate results
    return 'Oval';
  }

  return estimateFaceShapeFromBounds(bounds);
}

function estimateFaceShapeFromBounds(
  bounds?: { width: number; height: number } | null,
): FaceShapeName {
  if (!bounds || bounds.width <= 0) return 'Oval';
  const ratio = bounds.height / bounds.width;
  if (ratio > 1.35) return 'Oval';
  if (ratio < 1.05) return 'Round';
  if (ratio < 1.2) return 'Square';
  return 'Oval';
}
