import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';

export type RecommendationEntry = {
  name: string;
  description: string;
  score?: number;
  /** Face shape this recommendation belongs to (oval/round/square) */
  faceShapeTag?: string;
  previewImageUrl?: string | null;
  /** Resolved or raw hairstyle asset URL for overlay (preview or catalog sample). */
  hairstyleImageUrl?: string | null;
};

type RecommendationContextType = {
  items: RecommendationEntry[];
  savedItems: RecommendationEntry[];
  faceShape?: string;
  sourceImageUri: string | null;
  /** Server face upload id from last scan/upload — used for AI hairstyle preview. */
  faceUploadId: string | null;
  outputImageUri: string | null;
  setRecommendations: (payload: {
    items: RecommendationEntry[];
    faceShape?: string;
    sourceImageUri?: string | null;
    faceUploadId?: string | null;
  }) => void;
  setOutputImageUri: (uri: string | null) => void;
  clearRecommendations: () => void;
  toggleSaved: (item: RecommendationEntry) => void;
  isSaved: (name: string) => boolean;
  clearSaved: () => void;
};

const RecommendationContext = createContext<RecommendationContextType | undefined>(undefined);

export function RecommendationProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<RecommendationEntry[]>([]);
  const [savedItems, setSavedItems] = useState<RecommendationEntry[]>([]);
  const [faceShape, setFaceShape] = useState<string | undefined>();
  const [sourceImageUri, setSourceImageUri] = useState<string | null>(null);
  const [faceUploadId, setFaceUploadId] = useState<string | null>(null);
  const [outputImageUri, setOutputImageUriState] = useState<string | null>(null);

  const setOutputImageUri = useCallback((uri: string | null) => {
    setOutputImageUriState(uri);
  }, []);

  const setRecommendations = useCallback(
    (payload: {
      items: RecommendationEntry[];
      faceShape?: string;
      sourceImageUri?: string | null;
      faceUploadId?: string | null;
    }) => {
      setItems(payload.items);
      setFaceShape(payload.faceShape);
      setSourceImageUri(payload.sourceImageUri ?? null);
      setFaceUploadId(payload.faceUploadId ?? null);
      setOutputImageUriState(null);
    },
    [],
  );

  const clearRecommendations = useCallback(() => {
    setItems([]);
    setFaceShape(undefined);
    setSourceImageUri(null);
    setFaceUploadId(null);
    setOutputImageUriState(null);
  }, []);

  const toggleSaved = useCallback((item: RecommendationEntry) => {
    setSavedItems((prev) => {
      const exists = prev.some((entry) => entry.name === item.name);
      if (exists) {
        return prev.filter((entry) => entry.name !== item.name);
      }
      return [item, ...prev];
    });
  }, []);

  const isSaved = useCallback(
    (name: string) => savedItems.some((entry) => entry.name === name),
    [savedItems],
  );

  const clearSaved = useCallback(() => setSavedItems([]), []);

  const value = useMemo(
    () => ({
      items,
      savedItems,
      faceShape,
      sourceImageUri,
      faceUploadId,
      outputImageUri,
      setRecommendations,
      setOutputImageUri,
      clearRecommendations,
      toggleSaved,
      isSaved,
      clearSaved,
    }),
    [
      items,
      savedItems,
      faceShape,
      sourceImageUri,
      faceUploadId,
      outputImageUri,
      setRecommendations,
      setOutputImageUri,
      clearRecommendations,
      toggleSaved,
      isSaved,
      clearSaved,
    ],
  );

  return <RecommendationContext.Provider value={value}>{children}</RecommendationContext.Provider>;
}

export function useRecommendations() {
  const context = useContext(RecommendationContext);
  if (!context) {
    throw new Error('useRecommendations must be used within RecommendationProvider.');
  }
  return context;
}
