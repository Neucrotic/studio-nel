# Section reorder — packages first, software last

## Intent (Nel)

Pure reordering of the three `<main>` rows in `index.html`. Nothing inside a row
is edited, split, restyled or rewritten. Target reading order:

```
header.hero
main
  ├─ 1. section#client-package    ← Design & Build packages (Website + Apps)
  ├─ 2. section#studio-intro      ← "Who is NEL?" | #contact card (unchanged 2-col row)
  └─ 3. section#software          ← WriteLite card + kaku stage
footer.foot
```

Confirmed with Nel:

- `#studio-intro` moves **as one block** — the `#contact` form stays nested as
  the right-hand column of its grid (index.html:165). No grid is broken apart.
- Hero and footer do not move.
- Plan ends with a one-liner to update `AGENTS.md`.

## What the code says today

`index.html` `<main>` opens at line 59, closes at 389. Three blocks, each with a
leading one-line comment and a blank line separating it from its neighbour:

| Block | Comment line | Section | Closes |
|-------|--------------|---------|--------|
| Software | 60 `<!-- Software -->` | 61 | 131 |
| Studio intro | 133 `<!-- Studio intro — pitch copy left, contact form right. -->` | 134 | 218 |
| Client packages | 220 `<!-- Client packages — Website + Apps filled. -->` | 221 | 388 |

## Change — one step

1. **Re-cut the three blocks inside `<main>` in the new order.**
   - What changes: the order of the three `comment + <section>…</section>` blocks
     at lines 60–388 becomes client-package → studio-intro → software. Byte
     content of each block is identical; only its position in `<main>` moves.
   - Why: Nel wants the commercial packages to lead, the pitch + contact row
     second, and the software showcase last.
   - Risks / things to get right:
     - Each `<!-- … -->` label must travel **with** its section, or the comment
       ends up naming the wrong row.
     - Keep exactly one blank line between blocks, and keep `<main>` / `</main>`
       wrapping all three.
     - The last block sits flush against `</main>` (388→389, no blank line)
       — keep it flush.
     - Indentation is the same depth for all three (4 spaces) — no re-indent.
     - The `EDIT:` marker comments live inside their blocks and move with them.

## Deliberately left alone

- **`styles.css` — zero changes.** Verified: no selector depends on section
  order. No adjacent/sibling combinators, no `main > :first-child`, no
  `nth-child` on the sections. Only id-scoped rules `#studio-intro .grid`
  (styles.css:158) and `#client-package .grid` (690), plus their mobile
  counterparts at 1188–1191. All three rows are `.section`, so the 40px/27px
  block padding (151–154) is order-independent.
  The load-bearing CSS order warned about in the `styles.css` header is *within*
  the stylesheet and is untouched by an HTML move.
- **All four scripts — zero changes.** `cards.js`, `contact.js`, `stage.js`,
  `grid.js` select by class/attribute only (`[data-magnet]`,
  `.kaku-stage__inner`). Kaku's boot is driven by `animationend` on the
  WriteLite glide plus a 2500ms fallback timer (stage.js:245–246), not by scroll
  position or section index, so it still fires in the new last position. The
  glide itself is a load-time CSS animation (styles.css:279) — it runs
  regardless of where the card sits, so `animationend` fires as before.
- **Markup inside the sections.** No copy, class, id, aria label or element is
  touched.
- **No in-page anchor nav exists** (checked: no `href="#…"` anywhere), so there
  is no link list to reorder.

## Follow-up

- Update `AGENTS.md` with the new section order — its "Sections" list is
  currently written in the old DOM order and will be stale after this change.

## Known consequence

Keyboard tab order and screen-reader reading order follow the DOM, so the
contact form's fields now precede the WriteLite card's "Visit writelite.net"
link, and the package lists come before everything. That is the intended
effect of the reorder, not a side effect to fix.

## Invariants

- `<main>` still contains exactly three `<section class="section">` blocks, in
  the order `#client-package`, `#studio-intro`, `#software`.
- Every section keeps its id, its leading comment, its full inner markup and its
  4-space indentation.
- `#contact` remains nested inside `#studio-intro`'s `.grid`, after the
  `.studio-intro` column.
- Hero (`header.hero`) is above all three; `footer.foot` is below all three.
- `styles.css` and all files in `scripts/` are unmodified.
- All `EDIT:` marker comments still sit directly above the content they name.

## Manual verify (Nel)

Nothing is human-visible in markup order terms until the page is opened, so
these are Nel's to run. Local preview only — no build step exists.

1. `open index.html` in the browser (or serve the folder however you normally
   preview it).
   Expected, top to bottom: hero → "creative software" row is gone from the top
   → Design & Build website package card, then Apps package card → "Who is NEL?"
   copy with the contact form beside it → "creative software by NEL" with the
   WriteLite card and the kaku square → footer.
2. Compare spacing against the current page.
   Expected: identical vertical gaps between rows (all three are `.section`) and
   identical row layouts. Only the sequence differs.
3. Press `Tab` from the top of the page.
   Expected: focus now walks packages, then the contact form fields, then the
   WriteLite link — matching the new DOM order.
4. Watch the kaku square after the page settles.
   Expected: it still powers up on its own timer even though the WriteLite card
   is no longer the first row.
5. `git diff --stat` (read-only) — expected: `index.html` only, plus `AGENTS.md`
   once the follow-up is done. `styles.css` and `scripts/` show no diff.
