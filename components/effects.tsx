'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { youtubeId } from '@/lib/validate';

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Twinkling gold dust on a canvas, plus falling sparks behind the cursor. Returns a cleanup fn. */
function goldDust(canvas: HTMLCanvasElement, count: number, trailFrom?: HTMLElement) {
  const ctx = canvas.getContext('2d')!;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 64;
  const s = sprite.getContext('2d')!;
  const g = s.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,248,220,1)');
  g.addColorStop(0.18, 'rgba(244,220,136,.9)');
  g.addColorStop(0.45, 'rgba(215,169,47,.25)');
  g.addColorStop(1, 'rgba(215,169,47,0)');
  s.fillStyle = g;
  s.fillRect(0, 0, 64, 64);

  type Dust = { x: number; y: number; r: number; vx: number; vy: number; t: number; ts: number };
  type Spark = { x: number; y: number; r: number; vx: number; vy: number; life: number };
  let w = 0, h = 0, visible = true, raf = 0;
  const dust: Dust[] = [], sparks: Spark[] = [];
  const resize = () => {
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const seed = (p: Partial<Dust>, y = Math.random() * h) => Object.assign(p, {
    x: Math.random() * w, y, r: Math.random() ** 3 * 2.6 + 0.4,
    vx: (Math.random() - 0.5) * 0.12, vy: -(Math.random() * 0.22 + 0.04),
    t: Math.random() * 6.28, ts: Math.random() * 0.03 + 0.006,
  }) as Dust;
  resize();
  for (let i = 0; i < count; i++) dust.push(seed({}));

  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(canvas);
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    for (let i = 0; i < 2; i++) sparks.push({
      x: e.clientX - r.left, y: e.clientY - r.top, r: Math.random() * 1.8 + 0.6,
      vx: (Math.random() - 0.5) * 1.2, vy: Math.random() * -1 - 0.2, life: 1,
    });
    if (sparks.length > 160) sparks.splice(0, sparks.length - 160);
  };
  addEventListener('resize', resize);
  trailFrom?.addEventListener('pointermove', onMove);

  const draw = (x: number, y: number, r: number, a: number) => {
    ctx.globalAlpha = a;
    ctx.drawImage(sprite, x - r * 4, y - r * 4, r * 8, r * 8);
    if (r > 1.9 && a > 0.85) { // 4-point star flare on the brightest flecks
      ctx.fillStyle = `rgba(255,246,214,${(a - 0.85) * 4})`;
      ctx.fillRect(x - r * 7, y - 0.5, r * 14, 1);
      ctx.fillRect(x - 0.5, y - r * 7, 1, r * 14);
    }
  };
  const frame = () => {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (const p of dust) {
      p.x += p.vx; p.y += p.vy; p.t += p.ts;
      if (p.y < -10 || p.x < -10 || p.x > w + 10) seed(p, h + 10);
      draw(p.x, p.y, p.r, 0.25 + 0.75 * Math.abs(Math.sin(p.t)));
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.life -= 0.018;
      if (p.life <= 0) { sparks.splice(i, 1); continue; }
      draw(p.x, p.y, p.r * p.life, p.life);
    }
    ctx.globalAlpha = 1;
  };
  frame();

  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    removeEventListener('resize', resize);
    trailFrom?.removeEventListener('pointermove', onMove);
  };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const bgm = () => document.getElementById('bgm') as HTMLAudioElement | null;

/** Starts the background music with a short fade-in. Must run inside a click, or the browser blocks it. */
function playMusic() {
  const audio = bgm();
  if (!audio) return;
  audio.volume = 0;
  audio.play().catch(() => {});
  const fade = setInterval(() => {
    audio.volume = Math.min(0.45, audio.volume + 0.03);
    if (audio.volume >= 0.45) clearInterval(fade);
  }, 100);
}

