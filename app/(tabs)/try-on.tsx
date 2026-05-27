/**
 * AR Try-On Screen
 *
 * AR_MODE (src/ar/arConfig.ts) controls the active pipeline:
 *  'legacy2D'    - VisionCamera / Expo Camera + no 3D overlay (original behavior)
 *  'mediapipe2D' - Enhanced tracking + Skia silhouette overlay + face-shape chip
 *  'mediapipe3D' - As above but activates 3D mesh path when model3dUrl is present
 *
 * Rollback: set AR_MODE = 'legacy2D' in arConfig.ts and rebuild.
 */

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
import { useCameraDevice, useCameraPermission as useVisionCameraPermission } from 'react-native-vision-camera';
import {
  Camera as VisionFaceCamera,
  type Face,
} from 'react-native-vision-camera-face-detector';
import { useRecommendations } from '../../src/context/RecommendationContext';
import { buildTryOnStyles } from '../../src/ar/tryOnCatalog';
import { FaceMarkers } from '../../src/components/ar/FaceMarkers';
import { HairstylePicker } from '../../src/components/ar/HairstylePicker';
import { HairstyleRenderer } from '../../src/ar/renderer/HairstyleRenderer';
import { useLiveFaceScan } from '../../src/ar/useLiveFaceScan';
import { AR_MODE, isLegacy } from '../../src/ar/arConfig';
import { colors, radius, spacing } from '../../src/theme';

const USE_EXPO_CAMERA_FALLBACK = Constants.appOwnership === 'expo';
const DETECTION_INTERVAL_MS = 280;
const MATCHED_CAMERA_HEIGHT = 640;

export default function TryOnScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isFocused = useIsFocused();
  const { items, faceShape: savedFaceShape } = useRecommendations();

  const { trackedFace, faceShape: liveFaceShape, statusText, handleVisionFaces, handleExpoFaces, reset } =
    useLiveFaceScan();

  // Prefer live-detected shape, fall back to recommendation-context shape
  const activeFaceShape = liveFaceShape ?? (savedFaceShape ? savedFaceShape as import('../../src/ar/faceShapeAnalysis').FaceShapeName : null);

  const catalog = useMemo(
    () => buildTryOnStyles(items, activeFaceShape),
    [items, activeFaceShape],
  );
  const [selectedId, setSelectedId] = useState(catalog[0]?.id ?? '');
  const selectedStyle = useMemo(
    () => catalog.find((s) => s.id === selectedId) ?? null,
    [catalog, selectedId],
  );

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

  // Reset smoothing state when screen loses focus
  useEffect(() => {
    if (!isFocused) reset();
  }, [isFocused, reset]);

  const isActive = isFocused && appActive;
  const previewHeight = MATCHED_CAMERA_HEIGHT;

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

  // Expo Camera snapshot polling (Expo Go fallback)
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

          handleExpoFaces(
            result.faces,
            result.image?.width ?? photo.width,
            result.image?.height ?? photo.height,
            width,
            previewHeight,
          );
        } catch {
          // Ignore intermittent detection errors while preview is adjusting.
        } finally {
          detectingRef.current = false;
        }
      })();
    }, DETECTION_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [
    USE_EXPO_CAMERA_FALLBACK,
    expoPermission?.granted,
    expoCameraReady,
    isActive,
    width,
    previewHeight,
    handleExpoFaces,
  ]);

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
                onFacesDetected={(faces: Face[]) => handleVisionFaces(faces)}
                onError={() => {/* handled by statusText */}}
              />
            ) : (
              <View style={styles.noDevice}>
                <Text style={styles.noDeviceText}>Front camera is not available on this device.</Text>
              </View>
            )}

            {/* Face tracking markers and scan ring */}
            <FaceMarkers face={trackedFace} />

            {/* Hairstyle overlay — gated by AR_MODE */}
            {!isLegacy(AR_MODE) ? (
              <HairstyleRenderer face={trackedFace} style={selectedStyle} />
            ) : null}

            {/* Status bar */}
            <View style={styles.statusBar} pointerEvents="none">
              <Text style={styles.statusText}>{statusText}</Text>
              {!trackedFace?.detected ? (
                <ActivityIndicator size="small" color={colors.accent} style={styles.statusSpinner} />
              ) : null}
            </View>

            {/* Save FAB */}
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

          <View style={[styles.pickerWrap, { paddingBottom: insets.bottom + spacing.sm }]}>
            <HairstylePicker
              styles={catalog}
              selectedId={selectedId}
              onSelect={setSelectedId}
              faceShape={activeFaceShape}
            />
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
  },
  preview: {
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
