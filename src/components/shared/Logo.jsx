import React from 'react';

/* Theme-aware logo lockups — strokes inherit currentColor, knockout
   counters paint with --cm-logo-counter (transparent by default). */
export function Logo({ variant = 'horizontal', height = 40, counter, label }) {
  const svg = (window.CM_LOGOS && window.CM_LOGOS[variant]) || '';
  const style = { height };
  if (counter) style['--cm-logo-counter'] = counter;
  return (
    <span
      className="pt-logo"
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
