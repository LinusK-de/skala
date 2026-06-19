import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SegmentedControl } from '@/components/SegmentedControl';
import { radii, typography } from '@/constants/theme';
import { seedDemoData, setupInitialStage } from '@/db';
import { useTheme } from '@/hooks/useTheme';
import {
  defaultSubjectsFor,
  defaultWeights,
  isCoreSubject,
  scaleSpec,
  schoolTypePreset,
  SCHOOL_TYPES,
  subjectColorKey,
  type SchoolType,
} from '@/lib/grades';
import { currentSchoolYear, gradeLevels } from '@/lib/school';

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [schoolType, setSchoolType] = useState<SchoolType | null>(null);
  const [gradeLevel, setGradeLevel] = useState(5);
  const [half, setHalf] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [extras, setExtras] = useState<string[]>([]);
  const [draft, setDraft] = useState('');

  const preset = schoolType ? schoolTypePreset(schoolType) : null;
  const subjectPool = useMemo(
    () => (schoolType ? [...defaultSubjectsFor(schoolType), ...extras] : []),
    [schoolType, extras],
  );

  const chooseType = (type: SchoolType) => {
    const p = schoolTypePreset(type);
    setSchoolType(type);
    setGradeLevel(p.gradeFrom);
    setHalf(1);
    setSelected(new Set(defaultSubjectsFor(type)));
    setExtras([]);
  };

  const toggleSubject = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const addExtra = () => {
    const name = draft.trim();
    if (!name || subjectPool.some((s) => s.toLowerCase() === name.toLowerCase())) {
      setDraft('');
      return;
    }
    setExtras((prev) => [...prev, name]);
    setSelected((prev) => new Set(prev).add(name));
    setDraft('');
  };

  const finish = () => {
    if (!preset || !schoolType) return;
    const chosen = subjectPool.filter((name) => selected.has(name));
    setupInitialStage({
      stageName: preset.stageName,
      schoolType,
      scale: preset.scale,
      gradeFrom: preset.gradeFrom,
      gradeTo: preset.gradeTo,
      gradeLevel,
      half,
      schoolYear: currentSchoolYear(new Date()),
      subjects: chosen.map((name, i) => {
        const core = isCoreSubject(name);
        const weights = defaultWeights(core, preset.scale);
        return {
          name,
          isCore: core,
          writtenWeight: weights.writtenWeight,
          oralWeight: weights.oralWeight,
          colorKey: subjectColorKey(i),
        };
      }),
    });
    // No imperative navigation: creating the stage lets the single RouteGuard move
    // us out of onboarding once its live query settles — so we can't bounce back.
  };

  const startDemo = () => {
    seedDemoData();
  };

  const canContinue = step === 0 ? schoolType !== null : step === 2 ? selected.size > 0 : true;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i <= step ? colors.tint : colors.surfaceMuted },
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 0 ? (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Wo bist du gerade?</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Wähle deine Schulform. Die passende Notenskala stellt Skala automatisch ein.
            </Text>
            {SCHOOL_TYPES.filter((t) => t.type !== 'custom').map((t) => {
              const active = schoolType === t.type;
              return (
                <Pressable
                  key={t.type}
                  onPress={() => chooseType(t.type)}
                  style={[
                    styles.typeCard,
                    {
                      backgroundColor: active ? colors.tintSoft : colors.surface,
                      borderColor: active ? colors.tint : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.typeName, { color: colors.text }]}>{t.label}</Text>
                  <Text style={[styles.typeMeta, { color: colors.textMuted }]}>
                    Klasse {t.gradeFrom}–{t.gradeTo} · {scaleSpec(t.scale).label}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable onPress={startDemo} style={styles.demoInline}>
              <Text style={[styles.demoText, { color: colors.textMuted }]}>
                Lieber erst mit Beispieldaten ansehen
              </Text>
            </Pressable>
          </>
        ) : null}

        {step === 1 && preset ? (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Welche Stufe?</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              In welcher Jahrgangsstufe und welchem Halbjahr bist du gerade?
            </Text>
            <Card>
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Jahrgangsstufe</Text>
              <SegmentedControl
                scroll
                value={gradeLevel}
                onChange={setGradeLevel}
                options={gradeLevels(preset.gradeFrom, preset.gradeTo).map((g) => ({
                  label: `${g}`,
                  value: g,
                }))}
              />
            </Card>
            <Card>
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Halbjahr</Text>
              <SegmentedControl
                value={half}
                onChange={setHalf}
                options={[
                  { label: '1. Halbjahr', value: 1 },
                  { label: '2. Halbjahr', value: 2 },
                ]}
              />
            </Card>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Deine Fächer</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Tippe Fächer an oder ab. Du kannst später jederzeit welche ergänzen.
            </Text>
            <View style={styles.chips}>
              {subjectPool.map((name) => (
                <Chip
                  key={name}
                  label={name}
                  selected={selected.has(name)}
                  onPress={() => toggleSubject(name)}
                />
              ))}
            </View>
            <View style={styles.addRow}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={addExtra}
                placeholder="Fach hinzufügen"
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />
              <PrimaryButton label="+" variant="muted" onPress={addExtra} />
            </View>
          </>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + 12, borderTopColor: colors.border },
        ]}
      >
        {step > 0 ? (
          <View style={styles.footerSecondary}>
            <PrimaryButton label="Zurück" variant="muted" onPress={() => setStep((s) => s - 1)} />
          </View>
        ) : null}
        <View style={styles.footerPrimary}>
          <PrimaryButton
            label={step === 2 ? 'Fertig' : 'Weiter'}
            disabled={!canContinue}
            onPress={() => {
              if (!canContinue) return;
              if (step === 2) finish();
              else setStep((s) => s + 1);
            }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 28, height: 4, borderRadius: 2 },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: typography.weightSemibold, letterSpacing: -0.4 },
  subtitle: { fontSize: 15, lineHeight: 21, marginBottom: 4 },
  typeCard: {
    borderRadius: radii.control,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 4,
  },
  typeName: { fontSize: 17, fontWeight: typography.weightSemibold },
  typeMeta: { fontSize: 13 },
  cardLabel: { fontSize: 13, fontWeight: typography.weightMedium },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  input: {
    flex: 1,
    height: 48,
    borderRadius: radii.control,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerSecondary: { flex: 1 },
  footerPrimary: { flex: 2 },
  demoInline: { alignItems: 'center', paddingVertical: 14 },
  demoText: { fontSize: 14, fontWeight: typography.weightMedium, textDecorationLine: 'underline' },
});
