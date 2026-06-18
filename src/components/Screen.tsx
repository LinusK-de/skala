import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

/**
 * Themed screen container: paints the background, respects the safe-area insets
 * and applies the standard screen padding/rhythm. Pure UI — no logic.
 */
export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top + 12,
    paddingBottom: insets.bottom + 24,
    paddingHorizontal: 20,
  };
  if (scroll) {
    return (
      <ScrollView
        style={[styles.flex, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, padding]}
      >
        {children}
      </ScrollView>
    );
  }
  return (
    <View style={[styles.flex, styles.content, padding, { backgroundColor: colors.background }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 16 },
});
