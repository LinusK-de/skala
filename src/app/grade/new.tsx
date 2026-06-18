import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradeFormFields, type GradeDraft } from '@/components/GradeFormFields';
import { PrimaryButton } from '@/components/PrimaryButton';
import { addGrade, categoriesQuery, subjectsQuery, useLiveQuery } from '@/db';
import { useCurrentContext } from '@/hooks/useCareer';
import { useTheme } from '@/hooks/useTheme';
import type { Scale } from '@/lib/grades';

export default function NewGradeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ subjectId?: string }>();
  const lockedSubjectId = params.subjectId ? Number(params.subjectId) : null;

  const { stage, term } = useCurrentContext();
  const scale = (stage?.scale ?? 'grades_1_6') as Scale;
  const subjectsData = useLiveQuery(subjectsQuery(stage?.id ?? -1), [stage?.id]).data;
  const subjects = useMemo(() => subjectsData ?? [], [subjectsData]);

  const [draft, setDraft] = useState<GradeDraft>({
    subjectId: lockedSubjectId,
    value: null,
    tendency: null,
    categoryId: null,
    weight: 1,
    date: Date.now(),
    note: '',
    counts: true,
  });

  // Default the subject to the first one when none is pre-scoped.
  useEffect(() => {
    if (draft.subjectId === null && subjects.length > 0) {
      setDraft((d) => ({ ...d, subjectId: subjects[0].id }));
    }
  }, [subjects, draft.subjectId]);

  const categoriesData = useLiveQuery(categoriesQuery(draft.subjectId ?? -1), [
    draft.subjectId,
  ]).data;
  const categories = useMemo(() => categoriesData ?? [], [categoriesData]);

  // Default the category to the first available for the chosen subject.
  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.id === draft.categoryId)) {
      setDraft((d) => ({ ...d, categoryId: categories[0].id }));
    }
  }, [categories, draft.categoryId]);

  const onChange = (patch: Partial<GradeDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const canSave = draft.subjectId !== null && draft.value !== null && term !== null;

  const save = () => {
    if (draft.subjectId === null || draft.value === null || !term) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    addGrade({
      subjectId: draft.subjectId,
      categoryId: draft.categoryId,
      termId: term.id,
      value: draft.value,
      tendency: draft.tendency,
      weight: draft.weight,
      date: new Date(draft.date),
      note: draft.note.trim() || null,
      countsTowardAverage: draft.counts,
    });
    router.back();
  };

  const subjectOptions = useMemo(
    () => subjects.map((s) => ({ id: s.id, name: s.name })),
    [subjects],
  );
  const categoryOptions = useMemo(
    () => categories.map((c) => ({ id: c.id, name: c.name })),
    [categories],
  );

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {subjects.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            Lege zuerst ein Fach an, dann kannst du Noten eintragen.
          </Text>
        ) : (
          <GradeFormFields
            scale={scale}
            subjects={subjectOptions}
            categories={categoryOptions}
            lockedSubject={lockedSubjectId !== null}
            draft={draft}
            onChange={onChange}
          />
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + 12, borderTopColor: colors.border },
        ]}
      >
        <PrimaryButton label="Sichern" onPress={save} />
        {!canSave ? (
          <Text style={[styles.hint, { color: colors.textMuted }]}>Tippe eine Note an.</Text>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  empty: { fontSize: 15, lineHeight: 22, paddingVertical: 20, textAlign: 'center' },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  hint: { fontSize: 13, textAlign: 'center' },
});
