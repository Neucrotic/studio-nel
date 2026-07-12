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

This is a static single-page site (index.html). Any change must leave the rendered
page visually identical unless I explicitly ask to change how it looks. Refactors,
renames, and reorganisation are fine only when the output is unchanged.

Keep the existing conventions in place — BEM class names, CSS custom-property tokens,
semantic HTML, and the accessibility features (aria labels, focus-visible,
prefers-reduced-motion). Don't strip or "simplify" these away.

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