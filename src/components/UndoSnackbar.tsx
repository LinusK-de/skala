import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radii, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface UndoState {
  message: string;
  onUndo: () => void;
}

interface UndoContextValue {
  /** Show a transient bar with a "Rückgängig" action for a just-done destructive change. */
  showUndo: (message: string, onUndo: () => void) => void;
}

const UndoContext = createContext<UndoContextValue | null>(null);

export function UndoProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<UndoState | null>(null);
  const translateY = useRef(new Animated.Value(120)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    Animated.timing(translateY, { toValue: 120, duration: 180, useNativeDriver: true }).start(
      ({ finished }) => {
        if (finished) setState(null);
      },
    );
  }, [translateY]);

  const showUndo = useCallback(
    (message: string, onUndo: () => void) => {
      setState({ message, onUndo });
      translateY.setValue(120);
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(hide, 4500);
    },
    [hide, translateY],
  );

  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);

  return (
    <UndoContext.Provider value={{ showUndo }}>
      {children}
      {state ? (
        <Animated.View
          style={[
            styles.bar,
            {
              backgroundColor: colors.text,
              bottom: insets.bottom + 92,
              transform: [{ translateY }],
            },
          ]}
        >
          <Text style={[styles.message, { color: colors.background }]} numberOfLines={1}>
            {state.message}
          </Text>
          <Pressable
            hitSlop={8}
            onPress={() => {
              state.onUndo();
              hide();
            }}
          >
            <Text style={[styles.action, { color: colors.background }]}>Rückgängig</Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </UndoContext.Provider>
  );
}

export function useUndo(): UndoContextValue {
  const ctx = useContext(UndoContext);
  if (!ctx) throw new Error('useUndo must be used within an UndoProvider');
  return ctx;
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radii.control,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  message: { flex: 1, fontSize: 14, fontWeight: typography.weightMedium },
  action: { fontSize: 14, fontWeight: typography.weightSemibold },
});
