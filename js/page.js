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

// Below the window, things reveal as they enter view: the four nodes of the
// flow in turn, then the two lists, then the two venues.
if (live) {
  const { animate, inView, stagger } = Motion;
  const rise = (els, delay = 0) => animate(els, { opacity: [0, 1], transform: ['translateY(18px)', 'translateY(0px)'] }, { duration: 0.7, delay, ease: out });
  inView('.flow', () => { rise(document.querySelectorAll('.node'), stagger(0.09)); }, { amount: 0.3 });
  inView('.ledger', () => { rise(document.querySelectorAll('.ledger > *'), stagger(0.1)); }, { amount: 0.3 });
  inView('.venue-grid', () => { rise(document.querySelectorAll('.venue'), stagger(0.1)); }, { amount: 0.3 });
}

// The veil behind the bar grows with the share of the bar's own height that
// the sections after the hero cover, so it fades in as the sheet slides up
// under the bar and stays while anything else is under it.
const nav = document.querySelector('.nav');
const covering = [...document.querySelectorAll('.sheet, .secure, .venues, footer')];
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

// The chart: ETH on Hyperliquid, daily candles, live. The snapshot baked here
// (candleSnapshot on the public info endpoint, 2026-09-17, as [time, open,
// high, low, close, volume]) is what the page draws when the venue cannot be
// reached; the venue's own answer replaces it on load, and a websocket then
// keeps the last candle, the price and the day's figures moving. The chart
// shows as many of the last days as fit its box at a readable width, up to
// a hundred and twenty.
const host = document.querySelector('.chart-host');
const svg = document.getElementById('chart');
const mono = 'Geist Mono, ui-monospace, monospace';
const num = (v, d = 1) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const usd = (v) => '$' + num(v, 2);
const short = (v) => v >= 1e6 ? (v / 1e6).toFixed(1) + 'm' : v >= 1e3 ? (v / 1e3).toFixed(1) + 'k' : String(Math.round(v));
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY = 86400000;
const rows = [[1779321600,2129.0,2156.7,2104.2,2133.1,389190],[1779408000,2133.3,2140.9,2056.2,2064.8,417363],[1779494400,2064.9,2149.0,2008.5,2116.8,568276],[1779580800,2116.8,2130.0,2061.4,2098.6,223073],[1779667200,2098.6,2141.0,2090.9,2112.4,254532],[1779753600,2112.4,2140.0,2053.6,2072.6,387663],[1779840000,2072.7,2096.2,2015.2,2023.9,385954],[1779926400,2023.8,2029.3,1966.6,2009.2,491498],[1780012800,2009.2,2046.7,1976.1,2013.7,479917],[1780099200,2013.7,2032.7,2001.1,2021.6,195769],[1780185600,2021.6,2037.2,1993.4,2006.7,200385],[1780272000,2006.8,2021.5,1954.8,2006.9,456761],[1780358400,2007.0,2007.0,1838.0,1859.0,781056],[1780444800,1859.2,1892.0,1770.0,1812.3,791866],[1780531200,1812.3,1819.9,1716.7,1770.3,827725],[1780617600,1770.1,1773.9,1539.4,1582.4,1462462],[1780704000,1582.3,1600.7,1504.4,1568.8,500456],[1780790400,1568.9,1720.2,1563.3,1689.4,550546],[1780876800,1689.6,1713.8,1643.7,1688.8,692794],[1780963200,1688.6,1696.6,1609.8,1638.5,846439],[1781049600,1638.7,1667.4,1603.4,1620.9,830495],[1781136000,1621.0,1693.7,1620.9,1672.7,685154],[1781222400,1672.7,1690.8,1651.2,1665.7,516953],[1781308800,1665.6,1696.4,1661.6,1680.3,175328],[1781395200,1680.4,1732.4,1654.6,1725.3,547078],[1781481600,1725.2,1849.5,1708.8,1795.5,605134],[1781568000,1795.5,1839.4,1757.8,1792.8,732878],[1781654400,1792.8,1810.0,1724.9,1749.7,547336],[1781740800,1749.9,1762.5,1671.2,1711.1,611850],[1781827200,1711.1,1719.7,1678.4,1711.2,417086],[1781913600,1711.3,1750.0,1703.7,1740.5,252848],[1782000000,1740.4,1740.6,1701.6,1706.1,306379],[1782086400,1706.2,1778.6,1706.1,1727.9,933783],[1782172800,1727.9,1735.8,1634.1,1666.4,615326],[1782259200,1666.4,1691.1,1551.3,1621.2,706747],[1782345600,1621.1,1659.0,1531.3,1566.6,683606],[1782432000,1566.5,1592.8,1511.0,1577.6,694181],[1782518400,1577.7,1609.9,1562.1,1572.9,158700],[1782604800,1572.9,1587.2,1547.6,1570.9,167372],[1782691200,1571.0,1636.2,1549.3,1612.4,426375],[1782777600,1612.3,1613.4,1549.9,1571.4,504183],[1782864000,1571.4,1645.0,1552.0,1608.6,539371],[1782950400,1608.9,1724.2,1596.6,1701.3,558884],[1783036800,1701.2,1776.3,1695.2,1759.3,401626],[1783123200,1759.3,1807.4,1744.8,1781.1,273780],[1783209600,1781.2,1809.0,1749.5,1786.3,177339],[1783296000,1786.2,1834.0,1729.6,1800.4,465077],[1783382400,1800.5,1813.3,1757.8,1772.0,383313],[1783468800,1771.4,1784.8,1713.0,1743.6,499805],[1783555200,1743.6,1762.0,1722.0,1745.0,352288],[1783641600,1745.1,1811.5,1737.5,1796.5,413192],[1783728000,1796.4,1829.1,1786.3,1787.2,226305],[1783814400,1787.2,1826.6,1778.8,1806.7,217753],[1783900800,1806.6,1845.8,1750.5,1776.8,902783],[1783987200,1776.9,1896.5,1773.7,1891.7,511868],[1784073600,1891.7,1946.5,1864.1,1918.3,424285],[1784160000,1918.1,1929.4,1857.4,1865.1,466171],[1784246400,1865.1,1871.4,1803.3,1841.6,409035],[1784332800,1841.6,1867.1,1837.4,1863.0,175437],[1784419200,1863.0,1879.2,1853.5,1872.2,158983],[1784505600,1872.2,1918.1,1843.0,1904.0,504267],[1784592000,1904.1,1952.0,1900.2,1929.5,412747],[1784678400,1929.5,1955.9,1910.4,1933.4,456353],[1784764800,1933.5,1941.0,1868.1,1877.7,460315],[1784851200,1877.8,1909.3,1847.0,1861.0,407329],[1784937600,1860.7,1876.0,1850.4,1874.3,123616],[1785024000,1874.3,1967.9,1873.5,1954.2,248042],[1785110400,1954.3,1980.8,1881.6,1891.6,537553],[1785196800,1891.5,1928.1,1856.3,1921.4,566862],[1785283200,1921.3,1936.4,1874.1,1910.0,529937],[1785369600,1910.0,1936.0,1893.4,1917.6,398638],[1785456000,1917.6,1935.4,1848.0,1861.6,489274],[1785542400,1861.6,1874.4,1820.7,1843.9,202115],[1785628800,1843.9,1898.6,1843.2,1884.6,283207],[1785715200,1884.5,1885.4,1827.6,1859.4,344525],[1785801600,1859.5,1881.1,1847.4,1869.4,418542],[1785888000,1869.5,1927.0,1854.7,1908.1,507785],[1785974400,1908.1,1918.9,1892.0,1903.0,366686],[1786060800,1902.9,1939.4,1893.5,1913.1,541762],[1786147200,1913.0,1925.8,1911.3,1916.0,93693],[1786233600,1916.1,1937.5,1906.8,1909.9,122842],[1786320000,1910.0,1930.6,1867.0,1872.5,423063],[1786406400,1872.5,1896.7,1852.7,1882.0,338408],[1786492800,1882.1,1924.3,1872.6,1879.5,339813],[1786579200,1879.5,1899.5,1862.3,1885.4,387396],[1786665600,1885.4,1890.6,1863.4,1881.2,261596],[1786752000,1881.3,1885.6,1875.3,1882.3,81095],[1786838400,1882.3,1891.3,1868.7,1875.6,158440],[1786924800,1875.6,1917.9,1871.8,1913.0,283004],[1787011200,1912.9,1922.0,1884.8,1916.8,343094],[1787097600,1916.9,2346.8,1905.3,2253.5,1933966],[1787184000,2252.9,2360.8,2224.0,2328.0,994378],[1787270400,2328.1,2550.5,2325.9,2518.3,1514441],[1787356800,2518.2,2533.8,2383.3,2423.4,777179],[1787443200,2423.5,2487.0,2357.2,2464.4,647399],[1787529600,2464.5,2534.0,2425.0,2482.3,789323],[1787616000,2481.8,2532.5,2407.5,2441.6,735983],[1787702400,2441.7,2514.9,2431.6,2506.0,503177],[1787788800,2506.2,2566.4,2480.4,2510.1,642623],[1787875200,2510.1,2533.8,2405.4,2442.3,546717],[1787961600,2442.3,2459.6,2430.1,2457.3,123456],[1788048000,2457.6,2536.7,2388.0,2417.5,512422],[1788134400,2417.5,2490.0,2400.7,2468.0,486825],[1788220800,2467.9,2485.8,2383.2,2418.9,415273],[1788307200,2418.9,2429.5,2356.0,2391.6,470326],[1788393600,2391.3,2529.4,2369.2,2508.1,545047],[1788480000,2508.1,2545.9,2430.6,2455.4,523765],[1788566400,2455.6,2493.0,2444.1,2479.9,133793],[1788652800,2479.8,2525.8,2462.3,2515.1,272776],[1788739200,2514.8,2536.0,2465.1,2489.2,315744],[1788825600,2489.2,2507.4,2440.0,2484.4,423939],[1788912000,2484.3,2523.0,2441.6,2467.2,513293],[1788998400,2467.2,2483.9,2403.8,2437.1,469442],[1789084800,2437.2,2666.2,2433.3,2515.4,1060794],[1789171200,2515.5,2544.7,2507.5,2525.4,148314],[1789257600,2525.4,2527.1,2460.4,2476.0,376025],[1789344000,2475.9,2615.5,2464.7,2514.9,755882],[1789430400,2514.5,2519.3,2356.6,2397.0,973785],[1789516800,2397.1,2430.0,2366.9,2417.5,565796],[1789603200,2417.7,2482.8,2413.0,2471.5,329302]];
let candles = rows.map(([t, o, h, l, c, v]) => ({ t: t * 1000, o, h, l, c, v }));
let hours = [];
let chartW = 0, visible = candles, lastCount = 0;

