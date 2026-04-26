import { getApiBaseUrl } from '../config/api';

type LoginResult = {
  ok: true;
  userId: string;
  token: string;
};

async function postJson<T>(path: string, body: object): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) {
    throw new Error(payload.error || 'Request failed.');
  }
  return payload;
}

async function postJsonWithAuth<T>(path: string, body: object, token?: string): Promise<T> {
  if (!token) {
    throw new Error('Please sign in again.');
  }
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const payload = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) {
    throw new Error(payload.error || 'Request failed.');
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
