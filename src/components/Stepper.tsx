import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

/** A compact −/+ numeric stepper (e.g. category weights). Clamps to [min, max]. */
export function Stepper({
  value,
  onChange,
  step = 0.5,
  min = 0,
  max = 10,
  format = (n) => String(n),
}: {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  format?: (n: number) => string;
}) {
  const { colors } = useTheme();

  const set = (next: number) => {
    const clamped = Math.max(min, Math.min(max, Math.round(next * 100) / 100));
    if (clamped !== value) {
      void Haptics.selectionAsync().catch(() => {});
      onChange(clamped);
    }
  };

  return (
    <View style={[styles.row, { backgroundColor: colors.surfaceMuted }]}>
      <Pressable onPress={() => set(value - step)} style={styles.button} hitSlop={6}>
        <Text style={[styles.symbol, { color: colors.text }]}>−</Text>
      </Pressable>
      <Text style={[styles.value, { color: colors.text }]}>{format(value)}</Text>
      <Pressable onPress={() => set(value + step)} style={styles.button} hitSlop={6}>
        <Text style={[styles.symbol, { color: colors.text }]}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.control,
    paddingHorizontal: 4,
  },
  button: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  symbol: { fontSize: 20, fontWeight: typography.weightSemibold },
  value: {
    minWidth: 44,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: typography.weightSemibold,
    fontVariant: ['tabular-nums'],
  },
});
