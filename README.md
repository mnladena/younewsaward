# YOUNEWS AWARDS — Tribute untuk Papih

Next.js 16 microsite built from the Figma file `hxBzcjJldWOI9kPAuLwywH`.

- `/` home (loading page, hero, greetings preview, videos, guestbook)
- `/ucapan` all approved greetings
- `/video` all video messages
- `/admin` moderation: approve/reject greetings, add/remove video links, download a JSON backup

Greetings and video links live in Postgres (Neon). Videos themselves are hosted on the Creative team's CDN; the site only stores their URLs. Public pages are static and refresh when something changes in `/admin`.

## Local development

Requires Node 20.9+.

```bash
npm install
cp .env.example .env.local     # then set ADMIN_PASSWORD
npm run db:local               # terminal 1: local Postgres (PGlite), data in .pglite/
npm run dev                    # terminal 2: http://localhost:3000
npm test                       # validation + auth checks
```

To develop against Neon instead, put a Neon connection string in `DATABASE_URL` and skip `db:local`.

## Deploy (GitHub + Vercel, free tiers)

1. Push this repo to GitHub, then import it in Vercel (framework is detected automatically).
2. In Vercel → Storage → create a **Neon** database, region **AWS Singapore (ap-southeast-1)**, and connect it to the project. This sets `DATABASE_URL`. Use the pooled connection string.
3. In Vercel → Settings → Environment Variables, add `ADMIN_PASSWORD` (a long random string).
4. Deploy. Tables are created automatically on first use. The build reads the database, so `DATABASE_URL` must exist for Production and Preview.

Notes:
- `/admin` uses HTTP Basic auth (any username + `ADMIN_PASSWORD`). Always use the HTTPS URL.
- Neon's free plan only restores a few hours back, so use "Unduh backup (JSON)" in `/admin` regularly and after the event.
- Video links must be direct `https://…mp4` files encoded as H.264 + AAC with faststart. YouTube, Vimeo or Drive page links won't play.
- Vercel Hobby is for non-commercial use. A company-run site may need Vercel Pro.
