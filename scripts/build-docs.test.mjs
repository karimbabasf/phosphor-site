// The security page carries the threat model from the app's docs/security-model.md, so the two
// cannot drift: the build copies the section in, stops at the next heading of its level whatever
// a code block holds, and fails when the section is gone. Run: node --test scripts/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, rmSync } from 'node:fs';
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

const buildWith = (model) => {
  const dir = mkdtempSync(join(tmpdir(), 'phosphor-site-include-'));
  try {
    cpSync(join(root, 'scripts'), join(dir, 'scripts'), { recursive: true });
    cpSync(join(root, 'content'), join(dir, 'content'), { recursive: true });
    cpSync(join(root, 'js'), join(dir, 'js'), { recursive: true });
    const docs = join(dir, 'app', 'docs');
    mkdirSync(docs, { recursive: true });
    writeFileSync(join(dir, 'app', 'package.json'), '{"version":"0.0.0"}');
    writeFileSync(join(docs, 'README.md'), '# Docs\n\nThe docs.\n\n## Pages\n\n- [Start](start.md): the start\n\n## For developers\n\n- [Security model](security-model.md): the model\n');
    writeFileSync(join(docs, 'start.md'), '# Start\n\nThe start.\n\n## One\n\nText.\n');
    if (model !== null) writeFileSync(join(docs, 'security-model.md'), model);
    const run = spawnSync(process.execPath, [join(dir, 'scripts', 'build-docs.mjs')], { env: { ...process.env, PHOSPHOR_DOCS: docs }, encoding: 'utf8' });
    const page = run.status === 0 ? readFileSync(join(dir, 'security', 'index.html'), 'utf8') : '';
    return { run, page };
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
