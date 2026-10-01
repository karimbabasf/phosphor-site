// The invite page's first script, loaded before anything else on the page. An invite link is
// https://phosphor.money/invite#PHOS-..., and the part after # never reaches a server. This reads
// it, keeps the code in this closure and takes it out of the address bar before any other code
// runs. Nothing here sends the code anywhere, and the page loads no analytics:
// scripts/check-pages.mjs fails the build if it does.
(() => {
  const hash = location.hash;
  try { history.replaceState(history.state, '', location.pathname + location.search); } catch {}

  // The shape of a code: PHOS or PH0S in any case, then 27 Crockford base32 characters with any
  // spaces or hyphens between them, O read as 0 and I or L as 1. The page checks the shape only.
  // The app is the one judge of a code (its check symbol, whether it still holds money), and a
  // page that disagreed with it would hide a good code.
  const symbols = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const read = (raw) => {
    let s = raw.replace(/^#/, '');
    try { s = decodeURIComponent(s); } catch { return null; }
    const head = /^\s*PH[O0]S/i.exec(s);
    if (!head) return null;
    let data = '';
    for (const ch of s.slice(head[0].length).toUpperCase()) {
      if (/[\s-]/.test(ch)) continue;
      // A chat app can leave a full stop or a bracket after a link. Any letter or digit past the
      // 27th means the code is not this one.
      if (data.length === 27) { if (/[0-9A-Z]/.test(ch)) return null; continue; }
      const c = ch === 'O' ? '0' : ch === 'I' || ch === 'L' ? '1' : ch;
      if (!symbols.includes(c)) return null;
      data += c;
    }
    if (data.length !== 27) return null;
    return ['PHOS', data.slice(0, 5), data.slice(5, 10), data.slice(10, 15), data.slice(15, 20), data.slice(20)];
  };

  const groups = read(hash);
  document.documentElement.dataset.invite = groups ? 'code' : 'none';
  if (!groups) return;
  const code = groups.join('-');

  document.addEventListener('DOMContentLoaded', () => {
    const shown = document.getElementById('code');
    const button = document.getElementById('copy');
    const hint = document.getElementById('hint');
    const wash = document.querySelector('.wash');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // A narrow screen may break the code after a hyphen, never inside a group.
    groups.forEach((g, i) => {
      if (i) shown.append(document.createElement('wbr'));
      shown.append(i < groups.length - 1 ? `${g}-` : g);
    });

    let timer = 0;
    const copied = () => {
      button.dataset.copied = '';
      hint.textContent = 'Copied. Paste it where Phosphor asks "Have an invite code?".';
      if (!still) wash.animate([
        { clipPath: 'inset(0 100% 0 0)', opacity: 1, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
        { clipPath: 'inset(0 0% 0 0)', opacity: 1, offset: 0.45, easing: 'ease' },
        { clipPath: 'inset(0 0% 0 0)', opacity: 0 },
      ], { duration: 1100 });
      clearTimeout(timer);
      timer = setTimeout(() => { delete button.dataset.copied; hint.textContent = ''; }, 4000);
    };
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code);
        return copied();
      } catch {}
      // No clipboard access (an old browser, or a page not served over https): select the code
      // and try the older copy command, and if that fails too, leave it selected.
      getSelection().selectAllChildren(shown);
      let done = false;
      try { done = document.execCommand('copy'); } catch {}
      if (done) return copied();
      clearTimeout(timer);
      hint.textContent = 'The code is selected. Copy it with ⌘C.';
    });
  }, { once: true });
})();
