import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { radii, typography, type ThemeMode } from '@/constants/theme';
import { usePurchase } from '@/hooks/usePurchase';
import { useTheme } from '@/hooks/useTheme';

const MODES: { key: ThemeMode; label: string }[] = [
  { key: 'system', label: 'System' },
  { key: 'light', label: 'Hell' },
  { key: 'dark', label: 'Dunkel' },
];

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const { isPro, restore, devReset, purchasePro } = usePurchase();
  return (
    <Screen>
      <Text style={[styles.title, { color: colors.text }]}>Einstellungen</Text>

      <Card>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Erscheinungsbild</Text>
        <View style={styles.row}>
          {MODES.map((m) => {
            const active = mode === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => setMode(m.key)}
                style={[
                  styles.chip,
                  { backgroundColor: active ? colors.tint : colors.surfaceMuted },
                ]}
              >
                <Text
                  style={{
                    color: active ? colors.tintText : colors.text,
                    fontWeight: typography.weightMedium,
                  }}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Pro</Text>
        <Text style={{ color: colors.textMuted }}>
          {isPro ? 'Freigeschaltet' : 'Nicht freigeschaltet'}
        </Text>
        {!isPro && <PrimaryButton label="Pro freischalten" onPress={() => void purchasePro()} />}
        <PrimaryButton
          label="Kauf wiederherstellen"
          variant="muted"
          onPress={() => void restore()}
        />
      </Card>

      {__DEV__ && (
        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Dev</Text>
          <Text style={{ color: colors.textMuted }}>Nur in der Entwicklung sichtbar.</Text>
          <PrimaryButton label="Pro zurücksetzen" variant="muted" onPress={() => void devReset()} />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 34, fontWeight: typography.weightSemibold, letterSpacing: -0.5 },
  cardTitle: { fontSize: 18, fontWeight: typography.weightSemibold },
  row: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: radii.control },
});
