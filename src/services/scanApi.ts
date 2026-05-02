import { getApiBaseUrl } from '../config/api';
import type { RecommendationEntry } from '../context/RecommendationContext';
import { resolveBackendAssetUrl } from '../utils/resolveBackendUrl';

type UploadedFace = {
  id: string;
  imageUrl: string;
};

export type BackendRecommendation = {
  id: string;
  rank: number;
  score: number;
  reason: string;
  previewImageUrl: string | null;
  hairstyle?: {
    id: string;
    name?: string;
    description?: string | null;
    sampleImageUrl?: string | null;
  };
};

type AnalyzeResponse = {
  items?: BackendRecommendation[];
};

/** Maps API rows to in-app recommendation entries with loadable overlay URLs. */
export function mapBackendRecommendationsToEntries(
  items: BackendRecommendation[],
  descriptionFallback = 'Recommended based on your profile and hairstyle fit score.',
  faceShapeTag?: string,
): RecommendationEntry[] {
  return items
    .map((item) => {
      const rawPreview = item.previewImageUrl ?? null;
      const rawSample = item.hairstyle?.sampleImageUrl ?? null;
      const overlayRaw = rawSample ?? rawPreview;
      return {
        name: item.hairstyle?.name?.trim() || 'Recommended Style',
        description:
          item.hairstyle?.description?.trim() ||
          item.reason ||
          descriptionFallback,
        score: item.score,
        faceShapeTag: faceShapeTag?.toLowerCase(),
        previewImageUrl: rawPreview,
        hairstyleImageUrl: resolveBackendAssetUrl(overlayRaw),
      };
    })
    .filter((row) => row.name.length > 0);
}

export type ShapeKey = 'oval' | 'round' | 'square' | 'diamond';
type UploadKind = 'CAMERA' | 'UPLOAD';

function assertToken(token?: string) {
  if (!token) {
    throw new Error('Please login first so scanning can connect to your account.');
  }
}

function buildFaceShape(shape: ShapeKey) {
  const scores = {
    triangle: 0.08,
    oval: shape === 'oval' ? 0.89 : 0.2,
    round: shape === 'round' ? 0.88 : 0.2,
    square: shape === 'square' ? 0.87 : 0.2,
    oblong: 0.14,
    diamond: shape === 'diamond' ? 0.86 : 0.2,
    rectangle: 0.16,
  };
  return {
    shape,
    confidence: Math.max(scores[shape], 0.8),
    metrics: {
      faceLength: 0.72,
      foreheadWidth: 0.63,
      cheekboneWidth: 0.68,
      jawWidth: 0.62,
      dominantWidth: 0.68,
      lengthToWidthRatio: 1.12,
      jawToForeheadRatio: 0.98,
      cheekToJawRatio: 1.06,
      cheekToForeheadRatio: 1.04,
    },
    scores,
    summary: `Live scan suggests a ${shape} face shape.`,
  };
}

function buildHairType() {
  return {
    type: 'wavy' as const,
    confidence: 0.74,
    metrics: {
      regionWidth: 0.64,
      regionHeight: 0.61,
      edgeDensity: 0.58,
      textureScore: 0.66,
      orientationEntropy: 0.47,
      verticalDominance: 0.44,
      waveOscillation: 0.69,
      curlinessIndex: 0.41,
    },
    scores: {
      straight: 0.24,
      wavy: 0.74,
      curly: 0.33,
    },
    summary: 'Detected mild wave pattern in visible strands.',
  };
}

function buildHairLength() {
  return {
    length: 'medium' as const,
    confidence: 0.79,
    metrics: {
      regionWidth: 0.68,
      regionHeight: 0.7,
      hairSeedConfidence: 0.76,
      visibleTopOffsetRatio: 0.27,
      belowChinLengthRatio: 0.36,
      lowerCoverage: 0.45,
      sideCoverage: 0.52,
      lowerHalfCoverage: 0.41,
      crownHairDensity: 0.64,
      hairSkinColorDistance: 114,
    },
    scores: {
      bald: 0.02,
      short: 0.36,
      medium: 0.79,
      long: 0.31,
    },
    summary: 'Hair coverage is consistent with medium length.',
  };
}

export async function uploadFacePhoto(uri: string, token?: string, uploadType: UploadKind = 'CAMERA'): Promise<UploadedFace> {
  assertToken(token);
  const form = new FormData();
  form.append('file', {
    uri,
    name: `scan-${Date.now()}.jpg`,
    type: 'image/jpeg',
  } as any);
  form.append('uploadType', uploadType);

  const res = await fetch(`${getApiBaseUrl()}/api/upload/face`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  const payload = (await res.json().catch(() => ({}))) as UploadedFace & { error?: string };
  if (!res.ok) {
    throw new Error(payload.error || 'Face upload failed.');
  }

  if (!payload.id) {
    throw new Error('Upload succeeded but did not return a face upload id.');
  }
  return payload;
}

export async function analyzeUploadedFace(
  faceUploadId: string,
  shape: ShapeKey,
  token?: string
): Promise<BackendRecommendation[]> {
  assertToken(token);
  const res = await fetch(`${getApiBaseUrl()}/api/analyze/face`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      faceUploadId,
      faceShape: buildFaceShape(shape),
      hairType: buildHairType(),
      hairLength: buildHairLength(),
    }),
  });

  const payload = (await res.json().catch(() => ({}))) as AnalyzeResponse & { error?: string };
  if (!res.ok) {
    throw new Error(payload.error || 'Face analysis failed.');
  }

  return payload.items ?? [];
}

export type HairstylePreviewResponse = {
  imageUrl: string;
  imageAbsoluteUrl?: string;
  model?: string;
  note?: string | null;
};

/** Server-side Gemini image edit: your face photo + named hairstyle → new image URL under /uploads/generated */
export async function requestHairstyleAiPreview(params: {
  faceUploadId: string;
  hairstyleName: string;
  hairstyleDescription?: string;
  referenceImageUrl?: string | null;
  token?: string;
}): Promise<HairstylePreviewResponse> {
  assertToken(params.token);
  const res = await fetch(`${getApiBaseUrl()}/api/generate/hairstyle-preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.token}`,
    },
    body: JSON.stringify({
      faceUploadId: params.faceUploadId,
      hairstyleName: params.hairstyleName,
      hairstyleDescription: params.hairstyleDescription,
      referenceImageUrl: params.referenceImageUrl ?? null,
    }),
  });

  const payload = (await res.json().catch(() => ({}))) as HairstylePreviewResponse & {
    error?: string;
    code?: string;
  };

  if (!res.ok) {
    let fallback = 'AI hairstyle preview failed.';
    if (res.status === 401 || res.status === 403) fallback = 'Session expired. Please log in again.';
    if (res.status === 404) fallback = 'Face upload was not found. Please scan or upload again.';
    if (res.status >= 500) fallback = 'Server could not generate preview right now. Please try again.';
    const err = new Error(payload.error || fallback) as Error & { code?: string; status?: number };
    if (payload.code) err.code = payload.code;
    err.status = res.status;
    throw err;
  }

  if (!payload.imageUrl && !payload.imageAbsoluteUrl) {
    throw new Error('AI preview response missing imageUrl.');
  }

  return payload;
}
