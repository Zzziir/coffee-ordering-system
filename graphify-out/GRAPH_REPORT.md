# Graph Report - CraffeCoffee  (2026-08-30)

## Corpus Check
- Large corpus: 765 files · ~1,795,666 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 486 nodes · 1486 edges · 23 communities (21 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Order Logging & Admin Overview
- Menu Item Editor & AI Chat
- Admin Shell & Staff Auth
- Customer Account & Order APIs
- Franchise & Event Inquiries
- Core Database Schema
- Auth Forms & Server Actions
- Live Order Status & Staff Queue
- Cart, Menu Page & Navigation
- Branch Directory & Hours
- Contact Page & UI Primitives
- App Shell & Supabase Clients
- Home & Story Pages
- Checkout & Payment
- Gallery
- Branding & QR Components
- Realtime Broadcast
- Partner Inquiries Schema

## God Nodes (most connected - your core abstractions)
1. `clsx()` - 60 edges
2. `getMenu` - 29 edges
3. `peso()` - 29 edges
4. `getBranch()` - 27 edges
5. `getStaffMember()` - 26 edges
6. `supabaseAdmin()` - 26 edges
7. `getCustomer()` - 22 edges
8. `branchAddress()` - 18 edges
9. `isBranchId()` - 17 edges
10. `branchFullName()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `InquiryCard()` --calls--> `clsx()`  [EXTRACTED]
  src/app/admin/inquiries/page.tsx → src/lib/clsx.ts
- `ItemForm()` --indirect_call--> `saveItem()`  [INFERRED]
  src/app/admin/menu/item-form.tsx → src/app/admin/menu/actions.ts
- `NewItemPage()` --calls--> `getMenu`  [EXTRACTED]
  src/app/admin/menu/new/page.tsx → src/lib/menu-store.ts
- `StepButton()` --calls--> `clsx()`  [EXTRACTED]
  src/app/checkout/page.tsx → src/lib/clsx.ts
- `ChannelCard()` --calls--> `clsx()`  [EXTRACTED]
  src/app/checkout/page.tsx → src/lib/clsx.ts

## Import Cycles
- None detected.

## Communities (23 total, 2 thin omitted)

### Community 0 - "Order Logging & Admin Overview"
Cohesion: 0.08
Nodes (46): OrderRow(), ItemPick, logOrder(), LogOrderState, lineSignature(), NewOrderForm(), AdminOverviewPage(), dynamic (+38 more)

### Community 1 - "Menu Item Editor & AI Chat"
Cohesion: 0.07
Nodes (42): ItemFormState, dynamic, EditItemPage(), ItemForm(), TAGS, BranchOption, ItemRow(), MenuManager() (+34 more)

### Community 2 - "Admin Shell & Staff Auth"
Cohesion: 0.12
Nodes (34): AdminLayout(), dynamic, assertAdmin(), DIET_TAGS, revalidateMenu(), saveItem(), setBranchAvailability(), slugify() (+26 more)

### Community 3 - "Customer Account & Order APIs"
Cohesion: 0.11
Nodes (30): dynamic, EditProfilePage(), AccountPage(), dateFmt, dynamic, CustomerSignInPage(), dynamic, CustomerSignUpPage() (+22 more)

### Community 4 - "Franchise & Event Inquiries"
Cohesion: 0.09
Nodes (23): updateInquiryStatus(), AdminInquiriesPage(), dynamic, eventDateFmt, InquiryCard(), stamp, LABEL, StatusControl() (+15 more)

### Community 5 - "Core Database Schema"
Cohesion: 0.09
Nodes (26): branch_code_seq, branches, is_staff_owner(), order_events, order_lines, orders, orders_touch_updated_at, auth (+18 more)

### Community 6 - "Auth Forms & Server Actions"
Cohesion: 0.14
Nodes (15): AuthState, safeNext(), signIn(), signOut(), signUp(), updateProfile(), EditForm(), Field() (+7 more)

### Community 7 - "Live Order Status & Staff Queue"
Cohesion: 0.14
Nodes (18): ACTIVE_STEPS, ActiveOrderRow(), ActiveOrders(), StatusDot(), celebrate(), channelLine(), chime(), OrderStatus() (+10 more)

### Community 8 - "Cart, Menu Page & Navigation"
Cohesion: 0.16
Nodes (16): CartPage(), dynamic, MenuPage(), metadata, BranchChip(), BranchGate(), CartContext, CartContextValue (+8 more)

### Community 9 - "Branch Directory & Hours"
Cohesion: 0.17
Nodes (20): BranchCell(), metadata, QrIndexPage(), BranchOptions(), BRANCH_LIST, branchAddress(), BRANCHES, branchesForPrompt() (+12 more)

### Community 10 - "Contact Page & UI Primitives"
Cohesion: 0.16
Nodes (13): AdminNav(), isActive(), TABS, Stepper(), ContactPage(), dynamic, metadata, BentoCard() (+5 more)

### Community 11 - "App Shell & Supabase Clients"
Cohesion: 0.14
Nodes (11): metadata, outfit, viewport, LoyaltyMigrator(), AccountNav, SIGNED_OUT, createBrowserSupabase(), SUPABASE_ANON_KEY (+3 more)

### Community 12 - "Home & Story Pages"
Cohesion: 0.18
Nodes (11): dynamic, HEADLINE, HomePage(), rise(), metadata, ChatLauncher(), CRAFFE_ACCENTS, DiaTextReveal() (+3 more)

### Community 13 - "Checkout & Payment"
Cohesion: 0.23
Nodes (10): autoAllocate(), ChannelCard(), channelCopy(), CheckoutPage(), paymentCopy(), PayOption(), RewardPicker(), StepButton() (+2 more)

### Community 14 - "Gallery"
Cohesion: 0.24
Nodes (7): metadata, PHOTOS, GalleryGrid(), GalleryPhoto, BlurFade(), BlurFadeProps, MarginType

### Community 15 - "Branding & QR Components"
Cohesion: 0.29
Nodes (4): QrCard(), BranchLockup(), CupMark(), Branch

## Knowledge Gaps
- **82 isolated node(s):** `dynamic`, `dynamic`, `dateFmt`, `dynamic`, `dynamic` (+77 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `clsx()` connect `Contact Page & UI Primitives` to `Order Logging & Admin Overview`, `Menu Item Editor & AI Chat`, `Admin Shell & Staff Auth`, `Franchise & Event Inquiries`, `Live Order Status & Staff Queue`, `Cart, Menu Page & Navigation`, `Branch Directory & Hours`, `Home & Story Pages`, `Checkout & Payment`, `Gallery`, `Branding & QR Components`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `getMenu` connect `Customer Account & Order APIs` to `Order Logging & Admin Overview`, `Menu Item Editor & AI Chat`, `Admin Shell & Staff Auth`, `Cart, Menu Page & Navigation`, `Contact Page & UI Primitives`, `Home & Story Pages`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `supabaseAdmin()` connect `Customer Account & Order APIs` to `Order Logging & Admin Overview`, `Menu Item Editor & AI Chat`, `Admin Shell & Staff Auth`, `Franchise & Event Inquiries`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `dynamic`, `dynamic`, `dateFmt` to the rest of the system?**
  _82 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Order Logging & Admin Overview` be split into smaller, more focused modules?**
  _Cohesion score 0.07627118644067797 - nodes in this community are weakly interconnected._
- **Should `Menu Item Editor & AI Chat` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `Admin Shell & Staff Auth` be split into smaller, more focused modules?**
  _Cohesion score 0.11840888066604996 - nodes in this community are weakly interconnected._