import React from 'react';
import { Screen } from '../shared/Screen.jsx';
import { Nav } from '../shared/Nav.jsx';
import { CallBar } from '../shared/CallBar.jsx';
import { loadJokes } from '../../lib/data.js';
import { ensureIndicFonts } from '../../lib/indicFonts.js';

const DS = window.CheatMealsDesignSystem_e4e564;
const data = window.CM_DATA;

/* lang → Indic script. Latin ('en') is absent on purpose so English + all
   chrome keep the brand fonts. Adding a script later is one entry here plus
   one @font-face/token/mapping in tokens/fonts-indic.css. */
const SCRIPT_BY_LANG = {
  hi: 'devanagari',
  // gu: 'gujarati', pa: 'gurmukhi', ml: 'malayalam', kn: 'kannada', te: 'telugu',
};
/* Each language labelled in its own script (हिंदी needs the Devanagari face). */
const LANG_LABEL = { en: 'EN', hi: 'हिंदी' };
const LANG_ORDER = ['en', 'hi'];

const AGAIN_LABELS = ['Hit me again', 'One more, chef', 'Again', "Keep 'em coming"];

const LANG_KEY = 'cm-jokes-lang';
const SEEN_KEY = 'cm-jokes-seen';

const seedJokes = () =>
  (window.CM_JOKES || []).map((j) => ({ lang: j.lang, text: j.text, category: j.category }));

function readSeen() {
  try {
    const v = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}');
    if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
    /* Normalise every language to an array of strings — guards against
       hand-edited / corrupted storage that would otherwise break .includes(). */
    const out = {};
    for (const k of Object.keys(v)) out[k] = Array.isArray(v[k]) ? v[k].filter((t) => typeof t === 'string') : [];
    return out;
  } catch (e) { return {}; }
}
function writeSeen(s) { try { localStorage.setItem(SEEN_KEY, JSON.stringify(s)); } catch (e) {} }
function readLang() { try { return localStorage.getItem(LANG_KEY); } catch (e) { return null; } }
function writeLang(l) { try { localStorage.setItem(LANG_KEY, l); } catch (e) {} }

function langsFrom(jokes) {
  const present = new Set(jokes.map((j) => j.lang));
  return [...LANG_ORDER.filter((c) => present.has(c)), ...[...present].filter((c) => !LANG_ORDER.includes(c))];
}

/* Bag shuffle: pick an unseen joke for the language; when the pool is
   exhausted, reshuffle (excluding the just-shown one to avoid a back-to-back
   repeat across the reset). Returns the chosen joke + the new seen list. */
function pickJoke(pool, seenTexts, avoidText) {
  if (!pool.length) return { chosen: null, seen: Array.isArray(seenTexts) ? seenTexts : [] };
  let seen = Array.isArray(seenTexts) ? seenTexts : [];
  let candidates = pool.filter((j) => !seen.includes(j.text));
  if (candidates.length === 0) {
    seen = [];
    candidates = pool.filter((j) => j.text !== avoidText);
    if (candidates.length === 0) candidates = pool.slice();
  }
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  return { chosen, seen: [...seen, chosen.text] };
}

