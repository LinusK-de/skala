import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { DistributionChart } from '@/components/charts/DistributionChart';
import { TrendChart } from '@/components/charts/TrendChart';
import { FAB } from '@/components/FAB';
import { GradeChip } from '@/components/GradeChip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { LockedCard } from '@/components/Pro';
import { Stepper } from '@/components/Stepper';
import { useUndo } from '@/components/UndoSnackbar';
import { radii, typography } from '@/constants/theme';
import {
  archiveSubject,
  deleteSubject,
  unarchiveSubject,
  updateCategory,
  updateSubject,
} from '@/db';
import { useCurrentContext } from '@/hooks/useCareer';
import { useSubjectDetail, useSubjectTrend } from '@/hooks/useGrades';
import { usePurchase } from '@/hooks/usePurchase';
import { useTheme } from '@/hooks/useTheme';
import {
  chartConfig,
  decimalToGradeLabel,
  formatNativeAverage,
  gradeDistribution,
  gradeLabel,
  sentimentFor,
  toAveragingValue,
  type ForecastResult,
  type Scale,
  type Tendency,
} from '@/lib/grades';

function shortDate(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.`;
}

export default function SubjectDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showUndo } = useUndo();
  const { isPro } = usePurchase();
  const { stage, term } = useCurrentContext();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);

  const scale = (stage?.scale ?? 'grades_1_6') as Scale;
  const detail = useSubjectDetail(id, term?.id ?? null, scale);
  const trend = useSubjectTrend(id, stage?.id ?? null, scale);
  const axis = chartConfig(scale);

  const [managing, setManaging] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const subject = detail.subject;
  if (!subject) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Fach' }} />
        <Text style={{ color: colors.textMuted }}>Dieses Fach gibt es nicht mehr.</Text>
      </View>
    );
  }

  const termValue = detail.termAverage.kind === 'value' ? detail.termAverage.avg : null;
  const overallValue = detail.overallAverage.kind === 'value' ? detail.overallAverage.avg : null;
  const target = subject.targetGrade;

  const categoryAvg = (categoryId: number): number | null => {
    if (detail.termAverage.kind !== 'value') return null;
    return detail.termAverage.categories.find((c) => c.categoryId === categoryId)?.avg ?? null;
  };

  const openManage = () => {
    setNameDraft(subject.name);
    setManaging(true);
  };

  const saveName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== subject.name) updateSubject(id, { name: trimmed });
  };

  const archive = () => {
    setManaging(false);
    archiveSubject(id);
    router.back();
    showUndo('Fach archiviert', () => unarchiveSubject(id));
  };

  const confirmDelete = () => {
    Alert.alert(
      'Fach endgültig löschen?',
      'Alle Noten dieses Fachs werden gelöscht. Das kann nicht rückgängig gemacht werden.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => {
            setManaging(false);
            deleteSubject(id);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: subject.name,
          headerRight: () => (
            <Pressable onPress={openManage} hitSlop={8}>
              <Text style={[styles.headerAction, { color: colors.tint }]}>Bearbeiten</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 130 }]}>
        {/* Average + target */}
        <Card>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.muted, { color: colors.textMuted }]}>
                Schnitt {term ? term.label : ''}
              </Text>
              {termValue === null ? (
                <Text style={[styles.bigEmpty, { color: colors.textMuted }]}>Kein Schnitt</Text>
              ) : (
                <Text style={[styles.big, { color: colors.text }]}>
                  {formatNativeAverage(termValue, scale)}
                </Text>
              )}
            </View>
            {termValue !== null ? (
              <GradeChip
                label={decimalLabelFor(termValue, scale)}
                sentiment={sentimentFor(termValue, scale)}
                size="lg"
              />
            ) : null}
          </View>
          {overallValue !== null ? (
            <Text style={[styles.muted, { color: colors.textMuted }]}>
              Gesamt über alle Halbjahre: {formatNativeAverage(overallValue, scale)}
            </Text>
          ) : null}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.cardTitle, { color: colors.text }]}>Zielnote</Text>
          {target === null ? (
            <PrimaryButton
              label="Ziel setzen"
              variant="muted"
              onPress={() => updateSubject(id, { targetGrade: scale === 'points_0_15' ? 10 : 2 })}
            />
          ) : (
            <>
              <View style={styles.targetRow}>
                <Stepper
                  value={target}
                  onChange={(v) => updateSubject(id, { targetGrade: v })}
                  step={scale === 'points_0_15' ? 1 : 0.5}
                  min={axis.min}
                  max={axis.max}
                  format={(n) => formatNativeAverage(n, scale)}
                />
                <Pressable onPress={() => updateSubject(id, { targetGrade: null })} hitSlop={6}>
                  <Text style={[styles.removeLink, { color: colors.textMuted }]}>entfernen</Text>
                </Pressable>
              </View>
              <Text style={[styles.forecast, { color: colors.text }]}>
                {forecastText(detail.forecast, scale)}
              </Text>
            </>
          )}
        </Card>

        {/* Verlauf */}
        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Verlauf</Text>
          <TrendChart
            data={trend}
            min={axis.min}
            max={axis.max}
            ticks={axis.ticks}
            betterIsLower={axis.betterIsLower}
          />
        </Card>

        {/* Gewichtung */}
        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Gewichtung</Text>
          <View style={styles.weightRow}>
            <Text style={[styles.weightLabel, { color: colors.text }]}>Schriftlich</Text>
            <Stepper
              value={subject.writtenWeight}
              onChange={(v) => updateSubject(id, { writtenWeight: v })}
              step={0.5}
              min={0}
              max={5}
              format={(n) => `×${n}`}
            />
          </View>
          <View style={styles.weightRow}>
            <Text style={[styles.weightLabel, { color: colors.text }]}>Mündlich / Sonstige</Text>
            <Stepper
              value={subject.oralWeight}
              onChange={(v) => updateSubject(id, { oralWeight: v })}
              step={0.5}
              min={0}
              max={5}
              format={(n) => `×${n}`}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {detail.categories.map((c) => {
            const avg = categoryAvg(c.id);
            return (
              <View key={c.id} style={styles.weightRow}>
                <View style={styles.catLeft}>
                  <Text style={[styles.weightLabel, { color: colors.text }]}>{c.name}</Text>
                  <Text style={[styles.muted, { color: colors.textMuted }]}>
                    {avg === null ? 'noch keine Note' : `Ø ${formatNativeAverage(avg, scale)}`}
                  </Text>
                </View>
                <Stepper
                  value={c.weight}
                  onChange={(v) => updateCategory(c.id, { weight: v })}
                  step={0.5}
                  min={0}
                  max={5}
                  format={(n) => `×${n}`}
                />
              </View>
            );
          })}
        </Card>

        {/* Distribution (Pro) */}
        {isPro ? (
          <Card>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Notenverteilung</Text>
            {detail.allGrades.length === 0 ? (
              <Text style={[styles.muted, { color: colors.textMuted }]}>
                Noch keine Noten in diesem Fach.
              </Text>
            ) : (
              <DistributionChart
                bars={gradeDistribution(
                  detail.allGrades.map((g) => g.value),
                  scale,
                )}
              />
            )}
          </Card>
        ) : (
          <LockedCard
            title="Notenverteilung"
            description="Sieh auf einen Blick, wie sich deine Noten in diesem Fach verteilen."
            onUnlock={() => router.push('/paywall')}
          />
        )}

        {/* Grades list */}
        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Noten {term ? `· ${term.label}` : ''}
          </Text>
          {detail.termGrades.length === 0 ? (
            <Text style={[styles.muted, { color: colors.textMuted }]}>
              Für dieses Halbjahr gibt es noch keine Noten.
            </Text>
          ) : (
            detail.termGrades.map((g, i) => {
              const cat = detail.categories.find((c) => c.id === g.categoryId);
              return (
                <Pressable
                  key={g.id}
                  onPress={() => router.push(`/grade/${g.id}`)}
                  style={[
                    styles.gradeRow,
                    i < detail.termGrades.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View>
                    <Text style={[styles.gradeCat, { color: colors.text }]}>
                      {cat?.name ?? 'Note'}
                    </Text>
                    <Text style={[styles.muted, { color: colors.textMuted }]}>
                      {shortDate(g.date.getTime())}
                      {g.countsTowardAverage ? '' : ' · zählt nicht'}
                    </Text>
                  </View>
                  <GradeChip
                    label={gradeLabel(g.value, (g.tendency ?? null) as Tendency | null, scale)}
                    sentiment={sentimentFor(
                      toAveragingValue(scale, g.value, (g.tendency ?? null) as Tendency | null),
                      scale,
                    )}
                    size="sm"
                  />
                </Pressable>
              );
            })
          )}
        </Card>
      </ScrollView>

      <FAB label="Note" onPress={() => router.push(`/grade/new?subjectId=${id}`)} />

      <Modal
        visible={managing}
        transparent
        animationType="fade"
        onRequestClose={() => setManaging(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setManaging(false)}>
          <Pressable
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Fach verwalten</Text>
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              onEndEditing={saveName}
              placeholder="Fachname"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.surfaceMuted, color: colors.text }]}
            />
            <View style={styles.coreRow}>
              <Text style={[styles.weightLabel, { color: colors.text }]}>Kernfach</Text>
              <Switch
                value={subject.isCore}
                onValueChange={(v) => updateSubject(id, { isCore: v })}
                trackColor={{ true: colors.tint, false: colors.surfaceMuted }}
              />
            </View>
            <PrimaryButton
              label="Speichern"
              onPress={() => {
                saveName();
                setManaging(false);
              }}
            />
            <PrimaryButton label="Archivieren" variant="muted" onPress={archive} />
            <Pressable onPress={confirmDelete} style={styles.deleteLink}>
              <Text style={[styles.deleteText, { color: colors.warning }]}>Endgültig löschen</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function decimalLabelFor(value: number, scale: Scale): string {
  return scale === 'points_0_15' ? `${Math.round(value)}` : decimalToGradeLabel(value);
}

function forecastText(forecast: ForecastResult | null, scale: Scale): string {
  if (!forecast || forecast.kind === 'empty')
    return 'Trag eine Note ein, um eine Prognose zu sehen.';
  if (forecast.kind === 'secure') return 'Dein Ziel ist bereits sicher.';
  if (forecast.kind === 'impossible')
    return 'Mit der nächsten Note ist dein Ziel nicht mehr erreichbar.';
  if (scale === 'points_0_15') {
    return `In der nächsten Note brauchst du mindestens ${Math.ceil(forecast.required)} Punkte.`;
  }
  return `In der nächsten Note brauchst du mindestens eine ${decimalToGradeLabel(forecast.required)}.`;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { padding: 20, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  big: {
    fontSize: 42,
    fontWeight: typography.weightSemibold,
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  bigEmpty: { fontSize: 28, fontWeight: typography.weightSemibold },
  muted: { fontSize: 13 },
  cardTitle: { fontSize: 18, fontWeight: typography.weightSemibold },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  targetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  removeLink: { fontSize: 13, textDecorationLine: 'underline' },
  forecast: { fontSize: 15, lineHeight: 21 },
  weightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weightLabel: { fontSize: 15, fontWeight: typography.weightMedium },
  catLeft: { gap: 2 },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  gradeCat: { fontSize: 15, fontWeight: typography.weightMedium },
  headerAction: { fontSize: 16, fontWeight: typography.weightMedium, marginRight: 4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center' },
  sheetTitle: { fontSize: 18, fontWeight: typography.weightSemibold },
  input: { height: 50, borderRadius: radii.control, paddingHorizontal: 14, fontSize: 16 },
  coreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deleteLink: { alignItems: 'center', paddingVertical: 6 },
  deleteText: { fontSize: 14, fontWeight: typography.weightMedium },
});
