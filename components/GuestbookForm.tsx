'use client';

import { startTransition, useActionState, useEffect, useRef, useState } from 'react';
import { submitGreeting, type FormState } from '@/app/actions';

export function GuestbookForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(submitGreeting, null);
  const [anonymous, setAnonymous] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) { form.current?.reset(); setAnonymous(false); }
  }, [state]);

  return (
    // onSubmit instead of action={...}: React auto-resets action forms, which would wipe the message on a validation error.
    <form className="form" ref={form} onSubmit={(e) => {
      e.preventDefault();
      const data = new FormData(e.currentTarget);
      startTransition(() => action(data));
    }}>
      {/* honeypot: hidden from people, bots fill it */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }} />
      <div className="form__row">
        <label className="field">
          <span className="field__label">Nama <i>opsional</i></span>
          <input name="name" type="text" placeholder="Tulis nama kamu" autoComplete="name" maxLength={80} disabled={anonymous} />
        </label>
        <label className="field">
          <span className="field__label">Divisi atau tim <i>opsional</i></span>
          <input name="team" type="text" placeholder="Misalnya: Creative" maxLength={80} />
        </label>
      </div>
      <label className="field">
        <span className="field__label">Pesan untuk Papih</span>
        <textarea name="message" placeholder="Tulis ucapan, cerita, atau kenanganmu di sini…" required maxLength={1000} />
      </label>
      <label className="check"><input type="checkbox" name="anonymous" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> Kirim sebagai anonim.</label>
      <label className="check"><input type="checkbox" name="consent" required /> Saya setuju ucapan ini ditampilkan di microsite YOU-NEWS AWARD.</label>
      <div className="form__submit">
        <button className="btn btn--gold" type="submit" disabled={pending}>{pending ? 'Mengirim…' : 'Kirim Ucapan'}</button>
        <p className="form__hint">Ucapan akan dicek dulu sebelum tampil di sini.</p>
      </div>
      <p className="form__status" role="status" aria-live="polite" data-state={state?.error ? 'error' : 'ok'}>
        {state?.error ?? (state?.ok ? 'Terima kasih! Ucapanmu sudah terkirim dan akan dicek dulu sebelum tampil.' : '')}
      </p>
    </form>
  );
}
