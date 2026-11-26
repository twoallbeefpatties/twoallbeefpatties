// The assembled Big Mac illustration. Layers come from profile.json in order
// (top to bottom); each kind knows how to draw itself and how much height it
// adds to the stack. Pieces are painted bottom-up so upper layers overlap lower ones.

const r = (n) => Math.round(n * 100) / 100;

// Deterministic pseudo-random numbers so every build draws the same burger.
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

export const DEFS = `<defs>
<linearGradient id="bun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaa64e"/><stop offset=".65" stop-color="#d88a32"/><stop offset="1" stop-color="#b86c20"/></linearGradient>
<linearGradient id="club" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c97a26"/><stop offset=".25" stop-color="#eaa64e"/><stop offset=".75" stop-color="#e29a42"/><stop offset="1" stop-color="#bd7024"/></linearGradient>
<linearGradient id="heel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6a04a"/><stop offset="1" stop-color="#c0752a"/></linearGradient>
<linearGradient id="patty" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b3f28"/><stop offset=".5" stop-color="#4e2c1b"/><stop offset="1" stop-color="#3a2014"/></linearGradient>
</defs>`;

// height = drawn height, adv = how far the next layer starts below this one, w = width
const KINDS = {
  'bun-top': { h: 120, adv: 108, w: 330 },
  patty: { h: 40, adv: 33, w: 344 },
  pickles: { h: 12, adv: 9, w: 330 },
  lettuce: { h: 28, adv: 20, w: 340 },
  onions: { h: 9, adv: 8, w: 320 },
  sauce: { h: 8, adv: 7, w: 330 },
  club: { h: 48, adv: 43, w: 334 },
  cheese: { h: 12, adv: 10, w: 344 },
  heel: { h: 54, adv: 54, w: 334 },
};
const KNOWN = Object.keys(KINDS);

function crown(cx, y, w, h, rand) {
  const x = cx - w / 2;
  const body = `M${r(x)},${r(y + h - 14)}C${r(x - 2)},${r(y + h * 0.18)} ${r(x + w * 0.2)},${r(y)} ${r(cx)},${r(y)}C${r(x + w * 0.8)},${r(y)} ${r(x + w + 2)},${r(y + h * 0.18)} ${r(x + w)},${r(y + h - 14)}Q${r(x + w)},${r(y + h)} ${r(x + w - 14)},${r(y + h)}H${r(x + 14)}Q${r(x)},${r(y + h)} ${r(x)},${r(y + h - 14)}Z`;
  const seeds = [];
  for (let i = 0; i < 48; i++) {
    const a = rand() * Math.PI * 2, d = Math.sqrt(rand());
    const sx = cx + Math.cos(a) * d * w * 0.44;
    const sy = y + h * 0.42 + Math.sin(a) * d * h * 0.36;
    if (sy > y + h * 0.82 || sy < y + 6) continue;
    // keep seeds inside the dome's curve
    const half = (w / 2) * Math.sqrt(Math.max(0, 1 - ((y + h * 0.55 - sy) / (h * 0.55)) ** 2));
    if (Math.abs(sx - cx) > half - 8) continue;
    const rot = Math.round((rand() - 0.5) * 120);
    seeds.push(`<ellipse cx="${r(sx)}" cy="${r(sy)}" rx="4" ry="2" fill="#f8ecd2" opacity=".92" transform="rotate(${rot} ${r(sx)} ${r(sy)})"/>`);
  }
  return `<path d="${body}" fill="url(#bun)"/><path d="M${r(x + w * 0.14)},${r(y + h * 0.5)}C${r(x + w * 0.2)},${r(y + h * 0.2)} ${r(x + w * 0.36)},${r(y + h * 0.1)} ${r(x + w * 0.48)},${r(y + h * 0.09)}" stroke="#f3c37a" stroke-width="7" fill="none" stroke-linecap="round" opacity=".55"/>${seeds.join('')}`;
}

