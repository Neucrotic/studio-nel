# Specs

What the site is for and how it is hosted.

**The code is the source of truth.** Agents must never repeat information in
docs (including this file) that already lives in the HTML, CSS, or JS. Read the
code for implementation detail. Docs stay at purpose and hosting only.

## Hosting

- Public URL: `https://nel.studio`
- Static site from this repo, served with GitHub Pages
- Custom domain via root `CNAME` (`nel.studio`)
- No server and no build step; `index.html` is the entry point

## Sections

**Studio intro (hero)**  
Brand and one-line positioning: Studio NEL builds creative tools for artists
and thinkers.

**Current software (`#software`)**  
Software NEL makes: WriteLite (live) and kaku (shown as work in progress).

**Studio pitch + contact (`#packages` / `#contact`)**  
Why work with NEL, plus the contact form (and `hello@nel.studio`) to start a
conversation about building software.

**Client packages (`#packs`)**  
Commercial Website and Apps offerings (Design / Build). What a client can buy,
not the studio’s own shipped products.

**Footer**  
Social links, studio tagline, and copyright.

---

# Working with files

When I say I am handing you a file (attaching, providing, or including it), never search for it or dig through my filesystem. If you can't find or access it, ask me and defer to me instead of hunting for it.

# Diagnose before you rewrite

When I describe my own code as bad — "sloppy", "messy", "unreadable", "poorly
implemented", "weird" — treat that as a hypothesis to test, not a fact to act on.
Read the code first and tell me honestly whether you agree. If it's actually fine,
say so and stop. Do not manufacture changes to match my framing.

Prefer the smallest change that fixes the real problem. Don't rewrite working code
for style or taste. A large diff needs a real justification, and "it could be
cleaner" is not one.

# Preserve behaviour and appearance

This is a static site with no server and no build step; `index.html` is the entry
point. Any change must leave the rendered page visually identical unless I
explicitly ask to change how it looks. Refactors, renames, and reorganisation are
fine only when the output is unchanged.

Keep the existing conventions in place — BEM class names, CSS custom-property tokens,
semantic HTML, and the accessibility features (aria labels, focus-visible,
prefers-reduced-motion). Don't strip or "simplify" these away.

Rule order in `styles.css` is load-bearing in places noted in that file's own
header — check there before reordering CSS. Do not restate those constraints in
docs.

# Comments

When you write or move a comment, follow the split already in the codebase:

- **What it is** → one short line, inline.
- **Why this value, where a number came from, design history** → short inline
  comment next to the code if needed — never a second copy in docs.
- **A warning** — anything stating a consequence of getting it wrong — stays
  inline, in full. A warning read in a doc is a warning read too late.
- Mixed comments get split: the warning half stays, the derivation half stays
  with the code (not moved into docs).

Never leave a decoded or paraphrased copy of a value that also exists in code.
Two copies drift, and the stale one becomes a misleading authority.

# Explain, then verify

For any non-trivial change, tell me what you changed and why, and what you
deliberately left alone and why. Before claiming you're done, confirm the page
still renders and the change actually works.

# When my premise is wrong, say so

If my request assumes something about the code that turns out to be false, surface
it and ask before acting — don't quietly build on the wrong assumption.

# Nelson Verifies Visual Changes
If a change has been implemented, only verify the validity of the code, check for logic errors as well as syntax.
Nelson can check the visual elements himself.
