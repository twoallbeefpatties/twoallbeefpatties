// Text measuring, wrapping and font embedding for the SVG tiles.
// SVG has no automatic line wrapping, so widths are measured with the real
// font files, and each tile embeds only the glyphs it uses.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import subsetFont from 'subset-font';

const require = createRequire(import.meta.url);
const fontkit = require('fontkit');

const file = (pkg, name) => require.resolve(`@fontsource/${pkg}/files/${name}`);

export const FONTS = {
  display: { family: 'BM Display', css: "'BM Display', 'Archivo Black', Impact, sans-serif", weight: 400, path: file('archivo-black', 'archivo-black-latin-400-normal.woff2') },
  body: { family: 'BM Sans', css: "'BM Sans', Inter, 'Segoe UI', sans-serif", weight: 400, path: file('inter', 'inter-latin-400-normal.woff2') },
  bold: { family: 'BM Sans', css: "'BM Sans', Inter, 'Segoe UI', sans-serif", weight: 800, path: file('inter', 'inter-latin-800-normal.woff2') },
  mono: { family: 'BM Mono', css: "'BM Mono', 'JetBrains Mono', Consolas, monospace", weight: 500, path: file('jetbrains-mono', 'jetbrains-mono-latin-500-normal.woff2') },
};

const loaded = {};
const font = (key) => (loaded[key] ??= fontkit.openSync(FONTS[key].path));

/** Width in px of `text` set in font `key` at `size`, with optional letter spacing. */
export function measure(text, key, size, spacing = 0) {
  const f = font(key);
  const run = f.layout(String(text));
  return (run.advanceWidth / f.unitsPerEm) * size + spacing * [...String(text)].length;
}

/** Greedy word wrap. Returns an array of lines no wider than maxW (unless one word is). */
export function wrap(text, key, size, maxW, maxLines = Infinity) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (line && measure(next, key, size) > maxW) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = ellipsize(lines.slice(maxLines - 1).join(' '), key, size, maxW);
    return kept;
  }
  return lines;
}

/** Cut text with an ellipsis so it fits maxW. */
export function ellipsize(text, key, size, maxW) {
  if (measure(text, key, size) <= maxW) return text;
  let t = String(text);
  while (t.length > 1 && measure(`${t}…`, key, size) > maxW) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** <text> element. `key` picks the font; extra attrs pass through. */
export function text(x, y, str, key, size, fill, attrs = {}) {
  const f = FONTS[key];
  const extra = Object.entries(attrs)
    .map(([k, v]) => `${k}="${esc(v)}"`)
    .join(' ');
  return `<text x="${r(x)}" y="${r(y)}" font-family="${esc(f.css)}" font-weight="${f.weight}" font-size="${size}" fill="${fill}" ${extra}>${esc(str)}</text>`;
}

export const r = (n) => Math.round(n * 100) / 100;

const cache = new Map();
/** @font-face rules for the fonts a tile uses, subset to the characters in it. */
export async function fontFaces(svgBody) {
  const plain = svgBody.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  const chars = [...new Set(plain + '0123456789')].join('');
  const rules = [];
  for (const key of Object.keys(FONTS)) {
    const f = FONTS[key];
    if (!svgBody.includes(`'${f.family}'`) || !svgBody.includes(`font-weight="${f.weight}"`)) continue;
    const id = `${key}:${chars}`;
    if (!cache.has(id)) {
      const buf = await subsetFont(readFileSync(f.path), chars, { targetFormat: 'woff2' });
      cache.set(id, buf.toString('base64'));
    }
    rules.push(`@font-face{font-family:'${f.family}';font-weight:${f.weight};src:url(data:font/woff2;base64,${cache.get(id)}) format('woff2')}`);
  }
  return rules.join('');
}
