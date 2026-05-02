import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useRecommendations } from '../../src/context/RecommendationContext';
import { requestHairstyleAiPreview } from '../../src/services/scanApi';
import { normalizeScore } from '../../src/services/outputComposer';
import { colors, radius, spacing } from '../../src/theme';
import { resolveBackendAssetUrl } from '../../src/utils/resolveBackendUrl';

function formatMatchScore(score: number): string {
  const normalized = normalizeScore(score) * 100;
  const clamped = Math.min(99, Math.max(0, Math.round(normalized)));
  return `${clamped}%`;
}

export default function RecommendationsScreen() {
  const router = useRouter();
  const outputRef = useRef<View>(null);
  const { user } = useAuth();
  const {
    items,
    faceShape,
    sourceImageUri,
    faceUploadId,
    outputImageUri,
    setOutputImageUri,
    clearRecommendations,
    toggleSaved,
    isSaved,
  } = useRecommendations();
  const [composing, setComposing] = useState(false);
  const [aiDisplayUrl, setAiDisplayUrl] = useState<string | null>(null);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRefreshNonce, setAiRefreshNonce] = useState(0);
  const [selectedRecommendationName, setSelectedRecommendationName] = useState<string | null>(null);
  const lastCapturedAiUrl = useRef<string | null>(null);

  const normalizedFaceShape = faceShape?.toLowerCase();
  const faceShapeMatchedItems = useMemo(() => {
    if (!normalizedFaceShape) return items;
    return items.filter((item) => {
      if (!item.faceShapeTag) return true;
      return item.faceShapeTag.toLowerCase() === normalizedFaceShape;
    });
  }, [items, normalizedFaceShape]);
  const sortedItems = useMemo(
    () => [...faceShapeMatchedItems].sort((a, b) => normalizeScore(b.score) - normalizeScore(a.score)),
    [faceShapeMatchedItems],
  );
  const bestMatch = useMemo(() => {
    if (!sortedItems.length) return null;
    if (!selectedRecommendationName) return sortedItems[0];
    return sortedItems.find((item) => item.name === selectedRecommendationName) ?? sortedItems[0];
  }, [sortedItems, selectedRecommendationName]);
  const topFiveRecommendations = useMemo(() => sortedItems.slice(0, 5), [sortedItems]);
  const otherRecommendations = useMemo(() => sortedItems.slice(5), [sortedItems]);

  useEffect(() => {
    if (!sortedItems.length) {
      setSelectedRecommendationName(null);
      return;
    }
    if (!selectedRecommendationName) {
      setSelectedRecommendationName(sortedItems[0].name);
      return;
    }
    const stillExists = sortedItems.some((item) => item.name === selectedRecommendationName);
    if (!stillExists) {
      setSelectedRecommendationName(sortedItems[0].name);
    }
  }, [sortedItems, selectedRecommendationName]);

  const referenceForAiUrl = useMemo(() => {
    const direct = bestMatch?.hairstyleImageUrl?.trim();
    if (direct) return direct;
    return resolveBackendAssetUrl(bestMatch?.previewImageUrl ?? null);
  }, [bestMatch?.hairstyleImageUrl, bestMatch?.previewImageUrl]);

  const showImageUri = aiDisplayUrl || sourceImageUri;

  const captureFromRef = useCallback(async () => {
    if (!outputRef.current || !showImageUri) return;
    setComposing(true);
    try {
      const uri = await captureRef(outputRef, {
        format: 'jpg',
        quality: 0.95,
        result: 'tmpfile',
      });
      setOutputImageUri(uri);
    } catch {
      setOutputImageUri(null);
    } finally {
      setComposing(false);
    }
  }, [setOutputImageUri, showImageUri]);

  useEffect(() => {
    lastCapturedAiUrl.current = null;
  }, [aiDisplayUrl]);

  useEffect(() => {
    if (!faceUploadId || !bestMatch || !user?.token) {
      setAiDisplayUrl(null);
      setAiHint(null);
      setAiLoading(false);
      return;
    }

    let cancelled = false;
    setAiLoading(true);
    setAiHint(null);
    setAiDisplayUrl(null);
    setOutputImageUri(null);

    void (async () => {
      try {
        const res = await requestHairstyleAiPreview({
          faceUploadId,
          hairstyleName: bestMatch.name,
          hairstyleDescription: bestMatch.description,
          referenceImageUrl: referenceForAiUrl,
          token: user.token,
        });
        if (cancelled) return;
        const resolved = res.imageAbsoluteUrl || resolveBackendAssetUrl(res.imageUrl);
        if (!resolved) {
          setAiHint('Server returned an image path that could not be resolved.');
          return;
        }
        setAiDisplayUrl(resolved);
        if (res.note) setAiHint(res.note);
      } catch (e) {
        if (cancelled) return;
        const err = e as Error & { code?: string; status?: number };
        if (err.code === 'GEMINI_DISABLED') {
          setAiHint(
            'AI try-on needs a Google key on the server: set GEMINI_API_KEY in hairstyle-web .env (or .env.local), restart `npm run dev`, then tap Refresh AI.',
          );
        } else if (err.code === 'GEMINI_BAD_FORMAT') {
          setAiHint(err.message);
        } else if (err.status === 401 || err.status === 403) {
          setAiHint('Your session expired. Please log in again, then retry.');
        } else if (err.status === 429) {
          if (err.code === 'PREVIEW_DAILY_CAP') {
            setAiHint(err.message || 'Daily preview limit reached for this account.');
          } else {
            setAiHint(err.message || 'Preview limit reached. Please try again shortly.');
          }
        } else {
          setAiHint(err.message || 'Could not generate AI preview.');
        }
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    faceUploadId,
    bestMatch?.name,
    bestMatch?.description,
    user?.token,
    referenceForAiUrl,
    aiRefreshNonce,
    setOutputImageUri,
  ]);

  const handleAiImageLoaded = useCallback(() => {
    if (!aiDisplayUrl) return;
    if (lastCapturedAiUrl.current === aiDisplayUrl) return;
    lastCapturedAiUrl.current = aiDisplayUrl;
    void captureFromRef();
  }, [aiDisplayUrl, captureFromRef]);

  useEffect(() => {
    if (!sourceImageUri || !bestMatch || aiDisplayUrl || aiLoading) return;
    void captureFromRef();
  }, [sourceImageUri, bestMatch?.name, aiDisplayUrl, aiLoading, captureFromRef]);

  async function refreshAiPreview() {
    setAiRefreshNonce((n) => n + 1);
  }

  function handleSelectRecommendation(name: string) {
    if (name === selectedRecommendationName) return;
    setSelectedRecommendationName(name);
    setAiDisplayUrl(null);
    setAiHint(null);
    setOutputImageUri(null);
  }

  async function saveOutputImage() {
    const target = outputImageUri || aiDisplayUrl || sourceImageUri;
    if (!target) {
      Alert.alert('No image', 'Nothing to save yet.');
      return;
    }
    const permission = await MediaLibrary.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow media access so we can save the output image.');
      return;
    }
    await MediaLibrary.saveToLibraryAsync(target);
    Alert.alert('Saved', 'Image saved to your gallery.');
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>View Recommendations</Text>
      <Text style={styles.subtitle}>Hairstyle suggestions generated from your latest face scan.</Text>
      {faceShape ? <Text style={styles.badge}>Detected face shape: {faceShape}</Text> : null}

      {sourceImageUri && bestMatch ? (
        <View style={styles.outputCard}>
          <Text style={styles.outputTitle}>Top-Match Output</Text>
          <Text style={styles.outputSubtitle}>
            {bestMatch.name} · Match score {typeof bestMatch.score === 'number' ? formatMatchScore(bestMatch.score) : 'N/A'}
          </Text>
          {aiHint && !aiLoading ? <Text style={styles.aiHint}>{aiHint}</Text> : null}

          <View style={styles.outputPreviewWrap}>
            <View ref={outputRef} collapsable={false} style={styles.outputCanvas}>
              {showImageUri ? (
                <Image
                  source={{ uri: showImageUri }}
                  style={styles.outputBase}
                  resizeMode="cover"
                  onLoad={aiDisplayUrl ? handleAiImageLoaded : undefined}
                />
              ) : null}
            </View>
            {aiLoading ? (
              <View style={styles.aiBusy} pointerEvents="none">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.aiBusyText}>Generating your hairstyle on your photo…</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.outputActions}>
            <Pressable
              style={[styles.outputButton, (!faceUploadId || !user?.token || aiLoading) && styles.outputButtonDisabled]}
              onPress={refreshAiPreview}
              disabled={!faceUploadId || !user?.token || aiLoading}
            >
              <Text style={styles.outputButtonText}>
                {!faceUploadId ? 'AI: scan first' : aiLoading ? 'Generating…' : 'Refresh AI'}
              </Text>
            </Pressable>
            <Pressable style={styles.outputButton} onPress={saveOutputImage} disabled={composing}>
              <Text style={styles.outputButtonText}>Save Image</Text>
            </Pressable>
            <Pressable style={styles.outputButton} onPress={() => router.push('/(tabs)/scan')}>
              <Text style={styles.outputButtonText}>Retake</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {sortedItems.length > 0 ? (
        <View style={styles.listWrap}>
          <Text style={styles.sectionTitle}>Top 5 Matches for You</Text>
          {topFiveRecommendations.map((item) => (
            <Pressable
              key={`${item.name}-${item.description}`}
              style={[
                styles.card,
                styles.cardButton,
                item.name === bestMatch?.name && styles.cardSelected,
              ]}
              onPress={() => handleSelectRecommendation(item.name)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Pressable style={styles.heartButton} onPress={() => toggleSaved(item)}>
                  <Feather name="heart" size={18} color={isSaved(item.name) ? colors.danger : colors.textMuted} />
                </Pressable>
              </View>
              <Text style={styles.cardDescription}>{item.description}</Text>
              {typeof item.score === 'number' ? (
                <Text style={styles.score}>Match score: {formatMatchScore(item.score)}</Text>
              ) : null}
            </Pressable>
          ))}
          {otherRecommendations.length > 0 ? (
            <Text style={styles.sectionTitle}>Other recommendations if you want to try</Text>
          ) : null}
          {otherRecommendations.map((item) => (
            <Pressable
              key={`${item.name}-${item.description}`}
              style={[
                styles.card,
                styles.cardButton,
                item.name === bestMatch?.name && styles.cardSelected,
              ]}
              onPress={() => handleSelectRecommendation(item.name)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Pressable style={styles.heartButton} onPress={() => toggleSaved(item)}>
                  <Feather name="heart" size={18} color={isSaved(item.name) ? colors.danger : colors.textMuted} />
                </Pressable>
              </View>
              <Text style={styles.cardDescription}>{item.description}</Text>
              {typeof item.score === 'number' ? (
                <Text style={styles.score}>Match score: {formatMatchScore(item.score)}</Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderTitle}>No Recommendations Yet</Text>
          <Text style={styles.placeholderText}>Run a face scan first, then tap the recommendation button.</Text>
        </View>
      )}

      {items.length > 0 ? (
        <View style={styles.footerActions}>
          <Pressable style={styles.clearButton} onPress={clearRecommendations}>
            <Text style={styles.clearButtonText}>Clear Results</Text>
          </Pressable>
          <Pressable style={styles.clearButton} onPress={() => router.push('/(tabs)/saved')}>
            <Text style={styles.clearButtonText}>View All Saved</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  outputCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  outputTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  outputSubtitle: {
    color: colors.textMuted,
    marginBottom: 4,
  },
  aiHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  outputPreviewWrap: {
    position: 'relative',
    width: '100%',
  },
  outputCanvas: {
    width: '100%',
    height: 300,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: '#E9EDF8',
  },
  outputBase: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  aiBusy: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: radius.md,
  },
  aiBusyText: {
    marginTop: spacing.sm,
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  outputActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.xs,
  },
  outputButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  outputButtonDisabled: {
    opacity: 0.55,
  },
  outputButtonText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    color: colors.text,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  listWrap: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },
  cardButton: {
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.accentSoft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  heartButton: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDescription: {
    color: colors.textMuted,
    lineHeight: 20,
  },
  score: {
    marginTop: 2,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  placeholderCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  placeholderTitle: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  placeholderText: {
    color: colors.textMuted,
  },
  clearButton: {
    marginTop: spacing.lg,
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.md,
    paddingVertical: 11,
  },
  footerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  clearButtonText: {
    color: colors.primary,
    fontWeight: '800',
  },
});
