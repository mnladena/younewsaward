'use client';

import { startTransition, useActionState, useEffect, useRef } from 'react';
import { addVideo, type FormState } from '@/app/actions';

export function VideoForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addVideo, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) form.current?.reset(); }, [state]);

  // onSubmit (not action=) so a validation error keeps what was typed; see GuestbookForm.
  return (
    <form className="admin__video-form" ref={form} onSubmit={(e) => {
      e.preventDefault();
      const data = new FormData(e.currentTarget);
      startTransition(() => action(data));
    }}>
      <label className="wide">URL video (YouTube/Shorts atau MP4 H.264, https://) *<input name="url" type="url" required placeholder="https://youtube.com/shorts/… atau https://cdn.example.com/pesan-01.mp4" /></label>
      <label>Judul *<input name="title" required maxLength={120} defaultValue="Pesan dari teman Papih" /></label>
      <label>URL poster (opsional)<input name="poster" type="url" placeholder="https://…/poster.jpg" /></label>
      <label>Nama pengirim<input name="sender_name" maxLength={80} /></label>
      <label>Peran / tim<input name="sender_role" maxLength={80} /></label>
      <div className="wide">
        <button type="submit" disabled={pending}>{pending ? 'Menyimpan…' : 'Tambah video'}</button>{' '}
        {state?.error && <span style={{ color: '#9b1c1c' }}>{state.error}</span>}
        {state?.ok && <span>Tersimpan.</span>}
      </div>
    </form>
  );
}
