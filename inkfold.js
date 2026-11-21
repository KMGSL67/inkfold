/* Inkfold website. Plain JavaScript, no libraries, no network requests. */
(() => {
  'use strict';

  /* ══════════════════════════════════════════════════════════════════════
     THE ONE PLACE ON THE WEBSITE WHERE THE REPOSITORY ADDRESS LIVES.
     It is filled in (the public downloads repository). If that repository
     is ever renamed or moved, change this one line.
     Every download, GitHub and "Report a problem" link on the page is built
     from this one line.
     (README.md has its own single block of links at the bottom.)
     ══════════════════════════════════════════════════════════════════════ */
  const REPO_URL = 'https://github.com/KMGSL67/inkfold';

  const LINKS = {
    releases: REPO_URL + '/releases/latest',
    repo: REPO_URL,
    issues: REPO_URL + '/issues',
  };

  /* ══════════════════════════════════════════════════════════════════════
     TRANSLATIONS. English lives in index.html. To add another language,
     add an entry here keyed by language code; each key matches a data-i18n,
     data-i18n-aria or data-i18n-content attribute in the HTML. The page uses
     the entry that matches <html lang> or ?lang=xx. Nothing is translated yet.
       de: { 'cta.download': 'Für Windows herunterladen', … }
     ══════════════════════════════════════════════════════════════════════ */
  const TRANSLATIONS = {};

  // The inks offered in the live demo, with the app's colour names. They are read out by screen readers;
  // add 'colour.<name>' keys (lower case, spaces as hyphens) to translate them.
  const PEN_COLOURS = [['#2E2F36', 'Charcoal'], ['#3F62C4', 'Blue'], ['#D2534B', 'Red'], ['#1E8E3E', 'Green'], ['#7B3FE4', 'Purple'], ['#E8710A', 'Orange'], ['#0E8F8F', 'Teal'], ['#1C1C1E', 'Black']];
  const HL_COLOURS = [['#FFE14D', 'Yellow'], ['#FFBE6B', 'Orange'], ['#FF9EC7', 'Pink'], ['#C9B1FF', 'Purple'], ['#8FD3FF', 'Light blue'], ['#7FE3D4', 'Turquoise'], ['#9BE28A', 'Green'], ['#C8F06A', 'Lime']];
  // The app's 24 pen colours, in the app's order, shown in the palette of the animated editor.
  const PALETTE = '1C1C1E 2E2F36 6B6B70 9A9AA0 5B3A29 8B5E3C 0B2A6F 1F4FD8 3F62C4 2E9BE6 0F766E 0E8F8F 14532D 1E8E3E 6BAA1F E3B505 E8710A F28B82 A61B1B D93025 D6409F D2534B 7B3FE4 4C1D95'.split(' ');

  const root = document.documentElement;
  root.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const DPR = () => Math.min(2.5, window.devicePixelRatio || 1);

  /* ── links and language ─────────────────────────────────────────────── */

  $$('[data-link]').forEach((a) => { const url = LINKS[a.dataset.link]; if (url) a.setAttribute('href', url); });

  const dict = TRANSLATIONS[new URLSearchParams(location.search).get('lang') || root.lang] || null;
  const tr = (key, fallback) => (dict && dict[key] != null ? dict[key] : fallback);
  if (dict) {
    $$('[data-i18n]').forEach((el) => { const s = dict[el.dataset.i18n]; if (s != null) el.innerHTML = s; });
    $$('[data-i18n-aria]').forEach((el) => { const s = dict[el.dataset.i18nAria]; if (s != null) { el.setAttribute('aria-label', s); if (el.title) el.title = s; } });
    $$('[data-i18n-content]').forEach((el) => { const s = dict[el.dataset.i18nContent]; if (s != null) el.setAttribute('content', s); });
  }

  /* ══════════════════════════════════════════════════════════════════════
     THE INK ENGINE
     A stroke is not a line with a width. It is a closed shape: the outline
     of where the pen tip has been, wider where the hand pressed or slowed
     down, with round joins, round caps and tapered ends. Written for this
     site; every stroke on the page (yours and the animated ones) uses it.
     ══════════════════════════════════════════════════════════════════════ */

  function arc(cx, cy, fx, fy, dx, dy, steps) {
    // Points on a half circle around (cx, cy), starting after (fx, fy) and bulging towards (dx, dy).
    const vx = fx - cx, vy = fy - cy;
    const s = (-vy * dx + vx * dy) >= 0 ? 1 : -1;
    const out = [];
    for (let k = 1; k < steps; k++) {
      const a = s * Math.PI * k / steps, c = Math.cos(a), sn = Math.sin(a);
      out.push({ x: cx + vx * c - vy * sn, y: cy + vx * sn + vy * c });
    }
    return out;
  }

  function outline(input, o) {
    const size = o.size, thin = o.thinning == null ? 0.6 : o.thinning;
    const follow = 0.15 + (1 - (o.streamline == null ? 0.5 : o.streamline)) * 0.85;
    if (!input.length) return [];

    // 1. Streamline: each point is pulled only part of the way to the raw input, which removes jitter.
    const P = [];
    let px = input[0].x, py = input[0].y, run = 0;
    P.push({ x: px, y: py, p: input[0].p == null ? 0.5 : input[0].p, d: 0, run: 0, vx: 1, vy: 0 });
    for (let i = 1; i < input.length; i++) {
      const q = input[i], last = i === input.length - 1;
      const f = last ? 1 : follow;
      const x = px + (q.x - px) * f, y = py + (q.y - py) * f;
      const d = Math.hypot(x - px, y - py);
      if (d < 0.4 && !last) continue;
      if (d < 1e-3) continue;
      run += d;
      P.push({ x, y, p: q.p == null ? 0.5 : q.p, d, run, vx: (x - px) / d, vy: (y - py) / d });
      px = x; py = y;
    }
    const n = P.length;
    if (n === 1 || run < size * 0.25) {                      // a dot
      const r = Math.max(1, size * 0.5 * (o.simulate ? 0.8 : 0.4 + P[0].p * 0.7));
      const dot = [];
      for (let k = 0; k < 14; k++) dot.push({ x: P[0].x + Math.cos(k / 14 * 6.2832) * r, y: P[0].y + Math.sin(k / 14 * 6.2832) * r });
      return dot;
    }
    P[0].vx = P[1].vx; P[0].vy = P[1].vy;

    // 2. Radius at every point, from pressure (real, or simulated from speed) and the tapers.
    const total = run, tS = Math.min(o.taperStart || 0, total * 0.5), tE = Math.min(o.taperEnd || 0, total * 0.5);
    let pr = o.simulate ? 0.35 : P[0].p;
    for (const q of P) {
      const sp = Math.min(1, q.d / size);
      if (o.simulate) pr = clamp(pr + (Math.min(1, 1 - sp) - pr) * sp * 0.32, 0.22, 1);   // a fast hand thins the line, but never to a hair
      else pr += (q.p - pr) * 0.45;
      let r = size * (0.5 - thin * (0.5 - pr));
      if (tS && q.run < tS) { const t = q.run / tS; r *= Math.max(0.12, t * (2 - t)); }
      if (tE && total - q.run < tE) { const t = (total - q.run) / tE; r *= Math.max(0.06, t * (2 - t)); }
      q.r = Math.max(0.35, r);
    }

    // 3. Walk along the stroke leaving a point on each side.
    const L = [], R = [];
    const gap2 = Math.pow(size * (o.smoothing == null ? 0.5 : o.smoothing), 2);
    let ll = null, lr = null;
    for (let i = 0; i < n; i++) {
      const q = P[i], nx = i < n - 1 ? P[i + 1].vx : q.vx, ny = i < n - 1 ? P[i + 1].vy : q.vy;
      const dot = q.vx * nx + q.vy * ny;
      if (i > 0 && i < n - 1 && dot < -0.1) {                // the pen doubled back: round the corner
        const ox = -q.vy * q.r, oy = q.vx * q.r;
        for (let k = 0; k <= 8; k++) {
          const a = Math.PI * k / 8, c = Math.cos(a), sn = Math.sin(a);
          L.push({ x: q.x - (ox * c - oy * sn), y: q.y - (ox * sn + oy * c) });
          R.push({ x: q.x + (ox * c + oy * sn), y: q.y + (-ox * sn + oy * c) });
        }
        ll = L[L.length - 1]; lr = R[R.length - 1];
        continue;
      }
      let bx = q.vx + nx, by = q.vy + ny;
      const bl = Math.hypot(bx, by) || 1;
      bx /= bl; by /= bl;
      const ox = -by * q.r, oy = bx * q.r;
      const tl = { x: q.x - ox, y: q.y - oy }, trr = { x: q.x + ox, y: q.y + oy };
      const edge = i < 2 || i === n - 1;
      if (edge || !ll || (tl.x - ll.x) ** 2 + (tl.y - ll.y) ** 2 > gap2) { L.push(tl); ll = tl; }
      if (edge || !lr || (trr.x - lr.x) ** 2 + (trr.y - lr.y) ** 2 > gap2) { R.push(trr); lr = trr; }
    }

    // 4. Close the two ends.
    const a = P[0], z = P[n - 1];
    let startCap = [], endCap = [];
    if (o.cap !== false) {
      startCap = tS ? [{ x: a.x - a.vx * a.r, y: a.y - a.vy * a.r }] : arc(a.x, a.y, R[0].x, R[0].y, -a.vx, -a.vy, 9);
      endCap = tE ? [{ x: z.x + z.vx * z.r, y: z.y + z.vy * z.r }] : arc(z.x, z.y, L[L.length - 1].x, L[L.length - 1].y, z.vx, z.vy, 9);
    }
    return L.concat(endCap, R.reverse(), startCap);
  }

  function toPath(poly) {
    const path = new Path2D();
    const n = poly.length;
    if (n < 3) return path;
    path.moveTo((poly[0].x + poly[1].x) / 2, (poly[0].y + poly[1].y) / 2);
    for (let i = 1; i <= n; i++) {
      const a = poly[i % n], b = poly[(i + 1) % n];
      path.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
    }
    path.closePath();
    return path;
  }

  const penOptions = (size, real) => ({ size, thinning: real ? 0.72 : 0.62, smoothing: 0.5, streamline: real ? 0.35 : 0.52, simulate: !real, taperStart: size * 1.6, taperEnd: size * 2.6 });
  const hlOptions = (size) => ({ size, thinning: 0, smoothing: 0.5, streamline: 0.55, simulate: false, cap: false });

  /* drawn shapes, used by the animated pictures */

  const bez = (a, c, b, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return { x: u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], y: u * u * a[1] + 2 * u * t * c[1] + t * t * b[1] }; });
  const wave = (x0, y0, x1, y1, amp, cycles, n = 90) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n; return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t + Math.sin(t * cycles * 6.2832) * amp * (1 - t * 0.35) }; });
  const ring = (cx, cy, r, turns = 1.07, n = 70) => Array.from({ length: n + 1 }, (_, i) => { const a = -1.9 + i / n * turns * 6.2832; return { x: cx + Math.cos(a) * r * (1 + 0.04 * Math.sin(a * 2)), y: cy + Math.sin(a) * r * 0.96 }; });
  const loops = (x0, y0, len, r, count, n = 260) => {
    const pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n, th = t * count * 6.2832, amp = r * (1 - 0.5 * t); pts.push({ x: x0 + len * t - amp * 0.85 * Math.sin(th), y: y0 - amp * (1 - Math.cos(th)) }); }
    const e = pts[pts.length - 1];
    for (let i = 1; i <= 40; i++) { const t = i / 40; pts.push({ x: e.x + len * 0.42 * t, y: e.y - r * 0.5 * t * t + Math.sin(t * 6.2832) * r * 0.12 }); }
    return pts;
  };
  // A hand presses on the way down and lightens on the way up.
  function press(pts, base = 0.5, gain = 0.36) {
    let p = base;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const ds = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      p += (clamp(base + gain * (b.y - a.y) / ds, 0.12, 0.98) - p) * 0.3;
      pts[i].p = p;
    }
    return pts;
  }
  const scalePts = (pts, k, dx = 0, dy = 0) => pts.map((q) => ({ x: q.x * k + dx, y: q.y * k + dy, p: q.p }));

  /* ── the page you can write on ──────────────────────────────────────── */

  (function studio() {
    const box = $('.studio');
    const page = $('.studio__page');
    const penCanvas = $('.ink--pen'), hlCanvas = $('.ink--hl');
    if (!box || !penCanvas || !penCanvas.getContext || !window.Path2D) return;
    const pen = penCanvas.getContext('2d'), hl = hlCanvas.getContext('2d');
    const PEN_SIZES = [3.2, 6.5, 12.5], HL_SIZES = [14, 22, 32];

    let strokes = [];           // on the page, oldest first: { tool, colour, size, real, pts, path }
    let undoStack = [], redoStack = [];
    // The tray: every pen is its own tool and remembers its own ink and thickness, as in the app.
    const PENS = [
      { tool: 'pen', colour: 0, weight: 1 },
      { tool: 'pen', colour: 1, weight: 1 },
      { tool: 'pen', colour: 2, weight: 1 },
      { tool: 'hl', colour: 0, weight: 1 },
      { tool: 'eraser' },
    ];
    const BANDS = [2.5, 5, 8.5];   // height of the colour band on the pen's barrel: a thicker pen has a taller band
    let sel = 1, tool = 'pen';
    let fingerDraws = false, penSeen = false;
    let W = 0, H = 0, dpr = 1, dirty = false;

    const build = (s) => { s.path = toPath(outline(s.pts, s.tool === 'hl' ? hlOptions(s.size) : Object.assign(penOptions(s.size, s.real), s.shown != null && s.shown < s.all.length ? { taperEnd: 0 } : null))); };

    function paint() {
      dirty = false;
      pen.clearRect(0, 0, W, H); hl.clearRect(0, 0, W, H);
      hl.globalAlpha = 0.8;
      for (const s of strokes) {
        if (!s.path) build(s);
        const ctx = s.tool === 'hl' ? hl : pen;
        ctx.fillStyle = s.colour;
        ctx.fill(s.path);
      }
    }
    const repaint = () => { if (!dirty) { dirty = true; requestAnimationFrame(paint); } };

    function resize() {
      // Layout size, not getBoundingClientRect(): the demo lands with a scale() animation, and measuring
      // mid-animation left the canvas 6 % too small, so ink drifted away from the pointer.
      const w = penCanvas.clientWidth, h = penCanvas.clientHeight, d = DPR();
      if (!w || !h || (w === W && h === H && d === dpr)) return;
      if (W && w !== W) {                                    // keep the ink where it was, in proportion
        const k = w / W;
        for (const list of [strokes].concat(undoStack.map((e) => e.removed), redoStack.map((e) => e.added.concat(e.removed)))) {
          for (const s of list) { if (s.scaledFor === w) continue; s.scaledFor = w; s.pts = scalePts(s.pts, k); if (s.all) s.all = scalePts(s.all, k); s.size *= k; s.path = null; }
        }
      }
      W = w; H = h; dpr = d;
      for (const [cv, ctx] of [[penCanvas, pen], [hlCanvas, hl]]) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); ctx.setTransform(d, 0, 0, d, 0, 0); }
      paint();
    }

    /* the flourish that draws itself under the invitation */

    let intro = null, introFrame = 0, introDone = false;
    function playIntro() {
      if (introDone || intro) return;
      box.classList.add('is-live');
      const hint = $('.studio__hint').getBoundingClientRect(), pr = page.getBoundingClientRect();
      const r = clamp(H * 0.075, 14, 40);
      const all = press(loops(hint.left - pr.left + 6, Math.min(H - r * 1.2, hint.bottom - pr.top + r * 2.6), Math.min(W * 0.46, hint.width * 0.8), r, 5), 0.5, 0.4);
      intro = { tool: 'pen', colour: PEN_COLOURS[PENS[1].colour][0], size: clamp(W / 130, 4.5, 8), real: true, pts: [], all, shown: 0, path: null };
      strokes.push(intro);
      if (reduceMotion.matches) return finishIntro();
      const start = performance.now() + 1500, dur = 2100;
      const frame = (now) => {
        if (introDone) return;
        const t = clamp((now - start) / dur);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        intro.shown = Math.round(eased * all.length);
        intro.pts = all.slice(0, intro.shown);
        intro.path = null;
        if (now >= start) repaint();
        if (t < 1) introFrame = requestAnimationFrame(frame); else finishIntro();
      };
      introFrame = requestAnimationFrame(frame);
    }
    function finishIntro() {
      if (introDone) return;
      introDone = true;
      cancelAnimationFrame(introFrame);
      box.classList.add('is-live');
      if (intro) { intro.pts = intro.all; delete intro.shown; intro.path = null; repaint(); }
    }

    /* history */

    function commit(entry) { undoStack.push(entry); redoStack = []; sync(); }
    function apply(entry, backwards) {
      const out = backwards ? entry.added : entry.removed, back = backwards ? entry.removed : entry.added;
      strokes = strokes.filter((s) => !out.includes(s)).concat(back);
      repaint();
    }
    const undo = () => { const e = undoStack.pop(); if (e) { apply(e, true); redoStack.push(e); sync(); } };
    const redo = () => { const e = redoStack.pop(); if (e) { apply(e, false); undoStack.push(e); sync(); } };
    function clearPage() {
      finishIntro();
      box.classList.add('has-ink');
      if (!strokes.length) return;
      const gone = strokes; strokes = []; repaint();
      commit({ added: [], removed: gone });
    }

    /* the pen tray, and the popover with the colours and thickness of the pen in use */

    const bar = $('.studio__bar', box), penButtons = $$('.penb', box), pop = $('.penpop', box);
    const swatches = $$('.swatch', pop), weights = $$('.weight', pop);
    const undoBtn = $('[data-action="undo"]', box), redoBtn = $('[data-action="redo"]', box);
    const fingerBtn = $('[data-action="finger"]', box);
    const listOf = (pn) => (pn.tool === 'hl' ? HL_COLOURS : PEN_COLOURS);
    const colourName = (c) => tr('colour.' + c[1].toLowerCase().replace(/ /g, '-'), c[1]);

    function sync() {
      const cur = PENS[sel];
      tool = cur.tool;
      penButtons.forEach((b, i) => {
        const pn = PENS[i], on = i === sel;
        let name;
        if (pn.tool === 'eraser') name = tr('tools.eraser', 'Eraser');
        else {
          const c = listOf(pn)[pn.colour];
          name = tr(pn.tool === 'hl' ? 'tools.hlNamed' : 'tools.penNamed', pn.tool === 'hl' ? '{colour} highlighter' : '{colour} pen').replace('{colour}', colourName(c));
          const art = $('.pen', b);
          art.style.setProperty('--ink', c[0]);
          art.style.setProperty('--band', BANDS[pn.weight] + 'px');
          b.setAttribute('aria-expanded', String(on && !pop.hidden));
        }
        b.setAttribute('aria-pressed', String(on));
        b.setAttribute('aria-label', name);
        b.title = on && pn.tool !== 'eraser' ? name + tr('tools.again', ': press again for colours and thickness') : name;
      });
      if (cur.tool !== 'eraser') {
        const list = listOf(cur);
        swatches.forEach((b, i) => {
          const name = colourName(list[i]);
          b.style.setProperty('--c', list[i][0]);
          b.setAttribute('aria-label', name); b.title = name;
          b.setAttribute('aria-pressed', String(cur.colour === i));
        });
        weights.forEach((b, i) => b.setAttribute('aria-pressed', String(cur.weight === i)));
      }
      undoBtn.disabled = !undoStack.length; redoBtn.disabled = !redoStack.length;
      penCanvas.style.cursor = tool === 'eraser' ? 'cell' : 'crosshair';
    }
    function placePop() {
      const b = penButtons[sel].getBoundingClientRect(), r = bar.getBoundingClientRect(), half = pop.offsetWidth / 2;
      pop.style.setProperty('--pop-x', clamp(b.left + b.width / 2 - r.left, Math.min(half, r.width / 2), Math.max(r.width - half, r.width / 2)).toFixed(1) + 'px');
    }
    function openPop() {
      if (PENS[sel].tool === 'eraser') return;
      pop.hidden = false;
      placePop(); sync();
      (swatches.find((b) => b.getAttribute('aria-pressed') === 'true') || swatches[0]).focus({ preventScroll: true });
    }
    function closePop(refocus) {
      if (pop.hidden) return;
      const inside = pop.contains(document.activeElement);
      pop.hidden = true;
      sync();
      if (refocus || inside) penButtons[sel].focus({ preventScroll: true });
    }
    function syncTouch() {
      penCanvas.style.touchAction = fingerDraws || penSeen ? 'none' : '';
      fingerBtn.setAttribute('aria-pressed', String(fingerDraws));
    }
    penButtons.forEach((b, i) => b.addEventListener('click', () => {
      if (i !== sel) { pop.hidden = true; sel = i; sync(); }      // choose this pen
      else if (pop.hidden) openPop();                             // the pen in use, pressed again: its colours and thickness
      else closePop(true);
    }));
    swatches.forEach((b, i) => b.addEventListener('click', () => { PENS[sel].colour = i; sync(); }));
    weights.forEach((b, i) => b.addEventListener('click', () => { PENS[sel].weight = i; sync(); }));
    pop.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); closePop(true); return; }
      if (e.key !== 'Tab') return;                                // Tab leaves the popover the way it was entered
      const items = swatches.concat(weights), at = items.indexOf(document.activeElement);
      if ((!e.shiftKey && at === items.length - 1) || (e.shiftKey && at === 0)) { e.preventDefault(); closePop(true); }
    });
    document.addEventListener('pointerdown', (e) => { if (!pop.hidden && !pop.contains(e.target) && !e.target.closest('.penb')) closePop(false); });
    window.addEventListener('resize', () => { if (!pop.hidden) placePop(); }, { passive: true });
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);
    $('[data-action="clear"]', box).addEventListener('click', clearPage);
    fingerBtn.addEventListener('click', () => { fingerDraws = !fingerDraws; syncTouch(); });
    if (window.matchMedia('(any-pointer: coarse)').matches) fingerBtn.hidden = false;

    document.addEventListener('keydown', (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey && undoStack.length) { e.preventDefault(); undo(); }
      else if ((k === 'y' || (k === 'z' && e.shiftKey)) && redoStack.length) { e.preventDefault(); redo(); }
    });

    /* pointer input: the pen draws, a finger pans, the mouse draws */

    let live = null, erased = null, panning = null, activeId = null, rect = null;

    window.addEventListener('pointermove', function spot(e) {   // a pen announces itself by hovering
      if (e.pointerType !== 'pen') return;
      penSeen = true; syncTouch();
      window.removeEventListener('pointermove', spot);
    }, { passive: true });

    const isReal = (e) => e.pointerType === 'pen' && e.pressure > 0 && e.pressure !== 0.5;

    // Screen point → canvas point. Divides out any transform still applied to the demo (e.g. while it lands).
    const toCanvas = (e) => ({ x: (e.clientX - rect.left) * (W / (rect.width || W)), y: (e.clientY - rect.top) * (H / (rect.height || H)) });

    // While the demo lands it is tilted in 3-D, and no straight-line mapping keeps ink under the pointer there.
    // So the first stroke ends the entrance at once; from then on the page sits still under the pen.
    let settled = false;
    function settle() { if (!settled) { settled = true; box.style.animation = 'none'; } }

    function addPoint(e) {
      const { x, y } = toCanvas(e);
      const last = live.pts[live.pts.length - 1];
      if (Math.hypot(x - last.x, y - last.y) < 0.6) return;
      live.pts.push({ x, y, p: live.real ? e.pressure : 0.5 });
      live.path = null;
    }
    function eraseAt(e) {
      const { x, y } = toCanvas(e);
      const hit = strokes.filter((s) => {
        const reach = 9 + s.size / 2, p = s.pts;
        if (p.length === 1) return Math.hypot(p[0].x - x, p[0].y - y) < reach;
        for (let i = 1; i < p.length; i++) {
          const ax = p[i - 1].x, ay = p[i - 1].y, bx = p[i].x - ax, by = p[i].y - ay;
          const t = clamp(((x - ax) * bx + (y - ay) * by) / (bx * bx + by * by || 1));
          if (Math.hypot(ax + bx * t - x, ay + by * t - y) < reach) return true;
        }
        return false;
      });
      if (!hit.length) return;
      strokes = strokes.filter((s) => !hit.includes(s));
      erased.push(...hit);
      repaint();
    }

    penCanvas.addEventListener('pointerdown', (e) => {
      if (activeId !== null) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.pointerType === 'pen' && !penSeen) { penSeen = true; syncTouch(); }
      if (e.pointerType === 'touch' && !fingerDraws) {
        if (penSeen) { panning = { y: e.clientY }; activeId = e.pointerId; }   // finger pans, as in the app
        return;                                                                // otherwise the browser scrolls
      }
      e.preventDefault();
      finishIntro();
      box.classList.add('has-ink');
      activeId = e.pointerId;
      try { penCanvas.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
      settle();
      resize();                                   // catch any size change the observer missed
      rect = penCanvas.getBoundingClientRect();
      if (tool === 'eraser') { erased = []; eraseAt(e); return; }
      const c = PENS[sel], real = isReal(e);
      live = {
        tool, real, colour: listOf(c)[c.colour][0], size: (tool === 'hl' ? HL_SIZES : PEN_SIZES)[c.weight] * clamp(W / 900, 0.7, 1),
        pts: [{ ...toCanvas(e), p: real ? e.pressure : 0.5 }], path: null,
      };
      strokes.push(live);
      repaint();
    });
    penCanvas.addEventListener('pointermove', (e) => {
      if (e.pointerId !== activeId) return;
      if (panning) { window.scrollBy(0, panning.y - e.clientY); panning.y = e.clientY; return; }
      const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
      for (const ev of events.length ? events : [e]) { if (erased) eraseAt(ev); else if (live) addPoint(ev); }
      if (live) repaint();
    });
    function end(e) {
      if (e.pointerId !== activeId) return;
      activeId = null;
      if (panning) { panning = null; return; }
      if (erased) { if (erased.length) commit({ added: [], removed: erased }); erased = null; return; }
      if (!live) return;
      const s = live; live = null;
      commit({ added: [s], removed: [] });
    }
    penCanvas.addEventListener('pointerup', end);
    penCanvas.addEventListener('pointercancel', end);
    penCanvas.addEventListener('contextmenu', (e) => { if (live || erased) e.preventDefault(); });

    if ('ResizeObserver' in window) new ResizeObserver(() => requestAnimationFrame(resize)).observe(page);
    else window.addEventListener('resize', resize);
    resize(); sync(); syncTouch();

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((en) => { if (en.some((x) => x.isIntersecting)) { io.disconnect(); playIntro(); } }, { threshold: 0.3 });
      io.observe(page);
    } else playIntro();
  })();

  /* ── the editor at work: four scenes, moved by scrolling ────────────── */

  const scenes = (function scenesSetup() {
    const section = $('.scenes'), ed = $('.ed');
    if (!section || !ed || !window.Path2D) return null;
    const copies = $$('.scene', section), dots = $$('.scenes__dots i', section);
    const page = $('.ed__page', ed), noteCv = $('.ed__note canvas', ed), pdfCv = $('.ed__pdf canvas', ed);
    const note = noteCv.getContext('2d'), pdf = pdfCv.getContext('2d');
    const words = {}; $$('.w', ed).forEach((el) => { words[el.dataset.w] = el; });
    const pop = $('.ed__pop', ed);
    PALETTE.forEach((c) => { const i = document.createElement('i'); i.style.setProperty('--c', '#' + c); pop.appendChild(i); });
    const popDots = $$('i', pop);
    const trayPens = $$('.ed__penb[data-c]', ed), trayHl = $('.ed__penb[data-t="hl"]', ed);

    const INK = '#2E2F36', BLUE = '#3F62C4', RED = '#D2534B', GREEN = '#1E8E3E', VIOLET = '#7B3FE4';
    // Every stroke: scene (0–3), when it is drawn within that scene, colour, size and points.
    // Units: 100 = the width of the page.
    const rays = Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 6.2832 + 0.2; return [{ x: 76 + Math.cos(a) * 10.5, y: 40 + Math.sin(a) * 10.5 }, { x: 76 + Math.cos(a) * 14.5, y: 40 + Math.sin(a) * 14.5 }]; });
    const NOTE = [
      { s: 0, a: 0.25, b: 0.42, c: INK, size: 2.5, pts: press(wave(9, 22.5, 66, 21.5, 0.9, 1.4), 0.6, 0.3) },
      { s: 0, a: 0.62, b: 0.82, c: INK, size: 1.4, pts: press(ring(76, 40, 7.5)) },
      ...rays.map((r, i) => ({ s: 0, a: 0.82 + i * 0.021, b: 0.84 + i * 0.021, c: INK, size: 0.75, pts: press(bez([r[0].x, r[0].y], [(r[0].x + r[1].x) / 2, (r[0].y + r[1].y) / 2], [r[1].x, r[1].y], 8), 0.6, 0.2) })),
      { s: 1, a: 0.16, b: 0.36, c: GREEN, size: 1.4, pts: press(bez([20, 88], [21, 63], [51, 61]).concat(bez([51, 61], [50, 85], [20, 88]).slice(1))) },
      { s: 1, a: 0.36, b: 0.43, c: GREEN, size: 0.9, pts: press(bez([21, 87], [34, 78], [49, 63], 24)) },
      { s: 1, a: 0.5, b: 0.62, c: RED, size: 1.4, pts: press(bez([68, 51], [63, 65], [54, 67], 30)) },
      { s: 1, a: 0.62, b: 0.68, c: RED, size: 1.4, pts: press(bez([59.5, 62], [56, 65], [54, 67], 8).concat(bez([54, 67], [57, 68.5], [60.5, 70.5], 8).slice(1)), 0.6, 0.2) },
      { s: 1, a: 0.76, b: 0.9, c: VIOLET, size: 1.4, pts: press(wave(9, 50.5, 64, 50, 1, 3.5), 0.55, 0.3) },
      { s: 3, a: 0.62, b: 0.96, c: BLUE, size: 1.6, pts: press(loops(12, 124, 52, 5.5, 5, 200), 0.5, 0.4) },
    ];
    let PDFS = [];
    let u = 1, layout = null;

    function measure() {
      const w = page.offsetWidth, h = page.offsetHeight, d = DPR();
      if (!w) return;
      u = w / 100;
      for (const [cv, ctx] of [[noteCv, note], [pdfCv, pdf]]) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); ctx.setTransform(d, 0, 0, d, 0, 0); }
      const ew = ed.offsetWidth;
      layout = { w, h, left: page.offsetLeft / ew * 100, top: page.offsetTop / ew * 100, k: w / ew };
      // The highlighter follows the real position of the sentence it marks.
      const s = $('.ed__pdf .pdf__s', ed);
      const x0 = s.offsetLeft / u - 1.2, x1 = (s.offsetLeft + s.offsetWidth) / u + 1.2, y = (s.offsetTop + s.offsetHeight / 2) / u;
      PDFS = [
        { a: 0.2, b: 0.45, c: '#FFE14D', hl: true, size: s.offsetHeight / u * 1.12, pts: wave(x0, y + 0.3, x1, y - 0.2, 0.25, 1, 60) },
        { a: 0.62, b: 0.7, c: RED, size: 1, pts: press(bez([66, 54], [58, 55], [54, y + 4.5], 24)) },
        { a: 0.7, b: 0.74, c: RED, size: 1, pts: press(bez([57.5, y + 5], [55.5, y + 5], [54, y + 4.5], 6).concat(bez([54, y + 4.5], [54.5, y + 6.5], [55.5, y + 8], 6).slice(1)), 0.6, 0.2) },
      ];
      last = -1;
    }

    function drawStroke(ctx, st, f) {
      if (f <= 0) return null;
      const n = Math.max(2, Math.ceil(st.pts.length * f));
      const pts = scalePts(st.pts.slice(0, n), u);
      const o = st.hl ? hlOptions(st.size * u) : Object.assign(penOptions(st.size * u, true), { smoothing: 0.35 }, f < 1 ? { taperEnd: 0 } : null);
      ctx.fillStyle = st.c;
      ctx.globalAlpha = st.hl ? 0.8 : 1;
      ctx.fill(toPath(outline(pts, o)));
      return st.pts[n - 1];
    }

    let last = -1;
    function render(p) {
      if (!layout || Math.abs(p - last) < 0.0005) return;
      last = p;
      const T = [clamp(p), clamp(p - 1), clamp(p - 2), clamp(p - 3)];
      const [A, B, C, D] = T;
      const scene = Math.min(3, Math.floor(p + (reduceMotion.matches ? 0 : 0.015)));   // with reduced motion the words stay with their finished picture

      note.clearRect(0, 0, layout.w, layout.h);
      let tip = null;
      for (const st of NOTE) { const head = drawStroke(note, st, seg(T[st.s], st.a, st.b)); if (st.s === 3 && head) tip = head; }
      pdf.clearRect(0, 0, layout.w, layout.h);
      for (const st of PDFS) drawStroke(pdf, st, seg(C, st.a, st.b));

      words.title.style.setProperty('--w', seg(A, 0.02, 0.25).toFixed(3));
      words.l1.style.setProperty('--w', seg(A, 0.42, 0.54).toFixed(3));
      words.l2.style.setProperty('--w', seg(A, 0.54, 0.62).toFixed(3));
      words.note.style.setProperty('--w', seg(C, 0.46, 0.6).toFixed(3));

      const pdfIn = seg(C, 0, 0.2) * (1 - seg(D, 0, 0.16)), exp = seg(C, 0.74, 0.96) * (1 - seg(D, 0, 0.12));
      const pan = seg(D, 0.24, 0.52);
      const ease = (t) => t * t * (3 - 2 * t);
      const set = (k, v) => ed.style.setProperty(k, String(v));
      set('--pdf', ease(pdfIn).toFixed(3)); set('--exp', ease(exp).toFixed(3)); set('--pan', ease(pan).toFixed(3));
      set('--pop', ease(seg(B, 0.02, 0.12) * (1 - seg(B, 0.9, 0.98))).toFixed(3));
      set('--thick', ease(seg(A, 0.2, 0.27) * (1 - seg(A, 0.93, 1))).toFixed(3));

      // toolbar state
      const weight = p >= 1 ? 1 : A < 0.25 ? 1 : A < 0.6 ? 2 : A < 0.8 ? 1 : 0;
      set('--sw', [1.2, 2.4, 4.4][weight]); set('--knob', [0.12, 0.45, 0.86][weight]);
      const hlNow = C > 0.16 && C < 0.47 && D === 0;
      let col = 0, now = INK, dot = -1;
      if (p >= 3.55) { col = 1; now = BLUE; }
      else if (hlNow) { col = 0; now = '#FFE14D'; }
      else if (C >= 0.47 && p < 3.55) { col = 2; now = RED; }
      else if (B >= 0.74) { col = 4; now = VIOLET; dot = 22; }
      else if (B >= 0.47) { col = 2; now = RED; dot = 21; }
      else if (B >= 0.14) { col = 3; now = GREEN; dot = 13; }
      // The tray: the pen in use stands on its raised tile. A colour picked from the palette re-inks the pen in hand.
      const inHand = col === 4 ? 3 : col;
      trayPens.forEach((el, i) => el.classList.toggle('is-on', !hlNow && i === inHand));
      trayHl.classList.toggle('is-on', hlNow);
      if (col === 4) trayPens[3].style.setProperty('--ink', VIOLET); else trayPens[3].style.removeProperty('--ink');
      ed.dataset.scene = scene;
      set('--now', now);
      popDots.forEach((el, i) => el.classList.toggle('is-on', i === dot));

      // finger and pen
      const fo = seg(D, 0.16, 0.24) * (1 - seg(D, 0.54, 0.6)), po = seg(D, 0.58, 0.64);
      set('--fo', fo.toFixed(3)); set('--po', po.toFixed(3));
      set('--fx', (layout.left + 68 * layout.k).toFixed(2)); set('--fy', (layout.top + (78 - ease(pan) * 17) * layout.k).toFixed(2));
      const tp = tip || NOTE[NOTE.length - 1].pts[0];
      set('--px', (layout.left + tp.x * layout.k).toFixed(2)); set('--py', (layout.top + (tp.y - 17) * layout.k).toFixed(2));
      ed.dataset.touch = fo > 0.5 ? 'finger' : po > 0.5 ? 'pen' : '';

      copies.forEach((el, i) => { el.classList.toggle('is-on', i === scene); el.classList.toggle('is-past', i < scene); });
      dots.forEach((el, i) => el.style.setProperty('--f', clamp(p - i).toFixed(3)));
    }

    let target = 0, shown = 0;
    function read() {
      const r = section.getBoundingClientRect(), span = r.height - window.innerHeight;
      if (span <= 0) return;
      let p = clamp(-r.top / span) * 4.3 - 0.12;
      p = clamp(p, 0, 3.999);
      if (reduceMotion.matches) p = Math.floor(p) + 0.9999;     // each scene simply appears finished
      target = p;
    }
    function step() {
      if (reduceMotion.matches) shown = target;
      else { shown += (target - shown) * 0.16; if (Math.abs(target - shown) < 0.001) shown = target; }
      render(shown);
      return shown !== target;
    }
    if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); read(); shown = target; render(shown); }).observe(ed);
    measure(); read(); shown = target; render(shown);
    return { read, step };
  })();

  /* ── small pictures on the feature tiles ────────────────────────────── */

  const tileArt = $$('canvas[data-art="pressure"]').map((cv) => {
    if (!window.Path2D) return null;
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, raf = 0, played = false;
    function draw(f) {
      const d = DPR();
      W = cv.clientWidth; H = cv.clientHeight;
      if (!W) return;
      if (cv.width !== Math.round(W * d)) { cv.width = Math.round(W * d); cv.height = Math.round(H * d); }
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const k = Math.min(W / 560, 1.15), pad = W * 0.09;
      // a highlighter band, then a pen line that goes from a whisper to full weight
      const band = wave(pad, H * 0.72, W - pad * 1.6, H * 0.7, 2, 1, 50);
      const f1 = seg(f, 0, 0.35), f2 = seg(f, 0.3, 1);
      if (f1 > 0) { ctx.globalAlpha = 0.85; ctx.fillStyle = '#FFE14D'; ctx.fill(toPath(outline(band.slice(0, Math.max(2, Math.ceil(band.length * f1))), hlOptions(30 * k)))); }
      const line = wave(pad, H * 0.5, W - pad, H * 0.44, H * 0.2, 3.25, 160);
      line.forEach((q, i) => { const t = i / (line.length - 1); q.p = clamp(0.06 + Math.pow(t, 1.5) * 0.95 + Math.sin(t * 20) * 0.05, 0.04, 1); });
      if (f2 > 0) {
        ctx.globalAlpha = 1; ctx.fillStyle = '#3F62C4';
        ctx.fill(toPath(outline(line.slice(0, Math.max(2, Math.ceil(line.length * f2))), Object.assign(penOptions(22 * k, true), { thinning: 0.92, streamline: 0.3 }, f2 < 1 ? { taperEnd: 0 } : null))));
      }
    }
    function play() {
      cancelAnimationFrame(raf);
      played = true;
      if (reduceMotion.matches) return draw(1);
      const t0 = performance.now();
      const frame = (now) => { const t = clamp((now - t0 - 350) / 1700); draw(1 - Math.pow(1 - t, 2.2)); if (t < 1) raf = requestAnimationFrame(frame); };
      raf = requestAnimationFrame(frame);
    }
    const tile = cv.closest('.tile');
    tile.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && played) play(); });
    if ('ResizeObserver' in window) new ResizeObserver(() => { if (played) draw(1); }).observe(cv);
    return { fold: cv.closest('.fold'), play };
  }).filter(Boolean);

  /* ── sheets unfold, the thread draws, the chips drift ───────────────── */

  $$('.strike').forEach((el, i) => el.style.setProperty('--i', String(i * 1.6)));
  $$('.dialogs svg').forEach((p, i) => p.style.setProperty('--i', String(i * 5)));

  const folds = $$('.fold').map((el) => ({ el, paper: $('.paper', el), p: 0, shown: 0, open: false }));
  const MAX_ANGLE = 78, TRAVEL = 0.5;
  function openFold(f) {
    f.open = true;
    f.paper.style.transform = ''; f.paper.style.removeProperty('--shade'); f.paper.style.willChange = '';
    f.el.classList.add('is-open');
    tileArt.forEach((t) => { if (t.fold === f.el) t.play(); });
  }

  const thread = $('.thread'), threadPath = thread && $('path', thread), main = $('main');
  function layThread() {
    if (!threadPath) return;
    const h = main.offsetHeight;
    let d = 'M20 0', s = 1;
    for (let y = 0; y < h; y += 170, s = -s) d += ` Q${20 + s * 15} ${y + 85} 20 ${Math.min(h, y + 170)}`;
    thread.setAttribute('viewBox', `0 0 40 ${h}`);
    threadPath.setAttribute('d', d);
    threadPath.setAttribute('pathLength', '1');
    threadPath.style.strokeDasharray = '1 2';
  }
  const chips = $$('.chip');
  const drift = [-0.1, -0.24, -0.16];

  let ticking = false;
  function frame() {
    ticking = false;
    let moving = false;
    const vh = window.innerHeight, y = window.scrollY;

    for (const f of folds) {
      if (f.open) continue;
      const top = f.el.getBoundingClientRect().top;
      f.p = Math.max(f.p, clamp((vh - top) / (vh * TRAVEL)));     // a sheet never folds back up
      f.shown += (f.p - f.shown) * 0.14;
      if (f.p - f.shown < 0.002) f.shown = f.p;
      if (f.shown >= 1) { openFold(f); continue; }
      const e = 1 - Math.pow(1 - f.shown, 2.4);
      f.paper.style.willChange = 'transform';
      f.paper.style.transform = `perspective(1300px) rotateX(${(-(1 - e) * MAX_ANGLE).toFixed(2)}deg) scale(${(0.94 + e * 0.06).toFixed(4)})`;
      f.paper.style.setProperty('--shade', (1 - e).toFixed(3));
      if (f.shown !== f.p) moving = true;
    }
    if (scenes) { scenes.read(); if (scenes.step()) moving = true; }
    if (threadPath) threadPath.style.strokeDashoffset = (1 - clamp((y + vh * 0.6) / main.offsetHeight)).toFixed(4);
    if (y < vh * 1.5) chips.forEach((c, i) => c.style.setProperty('--py', (y * drift[i]).toFixed(1)));
    if (moving) request();
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

  if (reduceMotion.matches) {
    folds.forEach(openFold);
    layThread();
    if (threadPath) threadPath.style.strokeDasharray = 'none';
    window.addEventListener('scroll', () => { if (scenes) { scenes.read(); scenes.step(); } }, { passive: true });
  } else {
    layThread();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', () => { layThread(); request(); }, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(layThread).observe(main);
    document.addEventListener('focusin', (e) => { const f = folds.find((x) => x.el.contains(e.target)); if (f && !f.open) { f.p = 1; request(); } });
    // What is already on screen when the page loads starts open.
    const vh = window.innerHeight;
    folds.forEach((f) => { if (f.el.getBoundingClientRect().top < vh * (1 - TRAVEL)) openFold(f); });
    frame();
  }

  const ready = () => requestAnimationFrame(() => root.classList.add('is-ready'));
  if (document.readyState === 'complete') ready(); else window.addEventListener('load', ready);
})();