// A round step for the price grid: about six lines, on a 1, 2, 2.5 or 5.
const niceStep = (range) => {
  if (!(range > 0)) return 1;
  const raw = range / 6, p = Math.pow(10, Math.floor(Math.log10(raw)));
  for (const m of [1, 2, 2.5, 5, 10]) if (raw <= m * p) return m * p;
  return 10 * p;
};

// Time left on the last candle, as the app draws it under the price tag.
const left = () => {
  const ms = Math.max(0, candles[candles.length - 1].t + DAY - Date.now());
  const h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000);
  return `${h}:${String(m).padStart(2, '0')}`;
};

function draw() {
  const W = host.clientWidth, H = host.clientHeight;
  if (!W || !H) return;
  const axis = 62, top = 30, volH = Math.round(H * 0.16), timeH = 22;
  const priceH = H - top - volH - timeH;
  chartW = W - axis;
  // as many candles as the width holds at 6.5px each, between 40 and 120
  const count = Math.max(40, Math.min(120, Math.floor(chartW / 6.5), candles.length));
  visible = candles.slice(-count);
  const last = visible[visible.length - 1];
  const step = chartW / visible.length;
  const gridStep = niceStep(Math.max(...visible.map(k => k.h)) - Math.min(...visible.map(k => k.l)));
  const lo = Math.floor(Math.min(...visible.map(k => k.l)) / gridStep) * gridStep;
  const hi = Math.ceil(Math.max(...visible.map(k => k.h)) / gridStep) * gridStep;
  const maxV = Math.max(...visible.map(k => k.v));
  const y = (v) => top + (hi - v) / (hi - lo) * priceH;
  // until the visitor is looking, the bars wait flat on their baselines, the
  // last-price line has no length and its tag is clear; each bar carries its
  // candle's index so the wick, the body and the volume of one day move together
  const bar = (i) => grown ? ` data-bar="${i}"` : ` data-bar="${i}" style="transform: scaleY(0)"`;
  const hidden = grown ? '' : ' style="opacity: 0"';
  const tagCol = last.c >= last.o ? '#3FFF6C' : '#FF5A6E';
  let out = '';
  // grid: a line at each price step, and one at each new month
  for (let v = lo; v <= hi + 1e-9; v += gridStep) {
    out += `<line x1="0" x2="${chartW}" y1="${y(v)}" y2="${y(v)}" stroke="#1B1D20"/>`;
    // an axis label under the last price tag would collide with it, so it is skipped
    if (Math.abs(y(v) - y(last.c)) > 16 && v > lo) out += `<text x="${chartW + 8}" y="${y(v) + 4}" fill="#5E656F" font-size="11" font-family="${mono}">${num(v, 0)}</text>`;
  }
  visible.forEach((k, i) => {
    if (new Date(k.t).getUTCDate() === 1) out += `<line x1="${i * step}" x2="${i * step}" y1="${top - 8}" y2="${top + priceH + volH}" stroke="#1B1D20"/>`;
  });
  // candles
  visible.forEach((k, i) => {
    const x = i * step + step / 2;
    const col = k.c >= k.o ? '#3FFF6C' : '#FF5A6E';
    out += `<line x1="${x}" x2="${x}" y1="${y(k.h)}" y2="${y(k.l)}" stroke="${col}"${bar(i)}/>`;
    const t = y(Math.max(k.o, k.c)), b = y(Math.min(k.o, k.c));
    out += `<rect x="${x - step * 0.3}" y="${t}" width="${step * 0.6}" height="${Math.max(1, b - t)}" fill="${col}"${bar(i)}/>`;
  });
  // the last price on the axis, with the time left on the candle under it
  out += `<line data-line x1="0" x2="${grown ? chartW : 0}" y1="${y(last.c)}" y2="${y(last.c)}" stroke="${tagCol}" stroke-dasharray="2 3" opacity="0.7"/>`;
  out += `<g data-tag${hidden}>`;
  out += `<rect x="${chartW}" y="${y(last.c) - 9}" width="${axis}" height="18" fill="${tagCol}"/>`;
  out += `<text x="${chartW + 8}" y="${y(last.c) + 4}" fill="#0E0F13" font-size="11" font-weight="600" font-family="${mono}">${num(last.c, 0)}</text>`;
  out += `<text x="${chartW + 8}" y="${y(last.c) + 22}" fill="#5E656F" font-size="10" font-family="${mono}">${left()}</text>`;
  out += `</g>`;
  // legend
  const pct = ((last.c / last.o - 1) * 100);
  const sign = pct >= 0 ? '+' : '';
  // on a phone the chart is too narrow for the symbol and the day's figures both
  const symbol = chartW < 420 ? '' : `<tspan fill="#3FFF6C">ETH-USD</tspan><tspan fill="#9BA1AB"> 1d </tspan>`;
  out += `<text x="8" y="18" font-size="11" font-family="${mono}">${symbol}<tspan fill="#9BA1AB">O </tspan><tspan fill="${tagCol}">${num(last.o)}</tspan><tspan fill="#9BA1AB"> H </tspan><tspan fill="${tagCol}">${num(last.h)}</tspan><tspan fill="#9BA1AB"> L </tspan><tspan fill="${tagCol}">${num(last.l)}</tspan><tspan fill="#9BA1AB"> C </tspan><tspan fill="${tagCol}">${num(last.c)}</tspan><tspan fill="${tagCol}"> ${sign}${pct.toFixed(2)}%</tspan></text>`;
  // volume, with its own scale on the axis
  const vTop = top + priceH + 4;
  out += `<line x1="0" x2="${W}" y1="${vTop - 2}" y2="${vTop - 2}" stroke="#262729"/>`;
  out += `<text x="8" y="${vTop + 12}" fill="#9BA1AB" font-size="11" font-family="${mono}">volume ${short(last.v)}</text>`;
  out += `<text x="${chartW + 8}" y="${vTop + 12}" fill="#5E656F" font-size="10" font-family="${mono}">${short(maxV)}</text>`;
  out += `<text x="${chartW + 8}" y="${vTop + volH - 5}" fill="#5E656F" font-size="10" font-family="${mono}">0</text>`;
  visible.forEach((k, i) => {
    const x = i * step + step / 2;
    const hgt = k.v / maxV * (volH - 18);
    out += `<rect x="${x - step * 0.3}" y="${vTop + volH - 4 - hgt}" width="${step * 0.6}" height="${hgt}" fill="${k.c >= k.o ? '#3FFF6C' : '#FF5A6E'}" opacity="0.8"${bar(i)}/>`;
  });
  // time axis: the month, at its first day
  visible.forEach((k, i) => {
    const d = new Date(k.t);
    if (d.getUTCDate() !== 1) return;
    out += `<text x="${i * step + 4}" y="${H - 6}" fill="#5E656F" font-size="11" font-family="${mono}">${months[d.getUTCMonth()]}</text>`;
  });
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = out;
  lastCount = visible.length;
}

