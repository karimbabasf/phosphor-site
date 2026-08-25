# phosphor-site

The landing page for Phosphor, at https://phosphor.karimbabasf.com

One self-contained file. `index.html` carries its own CSS, its own JavaScript and the
bust as a base64 luminance grid, so there is no build step and no dependency to install.

## Run it

    open index.html

Or serve the directory if you want the absolute asset paths to resolve:

    python3 -m http.server 8000

## Test it

There is no test suite. Check these by hand before pushing:

- the wordmark, tagline and both buttons fade in, and the character field animates
- Download says "Coming soon" on click and goes back after about two seconds
- the browser console is clean
- `favicon.svg` shows in the tab, and `og.png` is what a share preview picks up

`og.png` is a screenshot of the page itself at 2400x1260. Re-render it whenever the hero
changes, or the share card goes stale.

## Branches

- `main` is the single screen that ships.
- `screen-two` adds the scrolling section: the sample session and the approval gate. Work
  in progress, deployed only to its Vercel preview URL.

## Credit

The bust is Germanicus, J. Paul Getty Museum 2021.66, CC0.
