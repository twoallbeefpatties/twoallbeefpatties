// Every README tile. Each function returns { w, h, body, label } for one
// theme ('dark' | 'light') and size ('d' desktop | 'm' mobile).
import { FONTS, measure, wrap, ellipsize, esc, text, r } from './text.mjs';
import { burger, DEFS, SWATCH } from './burger.mjs';

export const THEMES = {
  dark: { ink: '#efe6da', muted: '#b3a796', card: '#1c1713', line: '#3a302a', chip: '#2c241f', accentText: '#f2b33d', grill: ['#221c17', '#5a3a22', '#a8622a', '#e8a13d', '#f6c766'] },
  light: { ink: '#1f1a16', muted: '#5f554b', card: '#faf6f0', line: '#e3d9cc', chip: '#f1e8dc', accentText: '#8f5a00', grill: ['#efe7dc', '#f2d08a', '#e8a13d', '#b5652a', '#5a3220'] },
};
const MUSTARD = '#f2b33d';

// ---------- small drawing helpers ----------
const rr = (x, y, w, h, tl, tr = tl, br = tl, bl = tl) =>
  `M${r(x + tl)},${r(y)}H${r(x + w - tr)}Q${r(x + w)},${r(y)} ${r(x + w)},${r(y + tr)}V${r(y + h - br)}Q${r(x + w)},${r(y + h)} ${r(x + w - br)},${r(y + h)}H${r(x + bl)}Q${r(x)},${r(y + h)} ${r(x)},${r(y + h - bl)}V${r(y + tl)}Q${r(x)},${r(y)} ${r(x + tl)},${r(y)}Z`;
const rect = (x, y, w, h, rx, fill, extra = '') => `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="${rx}" fill="${fill}" ${extra}/>`;
const arrow = (x, y, s, c) =>
  `<path d="M${r(x)},${r(y + s)}L${r(x + s)},${r(y)}M${r(x + s * 0.3)},${r(y)}H${r(x + s)}V${r(y + s * 0.7)}" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const star = (cx, cy, R, c) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? R * 0.45 : R;
    pts.push(`${r(cx + rad * Math.cos(a))},${r(cy + rad * Math.sin(a))}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${c}"/>`;
};
/** One <text> made of differently styled runs: [[str, fontKey, fill], ...] */
const spans = (x, y, size, runs, anchor = 'start', cls = '') =>
  `<text x="${r(x)}" y="${r(y)}" font-size="${size}" text-anchor="${anchor}"${cls ? ` class="${cls}"` : ''}>${runs
    .map(([s, k, fill, sz]) => `<tspan font-family="${esc(FONTS[k].css)}" font-weight="${FONTS[k].weight}" fill="${fill}"${sz ? ` font-size="${sz}"` : ''}>${esc(s)}</tspan>`)
    .join('')}</text>`;
const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('en-US') : n);
const ago = (iso) => {
  if (!iso) return '—';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  if (d < 1) return 'today';
  if (d < 14) return `${d}d ago`;
  if (d < 60) return `${Math.floor(d / 7)}w ago`;
  if (d < 730) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
};

// ---------- tiles ----------
// Shared section header (title, optional caption, rule) so every section reads the same.
function sectionHead(T, size, title, caption) {
  if (size === 'd')
    return { h: 58, svg: text(0, 34, title, 'display', 30, T.ink) + (caption ? text(880, 32, caption, 'body', 13, T.muted, { 'text-anchor': 'end' }) : '') + `<path d="M0,57H880" stroke="${T.line}" stroke-width="2"/>` };
  return { h: 48, svg: text(0, 28, title, 'display', 24, T.ink) + `<path d="M0,47H400" stroke="${T.line}" stroke-width="2"/>` };
}
// Breathing room above a section, baked into the tile (GitHub collapses most HTML spacing).
const SPACE = { d: 44, m: 32 };
function padTop(tile, size, px = SPACE[size]) {
  return { ...tile, h: tile.h + px, body: `<g transform="translate(0,${px})">${tile.body}</g>` };
}

