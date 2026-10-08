# Skyland Tours & Travels

Pan-India travel company website with a built-in enquiry CRM and admin panel. Node + Express, JSON-file database, no external services.

```bash
npm install
npm start          # http://localhost:3000    admin: /admin
```
First run seeds 18 destinations, 18 packages with day-wise itineraries, FAQs, travel guides and information pages. **Default admin password: `skyland@2026`** (the dashboard warns until it is changed). Set `ADMIN_PASSWORD` to choose your own.

| Env var | Purpose |
|---|---|
| `PORT` | HTTP port (default 3000) |
| `DATA_DIR` | Folder for `db.json`, `uploads/`, `backups/` (use a persistent disk in production) |
| `ADMIN_PASSWORD` | Initial admin password |
| `NOTIFY_WEBHOOK_URL` | Optional: POST each new enquiry to Zapier / Make / Slack |

## What's included
**Website:** home, destinations (18) and destination pages, tour packages (filter by destination, style, duration), package pages with itinerary, inclusions, group departures and a price estimator, group departures, travel journal, FAQ, permits & documents, how to book & pay, contact, photo credits, terms and privacy. WhatsApp button, header button and mobile call/WhatsApp bar appear once a number is saved. SEO titles, canonical URLs, JSON-LD, sitemap and robots.

**Admin (`/admin`):** dashboard, enquiry CRM (status pipeline, notes, WhatsApp reply, CSV export), departures & flights (inline editing), packages & prices (inline price edit, bulk % change, full editor with destination picker, itinerary and photos), destinations editor, journal, FAQs, testimonials, pages, settings, password and backup/restore.

## Content status
- **Photos:** 38 real photographs from [Unsplash](https://unsplash.com) (free licence), credited on `/credits`. Replace any of them from the admin.
- **Logo:** a simple Skyland mark (`public/img/logo.svg`); upload your own in Admin → Settings.
- **Prices:** all start at 0 and show "Price on request" until you enter ₹ per person.
- **Contact details:** phone, WhatsApp, email, address and hours start empty. Enter them in Admin → Settings; the WhatsApp button appears automatically.
- **Itineraries, inclusions, FAQs, guides:** written from general destination knowledge. Review them and adjust to what Skyland actually offers.
- **Terms and privacy** are starter text; no reviews or testimonials are included.

## Deploy
`render.yaml` (Render Blueprint, with a persistent disk), `Dockerfile`, or any Node host. Add your domain, then set the address in Admin → Settings → Website address.

## Client previews without a server
`node tools/build-single-html.js dist` → two stand-alone HTML files (website preview + interactive admin demo). `node tools/build-static-preview.js docs` → the same as a folder for Netlify / GitHub Pages.
