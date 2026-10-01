// A mistyped invite link (phosphor.money/invte#PHOS-...) lands on this page with its code still
// after the #, which never reached the server. This hands it to the invite page, which reads it
// and clears the address bar, the same as for a link that was typed right. Every other wrong
// address gets the page as it is. The page loads no analytics: scripts/check-pages.mjs fails the
// build if it does.
(() => {
  let hash = location.hash;
  try { hash = decodeURIComponent(hash); } catch {}
  // The code's shape: PHOS or PH0S in any case, then 27 letters or digits, spaces or hyphens
  // between them allowed.
  if (!/^#\s*PH[O0]S(?:[\s-]*[0-9A-Z]){27}/i.test(hash)) return;
  // The invite page itself is missing: take the code out of the address bar instead of looping.
  if (location.pathname.replace(/\/+$/, '') === '/invite') {
    try { history.replaceState(history.state, '', location.pathname + location.search); } catch {}
    return;
  }
  location.replace(`/invite${location.hash}`);
})();
