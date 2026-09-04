This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Railway Deployment

Railway is the recommended deployment target for the current CMS because it
supports a persistent Node service, persistent volumes, and FFmpeg.

1. Create a Railway service from this repository. Railway will use the included
   `Dockerfile`.
2. Attach a persistent volume mounted at `/data`.
3. Set `DATA_DIR=/data` in the Railway service variables.
4. Add all production variables from `.env.example` in Railway. Keep secrets
   server-only; do not add them to `NEXT_PUBLIC_*` variables.
5. Set the service health check to `/api/health` if it is not detected from
   `railway.json`.

The local `.data` directory is intentionally ignored and is not deployed. To
keep existing local content, migrate `.data/ywn.db` and `.data/uploads` to the
Railway volume before switching traffic. Back up the database before every
migration.

Railway does not use `vercel.json` cron schedules. Configure two scheduled
requests in Railway or an external scheduler:

- `GET /api/cron/playlists` every 15 minutes
- `GET /api/cron/artists` every 6 hours

Send `Authorization: Bearer <CRON_SECRET>` with each request.

## Split Deployment (Vercel Frontend + Railway Backend)

For a low-traffic launch, run the public frontend on Vercel Free and keep
the database, admin, sync, and email logic on Railway:

1. Deploy the full app to Railway first (Dockerfile, `DATA_DIR=/data`,
   persistent volume). This is the backend and admin origin.
2. Deploy the same repository to Vercel with `BACKEND_URL` set to the
   Railway service URL (for example `https://api.yellowwhitenoise.com`
   or the Railway-provided domain).
3. Vercel proxies `/api/*` to Railway and redirects `/admin/*` to the
   Railway origin, so auth cookies and admin assets stay on one origin.
4. Keep all secrets (`ADMIN_*`, `AUTH_SECRET`, `CRON_SECRET`, Spotify,
   YouTube, Apple, SMTP/Resend, Cloudinary) only on Railway. Vercel needs
   only `BACKEND_URL` plus public `NEXT_PUBLIC_*` pixel IDs.
5. Configure Cloudinary (`CLOUDINARY_*`) on Railway for media storage/CDN.
   Uploads fall back to the Railway volume when Cloudinary is unset.
6. Configure `RESEND_API_KEY` (+ optional `RESEND_FROM`) on Railway for
   newsletters. SMTP remains as a fallback; Railway Hobby and below block
   outbound SMTP, so Resend is required there.
7. Schedule the two cron endpoints against the Railway origin with the
   `Authorization: Bearer <CRON_SECRET>` header.

Monolith mode (Railway only, `BACKEND_URL` blank) remains fully supported
and is the recommended path until traffic justifies the split.

## Streaming Playlists

Open `/admin/playlists` and paste a public playlist share URL from Spotify,
Apple Music, or YouTube Music. Imported playlists start hidden; use
"Shown publicly" after adding the matching playlist URLs for the other
platforms. The public `/playlists` page then uses the selected imported
playlists.

Playlist imports run on the server. Configure these variables in `.env.local`:

- `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` for Spotify playlists
- `YOUTUBE_API_KEY` for YouTube Music playlists
- `APPLE_MUSIC_DEVELOPER_TOKEN`, or `APPLE_TEAM_ID`, `APPLE_KEY_ID`, and
  `APPLE_PRIVATE_KEY` for Apple Music playlists

The platform credentials are never sent to the browser.

### Connected accounts (Spotify OAuth + YouTube channel)

For bulk importing, save the Yellow White Noise profile URL for each
platform in the **Connected accounts** section of `/admin/playlists`:

- **Spotify** — click **Connect Spotify account** and approve read-only
  access (`playlist-read-private`, `playlist-read-collaborative`,
  `user-read-private`). Then **Discover playlists** lists that account's
  playlists, including private and collaborative ones. OAuth tokens are
  AES-256-GCM encrypted with `AUTH_SECRET` in the server database and
  refresh automatically; scheduled syncs can therefore refresh private
  playlists too. Disconnect any time from the same section.
- **YouTube** — save the channel URL (`/channel/UC…` or `@handle`) and
  Discover lists the channel's public playlists via `YOUTUBE_API_KEY`.
- **Apple Music** — no free playlist API exists, so discovery is not
  available. Import Apple playlists with a share link, or sync the same
  songs from Spotify/YouTube and keep the Apple URL as the fan link.
  Artist albums and tracks still sync through the free iTunes Lookup API
  with no key required.

### Spotify app setup (redirect URI)

1. Open https://developer.spotify.com/dashboard, create an app.
2. Under the app's **Settings → Redirect URIs**, add exactly:
   - `http://localhost:3000/api/auth/spotify/callback` (local dev)
   - `https://YOUR-DOMAIN/api/auth/spotify/callback` (production —
     use your Railway domain, or your own domain)
3. Copy the **Client ID** and **Client Secret** into `SPOTIFY_CLIENT_ID`
   and `SPOTIFY_CLIENT_SECRET`. Optionally set `SPOTIFY_REDIRECT_URI`
   explicitly; otherwise the app derives it from the request origin.

When deployed on Vercel, `/api/cron/playlists` checks all imported source
playlists on the playlist refresh interval (default 15 minutes,
configurable in Admin → Settings). Set `CRON_SECRET` in the deployment
environment; the public playlist pages also refresh stale sources when they
are visited.

Artist catalog sync is configured inside each artist editor. Add the official
Spotify artist URL, Apple Music artist URL, or YouTube Music channel URL,
enable automatic sync, and save. Enabled artists are checked on the artist
refresh interval (default six hours, configurable in Admin → Settings);
new tracks and albums are merged by ISRC, platform ID, then normalized release
metadata. Existing manual releases are preserved.

Enabling forward-then-backward playback prepares browser-compatible MP4
derivatives with FFmpeg. Install FFmpeg on the server or set `FFMPEG_PATH` in
`.env.local`.

The Subscribe control on an individual playlist subscribes the address to
that playlist's new-track updates by default. The optional global-updates
checkbox also adds general Yellow White Noise release emails. Playlist sync
compares the previous track snapshot and sends one update containing all new
tracks detected in that sync.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
