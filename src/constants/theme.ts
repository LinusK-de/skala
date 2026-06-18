/**
 * Theme colors and design tokens. Pure constants — no React, no I/O.
 *
 * This is the shared design language across all of our apps (inherited from
 * Satura): calm, neutral palettes — warm off-white surfaces in light mode and
 * a clean true-black system in dark mode. The dark palette is tuned on its own
 * instead of deriving colors mechanically from light mode. Color is reserved
 * for data (warning red, positive sage); the UI chrome stays monochrome ink.
 */
export type ThemeMode = 'system' | 'light' | 'dark';
export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  /** App / screen background (warm off-white). */
  background: string;
  /** Cards and elevated surfaces sitting on the background. */
  surface: string;
  /** A slightly darker surface for inset / secondary fills. */
  surfaceMuted: string;
  /** Primary text (near-black charcoal). */
  text: string;
  /** Secondary / muted text. */
  textMuted: string;
  /** Hairline borders and dividers. */
  border: string;
  /** Accent color: active tab, links, primary actions (charcoal — reads as ink). */
  tint: string;
  /** Foreground (text / icon) color placed on top of a `tint` fill. */
  tintText: string;
  /** A softer wash behind accented content. */
  tintSoft: string;
  /** Over-budget / warning color — a warm red, visible but not garish. */
  warning: string;
  /** On-target / success color — a muted sage, never a bright green. */
  positive: string;
  /** Tab bar background. */
  tabBar: string;
  /** Inactive tab icon color. */
  tabBarInactive: string;
  /** Muted taupe/blush accents for charts, bars and subtle highlights. */
  accent1: string;
  accent2: string;
  accent3: string;
}

/** Warm off-white background, white cards, charcoal ink, soft taupe/blush accents. */
export const lightColors: ThemeColors = {
  background: '#F7F6F4',
  surface: '#FFFFFF',
  surfaceMuted: '#EFECE8',
  text: '#1C1C22',
  textMuted: '#8D877F',
  border: '#E5E1DC',
  tint: '#1C1C22',
  tintText: '#FFFFFF',
  tintSoft: '#EFECE8',
  warning: '#BF4030',
  positive: '#7C8A6B',
  tabBar: '#FFFFFF',
  tabBarInactive: '#8D877F',
  accent1: '#C5B8AF',
  accent2: '#D9C2BA',
  accent3: '#E7D2CC',
};

/**
 * Clean, true-black "dark" theme in the Trade Republic spirit: a pure black
 * canvas with cards lifted by iOS-style elevation greys (#1C1C1E / #2C2C2E),
 * crisp near-white text and quiet grey labels. The neutrals are deliberately
 * neutral (no grey cast that reads as "dimmed"), while the warm brand identity
 * is preserved through the blush/taupe chart accents. The UI chrome is
 * monochrome: `tint` is a near-white so filled buttons, the active tab and
 * links read as bright "ink" on black, with dark `tintText` on top — the exact
 * inverse of the light theme. Color is reserved for data (warning, positive).
 */
export const darkColors: ThemeColors = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceMuted: '#2C2C2E',
  text: '#F4F3F0',
  textMuted: '#8E8E93',
  border: '#2A2A2C',
  tint: '#F4F3F0',
  tintText: '#1C1C1E',
  tintSoft: '#2C2C2E',
  warning: '#E5705E',
  positive: '#A9B58F',
  tabBar: '#000000',
  tabBarInactive: '#8E8E93',
  accent1: '#C9BBB4',
  accent2: '#E0C2B8',
  accent3: '#BFB3B8',
};

/** Corner radii. Cards use a generous, premium radius. */
export const radii = {
  card: 32,
  control: 16,
  pill: 999,
} as const;

/**
 * Typography tokens. We rely on the system font (San Francisco on iOS — i.e.
 * SF Pro — and Roboto on Android); SF Pro Display can't be bundled for
 * licensing reasons. Only weights are pinned here.
 */
export const typography = {
  weightMedium: '500',
  weightSemibold: '600',
} as const;

export const palettes: Record<ColorScheme, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};
