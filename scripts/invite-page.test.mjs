// The invite page's words, read from the built invite/index.html: the phone line, the note's
// measure and the page with JavaScript off. Run: node --test scripts/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const page = readFileSync(join(root, 'invite/index.html'), 'utf8');
const between = (from, to) => page.slice(page.indexOf(from), page.indexOf(to, page.indexOf(from)));
const withCode = between('<div class="when-code">', '<div class="when-none">');
const withNone = between('<div class="when-none">', '</article>');
const only = (part) => [...part.matchAll(/<span class="only">([^<]*)<\/span>/g)].map((m) => m[1]);

test('on a phone, the invite says to open the message on a Mac or send the code to yourself', () => {
  assert.deepEqual(only(withCode), ['Phosphor runs on a Mac. Open the message with this link on your Mac, or tap Copy and send the code to yourself.']);
});

test('the page with no code keeps its own phone line, since it has no code to copy', () => {
  assert.deepEqual(only(withNone), ['Phosphor runs on a Mac. Open this link there to download it.']);
});

test('the note holds a reading measure', () => {
  assert.match(page, /\.note \{[^}]*max-width: 68ch;/);
});

test('with JavaScript off, the title says the code is in the link and no line says it is missing', () => {
  const noscript = [...withNone.matchAll(/<noscript>([\s\S]*?)<\/noscript>/g)].map((m) => m[1]).join('');
  assert.match(noscript, /<h1>Your invite code is in the link<\/h1>/);
  assert.match(noscript, /Your code is the part of the address after the # sign\./);
  // The script-on title and its line are hidden when scripting is off, so they never sit beside it.
  assert.match(withNone, /<h1 class="with-js">No invite code here<\/h1>/);
  assert.match(withNone, /<p class="lede with-js">This link has no complete invite code in it\./);
  assert.match(page, /@media \(scripting: none\) \{\s*\.with-js \{ display: none; \}/);
});
