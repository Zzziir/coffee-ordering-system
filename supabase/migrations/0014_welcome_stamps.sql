-- Craffé — welcome stamps (the endowed-progress effect).
--
-- New accounts open with two stamps already on the card. The card grows to 12
-- slots (see STAMPS_PER_REWARD in lib/menu), so the reward still takes the same
-- ten real purchases it always did: the two gift stamps are a free head start,
-- not a cheaper reward. People finish a card they have already started far more
-- often than one that starts empty (Nunes & Drèze, "The Endowed Progress
-- Effect"), so this lifts completion without giving a single extra drink away.
--
-- loyalty_seed is the additive-starting-stamps lever: it already banked a guest's
-- pre-account tally (see /api/rewards), and now also carries this welcome gift.
-- New profiles pick it up from the column default; the few accounts that predate
-- this get a one-time top-up so their card grows too and the wider card never
-- costs them a reward they were already holding.

alter table profiles
  alter column loyalty_seed set default 2;

update profiles
  set loyalty_seed = loyalty_seed + 2;
