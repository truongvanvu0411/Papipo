import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { loginAdmin } from '../../../lib/api';
import { adminCookieName } from '../../../lib/session';

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get('intent') === 'logout') {
    const cookieStore = await cookies();
    cookieStore.delete(adminCookieName);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { email, password } = (await request.json()) as { email: string; password: string };
    const result = await loginAdmin(email, password);
    const cookieStore = await cookies();
    cookieStore.set(adminCookieName, result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/'
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(adminCookieName);
  return NextResponse.json({ success: true });
}
