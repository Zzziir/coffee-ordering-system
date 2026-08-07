# Multi-branch Craffé — context and state

Working notes for the change that turned Craffé from a single-store ordering
prototype into a multi-branch system. Written 2026-08-07; updated the same day
when the remaining-work list was finished.

---

## Read this first (handoff)

**If you are a fresh Claude instance picking this up, this file is the briefing.
You should not need to ask Lance to re-explain anything in it.**

Where things stand: **all seven items of the original remaining-work list are
done and verified** (2026-08-07). Staff sign in through Supabase Auth, orders
live in Postgres, live updates run on Supabase Realtime with SSE deleted,
customers pick a branch, checkout renders from per-branch config, branch
touchpoints are co-branded, and the hardcoded East Rembo strings are gone.

What is left is not code: it is the answers in
[What we need from Lance](#what-we-need-from-lance), and the follow-ups in
[Remaining work](#remaining-work).

Rules for continuing:

1. **The six decisions below are settled.** Lance chose them deliberately, one at
   a time, with the alternatives laid out. Do not re-open them or re-offer the
   options he already declined. If something makes a decision genuinely
   unworkable, say so plainly and explain why — don't quietly do it differently.
2. **Read `node_modules/next/dist/docs/` before writing Next.js code.** This is
   Next 16 and the APIs differ from training data. `AGENTS.md` says so for a
   reason. See [Environment notes](#environment-notes) for the traps already hit.
3. **Don't ask Lance for things this file already answers.** The open questions
   are consolidated in [What we need from Lance](#what-we-need-from-lance) —
   that list is the complete set, and none of it blocks the code that exists.
4. **Verify against the running app, not just the typechecker.** Every claim in
   the "verified" sections came from actually exercising the endpoint. Several
   real bugs (a prototype-chain hole in a guard, an RLS recursion, a privacy
   leak in the stream, a modal that trapped anyone who declined a branch switch)
   only showed up that way. See [Verifying](#running-and-verifying) for the
   browser-driven checks that caught them.

## Why

Craffé is not one shop. There are two:

| Branch | Where | Notes |
| --- | --- | --- |
| **Craffé East Rembo** | 15th Ave JP Rizal Ext., Makati | The original. Takeout window *and* dine-in. |
| **Craffé by MYCC** | Marilao, Bulacan | Partner/franchise store. Aircon café, pet friendly, WiFi. Own signage and logo. |

The app assumed exactly one of these. `branchId` existed nowhere, orders were a
single global pool, pickup codes came from one counter, and the address was
copy-pasted into six files including the chatbot's system prompt.

Three things broke the moment a second store went live: MYCC's barista would
watch East Rembo's queue, both branches would call "A14" the same afternoon, and
the chatbot would tell a Marilao customer it was in Makati.

## Decisions

Six choices, made deliberately. Treat them as settled.

| Area | Decision |
| --- | --- |
| **Menu** | One shared catalog at identical prices. A branch that doesn't carry an item marks it via `unavailableAt` on the item. No per-branch pricing, no per-branch catalogs. |
| **Rewards** | One brand-wide stamp card — earn anywhere, redeem anywhere. Cross-branch redemption cost is settled between owners offline. |
| **Branch entry** | QR carries `?b=<branch>`; a picker gate catches cold visits; the choice persists in `localStorage` beside the cart with a header chip to switch. Customer routes are *not* restructured into path segments — only `/staff/[branch]` and `/qr/[branch]` are. |
| **Service model** | Per-branch `channels[]` + `pickupNoun`. Checkout maps over `branch.channels`; the staff queue switches on `order.channel`. A `dinein` channel with a table number was added. |
| **Branding** | Co-brand at branch touchpoints only. Marketing pages stay unified Craffé; the branch lockup appears on the QR card, order-status screen, receipt, and staff queue. Single palette — no per-branch theming. |
| **Staff + data** | Real Supabase Auth staff accounts with RLS branch scoping, plus the full migration: orders to Postgres, Realtime replacing SSE. |

The last one is the heavy one. It turns a zero-dependency prototype into a real
deployment, and it rebuilds the live status update — the moment that sells the
demo. Verify that path first, not last.

## Architecture

### `src/lib/branches.ts` — the registry

Single source of truth for everything that differs between stores: address,
hours, channels, collection noun, payment methods, code prefix, lockup, logo.
Pages read from here instead of hardcoding a location, so a third Craffé is a
new record and nothing else.

Menu is deliberately *not* here — all branches share one catalog.

Helpers, all Manila-timezone aware so "Opens 1pm" is right regardless of where
the server runs:

- `isBranchId(v)` — guards untrusted input. Uses `Object.hasOwn`, **not** `in`
  (`"toString" in BRANCHES` is `true` via the prototype chain).
- `isOpen(branch)` / `openStatusLabel(branch)` — "Open until 11pm", "Opens 1pm",
  "Opens tomorrow 1pm".
- `hoursSummary(branch)` — collapses the week into runs: `["Mon–Thu · 7:30am – 11pm", "Fri–Sun · 7:30am – 12am"]`.

### Pickup codes

Per-branch counters with a branch letter prefix, so two stores never call the
same code: `R14` East Rembo, `M14` MYCC. In the demo store the
counter is in memory; in Postgres it's `branch_code_seq` plus the
`next_order_number(branch)` function, which increments and returns in one atomic
statement so concurrent orders can't collide.

### Live updates

`src/components/use-order-stream.ts` keeps one exported hook with two
transports, because the two audiences are not alike:

- **Staff** — `postgres_changes` on `orders` filtered by `branch_id`. RLS scopes
  the feed, so the database does the filtering.
- **Customers** — a Realtime **broadcast topic per order**, `order:<uuid>`,
  written by the `orders_broadcast_change` trigger. See the RLS note below for
  why they cannot use `postgres_changes`.

Neither payload carries customer data. Realtime only says "this order moved";
the order itself is then read back through `GET /api/orders/[id]`, which is what
decides what the viewer may see.

This replaced an SSE route (`/api/stream`, now deleted) and fixed a privacy leak
along the way: the stream originally sent every order to every subscriber, so
each customer's status page received the whole shop's queue — names and phone
numbers included — and filtered client-side.

### Staff auth

`src/proxy.ts` (Next 16's renamed middleware) refreshes the Supabase session and
bounces signed-out visitors off `/staff/*`. That check is **optimistic only** —
it asks "is anyone signed in", never "may they open this branch". The real
authorisation is `canAccessBranch()` in `src/lib/staff.ts`, called from each
page and route handler, because a matcher change or a moved Server Function can
silently drop proxy coverage.

Authenticating is not the same as being staff: an auth user with no `staff` row
is signed straight back out. Every gated API answers 401 when signed out and 403
at another branch — the page gate would protect nothing if the endpoint behind
it were open.

### Database

Three migrations, applied in order: `0001_multi_branch.sql` (schema, RLS,
counters), `0002_order_writes.sql` (atomic write functions), `0003_realtime.sql`
(publication + broadcast trigger). Split of responsibility:

- `src/lib/branches.ts` owns branch *presentation* config. Changes with a deploy.
- The database owns branch *identity* so orders and staff can FK to it, plus the
  atomic code counter.

Adding a branch = a row in `branches` + a record in `branches.ts`.

Money is stored as whole pesos in `integer` columns. The menu has no centavo
prices, so integers sidestep float rounding entirely.

Two RLS notes worth remembering:

1. **`SECURITY DEFINER` is load-bearing.** A policy on `staff` that reads `staff`
   recurses and Postgres aborts with *"infinite recursion detected in policy for
   relation staff"*. `is_staff_owner()` and `staff_may_access()` run as the
   definer to break the cycle.
2. **There is deliberately no anon select policy on `orders`.** A customer is
   anonymous and holds only their own order id; RLS cannot express "the one row
   you asked for". A `using (true)` policy would let anyone with the anon key
   dump every order in the shop. So customers never read the table directly —
   reads and writes go through server routes on the service role, and live
   status uses a Realtime **broadcast** topic per order rather than
   `postgres_changes`. Subscribing needs the exact order id, which is the same
   unguessable-link model the status page already relies on, and unlike a table
   policy it grants no way to enumerate.
3. **PostgREST exposes every public function to `anon` by default.** That is why
   `0002` explicitly revokes `create_order`, `advance_order` and
   `next_order_number` from `anon` and `authenticated`. Adding a function here
   without a matching `revoke` hands it to anyone holding the publishable key.

## State

### Done and verified

- `branches.ts` with both branches and the hours helpers.
- `0001_multi_branch.sql` — **applied to project `rdfdoyqueynwddswgbwk`.** Six
  tables with RLS on, both branches seeded, counters at 13, seven policies,
  three `SECURITY DEFINER` functions. Verified against the live database:
  - anon reads `orders` and `staff` as `[]`, reads `branches` fine, and is
    refused inserts (401);
  - a signed-in MYCC barista reads their own staff row without recursion, sees
    only MYCC orders, can advance a MYCC order, and a cross-branch `UPDATE`
    affects **zero rows**;
  - `next_order_number` is atomic — 50 concurrent calls produced 50 distinct
    values — counts independently per branch, and raises on an unknown branch;
  - the `table_number_only_for_dinein` and `staff_branch_required_unless_owner`
    checks both reject, and the `updated_at` trigger fires.

  Test data was removed afterwards; orders and staff are empty and counters are
  back to 13.

  One behaviour worth knowing: a cross-branch write is silently filtered by RLS
  rather than rejected, so PostgREST answers `204` while changing nothing. Don't
  read a 2xx as proof a write landed — ask for `Prefer: return=representation`
  and check the returned rows. (Our staff writes go through server routes on the
  service role, which enforce the branch in app code, so this mainly matters if
  anything ever talks to PostgREST directly.)
- `branchId` threaded through `types.ts`, the store, `/api/orders` and
  `/staff/[branch]`, with a branch index at `/staff`.
- `OrderChannel` gained `dinein`; `PaymentMethod` gained `maya`; `Order` gained
  `branchId` and `tableNumber`.
- Per-branch channel and payment validation enforced **server-side** in the
  orders route — the client renders from the same config but never decides.
- `0002_order_writes.sql` — `create_order` and `advance_order`, so an order
  lands with its lines and first audit event in one transaction, and a status
  change moves the row and its trail together. Both functions plus
  `next_order_number` are revoked from `anon` and `authenticated`: PostgREST
  exposes public functions by default, and with the anon key alone anyone could
  otherwise run a branch's pickup codes forward until they wrapped.
- `0003_realtime.sql` — `orders` added to the `supabase_realtime` publication,
  and an `orders_broadcast_change` trigger publishing `{id, status}` to
  `order:<uuid>`.
- **Supabase Auth for staff** — `src/lib/supabase/{config,server,browser,admin}.ts`,
  `src/lib/staff.ts`, `src/proxy.ts`, `/staff/sign-in` with Server Action sign
  in/out. `@supabase/ssr` was added as a dependency; hand-rolling cookie session
  handling is exactly the thing that goes subtly wrong.
- **The store is Postgres.** `src/lib/store.ts` keeps its exported names and
  arguments; the return types are now promises, which is unavoidable — you
  cannot query Postgres synchronously. Callers were updated to await.
- **Realtime replaced SSE**, and `src/app/api/stream/route.ts` is deleted.
- **Branch selection** — branch state in the cart provider, persisted beside the
  cart, seeded from `?b=`, with a gate on `/menu` and a header chip that
  confirms before moving a full bag.
- **Per-branch checkout, co-branding, and the location strings** — see the
  original items 5-7, all done.

Verified against a running server, in a real browser, with 113 checks across
five suites: per-branch codes don't collide, queues are branch-scoped, MYCC
rejects card (no terminal), dine-in without a table is rejected, a MYCC barista is refused at East Rembo and cannot advance an East
Rembo order, sessions die on sign-out, orders survive a full server restart, a
barista tapping "Mark ready" updates and chimes the customer's phone with no
reload, an East Rembo order never reaches the MYCC board, a MYCC QR puts the
order on MYCC's queue, and the production build is clean.

### Known gaps

- **`unavailableAt` doesn't exist yet.** `branches.ts` documents it as the way a
  branch marks an item it doesn't carry, but `MenuItem` in `src/lib/menu.ts` has
  no such field. Nothing needs it until MYCC's actual menu turns up (open
  question 4), so it stays unbuilt — but the comment is currently writing a
  cheque the code hasn't cashed.
- **Opening hours are shown, not enforced.** Checkout displays a closed banner
  from `isOpen()`, and still lets the order through. That is deliberate: a
  branch's own "order ahead" channel means a closed shop can still take work,
  and blocking would break a late-night pitch demo. If Lance wants closed
  branches to refuse orders, that belongs in the orders route, not the UI.
- **Node 20 is below what `@supabase/supabase-js` supports.** It warns on every
  invocation and has no native `WebSocket`, so Realtime cannot run under plain
  Node here — the browser is fine, which is where it actually runs. Deploy on
  Node 22+.
- **`GEMINI_API_KEY` is blank in `.env.local`**, so the chatbot answers with its
  "not configured" error. The multi-branch system prompt was verified by
  compiling `branchesForPrompt()` directly instead.

### Test staff accounts

Created 2026-08-07 so the auth work could be exercised. Obvious `.test` domain,
safe to delete once real accounts exist (open question 7).

| Email | Password | Role |
| --- | --- | --- |
| `owner@craffe.test` | _kept out of the repo_ | owner — every branch |
| `rembo@craffe.test` | _kept out of the repo_ | barista — East Rembo |
| `mycc@craffe.test` | _kept out of the repo_ | barista — MYCC |

Test *orders* were cleaned out afterwards; `orders`, `order_lines` and
`order_events` are empty and the counters are back to 13. The `staff` rows and
their auth users were kept.

## What we need from Lance

**None of this blocks starting work** — every item has a working assumption
already coded, marked `TODO(owner)` in `branches.ts`. But each assumption is
load-bearing: the orders API rejects a channel or payment method a branch isn't
configured for, so a wrong guess silently blocks real orders at that branch.

Ask for these when they're convenient, not as a gate. Answered ones should be
struck from this list and the matching `TODO(owner)` deleted.

| # | Needed | Current assumption | Bites us if wrong |
| --- | --- | --- | --- |
| 1 | **MYCC's actual menu** (the tinyurl on their FB page) | identical to East Rembo | Customers order items MYCC can't make |
| 2 | **Table counts** at East Rembo and MYCC | unknown — dine-in uses a free-text table number | Only cosmetic; a dropdown would be nicer than free text |
| 3 | **Does East Rembo have its own logo lockup?** | no, it uses the shared Craffé mark | Co-branding looks wrong at that branch |
| 4 | **Staff accounts** — who works where, and their emails | three `.test` accounts, see [Test staff accounts](#test-staff-accounts) | Real baristas still can't sign in |
| 5 | **Rotate the service_role key** | still the original | It was pasted into a chat transcript on 2026-08-07 |
| 6 | **Re-drop five branch photos** | lost — see `assets/reference/branches/README.md` | Nothing breaks; the facts they carried are already in `branches.ts`. Only needed for design work |

Source material Lance has already supplied lives in
`assets/reference/branches/` — reference only, never served. Look there before
asking him for a photo or a logo again. The MYCC lockup is the one file that
survived; the other five were lost when the conversation's image cache was
cleared, and that README names them so they can be re-dropped under stable
filenames.

Confirmed and *not* open (don't re-ask): **there are exactly two branches** —
East Rembo and MYCC; East Rembo has dine-in as well as the window; East Rembo
takes Maya; MYCC takes cash/gcash/maya but has **no card terminal**; menus are to
be treated as identical for now.

## Remaining work

The original seven-item list is **done**. What is left is smaller, and none of
it is load-bearing for a demo.

### Blocked on Lance

Everything in [What we need from Lance](#what-we-need-from-lance). The one that
actually changes code is **MYCC's menu**, which is what `unavailableAt` would be
built for.

### Worth doing next

1. **Real staff accounts**, replacing the `.test` ones — needs question 4.
2. **Rotate the service_role key** — question 5. Still not done.
3. **Resend emails.** The hook points are still marked `RESEND HOOK` in
   `src/lib/store.ts`. Now that orders are in Postgres with a real audit trail,
   this is a small job.
4. **Real payments.** PayMongo / Xendit replace the simulated beat in
   `src/app/checkout/page.tsx`. Note MYCC has no card terminal, so the
   integration has to respect `branch.payments` the way the UI now does.
5. **An order history screen for owners.** `listAllOrders(branchId)` already
   exists and is already branch-scoped; nothing renders it.

### Deliberately not done

- **Enforcing opening hours.** See [Known gaps](#known-gaps).
- **`unavailableAt`.** YAGNI until MYCC's menu arrives.
- **Per-branch theming.** Decision 5 says one palette; that still holds.
- **Table-number dropdowns.** Question 2 — free text is fine and cosmetic.

## Running and verifying

```bash
npm run dev        # http://localhost:3000
npx tsc --noEmit   # typecheck
npm run build      # production build
```

Only one `next dev` may run per project — Next 16 refuses a second and prints the
PID of the existing one. Reuse it, or `taskkill /PID <pid> /F` first.

Useful smoke checks (these are the ones that caught real bugs):

```bash
# the staff gates, signed out
curl -o /dev/null -w "%{http_code}" "localhost:3000/api/orders?branch=mycc"       # want 401
curl -o /dev/null -w "%{http_code}" "localhost:3000/staff/east-rembo"             # want 307

# per-branch config is enforced server-side, not by the client
curl -X POST localhost:3000/api/orders -H "Content-Type: application/json"   -d '{"branchId":"mycc","customerName":"A","channel":"onsite","paymentMethod":"card",
       "items":[{"itemId":"spanish-latte","name":"SL","basePrice":105,"qty":1,"groups":[]}]}'
# want 400 — MYCC has no card terminal

# the prototype-chain hole in the branch guard
curl -o /dev/null -w "%{http_code}" "localhost:3000/api/orders?branch=toString"   # want 400
```

Anything involving a session or a live update needs a real browser. Playwright
is already a devDependency (`npx playwright install chromium` once). Drive the
actual flows — sign in through the form, click the barista's button, assert the
customer's page changed — because that is the only thing that proves the
transport works end to end. Two traps worth knowing:

- Give a Realtime subscription a few seconds to join after the page settles.
  Placing an order 50ms after load races the websocket, and the miss looks
  exactly like a broken feed.
- Don't drain a response body you only want the status of, and scope a click to
  the card you mean — `has-text("Pay ")` matches the GCash option's subtitle,
  and `.first()` on a queue picks the oldest order, not yours.

For the database, use the MCP server if its tools are loaded, otherwise the
Management API (see [Supabase access](#supabase-access)).

## Environment notes

- Next.js 16.3 with Turbopack. **`middleware` is deprecated — use `proxy.ts`
  exporting a `proxy` function.** Node runtime only; no edge. `params` is a
  `Promise` everywhere and must be awaited.
- Read `node_modules/next/dist/docs/` before writing Next code. The APIs differ
  from training data; `AGENTS.md` says so for a reason.
- Only one `next dev` may run per project — Next 16 refuses a second and exits.
  It falls back to port 3001 rather than failing loudly, which will quietly send
  your smoke checks at a stale server.
- Deleting a route handler leaves a stale `.next/types/validator.ts` referencing
  it, and `tsc --noEmit` fails on a file you didn't write. Restart `next dev`
  (or `rm -rf .next/types`) to regenerate.
- `@supabase/supabase-js` wants Node 22+. Node 20 works for everything the app
  does server-side but has no native `WebSocket`, so a Realtime client cannot be
  driven from plain Node — use the browser.

## Supabase access

Project ref `rdfdoyqueynwddswgbwk`. Credentials are in `.env.local`, which is
gitignored (`.env*`).

A `craffe-supabase-mcp` server is configured for this project in
`~/.claude.json` with a `SUPABASE_ACCESS_TOKEN`. MCP servers connect at session
start, so if it was added mid-session its tools won't be available until Claude
Code restarts. Failing that, the same access token works against the Management
API for DDL:

```
POST https://api.supabase.com/v1/projects/<ref>/database/query
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
{"query": "..."}
```

The service-role key only reaches PostgREST (CRUD on existing tables); it cannot
run DDL. The Supabase CLI needs either the database password or an access token,
neither of which is in `.env.local`.

**The service-role key was pasted into a chat transcript on 2026-08-07 and should
be rotated** (Dashboard → Settings → API → service_role → Reset).
