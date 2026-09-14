# phosphor-site

The landing page for Phosphor, at https://phosphor.karimbabasf.com

Static files, no build step. `index.html` carries its own CSS and JavaScript, `mark.svg` is
the MP cube mark, `fonts/` holds Sora (Regular and SemiBold), the one face the page speaks in,
and Geist plus Geist Mono for the window mock, which is a picture of the app in the app's own
faces. `vendor/` holds GSAP 3.15.0 with ScrollTrigger (Standard license), which drives the
sheet's lift from the scroll position and the load sequence, and Motion 13.3.0 (MIT), which
runs the reveals on entering view and the Download swap. Both are the `dist` files from the
npm tarballs.

## Run it

    python3 -m http.server 4300

Then open http://localhost:4300. Serving matters: the font and icon paths are absolute.

## Test it

There is no test suite. Check these by hand before pushing:

- the wordmark renders in Sora, not a fallback (compare with the banner in ~/Developer/artifacts/brand/phosphor/), and so does everything else on the page outside the window mock
- the field of bent hairlines drifts behind the hero, ignores the pointer, and leaves plain green behind the wordmark and its line
- whatever scrolls under the bar blurs and fades into the bar's ground, green on the green sections and ink on the dark ones, so the links never sit on a title
- on load the letters of the wordmark rise into view, the field comes up behind them, then the line under the wordmark and the bar follow
- the mark shows in the nav with its cuts in green, not white, and `mark-green.svg` shows on the dark surfaces
- the dark sheet comes up small and grows to full width as it reaches the top; the hero never moves; scrolling is plain, nothing snaps
- the window mock shows Trade mode: real BTC daily candles from Hyperliquid (a snapshot baked into the page, refetch to refresh), the rail, and the empty conversation column; the candles and volume grow in left to right the first time the window comes into view
- the window mock is a still picture: nothing inside it reacts to a click
- the three steps and the closing call fade up as they enter view
- Download crossfades to "Coming soon" on click, the pill widens to fit, and it comes back after about two seconds
- with reduced motion on, everything is visible at rest and the field is a still drawing
- the browser console is clean

`og.png` is a screenshot of the page at 2400x1260. Re-render it whenever the hero changes,
or the share card goes stale.

## Branches

- `main` is the page: green ground, black wordmark, MP cube mark, the Basic screen sheet.
- `screen-two` is a parked branch of the old marble bust page. Not the thing that ships.
