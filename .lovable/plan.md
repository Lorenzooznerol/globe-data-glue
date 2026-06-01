# Encounter + Design System globale 2026

Due livelli di lavoro: l'encounter cambia faccia, e i tokens che alimentano l'intero prodotto vengono riallineati. I componenti dell'atlante non vengono ridisegnati uno per uno — ma poiché usano `var(--background)`, `var(--foreground)`, `var(--primary)`, `--font-display`, `--font-serif`, ereditano in automatico font e palette nuovi. Risultato: atlante visivamente nuovo senza riscrivere ogni pannello.

## 1. Tipografia globale

Sostituire Fraunces (serif) e Space Mono ovunque.

- `src/styles.css`:
  - Rimuovere `@fontsource/space-mono/400.css` e `700.css`.
  - Aggiungere `@fontsource-variable/space-grotesk` e `@fontsource-variable/dm-sans` (pesi 300–700).
  - `--font-display: "Space Grotesk Variable", ui-sans-serif, system-ui, sans-serif`
  - `--font-sans: "DM Sans Variable", ui-sans-serif, system-ui, sans-serif`
  - `--font-serif` rimosso (non più usato) → sostituito con `--font-sans` ovunque venga referenziato in `styles.css` (linee ~174, 189).
  - `--font-mono` rimosso (non più referenziato dall'encounter; verifico con `rg` che non sia usato altrove prima di toglierlo).
- `bun add @fontsource-variable/space-grotesk @fontsource-variable/dm-sans` e `bun remove @fontsource/space-mono`.
- Atlante: i pannelli che usano `font-serif` Tailwind class diventano `font-sans`. Scan + sostituzione mirata nei file con `rg -l font-serif src/atlas`.

## 2. Palette globale (Carbon + violet)

Riscritta in `src/styles.css`. Stessi nomi di token, valori nuovi. Niente light mode contestato — l'atlante è già percepito come prodotto scuro, faccio del dark mode il default e tengo il light come fallback coerente.

Dark (default per l'app):
- `--background: oklch(0.13 0.005 270)` (≈ #0a0a0a leggermente desaturato)
- `--foreground: oklch(0.96 0.005 270)` (≈ #f5f5f7)
- `--card: oklch(0.17 0.005 270)` (≈ #1c1c1e, raised surface)
- `--muted: oklch(0.22 0.005 270)`
- `--border: oklch(1 0 0 / 0.08)` (bordi a 8% di opacità — quasi invisibili)
- `--primary: oklch(0.96 0.005 270)` (testo come azione primaria)
- `--accent: oklch(0.72 0.18 295)` (≈ #a78bfa viola tenue, **solo per stato "selezionato/attivo"**)
- `--ring: oklch(0.72 0.18 295 / 0.5)`

Encounter tokens (riusano i globali, niente più arancio):
- `--encounter-bg: var(--background)`
- `--encounter-ink: var(--foreground)`
- `--encounter-accent: var(--accent)` (viola per la seconda riga)
- `--encounter-hint: oklch(0.96 0.005 270 / 0.35)`

Light mode (mantenuto per `prefers-color-scheme: light`, ma `<html class="dark">` di default):
- Invertito coerentemente, accento viola identico.

L'arancio sparisce dall'intero codebase. Verifico con `rg "#ff5722|orange|encounter-accent.*ff"` prima di chiudere.

## 3. Radius, shadow, border (de-2020)

In `src/styles.css`:
- `--radius: 6px` (era probabilmente 8–12; ridotto per look tecnico)
- Bordi: ovunque `border` viene usato come separatore visivo, opacità 8% e mai colore pieno. Già coperto da `--border` nuovo.
- Shadow: rimuovere ombre pronunciate, sostituire con `--shadow-elevation-1: 0 1px 0 oklch(1 0 0 / 0.04) inset, 0 8px 24px -12px oklch(0 0 0 / 0.6)` per le "card" che galleggiano. Le card non hanno più border + shadow insieme — solo background elevation.

Nessuna modifica strutturale ai componenti dell'atlante in questo turno. Solo i tokens. Se dopo aver visto il risultato emergono pannelli che leggono ancora "quadrati", li lavoriamo in un secondo passaggio dedicato.

## 4. Encounter: nuovo reveal (glitch decoder)

Riscritto `src/encounter/Encounter.tsx`:
- Niente più due beats a 1200ms/2000ms. Il reveal parte a `t=0` appena il componente monta.
- **Algoritmo decoder**: per ogni lettera della frase, mostro un carattere random dal set `!<>-_\\/[]{}—=+*^?#________` che cambia ogni ~40ms; dopo un delay per-lettera (stagger 18ms da sinistra), si "lock-a" sul carattere finale. Durata totale riga 1: ~450ms. Riga 2 parte con stagger di 220ms rispetto a riga 1.
- Implementato con un singolo `requestAnimationFrame` loop, non timer per lettera (performante e cancellabile).
- `prefers-reduced-motion`: skip glitch, mostra testo finale subito.
- Hint "tap to enter" appare a fine reveal (riga 2 finita) con fade 200ms, niente pulse loop infinito — invece breathing sottile a 3s e ampiezza 0.5→0.7 (più calmo).
- Cursor pointer dall'inizio (non solo quando `ready`). Tap durante il reveal salta direttamente al finale (skip animation) anziché bloccare — comportamento 2026, l'utente comanda.
- Tipografia: `--font-display` (Space Grotesk) per la frase, peso 500, tracking -0.03em, dimensione `clamp(32px, 5.5vw, 64px)`. Body uguale alla display per la frase, DM Sans solo per il hint (10px, tracking 0.3em, uppercase).
- Seconda riga in `var(--accent)` (viola), prima riga in `var(--foreground)`.

## 5. File toccati

```text
package.json / bun.lock          (font swap)
src/styles.css                   (tokens, font vars, radius, keyframes)
src/encounter/Encounter.tsx      (riscritto: glitch reveal)
src/atlas/**/*.tsx               (rg + replace mirato di font-serif → font-sans)
```

## 6. Non toccato

- Struttura routing, dati, logica atlante, globe, server functions.
- Componenti dell'atlante (markup) — eredita via tokens.
- Light mode rimane disponibile ma non è il default.

## Dettagli tecnici (per chi legge il codice)

- Font variabili (`@fontsource-variable/*`) per evitare 4 file separati e supportare pesi 300–700 con un import.
- L'algoritmo glitch usa un singolo array di stato `chars: string[]` aggiornato in rAF; ogni indice ha un `lockAt: number` timestamp. Quando `now >= lockAt`, fissa il carattere reale; finché non è lockato, sceglie random ogni ~3 frame. Si ferma quando tutti gli indici sono lockati.
- I tokens `--encounter-*` puntano ai globali invece di avere valori hardcoded — così se cambi palette in futuro, l'encounter segue.
- `oklch` mantenuto per coerenza col resto del file e per migliore percezione di luminanza vs RGB.

## Cosa NON pianifico (ma è il prossimo passo logico)

Re-skin profondo dei pannelli atlante (rimozione bordi visibili, tabs piatti senza pillole, density alta stile Linear). È esplicitamente l'opzione "Full re-skin" che hai scartato per ora. Dopo aver visto questo turno, decidiamo se vale il secondo passaggio.
