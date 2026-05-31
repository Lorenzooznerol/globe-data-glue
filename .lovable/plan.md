# Encounter rewrite — new script, thinking dots, multiplication beat

Keep Step 1 (nickname gate) and the routing/persistence model. Rewrite Steps 2–5 to match the new script: shorter, colder, with a "thinking" dots beat and a one-time visual "multiplication" of a single line. All motion stays opacity-only.

## Script (canonical)

**Step 2 — judgment** (auto-advancing beats, ~1.4s between lines)
1. `Hi [name]. I've formed an opinion of you.`
2. Thinking dots (`. . .` fading in/out) for ~3s, then unmount the instant line 3 mounts.
3. `I'm not letting you in.`
4. Single button: `Fine, I'll leave.`

**Step 3 — locked door & branch**
- Tap "Fine, I'll leave" → button becomes inert (kept visible but disabled, low opacity). After ~1000ms:
  - `You're leaving without asking why.`
- Then two buttons: `Why?` · `Fine, I'll leave.` (second remains inert.)
- Tap `Why?` → reveal:
  - `I formed an opinion and acted on it.`

**Step 4 — the turn** (auto-advancing)
1. `AI does this too. It forms an opinion of you.` ← **multiplication beat** on this line only.
2. `The opinion it formed of you? You can't see it. Can't correct it.`
3. Bold/centered, alone: `It made up its mind about you. Do you get a say?`
4. Two buttons: `Yes` · `No`. Record choice.

**Step 5 — mirror & three answers**
- `You chose: yes.` / `You chose: no.` (mirrors choice)
- `96% chose the same.` (or `96% chose the opposite.`) — `// TODO: real aggregate, not invented`
- `Almost everyone wants this — and no one has it yet.`
- Two smaller, quieter lines:
  - `Europe comes closest — correct what's wrong, get a reason from a machine (GDPR; SCHUFA). The opinion itself: still contested.`
  - `America tells you why you were refused; the rest is the market. China lets you switch it off; the State sets the rules.`
- One low-contrast `continue` link → `/atlas`. Save nickname here.

## Implementation

### New primitive: `ThinkingDots.tsx`
Three `.` glyphs in `--encounter-ink-faint`, each fading 0→1→0 on a 1.4s loop, staggered 250ms apart. Mount/unmount controlled by parent — when parent removes it, it just unmounts (the next line fades in immediately so the gap reads as a beat, not a bug).

### New primitive: `MultipliedLine.tsx`
Wraps children. On mount, renders the text plus 2 absolutely-positioned ghost copies (slightly offset x/y by 2–4px, opacity ~0.25, same color). The ghost copies fade in over ~400ms after a 300ms delay, hold ~300ms, then fade back out over ~400ms. Net duration ~1s. No transforms beyond static offset; pure opacity transitions. Respects `reducedMotion` (renders as a plain line).

### Rewrite `steps/Judgment.tsx`
State machine inside the step:
- `phase: "line1" | "thinking" | "line2" | "button"`
- line1 at delay 400ms → after 1800ms switch to `thinking`
- `thinking` for 3000ms → switch to `line2` (unmounts dots, mounts line2 via Line with delay 0)
- after 1600ms → show single `Fine, I'll leave.` button via Line
- Button click calls `onLeave` (parent already handles routing to LeaveBranch).

### Rewrite `steps/LeaveBranch.tsx`
- Show the inert leave button at top (greyed, disabled).
- After 1000ms, fade in `You're leaving without asking why.`
- After ~1400ms more, fade in row: `Why?` (active) · `Fine, I'll leave.` (inert, disabled).
- `Why?` → fade in `I formed an opinion and acted on it.` then after ~2200ms call `onContinue()` (which advances to a new `turn` step).

### New step: `Turn.tsx` (replaces `WhyBranch` → `Convergence` flow)
- Beat 1 (delay 400): `AI does this too. It forms an opinion of you.` rendered via `MultipliedLine`.
- Beat 2 (delay 2800): `The opinion it formed of you? You can't see it. Can't correct it.`
- Beat 3 (delay 5400): bold centered alone: `It made up its mind about you. Do you get a say?`
- After ~2000ms more, fade in `Yes` / `No` buttons → calls `onChoose("right" | "unavoidable")`.

Old `WhyBranch.tsx` and `Convergence.tsx` are no longer referenced by Encounter; delete both.

### Rewrite `steps/Reveal.tsx`
New shorter script:
- delay 400: `You chose: yes.` / `You chose: no.`
- delay 2000: `96% chose the same.` / `96% chose the opposite.` (placeholder constant, `// TODO: real aggregate, not invented`)
- delay 3800: `Almost everyone wants this — and no one has it yet.`
- delay 6200, smaller text (`text-sm sm:text-base`, ink-faint): Europe line.
- delay 8200, same small style: America/China line.
- delay 10800: low-contrast `continue` link → `/atlas`.
- Nickname saved on mount of Reveal (existing `onEnter` effect).

### Update `Encounter.tsx`
- Step union becomes `"gate" | "judgment" | "leave" | "turn" | "reveal"` (drop `why`, drop `converge`).
- `handleLeave` no longer increments; Judgment now has only one button, which goes straight to `leave`.
- `LeaveBranch` `onContinue` advances to `turn`.
- `Turn` `onChoose` advances to `reveal`.
- Remove the `WhyBranch`/`Convergence` imports.

### Files
- create `src/encounter/ThinkingDots.tsx`
- create `src/encounter/MultipliedLine.tsx`
- create `src/encounter/steps/Turn.tsx`
- edit `src/encounter/steps/Judgment.tsx` (single button + thinking beat)
- edit `src/encounter/steps/LeaveBranch.tsx` (inert leave button persists, Why? leads to Turn)
- edit `src/encounter/steps/Reveal.tsx` (new shorter copy, three-answers block)
- edit `src/encounter/Encounter.tsx` (new step machine)
- delete `src/encounter/steps/WhyBranch.tsx`
- delete `src/encounter/steps/Convergence.tsx`
- edit `.lovable/plan.md` to reflect the new flow

No data, routing, theme, or nickname persistence changes.
