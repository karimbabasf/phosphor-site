// The two scripts that read an invite code from the address, run in node:vm against a fake
// browser that logs, in order, every read of the address, every history and document touch and
// every request. Run: node --test scripts/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = (file) => readFileSync(join(root, file), 'utf8');

// A throwaway code in the right shape (repeated 0x5a bytes); no code like it was ever funded.
const CODE = 'PHOS-2TB9D-5MPJT-B9D5M-PJTB9-D5MPJTM';

const run = (file, address, { clipboard = true } = {}) => {
  const url = new URL(address, 'https://phosphor.money');
  const log = [];
  const handlers = {};
  const el = (id) => {
    const parts = [];
    const listeners = {};
    return {
      id, dataset: {}, parts, listeners,
      append: (...nodes) => parts.push(...nodes),
      addEventListener: (type, fn) => { listeners[type] = fn; },
      animate: () => log.push(`animate ${id}`),
      get text() { return parts.filter(p => typeof p === 'string').join(''); },
      textContent: '',
    };
  };
  const elements = { code: el('code'), copy: el('copy'), hint: el('hint'), wash: el('wash') };
  const doc = {
    documentElement: { dataset: {} },
    addEventListener: (type, fn) => { handlers[type] = fn; },
    getElementById: (id) => elements[id],
    querySelector: (sel) => sel === '.wash' ? elements.wash : null,
    createElement: (tag) => ({ tag }),
    execCommand: () => false,
  };
  const door = (name) => function () { log.push(`request ${name}`); throw new Error(`${name} called`); };
  const context = {
    location: {
      get hash() { log.push('read hash'); return url.hash; },
      get pathname() { return url.pathname; },
      get search() { return url.search; },
      replace: (to) => log.push(`replace ${to}`),
    },
    history: {
      state: null,
      replaceState: (state, title, to) => { log.push(`replaceState ${to}`); url.hash = ''; },
    },
    document: new Proxy(doc, { get: (t, k) => { log.push(`document.${String(k)}`); return t[k]; } }),
    navigator: clipboard ? { clipboard: { writeText: async (t) => { log.push(`clipboard ${t}`); } } } : {},
    matchMedia: () => ({ matches: false }),
    getSelection: () => ({ selectAllChildren: () => log.push('select') }),
    setTimeout: () => 0,
    clearTimeout: () => {},
    fetch: door('fetch'), XMLHttpRequest: door('XMLHttpRequest'), WebSocket: door('WebSocket'),
    EventSource: door('EventSource'), Image: door('Image'),
  };
  vm.runInNewContext(source(file), context);
  return { log, url, handlers, elements, root: doc.documentElement };
};

// The invite page: what it reads, what it shows, what it sends.
const page = (address) => {
  const r = run('js/invite.js', address);
  r.handlers.DOMContentLoaded?.();
  return r;
};

test('the address bar is cleared before the page touches anything else', () => {
  const { log, url } = page(`/invite#${CODE}`);
  assert.deepEqual(log.slice(0, 2), ['read hash', 'replaceState /invite']);
  assert.equal(url.hash, '');
});

test('a query string stays, the code goes', () => {
  const { log } = page(`/invite?from=x#${CODE}`);
  assert.equal(log[1], 'replaceState /invite?from=x');
});

const accepted = {
  'as issued': CODE,
  'lower case': CODE.toLowerCase(),
  'no hyphens': CODE.replace(/-/g, ''),
  'spaces': encodeURIComponent(CODE.replace(/-/g, ' ')),
  'PH0S': CODE.replace('PHOS', 'PH0S'),
  'a full stop and a bracket after it': `${CODE}).`,
};
for (const [name, hash] of Object.entries(accepted)) {
  test(`shows the code: ${name}`, () => {
    const { root, elements } = page(`/invite#${hash}`);
    assert.equal(root.dataset.invite, 'code');
    assert.equal(elements.code.text, CODE);
  });
}

test('O reads as 0, I and L as 1', () => {
  const { elements } = page('/invite#PHOS-OI234-56789-ABCDE-FGHJK-MNPQRSL');
  assert.equal(elements.code.text, 'PHOS-01234-56789-ABCDE-FGHJK-MNPQRS1');
});

const refused = {
  'no hash': '',
  'an empty hash': '#',
  'another hash': '#install',
  'no prefix': `#${CODE.slice(5)}`,
  'a character short': `#${CODE.slice(0, -1)}`,
  'a character over': `#${CODE}X`,
  'a U': `#${CODE.slice(0, -1)}U`,
  'a stray mark inside': `#${CODE.slice(0, 12)}.${CODE.slice(12)}`,
  'broken percent encoding': '#PHOS-%E0%A4%A',
};
for (const [name, hash] of Object.entries(refused)) {
  test(`shows the no-code line: ${name}`, () => {
    const { root, log, handlers } = page(`/invite${hash}`);
    assert.equal(root.dataset.invite, 'none');
    assert.equal(log[1], 'replaceState /invite');
    assert.equal(handlers.DOMContentLoaded, undefined);
  });
}

test('Copy puts the code on the clipboard and nothing goes out', async () => {
  const { log, elements } = page(`/invite#${CODE.toLowerCase()}`);
  await elements.copy.listeners.click();
  assert.ok(log.includes(`clipboard ${CODE}`));
  assert.equal(elements.copy.dataset.copied, '');
  assert.match(elements.hint.textContent, /^Copied\./);
  assert.ok(!log.some(l => l.startsWith('request')));
});

test('with no clipboard, Copy selects the code and says how to copy it', async () => {
  const r = run('js/invite.js', `/invite#${CODE}`, { clipboard: false });
  r.handlers.DOMContentLoaded();
  await r.elements.copy.listeners.click();
  assert.ok(r.log.includes('select'));
  assert.equal(r.elements.copy.dataset.copied, undefined);
  assert.match(r.elements.hint.textContent, /selected/);
  assert.ok(!r.log.some(l => l.startsWith('request')));
});

// The 404: a code after # goes on to the invite page; nothing else changes.
test('a mistyped invite path goes on to the invite page with its code', () => {
  for (const path of [`/invte#${CODE}`, `/a/b#${CODE.toLowerCase()}`, `/Invite#%20${CODE}`]) {
    const { log } = run('js/notfound.js', path);
    const hash = path.slice(path.indexOf('#'));
    assert.deepEqual(log.filter(l => !l.startsWith('read')), [`replace /invite${hash}`], path);
  }
});

test('every other wrong address keeps the 404', () => {
  for (const path of ['/no/such/page', '/docs/nothing#section-two', '/x#phosphor']) {
    const { log } = run('js/notfound.js', path);
    assert.deepEqual(log.filter(l => !l.startsWith('read')), [], path);
  }
});

test('a 404 at the invite path itself drops the code instead of looping', () => {
  for (const path of [`/invite#${CODE}`, `/invite/#${CODE}`]) {
    const { log, url } = run('js/notfound.js', path);
    assert.ok(!log.some(l => l.startsWith('replace ')), path);
    assert.ok(log.some(l => l.startsWith('replaceState')), path);
    assert.equal(url.hash, '');
  }
});
