// Pure input checks shared by server actions; covered by tests/validate.test.mjs.

type Input = { get(key: string): unknown };
type Result<T> = { error: string } | { value: T };

const text = (data: Input, key: string, limit: number) => {
  const value = String(data.get(key) ?? '').trim();
  return value.length <= limit ? value : null;
};

export function parseGreeting(data: Input): Result<{ name: string | null; team: string | null; message: string }> {
  const name = text(data, 'name', 80);
  const team = text(data, 'team', 80);
  const message = text(data, 'message', 1000);
  if (name === null || team === null || message === null) return { error: 'Teksnya kepanjangan, coba dipersingkat.' };
  if (!message) return { error: 'Pesannya jangan kosong, ya.' };
  if (!data.get('consent')) return { error: 'Centang persetujuan dulu supaya ucapanmu bisa ditampilkan.' };
  return { value: { name: data.get('anonymous') ? null : name || null, team: team || null, message } };
}

const isHttpsUrl = (value: string) => {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

export function parseVideo(data: Input): Result<{ url: string; title: string; sender_name: string | null; sender_role: string | null; poster: string | null }> {
  const url = text(data, 'url', 2000);
  const title = text(data, 'title', 120);
  const senderName = text(data, 'sender_name', 80);
  const senderRole = text(data, 'sender_role', 80);
  const poster = text(data, 'poster', 2000);
  if ([url, title, senderName, senderRole, poster].includes(null)) return { error: 'Teksnya kepanjangan.' };
  if (!url || !isHttpsUrl(url)) return { error: 'URL video harus diawali https://' };
  if (poster && !isHttpsUrl(poster)) return { error: 'URL poster harus diawali https://' };
  if (!title) return { error: 'Judul wajib diisi.' };
  return { value: { url, title, sender_name: senderName || null, sender_role: senderRole || null, poster: poster || null } };
}

// Constant-time Basic auth check (any username, password from ADMIN_PASSWORD).
export function isValidBasicAuth(header: string | null, password: string | undefined): boolean {
  if (!password || !header?.startsWith('Basic ')) return false;
  let decoded: Uint8Array;
  try {
    decoded = Uint8Array.from(atob(header.slice(6)), (c) => c.charCodeAt(0)); // raw UTF-8 bytes of "user:pass"
  } catch {
    return false;
  }
  const a = decoded.subarray(decoded.indexOf(58) + 1); // after first ':'
  const b = new TextEncoder().encode(password);
  let diff = a.length ^ b.length;
  for (let i = 0; i < b.length; i++) diff |= (a[i] ?? 0) ^ b[i];
  return diff === 0;
}
