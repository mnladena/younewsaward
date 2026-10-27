import { NextResponse, type NextRequest } from 'next/server';
import { isValidBasicAuth } from './lib/validate';

export function proxy(request: NextRequest) {
  if (!process.env.ADMIN_PASSWORD) return new NextResponse('Set ADMIN_PASSWORD to enable /admin', { status: 503 });
  if (isValidBasicAuth(request.headers.get('authorization'), process.env.ADMIN_PASSWORD)) return NextResponse.next();
  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Moderasi ucapan", charset="UTF-8"' },
  });
}

export const config = { matcher: ['/admin', '/admin/:path*'] };
