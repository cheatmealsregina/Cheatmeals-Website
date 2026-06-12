// One-off: builds public/scripts/logos.js from the DS logo SVGs,
// making them theme-aware (currentColor strokes, counter token).
import { readFileSync, writeFileSync } from 'fs';

const base = new URL('../public/assets/logos/', import.meta.url);

function load(name) {
  let svg = readFileSync(new URL(name, base), 'utf8');
  svg = svg.replace(/<\?xml[^>]*\?>\s*/, '');
  const viewBox = (svg.match(/viewBox="([^"]+)"/) || [])[1];
  let body = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();
  // theme-aware fills: black ink -> currentColor, white counters -> counter token
  body = body
    .replace(/fill="#000000"/gi, 'fill="currentColor"')
    .replace(/fill="#000"/gi, 'fill="currentColor"')
    .replace(/fill="#FFFFFF"/gi, 'fill="var(--cm-logo-counter, transparent)"')
    .replace(/fill="#FFF"/gi, 'fill="var(--cm-logo-counter, transparent)"')
    .replace(/fill="#FDFBFB"/gi, 'fill="var(--cm-logo-counter, transparent)"')
    .replace(/fill="#FB0202"/gi, 'fill="#FB0403"');
  // drop any full-canvas background rect/path that just paints the artboard
  return { viewBox, body };
}

const logos = {
  horizontal: load('cheatmeals-horizontal.svg'),
  primary: load('cheatmeals-primary.svg'),
  icon: load('cheatmeals-icon.svg'),
};

const out =
  '/* CheatMeals logo SVGs — theme-aware: ink = currentColor, counters use\n' +
  '   var(--cm-logo-counter), brand red #FB0403 hard-coded. Generated from\n' +
  '   the design-system logo assets. */\n' +
  'window.CM_LOGOS = ' +
  JSON.stringify(
    Object.fromEntries(
      Object.entries(logos).map(([k, v]) => [
        k,
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + v.viewBox + '" aria-hidden="true">' + v.body + '</svg>',
      ])
    ),
    null,
    2
  ) +
  ';\n';

writeFileSync(new URL('../public/scripts/logos.js', import.meta.url), out);
console.log('logos.js written:', Object.entries(logos).map(([k, v]) => k + '=' + v.viewBox).join(' | '));
