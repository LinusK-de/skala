import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { radii, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export interface SegmentOption<T extends string | number> {
  label: string;
  value: T;
}

/**
 * A row of pill segments; the active one fills with ink. Scrolls horizontally
 * when there are many options (e.g. Jahrgangsstufen). Pure controlled UI.
 */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  scroll = false,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  scroll?: boolean;
}) {
  const { colors } = useTheme();

  const segments = options.map((opt) => {
    const active = opt.value === value;
    return (
      <Pressable
        key={String(opt.value)}
        onPress={() => {
          void Haptics.selectionAsync().catch(() => {});
          onChange(opt.value);
        }}
        style={[
          styles.segment,
          scroll && styles.segmentScroll,
          { backgroundColor: active ? colors.tint : colors.surfaceMuted },
        ]}
      >
        <Text
          style={{
            color: active ? colors.tintText : colors.text,
            fontWeight: typography.weightMedium,
          }}
        >
          {opt.label}
        </Text>
      </Pressable>
    );
  });

  if (scroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollRow}
      >
        {segments}
      </ScrollView>
    );
  }
  return <View style={styles.row}>{segments}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  scrollRow: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.control,
  },
  segmentScroll: { flex: 0, minWidth: 56 },
});
