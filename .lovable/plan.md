# Entry rewrite — AI chat interface, two real doors

Replace the current cinematic line-fade entry with a familiar AI chat shell (centered conversation column, typing dots before every AI message, user replies as tappable chips → rendered as right-aligned messages, disabled "Message…" input at the bottom). Same script content as agreed, ending in two real outcomes: "See where you are" cross-fades into the Atlas; "Fine, I'll leave" actually closes the experience to a blank `Goodbye.` screen recoverable only via reload.

Voice, persistence (nickname-only, device-local), returning-visitor skip, theme toggle, and `prefers-reduced-motion` handling are preserved. No data, routing target, or Atlas changes beyond passing the Yes/No stance through.

## Files

**Delete (old cinematic steps no longer used):**
- `src/encounter/Line.tsx`
- `src/encounter/Vignette.tsx`
- `src/encounter/MultipliedLine.tsx` (replaced by an inline chat-message variant)
- `src/encounter/ThinkingDots.tsx` (replaced by `TypingIndicator` styled as a chat bubble)
- `src/encounter/steps/NicknameGate.tsx`
- `src/encounter/steps/Judgment.tsx`
- `src/encounter/steps/LeaveBranch.tsx`
- `src/encounter/steps/Turn.tsx`
- `src/encounter/steps/Reveal.tsx`

**Create:**
- `src/encounter/chat/ChatShell.tsx` — fixed-height column (max-w ~640px), scrollable message list, sticky bottom `ChatInput`, low-contrast `ThemeToggle` in corner. Auto-scrolls to bottom on each new message.
- `src/encounter/chat/AIMessage.tsx` — left-aligned plain row, serif text, optional `emphasis` (bold) and `multiplied` (renders via ghost-copy effect, opacity-only, ~1s, skipped under reduced motion). Optional `pulse` prop for the final "See where you are" affordance — one gentle opacity pulse.
- `src/encounter/chat/UserMessage.tsx` — right-aligned bubble, subtle background (`--encounter-bubble`), the chosen chip text.
- `src/encounter/chat/TypingIndicator.tsx` — three pulsing dots inside a left-aligned bubble; shows for a duration set by the controller (default ~900ms; ~3000ms for the "deliberation" beat before "I'm not letting you in.").
- `src/encounter/chat/ChoiceChips.tsx` — row of tappable chips below the latest AI message. On tap: fire `onPick(label)`, the chips disappear, the controller appends a `UserMessage` with that label.
- `src/encounter/chat/ChatInput.tsx` — styled like ChatGPT/Claude: rounded input with placeholder `Message…` and a send arrow. Two modes: `disabled` (default; clicking/typing does nothing, cursor `not-allowed`, faint) and `active` (only enabled on the nickname turn; Enter or send button submits, then returns to disabled).
- `src/encounter/chat/Goodbye.tsx` — full-viewport blank screen in the current theme's background, single centered cold line `Goodbye.` Nothing else. No restart button. (Comment explains: reload is the only way back, intentional.)
- `src/encounter/ChatController.tsx` — the new entry component (replaces `Encounter.tsx` usage). Owns the message timeline, drives the script, handles cross-fade out.

