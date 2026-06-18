import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SegmentedControl } from '@/components/SegmentedControl';
import { radii, typography } from '@/constants/theme';
import { createStage, createSubject, createTerm, listSubjects } from '@/db';
import { useCurrentContext } from '@/hooks/useCareer';
import { useTheme } from '@/hooks/useTheme';
import {
  defaultWeights,
  scaleSpec,
  schoolTypePreset,
  SCHOOL_TYPES,
  type SchoolType,
} from '@/lib/grades';
import { currentSchoolYear, gradeLevels, termLabel } from '@/lib/school';

export default function NewStageScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { stage: currentStage } = useCurrentContext();

  const [schoolType, setSchoolType] = useState<SchoolType | null>(null);
  const [gradeLevel, setGradeLevel] = useState(11);
  const [half, setHalf] = useState(1);
  const [carry, setCarry] = useState(true);

  const preset = schoolType ? schoolTypePreset(schoolType) : null;

  const choose = (type: SchoolType) => {
    const p = schoolTypePreset(type);
    setSchoolType(type);
    setGradeLevel(p.gradeFrom);
    setHalf(1);
  };

  const create = () => {
    if (!preset || !schoolType) return;
    const stageId = createStage({
      name: preset.stageName,
      schoolType,
      scale: preset.scale,
      gradeFrom: preset.gradeFrom,
      gradeTo: preset.gradeTo,
    });
    createTerm(
      {
        stageId,
        schoolYear: currentSchoolYear(new Date()),
        gradeLevel,
        half,
        label: termLabel(gradeLevel, half),
      },
      true,
    );
    if (carry && currentStage) {
      for (const subject of listSubjects(currentStage.id)) {
        const weights = defaultWeights(subject.isCore, preset.scale);
        createSubject({
          stageId,
          name: subject.name,
          scale: preset.scale,
          isCore: subject.isCore,
          writtenWeight: weights.writtenWeight,
          oralWeight: weights.oralWeight,
          colorKey: subject.colorKey,
        });
      }
    }
    router.replace('/');
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.intro, { color: colors.textMuted }]}>
          Ein neuer Abschnitt (z. B. der Wechsel auf die Oberstufe) bekommt automatisch die passende
          Notenskala. Deine bisherigen Noten bleiben erhalten.
        </Text>

        <Text style={[styles.label, { color: colors.textMuted }]}>Schulform</Text>
        {SCHOOL_TYPES.filter((t) => t.type !== 'custom').map((t) => {
          const active = schoolType === t.type;
          return (
            <Pressable
              key={t.type}
              onPress={() => choose(t.type)}
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

        {preset ? (
          <>
            <Card>
              <Text style={[styles.label, { color: colors.textMuted }]}>Jahrgangsstufe</Text>
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
              <Text style={[styles.label, { color: colors.textMuted }]}>Halbjahr</Text>
              <SegmentedControl
                value={half}
                onChange={setHalf}
                options={[
                  { label: '1. Halbjahr', value: 1 },
                  { label: '2. Halbjahr', value: 2 },
                ]}
              />
            </Card>
            {currentStage ? (
              <Card>
                <View style={styles.carryRow}>
                  <Text style={[styles.carryLabel, { color: colors.text }]}>
                    Fächer aus „{currentStage.name}“ übernehmen
                  </Text>
                  <Switch
                    value={carry}
                    onValueChange={setCarry}
                    trackColor={{ true: colors.tint, false: colors.surfaceMuted }}
                  />
                </View>
              </Card>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + 12, borderTopColor: colors.border },
        ]}
      >
        <PrimaryButton label="Abschnitt anlegen" onPress={create} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, gap: 12, paddingBottom: 32 },
  intro: { fontSize: 14, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: typography.weightMedium },
  typeCard: {
    borderRadius: radii.control,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 4,
  },
  typeName: { fontSize: 17, fontWeight: typography.weightSemibold },
  typeMeta: { fontSize: 13 },
  carryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  carryLabel: { fontSize: 15, flex: 1, marginRight: 12, fontWeight: typography.weightMedium },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
