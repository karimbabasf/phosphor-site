# phosphor-site

The landing page for Phosphor, at https://phosphor.karimbabasf.com

Static files, no build step. `index.html` carries its own CSS and JavaScript, `mark.svg` is
the MP cube mark, `fonts/` holds Sora (Regular and SemiBold), the brand face, Manrope for everything under the hero,
and Geist for the window mock, and `vendor/anime.esm.min.js` is anime.js 4.5.0 (MIT), vendored from the npm
tarball, which drives the sheet's lift from the scroll position.

## Run it

    python3 -m http.server 4300

Then open http://localhost:4300. Serving matters: the font and icon paths are absolute.

## Test it

There is no test suite. Check these by hand before pushing:

- the wordmark renders in Sora, not a fallback (compare with the banner in ~/Developer/artifacts/brand/phosphor/)
- the mark shows in the nav with its cuts in green, not white, and `mark-green.svg` shows on the dark surfaces
- the dark sheet comes up small and grows to full width as it reaches the top; the hero never moves
- a scroll that ends near a section top settles on it; one that ends mid-way stays put; the three nav links land exactly
- the window mock shows Trade mode: a bare candle chart, the rail, and the empty conversation column
- the window mock is a still picture: nothing inside it reacts to a click
- Download says "Coming soon" on click and goes back after about two seconds
- the browser console is clean

`og.png` is a screenshot of the page at 2400x1260. Re-render it whenever the hero changes,
or the share card goes stale.

## Branches

- `main` is the page: green ground, black wordmark, MP cube mark, the Basic screen sheet.
- `screen-two` is a parked branch of the old marble bust page. Not the thing that ships.
