import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { GradeChip } from '@/components/GradeChip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { radii, typography } from '@/constants/theme';
import { createTerm, deleteStage, getStage, setCurrentTerm, updateStage } from '@/db';
import { useCareerTrend, useCurrentContext, useStageTerms } from '@/hooks/useCareer';
import { useTheme } from '@/hooks/useTheme';
import { formatNativeAverage, scaleSpec, sentimentFor, type Scale } from '@/lib/grades';

function nextSchoolYear(sy: string): string {
  const start = parseInt(sy.slice(0, 4), 10);
  if (Number.isNaN(start)) return sy;
  const s2 = start + 1;
  return `${s2}/${String((s2 + 1) % 100).padStart(2, '0')}`;
}

export default function StageDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);

  const stage = useMemo(() => getStage(id), [id]);
  const terms = useStageTerms(id);
  const trend = useCareerTrend();
  const { term: currentTerm } = useCurrentContext();

  const [managing, setManaging] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  if (!stage) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Abschnitt' }} />
        <Text style={{ color: colors.textMuted }}>Diesen Abschnitt gibt es nicht mehr.</Text>
      </View>
    );
  }

  const scale = stage.scale as Scale;
  const nativeByTerm = new Map(trend.map((p) => [p.termId, p.native]));

  const addNextTerm = () => {
    const last = terms[terms.length - 1];
    const next = !last
      ? { gradeLevel: stage.gradeFrom, half: 1, schoolYear: '' }
      : last.half === 1
        ? { gradeLevel: last.gradeLevel, half: 2, schoolYear: last.schoolYear }
        : {
            gradeLevel: Math.min(stage.gradeTo, last.gradeLevel + 1),
            half: 1,
            schoolYear: nextSchoolYear(last.schoolYear),
          };
    createTerm({
      stageId: id,
      schoolYear: next.schoolYear,
      gradeLevel: next.gradeLevel,
      half: next.half,
      label: `${next.gradeLevel}/${next.half}`,
    });
  };

  const openManage = () => {
    setNameDraft(stage.name);
    setManaging(true);
  };

  const saveName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== stage.name) updateStage(id, { name: trimmed });
  };

  const confirmDelete = () => {
    Alert.alert(
      'Abschnitt löschen?',
      'Alle Fächer, Halbjahre und Noten dieses Abschnitts werden gelöscht.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => {
            setManaging(false);
            deleteStage(id);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: stage.name }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <Card>
          <Text style={[styles.stageName, { color: colors.text }]}>{stage.name}</Text>
          <Text style={[styles.muted, { color: colors.textMuted }]}>
            Klasse {stage.gradeFrom}–{stage.gradeTo} · {scaleSpec(scale).label}
          </Text>
        </Card>

        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Halbjahre</Text>
          {terms.length === 0 ? (
            <Text style={[styles.muted, { color: colors.textMuted }]}>Noch keine Halbjahre.</Text>
          ) : (
            terms.map((t, i) => {
              const native = nativeByTerm.get(t.id) ?? null;
              const isCurrent = currentTerm?.id === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => {
                    setCurrentTerm(t.id);
                    router.navigate('/');
                  }}
                  style={[
                    styles.row,
                    i < terms.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.rowLeft}>
                    {isCurrent ? (
                      <View style={[styles.dot, { backgroundColor: colors.tint }]} />
                    ) : (
                      <View style={styles.dotGap} />
                    )}
                    <Text style={[styles.rowName, { color: colors.text }]}>{t.label}</Text>
                  </View>
                  {native === null ? (
                    <Text style={[styles.dash, { color: colors.textMuted }]}>—</Text>
                  ) : (
                    <GradeChip
                      label={formatNativeAverage(native, scale)}
                      sentiment={sentimentFor(native, scale)}
                      size="sm"
                    />
                  )}
                </Pressable>
              );
            })
          )}
          <PrimaryButton
            label="Nächstes Halbjahr hinzufügen"
            variant="muted"
            onPress={addNextTerm}
          />
        </Card>

        <Pressable onPress={openManage} style={styles.manageBtn}>
          <Text style={[styles.manageText, { color: colors.textMuted }]}>Abschnitt verwalten</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={managing}
        transparent
        animationType="fade"
        onRequestClose={() => setManaging(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setManaging(false)}>
          <Pressable
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Abschnitt verwalten</Text>
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              onEndEditing={saveName}
              placeholder="Name"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.surfaceMuted, color: colors.text }]}
            />
            <PrimaryButton
              label="Speichern"
              onPress={() => {
                saveName();
                setManaging(false);
              }}
            />
            <Pressable onPress={confirmDelete} style={styles.deleteLink}>
              <Text style={[styles.deleteText, { color: colors.warning }]}>Abschnitt löschen</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { padding: 20, gap: 16 },
  stageName: { fontSize: 24, fontWeight: typography.weightSemibold },
  muted: { fontSize: 14, lineHeight: 20 },
  cardTitle: { fontSize: 18, fontWeight: typography.weightSemibold },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotGap: { width: 8, height: 8 },
  rowName: { fontSize: 16, fontWeight: typography.weightMedium },
  dash: { fontSize: 16 },
  manageBtn: { alignItems: 'center', paddingVertical: 8 },
  manageText: {
    fontSize: 14,
    fontWeight: typography.weightMedium,
    textDecorationLine: 'underline',
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center' },
  sheetTitle: { fontSize: 18, fontWeight: typography.weightSemibold },
  input: { height: 50, borderRadius: radii.control, paddingHorizontal: 14, fontSize: 16 },
  deleteLink: { alignItems: 'center', paddingVertical: 6 },
  deleteText: { fontSize: 14, fontWeight: typography.weightMedium },
});
