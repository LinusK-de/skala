import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradeFormFields, type GradeDraft } from '@/components/GradeFormFields';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useUndo } from '@/components/UndoSnackbar';
import {
  addGrade,
  categoriesQuery,
  deleteGrade,
  getGrade,
  getStage,
  getSubject,
  updateGrade,
  useLiveQuery,
} from '@/db';
import { useTheme } from '@/hooks/useTheme';
import type { Scale, Tendency } from '@/lib/grades';

function loadGrade(id: number) {
  const grade = getGrade(id);
  if (!grade) return null;
  const subject = getSubject(grade.subjectId);
  const stage = subject ? getStage(subject.stageId) : null;
  return { grade, scale: (stage?.scale ?? 'grades_1_6') as Scale };
}

export default function EditGradeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showUndo } = useUndo();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);

  const loaded = useMemo(() => loadGrade(id), [id]);
  const categories =
    useLiveQuery(categoriesQuery(loaded?.grade.subjectId ?? -1), [loaded?.grade.subjectId]).data ??
    [];

  const [draft, setDraft] = useState<GradeDraft>(() =>
    loaded
      ? {
          subjectId: loaded.grade.subjectId,
          value: loaded.grade.value,
          tendency: (loaded.grade.tendency ?? null) as Tendency | null,
          categoryId: loaded.grade.categoryId,
          weight: loaded.grade.weight,
          date: loaded.grade.date.getTime(),
          note: loaded.grade.note ?? '',
          counts: loaded.grade.countsTowardAverage,
        }
      : {
          subjectId: null,
          value: null,
          tendency: null,
          categoryId: null,
          weight: 1,
          date: Date.now(),
          note: '',
          counts: true,
        },
  );

  if (!loaded) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textMuted }}>Diese Note gibt es nicht mehr.</Text>
      </View>
    );
  }

  const onChange = (patch: Partial<GradeDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const save = () => {
    if (draft.value === null) return;
    void Haptics.selectionAsync().catch(() => {});
    updateGrade(id, {
      categoryId: draft.categoryId,
      value: draft.value,
      tendency: draft.tendency,
      weight: draft.weight,
      date: new Date(draft.date),
      note: draft.note.trim() || null,
      countsTowardAverage: draft.counts,
    });
    router.back();
  };

  const remove = () => {
    const snapshot = loaded.grade;
    deleteGrade(id);
    router.back();
    showUndo('Note gelöscht', () => {
      addGrade({
        subjectId: snapshot.subjectId,
        categoryId: snapshot.categoryId,
        termId: snapshot.termId,
        value: snapshot.value,
        tendency: snapshot.tendency,
        weight: snapshot.weight,
        date: snapshot.date,
        note: snapshot.note,
        countsTowardAverage: snapshot.countsTowardAverage,
      });
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <GradeFormFields
          scale={loaded.scale}
          subjects={[]}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          lockedSubject
          draft={draft}
          onChange={onChange}
        />
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + 12, borderTopColor: colors.border },
        ]}
      >
        <PrimaryButton label="Speichern" onPress={save} />
        <PrimaryButton label="Note löschen" variant="muted" onPress={remove} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { padding: 20, paddingBottom: 32 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
});
