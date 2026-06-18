import { Tabs } from 'expo-router';

import { TabBarIcon } from '@/components/TabBarIcon';
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
        tabBarLabelStyle: { fontWeight: typography.weightMedium, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Heute',
          tabBarIcon: ({ color }) => <TabBarIcon name="heute" color={color} />,
        }}
      />
      <Tabs.Screen
        name="faecher"
        options={{
          title: 'Fächer',
          tabBarIcon: ({ color }) => <TabBarIcon name="faecher" color={color} />,
        }}
      />
      <Tabs.Screen
        name="verlauf"
        options={{
          title: 'Verlauf',
          tabBarIcon: ({ color }) => <TabBarIcon name="verlauf" color={color} />,
        }}
      />
      <Tabs.Screen
        name="mehr"
        options={{
          title: 'Mehr',
          tabBarIcon: ({ color }) => <TabBarIcon name="mehr" color={color} />,
        }}
      />
    </Tabs>
  );
}
