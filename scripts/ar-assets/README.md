# AR Asset Pipeline

This directory contains utilities for curating 3D hairstyle assets from
Sketchfab and Meshy AI before including them in the app.

## Workflow

### 1. Download from Sketchfab
- Browse https://sketchfab.com/bonku/collections/haircut-3dcd6b5275c14fc982b868fae55d0dfe
- Download models in **glTF** format (requires free Sketchfab account).
- Note the license (most hairstyle models in this collection are CC BY).

### 2. Generate with Meshy AI
- Visit https://www.meshy.ai/workspace
- Generate hair mesh from a text prompt (e.g. "textured crop hairstyle, low poly, PBR").
- Export as **GLB**.

### 3. Optimize
Run the optimization script:
```
node scripts/ar-assets/optimizeGlb.mjs --input ./raw/myHair.glb --output ./optimized/myHair.glb
```
Target: < 50,000 triangles, Draco compression enabled.

### 4. Upload
Host the optimized GLB on your CDN or include it in the app bundle under
`assets/ar/hairstyles/`.

### 5. Register
Add an entry to `src/ar/assets/assetCatalog.ts`:

```typescript
{
  id: 'my-hairstyle',       // must match TryOnStyle.id
  name: 'My Hairstyle',
  previewImage: 'https://cdn.example.com/thumb.jpg',
  model3dUrl: 'https://cdn.example.com/myHair.glb',
  anchorProfile: 'foreheadLine',
  xScale: 1.1,
  lod: 'medium',
  source: 'Sketchfab / Artist Name',
  license: 'CC BY 4.0',
}
```

### 6. Rebuild
```
npm run build:apk
```

## Pivot Conventions

| anchorProfile  | Where to place the model origin |
|---|---|
| `topOfHead`    | At the very top of the scalp |
| `foreheadLine` | At the hairline, above the forehead |
| `centerMass`   | At geometric center (use yOffset to fine-tune) |

## Attribution
All external assets must include license and source fields in assetCatalog.ts.
Sketchfab CC BY models require crediting the original artist in the app's About screen.
