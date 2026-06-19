import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { radii, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { formatTime, minutesOfDay } from '@/lib/timetable';

/**
 * A themed date/time field. On iOS it renders the native compact control inline;
 * on Android it shows a tappable value that opens the platform dialog. The picker
 * follows the app's light/dark scheme via `themeVariant` (DECISION-0001 parity).
 */
export function DateTimeField({
  mode,
  value,
  onChange,
}: {
  mode: 'date' | 'time';
  value: Date;
  onChange: (date: Date) => void;
}) {
  const { colors, scheme } = useTheme();
  const [show, setShow] = useState(false);

  if (Platform.OS === 'ios') {
    return (
      <DateTimePicker
        value={value}
        mode={mode}
        display="compact"
        themeVariant={scheme}
        onChange={(_: DateTimePickerEvent, d?: Date) => d && onChange(d)}
      />
    );
  }

  const text = mode === 'date' ? formatDate(value) : formatTime(minutesOfDay(value));
  return (
    <>
      <Pressable
        onPress={() => setShow(true)}
        style={[styles.field, { backgroundColor: colors.surfaceMuted }]}
      >
        <Text style={[styles.text, { color: colors.text }]}>{text}</Text>
      </Pressable>
      {show ? (
        <DateTimePicker
          value={value}
          mode={mode}
          onChange={(event: DateTimePickerEvent, d?: Date) => {
            setShow(false);
            if (event.type === 'set' && d) onChange(d);
          }}
        />
      ) : null}
    </>
  );
}

function formatDate(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(date.getDate())}.${p(date.getMonth() + 1)}.${date.getFullYear()}`;
}

const styles = StyleSheet.create({
  field: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.control,
  },
  text: { fontSize: 15, fontWeight: typography.weightMedium, fontVariant: ['tabular-nums'] },
});
