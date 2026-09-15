// Motion is split by job: GSAP owns what is tied to the scroll position and
// the load sequence, Motion owns what answers the visitor (reveals in view,
// the button swap). Without either, or with reduced motion on, the page shows
// everything at rest.
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const live = !still && typeof gsap !== 'undefined' && typeof Motion !== 'undefined';
if (!live) document.documentElement.classList.remove('js');
if (live) gsap.registerPlugin(ScrollTrigger);
const out = [0.23, 1, 0.32, 1];

// The field: vertical hairlines bent by drifting Perlin noise, after reactbits'
// Waves, redrawn here without React and without its pointer physics. It runs
// only while the hero is on screen and the tab is visible; with reduced motion
// it draws once. It does not start until the load sequence does: a frame drawn
// under a canvas still at opacity zero is a frame taken from the first paint.
let startField = () => {};
{
  const canvas = document.querySelector('.field');
  const hero = document.querySelector('.hero');
  const lockup = document.querySelector('.lockup');
  const ctx = canvas.getContext('2d');
  const cfg = { xGap: 10, yGap: 24, ampX: 32, ampY: 16, speedX: 0.0125, speedY: 0.005 };

  const perm = new Uint8Array(512);
  {
    const p = Uint8Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  }
  const grad = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + (b - a) * t;
  const noise = (x, y) => {
    const X = Math.floor(x), Y = Math.floor(y);
    x -= X; y -= Y;
    const g = (i, j) => grad[perm[(i & 255) + perm[j & 255]] & 7];
    const d = (v, dx, dy) => v[0] * dx + v[1] * dy;
    const u = fade(x);
    return lerp(
      lerp(d(g(X, Y), x, y), d(g(X + 1, Y), x - 1, y), u),
      lerp(d(g(X, Y + 1), x, y - 1), d(g(X + 1, Y + 1), x - 1, y - 1), u),
      fade(y));
  };

  let W = 0, H = 0, dpr = 0, lines = [];

  const size = () => {
    const r = hero.getBoundingClientRect();
    const d = Math.min(2, devicePixelRatio || 1);
    if (r.width !== W || r.height !== H || d !== dpr) {
      W = r.width; H = r.height; dpr = d;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lines = [];
      const nx = Math.ceil((W + 200) / cfg.xGap), ny = Math.ceil((H + 30) / cfg.yGap);
      const x0 = (W - cfg.xGap * nx) / 2, y0 = (H - cfg.yGap * ny) / 2;
      for (let i = 0; i <= nx; i++) {
        const pts = [];
        for (let j = 0; j <= ny; j++) pts.push({ x: x0 + cfg.xGap * i, y: y0 + cfg.yGap * j, px: 0, py: 0 });
        lines.push(pts);
      }
    }
    // The mask clears an ellipse behind the words: it is fully clear out to 62
    // percent of its radius, so the radius is the lockup's half size over 0.62.
    const l = lockup.getBoundingClientRect();
    canvas.style.setProperty('--rx', `${Math.round(l.width / 2 / 0.62)}px`);
    canvas.style.setProperty('--ry', `${Math.round(l.height / 2 / 0.62)}px`);
  };

  const step = (t) => {
    for (const pts of lines) for (const p of pts) {
      const m = noise((p.x + t * cfg.speedX) * 0.002, (p.y + t * cfg.speedY) * 0.0015) * 12;
      p.px = p.x + Math.cos(m) * cfg.ampX; p.py = p.y + Math.sin(m) * cfg.ampY;
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(236, 238, 241, 0.14)';
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (const pts of lines) {
      const n = pts.length - 1;
      // one smooth curve through the points (Catmull-Rom as cubic Beziers), so
      // a bend is a bend and never a joint between two straight sticks
      ctx.moveTo(pts[0].px, pts[0].py);
      for (let j = 0; j < n; j++) {
        const a = pts[Math.max(0, j - 1)], b = pts[j], c = pts[j + 1], d = pts[Math.min(n, j + 2)];
        ctx.bezierCurveTo(b.px + (c.px - a.px) / 6, b.py + (c.py - a.py) / 6, c.px - (d.px - b.px) / 6, c.py - (d.py - b.py) / 6, c.px, c.py);
      }
    }
    ctx.stroke();
  };

  let raf = 0, on = false, ready = !live;
  const frame = (t) => { step(t); draw(); raf = requestAnimationFrame(frame); };
  const once = () => { step(0); draw(); };
  const wanted = () => ready && !still && !document.hidden && scrollY < H;
  const sync = () => {
    const w = wanted();
    if (w && !on) { on = true; raf = requestAnimationFrame(frame); }
    else if (!w && on) { on = false; cancelAnimationFrame(raf); }
  };
  addEventListener('resize', () => { size(); if (still) once(); });
  addEventListener('scroll', sync, { passive: true });
  document.addEventListener('visibilitychange', sync);
  size();
  if (still) once(); else sync();
  document.fonts.ready.then(size);
  startField = () => { ready = true; sync(); };
}

// On load, one sequence: the wordmark fades in slowly, over 1.4s and in
// place (in CSS, keyed to data-sora from the head), while the field, the
// line under it and the bar assemble briskly around it, all in inside a
// second. Karim, 2026-09-14: the title fade was too fast and the rest too
// slow, so the two run on different clocks; and nothing travels: the ten
// pixel rise under the wordmark, then the line's rise and the bar's drop,
// each read as floating. Everything on load fades where it stands. The wordmark rises ten pixels, no
// more: at its size a longer travel is a slide, and a slide is not a fade.
// The rest keys to the same moment, Sora's arrival, and to Sora only:
// fonts.ready would hold the whole hero for the window mock's two faces,
// which nothing above the fold uses.
if (live) soraReady.then(() => {
  startField();
  gsap.timeline({ defaults: { ease: 'power4.out' } })
    .fromTo('.field', { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'power2.out' }, 0.15)
    .fromTo('.sub', { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.2)
    .fromTo('.nav', { opacity: 0 }, { opacity: 1, duration: 0.45 }, 0.3);
});

// The lift: the sheet grows from 88 percent to full width while its top edge
// travels from the bottom of the screen to the top. Progress is the scroll
// position and nothing else, followed with half a second of catch-up: a
// wheel notch moves the page in a step, and with the lift pinned to the
// step it stepped too, so it glides to where the scroll is instead. It still
// comes to rest wherever the finger does, half a second later. The corners
// stay round while the sheet is a card and square up only over the last
// fifth, as it docks, so nothing of the hero shows through them at the top.
if (live) {
  const sheet = document.querySelector('.sheet');
  const radius = parseFloat(getComputedStyle(sheet).borderTopLeftRadius);
  gsap.timeline({ scrollTrigger: { trigger: '.lift', start: 'top bottom', end: 'top top', scrub: 0.5 }, defaults: { ease: 'none' } })
    .fromTo('.lift', { scale: 0.88 }, { scale: 1, duration: 1 }, 0)
    .fromTo(sheet, { borderTopLeftRadius: radius, borderTopRightRadius: radius }, { borderTopLeftRadius: 0, borderTopRightRadius: 0, duration: 0.2 }, 0.8);
}

// The hold applies only while the sheet fits the screen; held taller than the
// screen, it would hide its own bottom.
const lift = document.querySelector('.lift');
const sheetBox = document.querySelector('.sheet');
const fit = () => lift.classList.toggle('hold', sheetBox.offsetHeight <= innerHeight + 1);
fit();
addEventListener('resize', fit);
document.fonts.ready.then(fit);

// The magnet. The held sheet spans a stretch of scroll positions (the dwell).
// When a scroll arrives at the sheet, from either side, and ends inside the
// dwell or up to 40 percent of a screen past it, the page glides to the middle
// of the dwell: the docked sheet, with half the hold still to scroll through
// before it moves, which is the pause. A scroll that starts on the held sheet
// is leaving, and is never pulled back, whichever way it goes; any input
// during the glide stops it. A scroll counts as ended after 180ms without a
// scroll event, not on scrollend: Chrome fires scrollend between the ticks of
// one wheel gesture, which would split the gesture and lose where it began.
// Nothing under reduced motion.
if (live && matchMedia('(min-width: 1100px)').matches) {
  const dwell = document.querySelector('.dwell');
  // A gesture runs from its first scroll event until 180ms pass without one.
  // Input that cuts a glide short starts a fresh gesture from where the page
  // is, so a visitor who scrolls on during the glide is never pulled back.
  let startY = scrollY, lastY = scrollY, moving = false, glide = null, ours = false, timer;
  const release = () => { ours = false; moving = false; lastY = scrollY; };
  const stop = () => { if (glide) { glide.kill(); glide = null; release(); } };
  const park = (to) => {
    if (Math.abs(to - scrollY) < 1) return;
    ours = true;
    const pos = { y: scrollY };
    glide = gsap.to(pos, { y: to, duration: 0.55, ease: 'power3.out', onUpdate: () => scrollTo({ top: pos.y, behavior: 'instant' }), onComplete: () => { glide = null; setTimeout(release, 250); } });
  };
  const settle = () => {
    moving = false;
    if (!lift.classList.contains('hold')) return;
    const dock = lift.getBoundingClientRect().top + scrollY;
    const far = dock + dwell.offsetHeight;
    const reach = innerHeight * 0.4;
    const y = scrollY;
    const onto = y >= dock && y <= far + reach;
    const fromAbove = startY < dock, fromBelow = startY > far && y < startY;
    if (onto && (fromAbove || fromBelow)) park(dock + dwell.offsetHeight / 2);
  };
  addEventListener('scroll', () => {
    if (ours) return;
    if (!moving) { moving = true; startY = lastY; }
    lastY = scrollY;
    clearTimeout(timer);
    timer = setTimeout(settle, 180);
  }, { passive: true });
  for (const ev of ['wheel', 'touchstart', 'pointerdown', 'keydown']) addEventListener(ev, stop, { passive: true });
}

// Below the window, things reveal as they enter view: each step in turn, then
// the closing call as one group.
if (live) {
  const { animate, inView, stagger } = Motion;
  const rise = (els, delay = 0) => animate(els, { opacity: [0, 1], transform: ['translateY(18px)', 'translateY(0px)'] }, { duration: 0.7, delay, ease: out });
  document.querySelectorAll('.steps li').forEach((li, i) => inView(li, () => { rise(li, i * 0.08); }, { amount: 0.3 }));
  inView('.cta', () => { rise(document.querySelectorAll('.cta .wrap > *'), stagger(0.07)); }, { amount: 0.3 });
}

// The veil behind the bar grows with the share of the bar's own height that
// the sections after the hero cover, so it fades in as the sheet slides up
// under the bar and stays while anything else is under it.
const nav = document.querySelector('.nav');
const covering = [...document.querySelectorAll('.sheet, .steps, .cta, footer')];
let ticking = false;
const tint = () => {
  ticking = false;
  const zone = nav.offsetHeight;
  let veil = 0;
  for (const el of covering) {
    const r = el.getBoundingClientRect();
    veil += Math.max(0, Math.min(r.bottom, zone) - Math.max(r.top, 0)) / zone;
  }
  nav.style.setProperty('--veil', Math.min(1, veil).toFixed(3));
};
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(tint); } }, { passive: true });
addEventListener('resize', tint);
tint();

