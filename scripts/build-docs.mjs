// Renders the app's docs and the site's own terms, privacy and security pages into static pages,
// plus the 404 page and the sitemap.
//
//   node scripts/build-docs.mjs            reads ../phosphor/docs (PHOSPHOR_DOCS overrides)
//
// The docs are markdown in the app repo, next to the code they describe, so a
// version bump updates them in the same commit. This script is the whole site
// side: docs/README.md lists the pages in order under "## Pages", each page is
// one file whose first line is its title and whose first paragraph is its
// summary, and links between pages are relative .md links. Every page becomes
// docs/<slug>/index.html here; content/<slug>.md becomes <slug>/index.html. The
// output is committed, so the site stays static and needs no build on Vercel.
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from './vendor/marked.esm.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const appRoot = resolve(root, process.env.PHOSPHOR_DOCS ? join(process.env.PHOSPHOR_DOCS, '..') : '../phosphor');
const src = process.env.PHOSPHOR_DOCS ? resolve(root, process.env.PHOSPHOR_DOCS) : join(appRoot, 'docs');
const version = JSON.parse(readFileSync(join(appRoot, 'package.json'), 'utf8')).version;
const repo = 'https://github.com/karimbabasf/phosphor';
const today = new Date().toISOString().slice(0, 10);

