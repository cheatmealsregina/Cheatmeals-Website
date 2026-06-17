-- Leaderboard: one row per player (initials), keeping their best score.
--
-- Before this, every submission INSERTed a new row, so a strong player could
-- flood the board with repeats. Now: de-dupe history (keep each initials' max),
-- enforce one row per initials, and route writes through a SECURITY DEFINER
-- upsert that only ever RAISES a player's score (never lowers it, never dupes).
--
-- initials is char(3), CHECK-constrained to ^[A-Z]{1,3} {0,2}$ (uppercase,
-- space-padded), so uniqueness is effectively case-insensitive already.

-- (1) De-dupe existing rows: keep, per initials, the highest score; ties broken
--     by earliest created_at, then smallest id. char(3) '=' ignores the trailing
--     pad, so 'AB ' groups with 'AB ' correctly.
delete from public.leaderboard a
using public.leaderboard b
where a.initials = b.initials
  and (a.score < b.score
       or (a.score = b.score and a.created_at > b.created_at)
       or (a.score = b.score and a.created_at = b.created_at and a.id > b.id));

-- (2) One row per initials.
alter table public.leaderboard
  add constraint leaderboard_initials_unique unique (initials);

-- (3) Atomic keep-the-best upsert. SECURITY DEFINER because the "public submit"
--     RLS policy grants anon INSERT only (not UPDATE); this function runs as its
--     owner and RE-VALIDATES its inputs, so it can't be abused even if called
--     directly over RPC. It never lowers a score and never creates a duplicate.
create or replace function public.submit_score(p_initials text, p_score int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_initials is null or p_initials !~ '^[A-Z]{1,3}$' then
    raise exception 'initials must be 1-3 uppercase letters';
  end if;
  if p_score is null or p_score < 0 or p_score > 9999 then
    raise exception 'score must be an integer between 0 and 9999';
  end if;

  insert into public.leaderboard (initials, score)
  values (p_initials, p_score)
  on conflict (initials) do update
    set score = greatest(leaderboard.score, excluded.score),
        created_at = case
          when excluded.score > leaderboard.score then now()
          else leaderboard.created_at
        end;
end;
$$;

-- Only the function is callable by the public roles; tighten the default grant.
revoke all on function public.submit_score(text, int) from public;
grant execute on function public.submit_score(text, int) to anon, authenticated;

comment on constraint leaderboard_initials_unique on public.leaderboard is
  'One leaderboard row per player initials.';
comment on function public.submit_score(text, int) is
  'Upsert a Patty Stacker score: one row per initials, keeping the highest. Re-validates inputs; SECURITY DEFINER so anon (INSERT-only) can update via this path. Never lowers a score, never duplicates initials.';
