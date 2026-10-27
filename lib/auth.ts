import 'server-only';
import { headers } from 'next/headers';
import { isValidBasicAuth } from './validate';

// proxy.ts guards /admin pages, but server actions are callable from any route, so each admin action re-checks.
export async function requireAdmin() {
  const auth = (await headers()).get('authorization');
  if (!isValidBasicAuth(auth, process.env.ADMIN_PASSWORD)) throw new Error('Unauthorized');
}