/** Figma 25:10. Covers the home page until it has loaded, then waits for the visitor to enter (which also starts the music). Once per session. */
export function LoadingScreen() {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'leaving' | 'gone'>('loading');

  useEffect(() => {
    let seen = false;
    try { seen = !!sessionStorage.getItem('intro-seen') || !!location.hash; } catch {}
    if (seen) { setState('gone'); document.body.classList.add('ready'); return; }

    const reduce = reducedMotion();
    const stopDust = reduce ? undefined : goldDust(ref.current!.querySelector('canvas')!, 160);
    const loaded = new Promise((r) => (document.readyState === 'complete' ? r(null) : addEventListener('load', r, { once: true })));
    let cancelled = false;
    Promise.all([
      Promise.race([Promise.all([loaded, document.fonts.ready]), wait(8000)]), // never hang on a slow asset
      wait(reduce ? 0 : 2200), // let the logo reveal finish
    ]).then(() => { if (!cancelled) setState('ready'); });
    return () => { cancelled = true; stopDust?.(); };
  }, []);

  const enter = async () => {
    const reduce = reducedMotion();
    try { sessionStorage.setItem('intro-seen', '1'); } catch {}
    playMusic();
    setState('leaving');
    await wait(reduce ? 0 : 450);
    document.body.classList.add('ready');
    await wait(reduce ? 0 : 650);
    document.documentElement.classList.add('intro-skip');
    setState('gone');
  };

  if (state === 'gone') return null;
  return (
    <div ref={ref} className={`intro${state === 'leaving' ? ' is-leaving' : ''}`}
      role={state === 'loading' ? 'status' : undefined} aria-label={state === 'loading' ? 'Memuat halaman' : undefined}>
      <div className="intro__bg" aria-hidden="true" />
      <canvas className="sparkle" aria-hidden="true" />
      <div className="intro__logo">
        <Image src="/assets/logo-big.webp" alt="YOUNEWS AWARDS — One last headline, honoring a legend" width={900} height={489} priority />
        <span className="glint" aria-hidden="true" />
      </div>
      {/* always rendered so the logo doesn't jump up when the button appears */}
      <div className="intro__enter">
        {state !== 'loading' && <button className="btn btn--gold" type="button" onClick={enter} autoFocus>Masuk</button>}
      </div>
    </div>
  );
}

/** Background music for every public page; lives in the root layout so it keeps playing across client navigations. */
export function Music() {
  const audio = useRef<HTMLAudioElement>(null);
  const [on, setOn] = useState(false);
  if (usePathname().startsWith('/admin')) return null;
  return (
    <>
      <audio id="bgm" ref={audio} src="/assets/fading-piano.mp3" loop preload="none" onPlay={() => setOn(true)} onPause={() => setOn(false)} />
      <button className={on ? 'music is-on' : 'music'} type="button" aria-pressed={on} aria-label={on ? 'Matikan musik' : 'Putar musik'}
        onClick={() => (on ? audio.current!.pause() : playMusic())}>
        <span /><span /><span /><span />
      </button>
    </>
  );
}

/**
 * Card carousel: native scroll-snap handles swipe; each iteration of the CSS progress bar advances one card,
 * so hover/focus/pause only need to pause that animation (all in CSS) and the bar and slides never drift apart.
 */
