# Where things live

`SPECS.md` owns all implementation detail: the file map, design tokens and the
theme restore path, layout derivations, the kaku phase timeline and scale maths,
the client package decks' fan maths and state model, the contact form's contract,
accessibility behaviour, and a list of known quirks that look like bugs but are
not. Read it before changing anything non-trivial, and update it when a fact it
records stops being true.

Do not restate any of that here. This file is for how to work on the project,
not what the project is.

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

Rule order in `styles.css` is load-bearing in two places, and moving a rule out of
its group can silently change the page. The constraints are recorded in
SPECS.md §Cascade constraints — check them before reordering CSS.

# Comments carry the what; SPECS.md carries the why

When you write or move a comment, follow the split already in the codebase:

- **What it is** → one short line, inline.
- **Why this value, where a number came from, design history** → SPECS.md.
- **A warning** — anything stating a consequence of getting it wrong — stays
  inline, in full. A warning read in a spec file is a warning read too late.
- Mixed comments get split: the warning half stays, the derivation half moves.

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
