# CLAUDE.md — Atlante della Governance dell'IA

## Cos'è
Repo del globo interattivo dell'Atlante della Governance dell'IA. Modella la divergenza
fra tre layer — INTENT (cosa la policy dichiara), INSTRUMENT (cosa è formalmente
operativo), REALITY (cosa è realmente implementato) — su ~16 giurisdizioni + provider/lab
di foundation model come nodi commensurabili sul piano paper×iron.
Tesi centrale: **la morfologia della divergenza è il dato, non la magnitudine.**

Lingua: italiano in conversazione, inglese per codice/UI. Lavoriamo come **duo**.
Niente filler, niente hedging, niente next-step non richiesti, niente aperture valutative
("questa è la cosa più vera" = testo sprecato). Convinzione solo da conoscenza verificata.
Ruolo di Claude: **custode** — segnala quando il dato non regge il claim, non quando
è scomodo dirlo.

## DOVE VIVONO LE COSE
**Sorgente di lavoro — Google Drive (MCP `claude.ai Google Drive`):**
- Root Atlante: `1WFRtlmweVYLpUEL3qoNb94JhFx1y7rrV`
- `Dati — Tabelle`: `1FV932oix4ixl1wiKjN8PSUQpBXHptAc3` — 8 CSV normalizzati
- `SCHEMA_Data_Layer_01.md`: `1wX5IdJ7m7hWB5_xK03pzFYrQkQde8nPw`
- Audit corpus snapshot (2026-05-31): `1ZdVvKrj2-By3I1fjygvadIowpEFb0ac_`
- claims.csv: `1Udp3lSb2dRoONmwkGbdZCRvLPxdw30WL`
- `Metodo`: protocollo epistemico + rubrica band

**Deploy — questo repo:**
- `public/data/atlas.json` (310 KB), `public/data/girai.json`
- push su `main` → ridispiega da solo. **Lovable è fuori dalla catena: mai toccarlo.**

## LE 8 TABELLE (sorgente) → atlas.json
sources · nodes_banded · nodes_vision · morphology_timeindexed · claims · predictions ·
markers · legitimacy_edges. Totale baseline: 200 record, 1.494 campi.
Ogni riga confluisce nei campi del nodo via `node_id`. Master dimension table = vista
denormalizzata, NON ri-profilare.

## STRUTTURA atlas.json (NON alterare le 6 chiavi top-level)
Dict: `meta` · `glossary` · `markers` · `legitimacy_edges` · `nodes` · `unassigned_documents`.
`nodes` = **lista di 62 oggetti** (53 banded + 9 vision). Campi nodo:
node_id, name, layer {state|actor|deployer}, headline, summary, morphology_plain,
paper_plain, reality_plain, morphology, sub_mechanism, paper_band, realization_band,
realization_mode, epistemic_level, evidence_strength, region, notes, claims, documents,
morphology_timeline, predictions, iso3, supranational.

## FRAMEWORK EPISTEMICO (vincolante)
- `epistemic_level`: VERIFIED / ATTESTED / INFERRED / SPECULATED / OPAQUE
  (igiene del dato, non framing morale: misurato / stimato / mancante con metodo+incertezza
  per gli stimati)
- epistemic_level usa label EN on-disk; DA-VERIFICARE diventa TO-VERIFY.
- Band `paper_band` / `realization_band`: CI / IN / AS / S / C — **coppie categoriali
  ordinate, NON coordinate continue**
- Lente decoupling: Meyer & Rowan 1977, applicata a stati e provider
- **granello-first**: parti dalla più piccola unità verificabile
- Test: "fa pensare, non persuade". Claim load-bearing → ancora a fonte primaria obbligatoria.

## BASELINE AUDIT (snapshot 2026-05-31, da non ri-derivare)
error-rate **12.0%** · consistency **0.97** · accuracy **0.84** · completeness **0.88**
· confidence complessiva **C** · production-readiness **not_ready**
· artefatti su Drive: **15 / ~26 attesi**

## I 3 FAILURE POINT LOAD-BEARING (su 14 mappati)
- **FP-02**: deployer-key C020/C021 a **zero fonti** → bloccano SUT-02 (guarantor capacity).
  NON riempire in autonomia. C020 = Mobley v. Workday (ancora candidata: GovInfo);
  C021 = SR 11-7 (ancora candidata: Federal Reserve). Segnalare, non risolvere.
