import type { RecommendationEntry } from '../context/RecommendationContext';
import { faceShapeMatchesTag, normalizeFaceShape, type FaceShapeName } from './faceShapeAnalysis';
import { resolveAsset } from './assets/assetCatalog';

export type TryOnStyle = {
  id: string;
  name: string;
  imageUri?: string | null;
  tintColor: string;
  /** Shapes this style is suited for (used for live highlights). */
  suitedShapes?: FaceShapeName[];
  /** True when matched to current scan / live-detected shape. */
  recommended?: boolean;
  /** Optional 3D model GLB URI (populated from assetCatalog when available). */
  model3dUrl?: string | null;
  /** Anchor profile from asset catalog. */
  anchorProfile?: string | null;
};

const DEFAULT_STYLES: TryOnStyle[] = [
  { id: 'textured-crop', name: 'Textured Crop', tintColor: '#3D2914', suitedShapes: ['Oval', 'Square'] },
  { id: 'side-fringe', name: 'Side Fringe', tintColor: '#2C1810', suitedShapes: ['Oval', 'Heart'] },
  { id: 'classic-quiff', name: 'Classic Quiff', tintColor: '#4A3728', suitedShapes: ['Oval', 'Round'] },
  { id: 'long-layers', name: 'Long Layers', tintColor: '#5C4033', suitedShapes: ['Round', 'Diamond'] },
  { id: 'curtain-bangs', name: 'Curtain Bangs', tintColor: '#3B2F2F', suitedShapes: ['Square', 'Heart'] },
  { id: 'angular-lob', name: 'Angular Lob', tintColor: '#2E1F1A', suitedShapes: ['Round', 'Diamond'] },
  { id: 'soft-waves', name: 'Soft Waves', tintColor: '#4B3621', suitedShapes: ['Square', 'Oval'] },
  { id: 'layered-bob', name: 'Layered Bob', tintColor: '#35261C', suitedShapes: ['Heart', 'Oval'] },
];

const SHAPE_PRESETS: Record<FaceShapeName, string[]> = {
  Oval: ['Textured Crop', 'Classic Quiff', 'Soft Waves', 'Layered Bob'],
  Round: ['Long Layers', 'Angular Lob', 'Classic Quiff'],
  Square: ['Soft Waves', 'Curtain Bangs', 'Textured Crop'],
  Heart: ['Curtain Bangs', 'Side Fringe', 'Layered Bob'],
  Diamond: ['Long Layers', 'Angular Lob'],
};

function markRecommended(styles: TryOnStyle[], activeShape: FaceShapeName | null): TryOnStyle[] {
  if (!activeShape) return styles;
  const presetNames = new Set(
    (SHAPE_PRESETS[activeShape] ?? []).map((n) => n.toLowerCase()),
  );
  return styles.map((style) => {
    const byTag = style.suitedShapes?.includes(activeShape);
    const byName = presetNames.has(style.name.toLowerCase());
    return { ...style, recommended: Boolean(byTag || byName) };
  });
}

export function buildTryOnStyles(
  recommendations: RecommendationEntry[],
  activeShape?: FaceShapeName | null,
): TryOnStyle[] {
  const shape = activeShape ?? null;
  let merged: TryOnStyle[] = [];

  if (recommendations.length) {
    const seen = new Set<string>();
    for (const item of recommendations) {
      const key = item.name.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const tagShape = normalizeFaceShape(item.faceShapeTag);
      merged.push({
        id: key.replace(/\s+/g, '-'),
        name: item.name,
        imageUri: item.hairstyleImageUrl ?? null,
        tintColor: DEFAULT_STYLES[merged.length % DEFAULT_STYLES.length].tintColor,
        suitedShapes: tagShape ? [tagShape] : undefined,
        recommended: faceShapeMatchesTag(shape, item.faceShapeTag),
      });
    }

    for (const preset of DEFAULT_STYLES) {
      if (merged.length >= 12) break;
      if (seen.has(preset.name.toLowerCase())) continue;
      merged.push(preset);
    }
  } else {
    merged = [...DEFAULT_STYLES];
  }

  const withAssets = merged.map((s) => {
    const asset = resolveAsset(s.id);
    if (!asset) return s;
    return {
      ...s,
      imageUri: s.imageUri ?? asset.previewImage ?? null,
      model3dUrl: asset.model3dUrl ?? null,
      anchorProfile: asset.anchorProfile ?? null,
    };
  });

  return markRecommended(withAssets, shape);
}
