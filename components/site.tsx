import Image from 'next/image';
import Link from 'next/link';
import { Carousel, Clipping, PhotoPopup, Story, VideoPopup } from '@/components/effects';
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

/** "Putar semua ucapan": every greeting full screen, one at a time; each shows ~3 words/s (6–40 s, long ones auto-scroll). */
export function GreetingStory({ greetings }: { greetings: G[] }) {
  return (
    <Story
      slides={greetings.map((g, i) => (
        <div key={i} className={g.message.length > 400 ? 'story__slide is-long' : 'story__slide'}><GreetingBody g={g} /></div>
      ))}
      seconds={greetings.map((g) => Math.min(40, Math.max(6, g.message.split(/\s+/).length / 3)))}
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

const BUMPER = 'https://youtu.be/MuZKxyx1V5s';
const NOMINATIONS = [
  ['Gaul', 'https://youtu.be/JKGGVEjE0W8'],
  ['Gondrong', 'https://youtu.be/nY3rnaTLYAg'],
  ['Paling Senior', 'https://youtu.be/jHiOQERvqVo'],
  ['Candy Crush', 'https://youtu.be/PEhoZM8Rd3M'],
  ['Life Time', 'https://youtu.be/Ta_bFtv4N34'],
];

/** Award-night videos: the bumper VT up top, then one 16:9 card per nomination category. */
export function Nominasi() {
  return (
    <section className="nominasi" id="nominasi">
      <div className="container">
        <div className="sec-head">
          <p className="eyebrow">Malam Penghargaan · 02</p>
          <h2 className="display">Nominasi &amp;<br />Pemenang <em>Award.</em></h2>
          <p className="sec-head__lede">Siapa yang paling gaul, paling gondrong, sampai paling setia? Ini dia para nominasi YOU-NEWS AWARD.</p>
        </div>
        <article className="vcard nominasi__bumper">
          <div className="vframe vframe--h"><VideoPopup url={BUMPER} title="Bumper VT YOU-NEWS AWARD" poster={null} /></div>
          <div className="vcard__meta">
            <h3 className="vcard__title">Bumper VT YOU-NEWS AWARD</h3>
            <p className="vcard__sub">Pembuka malam penghargaan</p>
          </div>
        </article>
        <div className="vgrid vgrid--h">
          {NOMINATIONS.map(([cat, url]) => (
            <article className="vcard" key={cat}>
              <div className="vframe vframe--h"><VideoPopup url={url} title={`Nominasi Kategori ${cat}`} poster={null} /></div>
              <div className="vcard__meta">
                <h3 className="vcard__title">Kategori {cat}</h3>
                <p className="vcard__sub">Nominasi</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// New photo: drop it in public/assets/award/ and add its file name here. Thumbnails are cropped to one ratio, the popup shows it whole.
const AWARD_PHOTOS = ['award-01.jpg', 'award-02.jpg', 'award-03.jpg'];

export function AwardGallery() {
  return (
    <section className="agallery" id="galeri-award">
      <div className="container">
        <div className="sec-head">
          <p className="eyebrow">Galeri Award · 03</p>
          <h2 className="display">Momen di Malam<br /><em>YOU-NEWS AWARD.</em></h2>
          <p className="sec-head__lede">Senyum, pose, dan kebersamaan yang terekam malam itu.</p>
        </div>
        <Carousel label="Galeri foto YOU-NEWS AWARD" item="Foto" auto>
          {AWARD_PHOTOS.map((f) => (
            <figure className="gallery__item" key={f}>
              <PhotoPopup src={`/assets/award/${f}`} alt="Foto di malam YOU-NEWS AWARD">
                <Image src={`/assets/award/${f}`} alt="" width={1280} height={760} sizes="(max-width: 760px) 86vw, 380px" />
              </PhotoPopup>
            </figure>
          ))}
        </Carousel>
      </div>
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
