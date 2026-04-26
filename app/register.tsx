import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandLogo } from '../src/components/BrandLogo';
import { FormField } from '../src/components/FormField';
import { registerCustomer } from '../src/services/authApi';
import {
  formatBirthDateInput,
  validateBirthDate,
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validatePassword,
} from '../src/utils/validation';
import { colors, radius, spacing } from '../src/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const errors = useMemo(
    () => ({
      fullName: validateFullName(fullName),
      email: validateEmail(email),
      birthDate: validateBirthDate(birthDate),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    }),
    [birthDate, confirmPassword, email, fullName, password],
  );

  const onRegister = async () => {
    setSubmitAttempted(true);
    const hasError = Object.values(errors).some(Boolean);
    if (hasError) return;
    setSubmitting(true);
    setRegisterError('');
    try {
      await registerCustomer(fullName.trim(), email.trim(), password);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed.';
      setRegisterError(message);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    router.replace('/login');
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
        <Pressable style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]} onPress={() => router.replace('/login')}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Pressable style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]} onPress={() => router.replace('/')}>
          <Feather name="home" size={19} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <BrandLogo variant="stacked" iconSize={96} width={230} height={40} style={styles.brand} />
        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Complete the required fields to register.</Text>
          <FormField
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            error={submitAttempted || fullName ? errors.fullName : ''}
          />
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={submitAttempted || email ? errors.email : ''}
          />
          <FormField
            label="Birth date"
            value={birthDate}
            onChangeText={(text) => setBirthDate(formatBirthDateInput(text))}
            placeholder="1999-03-07"
            autoCapitalize="none"
            keyboardType="number-pad"
            maxLength={10}
            error={submitAttempted || birthDate ? errors.birthDate : ''}
          />
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a strong password"
            secureTextEntry
            error={submitAttempted || password ? errors.password : ''}
          />
          <FormField
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            secureTextEntry
            error={submitAttempted || confirmPassword ? errors.confirmPassword : ''}
          />

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, submitting && styles.buttonDisabled]}
            onPress={onRegister}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>{submitting ? 'Creating Account...' : 'Create Account'}</Text>
          </Pressable>
          {registerError ? <Text style={styles.registerError}>{registerError}</Text> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    padding: spacing.lg,
    paddingTop: spacing.xl + 48,
    paddingBottom: spacing.xl,
    flexGrow: 1,
    justifyContent: 'center',
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
    justifyContent: 'space-between',
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
  card: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
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
    marginBottom: spacing.lg,
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
  registerError: {
    marginTop: spacing.sm,
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
