import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const ADMIN_COOKIE = 'papipo_admin_token';

export async function getAdminToken() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value ?? null;
}

export async function requireAdminToken() {
  const token = await getAdminToken();
  if (!token) {
    redirect('/login');
  }
  return token;
}

export const adminCookieName = ADMIN_COOKIE;
