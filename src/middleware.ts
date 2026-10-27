import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass Next.js internal files, static assets, APIs, and image files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get('e_reservasi_auth');
  let authUser: { id: string; role: string; email: string; fullName: string } | null = null;

  if (authCookie?.value) {
    try {
      authUser = JSON.parse(decodeURIComponent(authCookie.value));
    } catch {
      authUser = null;
    }
  }

  const isLoginPage = pathname === '/login';

  // 1. Cegah pengguna tanpa login menembak URL halaman internal
  if (!authUser && !isLoginPage) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Jika sudah terotentikasi dan membuka /login, arahkan langsung ke dashboard
  if (authUser && isLoginPage) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // 3. Role-Based Access Control (RBAC): Cegah bypass otorisasi per role
  if (authUser) {
    // Meja Verifikasi Sekpim: Hanya untuk Verifikator Asisten, Verifikator Pimpinan, dan Admin
    if (pathname.startsWith('/verifikasi')) {
      const allowedRoles = ['verifikator_asisten', 'verifikator_pimpinan', 'admin'];
      if (!allowedRoles.includes(authUser.role)) {
        const redirectUrl = new URL('/dashboard', request.url);
        redirectUrl.searchParams.set('error', 'unauthorized_verifikator');
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Kelola / Edit Jadwal: Khusus Verifikator Pimpinan, Verifikator Asisten, dan Admin
    if (pathname.startsWith('/reservasi/edit') || pathname.startsWith('/kelola-jadwal')) {
      const allowedRoles = ['verifikator_asisten', 'verifikator_pimpinan', 'admin'];
      if (!allowedRoles.includes(authUser.role)) {
        const redirectUrl = new URL('/dashboard', request.url);
        redirectUrl.searchParams.set('error', 'unauthorized_edit');
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Manajemen Pengguna: Khusus Admin Kominfotik
    if (pathname.startsWith('/pengaturan/users')) {
      if (authUser.role !== 'admin') {
        const redirectUrl = new URL('/dashboard', request.url);
        redirectUrl.searchParams.set('error', 'unauthorized_admin');
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

