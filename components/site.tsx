import Image from 'next/image';
import Link from 'next/link';
import { Clipping, Story, VideoPopup } from '@/components/effects';
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

const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

type G = Pick<Greeting, 'name' | 'team' | 'message'>;

// Shared by the card, its read-more popup and story mode.
const GreetingBody = ({ g }: { g: G }) => (
  <>
    <p className="card__kicker">{g.team ? `${g.team} · Untuk Papih` : 'Ucapan untuk Papih'}</p>
    <p className="card__msg">{g.message}</p>
    <div className="card__from">
      <span className="card__avatar" aria-hidden="true">{g.name ? initials(g.name) : '“'}</span>
      <p className="card__name">{g.name || 'Anonim'}</p>
    </div>
  </>
);

/** Greeting styled as a newspaper clipping; long messages are clamped with a "read more" popup. */
export function GreetingCard({ g }: { g: G }) {
  return <Clipping label={`Ucapan dari ${g.name || 'Anonim'}`}><GreetingBody g={g} /></Clipping>;
}

/** "Putar semua ucapan": every greeting full screen, one at a time; each shows ~3 words/s (6–20 s). */
export function GreetingStory({ greetings }: { greetings: G[] }) {
  return (
    <Story
      slides={greetings.map((g, i) => (
        <div key={i} className={g.message.length > 400 ? 'story__slide is-long' : 'story__slide'}><GreetingBody g={g} /></div>
      ))}
      seconds={greetings.map((g) => Math.min(20, Math.max(6, g.message.split(/\s+/).length / 3)))}
    />
  );
}

const Player = ({ v }: { v: Video }) => <VideoPopup url={v.url} title={v.title} poster={v.poster} />;

// [width, height] of public/assets/gallery/papih-NN.jpg, in file order.
const PHOTOS = [
  [248, 248], [720, 540], [1256, 800], [604, 453], [604, 326], [604, 416], [604, 385], [600, 450],
  [604, 402], [1600, 1066], [533, 800], [1536, 1152], [1536, 1152], [1536, 1536], [1280, 720], [891, 960],
].map(([w, h], i) => ({ src: `/assets/gallery/papih-${String(i + 1).padStart(2, '0')}.jpg`, w, h }));
const PHOTO_H = 260; // display height; CSS shrinks it on mobile

/** Two endless photo strips moving in opposite directions; each row is rendered twice so translateX(-50%) loops seamlessly. */
export function Gallery() {
  return (
    <section className="gallery" aria-label="Galeri foto Papih">
      {[0, 1].map((r) => {
        const row = PHOTOS.filter((_, i) => i % 2 === r);
        return (
          <div className="gallery__row" key={r}>
            <div className={r ? 'gallery__track gallery__track--rev' : 'gallery__track'}>
              {[0, 1].map((copy) => row.map((p) => (
                <figure className="gallery__item" key={`${copy}${p.src}`} aria-hidden={copy ? true : undefined}>
                  <Image src={p.src} alt="Kenangan bersama Papih" width={Math.round((p.w / p.h) * PHOTO_H)} height={PHOTO_H} />
                </figure>
              )))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

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
