import Image from 'next/image';
import Link from 'next/link';
import type { Greeting, Video } from '@/lib/db';

export const Logo = ({ alt = 'YOU-NEWS AWARD' }: { alt?: string }) => (
  <Image src="/assets/logo.webp" alt={alt} width={137} height={55} />
);

export function Footer({ bar = false }: { bar?: boolean }) {
  return (
    <footer className={bar ? 'footer footer--bar' : 'footer'}>
      <div><Logo /></div>
      <p>Dibuat bareng-bareng, khusus buat Papih.</p>
      <p>The People’s Edition © 2026</p>
    </footer>
  );
}

export function SubNav() {
  return (
    <header className="nav nav--sub">
      <Link className="nav__back" href="/"><Image src="/assets/chevron-left.svg" alt="" width={16} height={16} /> Back</Link>
      <Link className="nav__logo" href="/"><Logo alt="YOU-NEWS AWARD, ke beranda" /></Link>
    </header>
  );
}

export function GreetingCard({ g }: { g: Pick<Greeting, 'name' | 'team' | 'message'> }) {
  return (
    <article className="card">
      <div>
        <p className="card__quote" aria-hidden="true">“</p>
        <p className="card__msg">{g.message}</p>
      </div>
      <div className="card__from">
        <p className="card__name">{g.name || 'Anonim'}</p>
        {g.team && <p className="card__role">{g.team}</p>}
      </div>
    </article>
  );
}

const Player = ({ v }: { v: Video }) => (
  <video src={v.url} poster={v.poster ?? undefined} controls playsInline preload="metadata" />
);

/** Placeholder slots keep the designed grid filled until enough videos exist. */
export const fillSlots = (videos: Video[], slots: number): (Video | null)[] =>
  [...videos, ...Array<null>(Math.max(0, slots - videos.length)).fill(null)];

export function HomeVideoCard({ v, index }: { v: Video | null; index: number }) {
  return (
    <article className="vcard">
      <div className="vframe">
        {v ? <Player v={v} /> : (
          <>
            <span className="vframe__portrait" /><span className="vframe__diag" />
            <span className="vframe__num">{String(index + 1).padStart(2, '0')}</span>
            <span className="vframe__play" aria-hidden="true">▶</span>
            <p className="vframe__label">Video 9:16<b>segera hadir</b></p>
          </>
        )}
      </div>
      <div className="vcard__meta">
        <h3 className="vcard__title">{v?.title ?? 'Pesan dari teman Papih'}</h3>
        <p className="vcard__sub">{v ? (v.sender_name ?? 'Teman Papih') : 'Placeholder video · belum ada aset'}</p>
      </div>
    </article>
  );
}

export function IndexVideoCard({ v }: { v: Video | null }) {
  return (
    <article className="vcard">
      <div className="vframe vframe--idx">
        {v ? <Player v={v} /> : (
          <>
            <span className="vframe__portrait" />
            <Image className="vframe__accent" src="/assets/aksen-diagonal.svg" alt="" width={286} height={208} />
            <span className="vframe__ratio">9:16</span>
            <div className="vframe__status">
              <span className="vframe__icon"><Image src="/assets/video.svg" alt="" width={23} height={23} /></span>
              <small>SEGERA HADIR<span>Video belum tersedia</span></small>
            </div>
            <p className="vframe__foot">PLACEHOLDER VIDEO</p>
          </>
        )}
      </div>
      <div className="vcard__info">
        <h2>{v?.title ?? 'Pesan dari teman Papih'}</h2>
        <div className="sender">
          <span className="sender__avatar"><Image src="/assets/user-round.svg" alt="" width={17} height={17} /></span>
          <p>{v?.sender_name ?? 'Teman Papih'}<span>{v?.sender_role ?? 'Nama pengirim belum tersedia'}</span></p>
        </div>
      </div>
    </article>
  );
}
