import Constants from 'expo-constants';

function getLanIpFromExpoHostUri(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;
  const host = hostUri.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return host;
}

export function getApiBaseUrl(): string {
  const fromEnv =
    typeof process !== 'undefined'
      ? process.env.EXPO_PUBLIC_API_BASE_URL?.trim()
      : undefined;
  if (fromEnv) return fromEnv;

  const fromExtra = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl;
  if (fromExtra?.trim()) return fromExtra.trim();

  const lanIp = getLanIpFromExpoHostUri();
  if (lanIp) return `http://${lanIp}:3000`;

  return 'http://localhost:3000';
}
