'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

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

/** Figma 25:10. Covers the home page until it has loaded, once per session. */
export function LoadingScreen() {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'show' | 'leaving' | 'gone'>('show');

  useEffect(() => {
    const ready = () => document.body.classList.add('ready');
    let seen = false;
    try { seen = !!sessionStorage.getItem('intro-seen') || !!location.hash; } catch {}
    if (seen) { setState('gone'); ready(); return; }

    const reduce = reducedMotion();
    const stopDust = reduce ? undefined : goldDust(ref.current!.querySelector('canvas')!, 160);
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const loaded = new Promise((r) => (document.readyState === 'complete' ? r(null) : addEventListener('load', r, { once: true })));
    let cancelled = false;
    Promise.all([
      Promise.race([Promise.all([loaded, document.fonts.ready]), wait(8000)]), // never hang on a slow asset
      wait(reduce ? 0 : 2200), // let the logo reveal finish
    ]).then(async () => {
      if (cancelled) return;
      try { sessionStorage.setItem('intro-seen', '1'); } catch {}
      document.documentElement.classList.add('intro-skip');
      setState('leaving');
      await wait(reduce ? 0 : 450);
      ready();
      await wait(reduce ? 0 : 650);
      if (!cancelled) setState('gone');
    });
    return () => { cancelled = true; stopDust?.(); };
  }, []);

  if (state === 'gone') return null;
  return (
    <div ref={ref} className={`intro${state === 'leaving' ? ' is-leaving' : ''}`} role="status" aria-label="Memuat halaman">
      <div className="intro__bg" aria-hidden="true" />
      <canvas className="sparkle" aria-hidden="true" />
      <div className="intro__logo">
        <Image src="/assets/logo-big.webp" alt="YOUNEWS AWARDS — One last headline, honoring a legend" width={900} height={489} priority />
        <span className="glint" aria-hidden="true" />
      </div>
    </div>
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
