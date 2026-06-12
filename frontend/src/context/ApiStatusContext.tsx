import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { api } from '../api/client';
import type { ApiStatus, DatabaseConnectionStatus } from '../types';

const ERROR_DISPLAY_DELAY_MS = 400;

const INITIAL_STATUS: ApiStatus = {
  apiConnection: 'checking',
  databaseConnection: 'checking',
  apiAvailable: false,
  databaseAvailable: false,
  databaseConnected: false,
  rateLimit: null,
  hasGitHubToken: false,
};

function buildStatusFromHealth(health: Awaited<ReturnType<typeof api.health>>): ApiStatus {
  let databaseConnection: DatabaseConnectionStatus = 'not_configured';
  if (health.database.configured) {
    databaseConnection = health.database.connected ? 'connected' : 'unavailable';
  }

  return {
    apiConnection: 'connected',
    databaseConnection,
    apiAvailable: true,
    databaseAvailable: health.database.configured,
    databaseConnected: health.database.connected,
    rateLimit: health.github.rateLimit as ApiStatus['rateLimit'],
    hasGitHubToken: health.github.tokenConfigured,
  };
}

const UNAVAILABLE_STATUS: ApiStatus = {
  apiConnection: 'unavailable',
  databaseConnection: 'unavailable',
  apiAvailable: false,
  databaseAvailable: false,
  databaseConnected: false,
  rateLimit: null,
  hasGitHubToken: false,
};

interface ApiStatusContextValue {
  status: ApiStatus;
  loading: boolean;
}

const ApiStatusContext = createContext<ApiStatusContextValue | null>(null);

export function ApiStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ApiStatus>(INITIAL_STATUS);
  const [loading, setLoading] = useState(true);
  const hasResolvedOnce = useRef(false);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;

    const clearErrorTimer = () => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
        errorTimerRef.current = null;
      }
    };

    const applyUnavailable = () => {
      if (!mounted) return;
      setStatus(UNAVAILABLE_STATUS);
      setLoading(false);
      hasResolvedOnce.current = true;
    };

    const check = async () => {
      try {
        const health = await api.health();
        if (!mounted) return;
        clearErrorTimer();
        setStatus(buildStatusFromHealth(health));
        setLoading(false);
        hasResolvedOnce.current = true;
      } catch {
        if (!mounted) return;
        if (!hasResolvedOnce.current) {
          clearErrorTimer();
          errorTimerRef.current = setTimeout(applyUnavailable, ERROR_DISPLAY_DELAY_MS);
        } else {
          applyUnavailable();
        }
      }
    };

    check();
    const interval = setInterval(check, 60000);

    return () => {
      mounted = false;
      clearErrorTimer();
      clearInterval(interval);
    };
  }, []);

  return (
    <ApiStatusContext.Provider value={{ status, loading }}>
      {children}
    </ApiStatusContext.Provider>
  );
}

const FALLBACK_CONTEXT: ApiStatusContextValue = {
  status: INITIAL_STATUS,
  loading: true,
};

export function useApiStatus(): ApiStatusContextValue {
  const context = useContext(ApiStatusContext);
  return context ?? FALLBACK_CONTEXT;
}
