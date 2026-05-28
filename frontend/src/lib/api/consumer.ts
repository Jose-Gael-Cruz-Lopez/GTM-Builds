import { ApiError } from "../api-client";

const BASE_URL = import.meta.env.VITE_API_URL ?? "https://nexoleal-backend.nexoleal.workers.dev";

export const CONSUMER_SESSION_KEY = "nexoleal:consumer-session";

export interface ConsumerSession {
  phone: string;
  referralCode: string | null;
  registeredAt: number;
  accessToken: string;
  refreshToken: string;
}

function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(CONSUMER_SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<ConsumerSession>;
    return s.accessToken ?? null;
  } catch {
    return null;
  }
}

async function consumerFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getStoredToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const data = (await res.json()) as
    | { success: true; data: T }
    | { success: false; error: { code: string; message: string } };

  if (!data.success || !res.ok) {
    const e = !data.success ? data.error : { code: "UNKNOWN", message: "Request failed" };
    throw new ApiError(e.code, e.message, res.status);
  }
  return data.data;
}

export interface ConsumerRegisterResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  client: { id: string; username: string; referralCode: string; referredBy: boolean };
}

export interface ConsumerLoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  client: { id: string; username: string; referralCode: string } | null;
}

export interface ConsumerTokenResponse {
  token: string;
  expiresAt: string;
  ttlSeconds: number;
}

export const consumerApi = {
  register: (body: { username: string; referralCode?: string }) =>
    consumerFetch<ConsumerRegisterResponse>("/consumer/register", { method: "POST", body }),

  login: (body: { username: string }) =>
    consumerFetch<ConsumerLoginResponse>("/consumer/login", { method: "POST", body }),

  generateToken: () => consumerFetch<ConsumerTokenResponse>("/consumer/token", { method: "POST" }),
};
