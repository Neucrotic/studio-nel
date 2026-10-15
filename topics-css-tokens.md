# Topics — CSS tokens & cleanup (Studio NEL)

Companion to canvas `report-css-tokens.canvas.tsx`. One paragraph per topic. Use these as entry points when cleaning styles.css.

## Token layers

The stylesheet mixes four layers in one file: raw palette (`--granite-*`, `--blue-*`), site semantics (`--bg`, `--text`, `--accent`), page-grid glow tokens, and component-scoped product knobs (`--pc-*`, `--acc`, `--k-*`, `--range`/`--pull`). Confusion usually means two layers share a word (especially “accent” and “glow”), not that tokens are missing.

## Dead root tokens

`--surface` and `--line` are defined on `:root` and never read via `var()`. Borders and card fills use hardcoded rgba/hex instead. They are the safest first cleanup: delete, or deliberately wire one surface (e.g. cool stone) to them.

## --accent shadowing

Site `--accent` is cornflower (`--blue-fill`). `.writelite-card` redefines `--accent` to amber so its rim and CTA inherit product colour. Contact and hero keep the blue. Treat this as intentional cascade, not a bug — rename before global search-replace.

## Stone island overlap

WriteLite (warm), kaku (multi-stop slate), and contact/client-detail (cool `#3b404a→#191c22`) all sell “stone island.” Contact already documents sharing client’s gradient and WriteLite’s grain SVG. Extracting cool-stone + grain is the highest-payoff dedupe with no design change.

## Magnet knobs (--range / --pull)

These look unused in CSS because nothing calls `var(--range)`. `cards.js` and `stage.js` read them with `getComputedStyle`. Deleting them breaks cursor magnet behaviour. Same for `--glow` on kaku, which stage.js also writes.

## Kaku scale math

Radii like `23.8px` and scale `0.5882352941` are 1.7× levitated-size authoring, locked to the dormant transform. Rounding for neatness desyncs card and rim. Leave this family alone until a deliberate size redesign.

## Naming map (--acc, --pc-*, --accent-*)

`--acc` = kaku energy only. `--pc-*` started as product-card stone text but contact reuses it. `--accent-artists` / `--accent-thinkers` are hero word colours; client-package hardcodes thinker’s purple and reuses artists’ teal as a label colour. Honest renames are a separate pass from colour dedupe.

## Hardcode triage

Three buckets: (1) hex that already equals a token — swap for `var()`; (2) product-local colours that should stay scoped; (3) one-offs (`#ff5a6a` error, `#ffb27a` wrap) that need a design call before promoting. Prefer bucket 1 first.

## Cleanup order

Delete/wire dead tokens → replace token-equivalent hex → share cool-stone + grain → optional renames → never “clean” kaku’s 1.7 scale family casually. Each step should leave the page visually identical (AGENTS.md).

## File shape (why 1200 lines)

Kaku (~282), client-package (~242), and contact (~210) are most of the file because they encode behaviour and layout, not leftover tokens. Line count alone is a weak signal for “unused CSS.”
