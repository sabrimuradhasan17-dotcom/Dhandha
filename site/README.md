# La Bhutanz: website and admin panel

Next.js 14 (server-rendered for SEO) with a SQLite database and a role-based admin panel.
Everything the client edits lives in the database: tours, prices, departure dates and seats, flights, blog, reviews, SEO titles, enquiries, users and business settings.

## Run locally
```bash
cd site
cp .env.example .env.local      # set ADMIN_EMAIL / ADMIN_PASSWORD first
npm install
npm run dev                     # http://localhost:3000   admin: /admin
```
The database (`data/bhutanz.db`) is created and seeded on first start. The first owner account comes from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (default `owner@example.com` / `admin12345`, **change it immediately** in Admin > My account).

Requires Node 22.13+ (uses the built-in `node:sqlite`).

## Production
```bash
npm run build && npm start
```
* Set `SITE_URL` to the public URL (canonical tags, sitemap, Open Graph).
* Put `DATA_DIR` on a **persistent disk**. It holds the database and uploaded photos. Back it up.
* Serve over HTTPS. Session cookies are `Secure` in production (set `INSECURE_COOKIES=1` only for plain-HTTP testing).
* Hosts with an ephemeral filesystem (Vercel, Netlify) will lose data. Use a VPS, Render/Railway/Fly with a disk, or the included `Dockerfile` with a volume on `/data`.

## Roles
| | Owner | Staff |
|---|---|---|
| Edit tours, prices, dates, flights, blog, reviews, SEO, enquiries | yes | yes |
| Delete anything | yes | no |
| Users and business settings (WhatsApp number etc.) | yes | no |

## SEO built in
Server-rendered pages, unique title and description per page (editable), canonical URLs, Open Graph, JSON-LD (TravelAgency, TouristTrip, TouristDestination, FAQPage, BlogPosting, BreadcrumbList), dynamic `sitemap.xml`, `robots.txt` (admin blocked), clean URLs, alt text on images.

## Tests
`npm run build && npm start` on a throwaway `DATA_DIR`, then
`BASE=http://localhost:3000 ADMIN_EMAIL=... ADMIN_PASSWORD=... npm test` runs the 50+ browser checks (public pages, SEO, login, CRUD, uploads, roles, enquiries).

## Before launch
* Replace sample tours, prices, copy, reviews and the placeholder WhatsApp number (Admin > Settings).
* Upload real photos per tour (placeholders are shown until then).
* Verify permit/SDF facts in the FAQ (`lib/seed-data.js`, marked [verify]).
* Add 301 redirects for old bhutanz.com URLs in `next.config.mjs` once the old site is crawled.
