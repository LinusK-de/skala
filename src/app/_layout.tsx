import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavThemeProvider,
  type Theme,
} from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { UndoProvider } from '@/components/UndoSnackbar';
import { palettes } from '@/constants/theme';
import { stagesQuery, useDatabaseMigrations, useLiveQuery } from '@/db';
import { PurchaseProvider } from '@/hooks/usePurchase';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';

export default function RootLayout() {
  // Run pending migrations before the app touches the database. Gate the UI on success.
  const { success, error } = useDatabaseMigrations();
  // These gate screens render BEFORE ThemeProvider (which itself reads the DB), so
  // theme them from the system scheme directly — no DB dependency.
  const systemScheme = useColorScheme();
  const colors = palettes[systemScheme === 'dark' ? 'dark' : 'light'];

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.warning }]}>
          Datenbank-Migration fehlgeschlagen: {error.message}
        </Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <ThemeProvider>
        <SafeAreaProvider>
          <PurchaseProvider>
            <UndoProvider>
              <ThemedNavigation />
            </UndoProvider>
          </PurchaseProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

/** Sends a first-run user (no stages yet) to onboarding. Returns nothing visible. */
function RouteGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { data } = useLiveQuery(stagesQuery());

  useEffect(() => {
    if (data === undefined) return; // still loading
    const inOnboarding = segments[0] === 'onboarding';
    if (data.length === 0 && !inOnboarding) router.replace('/onboarding');
  }, [data, segments, router]);

  return null;
}

// Bridges our theme into React Navigation so the navigator chrome and status bar follow it too.
function ThemedNavigation() {
  const { scheme, colors } = useTheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme: Theme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.tint,
    },
  };

  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <RouteGuard />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="subject/[id]" options={{ headerShown: true, title: 'Fach' }} />
        <Stack.Screen
          name="grade/new"
          options={{ headerShown: true, presentation: 'modal', title: 'Note eintragen' }}
        />
        <Stack.Screen
          name="grade/[id]"
          options={{ headerShown: true, presentation: 'modal', title: 'Note bearbeiten' }}
        />
        <Stack.Screen
          name="stage/new"
          options={{ headerShown: true, presentation: 'modal', title: 'Neuer Abschnitt' }}
        />
        <Stack.Screen name="stage/[id]" options={{ headerShown: true, title: 'Abschnitt' }} />
        <Stack.Screen
          name="paywall"
          options={{ headerShown: true, presentation: 'modal', title: 'Pro' }}
        />
      </Stack>
    </NavThemeProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { textAlign: 'center' },
});
