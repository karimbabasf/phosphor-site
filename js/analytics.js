// Vercel Web Analytics sends location.href with every event, the part after # included (in its
// script.js 0.1.3 the event URL starts as `location.href` and a page view posts it as `o`). An
// invite link carries its code there, and a mangled link can land on any page, so this drops the
// hash from every event's URL before it is sent. It is the queue Vercel documents for a plain
// script tag: load it before the insights script, which applies the queued beforeSend before
// its first page view. scripts/check-pages.mjs fails the build if a page loads them out of order.
window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
window.va('beforeSend', (event) => (event.url ? { ...event, url: String(event.url).split('#')[0] } : event));
