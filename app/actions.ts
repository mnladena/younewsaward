'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { sql, type Status } from '@/lib/db';
import { parseGreeting, parseVideo } from '@/lib/validate';

export type FormState = { ok?: boolean; error?: string } | null;

// ponytail: no per-IP rate limit; honeypot + moderation queue absorb spam. Add Upstash/Vercel BotID if the queue floods.
export async function submitGreeting(_prev: FormState, data: FormData): Promise<FormState> {
  if (data.get('website')) return { ok: true }; // honeypot: bots fill hidden fields, pretend success
  const parsed = parseGreeting(data);
  if ('error' in parsed) return { error: parsed.error };
  const { name, team, message } = parsed.value;
  try {
    await sql('INSERT INTO greetings (name, team, message) VALUES ($1, $2, $3)', [name, team, message]);
  } catch (err) {
    console.error(err);
    return { error: 'Ucapan gagal terkirim. Coba lagi sebentar, ya.' };
  }
  return { ok: true };
}

const STATUSES: Status[] = ['pending', 'approved', 'rejected'];
const refreshPublic = () => ['/', '/ucapan', '/video', '/admin'].forEach((p) => revalidatePath(p));

export async function setGreetingStatus(id: number, status: Status) {
  await requireAdmin();
  if (!Number.isInteger(id) || !STATUSES.includes(status)) throw new Error('Bad request');
  await sql('UPDATE greetings SET status = $1 WHERE id = $2', [status, id]);
  refreshPublic();
}

export async function addVideo(_prev: FormState, data: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseVideo(data);
  if ('error' in parsed) return { error: parsed.error };
  const v = parsed.value;
  await sql('INSERT INTO videos (url, title, sender_name, sender_role, poster) VALUES ($1, $2, $3, $4, $5)',
    [v.url, v.title, v.sender_name, v.sender_role, v.poster]);
  refreshPublic();
  return { ok: true };
}

export async function deleteVideo(id: number) {
  await requireAdmin();
  if (!Number.isInteger(id)) throw new Error('Bad request');
  await sql('DELETE FROM videos WHERE id = $1', [id]);
  refreshPublic();
}
