-- Fix production schema drift on the leaderboard initials constraint.
--
-- A constraint named `leaderboard_initials_exactly_3` exists on the LIVE
-- database but NOT in these migrations (it was added to prod out-of-band). It
-- requires initials to be exactly three UPPERCASE LETTERS, so it rejects the
-- space-padded char(3) form that 1- and 2-letter initials take on INSERT
-- (e.g. 'KK ', or the app's default 'CM' -> 'CM '). Every non-3-letter score
-- submission therefore failed with a 23514 check violation, which the app
-- surfaced as "Could not save the score" — so only 3-letter names ever landed
-- on the board. That is the root cause of "the leaderboard isn't working".
--
-- The app intentionally allows 1-3 letter initials (input maxLength 3, A-Z
-- only, default 'CM'), and both submit_score() and the original column check
-- use '^[A-Z]{1,3} {0,2}$'. Drop the over-strict drift constraint and
-- (re)assert the intended one. Idempotent and safe to run on either project:
-- every existing row (3-letter or padded) already satisfies the 1-3 check.

alter table public.leaderboard
  drop constraint if exists leaderboard_initials_exactly_3;

alter table public.leaderboard
  drop constraint if exists leaderboard_initials_check;

alter table public.leaderboard
  add constraint leaderboard_initials_check
  check (initials ~ '^[A-Z]{1,3} {0,2}$');

comment on constraint leaderboard_initials_check on public.leaderboard is
  'Initials are 1-3 uppercase letters; char(3) space-pads shorter ones (''KK '' / ''A  ''). Matches the app input and submit_score().';
