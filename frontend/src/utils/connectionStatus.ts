import type { ApiStatus } from '../types';

const CHECKING_STATUS: ApiStatus = {
  apiConnection: 'checking',
  databaseConnection: 'checking',
  apiAvailable: false,
  databaseAvailable: false,
  databaseConnected: false,
  rateLimit: null,
  hasGitHubToken: false,
};

export function normalizeApiStatus(status?: ApiStatus | null): ApiStatus {
  if (!status || typeof status.apiConnection !== 'string') {
    return CHECKING_STATUS;
  }
  return status;
}

export function hasCheckedConnection(status?: ApiStatus | null): boolean {
  const normalized = normalizeApiStatus(status);
  return normalized.apiConnection !== 'checking';
}

export function isApiChecking(status?: ApiStatus | null): boolean {
  return normalizeApiStatus(status).apiConnection === 'checking';
}

export function isApiConnected(status?: ApiStatus | null): boolean {
  return normalizeApiStatus(status).apiConnection === 'connected';
}

export function isApiUnavailable(status?: ApiStatus | null): boolean {
  return normalizeApiStatus(status).apiConnection === 'unavailable';
}

export function shouldShowApiError(status?: ApiStatus | null): boolean {
  return hasCheckedConnection(status) && isApiUnavailable(status);
}

export function isDatabaseChecking(status?: ApiStatus | null): boolean {
  return normalizeApiStatus(status).databaseConnection === 'checking';
}

export function shouldShowDatabaseNotice(status?: ApiStatus | null): boolean {
  const normalized = normalizeApiStatus(status);
  return (
    isApiConnected(normalized) &&
    (normalized.databaseConnection === 'not_configured' || normalized.databaseConnection === 'unavailable')
  );
}