export function hero(p, t, size) {
  const T = THEMES[t];
  if (size === 'd') {
    const W = 880;
    const pill = p.status;
    const pw = measure(pill, 'mono', 12) + 44;
    const blurb = wrap(p.blurb, 'body', 18, 780);
    const by = 262;
    const h = by + (blurb.length - 1) * 29 + 40;
    return {
      w: W, h, label: `${p.headline.join(' ')} ${p.blurb}`,
      body: [
        text(0, 30, p.eyebrow.toUpperCase(), 'bold', 12, T.accentText, { 'letter-spacing': '2.6', class: 'rise' }),
        `<g class="rise d1"><path d="${rr(W - pw, 10, pw, 28, 14)}" fill="none" stroke="${T.line}"/><circle cx="${W - pw + 16}" cy="24" r="4" fill="#5fae3e" class="pulse"/>`,
        text(W - pw + 28, 28, pill, 'mono', 12, T.muted), '</g>',
        text(0, 134, p.headline[0], 'display', 76, T.ink, { 'letter-spacing': '-1.9', class: 'rise d2' }),
        text(0, 208, p.headline[1], 'display', 76, T.ink, { 'letter-spacing': '-1.9', class: 'rise d3' }),
        `<g class="rise d4">${blurb.map((l, i) => text(0, by + i * 29, l, 'body', 18, T.muted)).join('')}</g>`,
      ].join(''),
    };
  }
  const W = 400;
  const head = wrap(p.headline.join(' '), 'display', 44, W - 4);
  const blurb = wrap(p.blurb, 'body', 15, W);
  const hy = 82, by = hy + (head.length - 1) * 44 + 46;
  return {
    w: W, h: by + (blurb.length - 1) * 24 + 34, label: `${p.headline.join(' ')} ${p.blurb}`,
    body: [
      text(0, 22, p.eyebrow.toUpperCase(), 'bold', 11, T.accentText, { 'letter-spacing': '2.2', class: 'rise' }),
      head.map((l, i) => text(0, hy + i * 44, l, 'display', 44, T.ink, { 'letter-spacing': '-1', class: `rise d${i + 1}` })).join(''),
      `<g class="rise d3">${blurb.map((l, i) => text(0, by + i * 24, l, 'body', 15, T.muted)).join('')}</g>`,
    ].join(''),
  };
}

export function button(link, t) {
  const T = THEMES[t];
  const tw = measure(link.label, 'bold', 15);
  const w = tw + 58, h = 44;
  const fill = link.primary ? MUSTARD : 'none';
  const fg = link.primary ? '#14110f' : T.ink;
  return {
    w, h, label: link.label,
    body: `<path d="${rr(1, 1, w - 2, h - 2, 21)}" fill="${fill}" stroke="${link.primary ? MUSTARD : T.line}" stroke-width="2"/>${text(20, 28, link.label, 'bold', 15, fg)}${arrow(20 + tw + 8, 17, 10, fg)}`,
  };
}

export function now(p, t, size) {
  const T = THEMES[t];
  const n = p.now;
  if (size === 'd') {
    const W = 880, h = 72;
    const avail = W - 160 - 110;
    const name = ellipsize(n.name, 'bold', 15, avail);
    const note = ellipsize(` — ${n.note}`, 'body', 15, Math.max(0, avail - measure(name, 'bold', 15)));
    return {
      w: W, h, label: `Now cooking: ${n.name} — ${n.note}`,
      body: `<path d="${rr(1, 1, W - 2, h - 2, 18)}" fill="${T.card}" stroke="${T.line}"/>${text(24, 41, 'NOW COOKING', 'mono', 12, T.accentText)}<circle cx="138" cy="37" r="4" fill="#e8833a" class="pulse"/>${spans(160, 42, 15, [[name, 'bold', T.ink], [note, 'body', T.muted]])}${text(W - 70, 41, 'see it', 'mono', 12, T.muted, { 'text-anchor': 'end' })}${arrow(W - 62, 31, 10, T.muted)}`,
    };
  }
  const W = 400, lines = wrap(n.note, 'body', 14, W - 36, 2);
  const h = 72 + lines.length * 20;
  return {
    w: W, h, label: `Now cooking: ${n.name} — ${n.note}`,
    body: `<path d="${rr(1, 1, W - 2, h - 2, 14)}" fill="${T.card}" stroke="${T.line}"/>${text(18, 30, 'NOW COOKING', 'mono', 11, T.accentText)}<circle cx="114" cy="26" r="3.5" fill="#e8833a" class="pulse"/>${text(18, 54, ellipsize(n.name, 'bold', 15, W - 36), 'bold', 15, T.ink)}${lines.map((l, i) => text(18, 76 + i * 20, l, 'body', 14, T.muted)).join('')}`,
  };
}

