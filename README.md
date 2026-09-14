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
- on the dark sections, whatever scrolls under the bar fades into ink, with no blur or glow, and the fade itself comes in with the scroll as a dark section slides under the bar; on the green sections the bar has no backing at all
- on load the letters of the wordmark rise into view, the field comes up behind them, then the line under the wordmark and the bar follow
- the mark shows in the nav with its cuts in green, not white, and `mark-green.svg` shows on the dark surfaces
- the dark sheet comes up small and grows to full width as it reaches the top; the hero never moves; scrolling is plain, nothing snaps
- the window mock shows Trade mode: real BTC daily candles from Hyperliquid (a snapshot baked into the page, refetch to refresh), the rail, and the empty conversation column; as the sheet docks under the bar the candles and volume grow in left to right over about two seconds, the last-price line runs along under them, and the price tag and the live dot land with the last candle
- the two dark sections share one ink and one head pattern: a short title left, one sentence on its baseline right; on a screen 1100px or wider the head and the window fit under the bar in one screen, the window zoomed down to fit but never below 0.72
- the window mock is a still picture: nothing inside it reacts to a click
- the three steps and the closing call fade up as they enter view
- Download crossfades to "Coming soon" on click, the pill widens to fit, and it comes back after about two seconds
- with reduced motion on, everything is visible at rest and the field is a still drawing
- the browser console is clean

`og.png` is the share card at 2400x1260: the green on black banner from
~/Developer/Apps/phosphor/brand/phosphor-banner-twitter.png, scaled to the card's width and centred
on the same ink. The favicon set is the mark in black on a rounded white tile, the brand's black on white colourway; the touch icon is the same on a square tile.

## Branches

- `main` is the page: green ground, black wordmark, MP cube mark, the Basic screen sheet.
- `screen-two` is a parked branch of the old marble bust page. Not the thing that ships.
