import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi } from '@/lib/supabase';

const SYNC_KEY = 'capidoc-last-stripe-sync';
const SYNC_INTERVAL = 60 * 60 * 1000; // 1 hora em milissegundos

interface SyncResult {
  subscriptions: number;
  payments: number;
  licenses: number;
}

export function useStripeSync() {
  const { user, getAccessToken } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const syncAttemptedRef = useRef(false);

  const shouldSync = (): boolean => {
    const lastSync = localStorage.getItem(SYNC_KEY);
    if (!lastSync) return true;

    const lastSyncTime = parseInt(lastSync, 10);
    const now = Date.now();

    return now - lastSyncTime > SYNC_INTERVAL;
  };

  const syncStripeData = async (force = false): Promise<SyncResult | null> => {
    if (!user) return null;
    if (syncing) return null;
    if (!force && !shouldSync()) {
      console.log('Stripe sync skipped - already synced recently');
      return null;
    }

    try {
      setSyncing(true);
      setError(null);

      const token = getAccessToken();
      if (!token) {
        console.log('No token available for sync');
        return null;
      }

      console.log('Starting Stripe data sync...');
      const result = await dashboardApi.syncStripeData(token);

      localStorage.setItem(SYNC_KEY, Date.now().toString());

      const syncResult: SyncResult = result.synced || {
        subscriptions: 0,
        payments: 0,
        licenses: 0,
      };

      setLastSyncResult(syncResult);

      console.log('Stripe sync completed:', syncResult);

      return syncResult;
    } catch (err) {
      console.error('Stripe sync error:', err);
      setError(err instanceof Error ? err.message : 'Sync failed');
      return null;
    } finally {
      setSyncing(false);
    }
  };

  // Sincronizar automaticamente quando o usuário estiver logado
  useEffect(() => {
    if (user && !syncAttemptedRef.current) {
      syncAttemptedRef.current = true;
      syncStripeData();
    }
  }, [user]);

  // Reset flag quando o usuário deslogar
  useEffect(() => {
    if (!user) {
      syncAttemptedRef.current = false;
      localStorage.removeItem(SYNC_KEY);
    }
  }, [user]);

  return {
    syncing,
    lastSyncResult,
    error,
    syncStripeData,
  };
}
