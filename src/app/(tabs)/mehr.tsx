import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProBadge } from '@/components/Pro';
import { SegmentedControl } from '@/components/SegmentedControl';
import { typography, type ThemeMode } from '@/constants/theme';
import { useBackup } from '@/hooks/useBackup';
import { useCurrentContext, useStages } from '@/hooks/useCareer';
import { usePurchase } from '@/hooks/usePurchase';
import { useTheme } from '@/hooks/useTheme';
import { scaleSpec, type Scale } from '@/lib/grades';

const THEME_MODES: { label: string; value: ThemeMode }[] = [
  { label: 'System', value: 'system' },
  { label: 'Hell', value: 'light' },
  { label: 'Dunkel', value: 'dark' },
];

export default function MehrScreen() {
  const { colors, mode, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPro, restore, devReset } = usePurchase();
  const { busy, exportBackup, importBackup } = useBackup();
  const stages = useStages();
  const { stage: currentStage } = useCurrentContext();

  const runImport = () => {
    Alert.alert(
      'Backup importieren?',
      'Dadurch werden alle aktuellen Daten durch das Backup ersetzt.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Importieren',
          style: 'destructive',
          onPress: () => {
            void importBackup().then((result) => {
              if (result === 'ok') Alert.alert('Fertig', 'Deine Daten wurden importiert.');
              else if (result === 'invalid')
                Alert.alert('Ungültig', 'Diese Datei ist kein Skala-Backup.');
              else if (result === 'error')
                Alert.alert('Fehler', 'Das Backup konnte nicht gelesen werden.');
            });
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.heading, { color: colors.text }]}>Mehr</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Erscheinungsbild</Text>
          <SegmentedControl options={THEME_MODES} value={mode} onChange={setMode} />
        </Card>

        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Schullaufbahn</Text>
          {stages.map((s) => {
            const isCurrent = currentStage?.id === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => router.push(`/stage/${s.id}`)}
                style={[styles.row, { borderBottomColor: colors.border }]}
              >
                <View style={styles.rowLeft}>
                  {isCurrent ? (
                    <View style={[styles.dot, { backgroundColor: colors.tint }]} />
                  ) : (
                    <View style={styles.dotGap} />
                  )}
                  <View>
                    <Text style={[styles.rowName, { color: colors.text }]}>{s.name}</Text>
                    <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                      Klasse {s.gradeFrom}–{s.gradeTo} · {scaleSpec(s.scale as Scale).label}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
              </Pressable>
            );
          })}
          <PrimaryButton
            label="Neuen Abschnitt hinzufügen"
            variant="muted"
            onPress={() => router.push('/stage/new')}
          />
        </Card>

        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Datensicherung</Text>
          <Text style={[styles.muted, { color: colors.textMuted }]}>
            Deine Noten liegen nur auf diesem Gerät. Exportiere regelmäßig ein Backup.
          </Text>
          <PrimaryButton label="Backup exportieren" onPress={() => void exportBackup()} />
          <PrimaryButton label="Backup importieren" variant="muted" onPress={runImport} />
          {busy ? (
            <Text style={[styles.muted, { color: colors.textMuted }]}>Einen Moment …</Text>
          ) : null}
        </Card>

        <Card>
          <View style={styles.proHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Skala Pro</Text>
            <ProBadge />
          </View>
          <Text style={[styles.muted, { color: colors.textMuted }]}>
            {isPro
              ? 'Freigeschaltet — danke! Alle Funktionen sind aktiv.'
              : 'Einmal kaufen, für immer behalten. Schaltet Notenverteilung und Prognosen frei.'}
          </Text>
          {!isPro ? (
            <>
              <PrimaryButton label="Pro freischalten" onPress={() => router.push('/paywall')} />
              <PrimaryButton
                label="Kauf wiederherstellen"
                variant="muted"
                onPress={() => void restore()}
              />
            </>
          ) : null}
        </Card>

        {__DEV__ ? (
          <Card>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Dev</Text>
            <PrimaryButton
              label="Pro zurücksetzen"
              variant="muted"
              onPress={() => void devReset()}
            />
          </Card>
        ) : null}

        <Text style={[styles.footer, { color: colors.textMuted }]}>
          Skala · Notentracker · lokal & ohne Konto
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  heading: { fontSize: 32, fontWeight: typography.weightSemibold, letterSpacing: -0.5 },
  content: { paddingHorizontal: 20, paddingTop: 4, gap: 16 },
  cardTitle: { fontSize: 18, fontWeight: typography.weightSemibold },
  muted: { fontSize: 14, lineHeight: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotGap: { width: 8, height: 8 },
  rowName: { fontSize: 16, fontWeight: typography.weightMedium },
  rowSub: { fontSize: 13, marginTop: 2 },
  chevron: { fontSize: 20 },
  proHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 8 },
});
