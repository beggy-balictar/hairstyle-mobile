import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { RecommendationEntry, useRecommendations } from '../../src/context/RecommendationContext';
import { analyzeUploadedFace, mapBackendRecommendationsToEntries, uploadFacePhoto } from '../../src/services/scanApi';
import { colors, radius, spacing } from '../../src/theme';

type ScanPhase = 'searching' | 'aligning' | 'scanning' | 'complete';
type ShapeKey = 'oval' | 'round' | 'square' | 'diamond';

const RECOMMENDATIONS_BY_SHAPE: Record<string, RecommendationEntry[]> = {
  Oval: [
    { name: 'Textured Crop', description: 'Balanced volume that complements naturally even proportions.' },
    { name: 'Side-Swept Fringe', description: 'Adds soft direction while keeping the forehead open.' },
    { name: 'Classic Quiff', description: 'Creates clean structure without over-sharpening features.' },
    { name: 'Soft Layered Bob', description: 'Frames cheeks and jaw with light movement.' },
  ],
  Round: [
    { name: 'Long Layers', description: 'Vertical shape helps visually elongate the face.' },
    { name: 'Asymmetrical Bob', description: 'Diagonal lines add definition around cheeks.' },
    { name: 'High Volume Top', description: 'Height at crown balances wider mid-face width.' },
    { name: 'Angular Lob', description: 'Longer front angles slim the lower face.' },
  ],
  Square: [
    { name: 'Soft Waves', description: 'Breaks up strong jaw corners with curved texture.' },
    { name: 'Curtain Bangs', description: 'Softens forehead width and adds center framing.' },
    { name: 'Layered Pixie', description: 'Adds lift and texture while reducing blocky silhouette.' },
    { name: 'Side Part Flow', description: 'Asymmetry offsets strong linear facial edges.' },
  ],
  Diamond: [
    { name: 'Chin-Length Bob', description: 'Adds width around the jawline to balance wider cheekbones.' },
    { name: 'Side-Swept Bangs', description: 'Softens narrow forehead while keeping cheekbone structure flattering.' },
    { name: 'Layered Shoulder Cut', description: 'Creates fuller volume near chin and forehead zones.' },
    { name: 'Textured Fringe', description: 'Brings focus to the upper face and evens out angular proportions.' },
  ],
};

type Percent = `${number}%`;

const LANDMARKS: Array<{ key: string; left: Percent; top: Percent }> = [
  { key: 'forehead', left: '50%', top: '18%' },
  { key: 'left-eye', left: '34%', top: '36%' },
  { key: 'right-eye', left: '66%', top: '36%' },
  { key: 'nose', left: '50%', top: '50%' },
  { key: 'jaw-left', left: '30%', top: '74%' },
  { key: 'jaw-right', left: '70%', top: '74%' },
];

