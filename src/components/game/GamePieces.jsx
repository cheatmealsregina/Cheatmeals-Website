import React from 'react';

const GP_RED = '#FB0403';

export function PieceSVG({ type }) {
  const S = { fill: 'var(--color-surface)', stroke: 'currentColor', strokeWidth: 2, vectorEffect: 'non-scaling-stroke', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const L = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, vectorEffect: 'non-scaling-stroke', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const R = { fill: 'none', stroke: GP_RED, strokeWidth: 2, vectorEffect: 'non-scaling-stroke', strokeLinecap: 'round', strokeLinejoin: 'round' };
  let art = null;
  if (type === 'aloo') {
    art = (
      <g>
        <rect x="3" y="4" width="114" height="20" rx="10" {...S} />
        <circle cx="30" cy="12" r="1.6" fill="currentColor" />
        <circle cx="55" cy="17" r="1.6" fill="currentColor" />
        <circle cx="78" cy="11" r="1.6" fill="currentColor" />
        <circle cx="96" cy="16" r="1.6" fill="currentColor" />
      </g>
    );
  } else if (type === 'paneer') {
    art = (
      <g>
        <rect x="3" y="5" width="114" height="18" rx="3" {...S} />
        <path d="M42 9 v10 M78 9 v10" {...L} />
      </g>
    );
  } else if (type === 'cheese') {
    art = (
      <g>
        <path d="M4 6 H116 V17 H80 L73 25 L67 17 H4 Z" {...S} />
        <circle cx="34" cy="12" r="1.6" fill="currentColor" />
      </g>
    );
  } else if (type === 'chutney') {
    art = (
      <g>
        <rect x="3" y="4" width="114" height="20" rx="10" fill="var(--color-surface)" stroke={GP_RED} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <path d="M14 18 L26 10 L38 18 L50 10 L62 18 L74 10 L86 18 L98 10 L106 16" {...R} />
      </g>
    );
  } else if (type === 'jalapeno') {
    art = (
      <g>
        <rect x="3" y="3" width="114" height="22" rx="11" {...S} />
        <rect x="20" y="10" width="80" height="8" rx="4" {...L} />
        <circle cx="40" cy="14" r="1.6" fill={GP_RED} />
        <circle cx="80" cy="14" r="1.6" fill={GP_RED} />
      </g>
    );
  } else {
    art = (
      <g>
        <path d="M5 26 Q5 4 60 4 Q115 4 115 26 Z" {...S} />
        <path d="M38 14 l7 -3 M57 11 l7 -3 M78 14 l7 -3" {...R} />
      </g>
    );
  }
  return (
    <svg className="stk-piece" viewBox="0 0 120 28" preserveAspectRatio="none" aria-hidden="true">{art}</svg>
  );
}

export function ClawGlyph() {
  return (
    <svg viewBox="0 0 44 26" width="44" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 2 v4" />
      <path d="M10 6 h24" />
      <path d="M10 6 q-3 8 4 14" />
      <path d="M34 6 q3 8 -4 14" />
    </svg>
  );
}

export function SpeakerGlyph({ muted }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9.5 v5 h4 l5 4 v-13 l-5 4 z" />
      {muted ? (
        <path d="M16.5 9.5 l5 5.5 M21.5 9.5 l-5 5.5" />
      ) : (
        <path d="M16.5 9.5 a4 4 0 0 1 0 5 M19 7.5 a7.5 7.5 0 0 1 0 9" />
      )}
    </svg>
  );
}

export function SketchArrow() {
  return (
    <svg viewBox="0 0 44 56" width="36" height="46" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 52 C 10 38, 14 22, 21 8" />
      <path d="M14 16 l7 -9 7 8" />
    </svg>
  );
}
