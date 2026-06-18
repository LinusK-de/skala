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
import { useTheme } from '@/hooks/useTheme';
import {
  formatDecimal,
  formatNativeAverage,
  gradeLabel,
  sentimentFor,
  toAveragingValue,
  type Scale,
} from '@/lib/grades';

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

  if (!stage || !term)
    return <View style={[styles.flex, { backgroundColor: colors.background }]} />;

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
  cardTitle: { fontSize: 18, fontWeight: typography.weightSemibold, marginBottom: 2 },
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
});