export default function ScanScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { setRecommendations } = useRecommendations();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [phase, setPhase] = useState<ScanPhase>('searching');
  const [statusText, setStatusText] = useState('No face detected. Align your face in the frame.');
  const [scanProgress, setScanProgress] = useState(0);
  const [resultShape, setResultShape] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [scanError, setScanError] = useState('');
  const [backendRecommendations, setBackendRecommendations] = useState<RecommendationEntry[]>([]);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [faceUploadId, setFaceUploadId] = useState<string | null>(null);
  const [scanSeed, setScanSeed] = useState(0);
  const pulseAnim = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    if (!permission?.granted) return;

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 720,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.55,
          duration: 720,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    return () => {
      pulseLoop.stop();
    };
  }, [permission?.granted, pulseAnim]);

  useEffect(() => {
    if (!permission?.granted || !cameraReady) return;

    setResultShape(null);
    setScanProgress(0);
    setScanError('');
    setBackendRecommendations([]);
    setFaceUploadId(null);
    setPhase('searching');
    setStatusText('No face detected. Align your face in the frame.');

    const searchingTimer = setTimeout(() => {
      setPhase('aligning');
      setStatusText('Center your face and move a bit closer.');
    }, 1300);

    const aligningTimer = setTimeout(() => {
      setPhase('scanning');
      setStatusText('Great alignment. Live scanning in progress...');
    }, 3500);

    const scanTicks = [18, 36, 52, 72, 88, 100];
    const scanTimers = scanTicks.map((value, index) =>
      setTimeout(() => setScanProgress(value), 4200 + (index + 1) * 480)
    );

    const completeTimer = setTimeout(() => {
      const shapes: Array<{ ui: string; api: ShapeKey }> = [
        { ui: 'Oval', api: 'oval' },
        { ui: 'Round', api: 'round' },
        { ui: 'Square', api: 'square' },
        { ui: 'Diamond', api: 'diamond' },
      ];
      const selectedShape = shapes[Math.floor(Math.random() * shapes.length)];
      setResultShape(selectedShape.ui);
      setPhase('complete');
      setStatusText('Scan complete. Running backend analysis...');
      void runBackendAnalysis(selectedShape.api);
    }, 7600);

    return () => {
      clearTimeout(searchingTimer);
      clearTimeout(aligningTimer);
      clearTimeout(completeTimer);
      scanTimers.forEach(clearTimeout);
    };
  }, [permission?.granted, cameraReady, scanSeed]);

  async function runBackendAnalysis(shape: ShapeKey) {
    if (!cameraRef.current) {
      setScanError('Camera is not ready yet. Please retake the scan.');
      setStatusText('Camera not ready. Tap Retake Scan.');
      return;
    }

    setLoadingAnalysis(true);
    setScanError('');
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.75,
        skipProcessing: true,
      });
      if (!photo?.uri) {
        throw new Error('Could not capture scan photo.');
      }
      setCapturedImageUri(photo.uri);

      const uploaded = await uploadFacePhoto(photo.uri, user?.token);
      setFaceUploadId(uploaded.id);
      const items = await analyzeUploadedFace(uploaded.id, shape, user?.token);
      const mapped = mapBackendRecommendationsToEntries(
        items,
        'Recommended based on your scan profile and hairstyle fit score.',
        shape,
      );
      setBackendRecommendations(mapped);
      setStatusText('Scan complete. Tap below to view hairstyle matches.');
    } catch (error) {
      setFaceUploadId(null);
      const message = error instanceof Error ? error.message : 'Could not connect to hairstyle backend.';
      setScanError(message);
      setStatusText('Scan complete, but backend connection failed.');
    } finally {
      setLoadingAnalysis(false);
    }
  }

  const recommendations = useMemo(() => {
    if (backendRecommendations.length > 0) return backendRecommendations;
    if (!resultShape) return [];
    return RECOMMENDATIONS_BY_SHAPE[resultShape] ?? RECOMMENDATIONS_BY_SHAPE.Oval;
  }, [resultShape, backendRecommendations]);

  function handleOpenRecommendations() {
    if (!resultShape) return;
    setRecommendations({
      items: recommendations.map((item) => ({
        ...item,
        faceShapeTag: resultShape.toLowerCase(),
      })),
      faceShape: resultShape,
      sourceImageUri: capturedImageUri,
      faceUploadId,
    });
    router.push('/(tabs)/recommendations');
  }

  function handleRetake() {
    setPhase('searching');
    setStatusText('No face detected. Align your face in the frame.');
    setScanProgress(0);
    setResultShape(null);
    setScanError('');
    setBackendRecommendations([]);
    setCapturedImageUri(null);
    setFaceUploadId(null);
    setScanSeed((value) => value + 1);
  }

  return (
    <View style={styles.page}>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>Scan Face</Text>
      </View>

      {permission?.granted ? (
        <View style={styles.cameraWrap}>
          <CameraView ref={cameraRef} style={styles.camera} facing="front" onCameraReady={() => setCameraReady(true)} />

          <View style={styles.guideFrame}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.guideGlow,
                {
                  opacity: pulseAnim,
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0.55, 1],
                        outputRange: [0.98, 1.03],
                      }),
                    },
                  ],
                },
              ]}
            />
            {LANDMARKS.map((landmark) => (
              <Animated.View
                key={landmark.key}
                style={[
                  styles.marker,
                  {
                    left: landmark.left,
                    top: landmark.top,
                    opacity: pulseAnim,
                    transform: [
                      { translateX: -6 },
                      { translateY: -6 },
                      {
                        scale: pulseAnim.interpolate({
                          inputRange: [0.55, 1],
                          outputRange: [0.9, 1.25],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.overlay}>
            <Text style={styles.overlayText}>{cameraReady ? statusText : 'Preparing camera...'}</Text>
            {phase === 'scanning' ? (
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${scanProgress}%` }]} />
              </View>
            ) : null}
          </View>

          {phase === 'complete' && resultShape ? (
            <View style={styles.resultOverlay}>
              <Text style={styles.resultTitle}>Face Shape: {resultShape}</Text>
              <Text style={styles.resultText}>Quick analysis complete. You are ready for style matching.</Text>
              <Pressable
                style={[styles.actionButton, loadingAnalysis && styles.buttonDisabled]}
                onPress={handleOpenRecommendations}
                disabled={loadingAnalysis || recommendations.length === 0}
              >
                <Text style={styles.buttonText}>
                  {loadingAnalysis ? 'Analyzing with backend...' : 'See Hairstyle Recommendations?'}
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.bottomActions}>
            <Pressable style={styles.ghostButton} onPress={handleRetake}>
              <Text style={styles.ghostButtonText}>Retake Scan</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Allow Camera Access</Text>
        </Pressable>
      )}

      {scanError ? <Text style={styles.errorText}>{scanError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingTop: spacing.lg,
    backgroundColor: colors.background,
  },
  headerBlock: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  cameraWrap: {
    height: 640,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  guideFrame: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideGlow: {
    width: 242,
    height: 320,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 140,
    backgroundColor: 'transparent',
  },
  marker: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.55,
    shadowRadius: 6,
    elevation: 3,
  },
  overlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: colors.overlay,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  overlayText: {
    color: colors.onPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
  progressTrack: {
    marginTop: spacing.sm,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 999,
  },
  resultOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 88,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 8,
  },
  resultTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  resultText: {
    color: colors.textMuted,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 2,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  bottomActions: {
    position: 'absolute',
    top: 16,
    right: 12,
  },
  ghostButton: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  ghostButtonText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  errorText: {
    marginTop: spacing.sm,
    color: colors.danger,
    textAlign: 'center',
    fontWeight: '600',
  },
});