/** Spread label blocks vertically: start at their ideal y, push apart, then fit inside [minY, maxY]. */
function spread(items, gap, minY, maxY) {
  items.sort((a, b) => a.ideal - b.ideal);
  let y = minY;
  for (const it of items) { it.y = Math.max(it.ideal - it.h / 2, y); y = it.y + it.h + gap; }
  let over = y - gap - maxY;
  for (let i = items.length - 1; i >= 0 && over > 0; i--) {
    const it = items[i];
    const room = i ? it.y - (items[i - 1].y + items[i - 1].h + gap) : it.y - minY;
    const move = Math.min(over, Math.max(0, room));
    for (let k = i; k < items.length; k++) items[k].y -= move;
    over -= move;
  }
  return items;
}

// Wrap chips as whole units so no line starts with a separator.
function chipLines(chips, size, maxW, maxLines) {
  const lines = [];
  let cur = '';
  for (const c of chips) {
    const next = cur ? `${cur} · ${c}` : c;
    if (!cur || measure(next, 'body', size) <= maxW) cur = next;
    else { lines.push(cur); cur = c; }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = ellipsize(lines[maxLines - 1] + ' …', 'body', size, maxW); }
  return lines.map((l) => (measure(l, 'body', size) > maxW ? ellipsize(l, 'body', size, maxW) : l));
}

