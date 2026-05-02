import Constants from 'expo-constants';

function getLanIpFromExpoHostUri(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;
  const host = hostUri.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  // Tunnel URLs (e.g. *.exp.direct) are for Metro, not your LAN Next.js server.
  if (!/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return null;
  return host;
}

function getApiPort(): string {
  const p =
    typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_PORT?.trim() : undefined;
  return p && /^\d+$/.test(p) ? p : '3000';
}

export function getApiBaseUrl(): string {
  const fromEnv =
    typeof process !== 'undefined'
      ? process.env.EXPO_PUBLIC_API_BASE_URL?.trim()
      : undefined;
  if (fromEnv) return fromEnv;

  const port = getApiPort();

  // Expo Go / dev client: Metro hostUri is your PC's LAN IP (use `expo start --lan`).
  // Port defaults to 3000; set EXPO_PUBLIC_API_PORT if Next.js uses another port (e.g. 3001).
  const lanIp = getLanIpFromExpoHostUri();
  if (__DEV__ && lanIp) {
    return `http://${lanIp}:${port}`;
  }

  const fromExtra = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl;
  if (fromExtra?.trim()) return fromExtra.trim();

  if (lanIp) {
    return `http://${lanIp}:${port}`;
  }

  return `http://localhost:${port}`;
}
