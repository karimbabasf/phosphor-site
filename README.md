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
- the field of bent hairlines drifts behind the hero in light on the ink, ignores the pointer, and leaves plain ink behind the wordmark and its line
- whatever scrolls under the bar fades into ink, with no blur or glow, and the fade itself comes in with the scroll as the sheet slides under the bar; over the hero the bar has no backing at all
- on load the wordmark fades in slowly, over about a second and a half, while the field, the line under the wordmark and the bar fade in briskly around it, all in inside a second; nothing moves, everything fades where it stands
- the mark shows in the nav in the page's light with its cuts in ink, and `mark-green.svg` shows in the window and the footer
- the sheet comes up small, its top edge drawn by a hairline on the hero's own ink, and grows to full width as it reaches the top; the hero never moves
- on a screen 1100px wide or more where the sheet fits (about 776px tall and up, the sheet tightens its padding under 880px), the docked sheet holds for 40 percent of a screen of scroll before the page moves on, and a scroll that arrives at the sheet and ends inside that hold or up to 40 percent of a screen past it glides to the middle of the hold, so there is half a hold of pause before the next scroll moves the sheet; a scroll that starts on the held sheet is never pulled back, a mouse wheel rolled notch by notch gets through, and any input during the glide stops it; smaller screens and phones scroll plain, nothing snaps
- the window mock shows Trade mode: real BTC daily candles from Hyperliquid (a snapshot baked into the page, refetch to refresh), the rail, and the empty conversation column; as the sheet docks under the bar the candles and volume grow in left to right over about two seconds, the last-price line runs along under them, and the price tag and the live dot land with the last candle
- the whole page after the hero is one ink, with a rule across it above the steps, the closing and the footer; the sheet and the steps share one head pattern: a short title left, one sentence on its baseline right; on a screen 1100px or wider the head and the window fit under the bar in one screen, the window zoomed down to fit but never below 0.72
- the window mock is a still picture: nothing inside it reacts to a click
- the three steps and the closing call fade up as they enter view
- Download crossfades to "Coming soon" on click, the pill widens to fit, and it comes back after about two seconds
- with reduced motion on, everything is visible at rest and the field is a still drawing
- the browser console is clean

`og.png` is the share card at 2400x1260: the green on black banner from
~/Developer/Apps/phosphor/brand/phosphor-banner-twitter.png, scaled to the card's width and centred
on the same ink. The favicon set is the mark in green on a rounded `#0E0F13` tile, the app icon's colourway; the touch icon is the same on a square tile.

## Branches

- `main` is the page: ink ground, light wordmark, green only on the mark, the Download pill and the step numbers, MP cube mark, the Basic screen sheet.
- `screen-two` is a parked branch of the old marble bust page. Not the thing that ships.
