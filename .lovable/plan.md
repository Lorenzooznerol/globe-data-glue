# Entry Encounter — Plan

A first-time visitor lands, types a nickname, and is taken through a single scripted "encounter" where the system judges them, then reveals why that matters. Cold, minimal, literary. Reuses the existing dark/light toggle. Pacing carries the emotion — slow fades only, no bounces, no slides. Mobile reads identically: same centered, one-line-at-a-time rhythm.

## What the user sees

1. **Gate.** Full-viewport black (or white in light mode). Center: `Hi ⎯⎯⎯⎯⎯` with a faded "nickname" placeholder above the dashes. Greeting types itself in letter-by-letter on load. User types inline; Enter submits. After 5s of silence post-first-keystroke, a faint `↵` glyph fades in.
2. **Judgment.** Name pins to the top. Lines fade in one at a time (~1.2–1.8s apart):
   - "Hi [name]. I've formed an opinion of you."
   - "I'm not letting you in."
   - Two buttons: **Why?** / **Fine, I'll leave.**
3. **Branches.**
   - *Fine, I'll leave* — first tap does nothing. After ~1s: "See that? / You were about to walk away without even asking why. / Stay. Tap the other one." Button then stays inert.
   - *Why?* — reveals the scripted apology + reframe, line by line.
4. **Convergence.** Both branches lead to the "keep that feeling" passage about loans, interviews, opaque opinions. Ends with the bold question:
   *"If something forms the wrong opinion of you, and decides your life on it — do you have the right to look it in the face and say it's wrong?"*
   Two buttons: **Yes — that's my right.** / **No — it's unavoidable.** Choice stored in state.
5. **Reveal.** Three-jurisdictions passage (EU / US / China). Then the mirror:
   *"You chose: that's my right. 96% chose the same…"*
   96% is a static placeholder (`// TODO: real aggregate`). One quiet low-contrast link into the main site. Nickname saved to `localStorage` at this point.

## Returning visitor

On load, if `localStorage` has a nickname → skip the entire encounter, route straight to the existing Atlas (`/atlas`). If not → run the encounter. Nickname is the only "account" — comment in code marks this as device-local by design, a privacy choice, not real auth.

## Routing

- New `/` → the encounter (`src/routes/index.tsx` becomes the gate).
- Existing Atlas moves to `/atlas` (`src/routes/atlas.tsx`), unchanged.
- The encounter ends by linking to `/atlas`.
- Returning visitors hit `/` and are immediately redirected to `/atlas`.

## Visual system

- One refined serif (e.g. *Instrument Serif* or *Cormorant*) loaded via `<link>` in `__root.tsx`. Body remains the existing sans.
- New CSS tokens in `src/styles.css`: `--encounter-bg`, `--encounter-ink`, `--encounter-ink-faint`, `--encounter-rule`. Driven by the existing `dark` class on `<html>`, so the existing `ThemeToggle` keeps working.
- Subtle radial vignette via a fixed pseudo-element on the encounter shell — darkens edges in dark mode, greys them in light mode. Gentle.
- All motion: opacity-only transitions, 600–900ms ease-out. No translate, no scale. Respects `prefers-reduced-motion` (lines appear instantly, pacing preserved via timers).
- The existing `ThemeToggle` is rendered in a corner at very low contrast on the encounter screen.

## Technical structure

```text
src/
  routes/
    index.tsx           → renders <Encounter/>, redirects to /atlas if nickname exists
    atlas.tsx           → current atlas page (moved verbatim from old index.tsx)
  encounter/
    Encounter.tsx       → top-level state machine
    useEncounter.ts     → step machine + timers + reduced-motion
    nickname.ts         → localStorage get/set (key: "atlas.nickname")
    steps/
      NicknameGate.tsx  → letter-by-letter greeting, inline dashes input, ↵ hint
      Judgment.tsx      → pinned name + 2 lines + Why? / Fine I'll leave
      WhyBranch.tsx     → scripted "Why?" reveal
      LeaveBranch.tsx   → inert-tap then 3-line callback
      Convergence.tsx   → "keep that feeling…" + bold question + Yes/No
      Reveal.tsx        → 3 jurisdictions + mirror + quiet link to /atlas
    Line.tsx            → single fade-in line primitive (handles reduced-motion)
    Vignette.tsx        → fixed radial overlay
```

### State machine

`step: "gate" | "judgment" | "why" | "leave" | "converge" | "reveal"`
`name: string`
`choice: "right" | "unavoidable" | null`
`leaveTaps: number` (first tap ignored, branch unfolds on tap 1)

Step transitions are driven by the script — only the gate, the Why?/Leave choice, and the Yes/No choice are user-driven. Everything else advances on timers (1200–1800ms per beat, slightly randomized within that range for natural pacing).

### Line primitive

`<Line delay={ms}>text</Line>` — mounts hidden, fades to full opacity over 700ms after `delay`. Parent composes a script as an ordered array; advancing to next step waits for the last delay + fade to settle. Reduced-motion: snap to visible, keep the same delay timing.

### Persistence

```ts
// nickname.ts
// Device-local by design. We collect nothing else; this is the only
// "account." Privacy choice, not real auth.
const KEY = "atlas.nickname";
export const getNickname = () => localStorage.getItem(KEY);
export const setNickname = (n: string) => localStorage.setItem(KEY, n.trim());
```

Saved only at the *end* of the encounter (after the final reveal renders), not at the gate — so a refresh mid-encounter restarts it. Acceptable: the encounter is short and the user has not yet "committed."

### Choice aggregate

`choice` lives in component state only. The "96%" line is a literal string with `// TODO: real aggregate` next to it. No fake live counter, no fetch.

## Open questions before building

1. **Atlas route name.** `/atlas` proposed; `/map` or keeping `/` for atlas after gate is also possible. Defaulting to `/atlas` unless told otherwise.
2. **Serif choice.** *Instrument Serif* is free, dramatic, and matches "cold, literary." Happy to swap for *Cormorant Garamond*, *EB Garamond*, or whatever you prefer.
3. **Nickname validation.** Trim whitespace, require ≥1 non-space char, otherwise no constraints (no length cap, no profanity filter). Confirm.
4. **Language.** Script is in English as written in your brief. Confirm — the rest of the app currently mixes IT/EN.

If any of these need changing, say so and I'll revise; otherwise I'll proceed with the defaults above.
