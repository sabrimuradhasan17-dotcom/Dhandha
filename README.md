# La Bhutanz Tours — website, enquiry CRM & admin panel

A complete site for a Mumbai-based Bhutan land-package travel agency (INR, per-person pricing).
Node + Express backend, JSON-file database (no external services), single-page front end with server-side SEO tags.

## Run
```bash
npm install
npm start                # http://localhost:3000   (admin: /admin)
```
First run seeds the database from the old bhutanz.com content. **Default admin password: `bhutanz@2026`** — you are warned on the dashboard until you change it (Security & backup).
Set `ADMIN_PASSWORD=...` to choose the initial password instead.

| Env var | Purpose |
|---|---|
| `PORT` | HTTP port (default 3000) |
| `DATA_DIR` | Where `db.json`, `uploads/` and `backups/` live — **point at a persistent disk in production** |
| `ADMIN_PASSWORD` | Initial admin password (skips the forced-change warning) |
| `NOTIFY_WEBHOOK_URL` | Optional: POSTs every new enquiry as JSON (Zapier / Make / Slack) |

Deploy anywhere that runs Node (Render, Railway, Fly.io, a VPS) or with the included `Dockerfile` (mount a volume at `/data`). Put it behind HTTPS.

## Website
Home · Packages (filters/search) · Package detail (itinerary, inclusions, departures, **cost estimator** with SDF + GST) · Departures & flights · Journal · FAQ · Visa/Festivals/About/Do's & Don'ts/Terms/Privacy pages · How to book & pay · Contact.
**WhatsApp**: floating button, header button, mobile call/WhatsApp bar, and pre-filled messages per package, departure and enquiry. Enquiry form saves to the CRM *and* offers "Continue on WhatsApp".
SEO: per-page titles/descriptions, canonical URLs, Open Graph, JSON-LD (TravelAgency / TouristTrip), `sitemap.xml`, `robots.txt`.

## Admin panel (`/admin`)
- **Dashboard** — new enquiries, upcoming departures, launch checklist.
- **Enquiries (CRM)** — status pipeline (new → contacted → quoted → booked/lost), notes, one-click WhatsApp reply, CSV export.
- **Departures & flights** — inline editing of date, package, city, seats, booked, per-departure price, status, airline, flight no., route, times. Saves instantly and goes live.
- **Packages & prices** — inline price/visibility edit, bulk % change, full editor (itinerary, inclusions, photo, FAQs).
- **Journal, FAQs, Testimonials, Pages** — editors. **Settings** — contact, WhatsApp, SDF/GST, payment details, banner, logo, SEO. **Security & backup** — password change, backup/restore.

## Security notes
scrypt-hashed password, HMAC-signed HttpOnly SameSite=Strict cookie, login/enquiry rate limits, origin check on admin writes, CSP + security headers, server-side input whitelisting, HTML sanitising, image upload type sniffing (no SVG). Single admin account; the JSON database suits a small business (thousands of enquiries). Move to a SQL database if you need multiple staff accounts or heavy traffic.

## Content status — please review before launch
- **Package prices are sample values** (admin shows a warning until each is confirmed).
- Departures shown are sample dates/seats from Mumbai; flight numbers/times are blank.
- Generic inclusions/exclusions for land packages, the Terms & Privacy pages and the booking-advance wording are starter text.
- Logo and photos could not be copied from the old site (its image host blocks automated downloads): upload them in Settings → Logo and Packages → Cover photo.