export function Carousel({ children, label, auto }: { children: React.ReactNode; label: string; auto: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const next = () => {
    const el = track.current!;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + (el.firstElementChild as HTMLElement).offsetWidth, behavior: 'smooth' });
  };
  return (
    <div className={paused ? 'carousel is-paused' : 'carousel'}>
      <div className="carousel__track" ref={track} role="region" aria-label={label} tabIndex={0}>{children}</div>
      {auto && (
        <div className="carousel__controls">
          <span className="carousel__bar" aria-hidden="true"><i onAnimationIteration={next} /></span>
          <button className="btn btn--outline btn--sm" type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>
            {paused ? 'Putar' : 'Jeda'}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Video card thumbnail that plays in a modal <dialog> (YouTube or MP4). The player mounts only while open,
 * so the heavy YouTube iframe loads on demand and closing the popup stops playback.
 */
export function VideoPopup({ url, title, poster }: { url: string; title: string; poster: string | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const yt = youtubeId(url);
  const thumb = poster ?? (yt && `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`);
  // Background music steps aside while a video plays, and comes back if it was on.
  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    const music = bgm();
    const resume = music && !music.paused;
    music?.pause();
    return () => { if (resume) music.play().catch(() => {}); };
  }, [open]);

  return (
    <>
      <button className={yt && !poster ? 'vframe__btn vframe__btn--yt' : 'vframe__btn'} type="button" onClick={() => setOpen(true)} aria-label={`Putar video: ${title}`}>
        {thumb ? <img src={thumb} alt="" loading="lazy" />
          : <video src={`${url}#t=0.1`} muted playsInline preload="metadata" tabIndex={-1} aria-hidden="true" />}
        <span className="vframe__play" aria-hidden="true">▶</span>
      </button>
      {open && (
        <dialog className="vmodal" ref={dialog} aria-label={title} onClose={() => setOpen(false)}
          onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}>
          <button className="vmodal__close" type="button" onClick={() => dialog.current?.close()}>Tutup ✕</button>
          {yt ? (
            <iframe className={url.includes('/shorts/') ? 'vmodal__media vmodal__media--v' : 'vmodal__media vmodal__media--h'}
              src={`https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0&playsinline=1`} title={title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          ) : (
            <video className="vmodal__media" src={url} poster={poster ?? undefined} controls autoPlay playsInline />
          )}
        </dialog>
      )}
    </>
  );
}

/** Hero section: gold dust, cursor trail, mouse/scroll parallax via CSS vars. */
export function Hero() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const hero = ref.current!;
    if (reducedMotion()) return;
    const stopDust = goldDust(hero.querySelector('canvas')!, 120, hero);
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const onMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    };
    const onLeave = () => { tx = ty = 0; };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
      hero.style.setProperty('--mx', cx.toFixed(4));
      hero.style.setProperty('--my', cy.toFixed(4));
      hero.style.setProperty('--sy', String(Math.min(scrollY, 900)));
    };
    hero.addEventListener('pointermove', onMove);
    hero.addEventListener('pointerleave', onLeave);
    loop();
    return () => {
      stopDust();
      cancelAnimationFrame(raf);
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <section className="hero" id="top" ref={ref}>
      <div className="hero__bg" aria-hidden="true" />
      <canvas className="hero__sparkle" aria-hidden="true" />
      <div className="hero__glow" aria-hidden="true" />
      <div className="hero__inner">
        <div className="hero__copy">
          <p className="eyebrow hero__eyebrow">One last headline, honoring a legend</p>
          <h1 className="hero__title">
            <span className="line"><span style={{ '--i': 0 } as React.CSSProperties}>Kali Ini,</span></span>
            <span className="line"><span style={{ '--i': 1 } as React.CSSProperties}>Beritanya</span></span>
            <span className="line"><span style={{ '--i': 2 } as React.CSSProperties}><em className="shimmer">Tentang Papih.</em></span></span>
          </h1>
          <p className="hero__lede">Biasanya Papih ada di balik banyak cerita. Kali ini, giliran Papih yang jadi cerita kita.</p>
          <div className="hero__actions">
            <a className="btn btn--gold" href="#buku-tamu">Kirim ucapan buat Papih</a>
            <a className="btn btn--navy" href="#cerita">Lihat Cerita dari Teman-Teman</a>
          </div>
        </div>
        <div className="hero__statue">
          <div className="hero__statue-rise">
            <Image src="/assets/patung.webp" alt="Patung perunggu Papih" fill priority sizes="(max-width: 760px) 280px, 422px" />
            <span className="glint" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
