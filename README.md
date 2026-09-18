# phosphor-site

The landing page for Phosphor, at https://phosphor.karimbabasf.com

Static files, no build on Vercel. `index.html` carries its own CSS, `js/page.js` the script,
`mark.svg` is the MP cube mark, `fonts/` holds Sora (Regular and SemiBold), the face the page
and the app both speak in, and Geist Mono for figures and code. `logos/` holds the venue and
token marks (their own notices in `logos/LICENSE.md`). `vendor/` holds GSAP 3.15.0 with
ScrollTrigger (Standard license), which drives the sheet's lift from the scroll position and
the load sequence, and Motion 13.3.0 (MIT), which runs the reveals on entering view, the
chart's first draw and the proposal in the security diagram. Both are the `dist` files from
the npm tarballs.

The docs at `/docs/` and the terms at `/terms/` are generated pages. The docs source is
markdown in the app repo (`../phosphor/docs`, listed by its `README.md`), the terms source is
`content/terms.md` here, and `scripts/build-docs.mjs` renders both with a vendored
`marked` (`scripts/vendor/marked.esm.js`, 18.0.13, MIT). The output is committed.

## Run it

    python3 -m http.server 4300

Then open http://localhost:4300. Serving matters: the font and icon paths are absolute.

After a change to the app's docs, or to `content/terms.md`, or to `scripts/page.css`:

    node scripts/build-docs.mjs

It reads `../phosphor/docs` (set `PHOSPHOR_DOCS` to point elsewhere) and rewrites `docs/` and
`terms/`. Commit the output with the change.

## Test it

There is no test suite. Check these by hand before pushing:

- the wordmark renders in Sora, not a fallback (compare with the banner in ~/Developer/artifacts/brand/phosphor/), and so does everything else on the page outside the window mock
- the field of bent hairlines drifts behind the hero in light on the ink, ignores the pointer, and leaves plain ink behind the wordmark and its line
- whatever scrolls under the bar fades into ink, with no blur or glow, and the fade itself comes in with the scroll as the sheet slides under the bar; over the hero the bar has no backing at all
- on load the wordmark fades in slowly, over about a second and a half, while the field, the line under the wordmark and the bar fade in briskly around it, all in inside a second; nothing moves, everything fades where it stands
- the mark shows in the nav in the page's light with its cuts in ink, and `mark-green.svg` shows in the window and the footer
- the sheet comes up small, its top edge drawn by a hairline on the hero's own ink, and grows to full width as it reaches the top; the hero never moves
- on a screen 1100px wide or more where the sheet fits (about 776px tall and up, the sheet tightens its padding under 880px), the docked sheet holds for 40 percent of a screen of scroll before the page moves on, and a scroll that arrives at the sheet and ends inside that hold or up to 40 percent of a screen past it glides to the middle of the hold, so there is half a hold of pause before the next scroll moves the sheet; a scroll that starts on the held sheet is never pulled back, a mouse wheel rolled notch by notch gets through, and any input during the glide stops it; smaller screens and phones scroll plain, nothing snaps
- the window mock shows Trade mode as the app draws it (four modes, the market head, the toolbar, the desk with Open, Waiting and Done) with ETH on Hyperliquid, live: the price, the day's change, high and low, the candles and the time left on the last one all move on their own, over the venue's public websocket; with the network off the page draws the daily snapshot baked into `js/page.js` instead and nothing else changes. As the sheet docks under the bar the candles and volume grow in left to right over about two seconds, the last-price line runs along under them, and the price tag and the live dot land with the last candle. The chart shows as many of the last days as its width holds at a readable size, up to 120
- the whole page after the hero is one ink, with a rule across it above the security section, the venues and the footer; every section shares one head pattern: a short title left, one sentence on its baseline right; on a screen 1100px or wider the head and the window fit under the bar in one screen, the window zoomed down to fit but never below 0.72
- the window mock is a still picture: nothing inside it reacts to a click
- the security section is one road with four stops (the agent, your rules, you, the Secure Enclave) and a proposal that rides it: it appears with the agent, folds to a dot and travels the road to the rules, opens there with its green dot, and waits at You until the Approve button is pressed; then the button reads Touch ID, the proposal travels to the enclave, opens as signed, runs off the end of the road, and the flow resets. The stretch of road behind the proposal lights in the colour of whoever drove it, so the agent's violet stretch ends at the rules. Approve is the one real control on the page, hollow until it is the visitor's turn. Under 1100px the road runs top to bottom, with the two lists beside it from 861px; with reduced motion the proposal simply waits at You
- the venues are two cards that link to near-intents.org and hyperliquid.xyz; hovering one swaps its line for its facts inside the same box, so nothing on the page moves; on a touch screen the facts are shown from the start
- the footer carries Docs, GitHub, License and Terms, and the fine print
- `/docs/` and every page under it, and `/terms/`, render with the sidebar (a Pages sheet on a phone), the version tag from the app's `package.json`, working anchors and page links, and the pager at the bottom; rebuild after a docs change (see Run it)
- the CSP's `connect-src` allows only `api.hyperliquid.xyz` over https and wss; the console shows no CSP report while the chart streams
- both Download for Mac pills are links to `/download/mac`, which `vercel.json` sends to the latest release's `Phosphor-macOS-arm64.dmg` on GitHub; `curl -sI https://phosphor.karimbabasf.com/download/mac` answers 307 with that location. The installed app reads its update manifest from GitHub directly, never through this site
- the response headers carry the policy in `vercel.json`: HSTS, a Content-Security-Policy that allows scripts from this origin plus one hash (the `js` class bootstrap on line 26 of index.html; change that line and the hash in `vercel.json` must be recomputed with `printf '%s' '<the script text>' | openssl dgst -sha256 -binary | base64`), `X-Frame-Options: DENY`, `nosniff`, a referrer policy and a permissions policy; the console shows no CSP report
- with reduced motion on, everything is visible at rest and the field is a still drawing
- the browser console is clean; the page script lives in `js/page.js` and the font wait in `js/fonts.js`, both loaded from this origin, because the CSP allows no other inline script

`og.png` is the share card at 2400x1260: the green on black banner from
~/Developer/Apps/phosphor/brand/phosphor-banner-twitter.png, scaled to the card's width and centred
on the same ink. The favicon set is the mark in white on a rounded `#0E0F13` tile; the touch icon is the same on a square tile.

## Branches

- `main` is the page: ink ground, light wordmark, green only on the mark, the Download pill, the Approve button and the app picture, MP cube mark, the Trade screen sheet, the security flow, the venues, the docs and the terms.
- `screen-two` is a parked branch of the old marble bust page. Not the thing that ships.
