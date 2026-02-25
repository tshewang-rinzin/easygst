import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/session';

const protectedRoutes = [
  '/dashboard',
  '/customers',
  '/products',
  '/invoices',
  '/payments',
  '/reports',
  '/sales',
  '/purchases',
  '/adjustments',
  '/gst',
  '/settings',
  '/suppliers'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  let res = NextResponse.next();

  if (sessionCookie && request.method === 'GET') {
    try {
      const parsed = await verifyToken(sessionCookie.value);

      // Only refresh token if it expires within the next 12 hours
      const expiresAt = parsed.expires ? new Date(parsed.expires as string).getTime() : 0;
      const twelveHours = 12 * 60 * 60 * 1000;

      if (expiresAt - Date.now() < twelveHours) {
        const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);

        res.cookies.set({
          name: 'session',
          value: await signToken({
            ...parsed,
            expires: expiresInOneDay.toISOString()
          }),
          httpOnly: true,
          secure: isProduction,
          sameSite: 'strict',
          expires: expiresInOneDay
        });
      }
    } catch (error) {
      console.error('Error updating session:', error);
      res.cookies.delete('session');
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs'
};
