# phosphor-site

The landing page for Phosphor, at https://phosphor.karimbabasf.com

Static files, no build on Vercel. `index.html` carries its own CSS, `js/page.js` the script,
`mark.svg` and `mark-green.svg` are the MP cube mark (the same path as the favicon, in ink and
in green), `fonts/` holds Sora (Regular and SemiBold), the face the wordmark and the app speak
in, Manrope for everything after the hero and the bar (the `--face` token in the CSS), and
Geist Mono for figures and code, subset to Latin. `logos/` holds the venue and token marks
(their own notices in `logos/LICENSE.md`). `vendor/` holds GSAP 3.15.0 with ScrollTrigger
(Standard license), which drives the sheet's lift from the scroll position, the magnet and the
load sequence. What answers the visitor (reveals in view, the chart's sweep, the flow) runs on the
kit at the top of `js/page.js`: the Web Animations API for tweens and an IntersectionObserver for
what enters view.

The docs at `/docs/`, the terms, privacy and security pages at `/terms/`, `/privacy/` and
`/security/`, the `404.html` page and `sitemap.xml` are generated. The docs source is markdown
in the app repo (`../phosphor/docs`, listed by its `README.md`), the site's own pages come from
`content/<slug>.md` here, and `scripts/build-docs.mjs` renders all of it with a vendored
`marked` (`scripts/vendor/marked.esm.js`, 18.0.13, MIT). The output is committed. `robots.txt`
is a plain file.

## Run it

    python3 -m http.server 4300

Then open http://localhost:4300. Serving matters: the font and icon paths are absolute.

After a change to the app's docs, to anything in `content/`, or to `scripts/page.css`:

    node scripts/build-docs.mjs

It reads `../phosphor/docs` (set `PHOSPHOR_DOCS` to point elsewhere) and rewrites `docs/`,
`terms/`, `privacy/`, `security/`, `404.html` and `sitemap.xml`. Commit the output with the change.

## Test it

There is no test suite. Check these by hand before pushing:

- the wordmark renders in Sora, not a fallback (compare with the banner in ~/Developer/artifacts/brand/phosphor/), and so does everything else on the page outside the window mock
- the field of bent hairlines drifts behind the hero in light on the ink, ignores the pointer, and leaves plain ink behind the wordmark and its line
- whatever scrolls under the bar fades into ink, with no blur or glow, and the fade itself comes in with the scroll as the sheet slides under the bar; over the hero the bar has no backing at all
- on load the wordmark fades in slowly, over about a second and a half, while the field, the line under the wordmark and the bar fade in briskly around it, all in inside a second; nothing moves, everything fades where it stands
- the mark shows in the nav in the page's light with its cuts in ink, and `mark-green.svg` shows in the window and the footer
- the sheet comes up small, its top edge drawn by a hairline on the hero's own ink, and grows to full width as it reaches the top; the hero never moves
- on a screen 1100px wide or more where the sheet fits (about 776px tall and up, the sheet tightens its padding under 880px), the docked sheet holds for 40 percent of a screen of scroll before the page moves on, and a scroll that arrives at the sheet and ends inside that hold or up to 40 percent of a screen past it glides to the middle of the hold, easing in from rest and out again with no jolt as it starts, so there is half a hold of pause before the next scroll moves the sheet; a scroll that starts on the held sheet is never pulled back, a mouse wheel rolled notch by notch gets through, and any input during the glide stops it; smaller screens and phones scroll plain, nothing snaps
- the window mock shows Trade mode as the app draws it (four modes, the market head, the toolbar, the desk with Open, Waiting and Done) with ETH on Hyperliquid, live: the price, the day's change, high and low, the candles and the time left on the last one all move on their own, over the venue's public websocket, redrawn only while the page is still and the chart is on screen, so a tick never lands under a moving scroll; with the network off the page draws the daily snapshot baked into `js/page.js` instead and nothing else changes. As the sheet docks under the bar the candles and volume grow in left to right over about two seconds, the last-price line runs along under them, and the price tag and the live dot land with the last candle. The chart shows as many of the last days as its width holds at a readable size, up to 120
- the whole page after the hero is one ink, with a rule across it above the security section, the venues and the footer; every section shares one head pattern: a short title left, one sentence on its baseline right; on a screen 1100px or wider the head and the window fit under the bar in one screen, the window zoomed down to fit but never below 0.72
- the window mock is a still picture: nothing inside it reacts to a click
- the security section is one panel of two cells on a hairline, Runs on its own (the agent, your rules) and Needs you (you, the Secure Enclave), the wall between them a shade stronger than the panel's rules and the second cell a shade lighter; one road runs through the four stops and crosses the wall once, laid as three stretches between the tiles and a tail after the last, each stopping 8px short of the tile at either end, so the line docks at a stop and never runs through one. Nothing rides the road: it lights up one stretch at a time in the colour of whoever drove it (the agent's violet stretch ends at the rules), each tile rings as the light reaches it, and when it reaches You the proposal appears where the app shows it, as the app's own card (Waiting for you, Long ETH, $150 in Geist Mono) with the Approve button inside, the one real control on the page; while it is live it breathes, a ring off its edge every 1.5 seconds. The click turns the card to Confirm on your Mac and the button to Touch ID, the tile pulses, the green stretch reaches the enclave, the card reads Signed and the button Approved, the tail lights, then the road goes dark with the card and the next proposal starts at the agent. On the way in the road is not there until the four stops have landed on it, nothing on it is lit until the agent's tile rings, and the story plays once: scroll away and back and the card is still waiting where it was. Under each pair of stops, on a rule, the list of what the agent can (left) and cannot (right) do. Under 1200px the cells stack and the road runs top to bottom: from 720px each list sits beside its stops, and on a phone the four stops come first and both lists after, so the road meets nothing but the wall; with reduced motion the card simply waits at You and the click marks it Signed
- the venues are two cards that link to near-intents.org and hyperliquid.xyz; hovering one swaps its line for its facts inside the same box, so nothing on the page moves; on a touch screen the facts are shown from the start
- the bar and the footer carry an X link to x.com/karimbabasf beside GitHub (on a phone the bar keeps Docs and X and drops GitHub); the footer carries Docs, GitHub, X, License and Terms, and the fine print
- `/docs/` and every page under it, and `/terms/`, render with the sidebar (a Pages sheet on a phone), the version tag from the app's `package.json`, working anchors and page links, and the pager at the bottom; rebuild after a docs change (see Run it)
- the CSP's `connect-src` allows only `api.hyperliquid.xyz` over https and wss; the console shows no CSP report while the chart streams
- the Download for Mac pill in the bar is a link to `/download/mac`, which `vercel.json` sends to the latest release's `Phosphor-macOS-arm64.dmg` on GitHub; `curl -sI https://phosphor.karimbabasf.com/download/mac` answers 307 with that URL. On a touch device (`hover: none` and `pointer: coarse`) the pill gives way to a quiet Available for Mac note, since there is nothing a phone could do with the disk image
- the response headers carry the policy in `vercel.json`: HSTS, a Content-Security-Policy that allows scripts from this origin plus one hash (the `js` class bootstrap on line 26 of index.html; change that line and the hash in `vercel.json` must be recomputed with `printf '%s' '<the script text>' | openssl dgst -sha256 -binary | base64`), `X-Frame-Options: DENY`, `nosniff`, a referrer policy and a permissions policy; the console shows no CSP report
- with reduced motion on, everything is visible at rest and the field is a still drawing
- the browser console is clean; the page script lives in `js/page.js` and the font wait in `js/fonts.js`, both loaded from this origin, because the CSP allows no other inline script

`og.png` is the share card at 2400x1260: the green on black banner from
~/Developer/Apps/phosphor/brand/phosphor-banner-twitter.png, scaled to the card's width and centred
on the same ink. The favicon set is the mark in white on a rounded `#0E0F13` tile; the touch icon is the same on a square tile.

## Branches

- `main` is the page: ink ground, light wordmark, green only on the mark, the Download pill, the Approve button and the app picture, MP cube mark, the Trade screen sheet, the security flow, the venues, the docs and the terms.
- `screen-two` is a parked branch of the old marble bust page. Not the thing that ships.
