import React from 'react';

/* Screen scaffold — themed stage for a page or section group. */
export function Screen({ mobile, label, style, children }) {
  return (
    <section
      className={'cm-screen' + (mobile ? ' pt-mobile' : '')}
      aria-label={label}
      style={style}
    >
      {children}
    </section>
  );
}
