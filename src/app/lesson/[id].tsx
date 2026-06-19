import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LessonFormFields, type SlotDraft } from '@/components/LessonFormFields';
import { PrimaryButton } from '@/components/PrimaryButton';
import { deleteSlot, getSlot, getSubject, subjectsQuery, updateSlot, useLiveQuery } from '@/db';
import { useTheme } from '@/hooks/useTheme';

export default function EditLessonScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);

  const loaded = useMemo(() => {
    const slot = getSlot(id);
    if (!slot) return null;
    const subject = getSubject(slot.subjectId);
    return { slot, stageId: subject?.stageId ?? null };
  }, [id]);

  const subjectsData = useLiveQuery(subjectsQuery(loaded?.stageId ?? -1), [loaded?.stageId]).data;
  const subjects = useMemo(() => subjectsData ?? [], [subjectsData]);

  const [draft, setDraft] = useState<SlotDraft>(() =>
    loaded
      ? {
          subjectId: loaded.slot.subjectId,
          weekday: loaded.slot.weekday,
          period: loaded.slot.period,
          startMin: loaded.slot.startMin,
          endMin: loaded.slot.endMin,
          room: loaded.slot.room ?? '',
        }
      : { subjectId: null, weekday: 1, period: 1, startMin: null, endMin: null, room: '' },
  );

  if (!loaded) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textMuted }}>Diese Stunde gibt es nicht mehr.</Text>
      </View>
    );
  }

  const onChange = (patch: Partial<SlotDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const save = () => {
    if (draft.subjectId === null) return;
    void Haptics.selectionAsync().catch(() => {});
    updateSlot(id, {
      subjectId: draft.subjectId,
      weekday: draft.weekday,
      period: draft.period,
      startMin: draft.startMin,
      endMin: draft.endMin,
      room: draft.room.trim() || null,
    });
    router.back();
  };

  const remove = () => {
    deleteSlot(id);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <LessonFormFields
          subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
          lockedSubject={false}
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
        <PrimaryButton label="Stunde löschen" variant="muted" onPress={remove} />
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
