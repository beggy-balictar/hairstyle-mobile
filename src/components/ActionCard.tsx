import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';

type ActionCardProps = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
};

export const ActionCard = ({ icon, title, subtitle, onPress }: ActionCardProps) => {
  const [activeFlash, setActiveFlash] = useState(false);

  const handlePress = () => {
    setActiveFlash(true);
    // Keep the pressed color visible briefly before navigation.
    setTimeout(() => {
      onPress();
      setActiveFlash(false);
    }, 130);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, (pressed || activeFlash) && styles.cardPressed]}
      android_ripple={{ color: colors.primarySoft }}
      onPress={handlePress}
    >
      {({ pressed }) => {
        const isActive = pressed || activeFlash;
        return (
        <>
          <View style={[styles.iconWrap, isActive && styles.iconWrapPressed]}>
            <Feather name={icon} size={20} color={isActive ? colors.accent : colors.primary} />
          </View>
          <View style={styles.textWrap}>
            <Text style={[styles.title, isActive && styles.titlePressed]}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={isActive ? colors.accent : colors.textMuted} />
        </>
      );
      }}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  cardPressed: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.secondary,
    transform: [{ scale: 0.99 }],
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconWrapPressed: {
    backgroundColor: colors.accentSoft,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  titlePressed: {
    color: colors.primary,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
