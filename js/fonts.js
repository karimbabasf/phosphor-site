// Settles when Sora is in, or after three seconds, the same limit as
// font-display: block: a face that fails or hangs must not leave the
// wordmark at opacity zero. The load sequence at the end waits on it too.
window.soraReady = Promise.race([
  Promise.all([document.fonts.load('600 1em "Sora"'), document.fonts.load('400 1em "Sora"')]).catch(() => {}),
  new Promise((r) => setTimeout(r, 3000)),
]).then(() => document.documentElement.setAttribute('data-sora', ''));
