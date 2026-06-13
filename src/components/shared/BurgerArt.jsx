import React from 'react';

const DS = window.CheatMealsDesignSystem_e4e564;
const LAYERS = window.CM_ICON_LAYERS;

/* Hero — the badge burger you SMASH to unlock spice. Each tap squashes the
   stack and lights another chili on the meter below; reach the top and the
   "Inferno" level unlocks (flame + heat glow). One more tap cools it back
   down so it always replays. Pointer + keyboard, no hover dependency, so it
   works identically on touch. The brand's chili spice system (the menu's
   Spicy / Extra Spicy badges) is the whole concept here. */

/* stack order, bottom of the page to top of the burger */
const XB_ORDER = ['plate', 'bunBottom', 'zigzagBottom', 'patty', 'zigzagTop', 'bunTop'];

const MAX_SPICE = 5;
/* brand-voiced rungs; index 0 is the idle hint */
const SPICE_LABELS = ['poke it to spice it up', 'Mild', 'Medium', 'Spicy', 'Extra Spicy', 'Inferno unlocked'];

export function ExplodedBurger({ size = 420 }) {
  const { Icon } = DS;
  const [spice, setSpice] = React.useState(0);
  const [smash, setSmash] = React.useState(false);
  const [popIndex, setPopIndex] = React.useState(-1);
  const timer = React.useRef(null);
  React.useEffect(() => () => clearTimeout(timer.current), []);

  const onSmash = () => {
    setSmash(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSmash(false), 280);
    setSpice((s) => {
      const next = s >= MAX_SPICE ? 0 : s + 1; /* one more tap past Inferno cools it down */
      setPopIndex(next > s ? next - 1 : -1);
      return next;
    });
  };

  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSmash();
    }
  };

  if (!LAYERS) return null;

  const unlocked = spice >= MAX_SPICE;
  const ariaLabel =
    spice === 0
      ? 'Smash the burger to crank up the spice'
      : unlocked
        ? 'Spice maxed out — Inferno unlocked. Smash to cool down.'
        : `Spice level ${spice} of ${MAX_SPICE} — smash for more`;

  return (
    <div className="pt-xb-wrap">
      <div
        className={'pt-xb' + (smash ? ' pt-xb--smash' : '') + (unlocked ? ' pt-xb--max' : '')}
        style={{ width: size, height: size * (1402 / 1122) * 0.82 }}
        onPointerDown={onSmash}
        onKeyDown={onKey}
        role="button"
        aria-label={ariaLabel}
        tabIndex={0}
      >
        {XB_ORDER.map((key) => (
          <svg
            key={key}
            className={'pt-xb__layer pt-xb__layer--' + key}
            viewBox={LAYERS.viewBox}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: LAYERS[key] }}
          />
        ))}
        {LAYERS.seeds.map((s, i) => (
          <svg
            key={i}
            className="pt-xb__seed"
            viewBox={LAYERS.viewBox}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: s }}
          />
        ))}
        {unlocked ? (
          <span className="pt-xb__flame" aria-hidden="true">
            <Icon name="flame" size={Math.round(size * 0.16)} />
          </span>
        ) : null}
      </div>

      {/* spice meter — decorative chilis + a live label that announces the level */}
      <div className="pt-spice">
        <span className="pt-spice__chilis" aria-hidden="true">
          {Array.from({ length: MAX_SPICE }).map((_, i) => (
            <span
              key={i}
              className={
                'pt-spice__chili' +
                (i < spice ? ' is-on' : '') +
                (smash && i === popIndex ? ' is-pop' : '')
              }
            >
              <Icon name="chili" size={26} />
            </span>
          ))}
        </span>
        <span className={'pt-spice__label' + (unlocked ? ' is-max' : '')} aria-hidden="true">
          {SPICE_LABELS[spice]}
        </span>
        <span className="sr-only" aria-live="polite">
          {spice === 0 ? '' : unlocked ? 'Inferno spice level unlocked' : 'Spice level ' + spice + ' of ' + MAX_SPICE}
        </span>
      </div>
    </div>
  );
}
