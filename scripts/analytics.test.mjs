// js/analytics.js drops the hash from every Vercel Web Analytics event, in node:vm against a stub
// of the insights script. Run: node --test scripts/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const strip = readFileSync(join(root, 'js', 'analytics.js'), 'utf8');

// What Vercel's script.js 0.1.3 does that this relies on (read from the live script on
// 2026-10-01): it replaces window.va, replays window.vaq in order, then builds a page view whose
// url is location.href, passes it through beforeSend (null or false drops it) and posts the
// result's url as `o`.
const insights = `(() => {
  let before = (e) => e;
  window.va = (name, arg) => { if (name === 'beforeSend') before = arg; };
  (window.vaq || []).forEach(([name, arg]) => window.va(name, arg));
  const event = before({ type: 'pageview', url: location.href });
  if (event === null || event === false) return;
  fetch('/_vercel/insights/view', { method: 'POST', body: JSON.stringify({ o: event.url }) });
})();`;

const CODE = 'PHOS-2TB9D-5MPJT-B9D5M-PJTB9-D5MPJTM';

// Loads the scripts in page order and returns what the stub posted.
const pageview = (href, order = [strip, insights]) => {
  const sent = [];
  const context = { location: { href }, fetch: (url, init) => sent.push({ url, ...JSON.parse(init.body) }) };
  context.window = context;
  vm.createContext(context);
  for (const script of order) vm.runInContext(script, context);
  return sent;
};

test('a page view from an address with a code in it is sent without the hash', () => {
  const sent = pageview(`https://phosphor.money/#${CODE}`);
  assert.deepEqual(sent, [{ url: '/_vercel/insights/view', o: 'https://phosphor.money/' }]);
});

test('the query string stays, only the hash goes', () => {
  assert.equal(pageview('https://phosphor.money/docs/money/?ref=x#invite-codes')[0].o, 'https://phosphor.money/docs/money/?ref=x');
});

test('a page view with no hash still sends, unchanged', () => {
  assert.deepEqual(pageview('https://phosphor.money/docs/'), [{ url: '/_vercel/insights/view', o: 'https://phosphor.money/docs/' }]);
});

test('without it the stub sends the code, which is what it is there to stop', () => {
  assert.equal(pageview(`https://phosphor.money/#${CODE}`, [insights])[0].o, `https://phosphor.money/#${CODE}`);
});

test('if the insights script is already up, the hook goes straight to it', () => {
  const calls = [];
  const context = { window: null, va: (...args) => calls.push(args) };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(strip, context);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'beforeSend');
  assert.equal(calls[0][1]({ type: 'pageview', url: `https://phosphor.money/#${CODE}` }).url, 'https://phosphor.money/');
});
