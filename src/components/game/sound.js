/* Patty Stacker sound — every effect is synthesized with the Web Audio API,
   so there are no audio files to download and it works offline. The
   AudioContext starts suspended and is only resumed from a user gesture
   (the first tap), per browser autoplay policy. All effects are no-ops when
   muted or before the context is running. */

let ctx = null;
let master = null;

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  return ctx;
}

function noiseBuffer(dur) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

/* attack/decay envelope on a gain node (exponential ramps can't hit 0) */
function env(gain, t0, peak, attack, decay) {
  gain.gain.cancelScheduledValues(t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
}

export function createGameSound() {
  let muted = false;
  const live = () => !muted && ctx && ctx.state === 'running';

  /* soft release tick when a piece is dropped */
  function tick() {
    if (!live()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(320, t);
    o.frequency.exponentialRampToValueAtTime(180, t + 0.05);
    env(g, t, 0.12, 0.002, 0.05);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + 0.08);
  }

  /* low thud + tawa-sizzle as a patty lands */
  function thud() {
    if (!live()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(190, t);
    o.frequency.exponentialRampToValueAtTime(72, t + 0.14);
    env(g, t, 0.5, 0.004, 0.16);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + 0.22);

    const n = ctx.createBufferSource();
    n.buffer = noiseBuffer(0.12);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 0.7;
    const ng = ctx.createGain();
    env(ng, t, 0.1, 0.004, 0.1);
    n.connect(bp).connect(ng).connect(master);
    n.start(t); n.stop(t + 0.14);
  }

  /* short bright "ding" for a perfect; pitch rises with the streak */
  function perfect(level = 1) {
    if (!live()) return;
    const t = ctx.currentTime;
    const step = Math.min(level - 1, 8);
    const root = 740 * Math.pow(2, step / 12); // climb a semitone per streak
    [root, root * 1.5].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      env(g, t + i * 0.035, 0.28, 0.003, 0.24);
      o.connect(g).connect(master);
      o.start(t + i * 0.035); o.stop(t + i * 0.035 + 0.3);
    });
  }

  /* crisp filtered-noise "chk" for the slice/cut */
  function slice() {
    if (!live()) return;
    const t = ctx.currentTime;
    const n = ctx.createBufferSource();
    n.buffer = noiseBuffer(0.16);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(1400, t);
    hp.frequency.exponentialRampToValueAtTime(500, t + 0.12);
    const g = ctx.createGain();
    env(g, t, 0.22, 0.002, 0.13);
    n.connect(hp).connect(g).connect(master);
    n.start(t); n.stop(t + 0.18);
  }

  /* descending tone for game over */
  function over() {
    if (!live()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(110, t + 0.5);
    env(g, t, 0.26, 0.01, 0.5);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 1200;
    o.connect(lp).connect(g).connect(master);
    o.start(t); o.stop(t + 0.55);
  }

  return {
    resume() {
      ensureCtx();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    },
    setMuted(m) { muted = m; },
    tick, thud, slice, perfect, over,
  };
}
