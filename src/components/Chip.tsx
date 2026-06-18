import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text } from 'react-native';

import { radii, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

/** A toggleable selection chip (onboarding subjects, category pickers). */
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.tint : colors.surface,
          borderColor: selected ? colors.tint : colors.border,
        },
      ]}
    >
      <Text
        style={{
          color: selected ? colors.tintText : colors.text,
          fontWeight: typography.weightMedium,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
