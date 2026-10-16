import type { Session, SupabaseClient } from '@supabase/supabase-js';
import type { SessionUser } from '../../../types/domain';
import { getSupabaseClient } from '../../../services/supabase/client';

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) {
    throw error;
  }
  return data;
}

export async function sendPasswordReset(email: string) {
  const { error } = await getSupabaseClient().auth.resetPasswordForEmail(
    email.trim(),
    { redirectTo: 'vidya://auth/reset-password' },
  );
  if (error) {
    throw error;
  }
}

export async function updatePassword(password: string) {
  const { error } = await getSupabaseClient().auth.updateUser({ password });
  if (error) {
    throw error;
  }
}

export async function signOut() {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) {
    throw error;
  }
}

export async function loadSessionUser(
  client: SupabaseClient,
  session: Session,
): Promise<SessionUser> {
  const { data, error } = await client
    .from('users')
    .select('id, institute_id, full_name, role')
    .eq('id', session.user.id)
    .single();

  if (error) {
    throw error;
  }
  if (
    data.role !== 'admin' &&
    data.role !== 'teacher' &&
    data.role !== 'student'
  ) {
    throw new Error('Your account does not have an allowed application role.');
  }

  return {
    id: data.id,
    instituteId: data.institute_id,
    fullName: data.full_name,
    role: data.role,
  };
}
