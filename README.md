# La Bhutanz Tours — new website

Static site (no build step). Open `index.html`, or serve the folder (`python3 -m http.server`).

| File | Purpose |
|---|---|
| `index.html` | Home: packages, departures & flights, FAQ, contact, WhatsApp |
| `tour.html?id=…` | Package detail + cost estimator |
| `admin.html` | Owner admin panel |
| `data/site-data.js` | All content: packages, departures, settings, FAQs |
| `ANALYSIS.md` | Analysis of the original bhutanz.com |

## Admin panel
Open `/admin.html`. Default password: `bhutanz@2026` (change it under Settings).
Edit flights/departures, package prices, seats, status and contact details. **Save changes** previews in your browser; to publish to all visitors use **Backup → Download site-data.js** and replace `data/site-data.js` on your hosting.

### Security note
This version has no server, so the admin password is only a front-end gate and edits are browser-local until published. For real multi-user security and instant publishing, add a small backend (login + database) — see questions in the project chat.

## Placeholder data
Package prices (USD) and the 7 sample departures/flights are **samples**; replace them in the admin panel. Flight numbers and times are intentionally blank until confirmed.