export function stack(p, t, size) {
  const T = THEMES[t];
  const out = [DEFS];
  const label = `What's in it: ${p.layers.map((L) => `${L.layer} — ${L.what}: ${(L.chips ?? []).join(', ')}`).join('; ')}`;
  if (size === 'd') {
    const W = 880, cx = 440, colW = 212, top = 92;
    out.push(sectionHead(T, size, "What's in it", 'ten layers, crown to heel').svg);
    const b = burger(p.layers, cx, top, 1);
    const blocks = p.layers.map((L, i) => {
      const side = i % 2 ? 'left' : 'right';
      const items = chipLines(L.chips ?? [], 12.5, colW, 3);
      return { L, i, side, items, h: 20 + 18 + items.length * 17, ideal: b.anchors[i].y };
    });
    const maxY = top + b.height + 10;
    const placed = [...spread(blocks.filter((x) => x.side === 'left'), 14, top - 6, maxY), ...spread(blocks.filter((x) => x.side === 'right'), 14, top - 6, maxY)];
    for (const k of placed) {
      const a = b.anchors[k.i];
      const right = k.side === 'right';
      const tx = right ? W - colW : colW, anchor = right ? 'start' : 'end';
      const ly = k.y + 12;
      const ax = right ? a.right : a.left;
      const elbow = right ? W - colW - 22 : colW + 22;
      out.push(`<g class="rise" style="animation-delay:${(0.5 + k.i * 0.05).toFixed(2)}s">`);
      out.push(`<path d="M${ax},${a.y}H${r(right ? Math.max(ax + 8, elbow - 18) : Math.min(ax - 8, elbow + 18))}L${elbow},${r(ly - 4)}H${r(right ? tx - 8 : tx + 8)}" fill="none" stroke="${T.muted}" stroke-opacity=".55" stroke-width="1.2"/>`);
      out.push(`<circle cx="${ax}" cy="${a.y}" r="2.5" fill="${T.muted}"/>`);
      const dotX = right ? tx + 5 : tx - 5;
      out.push(`<circle cx="${dotX}" cy="${r(ly - 4.5)}" r="5" fill="${SWATCH[k.L.kind] ?? MUSTARD}" stroke="${T.line}"/>`);
      out.push(text(right ? tx + 16 : tx - 16, ly, k.L.layer, 'bold', 15, T.ink, { 'text-anchor': anchor }));
      out.push(text(tx, ly + 19, k.L.what, 'body', 13, T.accentText, { 'text-anchor': anchor }));
      k.items.forEach((line, j) => out.push(text(tx, ly + 38 + j * 17, line, 'body', 12.5, T.muted, { 'text-anchor': anchor })));
      out.push('</g>');
    }
    out.push(b.svg);
    const bottom = Math.max(top + b.height, ...placed.map((k) => k.y + k.h));
    return padTop({ w: W, h: bottom + 16, label, body: out.join('') }, size, 28);
  }
  const W = 400;
  out.push(sectionHead(T, size, "What's in it").svg);
  const b = burger(p.layers, W / 2, 72, 0.86);
  out.push(b.svg);
  let y = 72 + b.height + 36;
  const cw = (W - 12) / 2;
  p.layers.forEach((L, i) => {
    const x = (i % 2) * (cw + 12), ry = y + Math.floor(i / 2) * 48;
    out.push(`<g class="rise" style="animation-delay:${(0.5 + i * 0.05).toFixed(2)}s">`);
    out.push(`<circle cx="${x + 6}" cy="${ry - 5}" r="5" fill="${SWATCH[L.kind] ?? MUSTARD}" stroke="${T.line}"/>`);
    out.push(text(x + 18, ry, ellipsize(L.layer, 'bold', 14, cw - 18), 'bold', 14, T.ink));
    out.push(text(x + 18, ry + 18, ellipsize(L.short ?? L.what, 'body', 12, cw - 18), 'body', 12, T.muted));
    out.push('</g>');
  });
  y += Math.ceil(p.layers.length / 2) * 48 - 14;
  return padTop({ w: W, h: y, label, body: out.join('') }, size, 20);
}

export function menuHeader(p, t, size) {
  const T = THEMES[t];
  const hd = sectionHead(T, size, 'The menu', 'pick a number · each item opens its repo');
  return padTop({ w: size === 'd' ? 880 : 400, h: hd.h, label: 'The menu', body: hd.svg }, size);
}

