import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useRecommendations } from '../../src/context/RecommendationContext';
import { analyzeUploadedFace, mapBackendRecommendationsToEntries, ShapeKey, uploadFacePhoto } from '../../src/services/scanApi';
import { colors, radius, spacing } from '../../src/theme';

export default function UploadScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { setRecommendations } = useRecommendations();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [message, setMessage] = useState('Select an image to start analysis.');
  const [loading, setLoading] = useState(false);

  function pickShape(): { ui: string; api: ShapeKey } {
    const shapes: Array<{ ui: string; api: ShapeKey }> = [
      { ui: 'Oval', api: 'oval' },
      { ui: 'Round', api: 'round' },
      { ui: 'Square', api: 'square' },
      { ui: 'Diamond', api: 'diamond' },
    ];
    return shapes[Math.floor(Math.random() * shapes.length)];
  }

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage('Gallery access is required to upload an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0]?.uri ?? null);
      setMessage('Image selected. Tap Analyze Upload to process with backend.');
    }
  };

  const runUploadAnalysis = async () => {
    if (!imageUri) {
      setMessage('Choose an image first.');
      return;
    }

    setLoading(true);
    setMessage('Uploading image and analyzing...');
    try {
      const selectedShape = pickShape();
      const uploaded = await uploadFacePhoto(imageUri, user?.token, 'UPLOAD');
      const items = await analyzeUploadedFace(uploaded.id, selectedShape.api, user?.token);
      const mapped = mapBackendRecommendationsToEntries(
        items,
        'Recommended based on your uploaded image and profile.',
        selectedShape.api,
      );

      setRecommendations({
        items: mapped,
        faceShape: selectedShape.ui,
        sourceImageUri: imageUri,
        faceUploadId: uploaded.id,
      });
      setMessage('Analysis complete. Opening recommendations...');
      router.push('/(tabs)/recommendations');
    } catch (error) {
      const err = error instanceof Error ? error.message : 'Upload analysis failed.';
      setMessage(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Upload Image</Text>
      <Text style={styles.subtitle}>Choose a photo from your gallery for hairstyle processing.</Text>
      <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={pickImage}>
        <Text style={styles.buttonText}>Choose from Gallery</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed, loading && styles.buttonDisabled]}
        onPress={runUploadAnalysis}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Analyzing...' : 'Analyze Upload'}</Text>
      </Pressable>
      <View style={styles.previewBox}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <Text style={styles.placeholder}>No image selected yet.</Text>
        )}
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  buttonPressed: {
    backgroundColor: colors.secondary,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  previewBox: {
    height: 280,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    color: colors.textMuted,
  },
  message: {
    marginTop: spacing.md,
    color: colors.textMuted,
  },
});
