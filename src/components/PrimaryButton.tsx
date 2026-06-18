import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text } from 'react-native';

import { radii, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

/**
 * The standard action button. `primary` fills with the monochrome `tint` ink;
 * `muted` is a quiet secondary. Light haptic on press. Pure UI.
 */
export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'muted';
}) {
  const { colors } = useTheme();
  const bg = variant === 'primary' ? colors.tint : colors.surfaceMuted;
  const fg = variant === 'primary' ? colors.tintText : colors.text;
  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [styles.button, { backgroundColor: bg, opacity: pressed ? 0.85 : 1 }]}
    >
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radii.control,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 16, fontWeight: typography.weightSemibold },
});
