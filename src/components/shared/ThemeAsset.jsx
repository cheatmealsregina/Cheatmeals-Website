import React from 'react';
import { useTheme } from './useTheme.js';

/* Theme-aware raster asset with WebP→PNG→hide fallback.

   `base` is a path stem (no extension/theme): e.g. "/assets/game/backdrop".
   It resolves to "<base>-<theme>.webp", falling back to "<base>-<theme>.png"
   if the WebP is missing or the browser can't decode it, and rendering nothing
   if neither exists. That last step is the graceful stub: until the real art is
   dropped in at these paths, the element simply doesn't appear (no broken-image
   icon, no console error loop) and the build still passes.

   - Decorative by default (alt="" + aria-hidden); pass `alt` for meaningful art.
   - loading="lazy" + decoding="async" so it never blocks first paint, and the
     homepage (which never mounts these) downloads no game art.
   - Pass width/height (or an aspect-ratio box via `style`) to reserve space and
     avoid layout shift when the image arrives. */
export function ThemeAsset({ base, alt = '', width, height, className, style }) {
  const [theme] = useTheme();
  /* 0 = try webp, 1 = try png, 2 = give up (render nothing) */
  const [step, setStep] = React.useState(0);
  React.useEffect(() => { setStep(0); }, [base, theme]);

  if (step >= 2) return null;
  const ext = step === 0 ? 'webp' : 'png';
  const src = `${base}-${theme}.${ext}`;
  return (
    <img
      key={src}
      src={src}
      alt={alt}
      aria-hidden={alt ? undefined : 'true'}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      draggable="false"
      className={className}
      style={style}
      onError={() => setStep((s) => s + 1)}
    />
  );
}
