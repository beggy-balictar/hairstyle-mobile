/**
 * useLiveFaceScan
 *
 * Unified hook that normalises face-tracking output from all three
 * AR modes (legacy2D / mediapipe2D / mediapipe3D) into a single
 * TrackedFace object consumed by the Try-On screen.
 *
 * MediaPipe integration notes
 * ---------------------------
 * The `@mediapipe/tasks-vision` JS package ships a WASM/WebGL runner
 * that works on web. For native React Native we use the face data
 * already coming from react-native-vision-camera-face-detector which
 * provides ML Kit face data (landmarks, angles) in the VisionCamera
 * frame-processor pipeline.
 *
 * When a true MediaPipe native bridge becomes available for Expo (e.g.
 * via a community plugin), wire it in here by replacing the
 * `trackedFaceFromVision` call with `trackedFaceFromMediaPipe`.
 * The rest of the screen code is already agnostic.
 */

import { useCallback, useRef, useState } from 'react';
import type { Face } from 'react-native-vision-camera-face-detector';
import {
  trackedFaceFromVision,
  trackedFaceFromExpo,
  resetFaceSmoothing,
  type TrackedFace,
} from './faceTracking';
import { AR_MODE, isLegacy } from './arConfig';
import type { FaceShapeName } from './faceShapeAnalysis';

export type LiveFaceScanState = {
  trackedFace: TrackedFace | null;
  faceShape: FaceShapeName | null;
  statusText: string;
  /** Call on VisionCamera onFacesDetected */
  handleVisionFaces: (faces: Face[]) => void;
  /** Call on each expo-camera snapshot result */
  handleExpoFaces: (
    expFaces: import('expo-face-detector').FaceFeature[],
    imageWidth: number,
    imageHeight: number,
    previewWidth: number,
    previewHeight: number,
  ) => void;
  reset: () => void;
};

export function useLiveFaceScan(): LiveFaceScanState {
  const [trackedFace, setTrackedFace] = useState<TrackedFace | null>(null);
  const [statusText, setStatusText] = useState('Align your face in the frame');
  const _lastUpdate = useRef<number>(0);

  const applyFace = useCallback((face: TrackedFace) => {
    setTrackedFace(face);
    if (face.detected) {
      setStatusText(
        AR_MODE !== 'legacy2D' && face.faceShape
          ? `${face.faceShape} face · tap a style to try on`
          : 'Face tracked — tap styles below to try on',
      );
    } else {
      setStatusText('No face detected. Center your face in the frame.');
    }
  }, []);

  const handleVisionFaces = useCallback(
    (faces: Face[]) => {
      const face = trackedFaceFromVision(faces[0]);
      applyFace(face);
    },
    [applyFace],
  );

  const handleExpoFaces = useCallback(
    (
      expFaces: import('expo-face-detector').FaceFeature[],
      imageWidth: number,
      imageHeight: number,
      previewWidth: number,
      previewHeight: number,
    ) => {
      const face = trackedFaceFromExpo(
        expFaces[0],
        imageWidth,
        imageHeight,
        previewWidth,
        previewHeight,
      );
      applyFace(face);
    },
    [applyFace],
  );

  const reset = useCallback(() => {
    resetFaceSmoothing();
    setTrackedFace(null);
    setStatusText('Align your face in the frame');
  }, []);

  const faceShape = trackedFace?.faceShape ?? null;

  return { trackedFace, faceShape, statusText, handleVisionFaces, handleExpoFaces, reset };
}
