import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { DateTimeField } from '@/components/DateTimeField';
import { radii, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { occurrenceLabel, type LessonOccurrence } from '@/lib/timetable';

export type DueMode = 'next' | 'after' | 'manual';

export interface HomeworkDraft {
  subjectId: number | null;
  title: string;
  dueMode: DueMode;
  dueAt: number | null;
  note: string;
}

export interface SubjectOption {
  id: number;
  name: string;
}

/**
 * Presentational homework fields. The "Fällig" picker offers the subject's next
 * two lesson occurrences (computed by the screen and passed in) plus a manual
 * date — exactly the "nächste Stunde / übernächste / manuell" flow.
 */
export function HomeworkFormFields({
  subjects,
  lockedSubject,
  occurrences,
  draft,
  onChange,
}: {
  subjects: SubjectOption[];
  lockedSubject: boolean;
  occurrences: LessonOccurrence[];
  draft: HomeworkDraft;
  onChange: (patch: Partial<HomeworkDraft>) => void;
}) {
  const { colors } = useTheme();
  const next = occurrences[0];
  const after = occurrences[1];

  return (
    <View style={styles.wrap}>
      {!lockedSubject ? (
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Fach</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {subjects.map((s) => (
              <Chip
                key={s.id}
                label={s.name}
                selected={draft.subjectId === s.id}
                onPress={() => onChange({ subjectId: s.id })}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Aufgabe</Text>
        <TextInput
          value={draft.title}
          onChangeText={(title) => onChange({ title })}
          placeholder="z. B. AB S. 42 Nr. 3–5"
          placeholderTextColor={colors.textMuted}
          autoFocus={!lockedSubject}
          style={[
            styles.input,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
          ]}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Fällig</Text>
        <View style={styles.chipWrap}>
          {next ? (
            <Chip
              label={`Nächste · ${occurrenceLabel(next)}`}
              selected={draft.dueMode === 'next'}
              onPress={() => onChange({ dueMode: 'next', dueAt: next.date.getTime() })}
            />
          ) : null}
          {after ? (
            <Chip
              label={`Übernächste · ${occurrenceLabel(after)}`}
              selected={draft.dueMode === 'after'}
              onPress={() => onChange({ dueMode: 'after', dueAt: after.date.getTime() })}
            />
          ) : null}
          <Chip
            label="Manuell"
            selected={draft.dueMode === 'manual'}
            onPress={() => onChange({ dueMode: 'manual', dueAt: draft.dueAt ?? Date.now() })}
          />
        </View>
        {!next ? (
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Für dieses Fach gibt es keinen Stundenplan-Eintrag — wähle ein Datum.
          </Text>
        ) : null}
        {draft.dueMode === 'manual' ? (
          <View style={styles.manualRow}>
            <Text style={[styles.manualLabel, { color: colors.text }]}>Datum</Text>
            <DateTimeField
              mode="date"
              value={new Date(draft.dueAt ?? Date.now())}
              onChange={(d) => onChange({ dueAt: d.getTime() })}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Notiz (optional)</Text>
        <TextInput
          value={draft.note}
          onChangeText={(note) => onChange({ note })}
          placeholder="Details, z. B. Thema oder Abgabeform"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 18 },
  section: { gap: 10 },
  label: { fontSize: 13, fontWeight: typography.weightMedium },
  chipRow: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hint: { fontSize: 13, lineHeight: 18 },
  manualRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  manualLabel: { fontSize: 15, fontWeight: typography.weightMedium },
  input: {
    height: 48,
    borderRadius: radii.control,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    fontSize: 16,
  },
});
