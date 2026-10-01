// The build fails if the invite page or the 404 carries the analytics tag, or loads any script
// but its own. Run: node --test scripts/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { checkPages } from './check-pages.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TAG = '<script defer src="/_vercel/insights/script.js"></script>';

// A copy of the guarded pages and their scripts, changed by `edit`, checked, then removed.
const checkCopy = (edit) => {
  const dir = mkdtempSync(join(tmpdir(), 'phosphor-site-'));
  try {
    for (const f of ['invite/index.html', '404.html', 'js/invite.js', 'js/notfound.js']) {
      mkdirSync(dirname(join(dir, f)), { recursive: true });
      writeFileSync(join(dir, f), readFileSync(join(root, f)));
    }
    edit((f, change) => writeFileSync(join(dir, f), change(readFileSync(join(dir, f), 'utf8'))));
    return checkPages(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

test('the committed pages pass', () => {
  assert.deepEqual(checkPages(root), []);
});

test('the analytics tag on the invite page fails', () => {
  const problems = checkCopy((edit) => edit('invite/index.html', (h) => h.replace('</head>', `${TAG}\n</head>`)));
  assert.ok(problems.includes('invite/index.html: carries an analytics tag'), problems.join('\n'));
});

test('the analytics tag on the 404 fails', () => {
  const problems = checkCopy((edit) => edit('404.html', (h) => h.replace('</head>', `${TAG}\n</head>`)));
  assert.ok(problems.includes('404.html: carries an analytics tag'), problems.join('\n'));
});

test('any other script fails, inline or from anywhere', () => {
  const inline = checkCopy((edit) => edit('404.html', (h) => h.replace('</body>', '<script>1</script>\n</body>')));
  assert.ok(inline.includes('404.html: has an inline script'), inline.join('\n'));
  const other = checkCopy((edit) => edit('invite/index.html', (h) => h.replace('</body>', '<script src="/js/page.js?v=12"></script>\n</body>')));
  assert.ok(other.includes('invite/index.html: loads /js/page.js, which is not its own script'), other.join('\n'));
});

test('the invite script must come first and block', () => {
  const late = checkCopy((edit) => edit('invite/index.html', (h) => h.replace('<script src="/js/invite.js', '<script defer src="/js/invite.js')));
  assert.ok(late.some(p => p.includes('must load blocking')), late.join('\n'));
  const gone = checkCopy((edit) => edit('invite/index.html', (h) => h.replace(/<script src="\/js\/invite\.js[^>]*><\/script>\n/, '')));
  assert.ok(gone.includes('invite/index.html: its first script must be /js/invite.js'), gone.join('\n'));
});

test('a request in the page scripts fails', () => {
  const problems = checkCopy((edit) => edit('js/invite.js', (s) => `${s}\nfetch('/x?' + location.hash);\n`));
  assert.ok(problems.includes('/js/invite.js: makes a request'), problems.join('\n'));
});

// The same check ends the build: a generator that put the tag back on either page stops it.
test('the build fails when the generator puts the analytics tag on either page', () => {
  const dir = mkdtempSync(join(tmpdir(), 'phosphor-site-build-'));
  try {
    cpSync(join(root, 'scripts'), join(dir, 'scripts'), { recursive: true });
    cpSync(join(root, 'content'), join(dir, 'content'), { recursive: true });
    cpSync(join(root, 'js'), join(dir, 'js'), { recursive: true });
    // A minimal docs folder in the app repo's shape.
    const docs = join(dir, 'app', 'docs');
    mkdirSync(docs, { recursive: true });
    writeFileSync(join(dir, 'app', 'package.json'), '{"version":"0.0.0"}');
    writeFileSync(join(docs, 'README.md'), '# Docs\n\nThe docs.\n\n## Pages\n\n- [Start](start.md): the start\n\n## For developers\n\n- [Inside](inside.md): the inside\n');
    writeFileSync(join(docs, 'start.md'), '# Start\n\nThe start.\n\n## One\n\nText.\n');
    const build = () => spawnSync(process.execPath, [join(dir, 'scripts', 'build-docs.mjs')], { env: { ...process.env, PHOSPHOR_DOCS: docs }, encoding: 'utf8' });
    const clean = build();
    assert.equal(clean.status, 0, clean.stderr);
    const script = join(dir, 'scripts', 'build-docs.mjs');
    writeFileSync(script, readFileSync(script, 'utf8').replaceAll('analytics: false', 'analytics: true'));
    const tagged = build();
    assert.equal(tagged.status, 1);
    assert.match(tagged.stderr, /check-pages: invite\/index\.html: carries an analytics tag/);
    assert.match(tagged.stderr, /check-pages: 404\.html: carries an analytics tag/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
