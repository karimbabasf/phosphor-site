// The invite page and the not-found page can hold an invite code in the address (#PHOS-...).
// Vercel's insights script reports location.href, the part after # included, so neither page may
// load it or any script but its own, and their own scripts make no request. Every other page that
// loads the insights script loads /js/analytics.js before it, which drops the hash from each
// event, since a mangled invite link can land on any page.
//
//   node scripts/check-pages.mjs            exits 1 and names each problem
//
// build-docs.mjs runs the same check after it writes the pages, so the build fails too.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Each page, the only scripts it may load, and whether the first of them must be there, first
// and blocking, because it is the one that clears the address bar.
export const guarded = [
  { file: 'invite/index.html', scripts: ['/js/invite.js'], first: true },
  { file: '404.html', scripts: ['/js/notfound.js'], first: false },
];
const INSIGHTS = '/_vercel/insights/script.js';
const STRIP = '/js/analytics.js';

const analytics = /_vercel\/(speed-)?insights|vercel-scripts\.com|googletagmanager|google-analytics|plausible\.io|posthog/i;
const request = /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|\bimport\s*\(|importScripts|new\s+Image\b|\.src\s*=|window\.open/;
const scriptTags = (html) => [...html.matchAll(/<script\b([^>]*)>/gi)].map(([, attrs]) => ({ attrs, src: /\bsrc\s*=\s*["']?([^"'\s>]+)/i.exec(attrs)?.[1].split(/[?#]/)[0] }));
const htmlFiles = (root, rel = '') => readdirSync(join(root, rel), { withFileTypes: true }).flatMap((d) =>
  d.name.startsWith('.') || d.name === 'node_modules' ? [] : d.isDirectory() ? htmlFiles(root, join(rel, d.name)) : d.name.endsWith('.html') ? [join(rel, d.name)] : []);

// The pages that load the insights script.
export const analyticsPages = (root) => htmlFiles(root).filter((f) => scriptTags(readFileSync(join(root, f), 'utf8')).some((t) => t.src === INSIGHTS));

export function checkPages(root) {
  const problems = [];
  const scriptFiles = new Set();
  for (const { file, scripts, first } of guarded) {
    const path = join(root, file);
    if (!existsSync(path)) { problems.push(`${file}: missing`); continue; }
    const html = readFileSync(path, 'utf8');
    if (analytics.test(html)) problems.push(`${file}: carries an analytics tag`);
    const tags = scriptTags(html);
    for (const { src } of tags) {
      if (!src) problems.push(`${file}: has an inline script`);
      else if (!scripts.includes(src)) problems.push(`${file}: loads ${src}, which is not its own script`);
      else scriptFiles.add(src);
    }
    if (first) {
      const [top] = tags;
      if (!top || top.src !== scripts[0]) problems.push(`${file}: its first script must be ${scripts[0]}`);
      else if (/\b(async|defer)\b|\btype\s*=\s*["']?module/i.test(top.attrs)) problems.push(`${file}: ${scripts[0]} must load blocking, not async, deferred or as a module`);
    }
  }
  // Deferred scripts run in document order, so analytics.js runs first if it comes first and is
  // deferred like the insights script, or blocking.
  for (const file of analyticsPages(root)) {
    const tags = scriptTags(readFileSync(join(root, file), 'utf8'));
    const at = tags.findIndex((t) => t.src === INSIGHTS);
    const strip = tags.findIndex((t) => t.src === STRIP);
    if (strip < 0 || strip > at) problems.push(`${file}: loads the insights script without ${STRIP} before it`);
    else if (/\basync\b|\btype\s*=\s*["']?module/i.test(tags[strip].attrs) || (/\bdefer\b/i.test(tags[strip].attrs) && !/\bdefer\b/i.test(tags[at].attrs))) problems.push(`${file}: ${STRIP} must run before the insights script`);
    else scriptFiles.add(STRIP);
  }
  for (const src of scriptFiles) {
    const path = join(root, src);
    if (!existsSync(path)) { problems.push(`${src}: missing`); continue; }
    const code = readFileSync(path, 'utf8');
    if (src !== STRIP && analytics.test(code)) problems.push(`${src}: names an analytics script`);
    if (request.test(code)) problems.push(`${src}: makes a request`);
  }
  return problems;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const problems = checkPages(root);
  for (const p of problems) console.error(`check-pages: ${p}`);
  if (problems.length) process.exit(1);
  console.log(`check-pages: ${guarded.map(g => g.file).join(' and ')} load no analytics and no script but their own; ${analyticsPages(root).length} pages load the insights script, each after ${STRIP}`);
}
