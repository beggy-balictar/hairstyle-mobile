import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
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
import { useCameraPermission as useVisionCameraPermission } from 'react-native-vision-camera';
import { useRecommendations } from '../../src/context/RecommendationContext';
import { isMediaPipeArEnabled } from '../../src/ar/arConfig';
import { normalizeFaceShape, type FaceShapeName } from '../../src/ar/faceShapeAnalysis';
import {
  placementFromTrackedFace,
  trackedFaceFromExpo,
  type TrackedFace,
} from '../../src/ar/faceTracking';
import { buildTryOnStyles } from '../../src/ar/tryOnCatalog';
import { useLiveFaceScan } from '../../src/ar/useLiveFaceScan';
import { FaceMarkers } from '../../src/components/ar/FaceMarkers';
import { FaceShapeBadge } from '../../src/components/ar/FaceShapeBadge';
import { HairstyleOverlay } from '../../src/components/ar/HairstyleOverlay';
import { HairstylePicker } from '../../src/components/ar/HairstylePicker';
import { LegacyTryOnCamera } from '../../src/components/ar/LegacyTryOnCamera';
import { MediaPipeTryOnCamera } from '../../src/components/ar/MediaPipeTryOnCamera';
import { colors, radius, spacing } from '../../src/theme';

const USE_EXPO_CAMERA_FALLBACK = Constants.appOwnership === 'expo';
const USE_MEDIAPIPE = isMediaPipeArEnabled();
const DETECTION_INTERVAL_MS = 280;
const MATCHED_CAMERA_HEIGHT = 640;

export default function TryOnScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isFocused = useIsFocused();
  const { items, faceShape: savedFaceShape } = useRecommendations();

  const [trackedFace, setTrackedFace] = useState<TrackedFace | null>(null);
  const [statusText, setStatusText] = useState('Align your face in the frame');
  const [selectedId, setSelectedId] = useState('');
  const [saving, setSaving] = useState(false);
  const previewRef = useRef<View>(null);
  const expoCameraRef = useRef<CameraView>(null);
  const detectingRef = useRef(false);
  const [expoCameraReady, setExpoCameraReady] = useState(false);

  const [expoPermission, requestExpoPermission] = useCameraPermissions();
  const { hasPermission: visionPermission, requestPermission: requestVisionPermission } =
    useVisionCameraPermission();

  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => setAppActive(next === 'active'));
    return () => sub.remove();
  }, []);
  const isActive = isFocused && appActive;

  const { phase, scanProgress, detectedShape } = useLiveFaceScan({
    trackedFace,
    enabled: isActive && Boolean(trackedFace?.detected),
  });

  const activeShape: FaceShapeName | null = useMemo(() => {
    if (detectedShape) return detectedShape;
    return normalizeFaceShape(savedFaceShape);
  }, [detectedShape, savedFaceShape]);

  const catalog = useMemo(
    () => buildTryOnStyles(items, activeShape),
    [items, activeShape],
  );

  const selectedStyle = catalog.find((s) => s.id === selectedId) ?? catalog[0];
  const placement = useMemo(() => placementFromTrackedFace(trackedFace), [trackedFace]);
  const showOverlay = Boolean(selectedStyle && trackedFace?.detected);

  useEffect(() => {
    if (catalog.length && !catalog.some((s) => s.id === selectedId)) {
      setSelectedId(catalog[0].id);
    }
  }, [catalog, selectedId]);

  const onFaceUpdate = useCallback((face: TrackedFace) => {
    setTrackedFace(face);
    setStatusText(
      face.detected
        ? 'Face tracked — tap a style below'
        : 'No face detected. Center your face in the frame.',
    );
  }, []);

  useEffect(() => {
    if (USE_MEDIAPIPE) return;
    if (USE_EXPO_CAMERA_FALLBACK) {
      if (!expoPermission?.granted) void requestExpoPermission();
    } else if (!visionPermission) {
      void requestVisionPermission();
    }
  }, [
    expoPermission?.granted,
    visionPermission,
    requestExpoPermission,
    requestVisionPermission,
  ]);

  useEffect(() => {
    if (USE_MEDIAPIPE) return;
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
            MATCHED_CAMERA_HEIGHT,
          );
          onFaceUpdate(next);
        } catch {
          // ignore
        } finally {
          detectingRef.current = false;
        }
      })();
    }, DETECTION_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [USE_EXPO_CAMERA_FALLBACK, expoPermission?.granted, expoCameraReady, isActive, width, onFaceUpdate]);

  async function ensurePermission() {
    if (USE_MEDIAPIPE) {
      if (!visionPermission) await requestVisionPermission();
      return;
    }
    if (USE_EXPO_CAMERA_FALLBACK) {
      if (!expoPermission?.granted) await requestExpoPermission();
      return;
    }
    if (!visionPermission) await requestVisionPermission();
  }

  const hasCameraPermission = USE_MEDIAPIPE
    ? visionPermission
    : USE_EXPO_CAMERA_FALLBACK
      ? expoPermission?.granted
      : visionPermission;

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

  const cameraOverlays = (
    <>
      <FaceMarkers face={trackedFace} />
      {selectedStyle ? (
        <HairstyleOverlay style={selectedStyle} placement={placement} visible={showOverlay} />
      ) : null}
      <View style={styles.statusBar} pointerEvents="none">
        <Text style={styles.statusText}>{statusText}</Text>
        {!trackedFace?.detected ? (
          <ActivityIndicator size="small" color={colors.accent} style={styles.statusSpinner} />
        ) : null}
      </View>
      <FaceShapeBadge shape={detectedShape ?? activeShape} phase={phase} progress={scanProgress} />
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
    </>
  );

  return (
    <View style={styles.page}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>AR Try-On</Text>
        <Pressable style={styles.dashboardButton} onPress={() => router.replace('/(tabs)/dashboard')}>
          <Feather name="home" size={16} color={colors.onPrimary} />
          <Text style={styles.dashboardButtonText}>Dashboard</Text>
        </Pressable>
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
            style={[styles.preview, { height: MATCHED_CAMERA_HEIGHT }]}
          >
            {USE_MEDIAPIPE ? (
              <MediaPipeTryOnCamera
                height={MATCHED_CAMERA_HEIGHT}
                isActive={isActive}
                onFaceUpdate={onFaceUpdate}
              >
                {cameraOverlays}
              </MediaPipeTryOnCamera>
            ) : (
              <LegacyTryOnCamera
                height={MATCHED_CAMERA_HEIGHT}
                width={width}
                isActive={isActive}
                expoCameraRef={expoCameraRef}
                onExpoReady={() => setExpoCameraReady(true)}
                onFaceUpdate={onFaceUpdate}
              >
                {cameraOverlays}
              </LegacyTryOnCamera>
            )}
          </View>

          {USE_MEDIAPIPE ? (
            <Text style={styles.engineHint}>MediaPipe Face Landmarker · live tracking</Text>
          ) : USE_EXPO_CAMERA_FALLBACK ? (
            <Text style={styles.engineHint}>Legacy mode · install APK for MediaPipe tracking</Text>
          ) : null}

          <View style={[styles.pickerWrap, { paddingBottom: insets.bottom + spacing.sm }]}>
            <HairstylePicker styles={catalog} selectedId={selectedId} onSelect={setSelectedId} />
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dashboardButtonText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 12,
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
  pickerWrap: {
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  preview: {
    marginHorizontal: spacing.sm,
    borderRadius: radius.md,
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
    top: spacing.sm + 44,
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
  engineHint: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: 11,
  },
});
