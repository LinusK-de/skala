import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { FAB } from '@/components/FAB';
import { typography } from '@/constants/theme';
import { clearCompletedHomework, setHomeworkDone } from '@/db';
import { useHomework, type HomeworkWithSubject } from '@/hooks/useHomework';
import { useTheme } from '@/hooks/useTheme';
import { dueBucketLabel, formatDueShort } from '@/lib/timetable';

export default function HausaufgabenScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { groups, done, openCount, overdueCount } = useHomework();
  const now = new Date();

  const toggle = (item: HomeworkWithSubject) => {
    void Haptics.selectionAsync().catch(() => {});
    setHomeworkDone(item.item.id, !item.item.done);
  };

  const clearDone = () => {
    Alert.alert('Erledigte aufräumen?', 'Alle erledigten Hausaufgaben werden entfernt.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Aufräumen', style: 'destructive', onPress: () => clearCompletedHomework() },
    ]);
  };

  const empty = openCount === 0 && done.length === 0;
  const subtitle =
    overdueCount > 0
      ? `${openCount} offen · ${overdueCount} überfällig`
      : openCount > 0
        ? `${openCount} offen`
        : 'Nichts offen';

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.heading, { color: colors.text }]}>Hausaufgaben</Text>
        {!empty ? (
          <Text
            style={[
              styles.subtitle,
              { color: overdueCount > 0 ? colors.warning : colors.textMuted },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 130 }]}>
        {empty ? (
          <Card>
            <EmptyState
              title="Keine Hausaufgaben"
              subtitle="Trage eine Aufgabe ein — sie kann sich automatisch an deine nächste Stunde hängen."
              actionLabel="Hausaufgabe hinzufügen"
              onAction={() => router.push('/homework/new')}
            />
          </Card>
        ) : (
          <>
            {openCount === 0 ? (
              <Card>
                <Text style={[styles.allDone, { color: colors.positive }]}>
                  Nichts offen — stark!
                </Text>
              </Card>
            ) : (
              groups.map((group) => (
                <View key={group.bucket} style={styles.group}>
                  <Text
                    style={[
                      styles.groupLabel,
                      { color: group.bucket === 'overdue' ? colors.warning : colors.textMuted },
                    ]}
                  >
                    {dueBucketLabel(group.bucket)}
                  </Text>
                  <Card style={styles.groupCard}>
                    {group.items.map((h, i) => (
                      <HomeworkRow
                        key={h.item.id}
                        item={h}
                        now={now}
                        last={i === group.items.length - 1}
                        onToggle={() => toggle(h)}
                        onOpen={() => router.push(`/homework/${h.item.id}`)}
                      />
                    ))}
                  </Card>
                </View>
              ))
            )}

            {done.length > 0 ? (
              <View style={styles.group}>
                <View style={styles.doneHeader}>
                  <Text style={[styles.groupLabel, { color: colors.textMuted }]}>
                    Erledigt · {done.length}
                  </Text>
                  <Pressable onPress={clearDone} hitSlop={6}>
                    <Text style={[styles.clear, { color: colors.tint }]}>Aufräumen</Text>
                  </Pressable>
                </View>
                <Card style={styles.groupCard}>
                  {done.map((h, i) => (
                    <HomeworkRow
                      key={h.item.id}
                      item={h}
                      now={now}
                      last={i === done.length - 1}
                      onToggle={() => toggle(h)}
                      onOpen={() => router.push(`/homework/${h.item.id}`)}
                    />
                  ))}
                </Card>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <FAB label="Aufgabe" onPress={() => router.push('/homework/new')} />
    </View>
  );
}

function HomeworkRow({
  item,
  now,
  last,
  onToggle,
  onOpen,
}: {
  item: HomeworkWithSubject;
  now: Date;
  last: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const { colors } = useTheme();
  const done = item.item.done;
  const dueColor =
    done || item.bucket === 'none'
      ? colors.textMuted
      : item.bucket === 'overdue'
        ? colors.warning
        : item.bucket === 'today'
          ? colors.text
          : colors.textMuted;

  return (
    <View
      style={[
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <Pressable onPress={onToggle} hitSlop={8} style={styles.checkWrap}>
        <View
          style={[
            styles.check,
            done
              ? { backgroundColor: colors.tint, borderColor: colors.tint }
              : { borderColor: colors.border },
          ]}
        >
          {done ? <Text style={[styles.checkMark, { color: colors.tintText }]}>✓</Text> : null}
        </View>
      </Pressable>
      <Pressable onPress={onOpen} style={styles.main}>
        <Text
          style={[
            styles.title,
            { color: done ? colors.textMuted : colors.text },
            done && styles.struck,
          ]}
          numberOfLines={2}
        >
          {item.item.title}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {item.subject?.name ?? '—'}
          {!done ? (
            <Text
              style={{ color: dueColor }}
            >{` · ${formatDueShort(item.item.dueAt ? item.item.dueAt.getTime() : null, now)}`}</Text>
          ) : null}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8, gap: 2 },
  heading: { fontSize: 32, fontWeight: typography.weightSemibold, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontWeight: typography.weightMedium },
  content: { paddingHorizontal: 20, paddingTop: 4, gap: 16 },
  allDone: {
    fontSize: 15,
    fontWeight: typography.weightMedium,
    textAlign: 'center',
    paddingVertical: 8,
  },
  group: { gap: 8 },
  groupLabel: {
    fontSize: 13,
    fontWeight: typography.weightSemibold,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  groupCard: { paddingVertical: 6 },
  doneHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clear: { fontSize: 13, fontWeight: typography.weightMedium },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  checkWrap: { paddingVertical: 2 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { fontSize: 14, fontWeight: typography.weightSemibold, marginTop: -1 },
  main: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontWeight: typography.weightMedium },
  struck: { textDecorationLine: 'line-through' },
  meta: { fontSize: 13 },
});
