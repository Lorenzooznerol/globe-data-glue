# Redesign Atlante → pattern "Language Explorer" (rev. 3)

> **Errore della v1 da non ripetere:** la v1 codificava il punto-paese come *banda peggiore tra i nodi*. È un giudizio travestito da misura — un solo nodo CI rendeva tutto il paese "barely moving" anche con dodici nodi C accanto.
>
> **Errore della v2 (rev. 1) da non ripetere:** spostare "worst-wins" dalla banda all'evidenza è lo stesso errore. Un paese con dodici nodi STRONG e un OPAQUE non è "non conoscibile" — è quasi del tutto conoscibile con un buco. Renderlo anello cavo mente al contrario: finge di non sapere quando sai molto.
>
> **Regola corretta (v3):** la conoscibilità di un paese è una *proporzione*, non un binario. Vedi §1.

Una sola schermata, due stati. Il globo è il dataset; il colore è informazione, mai arredo. Palette esistente preservata.

## Decisioni di encoding e rendering

### 1. Encoding del punto-paese — coverage, non worst-wins

Il punto risponde a "quanto sai di questo paese?", come *proporzione* di nodi mappati con evidenza utilizzabile:

```
coverage = (nodi_STRONG + 0.5 * nodi_WEAK) / nodi_totali
```

Resa visiva in tre fasce + un caso limite:

| Condizione | Resa |
|---|---|
| `coverage ≥ 0.75` | disco pieno, opacità 1.0 |
| `0.40 ≤ coverage < 0.75` | disco pieno, opacità 0.65 |
| `0.10 ≤ coverage < 0.40` | disco pieno, opacità 0.40 |
| `coverage < 0.10` **o** `nodi_STRONG == 0 && nodi_WEAK == 0` | anello cavo hairline (vera assenza di conoscibilità) |

L'anello cavo è riservato ai paesi *davvero* opachi (OPAQUE domina o nessun nodo informativo), non ai paesi con un singolo buco.

- **Dimensione**: scala lineare su `nodi_totali` (3.5–6px equiv), cappata.
- **Colore**: bianco (token `--text`); nessuna banda sul punto.
- **Hover**: tooltip una riga — `nome · N nodi · coverage XX%`.
- **Bordo focus/match**: accent neutro singolo.

La banda (CI…C) vive nel pannello laterale e nel drill-down dei nodi, dove c'è contesto per leggerla onestamente.

### 2. Rendering dei punti — geometria nativa, non CanvasTexture

- **Layer disco**: `pointsData` nativo di `react-globe.gl` (geometria Three reale, nitida a ogni zoom). Niente sprite/texture.
- **Layer anello-cavo**: `customLayerData` con `RingGeometry` solo per i paesi che cadono nel caso limite (vedi tabella sopra). Hairline (inner 2.8 / outer 3.2 px equiv).

Costo accettato: nessuna codifica intent-vs-reality sul punto. Quella informazione vive nel pannello laterale dopo il click.

### 3. Scope reale — onesto, niente "out of scope" ottimistico

**Modificato:**
- `src/routes/atlas.tsx` — body sostituito da `<AtlasLanding>`; sulla landing default niente Legend/GiraiLegend/SideIndex/NodeCard flottanti/footer.
- `src/atlas/store.ts` — *aggiunge* slice (vedi sotto). **Non** rinomina `families`.
- `src/atlas/components/EarthGlobe.tsx` — modalità "ambient" (poligoni a 0.05), 2 nuovi layer (disco + anello-cavo), dim per `landingFilters`. Logica esistente intatta.
- `src/routes/__root.tsx` — `<link>` Hanken Grotesk.
- `src/styles.css` — `--font-sans`, tabular-nums, classe `.globe-shifted`.

**Intatto e verificato per dipendenze:**
- `src/atlas/families.ts`, `Legend.tsx`, `MigrationStrip.tsx`, `TrajectoryPanel.tsx`, `MorphologyVsScoreLine.tsx`, `SideIndex.tsx`, `NodeCard.tsx`, `GiraiOnlyCard.tsx`, `descent/italy/*`.