**Edit:**
- `src/encounter/Encounter.tsx` — replace its body with a thin wrapper that renders `<ChatController />` (or inline the controller and delete this file; keep the file as the public entry so `routes/index.tsx` doesn't change).
- `src/routes/index.tsx` — unchanged except: when controller signals "enter atlas", navigate to `/atlas` with the stance in router state / search param so Atlas can read it. Returning-visitor skip stays.
- `src/routes/atlas.tsx` — read optional `?stance=yes|no` (or location state) and stash it in the existing atlas store as `userStance`. No visual change required in this task; this just makes the value available for later use. Mark with `// TODO: surface stance in Atlas UI`.
- `src/atlas/store.ts` — add `userStance: "yes" | "no" | null` + setter. No other behavior change.
- `src/styles.css` — add `--encounter-bubble` (subtle surface for user messages, light + dark), `--encounter-input-bg` and `--encounter-input-border` for the chat input, and keep existing `--encounter-*` tokens. Add a `@keyframes encounter-typing-dot` (replaces the inline one) and a `@keyframes encounter-soft-pulse` for the final affordance.

## The script (canonical, exact strings)

Controller drives an append-only timeline. Each AI message: append `TypingIndicator` → wait → replace with `AIMessage`. Defaults: typing ~900ms, post-message dwell ~700ms.

1. AI: `Hi.`
2. AI: `What should I call you?` → activate `ChatInput` (placeholder `nickname`). User types + sends → append `UserMessage(name)`, disable input, `setNickname(name)` in localStorage.
3. AI: `Hi {name}.`
4. AI: `I've formed an opinion of you.`
5. Typing indicator held **~3000ms** → AI: `I'm not letting you in.`
6. `ChoiceChips: ["Why?", "Fine, I'll leave."]`
   - `Fine, I'll leave.` → append `UserMessage("Fine, I'll leave.")`, then trigger Step 4 (close).
   - `Why?` → append `UserMessage("Why?")`, continue.
7. AI: `I formed an opinion and acted on it.`
8. AI (`multiplied`): `AI does this too. It forms an opinion of you.`
9. AI: `The opinion it formed of you? You can't see it. You can't correct it.`
10. AI (`emphasis`): `It made up its mind about you. Do you get a say?`
11. `ChoiceChips: ["Yes", "No"]` → append `UserMessage`, record `stance` in controller state.
12. AI: `Right now, every country is deciding on this. None the same.`
13. AI (`pulse`, tappable): `See where you are.` → on tap: cross-fade to `/atlas` with stance.

Removed entirely (per spec): any mirror/96%/Europe/America/China summary lines.

## Close behavior (Step 4)

On `Fine, I'll leave.`:
- After the user-message append, controller transitions to `goodbye` state.
- `ChatShell` cross-fades out (opacity → 0, ~600ms), then unmounts.
- `Goodbye.tsx` renders: full viewport, `--encounter-bg`, single serif line `Goodbye.` in `--encounter-ink-faint`. No nav, no buttons, no theme toggle. Code comment: a browser cannot self-close a tab the user opened; this blank state is the close. Reload is the only re-entry.
- Nickname is NOT saved on this branch (they didn't get in).

## Transition to Atlas (Step 5)

On `See where you are`:
- `ChatShell` opacity → 0 over ~600ms.
- `navigate({ to: "/atlas", search: { stance } })`. `/atlas` route reads `stance` from search params and writes to `atlasStore.userStance`.
- Atlas route's existing content remains unchanged in this task aside from the store hookup.

## Persistence & returning visitors

- `getNickname()` check in `routes/index.tsx` still bypasses the entry. Unchanged.
- Nickname saved at the moment the user submits it via the input (step 2), so even if they later pick `Fine, I'll leave.`, the next visit still skips — that matches "nickname = the only account" semantics. (Alternative: save only on "See where you are". Default to **save at submit**; flag this in a comment so it can be flipped easily if you prefer "leavers must re-enter".)

## Motion rules

- Typing dots: opacity-only pulse, staggered 250ms.
- `multiplied` line: 2 ghost copies, slight static offset, opacity ~0.28, fade in/out over ~1s. No transforms beyond static offset.
- `pulse` on final affordance: one ~1.4s opacity dip-and-return, then static.
- Cross-fade out: opacity transition only.
- `prefers-reduced-motion`: keep typing dots (they're the core gesture) but drop multiplication and pulse; cross-fade still happens but instantly.

## Styling tokens (additions in `src/styles.css`)

```
:root {
  --encounter-bubble: rgba(22, 22, 26, 0.05);
  --encounter-input-bg: #ffffff;
  --encounter-input-border: rgba(22, 22, 26, 0.14);
}
.dark {
  --encounter-bubble: rgba(255, 255, 255, 0.06);
  --encounter-input-bg: rgba(255, 255, 255, 0.03);
  --encounter-input-border: rgba(255, 255, 255, 0.12);
}
```

## Out of scope

- Real aggregate of Yes/No (no backend). Stance is passed to Atlas only.
- Any changes to Atlas visuals, GIRAI, forecast, borders.
- Any change to the dark/light toggle component itself.
