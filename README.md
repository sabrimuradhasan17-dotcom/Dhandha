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

## Deploy (put it live)
**Render (simplest):** push this repo to GitHub → Render → *New → Blueprint* → select the repo and branch. `render.yaml` sets up the web service and a 1 GB persistent disk (a paid "Starter" plan is required for disks; on a free plan your data is wiped on every restart). Enter an `ADMIN_PASSWORD` when asked. Add your own domain under *Settings → Custom Domains*, then set the same address in Admin → Settings → Website address.
**Docker / VPS / Railway / Fly.io:** use the included `Dockerfile`, mount a volume at `/data`, set `ADMIN_PASSWORD`, serve over HTTPS.
**Single HTML files to send by WhatsApp/email:** `node tools/build-single-html.js dist` writes `la-bhutanz-website-preview.html` and `la-bhutanz-admin-demo.html` (images embedded; keep them in one folder so their links work).
**Static client preview (no server):** `node tools/build-static-preview.js docs` builds the website preview plus an interactive admin demo as plain files (already built in `docs/`). Upload the folder to Netlify Drop, Cloudflare Pages or GitHub Pages (Settings → Pages → branch → `/docs`) and share that address. Enquiries aren't saved and admin edits stay in the visitor's browser; the real admin needs the Node server.

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

## Content from the original bhutanz.com
Everything below was taken from the live site and is editable in the admin panel:
- **Logo, favicon, share image, package posters and tour banners** (downloaded from the old site and optimised; `public/img`). The brand colours (red `#8a2124`, gold `#e5bd4a`) come from the logo.
- **All 9 tour itineraries** (highlights, day-by-day text, "ideal for", per-tour FAQs) and the **2 fixed departures** (inclusions, exclusions, itinerary).
- **46 FAQs, Visa & Entry Permit guide, Festivals, About Bhutan, Do's & Don'ts, About us**, home-page copy, experiences, "why choose us", contact details, WhatsApp number, office hours, and all social links (Instagram, Facebook, YouTube, Tripadvisor, Trustpilot, LinkedIn, Pinterest, blog).
- The old home page also advertised a **"Discover Bhutan 10N/11D"** tour that had no page. It is added as a hidden draft package with its poster: add its itinerary and price, then tick "Visible on website".
- Left out on purpose: the old fixed-departure pages' 2024 departure dates and the "Covid vaccination certificate" entry requirement (both out of date).

## Still needs your input (add as you get the details)
- **Prices** — start empty, so the site shows "Price on request". Enter ₹ per person in Admin → Packages & prices; each price appears as soon as you set it.
- **Departures** — none scheduled yet; the site invites visitors to ask for private dates. Add dates, seats and flight details in Admin → Departures & flights.
- Generic inclusions/exclusions for the land packages, the Terms & Privacy pages and the booking-advance wording are starter text — review them.
- Add the **Discover Bhutan** itinerary and price, then make it visible.
- Optional: payment details (UPI/bank), testimonials, your website address (SEO), a real admin password.
