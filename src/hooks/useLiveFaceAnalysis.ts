import { useEffect, useRef, useState } from 'react';
import type { FaceShapeName } from '../ar/faceShapeAnalysis';
import { inferFaceShapeFromFace, normalizeFaceShape, smoothFaceShape } from '../ar/faceShapeAnalysis';
import type { TrackedFace } from '../ar/faceTracking';
import { AR_FEATURES } from '../config/arFeatures';

export type LiveScanPhase = 'searching' | 'aligning' | 'scanning' | 'live';

type Options = {
  scannedShapeFromContext?: string | null;
};

export function useLiveFaceAnalysis(trackedFace: TrackedFace | null, options: Options = {}) {
  const [phase, setPhase] = useState<LiveScanPhase>('searching');
  const [scanProgress, setScanProgress] = useState(0);
  const [liveShape, setLiveShape] = useState<FaceShapeName | null>(null);

  const stableRef = useRef(0);
  const phaseStartedRef = useRef(Date.now());
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const contextShape = normalizeFaceShape(options.scannedShapeFromContext);

  useEffect(() => {
    if (!AR_FEATURES.showScanPhases) {
      setPhase(trackedFace?.detected ? 'live' : 'searching');
      setScanProgress(100);
      return;
    }

    if (!trackedFace?.detected) {
      setPhase('searching');
      setScanProgress(0);
      stableRef.current = 0;
      phaseStartedRef.current = Date.now();
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    const elapsed = Date.now() - phaseStartedRef.current;
    if (phase === 'searching' && elapsed > 900) {
      setPhase('aligning');
      phaseStartedRef.current = Date.now();
    }
  }, [trackedFace?.detected, phase]);

  useEffect(() => {
    if (!trackedFace?.detected || !AR_FEATURES.showLiveFaceShape) return;

    const inferred = inferFaceShapeFromFace(trackedFace);
    const { shape, stableCount } = smoothFaceShape(liveShape, inferred, stableRef.current);
    stableRef.current = stableCount;
    if (shape && shape !== liveShape) setLiveShape(shape);
  }, [trackedFace, liveShape]);

  useEffect(() => {
    if (!AR_FEATURES.showScanPhases) return;
    if (phase !== 'aligning' || !trackedFace?.detected) return;

    const t = setTimeout(() => {
      setPhase('scanning');
      setScanProgress(8);
      phaseStartedRef.current = Date.now();

      progressTimerRef.current = setInterval(() => {
        setScanProgress((p) => {
          const next = Math.min(100, p + 7);
          if (next >= 100) {
            if (progressTimerRef.current) clearInterval(progressTimerRef.current);
            setPhase('live');
          }
          return next;
        });
      }, 420);
    }, 1400);

    return () => {
      clearTimeout(t);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [phase, trackedFace?.detected]);

  const activeShape = contextShape ?? liveShape;

  return {
    phase,
    scanProgress,
    liveShape,
    activeShape,
    isScanning: phase === 'scanning',
    isLive: phase === 'live' || !AR_FEATURES.showScanPhases,
  };
}