**Cambio dichiarato:** ModeSwitch sale nel TopBar. Su mode `girai`/`forecasts` i pannelli legacy si rimontano come overlay sopra la landing; su `overview` (default) c'è solo la landing.

## Stati di layout

**A — Riposo** (`!landingFilters.isActive && !selectedNodeId && !selectedIso`)
- Globo a punti centrato (~70% h), opacità 0.55, autorotate.
- Poligoni "atlante fantasma" opacità 0.05.
- Headline a ~38% h, sub con conteggio reale nodi.
- Search pill 60% w + 6 chip sotto.
- TopBar: wordmark · About · Metodo · FAQ · ModeSwitch · kebab.

**B — Attivo**
- Globo: opacità 0.3, `translate3d(20vw,0,0)`, autorotate più lento.
- Punti non-matching: opacità 0.1.
- Search sticky in alto, chip in linea.
- Headline/sub dissolvono.
- `ResultsPanel` sinistro 40% entra da `translateX(-100%)`; click su punto-paese → lista nodi del paese con bande e fonti.

**Transizione**: 550ms `cubic-bezier(.22,.61,.36,1)`. Reduced-motion: istantanea.

## 6 chip-filtro (slice `landingFilters`, separato da `families`)

1. **Giurisdizione** — Set<iso3>
2. **Layer** — Set<state|actor|deployer|vision>
3. **Morfologia** — Set<M1…M7>
4. **Banda carta** — Set<CI|IN|AS|S|C>
5. **Banda realtà** — Set<CI|IN|AS|S|C>
6. **Evidenza** — Set<STRONG|WEAK|OPAQUE>

Derived: `matchingNodeIds`, `matchingIsoSet`, `isActive`.

## Tipografia

- Hanken Grotesk via `<link>` in `__root.tsx` (300/400/500).
- `--font-sans` in `@theme` aggiornato; `--font-serif` legacy intatto.
- Headline: `clamp(3rem, 6vw, 5.5rem)`, weight 300, tracking -0.02em.
- `tabular-nums` su `.mono` e counter.

## Nuovi file

- `src/atlas/landing/AtlasLanding.tsx`
- `src/atlas/landing/TopBar.tsx`
- `src/atlas/landing/SearchHero.tsx`
- `src/atlas/landing/FilterChips.tsx`
- `src/atlas/landing/ResultsPanel.tsx`
- `src/atlas/landing/landingStore.ts` (slice separato)
- `src/atlas/landing/derive.ts` — `nodeMatches(node, filters)`, `aggregateCountryCoverage(nodesByIso)` (formula §1)

## Accettazione (verificabile)

1. `/atlas` carica → globo a punti, headline centrata, 6 chip. Niente Legend laterale.
2. ModeSwitch → `girai` → Legend/GiraiLegend si rimontano sopra la landing, identici a prima.
3. Filtro morfologia M3 → punti senza M3 a opacità 0.1; pannello sinistro entra con lista nodi M3.
4. Click punto Italia → pannello mostra ST-IT + AC-ACN + DP-… con bande e fonti.
5. Italy drill-down → `ItalyGraph` esistente identico, nessuna regressione.
6. **Coverage encoding**: un paese con 12 STRONG + 1 OPAQUE (coverage ≈ 0.92) si rende pieno opacità 1.0, *non* cavo. Un paese con 1 STRONG + 5 OPAQUE (coverage ≈ 0.17) si rende pieno opacità 0.40. Un paese con 0 STRONG/WEAK si rende cavo.
7. Reduced-motion on → transizione A→B istantanea.

## Rischi residui

- **Frizione visiva** fra landing (Hanken Grotesk) e pannelli legacy (serif) quando si attivano modi `girai`/`forecasts`. Accettato, riallineamento in pass dedicato.
- **Soglie di coverage** (0.75 / 0.40 / 0.10) sono prime stime; vanno tarate guardando la distribuzione reale dei nodi del dataset, non scelte a priori. Da verificare con un istogramma su `store.atlas.nodes` aggregati per iso3 nella prima esecuzione, e ritoccare se le fasce risultano vuote o squilibrate.
