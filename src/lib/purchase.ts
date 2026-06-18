/**
 * Monetization model for our apps: the app is free to use, with a single
 * non-consumable "Pro" unlock bought ONCE (no subscriptions). This module is
 * PURE — no React, no native modules — so it runs in Expo Go and is trivially
 * unit-testable.
 *
 * The real store integration (RevenueCat / react-native-purchases) is wired in
 * only at EAS-build time — it cannot run in Expo Go. Until then, the
 * `pro_unlocked` flag in the `settings` table is the source of truth and can be
 * flipped from the dev controls on the Settings screen (guarded by __DEV__).
 * See README → "Graduating to real in-app purchase".
 */
export type Entitlement = 'free' | 'pro';

/** Settings key holding the persisted unlock flag ('true' once purchased). */
export const PRO_UNLOCKED_KEY = 'pro_unlocked';

/** Derive the entitlement from the persisted flag. */
export function entitlementFromFlag(flag: string | null): Entitlement {
  return flag === 'true' ? 'pro' : 'free';
}

/** Whether the user has the Pro unlock. */
export function isPro(entitlement: Entitlement): boolean {
  return entitlement === 'pro';
}

/**
 * Gate a feature. Free features are always allowed; Pro-only features require
 * the unlock. Keep this the single decision point so the paywall logic can't
 * drift between screens.
 */
export function canUse(entitlement: Entitlement, feature: { pro: boolean }): boolean {
  return feature.pro ? isPro(entitlement) : true;
}
