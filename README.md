# Dhandha — on-demand home services marketplace

An Urban Company–style platform for a business that owns its own manpower: customers book a
service, the nearest available professional is auto-assigned, and payment happens in-app
(Razorpay UPI/cards/netbanking) or in cash after the service.

```
backend/   Node 22 + Express + SQLite (node:sqlite) REST API, and the web admin dashboard (backend/public)
app/       Expo (React Native) app for Android + iOS — customers AND professionals log in to the same app
```

## Run the backend
```bash
cd backend && npm install
cp .env.example .env      # optional; export vars or use `node --env-file=.env src/server.js`
npm start                 # http://localhost:4000  (admin dashboard at /, default admin 9999999999 / admin123)
npm test                  # end-to-end tests
```
Without Razorpay keys the API uses a **mock payment provider** (dev only; disabled when `NODE_ENV=production`).
Set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` and configure a `payment.captured` webhook to
`POST /payments/webhook` for real payments. Always set `JWT_SECRET` and `ADMIN_PASSWORD` in production.

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

## Not built yet (suggested next steps)
Push notifications and OTP login, live map tracking, worker payout (Razorpay Route/X),
coupons/wallet, websocket chat (currently polling), SMS to customers, and moving SQLite → Postgres for multi-server deployment.
