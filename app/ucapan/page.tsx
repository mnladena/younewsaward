import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer, GreetingCard, GreetingStory, SubNav } from '@/components/site';
import { sql, type Greeting } from '@/lib/db';

export const metadata: Metadata = { title: 'Cerita hangat untuk Papi — YOUNEWS AWARDS' };

export default async function Ucapan() {
  const greetings = await sql<Greeting>("SELECT id, name, team, message FROM greetings WHERE status = 'approved' ORDER BY id");

  return (
    <div className="page-ucapan">
      <SubNav />
      <main>
        <div className="container">
          <div className="idx-hero">
            <p className="quote-mark" aria-hidden="true">“</p>
            <div className="board__text">
              <h1 className="board__title">Cerita hangat untuk Papi.</h1>
              <p className="board__desc">Ucapan, kenangan, dan doa dari teman-teman yang tumbuh bersama Papi.</p>
            </div>
            {greetings.length > 0 && <GreetingStory greetings={greetings} />}
            <Link className="btn btn--dark" href="/#buku-tamu">Kirim ucapan</Link>
          </div>
        </div>
        <div className="container">
          <div className="cards cards--all">
            {greetings.length
              ? greetings.map((g) => <GreetingCard key={g.id} g={g} />)
              : <p className="cards__empty">Belum ada ucapan yang tayang.</p>}
          </div>
        </div>
      </main>
      <Footer bar />
    </div>
  );
}
