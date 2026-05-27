import { Tabs, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandLogo } from '../../src/components/BrandLogo';
import { colors } from '../../src/theme';
import { useAuth } from '../../src/context/AuthContext';

const TAB_ICON_SIZE = 26;

export default function TabsLayout() {
  const router = useRouter();
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  /** System inset (home indicator / gesture nav). Never assume iOS > 0 on all devices. */
  const systemBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 0);
  /**
   * Tab bar height is normally `49 + inset` inside React Navigation. Extra paddingTop /
   * paddingBottom without increasing height compresses the icon+label row ("sinking" labels).
   * We set an explicit total height = row + top pad + bottom pad (inset + breathing room).
   */
  const tabRow = 52;
  const tabTopPad = 8;
  const tabBottomBreathing = 12;
  const tabBarHeight = tabRow + tabTopPad + systemBottom + tabBottomBreathing;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: 'transparent' },
        headerBackground: () => (
          <LinearGradient
            colors={['#FFE9D6', '#FFF1E3', '#FFF7EF']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFillObject}
          />
        ),
        headerTitle: () => <BrandLogo width={150} height={28} gap={10} />,
        headerRight: () => (
          <Pressable
            onPress={() => {
              logout();
              router.replace('/login');
            }}
            style={{ marginRight: 16 }}
          >
            <Feather name="log-out" size={20} color={colors.textMuted} />
          </Pressable>
        ),
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          height: tabBarHeight,
          paddingTop: tabTopPad,
          paddingBottom: systemBottom + tabBottomBreathing,
          paddingHorizontal: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 0,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
          paddingHorizontal: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Feather name="grid" color={color} size={TAB_ICON_SIZE} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan Face',
          tabBarLabel: 'Scan',
          tabBarIcon: ({ color }) => <Feather name="camera" color={color} size={TAB_ICON_SIZE} />,
        }}
      />
      <Tabs.Screen
        name="try-on"
        options={{
          title: 'AR Try-On',
          tabBarLabel: 'Try-On',
          tabBarIcon: ({ color }) => <Feather name="maximize" color={color} size={TAB_ICON_SIZE} />,
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: 'Upload',
          tabBarIcon: ({ color }) => <Feather name="image" color={color} size={TAB_ICON_SIZE} />,
        }}
      />
      <Tabs.Screen
        name="recommendations"
        options={{
          title: 'Recommendations',
          tabBarLabel: 'Recommend',
          tabBarIcon: ({ color }) => <Feather name="scissors" color={color} size={TAB_ICON_SIZE} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color }) => <Feather name="bookmark" color={color} size={TAB_ICON_SIZE} />,
        }}
      />
    </Tabs>
  );
}
