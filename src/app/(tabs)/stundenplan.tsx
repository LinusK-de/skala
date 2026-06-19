import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { FAB } from '@/components/FAB';
import { SegmentedControl } from '@/components/SegmentedControl';
import { radii, typography, type ThemeColors } from '@/constants/theme';
import { useHomework } from '@/hooks/useHomework';
import { useTimetable, type SlotWithSubject } from '@/hooks/useTimetable';
import { useTheme } from '@/hooks/useTheme';
import { formatTime, jsWeekday, SCHEDULE_WEEKDAYS, weekdayLabel } from '@/lib/timetable';

function accentColor(colorKey: string, colors: ThemeColors): string {
  if (colorKey === 'accent2') return colors.accent2;
  if (colorKey === 'accent3') return colors.accent3;
  return colors.accent1;
}

function lessonMeta(item: SlotWithSubject): string {
  const { startMin, endMin, room } = item.slot;
  const time =
    startMin != null
      ? `${formatTime(startMin)}${endMin != null ? `–${formatTime(endMin)}` : ''}`
      : '';
  const parts = [time, room ? `Raum ${room}` : ''].filter(Boolean);
  return parts.join(' · ');
}

export default function StundenplanScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { slotsByWeekday, totalSlots, stageId } = useTimetable();
  const { openCountBySubject } = useHomework();

  const todayWeekday = jsWeekday(new Date());
  const [day, setDay] = useState(todayWeekday >= 1 && todayWeekday <= 6 ? todayWeekday : 1);

  if (stageId === null)
    return <View style={[styles.flex, { backgroundColor: colors.background }]} />;

  const dayLessons = slotsByWeekday.get(day) ?? [];

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.heading, { color: colors.text }]}>Stundenplan</Text>
        <View style={styles.daysRow}>
          <SegmentedControl
            scroll
            value={day}
            onChange={setDay}
            options={SCHEDULE_WEEKDAYS.map((w) => ({
              label: w === todayWeekday ? `${weekdayLabel(w)} ·` : weekdayLabel(w),
              value: w,
            }))}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 130 }]}>
        {totalSlots === 0 ? (
          <Card>
            <EmptyState
              title="Noch kein Stundenplan"
              subtitle="Trage deine Stunden ein — Hausaufgaben können sich dann an deinen Unterricht hängen."
              actionLabel="Stunde hinzufügen"
              onAction={() => router.push(`/lesson/new?weekday=${day}`)}
            />
          </Card>
        ) : dayLessons.length === 0 ? (
          <Card>
            <Text style={[styles.emptyDay, { color: colors.textMuted }]}>
              Keine Stunden am {weekdayLabel(day, true)}.
            </Text>
          </Card>
        ) : (
          <Card>
            {dayLessons.map((item, i) => {
              const open = openCountBySubject.get(item.subject.id) ?? 0;
              const meta = lessonMeta(item);
              return (
                <Pressable
                  key={item.slot.id}
                  onPress={() => router.push(`/lesson/${item.slot.id}`)}
                  style={[
                    styles.row,
                    i < dayLessons.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.accent,
                      { backgroundColor: accentColor(item.subject.colorKey, colors) },
                    ]}
                  />
                  <View style={[styles.periodBadge, { backgroundColor: colors.surfaceMuted }]}>
                    <Text style={[styles.periodText, { color: colors.text }]}>
                      {item.slot.period}.
                    </Text>
                  </View>
                  <View style={styles.main}>
                    <Text style={[styles.subjectName, { color: colors.text }]}>
                      {item.subject.name}
                    </Text>
                    {meta ? (
                      <Text style={[styles.meta, { color: colors.textMuted }]}>{meta}</Text>
                    ) : null}
                  </View>
                  {open > 0 ? (
                    <View style={[styles.dueBadge, { backgroundColor: colors.tintSoft }]}>
                      <Text style={[styles.dueText, { color: colors.text }]}>
                        {open} {open === 1 ? 'Aufgabe' : 'Aufgaben'}
                      </Text>
                    </View>
                  ) : null}
                  <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
                </Pressable>
              );
            })}
          </Card>
        )}
      </ScrollView>

      <FAB label="Stunde" onPress={() => router.push(`/lesson/new?weekday=${day}`)} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 10, gap: 12 },
  heading: { fontSize: 32, fontWeight: typography.weightSemibold, letterSpacing: -0.5 },
  daysRow: {},
  content: { paddingHorizontal: 20, paddingTop: 4, gap: 16 },
  emptyDay: { fontSize: 14, paddingVertical: 10, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  accent: { width: 4, alignSelf: 'stretch', borderRadius: 2, marginVertical: 2 },
  periodBadge: {
    width: 34,
    height: 34,
    borderRadius: radii.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodText: {
    fontSize: 14,
    fontWeight: typography.weightSemibold,
    fontVariant: ['tabular-nums'],
  },
  main: { flex: 1, gap: 2 },
  subjectName: { fontSize: 16, fontWeight: typography.weightMedium },
  meta: { fontSize: 13, fontVariant: ['tabular-nums'] },
  dueBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill },
  dueText: { fontSize: 12, fontWeight: typography.weightMedium },
  chevron: { fontSize: 20 },
});
