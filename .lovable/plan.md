# Nuova pagina di apertura — brutalist mono, due tempi, cliccabile

Sostituiamo l'intero flow di chat (nickname, "Hi", verdetto, "Why?", goodbye, stance Yes/No) con **una sola schermata silenziosa**. Niente nickname, niente chip, niente input. La frase stessa è la porta.

## Cosa si vede

Schermo intero, sfondo grigio cemento (`#1a1a1a`), testo color osso (`#e8e8e8`), tutto in **Space Mono**. Nessun bordo, nessuna card, nessun toggle tema visibile (lo togliamo da questa pagina — torna nell'atlante).

Layout: frase centrata orizzontalmente, leggermente sopra il centro verticale. Sotto, un micro-hint in mono minuscolo:

```text
                  AI forms an opinion of you.
                       Do you get a say?

                          ─ tap to enter ─
```

- Riga 1: ~clamp(28px, 5vw, 56px), peso 400, tracking stretto.
- Riga 2: stessa size, ma in colore **arancio acceso** `#ff5722` — l'unico accento di tutta la pagina. È la domanda, deve pesare.
- Hint sotto: 11px mono, opacity 0.4, uppercase, letter-spacing largo. Pulsazione opacity 0.4↔0.7 ogni ~2s (rispetta `prefers-reduced-motion`).

## Tempi (due battute)

1. **t=0** → fade-in di "AI forms an opinion of you." (350ms).
2. **t=1200ms** → fade-in di "Do you get a say?" (350ms).
3. **t=2000ms** → fade-in dell'hint "tap to enter" + il cursore diventa `pointer` sull'intera area.

Prima dei 2s la pagina **non è cliccabile** (evita skip accidentali). Con `prefers-reduced-motion`, tutto compare insieme a t=0 e diventa cliccabile subito.

## Interazione

- Click/tap **ovunque** sulla pagina → fade-out 500ms → `navigate({ to: "/atlas" })`.
- Tasto `Enter` o `Space` fa lo stesso (accessibilità da tastiera).
- Niente stance salvata: `/atlas` viene chiamato senza `search.stance`. La logica dell'atlante che legge `stance` continuerà a funzionare con `undefined` (è già opzionale).

## Cosa cancelliamo

- Tutto `ChatController` (script, sayAI, askChips, askNickname, goodbye, fade verso `/atlas` con stance).
- `ChatShell`, `ChatInput`, `AIMessage`, `UserMessage`, `TypingIndicator`, `ChoiceChips`, `Goodbye`.
- `nickname.ts` e la chiave `atlas.nickname` in localStorage (non più usata).
- I token CSS `--encounter-input-bg` / `--encounter-input-border` (non servono più).

I token `--encounter-bg` / `--encounter-ink` restano ma vengono **ridefiniti** per la nuova estetica (sotto).

## Dettagli tecnici

- Nuovo file `src/encounter/Encounter.tsx` — singolo componente, ~80 righe. Stato locale: `phase: 0 | 1 | 2 | "leaving"`, gestito con due `setTimeout`. `useEffect` con cleanup. Listener `keydown` per Enter/Space.
- `src/routes/index.tsx` continua a renderizzare `<Encounter />` — nessun cambio di routing.
- Font: aggiungere `@fontsource/space-mono/400.css` e `@fontsource/space-mono/700.css` in `src/styles.css` (Rubik non serve — la pagina è tutta mono). Aggiungere variabile `--font-display: "Space Mono", ui-monospace, monospace` e applicarla solo dentro la pagina encounter (non globale, l'atlante resta Fraunces).
- Token encounter aggiornati in `src/styles.css`:
  - light: `--encounter-bg: #1a1a1a`, `--encounter-ink: #e8e8e8`, `--encounter-accent: #ff5722`, `--encounter-hint: rgba(232,232,232,0.4)`.
  - dark: stessi valori (la pagina è volutamente identica nei due temi — è un manifesto, non un'interfaccia).
- Rimuovere import e usi morti (`ThemeToggle` dentro `ChatShell`, ecc.) eliminando i file sopra elencati.

## Fuori scope

- Atlante, globo, pannelli, dati — invariati.
- Routing — invariato (resta `/` → encounter, `/atlas` → atlante).
- Logica `stance` nell'atlante — invariata; semplicemente non arriverà più valorizzata da `/`.

## File toccati

- **Riscritto**: `src/encounter/Encounter.tsx`, `src/styles.css` (token + import font).
- **Cancellati**: `src/encounter/ChatController.tsx`, `src/encounter/nickname.ts`, tutta la cartella `src/encounter/chat/`.
- **Aggiunto**: dipendenza `@fontsource/space-mono` via `bun add`.