// One menu-board row per project: combo number, name, description, dotted leader, "price".
function menuRow(t, size, { num, name, tag, desc, lang, sub }) {
  const T = THEMES[t];
  const dots = (x1, x2, y) => (x2 - x1 > 20 ? `<path d="M${r(x1)},${y}H${r(x2)}" stroke="${T.muted}" stroke-opacity=".5" stroke-width="2" stroke-linecap="round" stroke-dasharray="0.1 7"/>` : '');
  const badge = (cx, cy, R, fs) => `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${MUSTARD}"/>${text(cx, cy + fs * 0.36, num, 'display', fs, '#14110f', { 'text-anchor': 'middle' })}`;
  if (size === 'd') {
    const W = 880, H = 88, nx = 76;
    const nameW = measure(name, 'bold', 19);
    const tagW = tag ? measure(tag, 'bold', 10, 0.5) + 14 : 0;
    const priceW = lang ? measure(lang, 'display', 17) : 0;
    const out = [badge(26, 40, 26, 24), text(nx, 34, name, 'bold', 19, T.ink)];
    let lx = nx + nameW + 10;
    if (tag) { out.push(`<path d="${rr(lx, 20, tagW, 18, 9)}" fill="none" stroke="${T.line}" stroke-width="1.5"/>`, text(lx + 7, 33, tag, 'bold', 10, T.muted, { 'letter-spacing': '0.5' })); lx += tagW + 8; }
    const px = W - 44;
    out.push(dots(lx + 6, px - priceW - 12, 29));
    if (lang) out.push(text(px, 35, lang, 'display', 17, T.accentText, { 'text-anchor': 'end' }));
    out.push(`<circle cx="${W - 14}" cy="29" r="13" fill="none" stroke="${T.line}" stroke-width="1.5"/>`, arrow(W - 18.5, 24.5, 9, T.ink));
    out.push(text(nx, 60, ellipsize(desc, 'body', 14, 560), 'body', 14, T.muted));
    if (sub) out.push(text(px, 60, sub, 'body', 13, T.muted, { 'text-anchor': 'end' }));
    out.push(`<path d="M0,${H - 1}H${W}" stroke="${T.line}" stroke-width="1"/>`);
    return { w: W, h: H, label: `${num}. ${name}: ${desc}`, body: out.join('') };
  }
  const W = 400, nx = 54;
  const lines = wrap(desc, 'body', 13, W - nx - 34, 2);
  const H = 58 + lines.length * 18 + 24;
  const meta = [lang, sub].filter(Boolean).join('  ·  ');
  const out = [badge(20, 30, 20, 19), text(nx, 30, ellipsize(name, 'bold', 16, W - nx - 34), 'bold', 16, T.ink)];
  out.push(`<circle cx="${W - 12}" cy="25" r="11" fill="none" stroke="${T.line}" stroke-width="1.5"/>`, arrow(W - 15.5, 21.5, 7, T.ink));
  lines.forEach((l, k) => out.push(text(nx, 52 + k * 18, l, 'body', 13, T.muted)));
  if (meta) out.push(text(nx, 52 + lines.length * 18 + 6, meta, 'bold', 12, T.accentText));
  out.push(`<path d="M0,${H - 1}H${W}" stroke="${T.line}" stroke-width="1"/>`);
  return { w: W, h: H, label: `${num}. ${name}: ${desc}`, body: out.join('') };
}

export function card(proj, i, stats, t, size) {
  const live = stats.repos[proj.repo.toLowerCase()];
  const info = live ?? (stats.demo ? { stars: i % 2 ? 0 : 12, pushedAt: new Date(Date.now() - (i * 40 + 3) * 864e5).toISOString(), language: ['PowerShell', 'TypeScript', 'TypeScript', 'Python', null][i] } : {});
  const fresh = info.pushedAt && Date.now() - new Date(info.pushedAt).getTime() < 60 * 864e5;
  const sub = [info.stars > 0 ? `★ ${fmt(info.stars)}` : '', fresh ? `updated ${ago(info.pushedAt)}` : ''].filter(Boolean).join('  ·  ');
  return menuRow(t, size, { num: String(i + 1), name: proj.name, tag: proj.tag?.toUpperCase(), desc: proj.desc, lang: info.language ?? '', sub });
}

export function cardAll(t, size, count) {
  return menuRow(t, size, { num: '+', name: 'Full menu', tag: '', desc: 'Everything else on the grill: every public repo.', lang: 'see all', sub: count ? `${count} repos` : '' });
}

