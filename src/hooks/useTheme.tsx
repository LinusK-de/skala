import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { palettes, type ColorScheme, type ThemeColors, type ThemeMode } from '@/constants/theme';
import { getSetting, setSetting } from '@/db';

/** Key under which the chosen theme mode is persisted in the settings table. */
const THEME_MODE_KEY = 'themeMode';

interface ThemeContextValue {
  /** What the user picked: 'system' | 'light' | 'dark'. */
  mode: ThemeMode;
  /** The resolved scheme that drives the colors. */
  scheme: ColorScheme;
  /** Colors for the current scheme. */
  colors: ThemeColors;
  /** Change the mode and persist the choice. */
  setMode: (mode: ThemeMode) => void;
  /** Re-reads the persisted mode — for after a data reset. */
  refresh: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  // Load the persisted choice once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await getSetting(THEME_MODE_KEY);
      if (cancelled) return;
      if (isThemeMode(saved)) setModeState(saved);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    // Best-effort persist: a failed write shouldn't crash with an unhandled
    // rejection — the in-memory choice still applies for this session.
    void setSetting(THEME_MODE_KEY, next).catch(() => {});
  }, []);

  const refresh = useCallback(async () => {
    const saved = await getSetting(THEME_MODE_KEY);
    setModeState(isThemeMode(saved) ? saved : 'system');
  }, []);

  const scheme: ColorScheme =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, scheme, colors: palettes[scheme], setMode, refresh }),
    [mode, scheme, setMode, refresh],
  );

  // Hold rendering until the saved choice is known, so the app never flashes the wrong theme.
  if (!loaded) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
