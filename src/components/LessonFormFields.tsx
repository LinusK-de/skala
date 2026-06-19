import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { DateTimeField } from '@/components/DateTimeField';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Stepper } from '@/components/Stepper';
import { radii, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { minutesOfDay, SCHEDULE_WEEKDAYS, weekdayLabel } from '@/lib/timetable';

export interface SlotDraft {
  subjectId: number | null;
  weekday: number;
  period: number;
  startMin: number | null;
  endMin: number | null;
  room: string;
}

export interface SubjectOption {
  id: number;
  name: string;
}

const DEFAULT_START = 8 * 60; // 08:00
const DEFAULT_END = 8 * 60 + 45; // 08:45

function dateAtMin(min: number): Date {
  const d = new Date();
  d.setHours(Math.floor(min / 60), min % 60, 0, 0);
  return d;
}

/** Presentational fields for one timetable slot. The screen owns the draft + save. */
export function LessonFormFields({
  subjects,
  lockedSubject,
  draft,
  onChange,
}: {
  subjects: SubjectOption[];
  lockedSubject: boolean;
  draft: SlotDraft;
  onChange: (patch: Partial<SlotDraft>) => void;
}) {
  const { colors } = useTheme();
  const hasTime = draft.startMin != null;

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
        <Text style={[styles.label, { color: colors.textMuted }]}>Wochentag</Text>
        <SegmentedControl
          scroll
          value={draft.weekday}
          onChange={(weekday) => onChange({ weekday })}
          options={SCHEDULE_WEEKDAYS.map((w) => ({ label: weekdayLabel(w), value: w }))}
        />
      </View>

      <View style={styles.rowBetween}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>Stunde</Text>
        <Stepper
          value={draft.period}
          onChange={(period) => onChange({ period })}
          step={1}
          min={1}
          max={12}
          format={(n) => `${n}.`}
        />
      </View>

      <View style={styles.rowBetween}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>Uhrzeit angeben</Text>
        <Switch
          value={hasTime}
          onValueChange={(on) =>
            onChange(
              on
                ? { startMin: DEFAULT_START, endMin: DEFAULT_END }
                : { startMin: null, endMin: null },
            )
          }
          trackColor={{ true: colors.tint, false: colors.surfaceMuted }}
        />
      </View>

      {hasTime ? (
        <View style={styles.timeRow}>
          <View style={styles.timeCell}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Von</Text>
            <DateTimeField
              mode="time"
              value={dateAtMin(draft.startMin ?? DEFAULT_START)}
              onChange={(d) => onChange({ startMin: minutesOfDay(d) })}
            />
          </View>
          <View style={styles.timeCell}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Bis</Text>
            <DateTimeField
              mode="time"
              value={dateAtMin(draft.endMin ?? DEFAULT_END)}
              onChange={(d) => onChange({ endMin: minutesOfDay(d) })}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Raum (optional)</Text>
        <TextInput
          value={draft.room}
          onChangeText={(room) => onChange({ room })}
          placeholder="z. B. 204"
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
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { fontSize: 15, fontWeight: typography.weightMedium },
  timeRow: { flexDirection: 'row', gap: 16 },
  timeCell: { flex: 1, gap: 8 },
  input: {
    height: 48,
    borderRadius: radii.control,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    fontSize: 16,
  },
});
