import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import Constants from 'expo-constants';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import * as MediaLibrary from 'expo-media-library';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useCameraDevice, useCameraPermission as useVisionCameraPermission } from 'react-native-vision-camera';
import {
  Camera as VisionFaceCamera,
  type Face,
} from 'react-native-vision-camera-face-detector';
import { useRecommendations } from '../../src/context/RecommendationContext';
import {
  placementFromTrackedFace,
  trackedFaceFromExpo,
  trackedFaceFromVision,
} from '../../src/ar/faceTracking';
import type { TrackedFace } from '../../src/ar/faceTracking';
import { buildTryOnStyles } from '../../src/ar/tryOnCatalog';
import { FaceMarkers } from '../../src/components/ar/FaceMarkers';
import { HairstyleOverlay } from '../../src/components/ar/HairstyleOverlay';
import { HairstylePicker } from '../../src/components/ar/HairstylePicker';
import { colors, radius, spacing } from '../../src/theme';

const USE_EXPO_CAMERA_FALLBACK = Constants.appOwnership === 'expo';
const DETECTION_INTERVAL_MS = 280;

function applyFaceState(
  face: TrackedFace,
  setTrackedFace: (f: TrackedFace) => void,
  setStatusText: (t: string) => void,
) {
  setTrackedFace(face);
  setStatusText(
    face.detected
      ? 'Face tracked — tap styles below to try on'
      : 'No face detected. Center your face in the frame.',
  );
}

