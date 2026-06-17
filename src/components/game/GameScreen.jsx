import React from 'react';
import { Screen } from '../shared/Screen.jsx';
import { Nav } from '../shared/Nav.jsx';
import { CallBar } from '../shared/CallBar.jsx';
import { PieceSVG, ClawGlyph, SpeakerGlyph, SketchArrow } from './GamePieces.jsx';
import { ThemeAsset } from '../shared/ThemeAsset.jsx';
import { createGameSound } from './sound.js';
import { loadLeaderboard } from '../../lib/data.js';

const DS = window.CheatMealsDesignSystem_e4e564;

const STK_SEQ = ['aloo', 'paneer', 'cheese', 'chutney', 'jalapeno'];
const STK = { layerH: 22, baseW: 190, perfect: 5, baseB: 36, base: 10 };

function stkLoadBoard() {
  try {
    const v = JSON.parse(localStorage.getItem('cm-stacker-board') || '[]');
    return Array.isArray(v)
      ? v.filter((e) => e && typeof e.score === 'number' && typeof e.ini === 'string')
      : [];
  } catch (e) { return []; }
}
function stkSaveBoard(b) {
  try { localStorage.setItem('cm-stacker-board', JSON.stringify(b)); } catch (e) {}
}
function stkPieceAt(i) { return i % 7 === 6 ? 'bun' : STK_SEQ[i % STK_SEQ.length]; }

/* Submit a saved score to the shared leaderboard and return the fresh
   top-5. Production goes through /api/leaderboard (validation + rate
   limiting server-side); local vite dev has no /api, so it falls back
   to a direct Supabase insert. Errors resolve to null — the board then
   simply keeps showing the localStorage list. */
async function stkSubmitScore(ini, score) {
  try {
    if (import.meta.env.DEV) {
      /* same upsert as prod (keep-the-best, one row per initials) via the
         submit_score RPC, so local testing matches production behaviour */
      const { supabase } = await import('../../lib/supabase.js');
      const { error } = await supabase.rpc('submit_score', { p_initials: ini, p_score: score });
      if (error) throw error;
      const { data, error: selErr } = await supabase
        .from('leaderboard')
        .select('initials,score')
        .order('score', { ascending: false })
        .order('created_at')
        .limit(5);
      if (selErr) throw selErr;
      return data.map((r) => ({ ini: r.initials.trim(), score: r.score }));
    }
    const r = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ initials: ini, score }),
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const { top5 } = await r.json();
    return top5 || null;
  } catch (e) {
    console.warn('[leaderboard] score submit failed:', e);
    return null;
  }
}

