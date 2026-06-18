import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radii, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export interface TermOption {
  id: number;
  label: string;
  sub: string;
}

/**
 * The quiet term context switcher in the dashboard header ("11/1 ▾"). Tapping it
 * opens a bottom list of all terms grouped only by their stage label.
 */
export function TermSelector({
  current,
  options,
  onSelect,
}: {
  current: TermOption | null;
  options: TermOption[];
  onSelect: (id: number) => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  if (!current) return null;

  return (
    <>
      <Pressable
        onPress={() => {
          void Haptics.selectionAsync().catch(() => {});
          setOpen(true);
        }}
        style={[styles.trigger, { backgroundColor: colors.surfaceMuted }]}
      >
        <Text style={[styles.triggerText, { color: colors.text }]}>{current.label}</Text>
        <Text style={[styles.caret, { color: colors.textMuted }]}>⌄</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Halbjahr wählen</Text>
            <ScrollView style={styles.list}>
              {options.map((opt) => {
                const active = opt.id === current.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => {
                      onSelect(opt.id);
                      setOpen(false);
                    }}
                    style={[styles.row, { borderBottomColor: colors.border }]}
                  >
                    <View style={styles.rowText}>
                      <Text style={[styles.rowLabel, { color: colors.text }]}>{opt.label}</Text>
                      <Text style={[styles.rowSub, { color: colors.textMuted }]}>{opt.sub}</Text>
                    </View>
                    {active ? <Text style={[styles.check, { color: colors.tint }]}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
  },
  triggerText: { fontSize: 15, fontWeight: typography.weightSemibold },
  caret: { fontSize: 14, marginTop: -2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '70%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: typography.weightSemibold, marginBottom: 8 },
  list: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: { gap: 2 },
  rowLabel: { fontSize: 16, fontWeight: typography.weightMedium },
  rowSub: { fontSize: 13 },
  check: { fontSize: 16, fontWeight: typography.weightSemibold },
});
