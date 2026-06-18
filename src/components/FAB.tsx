import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radii, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

/**
 * The single floating action button ("+ Note"), bottom-right above the tab bar.
 * Filled with the monochrome ink; light haptic on press.
 */
export function FAB({ label = 'Note', onPress }: { label?: string; onPress: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.fab,
        {
          backgroundColor: colors.tint,
          bottom: insets.bottom + 72,
          shadowColor: '#000',
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <Text style={[styles.plus, { color: colors.tintText }]}>＋</Text>
      <Text style={[styles.label, { color: colors.tintText }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 18,
    paddingRight: 22,
    height: 54,
    borderRadius: radii.pill,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  plus: { fontSize: 20, fontWeight: typography.weightSemibold, marginTop: -2 },
  label: { fontSize: 16, fontWeight: typography.weightSemibold },
});
