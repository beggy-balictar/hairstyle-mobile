import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../src/theme';

export default function UploadScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [message, setMessage] = useState('Select an image to start analysis.');

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
      setMessage('Image selected. Ready for backend processing.');
    }
  };

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Upload Image</Text>
      <Text style={styles.subtitle}>Choose a photo from your gallery for hairstyle processing.</Text>
      <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={pickImage}>
        <Text style={styles.buttonText}>Choose from Gallery</Text>
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
    marginBottom: spacing.md,
  },
  buttonPressed: {
    backgroundColor: colors.secondary,
    transform: [{ scale: 0.99 }],
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
