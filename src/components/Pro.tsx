import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { radii, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

/** A small "Pro" tag for locked features. */
export function ProBadge() {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: colors.tint }]}>
      <Text style={[styles.badgeText, { color: colors.tintText }]}>Pro</Text>
    </View>
  );
}

function Lock({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={10} width={14} height={10} rx={2.5} stroke={color} strokeWidth={1.6} />
      <Path d="M8 10V7.5a4 4 0 0 1 8 0V10" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * A card standing in for a Pro-only feature: title + one-line value, a lock, and
 * the unlock action. Keeps the gate honest — the user always sees what they'd get.
 */
export function LockedCard({
  title,
  description,
  onUnlock,
}: {
  title: string;
  description: string;
  onUnlock: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Card>
      <View style={styles.header}>
        <Lock color={colors.textMuted} />
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <ProBadge />
      </View>
      <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>
      <PrimaryButton label="Mit Pro freischalten" variant="muted" onPress={onUnlock} />
    </Card>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  badgeText: { fontSize: 11, fontWeight: typography.weightSemibold, letterSpacing: 0.3 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 17, fontWeight: typography.weightSemibold },
  description: { fontSize: 14, lineHeight: 20 },
});