function patty(cx, y, w, h, rand) {
  const x = cx - w / 2, n = 28, step = (w - 16) / n;
  let d = `M${r(x + 8)},${r(y + 4)}`;
  for (let i = 1; i <= n; i++) d += `L${r(x + 8 + i * step)},${r(y + 2 + rand() * 4)}`;
  d += `Q${r(x + w + 2)},${r(y + 4)} ${r(x + w)},${r(y + h / 2)}Q${r(x + w + 2)},${r(y + h - 3)} ${r(x + w - 8)},${r(y + h - 3)}`;
  for (let i = n - 1; i >= 0; i--) d += `L${r(x + 8 + i * step)},${r(y + h - 4 + rand() * 4)}`;
  d += `Q${r(x - 2)},${r(y + h - 3)} ${r(x)},${r(y + h / 2)}Q${r(x - 2)},${r(y + 4)} ${r(x + 8)},${r(y + 4)}Z`;
  const specks = [];
  for (let i = 0; i < 26; i++) {
    const sx = x + 14 + rand() * (w - 28), sy = y + 8 + rand() * (h - 16);
    specks.push(`<circle cx="${r(sx)}" cy="${r(sy)}" r="${r(0.8 + rand() * 1.4)}" fill="${rand() > 0.5 ? '#7a4a30' : '#2e180e'}"/>`);
  }
  return `<path d="${d}" fill="url(#patty)"/>${specks.join('')}`;
}

function lettuce(cx, y, w, h, rand) {
  const x = cx - w / 2 - 16, W = w + 32;
  const frill = (yy, amp, color, inset) => {
    const n = 11, step = (W - inset * 2) / n;
    let d = `M${r(x + inset)},${r(yy + h * 0.45)}`;
    for (let i = 0; i < n; i++) d += `q${r(step / 2)},${r(-amp * (0.6 + rand() * 0.6))} ${r(step)},0`;
    d += `L${r(x + W - inset)},${r(yy + h * 0.55)}`;
    for (let i = 0; i < n; i++) d += `q${r(-step / 2)},${r(amp * (0.7 + rand() * 0.9))} ${r(-step)},0`;
    return `<path d="${d}Z" fill="${color}"/>`;
  };
  // floppy leaf ends hanging past the bun on both sides
  const ends = `<path d="M${r(x + 10)},${r(y + h * 0.4)}q-14,4 -10,${r(h * 0.6)}q8,6 22,-2Z M${r(x + W - 10)},${r(y + h * 0.4)}q14,6 8,${r(h * 0.7)}q-10,4 -22,-4Z" fill="#6fb33c"/>`;
  return ends + frill(y, h * 0.55, '#5d9e2f', 0) + frill(y + 3, h * 0.42, '#86c84e', 8) + `<path d="M${r(x + 24)},${r(y + h * 0.5)}H${r(x + W - 24)}" stroke="#a8dc6e" stroke-width="1.5" stroke-dasharray="14 9" opacity=".7"/>`;
}

function pickles(cx, y, w) {
  // two thin slices peeking out, like the real thing
  const slice = (sx, rx) => `<ellipse cx="${r(sx)}" cy="${r(y + 6)}" rx="${rx}" ry="6" fill="#5f7f1e"/><ellipse cx="${r(sx)}" cy="${r(y + 6)}" rx="${r(rx - 6)}" ry="3.6" fill="#a3c24c"/><circle cx="${r(sx - rx * 0.3)}" cy="${r(y + 6)}" r="1.2" fill="#e4ecb0"/><circle cx="${r(sx + rx * 0.25)}" cy="${r(y + 5)}" r="1.2" fill="#e4ecb0"/>`;
  return slice(cx - w * 0.36, 34) + slice(cx + w * 0.42, 30);
}

function onions(cx, y, w, rand) {
  const bits = [];
  for (let i = 0; i < 34; i++) {
    const bx = cx - w / 2 + 8 + rand() * (w - 16), by = y + rand() * 5;
    const s = 3 + rand() * 3;
    bits.push(`<rect x="${r(bx)}" y="${r(by)}" width="${r(s)}" height="${r(s * 0.8)}" rx="1" fill="${rand() > 0.3 ? '#f4efe4' : '#e3dacb'}" transform="rotate(${Math.round(rand() * 60 - 30)} ${r(bx)} ${r(by)})"/>`);
  }
  return bits.join('');
}

function sauce(cx, y, w) {
  const x = cx - w / 2;
  return `<path d="M${r(x + 6)},${r(y + 2)}H${r(x + w - 6)}Q${r(x + w)},${r(y + 4)} ${r(x + w - 6)},${r(y + 7)}H${r(x + 6)}Q${r(x)},${r(y + 4)} ${r(x + 6)},${r(y + 2)}Z" fill="#e9c08a"/><path d="M${r(x + w * 0.22)},${r(y + 6)}q3,7 6,0Z M${r(x + w * 0.7)},${r(y + 6)}q2.5,6 5,0Z" fill="#e9c08a"/>`;
}