export function grill(stats, t, size) {
  const T = THEMES[t];
  const weeksWanted = size === 'd' ? 53 : 26;
  const days = stats.days;
  const offset = new Date(days[0].date + 'T00:00:00Z').getUTCDay();
  const cols = [], firstDate = [];
  days.forEach((d, i) => {
    const c = Math.floor((i + offset) / 7);
    (cols[c] ??= [])[(i + offset) % 7] = d.contributionCount;
    firstDate[c] ??= d.date;
  });
  const weeks = cols.slice(-weeksWanted);
  const weekDates = firstDate.slice(-weeksWanted);
  const nz = days.map((d) => d.contributionCount).filter((v) => v > 0).sort((a, b) => a - b);
  const q = (f) => nz[Math.floor(f * (nz.length - 1))] ?? 1;
  const cuts = [q(0.25), q(0.5), q(0.75)];
  const level = (v) => (!v ? 0 : v <= cuts[0] ? 1 : v <= cuts[1] ? 2 : v <= cuts[2] ? 3 : 4);
  const W = size === 'd' ? 880 : 400, pad = size === 'd' ? 18 : 14, gap = 3;
  const hd = sectionHead(T, size, 'Grill marks', `${fmt(stats.contributions)} contributions in the last year`);
  const head = hd.h + 18;
  const cell = (W - pad * 2 - gap * (weeks.length - 1)) / weeks.length;
  const gridH = cell * 7 + gap * 6;
  const monthH = 18;
  const cardH = pad + monthH + gridH + 34;
  const out = [];
  out.push(hd.svg);
  out.push(`<path d="${rr(1, head + 1, W - 2, cardH - 2, 16)}" fill="${T.card}" stroke="${T.line}"/>`);
  weeks.forEach((wk, c) => {
    for (let d = 0; d < 7; d++) {
      const v = wk?.[d];
      if (v === undefined) continue;
      out.push(rect(pad + c * (cell + gap), head + pad + monthH + d * (cell + gap), cell, cell, 2, T.grill[level(v)]));
    }
  });
  let lastX = -99, lastM = '';
  weekDates.forEach((iso, c) => {
    const m = new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    const x = pad + c * (cell + gap);
    if (m !== lastM && c > 0 && x - lastX > 30 && x < W - pad - 20) { out.push(text(x, head + pad + 10, m, 'body', 11, T.muted)); lastX = x; }
    lastM = m;
  });
  const ly = head + pad + monthH + gridH + 22;
  const legendX = W - pad - 5 * 14 - 64;
  out.push(text(size === 'd' ? pad : pad, ly, size === 'd' ? 'each square is a day on the grill' : `last 26 weeks · ${fmt(stats.contributions)} this year`, 'body', 11, T.muted));
  out.push(text(legendX - 6, ly, 'raw', 'body', 11, T.muted, { 'text-anchor': 'end' }));
  T.grill.forEach((g, k) => out.push(rect(legendX + k * 14, ly - 10, 11, 11, 2, g)));
  out.push(text(legendX + 5 * 14 + 2, ly, 'well done', 'body', 11, T.muted));
  const st = strip(stats, T, size, head + cardH + 12);
  out.push(st.svg);
  return padTop({ w: W, h: head + cardH + 12 + st.h, label: `Contribution graph: ${stats.contributions} contributions in the last year. ${st.label}`, body: out.join('') }, size);
}

function nutrition(x0, y0, w, stats) {
  const ink = '#111', paper = '#f6f1e8';
  const rows = [
    ['Contributions', fmt(stats.contributions)],
    ['PRs merged', fmt(stats.prsMerged)],
    ['Issues closed', fmt(stats.issuesClosed)],
    ['Current streak', `${stats.currentStreak}d`],
    ['Longest streak', `${stats.longestStreak}d`],
    ['Top language', stats.topLanguage],
    ['Repos served', fmt(stats.repoCount)],
  ];
  const x = x0 + 16, R = x0 + w - 16;
  const o = [`<rect x="${x0 + 1.5}" y="${y0 + 1.5}" width="${w - 3}" height="0" fill="${paper}" stroke="${ink}" stroke-width="3" id="nf"/>`];
  let y = y0 + 46;
  o.push(text(x, y, 'Nutrition Facts', 'display', 31, ink));
  o.push(text(x, (y += 20), 'Servings per year: 365', 'body', 12, ink));
  o.push(text(x, (y += 18), 'Serving size: 1 GitHub year', 'bold', 13, ink));
  o.push(rect(x, (y += 8), w - 32, 9, 0, ink));
  o.push(text(x, (y += 34), 'Commits', 'bold', 20, ink), text(R, y + 1, fmt(stats.commits), 'display', 26, ink, { 'text-anchor': 'end' }));
  o.push(rect(x, (y += 10), w - 32, 5, 0, ink));
  for (const [k, v] of rows) {
    o.push(text(x, (y += 19), k, 'bold', 13, ink), text(R, y, ellipsize(v, 'bold', 13, 120), 'bold', 13, ink, { 'text-anchor': 'end' }));
    o.push(rect(x, (y += 7), w - 32, 1, 0, ink));
  }
  o.push(text(x, (y += 18), '* Refreshed daily by GitHub Action.', 'body', 10, '#333'));
  o.push(text(x, (y += 14), stats.demo ? '  (demo numbers — local preview)' : '  Not a significant source of sleep.', 'body', 10, '#333'));
  const h = y + 14 - y0;
  o[0] = `<rect x="${x0 + 1.5}" y="${y0 + 1.5}" width="${w - 3}" height="${h - 3}" fill="${paper}" stroke="${ink}" stroke-width="3"/>`;
  return { svg: o.join(''), h };
}

