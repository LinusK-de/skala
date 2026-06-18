import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { typography } from '@/constants/theme';
import { usePurchase } from '@/hooks/usePurchase';
import { useTheme } from '@/hooks/useTheme';

export default function PaywallScreen() {
  const { colors } = useTheme();
  const { purchasePro, restore } = usePurchase();
  const router = useRouter();
  return (
    <Screen>
      <Text style={[styles.title, { color: colors.text }]}>Pro freischalten</Text>
      <Text style={[styles.body, { color: colors.textMuted }]}>
        Einmal kaufen, für immer behalten — kein Abo. Alle Funktionen, lokal auf deinem Gerät.
      </Text>
      <Card>
        <Text style={[styles.price, { color: colors.text }]}>Einmaliger Kauf</Text>
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
        Hinweis: Im Expo-Go-Modus ist der Kauf simuliert. Der echte In-App-Kauf (RevenueCat) wird
        erst im EAS-Build aktiv — siehe README.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: typography.weightSemibold },
  body: { fontSize: 16, lineHeight: 22 },
  price: { fontSize: 20, fontWeight: typography.weightSemibold },
  note: { fontSize: 13, lineHeight: 18 },
});
