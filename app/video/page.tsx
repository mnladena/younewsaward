import type { Metadata } from 'next';
import Image from 'next/image';
import { Footer, IndexVideoCard, SubNav, fillSlots } from '@/components/site';
import { sql, type Video } from '@/lib/db';

export const metadata: Metadata = { title: 'Ada Pesan Spesial buat Papih — YOUNEWS AWARDS' };

export default async function VideoIndex() {
  const videos = await sql<Video>('SELECT * FROM videos ORDER BY id');

  return (
    <div className="page-video">
      <SubNav />
      <main>
        <div className="container vidx-head">
          <h1>Ada Pesan Spesial<br />buat <em>Papih.</em></h1>
          <p>Ucapan, cerita, dan sedikit pesan dari teman-teman yang pengin menyampaikan sesuatu langsung ke Papih.</p>
        </div>
        <div className="container vidx-list">
          <div className="vgrid vgrid--all">
            {fillSlots(videos, 4).map((v, i) => <IndexVideoCard key={v?.id ?? `slot-${i}`} v={v} />)}
          </div>
          <p className="vidx-note"><Image src="/assets/info.svg" alt="" width={14} height={14} /> Video asli akan ditampilkan di sini tanpa dipotong, lengkap dengan kontrol pemutaran.</p>
        </div>
      </main>
      <Footer bar />
    </div>
  );
}
