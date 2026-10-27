// Run: npm test  (Node >= 23.6 strips the TypeScript types natively)
import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidBasicAuth, parseGreeting, parseVideo } from '../lib/validate.ts';

const form = (obj) => ({ get: (k) => obj[k] ?? null });
const basic = (s) => 'Basic ' + Buffer.from(s).toString('base64');

test('parseGreeting', () => {
  assert.match(parseGreeting(form({ message: 'Hai' })).error, /persetujuan/);
  assert.match(parseGreeting(form({ message: '   ', consent: 'on' })).error, /kosong/);
  assert.match(parseGreeting(form({ message: 'x'.repeat(1001), consent: 'on' })).error, /kepanjangan/);
  assert.deepEqual(parseGreeting(form({ name: ' Rina ', team: '', message: ' Selamat! ', consent: 'on' })).value,
    { name: 'Rina', team: null, message: 'Selamat!' });
  assert.equal(parseGreeting(form({ name: 'Rina', message: 'Hai', consent: 'on', anonymous: 'on' })).value.name, null);
});

test('parseVideo', () => {
  assert.match(parseVideo(form({ url: 'javascript:alert(1)', title: 'A' })).error, /https/);
  assert.match(parseVideo(form({ url: 'http://cdn.test/a.mp4', title: 'A' })).error, /https/);
  assert.match(parseVideo(form({ url: 'https://cdn.test/a.mp4', title: 'A', poster: 'ftp://x' })).error, /poster/);
  assert.match(parseVideo(form({ url: 'https://cdn.test/a.mp4', title: ' ' })).error, /Judul/);
  assert.deepEqual(parseVideo(form({ url: 'https://cdn.test/a.mp4', title: 'Pesan' })).value,
    { url: 'https://cdn.test/a.mp4', title: 'Pesan', sender_name: null, sender_role: null, poster: null });
});

test('isValidBasicAuth', () => {
  assert.equal(isValidBasicAuth(basic('admin:s3cret'), 's3cret'), true);
  assert.equal(isValidBasicAuth(basic('any:pa:ss'), 'pa:ss'), true); // only first ':' splits
  assert.equal(isValidBasicAuth(basic('admin:rahasia-ü'), 'rahasia-ü'), true); // non-ASCII
  assert.equal(isValidBasicAuth(basic('admin:s3cre'), 's3cret'), false);
  assert.equal(isValidBasicAuth(basic('admin:s3cretX'), 's3cret'), false);
  assert.equal(isValidBasicAuth(basic('admin:s3cret'), undefined), false); // unset password never grants access
  assert.equal(isValidBasicAuth(null, 's3cret'), false);
  assert.equal(isValidBasicAuth('Basic !!!', 's3cret'), false);
});
