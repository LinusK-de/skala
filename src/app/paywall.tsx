import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { typography } from '@/constants/theme';
import { usePurchase } from '@/hooks/usePurchase';
import { useTheme } from '@/hooks/useTheme';

const FEATURES = [
  'Notenverteilung je Fach und Halbjahr',
  'Fächerübergreifende Prognosen & Was-wäre-wenn',
  'Alle zukünftigen Pro-Funktionen inklusive',
];

export default function PaywallScreen() {
  const { colors } = useTheme();
  const { purchasePro, restore } = usePurchase();
  const router = useRouter();
  return (
    <Screen>
      <Text style={[styles.title, { color: colors.text }]}>Skala Pro</Text>
      <Text style={[styles.body, { color: colors.textMuted }]}>
        Der komplette Alltag — Fächer, Noten, Schnitte, Ziele, Verlauf und Backup — bleibt für immer
        kostenlos. Pro schaltet zusätzliche Auswertungen frei.
      </Text>
      <Card>
        {FEATURES.map((f) => (
          <View key={f} style={styles.featureRow}>
            <Text style={[styles.check, { color: colors.positive }]}>✓</Text>
            <Text style={[styles.feature, { color: colors.text }]}>{f}</Text>
          </View>
        ))}
      </Card>
      <Card>
        <Text style={[styles.price, { color: colors.text }]}>Einmaliger Kauf — kein Abo</Text>
        <PrimaryButton
          label="Jetzt freischalten"
          onPress={() => {
            void (async () => {
              await purchasePro();
              router.back();
            })();
          }}
        />
        <PrimaryButton
          label="Kauf wiederherstellen"
          variant="muted"
          onPress={() => void restore()}
        />
      </Card>
      <Text style={[styles.note, { color: colors.textMuted }]}>
        Hinweis: In Expo Go ist der Kauf simuliert. Der echte In-App-Kauf wird erst im EAS-Build
        aktiv — siehe README.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: typography.weightSemibold },
  body: { fontSize: 16, lineHeight: 22 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  check: { fontSize: 16, fontWeight: typography.weightSemibold },
  feature: { fontSize: 15, flex: 1 },
  price: { fontSize: 18, fontWeight: typography.weightSemibold },
  note: { fontSize: 13, lineHeight: 18 },
});
