import { getApiBaseUrl } from '../config/api';

/**
 * Turns backend paths like `/uploads/foo.png` into a full URL the mobile Image can load.
 */
export function resolveBackendAssetUrl(url?: string | null): string | null {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('file://')) {
    return trimmed;
  }
  const base = getApiBaseUrl().replace(/\/$/, '');
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}
