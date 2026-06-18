import { Tabs } from 'expo-router';

import { typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: { backgroundColor: colors.tabBar, borderTopColor: colors.border },
        tabBarLabelStyle: { fontWeight: typography.weightMedium },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Start' }} />
      <Tabs.Screen name="settings" options={{ title: 'Einstellungen' }} />
    </Tabs>
  );
}