// The chart: BTC, the last hundred and twenty daily candles on Hyperliquid, a
// snapshot taken 2026-09-14 (candleSnapshot on the public info endpoint), as
// [time, open, high, low, close, volume]. Drawn at the size of its box.
const host = document.querySelector('.chart-host');
const svg = document.getElementById('chart');
const mono = 'Geist Mono, ui-monospace, monospace';
const fmt = (v) => Math.round(v).toLocaleString('en-US');
const rows = [[1779062400,77430,77754,76037,76984,31062],[1779148800,76984,77399,76125,76806,19921],[1779235200,76807,77839,76490,77533,24614],[1779321600,77533,78174,76700,77587,30340],[1779408000,77587,77870,75350,75500,26664],[1779494400,75500,77375,74234,76712,33214],[1779580800,76711,77534,76060,77015,20162],[1779667200,77015,77865,76867,77282,15808],[1779753600,77281,78060,75623,75894,32928],[1779840000,75895,76120,74202,74420,30400],[1779926400,74420,74557,72555,73587,40933],[1780012800,73588,74300,72476,73431,32765],[1780099200,73432,74095,73163,73853,12754],[1780185600,73853,74250,73377,73658,17573],[1780272000,73658,74075,70683,71411,52526],[1780358400,71411,71412,66169,66732,94456],[1780444800,66732,67479,64061,64118,75735],[1780531200,64118,64752,61350,63855,104680],[1780617600,63854,63949,59100,61033,134490],[1780704000,61033,61508,59459,60861,51481],[1780790400,60860,64228,60714,63309,47627],[1780876800,63309,64196,62375,63058,44332],[1780963200,63058,63514,60765,61695,50944],[1781049600,61699,62827,60733,61481,49237],[1781136000,61484,63919,61484,63621,44292],[1781222400,63621,64383,62801,63561,37754],[1781308800,63560,64750,63420,64427,16876],[1781395200,64427,65780,63648,65720,32435],[1781481600,65719,67283,65325,66294,31782],[1781568000,66293,66964,65320,65639,28273],[1781654400,65640,66429,63878,64470,44824],[1781740800,64470,64771,62235,62935,46655],[1781827200,62936,63630,62292,63512,24252],[1781913600,63513,64361,63170,64276,16958],[1782000000,64276,64555,63242,63270,19643],[1782086400,63270,65587,63270,64012,42783],[1782172800,64012,64254,61901,62706,40936],[1782259200,62706,63196,59060,61047,58854],[1782345600,61048,61927,58062,59759,66715],[1782432000,59760,60726,58308,60074,51274],[1782518400,60074,60935,59825,59996,16630],[1782604800,59996,60500,58875,59549,22059],[1782691200,59549,60767,58871,60227,40270],[1782777600,60228,60248,58160,58603,41212],[1782864000,58604,61357,57768,60010,56506],[1782950400,60010,62224,59561,61587,49368],[1783036800,61587,62949,61264,62576,28453],[1783123200,62575,63460,62319,63127,22779],[1783209600,63128,63997,62434,63635,18488],[1783296000,63635,64698,61342,64054,48589],[1783382400,64054,64331,62667,63355,34462],[1783468800,63355,63750,61550,62283,32402],[1783555200,62283,63500,61695,63225,27962],[1783641600,63224,64690,62922,64155,28920],[1783728000,64156,64494,63818,63823,11242],[1783814400,63823,64297,63642,63780,12697],[1783900800,63780,64420,61821,62331,34587],[1783987200,62331,65079,62264,65000,42875],[1784073600,65000,65577,64483,64738,27591],[1784160000,64738,64999,63723,63815,25997],[1784246400,63815,64398,62550,63928,30725],[1784332800,63927,64873,63873,64827,12085],[1784419200,64828,64957,64275,64718,14070],[1784505600,64719,65778,63730,65226,42736],[1784592000,65227,66918,65124,66527,31474],[1784678400,66526,66714,65534,66086,29966],[1784764800,66086,66295,64637,65069,26441],[1784851200,65070,65795,63730,64123,33123],[1784937600,64122,64434,63736,64361,10980],[1785024000,64361,65561,64262,65366,11484],[1785110400,65372,65715,63576,63736,31030],[1785196800,63737,64100,62703,63906,29752],[1785283200,63907,64696,63245,63962,37440],[1785369600,63961,65153,63588,64754,19634],[1785456000,64755,65385,62440,62856,32795],[1785542400,62857,63115,62237,62790,10651],[1785628800,62789,63784,62786,63556,17904],[1785715200,63557,64050,62270,63492,27435],[1785801600,63492,64500,63287,64068,27616],[1785888000,64068,64986,63850,64625,28864],[1785974400,64625,64967,64156,64293,17755],[1786060800,64294,65356,64137,64885,20109],[1786147200,64886,65168,64778,64933,6132],[1786233600,64933,65475,64700,64868,9909],[1786320000,64868,65365,63783,63952,25769],[1786406400,63951,64460,63195,63560,19313],[1786492800,63560,64487,63286,63468,26665],[1786579200,63467,63978,62816,63480,28915],[1786665600,63479,63615,62523,63029,20240],[1786752000,63029,63176,62890,63056,4847],[1786838400,63057,63368,62678,62873,9954],[1786924800,62874,64580,62730,64494,30514],[1787011200,64494,65018,64000,64696,21414],[1787097600,64696,70224,64122,69323,83511],[1787184000,69323,73370,68898,72996,66926],[1787270400,73001,79584,73001,78383,102197],[1787356800,78382,78885,76558,77133,38965],[1787443200,77132,78118,75608,77804,32606],[1787529600,77805,80035,76693,78996,63277],[1787616000,78995,81299,77794,78494,69358],[1787702400,78494,79226,77618,79026,42499],[1787788800,79025,80801,78547,80221,46169],[1787875200,80220,81483,76831,77832,57767],[1787961600,77832,78331,77341,78228,13062],[1788048000,78229,79389,76971,77659,22234],[1788134400,77660,79250,77353,78574,32468],[1788220800,78575,79233,76397,77419,37144],[1788307200,77420,77777,76234,77319,35463],[1788393600,77320,82268,76951,81244,57824],[1788480000,81244,81400,78600,79623,39309],[1788566400,79624,80192,79413,79804,10979],[1788652800,79804,80514,79214,80314,10660],[1788739200,80315,80428,78632,79072,20191],[1788825600,79073,79430,77617,78417,28624],[1788912000,78419,79730,77718,78275,38151],[1788998400,78269,78527,76440,76533,31300],[1789084800,76534,79867,76021,77180,47651],[1789171200,77180,77460,77034,77248,7896],[1789257600,77249,77423,76469,76810,16627],[1789344000,76811,79576,76346,79361,29276]];
const candles = rows.map(([t, o, h, l, c, v]) => ({ t, o, h, l, c, v }));
const last = candles[candles.length - 1];
const gridStep = 4000;
const lo = Math.floor(Math.min(...candles.map(k => k.l)) / gridStep) * gridStep;
const hi = Math.ceil(Math.max(...candles.map(k => k.h)) / gridStep) * gridStep;
const maxV = Math.max(...candles.map(k => k.v));
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

