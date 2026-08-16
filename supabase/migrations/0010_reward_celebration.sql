-- Craffé — once-per-account reward celebration.
--
-- Tracks the lifetime rewards-earned count we've already congratulated a
-- customer for, so completing a card cheers exactly once per account (across
-- every device), never again and never retroactively.
--
-- Nullable on purpose: null means "never initialized". The first time the app
-- reads it, it banks the customer's current earned count silently, so existing
-- customers with rewards already in hand aren't popped a stale celebration.
-- After that, any increase in earned rewards fires the modal once, then this
-- catches up to the new count.

alter table profiles
  add column rewards_celebrated integer
    check (rewards_celebrated is null or rewards_celebrated >= 0);
