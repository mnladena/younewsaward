'use client';

import { startTransition, useActionState, useEffect, useRef } from 'react';
import { addVideo, updateVideo, type FormState } from '@/app/actions';
import type { Video } from '@/lib/db';

// Without `video` it adds a new one; with it, the same fields edit that video in place.
export function VideoForm({ video }: { video?: Video }) {
  const [state, action, pending] = useActionState<FormState, FormData>(video ? updateVideo : addVideo, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok && !video) form.current?.reset(); }, [state, video]);

  // onSubmit (not action=) so a validation error keeps what was typed; see GuestbookForm.
  return (
    <form className="admin__video-form" ref={form} onSubmit={(e) => {
      e.preventDefault();
      const data = new FormData(e.currentTarget);
      startTransition(() => action(data));
    }}>
      {video && <input type="hidden" name="id" value={video.id} />}
      <label className="wide">URL video (YouTube/Shorts atau MP4 H.264, https://) *<input name="url" type="url" required defaultValue={video?.url} placeholder="https://youtube.com/shorts/… atau https://cdn.example.com/pesan-01.mp4" /></label>
      <label>Judul *<input name="title" required maxLength={120} defaultValue={video?.title ?? 'Pesan dari teman Papih'} /></label>
      <label>URL poster (opsional)<input name="poster" type="url" defaultValue={video?.poster ?? undefined} placeholder="https://…/poster.jpg" /></label>
      <label>Nama pengirim<input name="sender_name" maxLength={80} defaultValue={video?.sender_name ?? undefined} /></label>
      <label>Peran / tim<input name="sender_role" maxLength={80} defaultValue={video?.sender_role ?? undefined} /></label>
      <div className="wide">
        <button type="submit" disabled={pending}>{pending ? 'Menyimpan…' : video ? 'Simpan perubahan' : 'Tambah video'}</button>{' '}
        {state?.error && <span style={{ color: '#9b1c1c' }}>{state.error}</span>}
        {state?.ok && <span>Tersimpan.</span>}
      </div>
    </form>
  );
}