export function JokesScreen({ mobile }) {
  const { SectionHeader, Button, Icon, Footer } = DS;

  const [jokes, setJokes] = React.useState(seedJokes);
  const [seen, setSeen] = React.useState(readSeen);
  const [loaded, setLoaded] = React.useState(() => seedJokes().length > 0);
  const [againLabel, setAgainLabel] = React.useState(AGAIN_LABELS[0]);

  /* First joke is deterministic and user-independent: the first joke of the
     default language, with no Math.random and no localStorage read. This makes
     the prerendered HTML identical to the client's first render, so /jokes
     hydrates cleanly. The visitor's saved language and no-repeat history are
     restored just after mount (below) and "Hit me again" shuffles randomly from
     then on — so variety is intact, it just doesn't gate the first paint. */
  const [initial] = React.useState(() => {
    const s = seedJokes();
    const langs = langsFrom(s);
    if (!langs.length) return { lang: null, current: null };
    const lang = langs[0];
    const pool = s.filter((j) => j.lang === lang);
    return { lang, current: pool[0] || null };
  });
  const [lang, setLang] = React.useState(initial.lang);
  const [current, setCurrent] = React.useState(initial.current);

  const langs = React.useMemo(() => langsFrom(jokes), [jokes]);
  const byLang = React.useCallback((c) => jokes.filter((j) => j.lang === c), [jokes]);

  React.useEffect(() => { ensureIndicFonts(); }, []);

  /* Restore the visitor's saved language + bag-shuffle history after mount —
     post-hydration, so it never disturbs the matched first paint. A fresh
     visitor (and the prerender, which has no localStorage) has nothing to
     restore, so we just advance the seen-set with the deterministic first pick
     and leave the joke as-is. */
  React.useEffect(() => {
    const s = seedJokes();
    const langs0 = langsFrom(s);
    if (!langs0.length || !initial.current) return;
    const saved = readLang();
    const stored = readSeen();
    const wantLang = saved && langs0.includes(saved) ? saved : initial.lang;
    const personalise =
      wantLang !== initial.lang ||
      (Array.isArray(stored[initial.lang]) && stored[initial.lang].length > 0);
    if (!personalise) {
      const merged = { ...stored, [initial.lang]: [...(stored[initial.lang] || []), initial.current.text] };
      writeSeen(merged); setSeen(merged); writeLang(initial.lang);
      return;
    }
    const { chosen, seen: ns } = pickJoke(s.filter((j) => j.lang === wantLang), stored[wantLang], null);
    if (!chosen) return;
    setLang(wantLang); setCurrent(chosen);
    const merged = { ...stored, [wantLang]: ns };
    setSeen(merged); writeSeen(merged); writeLang(wantLang);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Overlay live jokes; on any error keep the bundled seed (never blank). */
  React.useEffect(() => {
    let alive = true;
    loadJokes()
      .then((j) => { if (alive && j && j.length) setJokes(j); })
      .catch(() => {})
      .finally(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, []);

  /* Cold-start safety net: if the seed was empty, pick once live jokes land. */
  React.useEffect(() => {
    if (current || !langs.length) return;
    const saved = readLang();
    const l = saved && langs.includes(saved) ? saved : langs[0];
    const { chosen, seen: ns } = pickJoke(byLang(l), seen[l], null);
    if (!chosen) return;
    setLang(l); setCurrent(chosen);
    const merged = { ...seen, [l]: ns }; setSeen(merged); writeSeen(merged);
  }, [langs]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Recovery: if the active language's jokes vanish (e.g. all deactivated in
     a live refresh), fall back to a language that still has jokes instead of
     blanking the card. If none remain, the empty state renders. */
  React.useEffect(() => {
    if (!loaded || !lang || !langs.length) return;
    if (langs.includes(lang) && byLang(lang).length) return;
    const l = langs.find((c) => byLang(c).length);
    if (!l) return;
    writeLang(l);
    const { chosen, seen: ns } = pickJoke(byLang(l), seen[l], current && current.text);
    if (!chosen) return;
    setLang(l); setCurrent(chosen);
    const merged = { ...seen, [l]: ns }; setSeen(merged); writeSeen(merged);
  }, [langs, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  function hitAgain() {
    if (!lang) return;
    const { chosen, seen: ns } = pickJoke(byLang(lang), seen[lang], current && current.text);
    if (!chosen) return;
    setCurrent(chosen);
    const merged = { ...seen, [lang]: ns }; setSeen(merged); writeSeen(merged);
    setAgainLabel(AGAIN_LABELS[Math.floor(Math.random() * AGAIN_LABELS.length)]);
  }

  function switchLang(c) {
    if (c === lang || !byLang(c).length) return;
    writeLang(c);
    /* Re-pick for that language but PRESERVE its seen-set, so switching away
       and back (or a returning visitor) never gets an immediate repeat — the
       no-repeat-until-exhausted cycle continues per language. */
    const { chosen, seen: ns } = pickJoke(byLang(c), seen[c], current && current.text);
    if (!chosen) return;
    setLang(c); setCurrent(chosen);
    const merged = { ...seen, [c]: ns }; setSeen(merged); writeSeen(merged);
  }

  const script = lang ? SCRIPT_BY_LANG[lang] : undefined;
  const empty = loaded && langs.length === 0;
  const loading = !loaded && langs.length === 0;
  const showSwitcher = langs.length > 1;

  return (
    <Screen mobile={mobile} label="Jokes">
      <Nav mobile={mobile} active="" />
      <main className="pt-section pt-jokes-page" id="jokes">
        <SectionHeader as="h1" title="JOKES" accent="JOKES" script="on the house" scriptPosition="after" />
        <p className="pt-jokes-page__sub">Fresh material while your order's on the grill.</p>

        {showSwitcher ? (
          <div className="pt-jokes-langs" role="group" aria-label="Joke language">
            {langs.map((c) => (
              <button
                key={c}
                type="button"
                className={'pt-jokes-lang' + (c === lang ? ' pt-jokes-lang--on' : '')}
                aria-pressed={c === lang}
                lang={c}
                data-indic={SCRIPT_BY_LANG[c]}
                onClick={() => switchLang(c)}
              >
                {LANG_LABEL[c] || c.toUpperCase()}
              </button>
            ))}
          </div>
        ) : null}

        {loading ? (
          <div className="pt-boot pt-jokes-loading" role="status" aria-label="Loading jokes">
            <span className="pt-boot__dot" /><span className="pt-boot__dot" /><span className="pt-boot__dot" />
          </div>
        ) : empty ? (
          <div className="cm-joke-card">
            <hr className="cm-joke-card__rule" />
            <p className="cm-joke-card__text">We're workshopping them in the kitchen. Check back.</p>
            <hr className="cm-joke-card__rule" />
          </div>
        ) : current ? (
          <React.Fragment>
            <div className="cm-joke-card" aria-live="polite" aria-atomic="true">
              <hr className="cm-joke-card__rule" />
              <div className="cm-joke-card__inner" key={current.text}>
                <p className="cm-joke-card__text" lang={lang} data-indic={script}>{current.text}</p>
                {current.category ? <span className="cm-joke-card__tag">{current.category}</span> : null}
              </div>
              <hr className="cm-joke-card__rule" />
            </div>
            <div className="pt-jokes-actions">
              <Button variant="primary" size="lg" onClick={hitAgain}>{againLabel}</Button>
            </div>
          </React.Fragment>
        ) : null}

        <div className="pt-jokes-cross">
          <Button variant="secondary" href="/game">
            Play Patty Stacker <Icon name="arrowRight" size={18} />
          </Button>
          <Button variant="secondary" href="/#menu">See the Menu</Button>
        </div>
      </main>
      {mobile ? <CallBar /> : null}
      <Footer
        logoSrc="/assets/logos/cheatmeals-primary-inverse.svg"
        address={data.address + ', ' + data.city}
        phone={data.phone}
        socials={false}
      />
    </Screen>
  );
}
