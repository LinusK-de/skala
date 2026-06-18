import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { scaleSpec, type Scale, type Tendency } from '@/lib/grades';

/**
 * The scale-aware tap grid — the centrepiece of fast entry. Renders the cell set
 * from `scaleSpec` (1+…6 for grades, 15…0 for points); tapping a cell is the only
 * required input. Never a keyboard or picker wheel.
 */
export function GradeGrid({
  scale,
  value,
  tendency,
  onSelect,
}: {
  scale: Scale;
  value: number | null;
  tendency: Tendency | null;
  onSelect: (value: number, tendency: Tendency | null) => void;
}) {
  const { colors } = useTheme();
  const cells = scaleSpec(scale).cells;

  return (
    <View style={styles.grid}>
      {cells.map((cell) => {
        const active = value === cell.value && (tendency ?? null) === (cell.tendency ?? null);
        return (
          <Pressable
            key={cell.label}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onSelect(cell.value, cell.tendency);
            }}
            style={[
              styles.cell,
              {
                backgroundColor: active ? colors.tint : colors.surfaceMuted,
                borderColor: active ? colors.tint : 'transparent',
              },
            ]}
          >
            <Text style={[styles.cellText, { color: active ? colors.tintText : colors.text }]}>
              {cell.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cell: {
    width: '23%',
    aspectRatio: 1.35,
    marginBottom: 8,
    borderRadius: radii.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 18,
    fontWeight: typography.weightSemibold,
    fontVariant: ['tabular-nums'],
  },
});
