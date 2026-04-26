import { useMemo, useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandLogo } from '../src/components/BrandLogo';
import { FormField } from '../src/components/FormField';
import { loginCustomer } from '../src/services/authApi';
import { validateEmail } from '../src/utils/validation';
import { colors, radius, spacing } from '../src/theme';
import { useAuth } from '../src/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  const emailError = useMemo(() => validateEmail(email), [email]);
  const passwordError = useMemo(() => {
    if (!password) return 'Password is required.';
    return '';
  }, [password]);

  const onLogin = async () => {
    setSubmitAttempted(true);
    if (emailError || passwordError) return;
    setSubmitting(true);
    setAuthError('');
    try {
      const result = await loginCustomer(email.trim(), password);
      login({ id: result.userId, email: email.trim(), token: result.token });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed.';
      setAuthError(message);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    router.replace('/(tabs)/dashboard');
  };

  return (
    <View style={styles.page}>
      <LinearGradient
        colors={[colors.accentSoft, colors.background, colors.secondarySoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />
      <View style={[styles.topNav, { top: insets.top + 8 }]}>
        <Pressable style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]} onPress={() => router.replace('/')}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.authWrap}>
        <BrandLogo variant="stacked" iconSize={96} width={230} height={40} style={styles.brand} />
        <View style={styles.container}>
          <Text style={styles.title}>Customer Login</Text>
          <Text style={styles.subtitle}>Sign in to access your dashboard.</Text>
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={submitAttempted || email ? emailError : ''}
          />
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            error={submitAttempted || password ? passwordError : ''}
          />
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, submitting && styles.buttonDisabled]}
            onPress={onLogin}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>{submitting ? 'Logging in...' : 'Login'}</Text>
          </Pressable>
          {authError ? <Text style={styles.authError}>{authError}</Text> : null}
          <View style={styles.createAccountRow}>
            <Text style={styles.createAccountText}>Don&apos;t have an account yet?</Text>
            <Link href="/register" style={styles.link}>
              Create Account
            </Link>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  authWrap: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  brand: {
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  topNav: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    backgroundColor: colors.primarySoft,
  },
  container: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    paddingVertical: 13,
    marginTop: spacing.xs,
  },
  buttonPressed: {
    backgroundColor: colors.secondary,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  createAccountRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  createAccountText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  authError: {
    marginTop: spacing.sm,
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
  },
  link: {
    color: colors.primary,
    fontWeight: '700',
  },
});
