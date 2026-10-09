# Dhandha — on-demand home services marketplace

An Urban Company–style platform for a business that owns its own manpower: customers book a
service, the nearest available professional is auto-assigned, and payment happens in-app
(Razorpay UPI/cards/netbanking) or in cash after the service.

```
backend/   Node 22 + Express + SQLite (node:sqlite) REST API, the customer/professional website (backend/public, served at /) and the admin dashboard (/admin.html)
app/       Expo (React Native) app for Android + iOS — customers AND professionals log in to the same app
```

## Run the backend
```bash
cd backend && npm install
cp .env.example .env      # optional; export vars or use `node --env-file=.env src/server.js`
npm start                 # http://localhost:4000  (website at /, admin dashboard at /admin.html, default admin 9999999999 / admin123)
npm test                  # end-to-end tests
```
Without Razorpay keys the API uses a **mock payment provider** (dev only; disabled when `NODE_ENV=production`).
Set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` and configure a `payment.captured` webhook to
`POST /payments/webhook` for real payments. Always set `JWT_SECRET` and `ADMIN_PASSWORD` in production.

## Website
The same features are available in the browser at `/` (no extra build step — plain HTML/JS in `backend/public`):
customers sign in with an SMS code, browse services, pick a time, choose auto-assign or a specific professional (rating, experience, call button), pay online (Razorpay checkout) or in cash, track bookings, chat, and rate. Professionals use the same site (**My jobs**) to go online, accept/decline requests, progress jobs, chat, edit their profile and see their balance. Web push notifications are not included; workers still get SMS.

## Run the app
```bash
cd app && npm install
EXPO_PUBLIC_API_URL=http://<your-LAN-ip>:4000 npx expo start
```
Mock payments work in Expo Go. Real Razorpay checkout needs a dev build (`npx expo prebuild`).

## How it works
1. Customer picks a service, time slot, address and payment method, then either lets the system auto-assign or **browses professionals (rating, experience, bio), calls them, and books one directly**. A direct request goes only to that professional.
2. The booking is offered to the 3 nearest approved, online workers in that category; first to accept wins.
   If all decline, the next nearest are offered; if nobody is left it shows as *unassigned* in the admin dashboard to assign manually.
3. Worker advances the job: on the way → in progress → completed. Online-paid jobs must be paid before completion; cash jobs are marked paid when the worker completes them.
4. A commission (`COMMISSION_PERCENT`, default 20%) is recorded per booking; worker earnings and cash commission owed are shown in the worker app.
5. Customers rate completed jobs. Admins approve workers, manage the catalog and watch bookings/revenue.

## Notifications, chat and timeouts
- **SMS**: workers get a text when a job request is offered to them. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` (and `DEFAULT_COUNTRY_CODE`); without them SMS is only logged to the console.
- **Chat**: per-booking in-app chat between the customer and their assigned (or directly requested) professional, plus a Call button. Closes when the booking is completed or cancelled. Uses 3-second polling.
- **Timeouts**: an offer unanswered for `OFFER_TTL_MIN` (default 10) minutes expires and the job moves to the next nearest worker, or becomes *unassigned* (always, for a directly requested professional).

## Login, push, payouts
- **OTP login**: customers and professionals sign in/up with a phone number + SMS code (admins keep password login). Without Twilio keys the code is returned to the app in dev mode only (never in production).
- **Push notifications** (Expo, no extra keys): workers on new requests; customers when assigned, on the way, started, completed, or nobody found; both sides on new chat messages. Needs a dev/production build, not Expo Go.
- **Settlements**: for each worker the dashboard shows *online share − cash commission − paid out + remitted*. Positive → you owe them: pay via UPI/bank, then click **Record payout**. Negative → they owe you commission on cash jobs: click **Record remittance** once received. Payouts are recorded manually; automatic bank transfers (RazorpayX) need business KYC and can be added later.

## Deploy
1. Push this repo to GitHub, then on [Render](https://render.com) choose **New → Blueprint** (uses `render.yaml`; Docker, 1 GB persistent disk for SQLite, run a single instance). Set `ADMIN_PHONE`, `ADMIN_PASSWORD`, Twilio and Razorpay vars. Add the Razorpay webhook `https://<your-api>/payments/webhook` (event `payment.captured`).
2. The website is then live at `https://<your-api>/` and the admin dashboard at `https://<your-api>/admin.html`. Point your own domain at it from the Render dashboard.
3. Apps: put your API URL in `app/eas.json`, then `cd app && npx eas build --profile preview --platform android` (and `ios`) and `eas submit` for the stores. Needs an Expo account; Apple ($99/yr) and Google Play ($25 once) developer accounts for store release.
4. Back up the disk (Render snapshots) — it holds all bookings and payments.

CI (`.github/workflows/ci.yml`) runs the backend tests on every push.

## Not built yet (suggested next steps)
Live map tracking, automatic worker bank payouts (RazorpayX),
coupons/wallet, refunds/disputes UI,  websocket chat (currently polling), SMS to customers, and moving SQLite → Postgres for multi-server deployment.
