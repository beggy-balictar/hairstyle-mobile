import { getApiBaseUrl } from '../config/api';

type LoginResult = {
  ok: true;
  userId: string;
  token: string;
};

function networkHint(baseUrl: string): string {
  return `Cannot reach ${baseUrl}. Use the same Wi‑Fi as your PC, set EXPO_PUBLIC_API_BASE_URL (and EXPO_PUBLIC_API_PORT if Next.js is not on :3000), then restart Expo.`;
}

function looksLikeHtml(body: string): boolean {
  const t = body.trimStart();
  return (
    t.startsWith('<!DOCTYPE') ||
    t.startsWith('<html') ||
    t.startsWith('<pre>') ||
    t.startsWith('<script') ||
    /<\/(html|pre|script)>/i.test(body)
  );
}

function parseApiJson<T extends { error?: string }>(raw: string, res: Response): T {
  if (!raw.trim()) {
    return {} as T;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    if (looksLikeHtml(raw)) {
      throw new Error(
        `The API returned a webpage instead of JSON (${res.status}). Usually Next.js crashed or the wrong URL/port is set. ` +
          `Set EXPO_PUBLIC_API_BASE_URL to your PC's LAN IP with the Next.js port (e.g. http://192.168.x.x:3000), ensure \`npm run dev\` is running in hairstyle-web, and check PostgreSQL + DATABASE_URL on the server.`,
      );
    }
    throw new Error(
      res.ok
        ? 'Invalid JSON from server.'
        : `Request failed (${res.status}). Check hairstyle-web terminal for details.`,
    );
  }
}

async function postJson<T>(path: string, body: object): Promise<T> {
  const baseUrl = getApiBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    throw new Error(
      /network|failed to fetch|Load failed|ECONNREFUSED/i.test(err)
        ? networkHint(baseUrl)
        : err || networkHint(baseUrl),
    );
  }

  const raw = await res.text();
  const payload = parseApiJson<{ error?: string } & T>(raw, res);
  if (!res.ok) {
    throw new Error(
      payload.error ||
        (looksLikeHtml(raw)
          ? 'Server error — see message above or hairstyle-web terminal (often database).'
          : `Request failed (${res.status}).`),
    );
  }
  return payload;
}

async function postJsonWithAuth<T>(path: string, body: object, token?: string): Promise<T> {
  if (!token) {
    throw new Error('Please sign in again.');
  }
  const baseUrl = getApiBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    throw new Error(
      /network|failed to fetch|Load failed|ECONNREFUSED/i.test(err)
        ? networkHint(baseUrl)
        : err || networkHint(baseUrl),
    );
  }

  const raw = await res.text();
  const payload = parseApiJson<{ error?: string } & T>(raw, res);
  if (!res.ok) {
    throw new Error(
      payload.error ||
        (looksLikeHtml(raw)
          ? 'Server error — see message above or hairstyle-web terminal (often database).'
          : `Request failed (${res.status}).`),
    );
  }
  return payload;
}

export async function registerCustomer(fullName: string, email: string, password: string) {
  return postJson<{ ok: true; message: string }>('/api/auth/register-customer-app', {
    fullName,
    email,
    password,
  });
}

export async function loginCustomer(email: string, password: string) {
  return postJson<LoginResult>('/api/auth/customer-login', {
    email,
    password,
  });
}

export async function submitSatisfaction(rating: number, token?: string) {
  return postJsonWithAuth<{ ok: true }>('/api/satisfaction', { rating }, token);
}

export async function submitCustomerReport(message: string, token?: string) {
  return postJsonWithAuth<{ ok: true }>('/api/reports', { message }, token);
}
