// Backend-agnostic auth client
// Currently implemented with Supabase. Phase 2 will swap to session-based auth.

import { supabase } from "@/integrations/supabase/client";
import type { AuthSession } from "./types";

export type AuthStateChangeCallback = (event: string, session: AuthSession | null) => void;

function mapSession(s: any): AuthSession | null {
  if (!s) return null;
  return {
    user: { id: s.user.id, email: s.user.email },
    access_token: s.access_token,
  };
}

export async function signIn(email: string, password: string): Promise<{ error: { message: string } | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error ? { message: error.message } : null };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<AuthSession | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return mapSession(session);
}

export function onAuthStateChange(callback: AuthStateChangeCallback): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(_event, mapSession(session));
  });
  return () => subscription.unsubscribe();
}

export async function updateUserEmail(email: string): Promise<{ error: { message: string } | null }> {
  const { error } = await supabase.auth.updateUser({ email });
  return { error: error ? { message: error.message } : null };
}

export async function updateUserPassword(password: string): Promise<{ error: { message: string } | null }> {
  const { error } = await supabase.auth.updateUser({ password });
  return { error: error ? { message: error.message } : null };
}
