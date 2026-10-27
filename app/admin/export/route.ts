import { requireAdmin } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET() {
  await requireAdmin();
  const [greetings, videos] = await Promise.all([
    sql('SELECT * FROM greetings ORDER BY id'),
    sql('SELECT * FROM videos ORDER BY id'),
  ]);
  const date = new Date().toISOString().slice(0, 10);
  return Response.json({ exported_at: new Date().toISOString(), greetings, videos }, {
    headers: { 'Content-Disposition': `attachment; filename="younewsaward-backup-${date}.json"` },
  });
}
