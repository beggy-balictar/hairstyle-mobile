/**
 * AR Asset Catalog
 *
 * Extended metadata schema for hairstyle assets that supports:
 *  - 2D preview images (existing backend field)
 *  - 3D model URIs (Sketchfab glTF / Meshy OBJ)
 *  - Anchor profiles (where to attach the mesh relative to head pose)
 *  - LOD hints for performance management
 *  - Source attribution / license
 *
 * How to add a Sketchfab or Meshy asset
 * ----------------------------------------
 * 1. Download/export the model in glTF (.glb) format.
 * 2. Optimize with Draco compression or decimate to <50K triangles.
 * 3. Upload to your CDN / Expo asset bundle and record the URI here.
 * 4. Set anchorProfile to match how the pivot is positioned on the model.
 * 5. Rebuild the APK via `npm run build:apk`.
 *
 * Pivot conventions (anchorProfile):
 *   'topOfHead'   - model origin at top of head (standard for caps/wigs)
 *   'foreheadLine'- model origin at hairline above forehead
 *   'centerMass'  - model origin at geometric center (requires yOffset)
 */

export type AnchorProfile = 'topOfHead' | 'foreheadLine' | 'centerMass';

export type AssetLOD = 'high' | 'medium' | 'low';

export type HairstyleAssetMeta = {
  /** Matches TryOnStyle.id */
  id: string;
  /** Display name */
  name: string;
  /** 2D thumbnail for picker (can be remote URL or require()) */
  previewImage?: string | null;
  /** glTF/GLB URI for 3D rendering path */
  model3dUrl?: string | null;
  /** Anchor convention for the 3D model pivot */
  anchorProfile?: AnchorProfile;
  /** Vertical offset from anchor in face-height units (e.g. -0.1 lifts it) */
  yOffset?: number;
  /** Horizontal scale relative to face width (1.0 = exact face width) */
  xScale?: number;
  /** Preferred LOD tier */
  lod?: AssetLOD;
  /** Source attribution */
  source?: string;
  /** License string, e.g. "CC BY 4.0" */
  license?: string;
};

/**
 * Built-in asset entries.
 * model3dUrl is null for all default entries — they fall back to the
 * Skia silhouette renderer. Populate model3dUrl once you have hosted
 * optimised .glb files.
 */
export const BUILT_IN_ASSETS: HairstyleAssetMeta[] = [
  {
    id: 'textured-crop',
    name: 'Textured Crop',
    previewImage: null,
    model3dUrl: null,
    anchorProfile: 'foreheadLine',
    xScale: 1.1,
    lod: 'medium',
    source: 'Built-in',
  },
  {
    id: 'side-fringe',
    name: 'Side Fringe',
    previewImage: null,
    model3dUrl: null,
    anchorProfile: 'foreheadLine',
    xScale: 1.05,
    lod: 'medium',
    source: 'Built-in',
  },
  {
    id: 'classic-quiff',
    name: 'Classic Quiff',
    previewImage: null,
    model3dUrl: null,
    anchorProfile: 'topOfHead',
    xScale: 1.08,
    lod: 'medium',
    source: 'Built-in',
  },
  {
    id: 'long-layers',
    name: 'Long Layers',
    previewImage: null,
    model3dUrl: null,
    anchorProfile: 'topOfHead',
    xScale: 1.15,
    lod: 'low',
    source: 'Built-in',
  },
  {
    id: 'curtain-bangs',
    name: 'Curtain Bangs',
    previewImage: null,
    model3dUrl: null,
    anchorProfile: 'foreheadLine',
    xScale: 1.1,
    lod: 'medium',
    source: 'Built-in',
  },
  {
    id: 'angular-lob',
    name: 'Angular Lob',
    previewImage: null,
    model3dUrl: null,
    anchorProfile: 'topOfHead',
    xScale: 1.12,
    lod: 'low',
    source: 'Built-in',
  },
  {
    id: 'soft-waves',
    name: 'Soft Waves',
    previewImage: null,
    model3dUrl: null,
    anchorProfile: 'topOfHead',
    xScale: 1.18,
    lod: 'low',
    source: 'Built-in',
  },
  {
    id: 'layered-bob',
    name: 'Layered Bob',
    previewImage: null,
    model3dUrl: null,
    anchorProfile: 'topOfHead',
    xScale: 1.08,
    lod: 'medium',
    source: 'Built-in',
  },
];

const _assetMap = new Map<string, HairstyleAssetMeta>(
  BUILT_IN_ASSETS.map((a) => [a.id, a]),
);

/** Look up asset metadata by catalog id. */
export function resolveAsset(id: string): HairstyleAssetMeta | null {
  return _assetMap.get(id) ?? null;
}

/** Register external asset entries (called at app startup from a config JSON). */
export function registerAssets(assets: HairstyleAssetMeta[]): void {
  for (const asset of assets) {
    _assetMap.set(asset.id, asset);
  }
}
