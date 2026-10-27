import type { Metadata } from 'next';
import Link from 'next/link';
import { deleteVideo, setGreetingStatus } from '@/app/actions';
import { sql, type Greeting, type Status, type Video } from '@/lib/db';
import { VideoForm } from './VideoForm';

export const metadata: Metadata = { title: 'Moderasi — YOUNEWS AWARDS', robots: { index: false } };
export const dynamic = 'force-dynamic';

const LABELS: Record<Status, string> = { approved: 'Tayangkan', rejected: 'Tolak', pending: 'Kembalikan ke antrean' };
const when = (d: Date) => d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' });

// Access is gated by proxy.ts (Basic auth); every action below re-checks via requireAdmin().
export default async function Admin() {
  const [greetings, videos] = await Promise.all([
    sql<Greeting>("SELECT * FROM greetings ORDER BY status = 'pending' DESC, id DESC"),
    sql<Video>('SELECT * FROM videos ORDER BY id'),
  ]);
  const pending = greetings.filter((g) => g.status === 'pending').length;

  return (
    <main className="admin">
      <h1>Moderasi</h1>
      <div className="admin__meta">
        <span>{pending} menunggu · {greetings.length} ucapan · {videos.length} video</span>
        <a href="/admin/export">Unduh backup (JSON)</a>
        <Link href="/">Lihat situs</Link>
      </div>

      <h2>Ucapan</h2>
      <ul>
        {greetings.map((g) => (
          <li key={g.id} className={g.status}>
            <p>{g.message}</p>
            <small>{[g.name ?? 'Anonim', g.team].filter(Boolean).join(' · ')} · {when(g.created_at)} · <b>{g.status}</b></small>
            <form className="admin__actions">
              {(Object.keys(LABELS) as Status[]).filter((s) => s !== g.status).map((s) => (
                <button key={s} formAction={setGreetingStatus.bind(null, g.id, s)}>{LABELS[s]}</button>
              ))}
            </form>
          </li>
        ))}
        {!greetings.length && <li>Belum ada ucapan.</li>}
      </ul>

      <h2>Video</h2>
      <VideoForm />
      <ul style={{ marginTop: 16 }}>
        {videos.map((v) => (
          <li key={v.id}>
            <p><b>{v.title}</b> — {[v.sender_name, v.sender_role].filter(Boolean).join(', ') || 'tanpa pengirim'}</p>
            <small><a href={v.url} target="_blank" rel="noreferrer">{v.url}</a></small>
            <form className="admin__actions">
              <button formAction={deleteVideo.bind(null, v.id)}>Hapus</button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
