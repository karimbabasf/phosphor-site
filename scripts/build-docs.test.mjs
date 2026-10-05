// The security page carries the threat model from the app's docs/security-model.md, so the two
// cannot drift: the build copies the section in, stops at the next heading of its level whatever
// a code block holds, and fails when the section is gone. Run: node --test scripts/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const MODEL = [
  '# Security model',
  '',
  'The model.',
  '',
  '## Threat model',
  '',
  'Who it plans for.',
  '',
  '### Check a release yourself',
  '',
  '```',
  '# not a heading',
  'shasum -a 256 Phosphor.dmg',
  '```',
  '',
  '## The trust boundary',
  '',
  'Not on the security page.',
  '',
].join('\n');

const START = '# Start\n\nThe start.\n\n## One\n\nText.\n';

const VERIFY = '# Check it yourself\n\nThe claims.\n\n## One claim\n\nSee [the model](security-model.md#threat-model) and [Start](start.md).\n';

const buildWith = (model, start = START, verify = null) => {
  const dir = mkdtempSync(join(tmpdir(), 'phosphor-site-include-'));
  try {
    cpSync(join(root, 'scripts'), join(dir, 'scripts'), { recursive: true });
    cpSync(join(root, 'content'), join(dir, 'content'), { recursive: true });
    cpSync(join(root, 'js'), join(dir, 'js'), { recursive: true });
    const docs = join(dir, 'app', 'docs');
    mkdirSync(docs, { recursive: true });
    writeFileSync(join(dir, 'app', 'package.json'), '{"version":"0.0.0"}');
    writeFileSync(join(docs, 'README.md'), '# Docs\n\nThe docs.\n\n## Pages\n\n- [Start](start.md): the start\n\n## For developers\n\n- [Security model](security-model.md): the model\n' + (verify === null ? '' : '- [Check it yourself](verify.md): the claims\n'));
    writeFileSync(join(docs, 'start.md'), start);
    if (model !== null) writeFileSync(join(docs, 'security-model.md'), model);
    if (verify !== null) writeFileSync(join(docs, 'verify.md'), verify);
    const run = spawnSync(process.execPath, [join(dir, 'scripts', 'build-docs.mjs')], { env: { ...process.env, PHOSPHOR_DOCS: docs }, encoding: 'utf8' });
    const read = (...rel) => run.status === 0 && existsSync(join(dir, ...rel)) ? readFileSync(join(dir, ...rel), 'utf8') : '';
    return { run, page: read('security', 'index.html'), startPage: read('docs', 'start', 'index.html'), verifyPage: read('docs', 'verify', 'index.html'), docsIndex: read('docs', 'index.html'), sitemap: read('sitemap.xml') };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

test('the security page carries the threat model section, its code block whole, and nothing after it', () => {
  const { run, page } = buildWith(MODEL);
  assert.equal(run.status, 0, run.stderr);
  assert.match(page, /<h2 id="threat-model">Threat model/);
  assert.match(page, /Who it plans for\./);
  assert.match(page, /# not a heading\nshasum -a 256 Phosphor\.dmg/);
  assert.doesNotMatch(page, /Not on the security page/);
  assert.doesNotMatch(page, /include:/);
});

test('the build fails when the section or its file is gone', () => {
  const noSection = buildWith(MODEL.replace('## Threat model', '## Something else'));
  assert.equal(noSection.run.status, 1);
  assert.match(noSection.run.stderr, /docs\/security-model\.md has no section #threat-model/);
  const noFile = buildWith(null);
  assert.equal(noFile.run.status, 1);
});

test('a command in a table cell keeps each word whole, and code anywhere else is left as it was', () => {
  const start = `${START}\n| Agent | What the app runs |\n| --- | --- |\n| Claude Code | \`claude mcp add phosphor --scope user -- <node>\` |\n| Tool | \`proposal_status\` |\n\nRun \`npm run invite -- convert\` first.\n`;
  const { run, startPage } = buildWith(MODEL, start);
  assert.equal(run.status, 0, run.stderr);
  assert.match(startPage, /<code><span class="word">claude<\/span> <span class="word">mcp<\/span> <span class="word">add<\/span> <span class="word">phosphor<\/span> <span class="word">--scope<\/span> <span class="word">user<\/span> <span class="word">--<\/span> <span class="word">&lt;node&gt;<\/span><\/code>/);
  assert.match(startPage, /<code>proposal_status<\/code>/);
  assert.match(startPage, /<p>Run <code>npm run invite -- convert<\/code> first\.<\/p>/);
  // What a copy takes: the cell's text with the tags gone is the command as written.
  const cell = startPage.match(/<code><span class="word">claude[\s\S]*?<\/code>/)[0];
  assert.equal(cell.replace(/<[^>]+>/g, ''), 'claude mcp add phosphor --scope user -- &lt;node&gt;');
});

test('Check it yourself gets its own docs page, while the other developer pages stay links to GitHub', () => {
  const start = `${START}\nSee [the claims](verify.md#one-claim).\n`;
  const { run, verifyPage, startPage, docsIndex, sitemap } = buildWith(MODEL, start, VERIFY);
  assert.equal(run.status, 0, run.stderr);
  assert.match(verifyPage, /<h1>Check it yourself<\/h1>/);
  assert.match(verifyPage, /<li><a href="\/docs\/verify\/" aria-current="page">Check it yourself<\/a><\/li>/);
  assert.match(verifyPage, /<a href="https:\/\/github\.com\/karimbabasf\/phosphor\/blob\/main\/docs\/security-model\.md#threat-model" target="_blank" rel="noopener">the model<\/a>/);
  assert.match(verifyPage, /<a href="\/docs\/start\/">Start<\/a>/);
  assert.doesNotMatch(verifyPage, /class="pager"/);
  assert.match(startPage, /<a href="\/docs\/verify\/#one-claim">the claims<\/a>/);
  assert.match(docsIndex, /<li><a href="\/docs\/verify\/"><strong>Check it yourself<\/strong><span>the claims<\/span><\/a><\/li>/);
  assert.match(docsIndex, /<li><a href="https:\/\/github\.com\/karimbabasf\/phosphor\/blob\/main\/docs\/security-model\.md" target="_blank" rel="noopener"><strong>Security model<\/strong>/);
  assert.match(sitemap, /<loc>https:\/\/phosphor\.money\/docs\/verify\/<\/loc>/);
  // Without it in the developer list there is no page and no sitemap entry.
  const without = buildWith(MODEL);
  assert.equal(without.run.status, 0, without.run.stderr);
  assert.equal(without.verifyPage, '');
  assert.doesNotMatch(without.sitemap, /verify/);
});
