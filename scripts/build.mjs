// Renders every README tile into dist/, plus README.md and dist/preview.html.
//   npm run build            live stats (needs GITHUB_TOKEN or PROFILE_TOKEN)
//   npm run build -- --demo  fake stats, no token needed (local preview)
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { fontFaces } from './lib/text.mjs';
import { getStats } from './lib/stats.mjs';
import * as tiles from './lib/tiles.mjs';
import { readme, preview } from './lib/readme.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const p = JSON.parse(readFileSync(join(root, 'profile.json'), 'utf8'));
const demo = process.argv.includes('--demo');
const token = demo ? undefined : process.env.PROFILE_TOKEN || process.env.GITHUB_TOKEN;
if (!demo && !token) {
  console.error('No GITHUB_TOKEN / PROFILE_TOKEN set. Run with --demo for a local preview.');
  process.exit(1);
}

const CSS = `.rise{animation:rise .7s cubic-bezier(.2,.7,.2,1) both}.d1{animation-delay:.08s}.d2{animation-delay:.16s}.d3{animation-delay:.24s}.d4{animation-delay:.32s}
.drop{animation:drop .55s cubic-bezier(.3,1.35,.5,1) both}.pulse{animation:pulse 1.6s ease-in-out infinite}
@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes drop{from{opacity:0;transform:translateY(-28px)}to{opacity:1;transform:none}}
@keyframes pulse{50%{opacity:.25}}
@media (prefers-reduced-motion:reduce){.rise,.drop,.pulse{animation:none}}`;

async function svg({ w, h, body, label }) {
  const fonts = await fontFaces(body);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${Math.ceil(h)}" viewBox="0 0 ${w} ${Math.ceil(h)}" role="img" aria-label="${label.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')}"><style>${fonts}${CSS}</style>${body}</svg>\n`;
}

const showNow = Boolean(p.now?.name) && !p.now.name.startsWith('[');

const stats = await getStats(p.login, token);
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const jobs = [];
const put = (name, tile) => jobs.push(svg(tile).then((s) => writeFileSync(join(dist, name), s)));
for (const theme of ['dark', 'light']) {
  for (const size of ['d', 'm']) {
    const sfx = `${size === 'm' ? '-m' : ''}-${theme}.svg`;
    put(`hero${sfx}`, tiles.hero(p, theme, size));
    if (showNow) put(`now${sfx}`, tiles.now(p, theme, size));
    put(`stack${sfx}`, tiles.stack(p, theme, size));
    put(`menu${sfx}`, tiles.menuHeader(p, theme, size));
    p.projects.forEach((pr, i) => put(`card-${String(i + 1).padStart(2, '0')}${sfx}`, tiles.card(pr, i, stats, theme, size)));
    put(`card-all${sfx}`, tiles.cardAll(theme, size, stats.repoCount));
    put(`grill${sfx}`, tiles.grill(stats, theme, size));
    put(`facts${sfx}`, tiles.facts(p, stats, theme, size));
    if (p.details?.length) put(`counter${sfx}`, tiles.counter(p, theme, size));
    put(`footer${sfx}`, tiles.footer(p, theme, size));
  }
  for (const l of p.links.filter((l) => l.url)) put(`btn-${l.id}-${theme}.svg`, tiles.button(l, theme));
}
await Promise.all(jobs);

writeFileSync(join(root, 'README.md'), readme(p));
writeFileSync(join(dist, 'preview.html'), preview(p));
console.log(`Built ${jobs.length} tiles into dist/ (${stats.demo ? 'demo' : 'live'} stats) and README.md`);