let chartW = 0;
function draw() {
  const W = host.clientWidth, H = host.clientHeight;
  if (!W || !H) return;
  const axis = 62, top = 30, volH = Math.round(H * 0.16), timeH = 22;
  const priceH = H - top - volH - timeH;
  chartW = W - axis;
  const y = (v) => top + (hi - v) / (hi - lo) * priceH;
  const step = chartW / candles.length;
  // until the visitor is looking, the bars wait flat on their baselines, the
  // last-price line has no length and its tag is clear; each bar carries its
  // candle's index so the wick, the body and the volume of one day move together
  const bar = (i) => grown ? ` data-bar="${i}"` : ` data-bar="${i}" style="transform: scaleY(0)"`;
  const hidden = grown ? '' : ' style="opacity: 0"';
  let out = '';
  // grid and price axis
  for (let v = lo; v <= hi; v += gridStep) {
    out += `<line x1="0" x2="${chartW}" y1="${y(v)}" y2="${y(v)}" stroke="#1B1D20"/>`;
    // an axis label under the last price tag would collide with it, so it is skipped
    if (Math.abs(y(v) - y(last.c)) > 14) out += `<text x="${chartW + 8}" y="${y(v) + 4}" fill="#5E656F" font-size="11" font-family="${mono}">${fmt(v)}</text>`;
  }
  // candles
  candles.forEach((k, i) => {
    const x = i * step + step / 2;
    const up = k.c >= k.o;
    const col = up ? '#3FFF6C' : '#FF5A6E';
    out += `<line x1="${x}" x2="${x}" y1="${y(k.h)}" y2="${y(k.l)}" stroke="${col}"${bar(i)}/>`;
    const t = y(Math.max(k.o, k.c)), b = y(Math.min(k.o, k.c));
    out += `<rect x="${x - step * 0.28}" y="${t}" width="${step * 0.56}" height="${Math.max(1, b - t)}" fill="${col}"${bar(i)}/>`;
  });
  // the last price on the axis
  out += `<line data-line x1="0" x2="${grown ? chartW : 0}" y1="${y(last.c)}" y2="${y(last.c)}" stroke="#FF5A6E" stroke-dasharray="2 3" opacity="0.7"/>`;
  out += `<g data-tag${hidden}>`;
  out += `<rect x="${chartW}" y="${y(last.c) - 9}" width="${axis}" height="18" fill="#FF5A6E"/>`;
  out += `<text x="${chartW + 8}" y="${y(last.c) + 4}" fill="#0E0F13" font-size="11" font-weight="600" font-family="${mono}">${fmt(last.c)}</text>`;
  out += `</g>`;
  // legend
  const dayCol = last.c >= last.o ? '#3FFF6C' : '#FF5A6E';
  const pct = ((last.c / last.o - 1) * 100).toFixed(2);
  // on a phone the chart is too narrow for the symbol and the day's figures both
  const symbol = chartW < 420 ? '' : `<tspan fill="#3FFF6C">BTC-USD</tspan><tspan fill="#9BA1AB"> 1d </tspan>`;
  out += `<text x="8" y="18" font-size="11" font-family="${mono}">${symbol}<tspan fill="#9BA1AB">O </tspan><tspan fill="${dayCol}">${fmt(last.o)}</tspan><tspan fill="#9BA1AB"> H </tspan><tspan fill="${dayCol}">${fmt(last.h)}</tspan><tspan fill="#9BA1AB"> L </tspan><tspan fill="${dayCol}">${fmt(last.l)}</tspan><tspan fill="#9BA1AB"> C </tspan><tspan fill="${dayCol}">${fmt(last.c)} ${pct >= 0 ? '+' : ''}${pct}%</tspan></text>`;
  // volume
  const vTop = top + priceH + 4;
  out += `<line x1="0" x2="${W}" y1="${vTop - 2}" y2="${vTop - 2}" stroke="#262729"/>`;
  out += `<text x="8" y="${vTop + 12}" fill="#9BA1AB" font-size="11" font-family="${mono}">volume ${(last.v / 1000).toFixed(1)}k</text>`;
  candles.forEach((k, i) => {
    const x = i * step + step / 2;
    const hgt = k.v / maxV * (volH - 18);
    out += `<rect x="${x - step * 0.28}" y="${vTop + volH - 4 - hgt}" width="${step * 0.56}" height="${hgt}" fill="${k.c >= k.o ? '#3FFF6C' : '#FF5A6E'}" opacity="0.8"${bar(i)}/>`;
  });
  // time axis
  candles.forEach((k, i) => {
    const d = new Date(k.t * 1000);
    if (d.getUTCDate() !== 1) return;
    out += `<text x="${i * step}" y="${H - 6}" fill="#5E656F" font-size="11" font-family="${mono}">${months[d.getUTCMonth()]}</text>`;
  });
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = out;
}
// The chart draws itself once, in front of the visitor: the candles and their
// volume grow from the baseline in a sweep from left to right, the last-price
// line runs along under the sweep, and the tag and the live dot land with the
// last candle. It starts as the sheet docks (its top edge within a tenth of the
// screen from the bar), not when the window first peeks in: by then the eye is
// on the chart and the sheet has stopped moving. About two seconds in all.
let grown = !live;
// The observer's first notification carries the host's size, so that is the
// first draw; a call before it would draw the same chart twice on load.
new ResizeObserver(draw).observe(host);
const reveal = () => {
  grown = true;
  const per = 0.012, sweep = per * candles.length;
  const bars = svg.querySelectorAll('[data-bar]');
  Motion.animate(bars, { transform: ['scaleY(0)', 'scaleY(1)'] }, { duration: 0.65, delay: (i) => +bars[i].dataset.bar * per, ease: out });
  Motion.animate(svg.querySelector('[data-line]'), { x2: [0, chartW] }, { duration: sweep, ease: 'linear' });
  Motion.animate(svg.querySelector('[data-tag]'), { opacity: [0, 1], transform: ['translateX(10px)', 'translateX(0px)'] }, { duration: 0.4, delay: sweep - 0.1, ease: out });
  Motion.animate('.live', { opacity: [0, 1] }, { duration: 0.4, delay: sweep - 0.1 });
};
if (live) ScrollTrigger.create({ trigger: '.lift', start: 'top 10%', once: true, onEnter: reveal });
