import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavThemeProvider,
  type Theme,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useDatabaseMigrations } from '@/db';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';

export default function RootLayout() {
  // Run pending migrations before the app touches the database. Gate the UI on success.
  const { success, error } = useDatabaseMigrations();

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Database migration failed: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <ThemedNavigation />
      </SafeAreaProvider>
    </ThemeProvider>
  );
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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="paywall"
          options={{ headerShown: true, presentation: 'modal', title: 'Pro' }}
        />
      </Stack>
    </NavThemeProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: '#b00020', textAlign: 'center' },
});
