import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LessonFormFields, type SlotDraft } from '@/components/LessonFormFields';
import { PrimaryButton } from '@/components/PrimaryButton';
import { createSlot, subjectsQuery, useLiveQuery } from '@/db';
import { useCurrentContext } from '@/hooks/useCareer';
import { useTheme } from '@/hooks/useTheme';
import { jsWeekday } from '@/lib/timetable';

/** A weekday param from the timetable FAB (1..6), else today, clamped to Mo–Sa. */
function defaultWeekday(param: string | undefined): number {
  const fromParam = param ? Number(param) : NaN;
  if (fromParam >= 1 && fromParam <= 6) return fromParam;
  const today = jsWeekday(new Date());
  return today >= 1 && today <= 6 ? today : 1;
}

export default function NewLessonScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ weekday?: string }>();

  const { stage } = useCurrentContext();
  const subjectsData = useLiveQuery(subjectsQuery(stage?.id ?? -1), [stage?.id]).data;
  const subjects = useMemo(() => subjectsData ?? [], [subjectsData]);

  const [draft, setDraft] = useState<SlotDraft>({
    subjectId: null,
    weekday: defaultWeekday(params.weekday),
    period: 1,
    startMin: null,
    endMin: null,
    room: '',
  });

  useEffect(() => {
    if (draft.subjectId === null && subjects.length > 0) {
      setDraft((d) => ({ ...d, subjectId: subjects[0].id }));
    }
  }, [subjects, draft.subjectId]);

  const onChange = (patch: Partial<SlotDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const canSave = draft.subjectId !== null;

  const save = () => {
    if (draft.subjectId === null) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    createSlot({
      subjectId: draft.subjectId,
      weekday: draft.weekday,
      period: draft.period,
      startMin: draft.startMin,
      endMin: draft.endMin,
      room: draft.room.trim() || null,
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {subjects.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            Lege zuerst ein Fach an, dann kannst du Stunden eintragen.
          </Text>
        ) : (
          <LessonFormFields
            subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
            lockedSubject={false}
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
});
