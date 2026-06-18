import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { ComparisonChart, type ComparisonItem } from '@/components/charts/ComparisonChart';
import { DistributionChart } from '@/components/charts/DistributionChart';
import { TrendChart } from '@/components/charts/TrendChart';
import { LockedCard } from '@/components/Pro';
import { typography } from '@/constants/theme';
import { gradesForTermQuery, useLiveQuery } from '@/db';
import { useCareerTrend, useCurrentContext, useStageTerms } from '@/hooks/useCareer';
import { useTermOverview } from '@/hooks/useGrades';
import { usePurchase } from '@/hooks/usePurchase';
import { useTheme } from '@/hooks/useTheme';
import {
  chartConfig,
  formatNativeAverage,
  gradeDistribution,
  meanOf,
  sentimentFor,
  type MeanResult,
  type Scale,
} from '@/lib/grades';

export default function VerlaufScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPro } = usePurchase();

  const { stage, term } = useCurrentContext();
  const scale = (stage?.scale ?? 'grades_1_6') as Scale;
  const axis = chartConfig(scale);
  const trend = useCareerTrend();
  const overview = useTermOverview(stage?.id ?? null, term?.id ?? null, scale);
  const stageTerms = useStageTerms(stage?.id ?? null);
  const termGrades = useLiveQuery(gradesForTermQuery(term?.id ?? -1), [term?.id]).data ?? [];

  if (!stage || !term)
    return <View style={[styles.flex, { backgroundColor: colors.background }]} />;

  const careerData = trend.map((p) => ({
    label: p.label,
    value: p.normalized,
    boundary: p.isStageBoundary,
  }));
  const multiScale = new Set(trend.map((p) => p.scale)).size > 1;

  const comparison: ComparisonItem[] = overview.items
    .map(({ subject, average }) =>
      average.kind === 'value'
        ? { label: subject.name, value: average.avg, sentiment: sentimentFor(average.avg, scale) }
        : null,
    )
    .filter((x): x is ComparisonItem => x !== null)
    .sort((a, b) => (axis.betterIsLower ? a.value - b.value : b.value - a.value));

  const nativeByTerm = new Map(trend.map((p) => [p.termId, p.native]));
  const yearValues = stageTerms
    .filter((t) => t.schoolYear === term.schoolYear)
    .map((t) => nativeByTerm.get(t.id))
    .filter((v): v is number => v != null);
  const stageValues = stageTerms
    .map((t) => nativeByTerm.get(t.id))
    .filter((v): v is number => v != null);
  const yearAvg = meanOf(yearValues);
  const stageAvg = meanOf(stageValues);

  const referenceValue = overview.average.kind === 'value' ? overview.average.avg : null;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.heading, { color: colors.text }]}>Verlauf</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 130 }]}>
        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Notenverlauf</Text>
          <TrendChart
            data={careerData}
            min={1}
            max={6}
            ticks={[1, 2, 3, 4, 5, 6]}
            betterIsLower
            formatValue={(v) => `${v}`}
          />
          {multiScale ? (
            <Text style={[styles.caption, { color: colors.textMuted }]}>
              Stufenübergreifend auf die Notenskala 1–6 umgerechnet (Schätzung).
            </Text>
          ) : null}
        </Card>

        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Fächer im Vergleich · {term.label}
          </Text>
          {comparison.length === 0 ? (
            <Text style={[styles.muted, { color: colors.textMuted }]}>
              Noch keine Noten in diesem Halbjahr.
            </Text>
          ) : (
            <ComparisonChart
              items={comparison}
              min={axis.min}
              max={axis.max}
              betterIsLower={axis.betterIsLower}
              referenceValue={referenceValue}
              formatValue={(v) => formatNativeAverage(v, scale)}
            />
          )}
        </Card>

        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Übersicht</Text>
          <SummaryRow
            label={`Halbjahr · ${term.label}`}
            value={overview.average}
            scale={scale}
            colors={colors}
          />
          <SummaryRow
            label={`Schuljahr ${term.schoolYear}`}
            value={yearAvg}
            scale={scale}
            colors={colors}
          />
          <SummaryRow label={stage.name} value={stageAvg} scale={scale} colors={colors} last />
        </Card>

        {isPro ? (
          <Card>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Notenverteilung · {term.label}
            </Text>
            {termGrades.length === 0 ? (
              <Text style={[styles.muted, { color: colors.textMuted }]}>
                Noch keine Noten in diesem Halbjahr.
              </Text>
            ) : (
              <DistributionChart
                bars={gradeDistribution(
                  termGrades.map((g) => g.value),
                  scale,
                )}
              />
            )}
          </Card>
        ) : (
          <LockedCard
            title="Notenverteilung & Prognose"
            description="Sieh die Verteilung all deiner Noten und eine Schätzung, wohin dein Schnitt läuft."
            onUnlock={() => router.push('/paywall')}
          />
        )}
      </ScrollView>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  scale,
  colors,
  last,
}: {
  label: string;
  value: MeanResult;
  scale: Scale;
  colors: { text: string; textMuted: string; border: string };
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.summaryRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <Text style={[styles.summaryLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: colors.text }]}>
        {value.kind === 'value' ? formatNativeAverage(value.avg, scale) : '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  heading: { fontSize: 32, fontWeight: typography.weightSemibold, letterSpacing: -0.5 },
  content: { paddingHorizontal: 20, paddingTop: 4, gap: 16 },
  cardTitle: { fontSize: 18, fontWeight: typography.weightSemibold, marginBottom: 2 },
  caption: { fontSize: 12, lineHeight: 16 },
  muted: { fontSize: 14, paddingVertical: 6 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  summaryLabel: { fontSize: 15, fontWeight: typography.weightMedium },
  summaryValue: {
    fontSize: 17,
    fontWeight: typography.weightSemibold,
    fontVariant: ['tabular-nums'],
  },
});
