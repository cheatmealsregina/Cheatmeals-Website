-- Leaderboard score cap.
-- The original constraint only enforced score >= 0, so any client with the
-- anon key could insert absurd scores. Honest Patty Stacker play tops out
-- well under four digits (35 + bun bonus per perfect drop), so 9999 is a
-- generous ceiling that still fits the scoreboard layout.
alter table public.leaderboard
  drop constraint leaderboard_score_check;

alter table public.leaderboard
  add constraint leaderboard_score_check
  check (score >= 0 and score <= 9999);

comment on constraint leaderboard_score_check on public.leaderboard is
  'Score must be 0-9999: non-negative, capped to a sane 4-digit maximum for the Patty Stacker game.';
