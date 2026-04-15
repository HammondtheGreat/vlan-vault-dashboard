// Backend-agnostic auth client — REST implementation

import type { AuthSession } from "./types";

const BASE = import.meta.env.VITE_API_URL || "/api";

function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

function setToken(token: string | null) {
  if (token) localStorage.setItem("auth_token", token);
  else localStorage.removeItem("auth_token");
}

export type AuthStateChangeCallback = (event: string, session: AuthSession | null) => void;

// Internal listeners for auth state changes
const listeners: Set<AuthStateChangeCallback> = new Set();

function notifyListeners(event: string, session: AuthSession | null) {
  listeners.forEach((cb) => cb(event, session));
}

export async function signIn(email: string, password: string): Promise<{ error: { message: string } | null }> {
  try {
    const res = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Login failed" }));
      return { error: { message: body.error || "Login failed" } };
    }
    const data = await res.json();
    setToken(data.access_token);
    notifyListeners("SIGNED_IN", { user: data.user, access_token: data.access_token });
    return { error: null };
  } catch (err: any) {
    return { error: { message: err.message } };
  }
}

export async function signOut(): Promise<void> {
  setToken(null);
  notifyListeners("SIGNED_OUT", null);
}

export async function getSession(): Promise<AuthSession | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${BASE}/auth/session`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setToken(null);
      return null;
    }
    const data = await res.json();
    return { user: data.user, access_token: token };
  } catch {
    return null;
  }
}

export function onAuthStateChange(callback: AuthStateChangeCallback): () => void {
  listeners.add(callback);
  // Check current session on subscribe
  const token = getToken();
  if (token) {
    getSession().then((session) => {
      if (session) callback("INITIAL_SESSION", session);
      else callback("SIGNED_OUT", null);
    });
  } else {
    setTimeout(() => callback("INITIAL_SESSION", null), 0);
  }
  return () => { listeners.delete(callback); };
}

export async function updateUserEmail(email: string): Promise<{ error: { message: string } | null }> {
  const token = getToken();
  const res = await fetch(`${BASE}/auth/user`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: { message: body.error || "Failed" } };
  }
  return { error: null };
}

export async function updateUserPassword(password: string): Promise<{ error: { message: string } | null }> {
  const token = getToken();
  const res = await fetch(`${BASE}/auth/user`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: { message: body.error || "Failed" } };
  }
  return { error: null };
}
