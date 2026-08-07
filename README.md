# Craffé — Order Ahead

A mobile-first coffee ordering prototype for **Craffé Coffee**, across both
branches: **East Rembo** (Makati) and **Craffé by MYCC** (Marilao, Bulacan).
Customers scan the QR on their table, build a drink, pay ahead, and collect it
when their number is called. Baristas watch their own branch's orders come in
live.

Built for a live pitch to the owner, on production-grade foundations so it can go
live after approval without a rewrite.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Copy `.env.example` to `.env.local` and fill it in — the app needs a Gemini key
for the chatbot and a Supabase project for orders and staff accounts:

```
GEMINI_API_KEY=your_key_here
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Apply `supabase/migrations/*.sql` in order to a fresh project, then create a row
in `staff` for each barista keyed to their Supabase Auth user.

## The pitch walkthrough

1. **`/`** — home. Tap **Order now**.
2. **`/menu`** — pick a branch if you didn't scan a QR, then browse by category, tap a drink, pick size / milk / extras
   (watch the price update), add to bag.
3. **`/cart`** → **`/checkout`** — choose how you're taking it, enter a name, pick
   a payment method, and pay (simulated — no real charge). Only the options that
   branch actually offers are shown. Land on a live pickup screen.
4. Open **`/staff`** on another screen (or tablet) and sign in. A barista lands on
   their own branch's board; owners pick one. Tap **Start preparing → Mark ready**.
5. Back on the customer's screen, the status updates **live** and it chimes when ready.
6. **`/qr`** — printable "Scan to order" table tents, one per branch. Each code
   carries `?b=<branch>`, so a scan at MYCC puts the order on MYCC's queue.
7. Tap **Ask Craffé** (bottom-right) — the Gemini chatbot that knows the whole menu.

## What's included

- **Brand website** — a full-width landing page (hero, favorites, story, gallery,
  rewards, location) plus **Our Story**, **Gallery**, and **Contact** pages, all
  under a sticky top nav. Desktop-first and responsive down to mobile.
- **Full menu** — every item from the boards (espresso, non-coffee, Thai tea,
  refreshers, frappés, Dubai cookies, snacks, pastries, bottled) with real prices
  and add-on rules (+₱20 upsize, +₱40 oat milk, extra shot, sea salt cream, etc.).
- **Customer flow** — menu → customize → cart → guest checkout → simulated payment
  → live order status.
- **Multi-branch** — one shared menu at one set of prices; per-branch hours,
  service model, payment methods and pickup codes (`R14` East Rembo, `M14` MYCC)
  all read from `src/lib/branches.ts`.
- **Staff queue** — real-time order board (Received → Preparing → Ready), scoped
  to one branch, behind Supabase Auth with row-level-security branch checks.
- **Ask Craffé** — warm Taglish barista chatbot grounded in the menu (Gemini).
- **Loyalty** — digital "buy 9, get 1 free" stamp card.
- **QR** — printable table tent per branch.

## Architecture

- **Next.js 16** (App Router) · **React 19** · **Tailwind v4** · **Motion** · **Phosphor** icons.
- **Supabase Postgres** holds orders, staff and the atomic per-branch pickup-code
  counter. `src/lib/store.ts` is the only module that talks to it.
- **Live updates** run over Supabase Realtime. Staff use `postgres_changes`
  filtered by branch (RLS scopes it); customers use a broadcast topic named after
  their order id, because there is deliberately no anon read policy on `orders`.
- **Auth** — Supabase Auth for staff, with `src/proxy.ts` refreshing the session
  and the real branch authorisation in the pages and route handlers.
- Design tokens, fonts, and motion curves live in `src/app/globals.css`.

### Going live (future — seams already in place)

- **Vercel** — deploy target.
- **Resend** — order-confirmation and order-ready emails. Hook points are marked
  `RESEND HOOK` in `src/lib/store.ts`.
- **Real payments** — PayMongo / Xendit (GCash, Maya, cards) replace the simulated
  step in `src/app/checkout/page.tsx`.

## Notes

- Chatbot model: `gemini-flash-latest`.
- Brand photography in `public/brand/` is Craffé's own, provided by the owner.
- Theme is locked to Craffé's warm, paper-light identity.
