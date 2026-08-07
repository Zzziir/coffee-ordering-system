# Craffé — Order Ahead

A mobile-first coffee ordering prototype for **Craffé Coffee** (East Rembo, Makati).
Customers scan a QR at the window or open the link, build a drink, pay ahead, and
pick it up when their number is called. Baristas watch orders come in live.

Built for a live pitch to the owner, on production-grade foundations so it can go
live after approval without a rewrite.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

The chatbot needs a Gemini key in `.env.local` (see `.env.example`):

```
GEMINI_API_KEY=your_key_here
```

Everything else runs with zero external services.

## The pitch walkthrough

1. **`/`** — home. Tap **Order now**.
2. **`/menu`** — browse by category, tap a drink, pick size / milk / extras
   (watch the price update), add to bag.
3. **`/cart`** → **`/checkout`** — choose pickup style, enter a name, pick GCash /
   card / cash, and pay (simulated — no real charge). Land on a live pickup screen.
4. Open **`/staff`** on another screen (or tablet). The new order is already there.
   Tap **Start preparing → Mark ready**.
5. Back on the customer's screen, the status updates **live** and it chimes when ready.
6. **`/qr`** — the printable "Scan to order" card for the window.
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
- **Staff queue** — real-time order board (Received → Preparing → Ready).
- **Ask Craffé** — warm Taglish barista chatbot grounded in the menu (Gemini).
- **Loyalty** — digital "buy 9, get 1 free" stamp card.
- **QR** — printable window card.

## Architecture

- **Next.js 16** (App Router) · **React 19** · **Tailwind v4** · **Motion** · **Phosphor** icons.
- **Live updates** run over Server-Sent Events (`/api/stream`) backed by an in-memory
  order store (`src/lib/store.ts`) — no database needed for the demo.
- Design tokens, fonts, and motion curves live in `src/app/globals.css`.

### Going live (future — seams already in place)

- **Supabase** — swap the internals of `src/lib/store.ts` for Postgres tables and
  Supabase Realtime. The exported functions and the SSE seam stay identical.
- **Vercel** — deploy target.
- **Resend** — order-confirmation and order-ready emails. Hook points are marked
  `RESEND HOOK` in `src/lib/store.ts`.
- **Real payments** — PayMongo / Xendit (GCash, Maya, cards) replace the simulated
  step in `src/app/checkout/page.tsx`.

## Notes

- Chatbot model: `gemini-flash-latest`.
- Brand photography in `public/brand/` is Craffé's own, provided by the owner.
- Theme is locked to Craffé's warm, paper-light identity.
