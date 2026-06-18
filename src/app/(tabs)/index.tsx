import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { typography } from '@/constants/theme';
import { usePurchase } from '@/hooks/usePurchase';
import { useTheme } from '@/hooks/useTheme';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { isPro } = usePurchase();
  const router = useRouter();
  return (
    <Screen>
      <Text style={[styles.title, { color: colors.text }]}>App Template</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Lokal-first Expo-Skelett im Satura-Design. Ersetze diesen Screen durch deine App-Idee.
      </Text>
      <Card>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Status</Text>
        <Text style={{ color: colors.textMuted }}>
          {isPro ? 'Pro freigeschaltet — danke!' : 'Kostenlose Version'}
        </Text>
        {!isPro && (
          <PrimaryButton label="Pro freischalten" onPress={() => router.push('/paywall')} />
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 34, fontWeight: typography.weightSemibold, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, lineHeight: 22 },
  cardTitle: { fontSize: 18, fontWeight: typography.weightSemibold },
});