// Three small "order tickets" under the grill: recent activity, best day, top language.
function strip(stats, T, size, y0) {
  const last = stats.days.slice(-30);
  const counts = last.map((d) => d.contributionCount);
  const total = counts.reduce((a, v) => a + v, 0);
  const best = stats.days.reduce((m, d) => (d.contributionCount > m.contributionCount ? d : m), stats.days[0]);
  const day = (iso) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const max = Math.max(1, ...counts);
  const label = `Last 30 days: ${total} contributions. Best day: ${best.contributionCount} on ${day(best.date)}. Top language: ${stats.topLanguage}.`;
  const tile = (x, y, w, h, kicker, big, sub, extra = '') =>
    `<path d="${rr(x + 0.5, y + 0.5, w - 1, h - 1, 14)}" fill="${T.card}" stroke="${T.line}"/>` +
    text(x + 18, y + 28, kicker, 'mono', 11, T.accentText, { 'letter-spacing': '0.5' }) +
    (() => { let fs = 30; while (fs > 18 && measure(big, 'display', fs) > w - 36) fs -= 2; return text(x + 18, y + 70, ellipsize(big, 'display', fs, w - 36), 'display', fs, T.ink); })() +
    text(x + 18, y + 94, ellipsize(sub, 'body', 12, w - 36), 'body', 12, T.muted) + extra;
  const bars = (x, y, w, h) => {
    const bw = (w - 29 * 2) / 30;
    return counts.map((v, i) => {
      const bh = Math.max(3, (v / max) * h);
      return rect(x + i * (bw + 2), y + h - bh, bw, bh, 1.5, v ? '#e8a13d' : T.chip);
    }).join('');
  };
  const bestSub = best.contributionCount ? `on ${day(best.date)} · busiest day of the year` : 'nothing on the grill yet';
  if (size === 'd') {
    const g = 12, w = (880 - g * 2) / 3, h = 116;
    const svg = [
      tile(0, y0, w, h, 'LAST 30 DAYS', fmt(total), total === 1 ? 'contribution' : 'contributions', bars(w - 18 - 118, y0 + 40, 118, 52)),
      tile(w + g, y0, w, h, 'BEST DAY', fmt(best.contributionCount), bestSub),
      tile((w + g) * 2, y0, w, h, 'TOP LANGUAGE', stats.topLanguage, `by code size · ${fmt(stats.repoCount)} public repos`),
    ].join('');
    return { svg, h, label };
  }
  const g = 10, w2 = (400 - g) / 2, h = 104;
  const svg = [
    tile(0, y0, 400, h, 'LAST 30 DAYS', fmt(total), total === 1 ? 'contribution' : 'contributions', bars(400 - 18 - 170, y0 + 36, 170, 52)),
    tile(0, y0 + h + g, w2, h, 'BEST DAY', fmt(best.contributionCount), best.contributionCount ? `on ${day(best.date)}` : '—'),
    tile(w2 + g, y0 + h + g, w2, h, 'TOP LANGUAGE', stats.topLanguage, `${fmt(stats.repoCount)} public repos`),
  ].join('');
  return { svg, h: h * 2 + g, label };
}

// A small mustard check, drawn so it doesn't depend on font glyphs.
const check = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="9" fill="${MUSTARD}"/><path d="M${cx - 4},${cy}l3,3l5,-6" fill="none" stroke="#14110f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;

