# Task RPG — Look hand-off

Brief for an agent building a **web about / downloads** page that should *feel like* Task RPG without cloning the in-app layout.

**Product (one line):** desktop task-gamification RPG — real-world quests earn Action Points; AP fuels turn-based monster battles. Tauri + Svelte.

**Page job:** introduce the app, explain the loop lightly, and offer downloads. Not a playable game shell.

---

## Mood

- Dark fantasy UI-lite, not gothic horror and not neon cyber.
- Calm void background + mint/gold highlights; readable, compact, slightly gamey.
- Flat SVG / silhouette art, not photoreal, not 3D gloss, not emoji.
- Soft depth (panel shadows, radial bg washes) — never heavy glow stacks or glassmorphism.

Think: **small RPG HUD panels on a night sky**, not a SaaS dashboard.

---

## Palette (copy these tokens)

| Token | Hex | Role on a marketing page |
|-------|-----|--------------------------|
| `--bg` | `#0d0d18` | Page ground |
| `--panel` | `#161628` | Cards / sections |
| `--panel-2` | `#1e1e36` | Nested rows, secondary surfaces |
| `--border` | `#33334d` | Default borders (1–2px) |
| `--accent` | `#4af0c8` | Primary accent: titles, links, primary CTA fill |
| `--accent-2` | `#f0c04a` | Secondary highlight: badges, “gold” callouts |
| `--danger` | `#f04a6a` | Use sparingly (warnings only; not brand) |
| `--text` | `#e6e6f0` | Body |
| `--muted` | `#8888aa` | Hints, captions, secondary copy |
| (extra) | `#0a0a14` | Deep wells (inputs, log-like blocks) |
| (extra) | `#26264a` / `#2a2a4a` | Hover lifts on interactive surfaces |

**Float / bar colours** (optional accents if you show fake HP/XP chrome):

- Damage / HP fill: `#f04a6a` → `#ff8080`
- XP fill: `#4af0c8` → `#6ad0ff`
- Heal / potion: `#4af04a` → `#a0ff80`

**Do not** default to purple-on-white, cream+serif terracotta, or pure black with cyan neon. Stick to the indigo-void + mint + gold set above.

---

## Typography

```css
font-family: "Trebuchet MS", "Segoe UI", sans-serif;
```

- Body: `--text`, comfortable ~0.95–1rem, muted captions ~0.75–0.85rem.
- Section titles: `--accent`, often **uppercase + letter-spacing ~2px** (modal-title energy).
- Micro labels (slot/column headers): `--muted`, **uppercase**, `letter-spacing: 1px`, ~0.65rem.
- Hero product name can go near-white (`#fff`) and bold; don’t let a marketing headline overpower the brand name.

Avoid Inter / Roboto / system-only stacks as the primary face.

---

## Surfaces and chrome

**Page background** (match this recipe):

```css
background:
  radial-gradient(circle at 20% 0%, #1a1a30 0%, transparent 45%),
  radial-gradient(circle at 80% 100%, #16162e 0%, transparent 45%),
  var(--bg);
```

**Panel / card:**

- Fill: `--panel`
- Border: `2px solid --border`
- Radius: **12px** (modals / hero cards: **14px**)
- Padding: ~14–16px (modals ~28–30px)
- Shadow: `0 6px 24px rgba(0, 0, 0, 0.4)` (deeper for overlays: `0 10px 50px rgba(0,0,0,0.6)`)

**Nested row / chip surface:** `--panel-2`, `1px solid --border`, radius **8px**.

**Primary CTA button:**

- Fill `--accent`, text `#0a0a14`, bold, radius **8px**
- Hover: slight brightness up (`filter: brightness(1.1)`)

**Secondary / ghost button:**

- Fill `--panel-2`, border `--border`, text `--text`
- Hover: bg `#2a2a4a`, border `--accent`, `translateY(-2px)` (~0.15s)

**Pill badge** (level / gold callout):

- Text `--accent-2`
- bg `rgba(240, 192, 74, 0.12)`, border `1px solid rgba(240, 192, 74, 0.4)`, radius ~20px

**Focus / selected:** border shifts to `--accent` (mint outline), not a thick blue ring.

---

## Layout cues for the web page

- Prefer a **narrow, centred column** (~480–640px content) or one strong hero composition — not a multi-widget dashboard.
- Group content in 1–3 panel cards (About, How it works, Download), same visual language as in-app panels.
- Generous dark space; avoid dense card grids and stat strips.
- First viewport: brand name, one short hook, one CTA group, optional single SVG/artwork anchor. No floating promo chips on the art.

---

## Art direction

- Source vibe: flat **SVG silhouettes** from the desktop app (`static/artwork/` — monsters, items, move icons, hero parts). Prefer those assets or close cousins over stock photos.
- Sprites feel pixel-adjacent but are vector; keep edges clean, limited palette per icon.
- If showing a “game preview,” a single panel mock (profile bar + faux battle strip) is enough — don’t rebuild the full 4-panel game chrome.

---

## Voice (copy tone)

- Second-person, light RPG flavour (“quest log”, “Action Points”, “defeat the gauntlet”).
- Short sentences; avoid corporate SaaS fluff.
- Title casing for modal-like headings is fine: `ABOUT`, `DOWNLOAD`, `VICTORY`-energy for win moments only.

---

## Recreate checklist

1. Dark indigo void + dual radial washes.
2. Mint `#4af0c8` primary, gold `#f0c04a` secondary — nothing else as brand.
3. Trebuchet / Segoe stack.
4. 12px panel radius, 2px `#33334d` borders, soft black shadow.
5. Flat SVG silhouettes; no photo hero, no purple gradient theme.
6. CTAs: mint fill / dark text; secondary ghost with mint hover border.
7. Page stays “about + download,” not a fake playable HUD.

---

## Out of scope for this hand-off

Game rules, save format, Tauri IPC, and combat math live in `DESIGN.md` / `ARCHITECTURE.md`. This file is **visual + tone only**.
