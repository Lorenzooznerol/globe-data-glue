# M4 (Hidden gap) → brand violet

Cambio chirurgico, un solo file.

## Cosa cambia

In `src/styles.css`, il token `--morph-m4` passa da `#7d6a96` (viola spento, basso contrasto sul dark) al viola brand del manifesto:

- `:root` (light): `--morph-m4: #a78bfa;`
- `.dark`: `--morph-m4: #a78bfa;` (stesso valore in entrambi — il viola brand è già `oklch(0.72 0.18 295)` ≈ `#a78bfa` e funziona su entrambi gli sfondi; in dark si vede vivo, in light resta leggibile sopra superfici chiare)

## Perché solo qui

`--morph-m4` è già wired ovunque la morfologia "Hidden gap" viene visualizzata: legend, pallini Side Index, swatch sul globo, BandMeter, MigrationStrip, ecc. Tutti i pannelli leggono `var(--morph-m4)` o `bg-morph-m4` via il theme inline. **Nessun componente va toccato.**

## Cosa NON cambia

- Le altre 6 morfologie (M1, M2, M3, M5, M6, M7) restano identiche.
- M1 ("Open gap") resta blu — distinzione cromatica netta fra i due gap (blu = visibile, viola = nascosto).
- Encounter, palette globale, tipografia: invariati.

## File toccati

`src/styles.css` — due righe (linea ~93 in `:root` e ~143 in `.dark`).
