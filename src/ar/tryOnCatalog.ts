import type { RecommendationEntry } from '../context/RecommendationContext';

export type TryOnStyle = {
  id: string;
  name: string;
  imageUri?: string | null;
  tintColor: string;
};

const DEFAULT_STYLES: TryOnStyle[] = [
  { id: 'textured-crop', name: 'Textured Crop', tintColor: '#3D2914' },
  { id: 'side-fringe', name: 'Side Fringe', tintColor: '#2C1810' },
  { id: 'classic-quiff', name: 'Classic Quiff', tintColor: '#4A3728' },
  { id: 'long-layers', name: 'Long Layers', tintColor: '#5C4033' },
  { id: 'curtain-bangs', name: 'Curtain Bangs', tintColor: '#3B2F2F' },
  { id: 'angular-lob', name: 'Angular Lob', tintColor: '#2E1F1A' },
  { id: 'soft-waves', name: 'Soft Waves', tintColor: '#4B3621' },
  { id: 'layered-bob', name: 'Layered Bob', tintColor: '#35261C' },
];

export function buildTryOnStyles(recommendations: RecommendationEntry[]): TryOnStyle[] {
  if (!recommendations.length) return DEFAULT_STYLES;

  const seen = new Set<string>();
  const merged: TryOnStyle[] = [];

  for (const item of recommendations) {
    const key = item.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push({
      id: key.replace(/\s+/g, '-'),
      name: item.name,
      imageUri: item.hairstyleImageUrl ?? null,
      tintColor: DEFAULT_STYLES[merged.length % DEFAULT_STYLES.length].tintColor,
    });
  }

  for (const preset of DEFAULT_STYLES) {
    if (merged.length >= 10) break;
    if (seen.has(preset.name.toLowerCase())) continue;
    merged.push(preset);
  }

  return merged;
}
