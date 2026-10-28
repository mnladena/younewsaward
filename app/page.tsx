import Link from 'next/link';
import { GuestbookForm } from '@/components/GuestbookForm';
import { Carousel, Hero, LoadingScreen } from '@/components/effects';
import { Footer, Gallery, GreetingCard, HomeVideoCard, Logo, fillSlots } from '@/components/site';
import { sql, type Greeting, type Video } from '@/lib/db';

// Static page, refreshed by revalidatePath() whenever admin approves a greeting or edits videos.
export default async function Home() {
  const [greetings, videos] = await Promise.all([
    sql<Greeting>("SELECT name, team, message FROM greetings WHERE status = 'approved' ORDER BY id DESC LIMIT 12"),
    sql<Video>('SELECT * FROM videos ORDER BY id LIMIT 3'),
  ]);

  return (
    <>
      <LoadingScreen />
      <header className="nav nav--home">
        <a className="nav__logo" href="#top"><Logo alt="YOU-NEWS AWARD, kembali ke atas" /></a>
        <p className="nav__edition">Jumat · Edisi Spesial</p>
        <a className="btn btn--gold btn--sm" href="#buku-tamu">Kirim Ucapan</a>
      </header>

      <main>
        <Hero />
        <Gallery />

        <section className="cerita" id="cerita">
          <div className="container">
            <div className="sec-head">
              <p className="eyebrow">Liputan Utama · 02</p>
              <h2 className="display">Ternyata, Banyak<br />Cerita tentang <em>Papih.</em></h2>
              <p className="sec-head__lede">Dari yang sudah bareng Papih sejak lama sampai yang baru beberapa tahun kenal, semua punya cerita masing-masing.</p>
            </div>
            <div className={greetings.length ? 'board' : 'board board--empty'}>
              <div className="board__intro">
                <p className="quote-mark" aria-hidden="true">“</p>
                <div className="board__text">
                  {greetings.length ? (
                    <>
                      <h3 className="board__title">Cerita hangat untuk Papi.</h3>
                      <p className="board__desc">Ucapan, kenangan, dan doa dari teman-teman yang tumbuh bersama Papi. Ada cerita darimu juga?</p>
                    </>
                  ) : (
                    <>
                      <h3 className="board__title">Ruang ini siap diisi cerita.</h3>
                      <p className="board__desc">Belum ada ucapan yang tayang. Jadi yang pertama mengirim pesan buat Papih, yuk.</p>
                    </>
                  )}
                </div>
                <a className="btn btn--dark" href="#buku-tamu">Kirim ucapan</a>
              </div>
              {greetings.length > 0 && (
                <>
                  <Carousel label="Ucapan untuk Papih" auto={greetings.length > 3}>
                    {greetings.map((g, i) => <GreetingCard key={i} g={g} />)}
                  </Carousel>
                  <div className="board__more"><Link className="btn btn--outline" href="/ucapan">Selengkapnya</Link></div>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="pesan" id="pesan">
          <div className="container">
            <div className="sec-head">
              <p className="eyebrow">Pesan dalam Gambar · 03</p>
              <h2 className="display">Ada Pesan Spesial<br />buat <em>Papih.</em></h2>
              <p className="sec-head__lede">Ucapan, cerita, dan sedikit pesan dari teman-teman yang pengin menyampaikan sesuatu langsung ke Papih.</p>
            </div>
          </div>
          <div className="container">
            <div className="vgrid">
              {fillSlots(videos, 3).map((v, i) => <HomeVideoCard key={v?.id ?? `slot-${i}`} v={v} index={i} />)}
            </div>
          </div>
          <p className="pesan__note">Video asli akan ditampilkan di sini tanpa dipotong, lengkap dengan kontrol pemutaran.</p>
          <Link className="btn btn--outline-gold" href="/video">Selengkapnya</Link>
        </section>

        <section className="tamu" id="buku-tamu">
          <div className="container tamu__grid">
            <div>
              <p className="eyebrow">Buku Tamu Digital · 04</p>
              <h2 className="display">Papih,<br />Ada Pesan Nih!</h2>
              <p className="tamu__lede">Ucapan singkat, kenangan seru, ucapan terima kasih, atau doa buat perjalanan berikutnya—semuanya boleh.</p>
              <div className="tamu__safe">
                <span className="tamu__check" aria-hidden="true">✓</span>
                <p><b>Aman dan termoderasi.</b><br />Pesan tidak langsung tayang. Tim Creative akan cek dulu, ya.</p>
              </div>
            </div>
            <GuestbookForm />
          </div>
        </section>

        <section className="penutup">
          <div className="container">
            <p className="eyebrow">Catatan Penutup · 05</p>
            <h2 className="display">Cerita Bareng Papih<br />Nggak Berhenti <em>di Sini.</em></h2>
            <p className="penutup__text">Makasih sudah jadi bagian dari perjalanan kita. Sekarang waktunya Papih bikin cerita-cerita baru di luar kantor. Jangan lupa mampir dan kasih kabar, ya!</p>
            <a className="btn btn--gold" href="#buku-tamu">Kirim Satu Ucapan Lagi</a>
            <Footer />
          </div>
        </section>
      </main>
    </>
  );
}
