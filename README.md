# phosphor-site

The landing page for Phosphor, at https://phosphor.karimbabasf.com

Static files, no build step. `index.html` carries its own CSS and JavaScript, `mark.svg` is
the MP cube mark, and `fonts/` holds Sora (Regular and SemiBold), the brand face.

## Run it

    python3 -m http.server 4300

Then open http://localhost:4300. Serving matters: the font and icon paths are absolute.

## Test it

There is no test suite. Check these by hand before pushing:

- the wordmark renders in Sora, not a fallback (compare with the banner in ~/Developer/artifacts/brand/phosphor/)
- the mark shows in the nav with its cuts in green, not white, and `mark-green.svg` shows on the dark surfaces
- the dark sheet slides up over the hero with rounded corners; the hero stays put
- Approve on the trade screen swaps to "Approved" and the card fades; Close and Cancel ask "Sure?" first
- Download says "Coming soon" on click and goes back after about two seconds
- the browser console is clean

`og.png` is a screenshot of the page at 2400x1260. Re-render it whenever the hero changes,
or the share card goes stale.

## Branches

- `main` is the page: green ground, black wordmark, MP cube mark, the trade screen sheet.
- `screen-two` is a parked branch of the old marble bust page. Not the thing that ships.