// The market head: the price, the day's change against the price a day ago,
// and the day's high and low, from the last twenty-four hourly candles.
const pxEl = document.getElementById('px'), chgEl = document.getElementById('chg'), hiEl = document.getElementById('hi24'), loEl = document.getElementById('lo24'), msEl = document.getElementById('ms');
let shownPx = 0;
function head() {
  const last = candles[candles.length - 1];
  if (last.c !== shownPx) {
    pxEl.textContent = usd(last.c);
    if (shownPx) {
      pxEl.classList.remove('up', 'down');
      void pxEl.offsetWidth;
      pxEl.classList.add(last.c > shownPx ? 'up' : 'down');
      setTimeout(() => pxEl.classList.remove('up', 'down'), 300);
    }
    shownPx = last.c;
  }
  const day = hours.filter(k => k.t >= Date.now() - DAY);
  if (!day.length) return;
  const open = day[0].o, diff = last.c - open, pct = (last.c / open - 1) * 100;
  chgEl.textContent = `${diff >= 0 ? '+' : '-'}${num(Math.abs(diff), 2)} / ${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
  chgEl.classList.toggle('neg', diff < 0);
  chgEl.classList.toggle('pos', diff >= 0);
  hiEl.textContent = usd(Math.max(...day.map(k => k.h), last.c));
  loEl.textContent = usd(Math.min(...day.map(k => k.l), last.c));
}

// The chart draws itself once, in front of the visitor: the candles and their
// volume grow from the baseline in a sweep from left to right, the last-price
// line runs along under the sweep, and the tag and the live dot land with the
// last candle. It starts as the sheet docks (its top edge within a tenth of the
// screen from the bar), not when the window first peeks in: by then the eye is
// on the chart and the sheet has stopped moving. About two seconds in all.
// A live tick that lands mid-sweep waits for the sweep to end.
let grown = !live, sweeping = false, wanted = false, drawAt = 0, drawTimer = 0;
const redraw = () => {
  if (sweeping) { wanted = true; return; }
  const wait = 200 - (performance.now() - drawAt);
  if (wait > 0) { if (!drawTimer) drawTimer = setTimeout(() => { drawTimer = 0; redraw(); }, wait); return; }
  drawAt = performance.now();
  draw();
};
// The observer's first notification carries the host's size, so that is the
// first draw; a call before it would draw the same chart twice on load.
new ResizeObserver(() => { if (!sweeping) { drawAt = performance.now(); draw(); } }).observe(host);
const reveal = () => {
  grown = true; sweeping = true;
  draw();
  const per = 0.012, sweep = per * lastCount;
  const bars = svg.querySelectorAll('[data-bar]');
  Motion.animate(bars, { transform: ['scaleY(0)', 'scaleY(1)'] }, { duration: 0.65, delay: (i) => +bars[i].dataset.bar * per, ease: out });
  Motion.animate(svg.querySelector('[data-line]'), { x2: [0, chartW] }, { duration: sweep, ease: 'linear' });
  Motion.animate(svg.querySelector('[data-tag]'), { opacity: [0, 1], transform: ['translateX(10px)', 'translateX(0px)'] }, { duration: 0.4, delay: sweep - 0.1, ease: out });
  Motion.animate('.live', { opacity: [0, 1] }, { duration: 0.4, delay: sweep - 0.1 });
  setTimeout(() => { sweeping = false; if (wanted) { wanted = false; redraw(); } }, (sweep + 0.7) * 1000);
};
if (live) ScrollTrigger.create({ trigger: '.lift', start: 'top 10%', once: true, onEnter: reveal });
head();

// The venue. One request for the daily candles and one for the hourly ones,
// then a socket that streams both candles as they form. If the venue does not
// answer, the snapshot stands and nothing else changes.
const API = 'https://api.hyperliquid.xyz';
const parse = (list) => list.map(k => ({ t: k.t, o: +k.o, h: +k.h, l: +k.l, c: +k.c, v: +k.v }));
const snapshot = async (interval, span) => {
  const now = Date.now();
  const r = await fetch(API + '/info', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'candleSnapshot', req: { coin: 'ETH', interval, startTime: now - span, endTime: now } }) });
  if (!r.ok) throw new Error(r.status);
  return parse(await r.json());
};
// a candle from the stream replaces the one it updates, or opens a new one
const merge = (list, k, cap) => {
  const last = list[list.length - 1];
  if (last && k.t === last.t) list[list.length - 1] = k;
  else if (!last || k.t > last.t) { list.push(k); if (list.length > cap) list.shift(); }
};
(async () => {
  try {
    const t0 = performance.now();
    const days = await snapshot('1d', 130 * DAY);
    if (msEl) msEl.textContent = `${Math.round(performance.now() - t0)} ms`;
    if (days.length > 20) candles = days.slice(-120);
    hours = (await snapshot('1h', 26 * 3600000)).slice(-26);
    head();
    redraw();
  } catch (e) {
    return;
  }
  let sock, backoff = 1000;
  const open = () => {
    sock = new WebSocket('wss://api.hyperliquid.xyz/ws');
    sock.onopen = () => {
      backoff = 1000;
      for (const interval of ['1d', '1h']) sock.send(JSON.stringify({ method: 'subscribe', subscription: { type: 'candle', coin: 'ETH', interval } }));
    };
    sock.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.channel !== 'candle') return;
      const k = parse([m.data])[0];
      if (m.data.i === '1d') { merge(candles, k, 120); redraw(); }
      else merge(hours, k, 26);
      head();
    };
    sock.onclose = () => { if (!document.hidden) setTimeout(open, backoff); backoff = Math.min(backoff * 2, 30000); };
    sock.onerror = () => sock.close();
  };
  open();
  // the time left on the candle moves once a minute even when the price does not
  setInterval(redraw, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && sock.readyState > 1) open(); });
})();

// The flow. The proposal is one line of English that travels the four stops:
// it appears with the agent, moves to the rules and gets its green dot, then
// moves to You and waits there for as long as the visitor likes. Approve is the
// one real control on the page, and the only way the proposal goes any further:
// then the finger, the enclave, "signed", and out to the venue. Each node keeps
// a slot at its bottom edge for the proposal to park in, so it never sits on a
// word. With reduced motion the proposal simply waits at You and the click
// moves it to the enclave in one step.
{
  const flow = document.querySelector('.flow');
  const packet = document.getElementById('packet');
  const tag = packet.querySelector('.tag');
  const nodes = [...flow.querySelectorAll('.node')];
  const button = document.getElementById('approve');
  const glyph = nodes[2].querySelector('.glyph');
  let at = 2, busy = false, pulse = null;
  const spot = (i) => {
    const f = flow.getBoundingClientRect(), n = nodes[i].getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(nodes[i]).paddingLeft);
    return { x: n.left - f.left + pad, y: n.bottom - f.top - 20 - 32 };
  };
  const put = (i) => { const p = spot(i); packet.style.transform = `translate(${p.x}px, ${p.y}px)`; at = i; };
  const go = (i, duration = 0.8) => {
    const a = spot(at), b = spot(i);
    at = i;
    return Motion.animate(packet, { transform: [`translate(${a.x}px, ${a.y}px)`, `translate(${b.x}px, ${b.y}px)`] }, { duration, ease: out }).finished;
  };
  const wait = (s) => new Promise(r => setTimeout(r, s * 1000));
  const state = (s, t) => { packet.dataset.state = s; tag.textContent = t; };
  const horizontal = () => matchMedia('(min-width: 861px)').matches;
  const park = () => {
    state('waiting', 'waiting');
    if (live) pulse = Motion.animate(button, { transform: ['scale(1)', 'scale(1.045)', 'scale(1)'] }, { duration: 1.6, repeat: Infinity, ease: 'easeInOut' });
  };
  const arrive = async () => {
    busy = true;
    packet.style.opacity = '0';
    put(0);
    state('', '');
    await Motion.animate(packet, { opacity: [0, 1] }, { duration: 0.4 }).finished;
    await wait(0.9);
    await go(1);
    state('checked', 'checked');
    await wait(0.9);
    await go(2);
    park();
    busy = false;
  };
  const release = async () => {
    if (busy || at !== 2) return;
    busy = true;
    button.disabled = true;
    if (pulse) { pulse.stop(); pulse = null; button.style.transform = ''; }
    button.textContent = 'Touch ID';
    if (!live) {
      put(3); state('signed', 'signed');
      await wait(1.6);
      packet.style.opacity = '0';
      await wait(0.4);
      put(2); park(); button.textContent = 'Approve'; button.disabled = false; busy = false;
      return;
    }
    await Motion.animate(glyph, { transform: ['scale(1)', 'scale(1.18)', 'scale(1)'] }, { duration: 0.7, ease: out }).finished;
    state('checked', 'released');
    await go(3);
    state('signed', 'signed');
    await wait(0.9);
    const p = spot(3);
    const away = horizontal() ? `translate(${p.x + 140}px, ${p.y}px)` : `translate(${p.x}px, ${p.y + 70}px)`;
    await Motion.animate(packet, { transform: [`translate(${p.x}px, ${p.y}px)`, away], opacity: [1, 0] }, { duration: 0.6, ease: 'easeIn' }).finished;
    await wait(1.2);
    button.textContent = 'Approve';
    button.disabled = false;
    arrive();
  };
  button.addEventListener('click', release);
  addEventListener('resize', () => { if (!busy) put(at); });
  document.fonts.ready.then(() => {
    put(2);
    if (!live) { park(); return; }
    packet.style.opacity = '0';
    Motion.inView('.flow', () => { setTimeout(arrive, 700); }, { amount: 0.5 });
  });
}
