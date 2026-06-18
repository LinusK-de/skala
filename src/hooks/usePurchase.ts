import { useCallback, useEffect, useState } from 'react';

import { getSetting, setSetting } from '@/db';
import { entitlementFromFlag, PRO_UNLOCKED_KEY, type Entitlement } from '@/lib/purchase';

/**
 * React glue for the one-time-purchase gate. Reads the persisted unlock flag
 * and exposes actions. The `purchasePro` / `restore` bodies are STUBS for Expo
 * Go development — replace them with RevenueCat calls at EAS-build time
 * (README → "Graduating to real in-app purchase"). The rest of the app should
 * only ever depend on this hook, never on the store SDK directly.
 */
export function usePurchase() {
  const [entitlement, setEntitlement] = useState<Entitlement>('free');
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const flag = await getSetting(PRO_UNLOCKED_KEY);
    setEntitlement(entitlementFromFlag(flag));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const flag = await getSetting(PRO_UNLOCKED_KEY);
      if (cancelled) return;
      setEntitlement(entitlementFromFlag(flag));
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Buy the Pro unlock. STUB: flips the local flag. Replace with RevenueCat. */
  const purchasePro = useCallback(async () => {
    await setSetting(PRO_UNLOCKED_KEY, 'true');
    await refresh();
  }, [refresh]);

  /** Restore a previous purchase. STUB: re-reads the local flag. */
  const restore = useCallback(async () => {
    await refresh();
  }, [refresh]);

  /** Dev-only: clear the unlock to re-test the paywall. */
  const devReset = useCallback(async () => {
    await setSetting(PRO_UNLOCKED_KEY, 'false');
    await refresh();
  }, [refresh]);

  return {
    entitlement,
    isPro: entitlement === 'pro',
    loaded,
    purchasePro,
    restore,
    devReset,
  };
}
