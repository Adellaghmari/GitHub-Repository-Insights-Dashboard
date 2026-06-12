import { WifiOff, Database } from 'lucide-react';
import type { ApiStatus } from '../types';
import { shouldShowApiError, shouldShowDatabaseNotice } from '../utils/connectionStatus';

interface Props {
  status: ApiStatus;
  showDatabaseNotice?: boolean;
}

export function ApiCompactNotice() {
  return (
    <div className="alert-error">
      <WifiOff size={16} className="text-red-500 mt-0.5 shrink-0" />
      <div>
        <p className="font-medium">API connection unavailable</p>
        <p className="text-red-700/90 mt-0.5 text-xs">Start the backend or check the API URL.</p>
      </div>
    </div>
  );
}

export function DatabaseCompactNotice() {
  return (
    <div className="alert-info">
      <Database size={16} className="text-graphite-400 mt-0.5 shrink-0" />
      <div>
        <p className="font-medium text-graphite-800">Database not configured</p>
        <p className="text-graphite-500 mt-0.5 text-xs">
          Saving and persistence are disabled until PostgreSQL is connected.
        </p>
      </div>
    </div>
  );
}

export function StatusCards({ status, showDatabaseNotice = true }: Props) {
  return (
    <div className="space-y-3">
      {shouldShowApiError(status) && <ApiCompactNotice />}
      {showDatabaseNotice && shouldShowDatabaseNotice(status) && (
        <DatabaseCompactNotice />
      )}
    </div>
  );
}
