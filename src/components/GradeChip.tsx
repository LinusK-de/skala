import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { radii, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { Sentiment } from '@/lib/grades';

/**
 * A pill showing a grade / average, coloured by sentiment — the main place the
 * app spends colour. `positive` = sage, `warning` = red, `neutral` stays quiet.
 */
export function GradeChip({
  label,
  sentiment = 'neutral',
  size = 'md',
  style,
}: {
  label: string;
  sentiment?: Sentiment;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}) {
  const { colors, scheme } = useTheme();
  // Sentiment fills are dark in light mode (white text reads well) but PALE in
  // dark mode, where white would fail contrast — use the dark ink there instead.
  const onFill = scheme === 'dark' ? colors.tintText : '#FFFFFF';
  const palette: Record<Sentiment, { bg: string; fg: string }> = {
    positive: { bg: colors.positive, fg: onFill },
    neutral: { bg: colors.surfaceMuted, fg: colors.text },
    warning: { bg: colors.warning, fg: onFill },
  };
  const { bg, fg } = palette[sentiment];
  const dims = SIZES[size];
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: bg,
          paddingHorizontal: dims.padX,
          height: dims.height,
          minWidth: dims.height,
        },
        style,
      ]}
    >
      <Text style={[styles.label, { color: fg, fontSize: dims.font }]}>{label}</Text>
    </View>
  );
}

const SIZES = {
  sm: { height: 24, padX: 8, font: 13 },
  md: { height: 32, padX: 11, font: 15 },
  lg: { height: 44, padX: 16, font: 20 },
} as const;

const styles = StyleSheet.create({
  chip: {
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontWeight: typography.weightSemibold, fontVariant: ['tabular-nums'] },
});