export default function TryOnScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isFocused = useIsFocused();
  const { items } = useRecommendations();
  const catalog = useMemo(() => buildTryOnStyles(items), [items]);
  const [selectedId, setSelectedId] = useState(catalog[0]?.id ?? '');
  const selectedStyle = catalog.find((s) => s.id === selectedId) ?? catalog[0];

  const [trackedFace, setTrackedFace] = useState<TrackedFace | null>(null);
  const [statusText, setStatusText] = useState('Align your face in the frame');
  const [saving, setSaving] = useState(false);
  const previewRef = useRef<View>(null);
  const expoCameraRef = useRef<CameraView>(null);
  const detectingRef = useRef(false);
  const [expoCameraReady, setExpoCameraReady] = useState(false);

  const [expoPermission, requestExpoPermission] = useCameraPermissions();
  const { hasPermission: visionPermission, requestPermission: requestVisionPermission } =
    useVisionCameraPermission();
  const frontDevice = useCameraDevice('front');

  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => setAppActive(next === 'active'));
    return () => sub.remove();
  }, []);
  const isActive = isFocused && appActive;

  const previewHeight = Math.max(height - insets.top - 200, 360);
  const placement = useMemo(() => placementFromTrackedFace(trackedFace), [trackedFace]);

  useEffect(() => {
    if (catalog.length && !catalog.some((s) => s.id === selectedId)) {
      setSelectedId(catalog[0].id);
    }
  }, [catalog, selectedId]);

  useEffect(() => {
    if (USE_EXPO_CAMERA_FALLBACK) {
      if (!expoPermission?.granted) void requestExpoPermission();
    } else if (!visionPermission) {
      void requestVisionPermission();
    }
  }, [
    USE_EXPO_CAMERA_FALLBACK,
    expoPermission?.granted,
    visionPermission,
    requestExpoPermission,
    requestVisionPermission,
  ]);

  const handleVisionFaces = useCallback((faces: Face[]) => {
    const next = trackedFaceFromVision(faces[0]);
    applyFaceState(next, setTrackedFace, setStatusText);
  }, []);

  useEffect(() => {
    if (!USE_EXPO_CAMERA_FALLBACK) return;
    if (!expoPermission?.granted || !expoCameraReady || !isActive) return;

    const timer = setInterval(() => {
      void (async () => {
        if (detectingRef.current || !expoCameraRef.current) return;
        detectingRef.current = true;
        try {
          const photo = await expoCameraRef.current.takePictureAsync({
            quality: 0.12,
            skipProcessing: true,
            shutterSound: false,
          });
          if (!photo?.uri || !photo.width || !photo.height) return;

          const result = await FaceDetector.detectFacesAsync(photo.uri, {
            mode: FaceDetector.FaceDetectorMode.fast,
            detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
            runClassifications: FaceDetector.FaceDetectorClassifications.none,
            tracking: true,
          });

          const next = trackedFaceFromExpo(
            result.faces[0],
            result.image?.width ?? photo.width,
            result.image?.height ?? photo.height,
            width,
            previewHeight,
          );
          applyFaceState(next, setTrackedFace, setStatusText);
        } catch {
          // Ignore intermittent detection errors while preview is adjusting.
        } finally {
          detectingRef.current = false;
        }
      })();
    }, DETECTION_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [USE_EXPO_CAMERA_FALLBACK, expoPermission?.granted, expoCameraReady, isActive, width, previewHeight]);

  async function ensurePermission() {
    if (USE_EXPO_CAMERA_FALLBACK) {
      if (!expoPermission?.granted) await requestExpoPermission();
      return;
    }
    if (!visionPermission) await requestVisionPermission();
  }

  const hasCameraPermission = USE_EXPO_CAMERA_FALLBACK ? expoPermission?.granted : visionPermission;

  async function savePreview() {
    if (!previewRef.current) return;
    setSaving(true);
    try {
      const mediaPermission = await MediaLibrary.requestPermissionsAsync();
      if (!mediaPermission.granted) {
        Alert.alert('Permission needed', 'Allow media access to save your try-on preview.');
        return;
      }
      const uri = await captureRef(previewRef, {
        format: 'jpg',
        quality: 0.95,
        result: 'tmpfile',
      });
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved', 'Your try-on preview was saved to the gallery.');
    } catch {
      Alert.alert('Save failed', 'Could not save the preview. Try again while your face is in frame.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={[styles.header, { paddingTop: spacing.sm }]}>
        <Text style={styles.title}>AR Try-On</Text>
        <Text style={styles.subtitle}>Live camera · no photo capture required</Text>
      </View>

      {!hasCameraPermission ? (
        <View style={styles.permissionBlock}>
          <Feather name="camera" size={40} color={colors.primary} />
          <Text style={styles.permissionText}>Camera access is needed for live hairstyle try-on.</Text>
          <Pressable style={styles.permissionButton} onPress={() => void ensurePermission()}>
            <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.previewBlock}>
          <View
            ref={previewRef}
            collapsable={false}
            style={[styles.preview, { height: previewHeight }]}
          >
            {USE_EXPO_CAMERA_FALLBACK ? (
              <CameraView
                ref={expoCameraRef}
                style={StyleSheet.absoluteFill}
                facing="front"
                onCameraReady={() => setExpoCameraReady(true)}
              />
            ) : frontDevice ? (
              <VisionFaceCamera
                style={StyleSheet.absoluteFill}
                device={frontDevice}
                isActive={isActive}
                cameraFacing="front"
                autoMode
                windowWidth={width}
                windowHeight={previewHeight}
                performanceMode="fast"
                runLandmarks
                trackingEnabled
                onFacesDetected={handleVisionFaces}
                onError={() =>
                  setStatusText('Face tracking paused. Adjust lighting or face the camera.')
                }
              />
            ) : (
              <View style={styles.noDevice}>
                <Text style={styles.noDeviceText}>Front camera is not available on this device.</Text>
              </View>
            )}

            <FaceMarkers face={trackedFace} />
            {selectedStyle ? <HairstyleOverlay style={selectedStyle} placement={placement} /> : null}

            <View style={styles.statusBar} pointerEvents="none">
              <Text style={styles.statusText}>{statusText}</Text>
              {!trackedFace?.detected ? (
                <ActivityIndicator size="small" color={colors.accent} style={styles.statusSpinner} />
              ) : null}
            </View>

            <Pressable
              style={[styles.saveFab, saving && styles.saveFabDisabled]}
              onPress={() => void savePreview()}
              disabled={saving || !trackedFace?.detected}
            >
              {saving ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <>
                  <Feather name="download" size={16} color={colors.onPrimary} />
                  <Text style={styles.saveFabText}>Save</Text>
                </>
              )}
            </Pressable>
          </View>

          {USE_EXPO_CAMERA_FALLBACK ? (
            <Text style={styles.hint}>
              Expo Go uses snapshot detection. Install the APK for smoother ML Kit live tracking.
            </Text>
          ) : null}

          <HairstylePicker styles={catalog} selectedId={selectedId} onSelect={setSelectedId} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: 2,
    fontSize: 13,
  },
  permissionBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  permissionText: {
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
  },
  permissionButtonText: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  previewBlock: {
    flex: 1,
  },
  preview: {
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusBar: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    top: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  statusText: {
    color: colors.onPrimary,
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
    flexShrink: 1,
  },
  statusSpinner: {
    marginLeft: 4,
  },
  saveFab: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  saveFabDisabled: {
    opacity: 0.65,
  },
  saveFabText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  hint: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  noDevice: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  noDeviceText: {
    color: colors.onPrimary,
    textAlign: 'center',
  },
});
