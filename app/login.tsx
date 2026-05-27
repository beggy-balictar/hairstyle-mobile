import { useEffect, useMemo, useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandLogo } from '../src/components/BrandLogo';
import { FormField } from '../src/components/FormField';
import { checkApiConnection, getApiBaseUrl, setApiBaseUrlOverride } from '../src/config/api';
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
  const [serverUrl, setServerUrl] = useState(() => getApiBaseUrl());
  const [serverStatus, setServerStatus] = useState<'checking' | 'ok' | 'fail'>('checking');
  const [editingServer, setEditingServer] = useState(false);
  const [serverDraft, setServerDraft] = useState(() => getApiBaseUrl());

  const recheckServer = async (baseUrl?: string) => {
    if (baseUrl) {
      await setApiBaseUrlOverride(baseUrl);
      setServerUrl(baseUrl);
    }
    setServerStatus('checking');
    const result = await checkApiConnection();
    setServerUrl(result.baseUrl);
    setServerStatus(result.status === 'reachable' ? 'ok' : 'fail');
    if (result.status === 'reachable') setEditingServer(false);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await checkApiConnection();
      if (!cancelled) {
        setServerStatus(result.status === 'reachable' ? 'ok' : 'fail');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
          <View style={styles.serverRow}>
            <Text style={styles.serverLabel}>Server</Text>
            <Text style={styles.serverUrl} selectable>
              {serverUrl}
            </Text>
            <Text
              style={[
                styles.serverStatus,
                serverStatus === 'ok' && styles.serverStatusOk,
                serverStatus === 'fail' && styles.serverStatusFail,
              ]}
            >
              {serverStatus === 'checking'
                ? 'Checking connection…'
                : serverStatus === 'ok'
                  ? 'Connected'
                  : 'Not reachable. Your PC IP may have changed — edit the server URL below (e.g. http://192.168.x.x:3000), then save and retry. Also run scripts\\allow-backend-firewall.ps1 as Administrator on your PC.'}
            </Text>
            {serverStatus === 'fail' ? (
              <>
                {editingServer ? (
                  <View style={styles.serverEditBlock}>
                    <TextInput
                      value={serverDraft}
                      onChangeText={setServerDraft}
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="http://192.168.x.x:3000"
                      placeholderTextColor={colors.textMuted}
                      style={styles.serverInput}
                    />
                    <Pressable
                      onPress={() => void recheckServer(serverDraft.trim())}
                      style={styles.saveServerButton}
                    >
                      <Text style={styles.saveServerButtonText}>Save & retry</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable onPress={() => { setServerDraft(serverUrl); setEditingServer(true); }} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Change server URL</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => void recheckServer()} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Retry connection</Text>
                </Pressable>
              </>
            ) : null}
          </View>
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
    marginBottom: spacing.md,
  },
  serverRow: {
    marginBottom: spacing.lg,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serverLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  serverUrl: {
    fontSize: 12,
    color: colors.text,
    marginBottom: 6,
  },
  serverStatus: {
    fontSize: 12,
    color: colors.textMuted,
  },
  serverStatusOk: {
    color: colors.success,
  },
  serverStatusFail: {
    color: colors.danger,
  },
  retryButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  serverEditBlock: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  serverInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  saveServerButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
  },
  saveServerButtonText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 13,
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
