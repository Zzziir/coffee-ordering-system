# Branch reference images

Source material Lance supplied about the real Craffé branches — Facebook pages,
storefront and interior photos, logo art. **Reference only. Nothing here is
served by the app.** Web assets live in `public/brand/`.

The point of this folder is that a new Claude session can look at the original
material instead of asking Lance to send it again.

## What's here

| File | What it is |
| --- | --- |
| `mycc-logo.png` | The Craffé by MYCC circular lockup — rainy-window illustration, "Craffé **by** MYCC", EST. 2024, "EXPERIENCE PREMIUM QUALITY / COFFEE.FRAPPE.MILKTEA.SODA". Also copied to `public/brand/mycc-lockup.png`, which is the one the app renders. |

## Missing — please re-drop if you still have them

These were sent on 2026-08-07 but Claude Code's per-conversation image cache was
cleared before they could be written to disk. Drop them in this folder with these
names:

| Wanted filename | What it was |
| --- | --- |
| `mycc-facebook.png` | The Craffé MYCC FB page header — 1.1K followers, menu tinyurl, hours, "Waze/Google Map: Craffe by MYCC", payment methods, "Fully airconditioned", "PET FRIENDLY!", Marilao, IG `craffe.mycc`, 0976 460 8430 |
| `mycc-storefront.jpg` | Exterior — the illuminated CRAFFÉ MYCC sign, round hanging logo, WIFI ZONE / PETS WELCOME / NO VAPING / CCTV decals |
| `mycc-interior.jpg` | Inside — counter with the "Order & Pay here" sign, GCash decal, bar stools and tables, "See you always at Craffé!" wall text, "CLAYGO. SIP IT. FLIP IT. LEAVE NO TRACE." |
| `mycc-wall-art.jpg` | The print wall — "Craffé by MYCC" poster, convex mirror, best-seller and Coffee Break prints |
| `craffe-facebook.png` | The main Craffé Coffee FB page header — 3.1K followers, East Rembo address, Mon–Thurs 7:30AM–11PM, Fri–Sun 7:30AM–12AM |

**You do not need to re-send these just to preserve the information.** Everything
factual they contained is already recorded in `src/lib/branches.ts` (addresses,
hours, channels, payment methods, phone, IG handle) and in
`.claude/docs/multi-branch.md`. Re-drop them only if you want the source images
themselves on hand — for design work, or to double-check a detail.

One caveat if you do re-drop `craffe-facebook.png`: that page listed a
"Craffé 1004, Brgy. Rizal (1PM–9PM)" line. You confirmed 1004 is not a separate
branch and it was removed from the code, the database and the docs. Don't let the
screenshot talk a future session into re-adding it — see the note in
`.claude/docs/multi-branch.md`.

## Adding more later

Keep the naming pattern `<branch>-<subject>.<ext>` so it stays scannable, and add
a row to the table above. Photos that should actually ship on the site belong in
`public/brand/`, not here.
