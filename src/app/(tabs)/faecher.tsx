import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { FAB } from '@/components/FAB';
import { GradeChip } from '@/components/GradeChip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { radii, typography } from '@/constants/theme';
import { createSubject } from '@/db';
import { useCurrentContext } from '@/hooks/useCareer';
import { useTermOverview } from '@/hooks/useGrades';
import { useTheme } from '@/hooks/useTheme';
import { defaultWeights, formatNativeAverage, sentimentFor, type Scale } from '@/lib/grades';

export default function FaecherScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { stage, term } = useCurrentContext();
  const scale = (stage?.scale ?? 'grades_1_6') as Scale;
  const overview = useTermOverview(stage?.id ?? null, term?.id ?? null, scale);

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [isCore, setIsCore] = useState(false);

  if (!stage) return <View style={[styles.flex, { backgroundColor: colors.background }]} />;

  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const weights = defaultWeights(isCore, scale);
    createSubject({
      stageId: stage.id,
      name: trimmed,
      scale,
      isCore,
      writtenWeight: weights.writtenWeight,
      oralWeight: weights.oralWeight,
    });
    setName('');
    setIsCore(false);
    setAdding(false);
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.heading, { color: colors.text }]}>Fächer</Text>
        <Pressable
          onPress={() => setAdding(true)}
          style={[styles.addBtn, { backgroundColor: colors.surfaceMuted }]}
        >
          <Text style={[styles.addBtnText, { color: colors.text }]}>＋ Fach</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 130 }]}>
        {overview.items.length === 0 ? (
          <Card>
            <EmptyState
              title="Noch keine Fächer"
              subtitle="Lege dein erstes Fach an, um Noten zu erfassen."
              actionLabel="Fach hinzufügen"
              onAction={() => setAdding(true)}
            />
          </Card>
        ) : (
          <Card>
            {overview.items.map(({ subject, average }, i) => {
              const value = average.kind === 'value' ? average.avg : null;
              return (
                <Pressable
                  key={subject.id}
                  onPress={() => router.push(`/subject/${subject.id}`)}
                  style={[
                    styles.row,
                    i < overview.items.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.rowLeft}>
                    <Text style={[styles.rowName, { color: colors.text }]}>{subject.name}</Text>
                    {subject.isCore ? (
                      <Text style={[styles.coreTag, { color: colors.textMuted }]}>Kernfach</Text>
                    ) : null}
                  </View>
                  <View style={styles.rowRight}>
                    {value === null ? (
                      <Text style={[styles.dash, { color: colors.textMuted }]}>—</Text>
                    ) : (
                      <GradeChip
                        label={formatNativeAverage(value, scale)}
                        sentiment={sentimentFor(value, scale)}
                        size="sm"
                      />
                    )}
                    <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
                  </View>
                </Pressable>
              );
            })}
          </Card>
        )}
      </ScrollView>

      <FAB onPress={() => router.push('/grade/new')} />

      <Modal
        visible={adding}
        transparent
        animationType="fade"
        onRequestClose={() => setAdding(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setAdding(false)}>
          <Pressable
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Neues Fach</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Fachname"
              placeholderTextColor={colors.textMuted}
              autoFocus
              style={[styles.input, { backgroundColor: colors.surfaceMuted, color: colors.text }]}
            />
            <View style={styles.coreRow}>
              <Text style={[styles.coreLabel, { color: colors.text }]}>
                Kernfach (schriftlich zählt mehr)
              </Text>
              <Switch
                value={isCore}
                onValueChange={setIsCore}
                trackColor={{ true: colors.tint, false: colors.surfaceMuted }}
              />
            </View>
            <PrimaryButton label="Anlegen" onPress={create} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  heading: { fontSize: 32, fontWeight: typography.weightSemibold, letterSpacing: -0.5 },
  addBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.pill },
  addBtnText: { fontSize: 14, fontWeight: typography.weightSemibold },
  content: { paddingHorizontal: 20, paddingTop: 4, gap: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowLeft: { gap: 2 },
  rowName: { fontSize: 16, fontWeight: typography.weightMedium },
  coreTag: { fontSize: 12 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dash: { fontSize: 16 },
  chevron: { fontSize: 20 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 14,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center' },
  sheetTitle: { fontSize: 18, fontWeight: typography.weightSemibold },
  input: {
    height: 50,
    borderRadius: radii.control,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  coreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  coreLabel: { fontSize: 15, flex: 1, marginRight: 12 },
});
