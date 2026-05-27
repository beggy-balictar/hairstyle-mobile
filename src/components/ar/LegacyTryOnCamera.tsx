import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { CameraView } from 'expo-camera';
import { useCameraDevice } from 'react-native-vision-camera';
import {
  Camera as VisionFaceCamera,
  type Face,
} from 'react-native-vision-camera-face-detector';
import { trackedFaceFromVision } from '../../ar/faceTracking';
import type { TrackedFace } from '../../ar/faceTracking';

const USE_EXPO_FALLBACK = Constants.appOwnership === 'expo';

type Props = {
  height: number;
  width: number;
  isActive: boolean;
  expoCameraRef: React.RefObject<CameraView | null>;
  onExpoReady: () => void;
  onFaceUpdate: (face: TrackedFace) => void;
  children?: React.ReactNode;
};

export function LegacyTryOnCamera({
  height,
  width,
  isActive,
  expoCameraRef,
  onExpoReady,
  onFaceUpdate,
  children,
}: Props) {
  const frontDevice = useCameraDevice('front');

  const handleVisionFaces = useCallback(
    (faces: Face[]) => {
      onFaceUpdate(trackedFaceFromVision(faces[0]));
    },
    [onFaceUpdate],
  );

  if (USE_EXPO_FALLBACK) {
    return (
      <View style={[styles.box, { height }]}>
        <CameraView
          ref={expoCameraRef}
          style={StyleSheet.absoluteFill}
          facing="front"
          onCameraReady={onExpoReady}
        />
        {children}
      </View>
    );
  }

  if (!frontDevice) {
    return (
      <View style={[styles.box, { height }]}>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.box, { height }]}>
      <VisionFaceCamera
        style={StyleSheet.absoluteFill}
        device={frontDevice}
        isActive={isActive}
        cameraFacing="front"
        autoMode
        windowWidth={width}
        windowHeight={height}
        performanceMode="fast"
        runLandmarks
        trackingEnabled
        onFacesDetected={handleVisionFaces}
        onError={() =>
          onFaceUpdate({ bounds: null, rollAngle: 0, landmarks: [], detected: false })
        }
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
    backgroundColor: '#000',
  },
});