function club(cx, y, w, h) {
  const x = cx - w / 2;
  return `<rect x="${r(x)}" y="${r(y)}" width="${w}" height="${h}" rx="18" fill="url(#club)"/><path d="M${r(x + 22)},${r(y + h * 0.42)}H${r(x + w - 22)}" stroke="#f3c37a" stroke-width="5" stroke-linecap="round" opacity=".5"/>`;
}

function cheese(cx, y, w) {
  const x = cx - w / 2;
  // a square slice laid at an angle: one corner melts down over the front
  return `<path d="M${r(x - 4)},${r(y + 2)}H${r(x + w + 8)}L${r(x + w + 14)},${r(y + 12)}Q${r(x + w * 0.55)},${r(y + 12)} ${r(x + w * 0.42)},${r(y + 14)}L${r(x + w * 0.2)},${r(y + 30)}Q${r(x + w * 0.18)},${r(y + 33)} ${r(x + w * 0.16)},${r(y + 29)}L${r(x + w * 0.1)},${r(y + 12)}H${r(x - 8)}Z" fill="#f7b928"/><path d="M${r(x + w * 0.13)},${r(y + 13)}L${r(x + w * 0.18)},${r(y + 25)}" stroke="#ffd25c" stroke-width="3" stroke-linecap="round" opacity=".6"/>`;
}

function heel(cx, y, w, h) {
  const x = cx - w / 2;
  return `<path d="M${r(x + 10)},${r(y)}H${r(x + w - 10)}Q${r(x + w)},${r(y)} ${r(x + w)},${r(y + 12)}V${r(y + h - 26)}Q${r(x + w)},${r(y + h)} ${r(x + w - 30)},${r(y + h)}H${r(x + 30)}Q${r(x)},${r(y + h)} ${r(x)},${r(y + h - 26)}V${r(y + 12)}Q${r(x)},${r(y)} ${r(x + 10)},${r(y)}Z" fill="url(#heel)"/>`;
}

function draw(kind, cx, y, rand) {
  const { w, h } = KINDS[kind];
  switch (kind) {
    case 'bun-top': return crown(cx, y, w, h, rand);
    case 'patty': return patty(cx, y, w, h, rand);
    case 'lettuce': return lettuce(cx, y, w, h, rand);
    case 'pickles': return pickles(cx, y, w);
    case 'onions': return onions(cx, y, w, rand);
    case 'sauce': return sauce(cx, y, w);
    case 'club': return club(cx, y, w, h);
    case 'cheese': return cheese(cx, y, w);
    case 'heel': return heel(cx, y, w, h);
  }
}

/**
 * Draws the burger with its top at (cx, top), scaled by s.
 * Returns the svg, the full height, and an anchor point per layer for leader lines.
 */
export function burger(layers, cx, top, s = 1) {
  const kinds = layers.map((l) => (KNOWN.includes(l.kind) ? l.kind : 'patty'));
  const ys = [];
  let y = 0;
  for (const k of kinds) { ys.push(y); y += KINDS[k].adv; }
  const last = kinds[kinds.length - 1];
  const height = y - KINDS[last].adv + KINDS[last].h;
  const n = kinds.length;
  const parts = [];
  for (let i = n - 1; i >= 0; i--) {
    const rand = rng(1000 + i * 97);
    const delay = ((n - 1 - i) * 0.09).toFixed(2);
    parts.push(`<g class="drop" style="animation-delay:${delay}s">${draw(kinds[i], 0, ys[i], rand)}</g>`);
  }
  const anchors = kinds.map((k, i) => {
    const { w, h } = KINDS[k];
    const midY = k === 'bun-top' ? ys[i] + h * 0.55 : ys[i] + Math.min(h, KINDS[k].adv + 4) / 2;
    const reach = k === 'lettuce' ? w / 2 + 24 : k === 'pickles' ? w * 0.42 + 30 : w / 2;
    return { right: r(cx + (reach + 4) * s), left: r(cx - (reach + 4) * s), y: r(top + midY * s) };
  });
  return {
    svg: `<g transform="translate(${r(cx)},${r(top)}) scale(${s})">${parts.join('')}</g>`,
    height: height * s,
    anchors,
  };
}

export const SWATCH = {
  'bun-top': '#e09a42', patty: '#4e2c1b', pickles: '#7a9e2e', lettuce: '#86c84e', onions: '#e8e0d0',
  sauce: '#e9c08a', club: '#e09a42', cheese: '#f7b928', heel: '#d08a36',
};
