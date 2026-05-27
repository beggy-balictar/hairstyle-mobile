import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const API_OVERRIDE_KEY = 'stylehair.apiBaseUrl';

type ExtraWithApi = { apiBaseUrl?: string };

let runtimeOverride: string | null = null;
let overrideLoaded = false;

function getConfigExtra(): ExtraWithApi | undefined {
  const fromExpoConfig = Constants.expoConfig?.extra as ExtraWithApi | undefined;
  if (fromExpoConfig?.apiBaseUrl?.trim()) return fromExpoConfig;

  const legacy = Constants as typeof Constants & {
    manifest2?: { extra?: ExtraWithApi };
    manifest?: { extra?: ExtraWithApi };
  };
  return legacy.manifest2?.extra ?? legacy.manifest?.extra;
}

function isStandaloneApp(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.Standalone;
}

function getLanIpFromExpoHostUri(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;
  const host = hostUri.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  if (!/^(192\.168\.|10\.)/.test(host)) return null;
  return host;
}

function getApiPort(): string {
  const p =
    typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_PORT?.trim() : undefined;
  return p && /^\d+$/.test(p) ? p : '3000';
}

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

function bakedApiBaseUrl(): string {
  const fromEnv =
    typeof process !== 'undefined'
      ? process.env.EXPO_PUBLIC_API_BASE_URL?.trim()
      : undefined;
  if (fromEnv) return fromEnv;

  const fromExtra = getConfigExtra()?.apiBaseUrl?.trim();
  if (fromExtra) return fromExtra;

  const port = getApiPort();
  const lanIp = getLanIpFromExpoHostUri();
  if (lanIp) return `http://${lanIp}:${port}`;

  if (__DEV__ && !isStandaloneApp()) {
    return `http://localhost:${port}`;
  }

  return `http://127.0.0.1:${port}`;
}

/** Load saved server URL override (call once at app start). */
export async function loadApiBaseUrlOverride(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(API_OVERRIDE_KEY);
    runtimeOverride = saved?.trim() ? normalizeBaseUrl(saved) : null;
  } catch {
    runtimeOverride = null;
  } finally {
    overrideLoaded = true;
  }
}

export function hasLoadedApiOverride(): boolean {
  return overrideLoaded;
}

/** Save a custom server URL from the login screen (survives IP changes without rebuild). */
export async function setApiBaseUrlOverride(url: string | null): Promise<void> {
  const next = url?.trim() ? normalizeBaseUrl(url) : null;
  runtimeOverride = next;
  if (next) {
    await AsyncStorage.setItem(API_OVERRIDE_KEY, next);
  } else {
    await AsyncStorage.removeItem(API_OVERRIDE_KEY);
  }
}

export function getApiBaseUrlOverride(): string | null {
  return runtimeOverride;
}

export type ApiConnectionStatus = 'reachable' | 'unreachable' | 'error';

/** Quick check that hairstyle-web responds (any HTTP status counts as reachable). */
export async function checkApiConnection(
  timeoutMs = 8000,
): Promise<{ baseUrl: string; status: ApiConnectionStatus; detail?: string }> {
  const baseUrl = getApiBaseUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(baseUrl, { method: 'GET', signal: controller.signal });
    return { baseUrl, status: 'reachable', detail: String(res.status) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const unreachable =
      /abort|network|failed to fetch|Load failed|ECONNREFUSED|timed out/i.test(msg);
    return {
      baseUrl,
      status: unreachable ? 'unreachable' : 'error',
      detail: msg,
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Backend API base URL (hairstyle-web). Database is only on the server, not in this app. */
export function getApiBaseUrl(): string {
  if (runtimeOverride) return runtimeOverride;
  return bakedApiBaseUrl();
}
