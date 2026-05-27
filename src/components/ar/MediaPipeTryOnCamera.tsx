import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  MediapipeCamera,
  RunningMode,
  useFaceLandmarkDetection,
} from 'react-native-mediapipe';
import { trackedFaceFromMediaPipe } from '../../ar/mediapipe/trackedFaceFromMediaPipe';
import type { TrackedFace } from '../../ar/faceTracking';

const MODEL = 'face_landmarker.task';

type Props = {
  height: number;
  isActive: boolean;
  onFaceUpdate: (face: TrackedFace) => void;
  children?: React.ReactNode;
};

export function MediaPipeTryOnCamera({ height, isActive, onFaceUpdate, children }: Props) {
  const onResults = useCallback(
    (bundle: Parameters<Parameters<typeof useFaceLandmarkDetection>[0]>[0], viewSize: Parameters<Parameters<typeof useFaceLandmarkDetection>[0]>[1], mirrored: boolean) => {
      const frame = { width: bundle.inputImageWidth, height: bundle.inputImageHeight };
      const landmarks = bundle.results[0]?.faceLandmarks[0] ?? [];
      onFaceUpdate(trackedFaceFromMediaPipe(landmarks, frame, viewSize, mirrored));
    },
    [onFaceUpdate],
  );

  const onError = useCallback(() => {
    onFaceUpdate({ bounds: null, rollAngle: 0, landmarks: [], detected: false });
  }, [onFaceUpdate]);

  const solution = useFaceLandmarkDetection(
    onResults,
    onError,
    RunningMode.LIVE_STREAM,
    MODEL,
    {
      mirrorMode: 'mirror-front-only',
      numFaces: 1,
    },
  );

  const onLayout = useCallback(
    (e: Parameters<typeof solution.cameraViewLayoutChangeHandler>[0]) => {
      solution.cameraViewLayoutChangeHandler(e);
    },
    [solution],
  );

  return (
    <View style={[styles.box, { height }]} onLayout={onLayout}>
      {isActive ? (
        <MediapipeCamera
          style={styles.camera}
          solution={solution}
          activeCamera="front"
          resizeMode="cover"
        />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
});
