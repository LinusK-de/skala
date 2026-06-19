import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { Sparkline } from '@/components/charts/Sparkline';
import { FAB } from '@/components/FAB';
import { GradeChip } from '@/components/GradeChip';
import { TermSelector } from '@/components/TermSelector';
import { typography } from '@/constants/theme';
import { setCurrentTerm } from '@/db';
import { useCareerTrend, useCurrentContext, useTermOptions } from '@/hooks/useCareer';
import { useRecentGrades, useTermOverview } from '@/hooks/useGrades';
import { useHomework } from '@/hooks/useHomework';
import { useTimetable } from '@/hooks/useTimetable';
import { useTheme } from '@/hooks/useTheme';
import {
  formatDecimal,
  formatNativeAverage,
  gradeLabel,
  sentimentFor,
  toAveragingValue,
  type Scale,
} from '@/lib/grades';
import { formatDueShort, formatTime, jsWeekday, weekdayLabel } from '@/lib/timetable';

function shortDate(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.`;
}

export default function HeuteScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { stage, term } = useCurrentContext();
  const termOptions = useTermOptions();
  const scale = (stage?.scale ?? 'grades_1_6') as Scale;
  const overview = useTermOverview(stage?.id ?? null, term?.id ?? null, scale);
  const trend = useCareerTrend();
  const recent = useRecentGrades(stage?.id ?? null, term?.id ?? null, 3);
  const { today: todaysLessons } = useTimetable();
  const { open: openHomework, openCountBySubject } = useHomework();

  if (!stage || !term)
    return <View style={[styles.flex, { backgroundColor: colors.background }]} />;

  const now = new Date();
  const todayWeekday = jsWeekday(now);
  const dueSoon = openHomework
    .filter((h) => h.bucket === 'overdue' || h.bucket === 'today' || h.bucket === 'tomorrow')
    .slice(0, 5);

  const currentIdx = trend.findIndex((p) => p.termId === term.id);
  const currentPoint = currentIdx >= 0 ? trend[currentIdx] : null;
  const prevPoint = currentIdx > 0 ? trend[currentIdx - 1] : null;
  const delta =
    currentPoint?.normalized != null && prevPoint?.normalized != null
      ? prevPoint.normalized - currentPoint.normalized
      : null;

  const heroValue = overview.average.kind === 'value' ? overview.average.avg : null;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.heading, { color: colors.text }]}>Heute</Text>
        <TermSelector
          current={{ id: term.id, label: term.label, sub: stage.name }}
          options={termOptions}
          onSelect={(id) => setCurrentTerm(id)}
        />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 130 }]}>
        <Pressable onPress={() => router.push('/verlauf')}>
          <Card>
            <Text style={[styles.label, { color: colors.textMuted }]}>Aktueller Schnitt</Text>
            <View style={styles.heroRow}>
              {heroValue === null ? (
                <Text style={[styles.heroEmpty, { color: colors.textMuted }]}>Kein Schnitt</Text>
              ) : (
                <Text
                  style={[
                    styles.hero,
                    { color: sentColor(sentimentFor(heroValue, scale), colors) },
                  ]}
                >
                  {formatNativeAverage(heroValue, scale)}
                </Text>
              )}
              {delta != null && Math.abs(delta) >= 0.05 ? (
                <Text
                  style={[styles.delta, { color: delta > 0 ? colors.positive : colors.warning }]}
                >
                  {delta > 0 ? '▲' : '▼'} {formatDecimal(Math.abs(delta), 1)}
                </Text>
              ) : null}
            </View>
            <Text style={[styles.heroSub, { color: colors.textMuted }]}>
              {stage.name} · {term.label}
            </Text>
            <Sparkline values={trend.map((p) => p.normalized)} />
          </Card>
        </Pressable>

        <Card>
          <View style={styles.cardHead}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {weekdayLabel(todayWeekday, true)}
            </Text>
            <Pressable onPress={() => router.push('/stundenplan')} hitSlop={6}>
              <Text style={[styles.link, { color: colors.tint }]}>Stundenplan ›</Text>
            </Pressable>
          </View>
          {todaysLessons.length === 0 ? (
            <Text style={[styles.muted, { color: colors.textMuted }]}>Heute kein Unterricht.</Text>
          ) : (
            todaysLessons.map((item, i) => {
              const open = openCountBySubject.get(item.subject.id) ?? 0;
              return (
                <Pressable
                  key={item.slot.id}
                  onPress={() => router.push(`/lesson/${item.slot.id}`)}
                  style={[
                    styles.lessonRow,
                    i < todaysLessons.length - 1 ? rowBorder(colors.border) : null,
                  ]}
                >
                  <Text style={[styles.lessonWhen, { color: colors.textMuted }]}>
                    {item.slot.startMin != null
                      ? formatTime(item.slot.startMin)
                      : `${item.slot.period}.`}
                  </Text>
                  <Text style={[styles.lessonName, { color: colors.text }]} numberOfLines={1}>
                    {item.subject.name}
                  </Text>
                  {open > 0 ? (
                    <View style={[styles.dot, { backgroundColor: colors.tint }]} />
                  ) : null}
                </Pressable>
              );
            })
          )}
        </Card>

        {dueSoon.length > 0 ? (
          <Card>
            <View style={styles.cardHead}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Fällig</Text>
              <Pressable onPress={() => router.push('/hausaufgaben')} hitSlop={6}>
                <Text style={[styles.link, { color: colors.tint }]}>Alle ›</Text>
              </Pressable>
            </View>
            {dueSoon.map((h, i) => (
              <Pressable
                key={h.item.id}
                onPress={() => router.push(`/homework/${h.item.id}`)}
                style={[styles.row, i < dueSoon.length - 1 ? rowBorder(colors.border) : null]}
              >
                <View style={styles.hwMain}>
                  <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>
                    {h.item.title}
                  </Text>
                  <Text style={[styles.rowDate, { color: colors.textMuted }]}>
                    {h.subject?.name ?? '—'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.due,
                    { color: h.bucket === 'overdue' ? colors.warning : colors.textMuted },
                  ]}
                >
                  {formatDueShort(h.item.dueAt ? h.item.dueAt.getTime() : null, now)}
                </Text>
              </Pressable>
            ))}
          </Card>
        ) : null}

        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Fächer</Text>
          {overview.items.length === 0 ? (
            <Text style={[styles.muted, { color: colors.textMuted }]}>
              Noch keine Fächer in diesem Abschnitt.
            </Text>
          ) : (
            overview.items.map(({ subject, average }, i) => {
              const value = average.kind === 'value' ? average.avg : null;
              return (
                <Pressable
                  key={subject.id}
                  onPress={() => router.push(`/subject/${subject.id}`)}
                  style={[
                    styles.row,
                    i < overview.items.length - 1 ? rowBorder(colors.border) : null,
                  ]}
                >
                  <Text style={[styles.rowName, { color: colors.text }]}>{subject.name}</Text>
                  {value === null ? (
                    <Text style={[styles.rowDash, { color: colors.textMuted }]}>—</Text>
                  ) : (
                    <GradeChip
                      label={formatNativeAverage(value, scale)}
                      sentiment={sentimentFor(value, scale)}
                      size="sm"
                    />
                  )}
                </Pressable>
              );
            })
          )}
        </Card>

        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Zuletzt eingetragen</Text>
          {recent.length === 0 ? (
            <Text style={[styles.muted, { color: colors.textMuted }]}>
              Noch keine Noten in diesem Halbjahr.
            </Text>
          ) : (
            recent.map((g, i) => (
              <Pressable
                key={g.id}
                onPress={() => router.push(`/grade/${g.id}`)}
                style={[styles.row, i < recent.length - 1 ? rowBorder(colors.border) : null]}
              >
                <View>
                  <Text style={[styles.rowName, { color: colors.text }]}>{g.subjectName}</Text>
                  <Text style={[styles.rowDate, { color: colors.textMuted }]}>
                    {shortDate(g.date)}
                  </Text>
                </View>
                <GradeChip
                  label={gradeLabel(g.value, g.tendency, scale)}
                  sentiment={sentimentFor(toAveragingValue(scale, g.value, g.tendency), scale)}
                  size="sm"
                />
              </Pressable>
            ))
          )}
        </Card>
      </ScrollView>

      <FAB onPress={() => router.push('/grade/new')} />
    </View>
  );
}

function rowBorder(border: string) {
  return { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: border };
}

function sentColor(
  s: 'positive' | 'neutral' | 'warning',
  colors: { positive: string; warning: string; text: string },
): string {
  return s === 'positive' ? colors.positive : s === 'warning' ? colors.warning : colors.text;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  heading: { fontSize: 32, fontWeight: typography.weightSemibold, letterSpacing: -0.5 },
  content: { paddingHorizontal: 20, paddingTop: 4, gap: 16 },
  label: { fontSize: 13, fontWeight: typography.weightMedium },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  hero: {
    fontSize: 52,
    fontWeight: typography.weightSemibold,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  heroEmpty: { fontSize: 34, fontWeight: typography.weightSemibold },
  delta: { fontSize: 16, fontWeight: typography.weightSemibold, marginBottom: 10 },
  heroSub: { fontSize: 14 },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: typography.weightSemibold, marginBottom: 2 },
  link: { fontSize: 14, fontWeight: typography.weightMedium },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowName: { fontSize: 16, fontWeight: typography.weightMedium },
  rowDash: { fontSize: 16 },
  rowDate: { fontSize: 13, marginTop: 2 },
  muted: { fontSize: 14, paddingVertical: 6 },
  lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  lessonWhen: {
    width: 48,
    fontSize: 14,
    fontWeight: typography.weightMedium,
    fontVariant: ['tabular-nums'],
  },
  lessonName: { flex: 1, fontSize: 16, fontWeight: typography.weightMedium },
  dot: { width: 8, height: 8, borderRadius: 4 },
  hwMain: { flex: 1, marginRight: 12 },
  due: { fontSize: 13, fontWeight: typography.weightMedium },
});