- **FP-07**: marker `M7-DLT-fails` non risolto → nessuna predizione scorata → blocca SUT-06.
- **E001**: `source_count` per claim/nodo non calcolato → blocca gradiente completezza (SUT-05);
  2 FK vuote.
- Copertura re-fetch URL: **1/68** fetch-confirmed (l'unico: S059→C023).

## SUTURE MAP (cosa si aggancia, robustezza, cosa la rompe)
- **SUT-01** fragility index = obbligo × 6 variabili-fragilità del calcolo. Robustezza
  **bassa-oggi**: gli obblighi vivono in `claims.claim_text` free-text, nessuna tabella
  obblighi strutturata → serve layer di estrazione prima. Ogni cella va marcata col ternario
  (VERIFICATO che il limite esista + INFERITO che *quell'*obbligo dipenda da *quella*
  proprietà) o diventa overconfidence.
- **SUT-02** obbligo × garante. Robustezza media. 3/5 tipi-garante presenti
  (provider AC-ANT/AC-XAI; deployer DP-D2/D4; regolatore via stato/legittimità);
  **infra-provider e supervisore-umano assenti**; deployer-key non-sourced (FP-02).
- **SUT-03** nodo VERIFICATO come ground-truth × pipeline LLM. Robustezza bassa.
  Set fetch-confirmed reale = **1**. Soglie benchmark: **≤15% varianza inter-run**,
  **≤70% gap best-vs-worst**. Ground-truth troppo piccolo finché non si esegue re-anchoring.
- **SUT-04** nodes_banded × morphology_timeindexed → traiettoria morfologica. Robustezza
  alta ma segnale sottile: solo 6 nodi / 12 righe / 2 date.
- **SUT-05** claims × sources (M:N) → source_count. Bloccato da E001.
- **SUT-06** predictions × markers × nodes_banded → falsificabilità ex-ante. Bloccato da FP-07.

## LE 6 VARIABILI-FRAGILITÀ (feature misurabili, non concetti)
1. limiti hardware/compute · 2. non-determinismo di inferenza hardware-indotto
· 3. distribution-shift · 4. errore di autoformalizzazione · 5. open-texture giuridica
· 6. fallimento supervisione umana (rubber-stamp).
Ordini di grandezza noti: varianza inter-run ~15%, tassi di override documentati.

## GUARDRAIL DEL LOOP (critico — STAGING, mai auto-write)
1. Leggi `.atlas_state.json` (root). Se assente = primo ciclo, stato vuoto, crealo a fine.
   Contiene hash+timestamp per tabella dell'ultimo stato noto.
2. Via Drive MCP leggi gli 8 CSV in `Dati — Tabelle`. Identifica SOLO record nuovi/modificati
   (delta vs `.atlas_state.json`). Nessun delta → 1 riga in AUDIT_REPORT.md e stop.
3. Sui SOLI delta: audit per il framework sopra. Marca ogni claim load-bearing col livello
   epistemico. Senza ancora primaria → DA-VERIFICARE, **mai inventare fonti**.
   **Mai toccare C020/C021** (FP-02): solo segnalare.
4. Aggiorna `public/data/atlas.json` PRESERVANDO le 6 chiavi top-level, `nodes` resta lista.
   Solo nodi toccati, via node_id. Python: json.load → json.dump(indent=2, ensure_ascii=False).
   Verifica post-scrittura: 6 chiavi presenti, len(nodes)==62 (o motiva ogni delta di count).
   atlas.json è serializzato indent=2, ensure_ascii=False. Ogni scrittura usa
   json.dump(d, f, indent=2, ensure_ascii=False). Mai cambiare l'indent dell'intero file
   in un commit di verifica.
5. `git add public/data/atlas.json`. **NON committare, NON pushare.**
6. Aggiorna `.atlas_state.json`.
7. AUDIT_REPORT.md, append, **max 5 righe**: timestamp · N record toccati · cosa è cambiato
   · cosa resta incerto (con FP/SUT ID se pertinente) · node_id toccati.
Stop. Nessun next-step.