function GameOverCard({ score, entry = false, saved = false, onAgain, onSave, initialInitials = '' }) {
  const { Button } = DS;
  const [ini, setIni] = React.useState(initialInitials);
  const line =
    score >= 280 ? 'Okay. We might be hiring.'
    : score >= 120 ? null
    : 'That\'s a structurally unsound burger.';
  return (
    <div className="stk-over">
      <div className="stk-overcard">
        {/* themed celebration art — high-score lockup for a top-5 run, the
            "stack collapsed" illustration otherwise. Graceful: hides itself
            until the art files are dropped in at these paths. */}
        <ThemeAsset
          base={entry ? '/assets/game/highscore' : '/assets/game/gameover'}
          className="stk-overcard__art"
          width={132}
          height={132}
        />
        <span className="cm-label" style={{ color: 'var(--color-text-muted)' }}>Your stack</span>
        <p className="stk-overcard__score cm-display">{score}</p>
        {entry ? (
          <React.Fragment>
            <p className="stk-overcard__line">Top-5 stack. Claim it — three initials.</p>
            <input
              className="stk-initials"
              maxLength={3}
              value={ini}
              placeholder="AAA"
              aria-label="Your initials"
              onChange={(e) => setIni(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
              onPointerDown={(e) => e.stopPropagation()}
            />
            <Button variant="primary" onClick={() => onSave(ini || 'CM')}>Save Score</Button>
            {/* initials are only 3 letters, so two people can collide — the
                board keeps one row per initials at their best score */}
            <p className="stk-overcard__note">Same initials? You'll share the throne.</p>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <p className="stk-overcard__line">
              {line !== null ? line : (
                <React.Fragment>Solid stack. Sides are on the house* <small>(*they always are)</small></React.Fragment>
              )}
            </p>
            {saved ? <span className="cm-label" style={{ color: 'var(--color-tag-text)' }}>On the board</span> : null}
            <div className="stk-overcard__btns">
              <Button variant="primary" onClick={onAgain}>Stack Again</Button>
              <Button variant="secondary" href="/#menu">See the Menu</Button>
            </div>
          </React.Fragment>
        )}
        <p className="stk-overcard__note">Show this to the counter — bragging rights only.</p>
      </div>
    </div>
  );
}

function StackerBoard({ board }) {
  return (
    <section className="stk-board">
      <h3 className="cm-display stk-board__title">
        <span className="stk-star">★</span> TOP STACKERS <span className="stk-star">★</span>
      </h3>
      {board.length ? (
        <ol>
          {board.map((b, i) => (
            <li key={i}>
              <span className="stk-board__rank">{i + 1}</span>
              <span className="stk-board__ini">{b.ini}</span>
              <span className="stk-board__pts">{b.score}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="stk-board__empty">Nobody's stacked yet. Be first.</p>
      )}
    </section>
  );
}

function PattyStacker({ W = 360, H = 560 }) {
  const { Icon, Pennant } = DS;
  const [mode, setMode] = React.useState(() => {
    try { return localStorage.getItem('cm-stacker-howto') ? 'idle' : 'howto'; } catch (e) { return 'howto'; }
  });
  const [stack, setStack] = React.useState([]);
  const [dropping, setDropping] = React.useState(null);
  const [slices, setSlices] = React.useState([]);
  const [stars, setStars] = React.useState([]);
  const [score, setScore] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const [banner, setBanner] = React.useState(false);
  const [flashId, setFlashId] = React.useState(null);
  const [cutFx, setCutFx] = React.useState(null);
  const [muted, setMuted] = React.useState(() => {
    try { return localStorage.getItem('cm-stacker-muted') === '1'; } catch (e) { return false; }
  });
  const [board, setBoard] = React.useState(stkLoadBoard);
  const [saved, setSaved] = React.useState(false);
  const [pieceIdx, setPieceIdx] = React.useState(0);
  const armRef = React.useRef(null);
  const armX = React.useRef(W / 2);
  const phase = React.useRef(0);
  const idRef = React.useRef(1);
  const droppingRef = React.useRef(false);
  const savingRef = React.useRef(false);
  const timers = React.useRef([]);
  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };
  React.useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const sound = React.useMemo(() => createGameSound(), []);
  React.useEffect(() => { sound.setMuted(muted); }, [muted, sound]);

  /* pull the shared top-5 on mount; keep the local list as the instant
     fallback if the network/Supabase call fails */
  React.useEffect(() => {
    let alive = true;
    loadLeaderboard()
      .then((top5) => { if (alive && top5 && top5.length) setBoard(top5); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const setArmPos = (px) => {
    if (armRef.current) armRef.current.style.transform = 'translateX(' + px.toFixed(1) + 'px)';
  };

  const armActive = mode === 'play' || mode === 'idle' || mode === 'howto';
  React.useEffect(() => {
    if (!armActive) return;
    /* honour reduced-motion: park the arm at centre (still fully playable —
       a tap drops from wherever the arm rests) and skip the rAF loop */
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { armX.current = W / 2; setArmPos(W / 2); return; }
    let raf = 0, last = performance.now();
    const amp = (W - 74) / 2;
    const spd = 0.0024 + stack.length * 0.00009;
    const tick = (t) => {
      const dt = Math.min(t - last, 50); /* clamp so a tab-refocus can't snap the arm */
      last = t;
      phase.current += dt * spd;
      armX.current = W / 2 + Math.sin(phase.current) * amp;
      setArmPos(armX.current); /* transform, not left — compositor-only, no per-frame layout */
      raf = requestAnimationFrame(tick);
    };
    /* Pause fully when the tab is backgrounded — cancel the rAF instead of just
       skipping work, so a hidden tab schedules zero frames (no CPU/battery).
       Resume on return, resetting the clock so the arm doesn't snap. The effect
       cleanup also stops it when the game route unmounts. */
    const startLoop = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    const stopLoop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const onVis = () => { if (document.hidden) stopLoop(); else startLoop(); };
    document.addEventListener('visibilitychange', onVis);
    if (!document.hidden) startLoop();
    return () => { stopLoop(); document.removeEventListener('visibilitychange', onVis); };
  }, [armActive, stack.length, W]);

  const top = stack.length ? stack[stack.length - 1] : { x: W / 2, w: STK.baseW };
  const curType = stkPieceAt(pieceIdx);

  const start = () => {
    droppingRef.current = false;
    savingRef.current = false;
    setStack([]); setSlices([]); setStars([]); setDropping(null); setCutFx(null);
    setScore(0); setStreak(0); setPieceIdx(0); setSaved(false);
    setMode('play');
  };

  /* Drop = a real fall, then a commit. The piece releases from the arm's
     position and falls to the landing height; once it lands we keep the
     overlap, shear the overhang into a tumbling slice, and score it. The
     arm can't drop again until this one lands. */
  const drop = () => {
    if (droppingRef.current) return; /* ref guard: blocks multi-touch/same-frame double drops */
    droppingRef.current = true;
    sound.tick();
    const x = armX.current;
    const dx = x - top.x;
    const type = curType;
    const bonus = type === 'bun' ? 50 : 0;
    const id = idRef.current++;
    const bottom = STK.baseB + stack.length * STK.layerH;
    const miss = Math.abs(dx) >= top.w;

    /* distance from the landing spot up to the arm (top ~82px), so the piece
       falls from exactly where it was released regardless of stack height */
    const fall = Math.max(120, H - bottom - STK.layerH + off - 82);
    const dur = Math.min(360, Math.max(190, Math.round(fall * 0.6)));

    setDropping({ id, x, w: top.w, t: type, b: bottom, fall, dur });

    later(() => {
      setDropping(null);
      droppingRef.current = false;

      if (miss) {
        /* no overlap — the whole piece shears off and tumbles, then game over */
        sound.slice();
        setSlices((s) => s.concat({ id, left: x - top.w / 2, b: bottom, w: top.w, t: type, dir: dx > 0 ? 1 : -1 }));
        const qualifies = score > 0 && (board.length < 5 || score > board[board.length - 1].score);
        /* clear transient FX before the game-over veil so nothing flickers under it */
        later(() => { setSlices([]); setStars([]); setCutFx(null); sound.over(); setMode(qualifies ? 'entry' : 'over'); }, 240);
        return;
      }

      if (Math.abs(dx) <= STK.perfect) {
        const ns = streak + 1;
        /* Combo multiplier: ×2 on the first perfect, +1 for each consecutive
           one, capped at ×5. A perfect is worth base × multiplier (20–50 with
           base 10), so consecutive perfects compound instead of paying a flat
           bonus. Resets to ×1 on any non-perfect drop (the else branch). An
           honest run stays well under the 9999 leaderboard cap. */
        const m = Math.min(ns + 1, 5);
        const pts = STK.base * m + bonus;
        setStack((s) => s.concat({ id, x: top.x, w: top.w, t: type }));
        setScore((v) => v + pts);
        setStreak(ns);
        sound.perfect(ns);
        if (ns % 3 === 0) { setBanner(true); later(() => setBanner(false), 1600); }
        setFlashId(id);
        later(() => setFlashId((f) => (f === id ? null : f)), 520);
        setStars((s) => s.concat({ id, x: top.x, b: bottom + STK.layerH + 6, label: '+' + pts + ' ×' + m }));
        later(() => setStars((s) => s.filter((q) => q.id !== id)), 950);
      } else {
        const w2 = top.w - Math.abs(dx);
        const x2 = (x + top.x) / 2;
        setStack((s) => s.concat({ id, x: x2, w: w2, t: type }));
        /* non-perfect (slice-off) — base points, and the combo resets to ×1 */
        setScore((v) => v + STK.base + bonus);
        setStreak(0);
        const sw = Math.abs(dx);
        const sliceLeft = dx > 0 ? top.x + top.w / 2 : top.x - top.w / 2 - sw;
        setSlices((s) => s.concat({ id, left: sliceLeft, b: bottom, w: sw, t: type, dir: dx > 0 ? 1 : -1 }));
        later(() => setSlices((s) => s.filter((q) => q.id !== id)), 900);
        sound.thud();
        sound.slice();
        const cutX = dx > 0 ? top.x + top.w / 2 : top.x - top.w / 2;
        setCutFx({ id, x: cutX, b: bottom });
        later(() => setCutFx((c) => (c && c.id === id ? null : c)), 300);
      }
      setPieceIdx((i) => i + 1);
    }, dur);
  };

  const onStage = () => {
    sound.resume();
    if (mode === 'howto') {
      try { localStorage.setItem('cm-stacker-howto', '1'); } catch (e) {}
      start();
      return;
    }
    if (mode === 'idle') { start(); return; }
    if (mode === 'play') drop();
  };

  const saveScore = (ini) => {
    if (savingRef.current) return; /* no double-submit on a fast second tap */
    savingRef.current = true;
    const initials = (ini || 'CM').slice(0, 3);
    const next = board
      .concat({ ini: initials, score })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    setBoard(next);
    stkSaveBoard(next);
    setSaved(true);
    setMode('over');
    /* shared leaderboard — refresh the displayed top-5 when it answers */
    stkSubmitScore(initials, score).then((top5) => {
      if (top5 && top5.length) setBoard(top5);
    });
  };

  const off = Math.max(0, STK.baseB + stack.length * STK.layerH - (H - 230));

  const stageLabel =
    mode === 'howto' ? 'Patty Stacker — press Enter or Space to start'
    : mode === 'idle' ? 'Press Enter or Space to start stacking'
    : mode === 'play' ? 'Press Enter or Space to drop the patty'
    : 'Patty Stacker';

  return (
    <div className="stk-col">
      <div
        className="stk-stage"
        style={{ width: W, height: H }}
        onPointerDown={onStage}
        role="button"
        tabIndex={0}
        aria-label={stageLabel}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return; /* let the sound button / initials input handle their own keys */
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStage(); }
        }}
      >
        {/* faint themed backdrop, behind every gameplay layer; pointer-events
            none so it never steals a tap. Gameplay clarity wins — keep it low
            opacity (see .stk-backdrop). Hides gracefully until art is added. */}
        <ThemeAsset base="/assets/game/backdrop" className="stk-backdrop" />
        <div className="stk-hud">
          <div>
            <span className="cm-label stk-hud__lab">Score</span>
            <span className="stk-score cm-display">
              {score}
              {streak > 0 ? (
                <span className="stk-mult" aria-label={'multiplier ' + Math.min(streak + 1, 5) + ' times'}>
                  ×{Math.min(streak + 1, 5)}
                </span>
              ) : null}
            </span>
          </div>
          <div className="stk-hud__right">
            {streak > 0 ? (
              <span className="stk-chilis" aria-label={streak + ' perfect streak'}>
                {Array.from({ length: Math.min(streak, 3) }).map((_, i) => <Icon key={i} name="chili" size={16} />)}
              </span>
            ) : null}
            <button
              type="button"
              className="stk-sound"
              aria-pressed={!muted}
              aria-label={muted ? 'Sound off' : 'Sound on'}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                sound.resume();
                setMuted((m) => {
                  const next = !m;
                  try { localStorage.setItem('cm-stacker-muted', next ? '1' : '0'); } catch (e) {}
                  return next;
                });
              }}
            >
              <SpeakerGlyph muted={muted} />
            </button>
          </div>
        </div>

        <div className="stk-world" style={{ transform: 'translateY(' + off + 'px)' }}>
          <div className="stk-base" style={{ left: W / 2 - STK.baseW / 2, width: STK.baseW }} />
          {stack.map((L, i) => (
            <div
              key={L.id}
              className={'stk-layer' + (i === stack.length - 1 ? ' stk-layer--new' : '') + (flashId === L.id ? ' stk-layer--flash' : '')}
              style={{ left: L.x - L.w / 2, bottom: STK.baseB + i * STK.layerH, width: L.w, height: STK.layerH }}
            >
              <PieceSVG type={L.t} />
            </div>
          ))}
          {dropping ? (
            <div
              key={dropping.id}
              className="stk-falling"
              style={{
                left: dropping.x - dropping.w / 2,
                bottom: dropping.b,
                width: dropping.w,
                height: STK.layerH,
                '--fall': dropping.fall + 'px',
                '--fall-dur': dropping.dur + 'ms',
              }}
            >
              <PieceSVG type={dropping.t} />
            </div>
          ) : null}
          {slices.map((s) => (
            <div
              key={s.id}
              className="stk-slice"
              style={{ left: s.left, bottom: s.b, width: s.w, height: STK.layerH, '--rot': s.dir * 220 + 'deg', '--dx': s.dir * 90 + 'px' }}
            >
              <PieceSVG type={s.t} />
            </div>
          ))}
          {cutFx ? (
            <span
              className="stk-cutflash"
              style={{ left: cutFx.x - 1.5, bottom: cutFx.b - STK.layerH * 0.25, height: STK.layerH * 1.5 }}
            />
          ) : null}
          {stars.map((st) => (
            <span key={st.id} className="stk-starpop" style={{ left: st.x, bottom: st.b }}>★<b>{st.label}</b></span>
          ))}
        </div>

        <div className="stk-counter" />

        {armActive ? (
          <div ref={armRef} className="stk-arm" style={{ transform: 'translateX(' + armX.current + 'px)' }}>
            <span className="stk-arm__rod" />
            <span className="stk-claw"><ClawGlyph /></span>
            <div className="stk-arm__piece" style={{ width: top.w, marginLeft: -top.w / 2, height: STK.layerH }}>
              {dropping ? null : <PieceSVG type={curType} />}
            </div>
          </div>
        ) : null}

        {banner ? <div className="stk-banner"><Pennant>Chef's Pick Streak</Pennant></div> : null}
        {mode === 'idle' ? (
          <div className="stk-veil"><span className="stk-tap cm-display">TAP TO STACK</span></div>
        ) : null}
        {mode === 'howto' ? (
          <div className="stk-veil stk-howto">
            <SketchArrow />
            <span className="cm-aside">Tap to drop. Don't get greedy.</span>
          </div>
        ) : null}
        {mode === 'entry' ? <GameOverCard score={score} entry onSave={saveScore} /> : null}
        {mode === 'over' ? <GameOverCard score={score} saved={saved} onAgain={start} /> : null}
      </div>
      <StackerBoard board={board} />
    </div>
  );
}

/* The stage coordinate system is in absolute px, so the stage box width must
   match the viewport or the right edge of the playfield clips on small phones.
   Track it and recompute on resize/orientation change. */
function useStageWidth(mobile) {
  const calc = () => (mobile ? Math.min(343, window.innerWidth - 32) : 360);
  const [w, setW] = React.useState(calc);
  React.useEffect(() => {
    const onResize = () => setW(calc());
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [mobile]);
  return w;
}

/* On mobile a fixed-bottom CallBar covers the lower ~84px of the viewport, and
   the page chrome above the stage (nav + section row + title) is ~340px. A flat
   540px stage therefore had its base hidden behind the call bar. Size the stage
   to the room that's actually left (viewport − chrome − call bar) so the whole
   playfield sits clear of the bar; clamp so it never gets tiny or larger than
   the original. The physics read H, so a shorter stage just scrolls sooner. */
function useStageHeight(mobile) {
  const calc = () => (mobile ? Math.max(340, Math.min(540, window.innerHeight - 424)) : 560);
  const [h, setH] = React.useState(calc);
  React.useEffect(() => {
    const onResize = () => setH(calc());
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [mobile]);
  return h;
}

export function GameScreen({ mobile }) {
  const W = useStageWidth(mobile);
  const H = useStageHeight(mobile);
  return (
    <Screen mobile={mobile} label={mobile ? 'While You Wait — mobile' : 'While You Wait — desktop'}>
      <Nav mobile={mobile} active="" />
      <main className="stk-page" id="game">
        <header className="stk-head">
          <span className="cm-label" style={{ color: 'var(--color-text-muted)' }}>While you wait</span>
          <h1 className="stk-title cm-display">
            THE <span className="cm-script stk-title__script">Patty</span> <span style={{ color: 'var(--cm-red)' }}>STACKER</span>
          </h1>
          <p className="stk-sub">Stack 'em while we smash 'em. Your order's coming.</p>
        </header>
        <PattyStacker W={W} H={H} />
      </main>
      {mobile ? <CallBar /> : null}
    </Screen>
  );
}
