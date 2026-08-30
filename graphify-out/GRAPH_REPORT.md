# Graph Report - CraffeCoffee  (2026-08-30)

## Corpus Check
- Large corpus: 757 files · ~1,792,264 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 443 nodes · 1395 edges · 20 communities (19 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Customer Account & Order APIs
- Admin Menu & Staff Management
- Menu Item Editor & AI Chat
- Cart, Checkout & Order Logging
- Live Order Status & Staff Queue
- Core Database Schema
- Auth Forms & Server Actions
- Marketing Pages & Animations
- Branch Directory & Hours
- App Shell & Supabase Clients
- Menu Page & Site Navigation
- Admin Nav & UI Primitives
- QR & Branding Components
- Home Page & Hero
- Realtime Broadcast

## God Nodes (most connected - your core abstractions)
1. `clsx()` - 56 edges
2. `getMenu()` - 30 edges
3. `peso()` - 29 edges
4. `getBranch()` - 27 edges
5. `getStaffMember()` - 24 edges
6. `getCustomer()` - 22 edges
7. `supabaseAdmin()` - 22 edges
8. `branchAddress()` - 18 edges
9. `isBranchId()` - 17 edges
10. `branchFullName()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `ItemForm()` --indirect_call--> `saveItem()`  [INFERRED]
  src/app/admin/menu/item-form.tsx → src/app/admin/menu/actions.ts
- `NewItemPage()` --calls--> `getMenu()`  [EXTRACTED]
  src/app/admin/menu/new/page.tsx → src/lib/menu-store.ts
- `LogOrderPage()` --calls--> `getMenu()`  [EXTRACTED]
  src/app/admin/orders/new/page.tsx → src/lib/menu-store.ts
- `GET()` --calls--> `getOrder()`  [EXTRACTED]
  src/app/api/orders/[id]/route.ts → src/lib/store.ts
- `StepButton()` --calls--> `clsx()`  [EXTRACTED]
  src/app/checkout/page.tsx → src/lib/clsx.ts

## Import Cycles
- None detected.

## Communities (20 total, 1 thin omitted)

### Community 0 - "Customer Account & Order APIs"
Cohesion: 0.09
Nodes (46): dynamic, EditProfilePage(), AccountPage(), dateFmt, dynamic, CustomerSignInPage(), dynamic, CustomerSignUpPage() (+38 more)

### Community 1 - "Admin Menu & Staff Management"
Cohesion: 0.09
Nodes (43): AdminLayout(), dynamic, assertAdmin(), DIET_TAGS, revalidateMenu(), saveItem(), setBranchAvailability(), slugify() (+35 more)

### Community 2 - "Menu Item Editor & AI Chat"
Cohesion: 0.09
Nodes (32): ItemFormState, dynamic, EditItemPage(), ItemForm(), TAGS, dynamic, NewItemPage(), buildSystem() (+24 more)

### Community 3 - "Cart, Checkout & Order Logging"
Cohesion: 0.11
Nodes (31): OrderRow(), ItemPick, logOrder(), LogOrderState, lineSignature(), NewOrderForm(), dynamic, LogOrderPage() (+23 more)

### Community 4 - "Live Order Status & Staff Queue"
Cohesion: 0.08
Nodes (31): AdminOverviewPage(), dynamic, manilaDay, revenueOf(), stamp, dynamic, GET(), ACTIVE_STEPS (+23 more)

### Community 5 - "Core Database Schema"
Cohesion: 0.09
Nodes (26): branch_code_seq, branches, is_staff_owner(), order_events, order_lines, orders, orders_touch_updated_at, auth (+18 more)

### Community 6 - "Auth Forms & Server Actions"
Cohesion: 0.17
Nodes (14): AuthState, safeNext(), signIn(), signOut(), signUp(), updateProfile(), EditForm(), Field() (+6 more)

### Community 7 - "Marketing Pages & Animations"
Cohesion: 0.12
Nodes (14): metadata, PHOTOS, metadata, ChatLauncher(), ChatProduct(), Msg, ProductCard, SUGGESTIONS (+6 more)

### Community 8 - "Branch Directory & Hours"
Cohesion: 0.18
Nodes (19): BranchCell(), metadata, QrIndexPage(), BranchOptions(), branchAddress(), BRANCHES, branchesForPrompt(), branchFullName() (+11 more)

### Community 9 - "App Shell & Supabase Clients"
Cohesion: 0.17
Nodes (9): metadata, outfit, viewport, LoyaltyMigrator(), createBrowserSupabase(), SUPABASE_ANON_KEY, SUPABASE_URL, config (+1 more)

### Community 10 - "Menu Page & Site Navigation"
Cohesion: 0.18
Nodes (13): dynamic, MenuPage(), metadata, BranchChip(), BranchGate(), useCart(), SiteFooter(), isActive() (+5 more)

### Community 11 - "Admin Nav & UI Primitives"
Cohesion: 0.24
Nodes (10): AdminNav(), isActive(), TABS, Stepper(), dynamic, metadata, BentoCard(), BentoGrid() (+2 more)

### Community 12 - "QR & Branding Components"
Cohesion: 0.24
Nodes (5): QrCard(), BranchLockup(), CupMark(), Branch, BRANCH_LIST

### Community 13 - "Home Page & Hero"
Cohesion: 0.27
Nodes (8): dynamic, HEADLINE, HomePage(), rise(), CRAFFE_ACCENTS, DiaTextReveal(), revealLength(), signatureItems()

## Knowledge Gaps
- **75 isolated node(s):** `dynamic`, `dynamic`, `dateFmt`, `dynamic`, `dynamic` (+70 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `clsx()` connect `Admin Nav & UI Primitives` to `Customer Account & Order APIs`, `Admin Menu & Staff Management`, `Menu Item Editor & AI Chat`, `Cart, Checkout & Order Logging`, `Live Order Status & Staff Queue`, `Marketing Pages & Animations`, `Branch Directory & Hours`, `Menu Page & Site Navigation`, `QR & Branding Components`, `Home Page & Hero`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `getMenu()` connect `Customer Account & Order APIs` to `Admin Menu & Staff Management`, `Menu Item Editor & AI Chat`, `Cart, Checkout & Order Logging`, `Menu Page & Site Navigation`, `Admin Nav & UI Primitives`, `Home Page & Hero`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `getCustomer()` connect `Customer Account & Order APIs` to `Admin Menu & Staff Management`, `Auth Forms & Server Actions`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `dynamic`, `dynamic`, `dateFmt` to the rest of the system?**
  _75 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Customer Account & Order APIs` be split into smaller, more focused modules?**
  _Cohesion score 0.088841882601798 - nodes in this community are weakly interconnected._
- **Should `Admin Menu & Staff Management` be split into smaller, more focused modules?**
  _Cohesion score 0.08633879781420765 - nodes in this community are weakly interconnected._
- **Should `Menu Item Editor & AI Chat` be split into smaller, more focused modules?**
  _Cohesion score 0.08888888888888889 - nodes in this community are weakly interconnected._