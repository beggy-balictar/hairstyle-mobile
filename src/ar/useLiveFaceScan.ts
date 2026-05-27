import { useEffect, useRef, useState } from 'react';
import type { FaceShapeName } from './faceShapeAnalysis';
import { inferFaceShapeFromLandmarks } from './faceShapeAnalysis';
import type { TrackedFace } from './faceTracking';

export type LiveScanPhase = 'idle' | 'aligning' | 'scanning' | 'ready';

type Options = {
  trackedFace: TrackedFace | null;
  enabled: boolean;
};

export function useLiveFaceScan({ trackedFace, enabled }: Options) {
  const [phase, setPhase] = useState<LiveScanPhase>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [detectedShape, setDetectedShape] = useState<FaceShapeName | null>(null);
  const alignedSince = useRef<number | null>(null);
  const scanStart = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setPhase('idle');
      setScanProgress(0);
      setDetectedShape(null);
      alignedSince.current = null;
      scanStart.current = null;
      return;
    }

    if (!trackedFace?.detected) {
      setPhase('idle');
      setScanProgress(0);
      setDetectedShape(null);
      alignedSince.current = null;
      scanStart.current = null;
      return;
    }

    const now = Date.now();
    if (alignedSince.current == null) {
      alignedSince.current = now;
      setPhase('aligning');
      setScanProgress(0);
      return;
    }

    const alignedMs = now - alignedSince.current;
    if (alignedMs < 900) {
      setPhase('aligning');
      setScanProgress(0);
      return;
    }

    if (scanStart.current == null) {
      scanStart.current = now;
      setPhase('scanning');
    }

    const scanMs = now - (scanStart.current ?? now);
    const progress = Math.min(100, Math.round((scanMs / 2200) * 100));
    setScanProgress(progress);
    setPhase('scanning');

    if (progress >= 100) {
      const shape = inferFaceShapeFromLandmarks(trackedFace.landmarks);
      setDetectedShape(shape);
      setPhase('ready');
    }
  }, [trackedFace, enabled]);

  return { phase, scanProgress, detectedShape };
}
