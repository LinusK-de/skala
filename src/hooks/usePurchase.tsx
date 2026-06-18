import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getSetting, setSetting } from '@/db';
import { entitlementFromFlag, PRO_UNLOCKED_KEY, type Entitlement } from '@/lib/purchase';

/**
 * App-global one-time-purchase gate. The entitlement lives in ONE provider mounted
 * at the root, so unlocking Pro re-renders every consumer immediately (a per-hook
 * useState would leave already-mounted screens showing the stale "locked" view).
 * The `purchasePro` / `restore` bodies are STUBS for Expo Go — replace with
 * RevenueCat at EAS-build time (README → "Graduating to real in-app purchase").
 */
interface PurchaseContextValue {
  entitlement: Entitlement;
  isPro: boolean;
  loaded: boolean;
  purchasePro: () => Promise<void>;
  restore: () => Promise<void>;
  devReset: () => Promise<void>;
}

const PurchaseContext = createContext<PurchaseContextValue | null>(null);

export function PurchaseProvider({ children }: { children: ReactNode }) {
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

  const value = useMemo<PurchaseContextValue>(
    () => ({
      entitlement,
      isPro: entitlement === 'pro',
      loaded,
      purchasePro,
      restore,
      devReset,
    }),
    [entitlement, loaded, purchasePro, restore, devReset],
  );

  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
}

export function usePurchase(): PurchaseContextValue {
  const ctx = useContext(PurchaseContext);
  if (!ctx) throw new Error('usePurchase must be used within a PurchaseProvider');
  return ctx;
}
