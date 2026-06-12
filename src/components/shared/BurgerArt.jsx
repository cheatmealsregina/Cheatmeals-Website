import React from 'react';

const DS = window.CheatMealsDesignSystem_e4e564;
const LAYERS = window.CM_ICON_LAYERS;

/* Hero 2.0 — the badge logo split into burger anatomy. Hover (or focus)
   explodes the stack apart with layer captions; click smashes it back
   with a squash; five clicks inside 3s earns the easter egg spin. */

const XB_ORDER = [
  /* key, explode drift (px, negative = up), caption */
  { key: 'plate', d: 0, caption: null },
  { key: 'bunBottom', d: 64, caption: 'toasted base' },
  { key: 'zigzagBottom', d: 30, caption: 'house chutney' },
  { key: 'patty', d: -8, caption: 'hand-smashed tikki' },
  { key: 'zigzagTop', d: -46, caption: 'schezwan mayo' },
  { key: 'bunTop', d: -84, caption: 'fresh bun' },
];

/* per-seed drift — they scatter a touch farther than the dome */
const SEED_DRIFT = [-118, -104, -126, -108, -122, -98, -112];

export function ExplodedBurger({ size = 420 }) {
  const { Pennant } = DS;
  const [smash, setSmash] = React.useState(false);
  const [egg, setEgg] = React.useState(false);
  const clicks = React.useRef([]);
  const timer = React.useRef(null);
  React.useEffect(() => () => clearTimeout(timer.current), []);

  const onPoke = () => {
    const now = Date.now();
    clicks.current = clicks.current.filter((t) => now - t < 3000).concat(now);
    if (clicks.current.length >= 5) {
      clicks.current = [];
      setEgg(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setEgg(false), 2400);
      return;
    }
    setSmash(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSmash(false), 450);
  };

  if (!LAYERS) return null;

  return (
    <div
      className={'pt-xb' + (smash ? ' pt-xb--smash' : '') + (egg ? ' pt-xb--egg' : '')}
      style={{ width: size, height: size * (1402 / 1122) * 0.82 }}
      onPointerDown={onPoke}
      role="img"
      aria-label="CheatMeals burger badge — poke it"
      tabIndex={0}
    >
      {XB_ORDER.map((l) => (
        <React.Fragment key={l.key}>
          <svg
            className={'pt-xb__layer pt-xb__layer--' + l.key}
            style={{ '--xb-d': l.d + 'px' }}
            viewBox={LAYERS.viewBox}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: LAYERS[l.key] }}
          />
          {l.caption ? (
            <span className={'pt-xb__caption pt-xb__caption--' + l.key} style={{ '--xb-d': l.d + 'px' }}>
              {l.caption}
            </span>
          ) : null}
        </React.Fragment>
      ))}
      {LAYERS.seeds.map((s, i) => (
        <svg
          key={i}
          className="pt-xb__seed"
          style={{ '--xb-d': SEED_DRIFT[i] + 'px', '--xb-i': i }}
          viewBox={LAYERS.viewBox}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: s }}
        />
      ))}
      {egg ? (
        <span className="pt-xb__egg"><Pennant>Okay. We might be hiring.</Pennant></span>
      ) : null}
    </div>
  );
}

/* hand-drawn nudge under the burger */
export function PokeArrow() {
  return (
    <span className="pt-poke">
      <svg viewBox="0 0 44 40" width="34" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 36 C 16 30, 28 22, 34 8" />
        <path d="M25 10 l9 -3 2 9" />
      </svg>
      <span className="cm-aside">poke it</span>
    </span>
  );
}
