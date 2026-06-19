import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeworkFormFields, type HomeworkDraft } from '@/components/HomeworkFormFields';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useUndo } from '@/components/UndoSnackbar';
import {
  addHomework,
  deleteHomework,
  getHomework,
  getSubject,
  setHomeworkDone,
  slotsQuery,
  updateHomework,
  useLiveQuery,
} from '@/db';
import { typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { nextLessonOccurrences } from '@/lib/timetable';

export default function EditHomeworkScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showUndo } = useUndo();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);

  const loaded = useMemo(() => {
    const item = getHomework(id);
    if (!item) return null;
    const subject = getSubject(item.subjectId);
    return { item, subjectName: subject?.name ?? '—' };
  }, [id]);

  const slotsData = useLiveQuery(slotsQuery()).data;

  const [draft, setDraft] = useState<HomeworkDraft>(() =>
    loaded
      ? {
          subjectId: loaded.item.subjectId,
          title: loaded.item.title,
          dueMode: 'manual',
          dueAt: loaded.item.dueAt ? loaded.item.dueAt.getTime() : null,
          note: loaded.item.note ?? '',
        }
      : { subjectId: null, title: '', dueMode: 'manual', dueAt: null, note: '' },
  );
  const [done, setDoneState] = useState(loaded?.item.done ?? false);

  const occurrences = useMemo(
    () =>
      draft.subjectId ? nextLessonOccurrences(slotsData ?? [], draft.subjectId, new Date(), 2) : [],
    [slotsData, draft.subjectId],
  );

  if (!loaded) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textMuted }}>Diese Hausaufgabe gibt es nicht mehr.</Text>
      </View>
    );
  }

  const onChange = (patch: Partial<HomeworkDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const toggleDone = (value: boolean) => {
    setDoneState(value);
    setHomeworkDone(id, value);
  };

  const save = () => {
    if (draft.subjectId === null || !draft.title.trim()) return;
    void Haptics.selectionAsync().catch(() => {});
    updateHomework(id, {
      title: draft.title.trim(),
      dueAt: draft.dueAt != null ? new Date(draft.dueAt) : null,
      note: draft.note.trim() || null,
    });
    router.back();
  };

  const remove = () => {
    const snapshot = loaded.item;
    deleteHomework(id);
    router.back();
    showUndo('Hausaufgabe gelöscht', () => {
      const newId = addHomework({
        subjectId: snapshot.subjectId,
        title: snapshot.title,
        dueAt: snapshot.dueAt,
        note: snapshot.note,
      });
      if (snapshot.done) setHomeworkDone(newId, true);
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.subjectHeader}>
          <Text style={[styles.subjectName, { color: colors.text }]}>{loaded.subjectName}</Text>
          <View style={styles.doneRow}>
            <Text style={[styles.doneLabel, { color: colors.textMuted }]}>Erledigt</Text>
            <Switch
              value={done}
              onValueChange={toggleDone}
              trackColor={{ true: colors.tint, false: colors.surfaceMuted }}
            />
          </View>
        </View>

        <HomeworkFormFields
          subjects={[]}
          lockedSubject
          occurrences={occurrences}
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
        <PrimaryButton label="Hausaufgabe löschen" variant="muted" onPress={remove} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { padding: 20, paddingBottom: 32, gap: 18 },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectName: { fontSize: 20, fontWeight: typography.weightSemibold, letterSpacing: -0.3 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  doneLabel: { fontSize: 14, fontWeight: typography.weightMedium },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
});
