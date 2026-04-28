import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { COOKIE_NAME } from '@/lib/auth';

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? '');
}

const PUBLIC_PATHS = ['/login', '/api/auth/login'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', req.url));
  }

  let payload;
  try {
    const result = await jwtVerify(token, getSecret());
    payload = result.payload as {
      role: string;
      must_change_password: boolean;
      profile_complete: boolean;
    };
  } catch {
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  // Force password change
  if (
    payload.must_change_password &&
    !pathname.startsWith('/change-password') &&
    !pathname.startsWith('/api/auth/change-password') &&
    !pathname.startsWith('/api/auth/logout')
  ) {
    return pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Password change required' }, { status: 403 })
      : NextResponse.redirect(new URL('/change-password', req.url));
  }

  // Force profile setup
  if (
    !payload.must_change_password &&
    !payload.profile_complete &&
    !pathname.startsWith('/profile-setup') &&
    !pathname.startsWith('/api/profile') &&
    !pathname.startsWith('/api/auth/logout')
  ) {
    return pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Profile setup required' }, { status: 403 })
      : NextResponse.redirect(new URL('/profile-setup', req.url));
  }

  // Admin-only routes
  if (
    (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) &&
    payload.role !== 'Admin'
  ) {
    return pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      : NextResponse.redirect(new URL('/companies?error=forbidden', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
