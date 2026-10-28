import type { Metadata } from 'next';
import Link from 'next/link';
import { deleteGreeting, deleteVideo, setGreetingStatus } from '@/app/actions';
import { sql, type Greeting, type Status, type Video } from '@/lib/db';
import { ConfirmButton } from './ConfirmButton';
import { VideoForm } from './VideoForm';

export const metadata: Metadata = { title: 'Moderasi — YOUNEWS AWARDS', robots: { index: false } };
export const dynamic = 'force-dynamic';

const LABELS: Record<Status, string> = { approved: 'Tayangkan', rejected: 'Tolak', pending: 'Kembalikan ke antrean' };
const FILTERS: [Status | null, string][] = [[null, 'Semua'], ['pending', 'Menunggu'], ['approved', 'Tayang'], ['rejected', 'Ditolak']];
const when = (d: Date) => d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' });

// Access is gated by proxy.ts (Basic auth); every action below re-checks via requireAdmin().
export default async function Admin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const [all, videos, { status }] = await Promise.all([
    sql<Greeting>("SELECT * FROM greetings ORDER BY status = 'pending' DESC, id DESC"),
    sql<Video>('SELECT * FROM videos ORDER BY id'),
    searchParams,
  ]);
  const count = (s: Status | null) => (s ? all.filter((g) => g.status === s).length : all.length);
  const filter = FILTERS.find(([s]) => s === status)?.[0] ?? null;
  const greetings = filter ? all.filter((g) => g.status === filter) : all;
  const pending = count('pending');

  return (
    <main className="admin">
      <h1>Moderasi</h1>
      <div className="admin__meta">
        <span>{pending} menunggu · {all.length} ucapan · {videos.length} video</span>
        <a href="/admin/export">Unduh backup (JSON)</a>
        <Link href="/">Lihat situs</Link>
      </div>

      <h2>Ucapan</h2>
      <nav className="admin__filter">
        {FILTERS.map(([s, label]) => (
          <Link key={label} href={s ? `/admin?status=${s}` : '/admin'} aria-current={s === filter ? 'page' : undefined}>
            {label} ({count(s)})
          </Link>
        ))}
      </nav>
      <ul>
        {greetings.map((g) => (
          <li key={g.id} className={g.status}>
            <p>{g.message}</p>
            <small>{[g.name ?? 'Anonim', g.team].filter(Boolean).join(' · ')} · {when(g.created_at)} · <b>{g.status}</b></small>
            <form className="admin__actions">
              {(Object.keys(LABELS) as Status[]).filter((s) => s !== g.status).map((s) => (
                <button key={s} formAction={setGreetingStatus.bind(null, g.id, s)}>{LABELS[s]}</button>
              ))}
              <ConfirmButton action={deleteGreeting.bind(null, g.id)} message={g.status === 'approved'
                ? 'Ucapan ini sedang TAYANG di situs. Hapus permanen? Tidak bisa dibatalkan.'
                : 'Hapus ucapan ini secara permanen? Tidak bisa dibatalkan.'}>Hapus permanen</ConfirmButton>
            </form>
          </li>
        ))}
        {!greetings.length && <li>Tidak ada ucapan di sini.</li>}
      </ul>

      <h2>Video</h2>
      <VideoForm />
      <ul style={{ marginTop: 16 }}>
        {videos.map((v) => (
          <li key={v.id}>
            <p><b>{v.title}</b> — {[v.sender_name, v.sender_role].filter(Boolean).join(', ') || 'tanpa pengirim'}</p>
            <small><a href={v.url} target="_blank" rel="noreferrer">{v.url}</a></small>
            <details className="admin__edit">
              <summary>Edit</summary>
              <VideoForm video={v} />
            </details>
            <form className="admin__actions">
              <ConfirmButton action={deleteVideo.bind(null, v.id)} message="Hapus video ini dari situs? File di CDN tidak ikut terhapus.">Hapus</ConfirmButton>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
