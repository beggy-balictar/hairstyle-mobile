import { useEffect, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../src/theme';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(Boolean(permission?.granted));
  }, [permission?.granted]);

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Scan Face</Text>
      <Text style={styles.subtitle}>
        Camera permission is required to prepare real-time facial capture.
      </Text>

      {permission?.granted ? (
        <View style={styles.cameraWrap}>
          <CameraView style={styles.camera} facing="front" />
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>
              {ready ? 'Camera is ready for face capture.' : 'Preparing camera...'}
            </Text>
          </View>
        </View>
      ) : (
        <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={requestPermission}>
          <Text style={styles.buttonText}>Allow Camera Access</Text>
        </Pressable>
      )}
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
    marginBottom: spacing.lg,
  },
  cameraWrap: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderColor: colors.border,
    borderWidth: 1,
  },
  camera: {
    flex: 1,
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
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: colors.secondary,
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
});
