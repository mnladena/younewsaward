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
 * Card carousel: native scroll-snap handles swipe, arrows step one card, and a rAF clock auto-advances.
 * The clock (not a CSS animationiteration event, which Safari drops) drives the progress bar, so the two never drift.
 * It holds while paused, mouse-hovered, keyboard-focused, a read-more popup is open, or 15 s after a swipe.
 */
export function Carousel({ children, label, auto }: { children: React.ReactNode; label: string; auto: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  const clock = useRef({ elapsed: 0, dur: 10000, hover: false, restUntil: 0 });

  // Each step lasts long enough to read the card that just slid in: ~3 words/s, 8–18 s.
  const timeFor = (index: number) => {
    const el = track.current!;
    const cards = el.children;
    const perView = Math.max(1, Math.round(el.clientWidth / (cards[0] as HTMLElement).offsetWidth));
    const incoming = cards[Math.min(index + perView - 1, cards.length - 1)];
    const words = incoming.querySelector('.card__msg')?.textContent?.split(/\s+/).length ?? 0;
    clock.current.dur = Math.min(18, Math.max(8, Math.min(words, 70) / 3)) * 1000;
    clock.current.elapsed = 0;
  };

  // Step one card either way, wrapping at both ends.
  const go = (delta: number) => {
    const el = track.current!;
    const cards = el.children;
    const step = cards.length > 1 ? (cards[1] as HTMLElement).offsetLeft - (cards[0] as HTMLElement).offsetLeft : el.clientWidth;
    const max = el.scrollWidth - el.clientWidth;
    const from = el.scrollLeft;
    const to = delta > 0 ? (from >= max - 8 ? 0 : Math.min(max, (Math.round(from / step) + 1) * step))
      : (from <= 8 ? max : Math.max(0, (Math.round(from / step) - 1) * step));
    timeFor(Math.round(to / step));
    if (reducedMotion()) { el.scrollLeft = to; return; }
    // Hand-rolled glide: native smooth scroll is ~0.4 s and feels like a jolt. Snap is off while it runs.
    const start = performance.now();
    el.style.scrollSnapType = 'none';
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / 1200);
      el.scrollLeft = from + (to - from) * (1 - (1 - t) ** 4);
      if (t < 1) requestAnimationFrame(frame); else el.style.scrollSnapType = '';
    };
    requestAnimationFrame(frame);
  };

  useEffect(() => { if (auto) timeFor(0); }, [auto]);
  useEffect(() => {
    if (!auto || reducedMotion()) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const c = clock.current, el = track.current!;
      const held = paused || c.hover || now < c.restUntil || el.matches(':focus-visible') || el.querySelector('dialog[open]');
      if (!held) c.elapsed += Math.min(now - last, 100); // capped so a background tab doesn't skip ahead on return
      last = now;
      if (c.elapsed >= c.dur) go(1);
      bar.current!.style.transform = `scaleX(${c.elapsed / c.dur})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [auto, paused]);

  // A swipe or wheel scroll means someone is reading. Taps on buttons or inside the popup don't count.
  const rest = (e: React.PointerEvent | React.WheelEvent) => {
    if (!(e.target as Element).closest('button, dialog')) clock.current.restUntil = performance.now() + 15000;
  };
  // Mouse only: a touch leaves :hover stuck on the track after the tap, which used to freeze the carousel.
  const hover = (on: boolean) => (e: React.PointerEvent) => { if (e.pointerType === 'mouse') clock.current.hover = on; };

  return (
    <div className="carousel">
      <div className="carousel__track" ref={track} role="region" aria-label={label} tabIndex={0}
        onPointerEnter={hover(true)} onPointerLeave={hover(false)}
        onPointerDown={rest} onWheel={(e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) rest(e); }}>{children}</div>
      {auto && (
        <div className="carousel__controls">
          <button className="carousel__arrow" type="button" aria-label="Ucapan sebelumnya" onClick={() => go(-1)}>←</button>
          <button className="carousel__arrow" type="button" aria-label="Ucapan berikutnya" onClick={() => go(1)}>→</button>
          <span className="carousel__bar" aria-hidden="true"><i ref={bar} /></span>
          <button className="btn btn--outline btn--sm carousel__pause" type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>
            {paused ? 'Putar' : 'Jeda'}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Full-screen story mode (think Instagram Stories): one slide at a time with segment progress on top.
 * Tap the left third to go back, anywhere else to go forward; ←/→ and Space work too. Loops, so it can run on a screen at the event.
 */
export function Story({ slides, seconds }: { slides: React.ReactNode[]; seconds: number[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState<number | null>(null); // null = closed
  const [paused, setPaused] = useState(false);
  const open = index !== null;
  const go = (k: number) => setIndex((k + slides.length) % slides.length);

  useEffect(() => {
    if (!open) return;
    dialog.current!.showModal();
    return reducedMotion() ? undefined : goldDust(dialog.current!.querySelector('canvas')!, 90);
  }, [open]);

  // Auto-advance runs on a timer and the bar is painted from JS each frame. A CSS animation with var(--dur) showed up
  // instantly full on iOS Safari, and its animationend isn't reliable there either. Time spent survives a pause.
  const spent = useRef({ index: -1, ms: 0 });
  const bar = useRef<HTMLElement>(null);
  useEffect(() => {
    if (index === null || paused) return;
    if (spent.current.index !== index) spent.current = { index, ms: 0 };
    const start = performance.now();
    const timer = setTimeout(() => go(index + 1), seconds[index] * 1000 - spent.current.ms);

    // A long greeting scrolls itself: holds 2 s at the top, reaches the bottom 2 s before the slide ends.
    // Speed = distance left / time left, so a manual scroll or a pause just re-paces it.
    const slide = stage.current!.firstElementChild as HTMLElement;
    const autoScroll = !reducedMotion();
    let raf = 0, last = start, pos = slide.scrollTop;
    const frame = (now: number) => {
      const ms = spent.current.ms + now - start;
      bar.current!.style.transform = `scaleX(${Math.min(1, ms / (seconds[index] * 1000))})`;
      if (autoScroll) {
        if (Math.abs(slide.scrollTop - pos) > 2) pos = slide.scrollTop; // user scrolled; follow them
        const timeLeft = seconds[index] * 1000 - 2000 - ms, left = slide.scrollHeight - slide.clientHeight - pos;
        // pos keeps the fractional part: Chrome rounds scrollTop, so sub-pixel steps would never move.
        if (ms > 2000 && left > 0 && timeLeft > 0) slide.scrollTop = pos += left * Math.min(1, (now - last) / timeLeft);
      }
      last = now;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); spent.current.ms += performance.now() - start; };
  }, [index, paused]);

  return (
    <>
      <button className="btn btn--gold" type="button" onClick={() => { setIndex(0); if (bgm()?.paused) playMusic(); }}>
        Putar semua ucapan
      </button>
      {open && (
        <dialog className="story" ref={dialog} aria-label="Mode cerita: ucapan untuk Papih"
          onClose={() => { setIndex(null); setPaused(false); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') go(index + 1);
            else if (e.key === 'ArrowLeft') go(index - 1);
            else if (e.key === ' ') { e.preventDefault(); setPaused(!paused); }
          }}>
          <canvas className="sparkle" aria-hidden="true" />
          <div className="story__head">
            <div className="story__bar" aria-hidden="true">
              {slides.map((_, k) => (
                <span key={k} className={k < index ? 'is-done' : undefined}>
                  {k === index && <i key={index} ref={bar} />}
                </span>
              ))}
            </div>
            <div className="story__top">
              <span className="story__count">{String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span>
              <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? 'Putar' : 'Jeda'}</button>
              <button type="button" onClick={() => dialog.current?.close()}>Tutup ✕</button>
            </div>
          </div>
          <div className="story__stage" ref={stage} aria-live="polite" onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            go(e.clientX - r.left < r.width / 3 ? index - 1 : index + 1);
          }}>
            {slides[index]}
          </div>
        </dialog>
      )}
    </>
  );
}

/** Greeting card whose message is height-clamped; if it overflows, "Baca selengkapnya" opens the full text in a <dialog>. */
export function Clipping({ children, label }: { children: React.ReactNode; label: string }) {
  const card = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [clamped, setClamped] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const msg = card.current!.querySelector<HTMLElement>('.card__msg')!;
    // Only clamped when the box has hit its max-height: the drop cap's glyph overflows a little even on short texts.
    const measure = () => setClamped(msg.clientHeight >= parseFloat(getComputedStyle(msg).maxHeight) - 1 && msg.scrollHeight > msg.clientHeight + 2);
    const ro = new ResizeObserver(measure);
    ro.observe(msg);
    return () => ro.disconnect();
  }, []);
  useEffect(() => { if (open) dialog.current?.showModal(); }, [open]);

  return (
    <article className={clamped ? 'card is-clamped' : 'card'} ref={card}>
      {children}
      {clamped && <button className="card__more" type="button" onClick={() => setOpen(true)}>Baca selengkapnya</button>}
      {open && (
        <dialog className="vmodal" ref={dialog} aria-label={label} onClose={() => setOpen(false)}
          onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}>
          <button className="vmodal__close" type="button" onClick={() => dialog.current?.close()}>Tutup ✕</button>
          <div className="card card--full">{children}</div>
        </dialog>
      )}
    </article>
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