// The specials as a menu board: numbered lines with dotted leaders, spread to fill the height.
function specialsBoard(x, y, w, h, items, T, size) {
  const d = size === 'd';
  const o = [`<path d="${rr(x + 0.5, y + 0.5, w - 1, h - 1, 16)}" fill="${T.card}" stroke="${T.line}"/>`];
  o.push(text(x + 22, y + 34, "TODAY'S SPECIALS", 'mono', 11, T.accentText, { 'letter-spacing': '0.5' }));
  o.push(text(x + w - 22, y + 34, 'served all day', 'mono', 11, T.muted, { 'text-anchor': 'end' }));
  o.push(`<path d="M${x + 22},${y + 50}H${x + w - 22}" stroke="${T.line}"/>`);
  const top = y + 50, bot = y + h - 10, step = (bot - top) / items.length;
  const fs = d ? 17 : 15;
  items.forEach((it, i) => {
    const cy = top + step * (i + 0.5);
    const num = String(i + 1).padStart(2, '0');
    const name = ellipsize(it, 'bold', fs, w - 44 - 34 - 60);
    const nx = x + 22 + 34;
    const lx = nx + measure(name, 'bold', fs) + 12, rx = x + w - 22 - 30;
    o.push(text(x + 22, cy + 5, num, 'mono', 12, T.accentText));
    o.push(text(nx, cy + 6, name, 'bold', fs, T.ink));
    if (rx > lx) o.push(`<path d="M${lx},${cy + 4}H${rx}" stroke="${T.muted}" stroke-width="1.5" stroke-dasharray="1 5" stroke-linecap="round" opacity=".55"/>`);
    o.push(check(x + w - 22 - 9, cy));
  });
  return o.join('');
}

export function facts(p, stats, t, size) {
  const T = THEMES[t];
  const hd = sectionHead(T, size, 'House specials', 'what I bring to the table');
  const out = [hd.svg];
  const y0 = hd.h + 18;
  if (size === 'd') {
    const nf = nutrition(0, y0, 330, stats);
    const x = 354;
    out.push(nf.svg, specialsBoard(x, y0, 880 - x, nf.h, p.specials, T, size));
    return padTop({ w: 880, h: y0 + nf.h, label: `House specials: ${p.specials.join(', ')}. ${nfLabel(stats)}`, body: out.join('') }, size);
  }
  const W = 400;
  const bh = 64 + p.specials.length * 44;
  out.push(specialsBoard(0, y0, W, bh, p.specials, T, size));
  const nf = nutrition(0, y0 + bh + 16, W, stats);
  out.push(nf.svg);
  return padTop({ w: W, h: y0 + bh + 16 + nf.h, label: `House specials: ${p.specials.join(', ')}. ${nfLabel(stats)}`, body: out.join('') }, size);
}

// Header for the expandable <details> section (they're native HTML, so the header is a tile).
export function counter(p, t, size) {
  const T = THEMES[t];
  const hd = sectionHead(T, size, 'Behind the counter', 'click a line to open it');
  return padTop({ w: size === 'd' ? 880 : 400, h: hd.h + 6, label: 'Behind the counter', body: hd.svg }, size);
}
const nfLabel = (s) => `Stats: ${s.commits} commits, ${s.contributions} contributions, ${s.prsMerged} PRs merged, ${s.issuesClosed} issues closed, current streak ${s.currentStreak} days, longest ${s.longestStreak} days, top language ${s.topLanguage}, ${s.repoCount} public repos`;

export function footer(p, t, size) {
  const T = THEMES[t];
  const W = size === 'd' ? 880 : 400;
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return padTop({
    w: W, h: 44, label: `Made to order. Refreshed ${date}.`,
    body: `<path d="M0,10H${W}" stroke="${T.line}" stroke-width="2" stroke-dasharray="6 6"/>${text(0, 36, `made to order · refreshed ${date}`, 'mono', 12, T.muted)}${size === 'd' ? text(W, 36, p.login, 'mono', 12, T.muted, { 'text-anchor': 'end' }) : ''}`,
  }, size, 24);
}
