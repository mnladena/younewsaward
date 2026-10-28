import type { Metadata } from 'next';
import { Arimo, Inter, Lora } from 'next/font/google';
import { Music } from '@/components/effects';
import './globals.css';

const lora = Lora({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-lora' });
const inter = Inter({ subsets: ['latin'], weight: '400', variable: '--font-inter' });
const arimo = Arimo({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-arimo' });

export const metadata: Metadata = {
  title: 'YOUNEWS AWARDS — Kali Ini, Beritanya Tentang Papih',
  description: 'Tribute microsite untuk Papih. One last headline, honoring a legend.',
};

// Runs before first paint: enables JS-gated animations, and hides the loading page if it was already seen this session.
const bootScript = `document.documentElement.classList.add('js');try{if(sessionStorage.getItem('intro-seen')||location.hash)document.documentElement.classList.add('intro-skip')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${lora.variable} ${inter.variable} ${arimo.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>{children}<Music /></body>
    </html>
  );
}
