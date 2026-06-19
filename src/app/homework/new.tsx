import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeworkFormFields, type HomeworkDraft } from '@/components/HomeworkFormFields';
import { PrimaryButton } from '@/components/PrimaryButton';
import { addHomework, slotsQuery, subjectsQuery, useLiveQuery } from '@/db';
import { useCurrentContext } from '@/hooks/useCareer';
import { useTheme } from '@/hooks/useTheme';
import { nextLessonOccurrences } from '@/lib/timetable';

export default function NewHomeworkScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ subjectId?: string }>();

  const { stage } = useCurrentContext();
  const slotsRes = useLiveQuery(slotsQuery());
  const subjectsRes = useLiveQuery(subjectsQuery(stage?.id ?? -1), [stage?.id]);
  const slots = useMemo(() => slotsRes.data ?? [], [slotsRes.data]);
  const subjects = useMemo(() => subjectsRes.data ?? [], [subjectsRes.data]);
  const ready = slotsRes.data !== undefined && subjectsRes.data !== undefined;

  const [draft, setDraft] = useState<HomeworkDraft>({
    subjectId: params.subjectId ? Number(params.subjectId) : null,
    title: '',
    dueMode: 'next',
    dueAt: null,
    note: '',
  });

  // Once data is loaded, establish a default subject + a due date from its next
  // lesson. Runs only until both are set; later subject changes go through onChange.
  useEffect(() => {
    if (!ready || subjects.length === 0) return;
    if (draft.subjectId !== null && draft.dueAt !== null) return;
    const sid = draft.subjectId ?? subjects[0].id;
    const occ = nextLessonOccurrences(slots, sid, new Date(), 2);
    setDraft((d) => ({
      ...d,
      subjectId: sid,
      dueMode: occ.length ? 'next' : 'manual',
      dueAt: occ.length ? occ[0].date.getTime() : Date.now(),
    }));
  }, [ready, subjects, slots, draft.subjectId, draft.dueAt]);

  const occurrences = useMemo(
    () => (draft.subjectId ? nextLessonOccurrences(slots, draft.subjectId, new Date(), 2) : []),
    [slots, draft.subjectId],
  );

  // Changing the subject re-defaults the due date to that subject's next lesson.
  const onChange = (patch: Partial<HomeworkDraft>) =>
    setDraft((d) => {
      const merged = { ...d, ...patch };
      if (patch.subjectId != null) {
        const occ = nextLessonOccurrences(slots, patch.subjectId, new Date(), 2);
        return occ.length
          ? { ...merged, dueMode: 'next' as const, dueAt: occ[0].date.getTime() }
          : { ...merged, dueMode: 'manual' as const, dueAt: merged.dueAt ?? Date.now() };
      }
      return merged;
    });

  const canSave = draft.subjectId !== null && draft.title.trim().length > 0;

  const save = () => {
    if (draft.subjectId === null || !draft.title.trim()) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    addHomework({
      subjectId: draft.subjectId,
      title: draft.title.trim(),
      dueAt: draft.dueAt != null ? new Date(draft.dueAt) : null,
      note: draft.note.trim() || null,
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {ready && subjects.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            Lege zuerst ein Fach an, dann kannst du Hausaufgaben hinzufügen.
          </Text>
        ) : (
          <HomeworkFormFields
            subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
            lockedSubject={false}
            occurrences={occurrences}
            draft={draft}
            onChange={onChange}
          />
        )}
      </ScrollView>

      {subjects.length > 0 ? (
        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + 12, borderTopColor: colors.border },
          ]}
        >
          <PrimaryButton label="Sichern" onPress={save} disabled={!canSave} />
          {!canSave ? (
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Gib der Aufgabe einen kurzen Titel.
            </Text>
          ) : null}
        </View>
      ) : null}
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