// The index: the ordered list under "## Pages", and the developer list after it.
const index = readFileSync(join(src, 'README.md'), 'utf8');
const list = (heading) => {
  const m = index.match(new RegExp(`^## ${heading}\\n([\\s\\S]*?)(?=^## |\\s*$(?![\\s\\S]))`, 'm'));
  if (!m) throw new Error(`docs/README.md has no "## ${heading}" list`);
  return [...m[1].matchAll(/^- \[([^\]]+)\]\(([^)]+\.md)\)(?::\s*(.*))?$/gm)].map(([, title, file, line]) => ({ title, file, slug: basename(file, '.md'), line: line || '' }));
};
const pages = list('Pages');
const dev = list('For developers');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = (s) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// One renderer: headings carry ids and a link to themselves; a link to another
// page becomes its site url; every outside link opens in a new tab.
const renderer = {
  heading({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    const id = slugify(text);
    return `<h${depth} id="${id}">${text}<a class="anchor" href="#${id}" aria-label="Link to this section">#</a></h${depth}>\n`;
  },
  link({ href, title, tokens }) {
    const text = this.parser.parseInline(tokens);
    const t = title ? ` title="${esc(title)}"` : '';
    const m = href.match(/^([\w-]+)\.md(#.*)?$/);
    if (m) {
      const known = pages.find(p => p.slug === m[1]);
      const url = known ? `/docs/${m[1]}/${m[2] || ''}` : `${repo}/blob/main/docs/${m[1]}.md${m[2] || ''}`;
      return known ? `<a href="${url}"${t}>${text}</a>` : `<a href="${url}"${t} target="_blank" rel="noopener">${text}</a>`;
    }
    if (/^https?:\/\//.test(href)) return `<a href="${esc(href)}"${t} target="_blank" rel="noopener">${text}</a>`;
    return `<a href="${esc(href)}"${t}>${text}</a>`;
  },
};
marked.use({ renderer, gfm: true });

// The head of a page: its title (the H1) and its summary (the first paragraph).
const split = (md) => {
  const lines = md.split('\n');
  const h = lines.findIndex(l => /^# /.test(l));
  if (h < 0) throw new Error('page has no H1');
  const title = lines[h].slice(2).trim();
  let i = h + 1;
  while (i < lines.length && !lines[i].trim()) i++;
  const summary = [];
  while (i < lines.length && lines[i].trim() && !/^#/.test(lines[i])) summary.push(lines[i++]);
  return { title, summary: summary.join(' ').trim(), body: lines.slice(i).join('\n') };
};

const headings = (html) => [...html.matchAll(/<h2 id="([^"]+)">(.*?)<a class="anchor"/g)].map(([, id, text]) => ({ id, text: text.replace(/<[^>]+>/g, '') }));

const css = readFileSync(join(root, 'scripts', 'page.css'), 'utf8');

const nav = (active) => `
<div class="nav">
  <a class="mark" href="/" aria-label="Phosphor"><img src="/mark-green.svg" alt="" width="27" height="30"></a>
  <nav class="sections" aria-label="Sections">
    <a href="/#dashboard">The app</a>
    <a href="/#security">Security</a>
    <a href="/#venues">Venues</a>
  </nav>
  <nav class="links" aria-label="Site">
    <a href="/docs/"${active === 'docs' ? ' aria-current="page"' : ''}>Docs</a>
    <a href="${repo}">GitHub</a>
    <a href="https://x.com/usephosphor">X</a>
    <a class="download" href="/download/mac">Download for Mac</a>
  </nav>
</div>`;

const footer = `
<footer>
  <div class="wrap">
    <div class="foot-row">
      <a class="mark" href="/" aria-label="Phosphor"><img src="/mark-green.svg" alt="" width="17" height="20"></a>
      <span>Phosphor</span>
      <span class="spacer"></span>
      <span class="foot-links">
        <a href="/docs/">Docs</a>
        <a href="${repo}">GitHub</a>
        <a href="https://x.com/usephosphor">X</a>
        <a href="${repo}/blob/main/LICENSE">License</a>
        <a href="/terms/">Terms</a>
        <a href="/privacy/">Privacy</a>
        <a href="/security/">Security</a>
      </span>
    </div>
    <p class="fine">Phosphor is software you run yourself. Your keys stay on your Mac. It is not a wallet service, an exchange, a broker or an adviser, and nothing in it is financial advice. Trading and transfers carry risk, transactions are final, and you can lose money. By downloading or using Phosphor you accept the <a href="/terms/">terms</a>. Questions: <a href="mailto:founder@karimbabasf.com">founder@karimbabasf.com</a>.</p>
  </div>
</footer>`;

const shell = ({ title, description, url, body, active, kind, noindex }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="https://phosphor.karimbabasf.com${url}">`}
<meta name="theme-color" content="#0E0F13">
<link rel="icon" href="/favicon.ico?v=9" sizes="32x32">
<link rel="icon" href="/favicon.svg?v=9" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=9">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Phosphor">
<meta property="og:url" content="https://phosphor.karimbabasf.com${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="https://phosphor.karimbabasf.com/og.png?v=2">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="/fonts/Sora-SemiBold.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/Sora-Regular.woff2" as="font" type="font/woff2" crossorigin>
<style>
${css}
</style>
</head>
<body class="${kind}">
${nav(active)}
${body}
${footer}
</body>
</html>
`;

const sidebar = (current) => `
<aside class="side">
  <input type="checkbox" id="pages" class="side-toggle">
  <label for="pages" class="side-label">Pages</label>
  <nav aria-label="Docs">
    <ul>${pages.map(p => `<li><a href="/docs/${p.slug}/"${p.slug === current ? ' aria-current="page"' : ''}>${esc(p.title)}</a></li>`).join('')}</ul>
    <div class="side-head">For developers</div>
    <ul>${dev.map(p => `<li><a href="${repo}/blob/main/docs/${p.file}" target="_blank" rel="noopener">${esc(p.title)}</a></li>`).join('')}</ul>
  </nav>
</aside>`;

const write = (rel, html) => {
  const file = join(root, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  console.log(`wrote ${rel} (${html.length} bytes)`);
};

// Old page folders go, so a renamed page leaves no orphan behind.
const docsDir = join(root, 'docs');
if (existsSync(docsDir)) for (const d of readdirSync(docsDir, { withFileTypes: true })) if (d.isDirectory()) rmSync(join(docsDir, d.name), { recursive: true });

// The docs index.
{
  const intro = split(index);
  const body = `
<main class="docs wrap">
  ${sidebar('')}
  <article class="doc">
    <header class="doc-head">
      <h1>${esc(intro.title)}</h1>
      <p class="lede">${marked.parseInline(intro.summary)}</p>
      <div class="doc-meta"><span class="mono">v${esc(version)}</span><a href="${repo}/blob/main/docs/README.md" target="_blank" rel="noopener">Source on GitHub</a></div>
    </header>
    <ol class="toc">
      ${pages.map(p => `<li><a href="/docs/${p.slug}/"><strong>${esc(p.title)}</strong><span>${esc(p.line)}</span></a></li>`).join('\n      ')}
    </ol>
    <h2 id="for-developers">For developers</h2>
    <ul class="toc plain">
      ${dev.map(p => `<li><a href="${repo}/blob/main/docs/${p.file}" target="_blank" rel="noopener"><strong>${esc(p.title)}</strong><span>${esc(p.line)}</span></a></li>`).join('\n      ')}
    </ul>
  </article>
</main>`;
  write('docs/index.html', shell({ title: 'Phosphor docs', description: intro.summary.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'), url: '/docs/', body, active: 'docs', kind: 'read' }));
}

// Each page.
pages.forEach((p, i) => {
  const md = readFileSync(join(src, p.file), 'utf8');
  const { title, summary, body } = split(md);
  const html = marked.parse(body);
  const toc = headings(html);
  const prev = pages[i - 1], next = pages[i + 1];
  const article = `
<main class="docs wrap">
  ${sidebar(p.slug)}
  <article class="doc">
    <header class="doc-head">
      <h1>${esc(title)}</h1>
      <p class="lede">${marked.parseInline(summary)}</p>
      <div class="doc-meta"><span class="mono">v${esc(version)}</span><a href="${repo}/blob/main/docs/${p.file}" target="_blank" rel="noopener">Edit on GitHub</a></div>
    </header>
    ${toc.length > 2 ? `<nav class="onpage" aria-label="On this page"><ul>${toc.map(h => `<li><a href="#${h.id}">${h.text}</a></li>`).join('')}</ul></nav>` : ''}
    <div class="prose">
${html}
    </div>
    <nav class="pager" aria-label="Pages">
      ${prev ? `<a class="prev" href="/docs/${prev.slug}/"><span>Previous</span>${esc(prev.title)}</a>` : '<span></span>'}
      ${next ? `<a class="next" href="/docs/${next.slug}/"><span>Next</span>${esc(next.title)}</a>` : '<span></span>'}
    </nav>
  </article>
</main>`;
  write(`docs/${p.slug}/index.html`, shell({ title: `${title}`, description: summary.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'), url: `/docs/${p.slug}/`, body: article, active: 'docs', kind: 'read' }));
});

// The site's own pages, from the content folder: terms, privacy, security.
const legal = ['terms', 'privacy', 'security'];
for (const slug of legal) {
  const md = readFileSync(join(root, 'content', `${slug}.md`), 'utf8');
  const { title, summary, body } = split(md);
  const html = marked.parse(body);
  const article = `
<main class="docs wrap single">
  <article class="doc">
    <header class="doc-head">
      <h1>${esc(title)}</h1>
      <p class="lede">${marked.parseInline(summary)}</p>
    </header>
    <div class="prose">
${html}
    </div>
  </article>
</main>`;
  write(`${slug}/index.html`, shell({ title, description: summary.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'), url: `/${slug}/`, body: article, active: '', kind: 'read' }));
}

// The page a wrong address lands on. Vercel serves 404.html at the root for any path it has no
// file for, with the 404 status kept.
{
  const article = `
<main class="docs wrap single">
  <article class="doc">
    <header class="doc-head">
      <h1>Nothing here</h1>
      <p class="lede">That address is not a page on this site. The pages that exist are below.</p>
    </header>
    <div class="prose">
      <ul>
        <li><a href="/">The front page</a></li>
        <li><a href="/docs/">Docs</a>, starting with <a href="/docs/getting-started/">getting started</a></li>
        <li><a href="/download/mac">Download for Mac</a></li>
        <li><a href="/terms/">Terms</a>, <a href="/privacy/">privacy</a> and <a href="/security/">security</a></li>
      </ul>
    </div>
  </article>
</main>`;
  write('404.html', shell({ title: 'Page not found', description: 'That address is not a page on this site.', url: '/404', body: article, active: '', kind: 'read', noindex: true }));
}

// The sitemap lists every page this script writes plus the front page, so it cannot drift.
{
  const urls = ['/', '/docs/', ...pages.map(p => `/docs/${p.slug}/`), ...legal.map(s => `/${s}/`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>https://phosphor.karimbabasf.com${u}</loc></url>`).join('\n')}
</urlset>
`;
  write('sitemap.xml', xml);
}
