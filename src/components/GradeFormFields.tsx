import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { GradeGrid } from '@/components/GradeGrid';
import { Stepper } from '@/components/Stepper';
import { radii, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { Scale, Tendency } from '@/lib/grades';

export interface GradeDraft {
  subjectId: number | null;
  value: number | null;
  tendency: Tendency | null;
  categoryId: number | null;
  weight: number;
  date: number;
  note: string;
  counts: boolean;
}

export interface SubjectOption {
  id: number;
  name: string;
}

export interface CategoryOption {
  id: number;
  name: string;
}

const DAY = 86_400_000;

function dateLabel(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/**
 * Presentational grade-entry fields. The owning screen holds the draft and the
 * category list (fetched for the selected subject) — this stays pure UI. Only the
 * grade tap is "required"; everything else is defaulted and tucked under Details.
 */
export function GradeFormFields({
  scale,
  subjects,
  categories,
  lockedSubject,
  draft,
  onChange,
}: {
  scale: Scale;
  subjects: SubjectOption[];
  categories: CategoryOption[];
  lockedSubject: boolean;
  draft: GradeDraft;
  onChange: (patch: Partial<GradeDraft>) => void;
}) {
  const { colors } = useTheme();
  const [showDetails, setShowDetails] = useState(false);

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
                onPress={() => onChange({ subjectId: s.id, categoryId: null })}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Note</Text>
        <GradeGrid
          scale={scale}
          value={draft.value}
          tendency={draft.tendency}
          onSelect={(value, tendency) => onChange({ value, tendency })}
        />
      </View>

      {categories.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Art</Text>
          <View style={styles.chipWrap}>
            {categories.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                selected={draft.categoryId === c.id}
                onPress={() => onChange({ categoryId: c.id })}
              />
            ))}
          </View>
        </View>
      ) : null}

      <Pressable onPress={() => setShowDetails((v) => !v)} style={styles.detailsToggle}>
        <Text style={[styles.detailsLabel, { color: colors.tint }]}>
          {showDetails ? 'Details ausblenden' : 'Weitere Details'} {showDetails ? '⌃' : '⌄'}
        </Text>
      </Pressable>

      {showDetails ? (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.text }]}>Datum</Text>
            <View style={styles.dateControl}>
              <Pressable onPress={() => onChange({ date: draft.date - DAY })} hitSlop={6}>
                <Text style={[styles.dateArrow, { color: colors.tint }]}>‹</Text>
              </Pressable>
              <Text style={[styles.dateValue, { color: colors.text }]}>
                {dateLabel(draft.date)}
              </Text>
              <Pressable
                onPress={() => onChange({ date: Math.min(Date.now(), draft.date + DAY) })}
                hitSlop={6}
              >
                <Text style={[styles.dateArrow, { color: colors.tint }]}>›</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.text }]}>Gewichtung</Text>
            <Stepper
              value={draft.weight}
              onChange={(weight) => onChange({ weight })}
              step={0.5}
              min={0.5}
              max={5}
              format={(n) => `×${n}`}
            />
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.text }]}>Zählt in den Schnitt</Text>
            <Switch
              value={draft.counts}
              onValueChange={(counts) => onChange({ counts })}
              trackColor={{ true: colors.tint, false: colors.surfaceMuted }}
            />
          </View>

          <TextInput
            value={draft.note}
            onChangeText={(note) => onChange({ note })}
            placeholder="Notiz (z. B. Thema)"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.note,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 18 },
  section: { gap: 10 },
  label: { fontSize: 13, fontWeight: typography.weightMedium },
  chipRow: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailsToggle: { alignItems: 'center', paddingVertical: 4 },
  detailsLabel: { fontSize: 14, fontWeight: typography.weightMedium },
  details: { gap: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailLabel: { fontSize: 15, fontWeight: typography.weightMedium },
  dateControl: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dateArrow: { fontSize: 24, fontWeight: typography.weightSemibold },
  dateValue: { fontSize: 15, fontWeight: typography.weightMedium, fontVariant: ['tabular-nums'] },
  note: {
    height: 48,
    borderRadius: radii.control,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    fontSize: 16,
  },
});
