# Plan: Wissensseite mit Lernpfaden (Etappe „Wissen“)

Stand: 30.09.2026 · Inhalte: `docs/wissen/` (PR #32) · Entscheidungen: Marcel, 30.09.

## Warum

Die App sagt heute, **was** an einem Schwung auffällt. Die Wissensseite erklärt das **Warum und Wie
drumherum** – als kurze Lektionen in Lernpfaden, mit Bildern, Quizfrage und Übung. Alles offline.

## Entscheidungen (30.09.)

| Frage | Entscheidung |
|---|---|
| Externe Links (YouTube, Instagram) | **Nein.** Quellen erscheinen nur als Text („Quelle: TrackMan-Messdaten“). Die App ruft keine neuen Adressen auf. |
| Bilder oder Text | **Lieber Bilder.** Jede Lektion hat mindestens ein Bild: Strichfigur aus echten Profi-Posen oder ein eigenes Schaubild. |
| Umfang | **Alle Kapitel**, aber übersichtlich: **Lernpfade** aus **kurzen Lektionen** + ein Bereich „Nachschlagen“. |
| Fortschritt | **Ja**: erledigte Lektionen mit ✓, „3 von 7“ pro Pfad. Nur lokal gespeichert. |
| Quizfrage | **Ja**: eine Frage mit 3 Antworten am Ende jeder Lektion (sich selbst abfragen festigt Wissen). |
| Übung starten | **Ja**: Wo es passt, öffnet ein Knopf die Übung im vorhandenen Übungsmodus. |
| Verknüpfung | **Ja**: Baustellen-Karte → „📖 Lektion dazu“. |
| Golflehrer-Durchsicht | **Entfällt.** Stattdessen strenge Regeln (nächster Abschnitt). |
| Schwunggedanken in `tipps.js` | **Nur sichere Änderungen**: Verbote positiv umformulieren, Inhalt gleich. Fachlich neue Gedanken nicht. |

## Fachliche Absicherung ohne Golflehrer (strenge Regeln)

1. In die App kommt nur, was **belegt** ist: Messdaten, Studie, offizielle Regel – **oder** mindestens
   **zwei unabhängige Quellen** sagen dasselbe. Jede Lektion trägt dafür ein Feld `beleg`
   (`"messung"`, `"studie"`, `"regel"`, `"zwei-quellen"`).
2. **Umstrittenes** kommt nicht als Regel in die App. Wo es wichtig ist, steht es als „Trainer sind uneins:
   …“ (z. B. Ballposition fest vs. wandernd).
3. Jede Lektion nennt ihre **Quellen** (Kennungen wie `TM`, `GT`, `TPI`, die in `docs/wissen/` mit Link
   stehen). Ein Test prüft: Jede Lektion hat mindestens eine Quelle, jede Kennung ist bekannt.
4. **Figuren** zeigen nur Posen aus dem echten Profi-Schwung (Regel aus `uebungsbilder.js`). Schaubilder
   sind **schematisch** und beschriftet – sie zeigen Prinzipien, keine Körperhaltung.
5. **Zahlen** nur mit Quelle und gerundet („ca. 90°“). 3D-Messwerte werden als solche benannt.
6. Kleiner Hinweis auf der Übersicht: „Allgemeines Golfwissen mit Quellen – ersetzt keinen Unterricht.“
7. **Keine Gesundheitsratschläge** über das Allgemeine hinaus (Aufwärmen); bei Schmerzen → Arzt.

## Aufbau

Neuer vierter Knopf in der Leiste: **📖 Wissen**.

```
📖 Wissen
├─ Dein Pfad (passend zum Level hervorgehoben)          ← Lernpfade mit Fortschritt
│   Lektion → wischen: Bild+Kernsatz · 2–4 Karten · Quiz · ✓ erledigt · Übung · Nächste
└─ Nachschlagen: Glossar · Irrtümer · Regeln-Tabelle · Ballflug-Helfer · Suche
```

- **Lektion = Wisch-Karten** wie bei den Baustellen (gleiches Aussehen, gleiche Bedienung):
  1. **Bildkarte**: großes Bild + Kernsatz (≤ 15 Wörter).
  2. **2–4 Inhaltskarten** (je ≤ 35 Wörter), jede gern mit kleinem Bild.
  3. **Quizkarte**: Frage + 3 Antworten, nach dem Tippen eine kurze Erklärung (≤ 25 Wörter).
  4. **Abschlusskarte**: ✓ erledigt, „Übung starten“ (falls vorhanden), „Nächste Lektion“, Quellen als Text.
- Eine Lektion dauert **ca. 1–2 Minuten**.
- Level: Pfade und Lektionen tragen 🌱/🌿/🌳. Zum gewählten Level wird der passende Pfad oben gezeigt; alle
  anderen bleiben erreichbar.

## Die Lernpfade (alle Kapitel aus `docs/wissen/`)

Bild-Kürzel: **F** = Strichfigur aus Profi-Posen · **S** = neues Schaubild (Liste unten).

### Pfad 1 · 🌱 Start: Vom ersten Schlag zur Platzreife (8 Lektionen)
| # | Lektion | Bild | Übung | Quelle (Datei) |
|---|---|---|---|---|
| 1 | Wie lernt man Golf? (Weg, Reihenfolge vom Loch weg) | S Weg-Grafik | – | `erste-schritte` |
| 2 | Die Schläger (Loft, wofür welcher) | S Loft-Fächer | – | `erste-schritte` |
| 3 | Der Griff | S Griff-Skizze (2 Knöchel, V) | Griff 10× | `grundlagen` |
| 4 | Ausrichtung: die Eisenbahnschienen | S Schienen | Zwei Stäbe | `grundlagen` |
| 5 | Haltung beim Ansprechen | F hinten Ansprechen | Schläger am Rücken, Faust-Check | `grundlagen` |
| 6 | Erster Putt: Pendel und Länge | S Pendel | Leiter | `putten` |
| 7 | Erster Chip | S Flug : Rollen | Landezone | `kurzes-spiel` |
| 8 | Platzreife: Regeln & Etikette in 5 Minuten | S Pfahlfarben | – | `regeln-etikette` |

### Pfad 2 · 🌱→🌿 Der Vollschwung (7 Lektionen)
| # | Lektion | Bild | Übung | Quelle |
|---|---|---|---|---|
| 1 | Die Phasen P1–P10 | F Animation Profi-Schwung | – | `vollschwung` |
| 2 | Stand und Ballposition je Schläger | S Füße von oben + Ballpositionen | – | `grundlagen` |
| 3 | Rückschwung & Top: drehen statt schieben | F Top + S Messwerte Tour/Amateur | Schläger vor der Brust, Stab-Übung | `vollschwung` |
| 4 | Abschwung: die kinematische Kette | S 4 Kurven (Becken → Schläger) | Hüfte bis Hüfte | `vollschwung` |
| 5 | Treffmoment: Hüfte offen, Hände vorn | F Treffmoment | Po an die Wand | `vollschwung` |
| 6 | Finish und Rhythmus 3 : 1 | F Finish + S Zeitbalken | Mitzählen, Finish 3 s | `vollschwung` |
| 7 | Driver vs. Eisen | S Eintreffwinkel auf/ab | – | `vollschwung`, `ballflug-und-fehler` |

### Pfad 3 · 🌿 Ballflug verstehen & Fehler beheben (7 Lektionen)
| # | Lektion | Bild | Übung | Quelle |
|---|---|---|---|---|
| 1 | Die Ballfluggesetze | S Fläche + Bahn (Draufsicht) | – | `ballflug-und-fehler` |
| 2 | Die neun Ballflüge | S Neun Flugkurven | Ballflug-Helfer | `ballflug-und-fehler` |
| 3 | Treffpunkt und Gear Effect | S Schlagfläche Spitze/Ferse | Treffpunkt sichtbar machen | `ballflug-und-fehler` |
| 4 | Slice beheben | S Bahn von außen | Schachtel-Übung, Handtuch | `ballflug-und-fehler` |
| 5 | Fett und getoppt: der tiefste Punkt | S Bogen + tiefster Punkt | Linien-Übung, Handtuch | `ballflug-und-fehler` |
| 6 | Shank | S Hosel-Treffer | Zwei-Bälle, Faust-Check | `ballflug-und-fehler` |
| 7 | Hook, Push, Pull, Sky | S Kurzübersicht | – | `ballflug-und-fehler` |

### Pfad 4 · 🌿 Rund ums Grün (6 Lektionen)
| # | Lektion | Bild | Übung | Quelle |
|---|---|---|---|---|
| 1 | Putt, Chip oder Pitch? | S Entscheidungsbild | – | `kurzes-spiel` |
| 2 | Chippen und die Regel der 12 | S Flug : Rollen je Schläger | Landezone | `kurzes-spiel` |
| 3 | Pitchen mit dem Uhren-System | S Uhr 7:30/9:00/10:30 | Wedge-Längen | `kurzes-spiel` |
| 4 | Bunker: den Sand treffen | S Eintrittspunkt im Sand | Linie im Sand | `kurzes-spiel` |
| 5 | Putten: Länge vor Linie | S 40 cm hinter dem Loch + Balken Putt-Quoten | Leiter, Bocksprung | `putten` |
| 6 | Grüns lesen | S Falllinie von oben | Füße fühlen | `putten` |

### Pfad 5 · 🌿 Clever spielen (6 Lektionen)
| # | Lektion | Bild | Übung | Quelle |
|---|---|---|---|---|
| 1 | Streuung statt Traumschlag | S Ellipse auf Fairway/Grün | – | `platzstrategie` |
| 2 | Annäherung: Grünmitte, hinterer Rand | S Grün mit Zielpunkt | – | `platzstrategie` |
| 3 | Persönliches Par | S Loch mit Bogey-Plan | – | `platzstrategie` |
| 4 | Hanglagen | S 4 Hänge | – | `platzstrategie` |
| 5 | Wind, Rough, Nässe | S Windpfeile | – | `platzstrategie` |
| 6 | Routine und Nervosität | S Denk-Zone / Spiel-Zone | Atmung 4-2-6 | `grundlagen`, `mental-und-fitness` |

### Pfad 6 · 🌱 Besser üben (6 Lektionen)
| # | Lektion | Bild | Übung | Quelle |
|---|---|---|---|---|
| 1 | Worauf achten? Schläger statt Arme | S Innen/außen-Vergleich | – | `richtig-ueben` |
| 2 | Bilder statt Verbote | S Pendel-Bild | – | `richtig-ueben` |
| 3 | Verteilt und abwechslungsreich üben | S Kalender 3×20 statt 1×60 | – | `richtig-ueben` |
| 4 | Der Range-Plan | S Zeitleiste 60 min | Range-Runde | `richtig-ueben` |
| 5 | Aufwärmen und Beweglichkeit | F Posen + S Selbsttests | Aufwärmen 10 min | `mental-und-fitness` |
| 6 | Üben mit dieser App | S Ablauf Filmen → Karte → Übung | – | `richtig-ueben` |

**Nachschlagen** (kein Pfad, kein Quiz): Glossar · Irrtümer (je eine Karte „Irrtum → Was stimmt“) ·
Regeln-Tabelle · Ausrüstung (Schläger, Schaft, Ball) · **Ballflug-Helfer** · Suchfeld über alle Titel und
Glossarbegriffe.

**Summe**: 40 Lektionen, ca. 45–60 Minuten Lernzeit insgesamt.

## Bilder

Alles wird **im Code gezeichnet** (SVG über den vorhandenen Weg: reine Logik liefert Linien/Kreise/Texte,
`app.js` zeichnet). Keine Bilddateien, keine Fotos, keine fremden Grafiken. Farben nur über die
Variablen in `style.css` (hell und dunkel).

- **Figuren (F)**: die Posen aus `uebungsbilder.js` (Profi-Schwung frontal, Ansprechen von hinten),
  auch als Animation.
- **Schaubilder (S)**: neue Datei `schaubilder.js` (reine Logik, testbar). Rund 25 Bilder, z. B.
  neun Flugkurven, Fläche/Bahn-Pfeile, Schlagfläche mit Treffpunkt, Schwungbogen mit tiefstem Punkt,
  Eisenbahnschienen, Füße mit Ballpositionen, Uhr, Flug : Rollen, Sand-Eintritt, Falllinie, Streuungs-
  Ellipse, vier Hanglagen, Windpfeile, Pfahlfarben, Zeitbalken 3 : 1, kinematische Kette, Balken für Putt-
  Quoten, Denk-/Spiel-Zone, Range-Zeitleiste.
- **Griff-Skizze** ist vereinfacht (Handrücken mit 2 sichtbaren Knöcheln, „V“ als Pfeil) und so beschriftet.
- Tests prüfen: Jedes in `wissen.js` genannte Bild existiert in `schaubilder.js` oder `uebungsbilder.js`.

## Daten und Speicherung

- `wissen.js` (reine Daten + kleine Hilfsfunktionen, testbar):
  `PFADE`, `LEKTIONEN` (id, pfad, level, titel, kern, bild, karten[], quiz, uebung?, kennzahlen[],
  quellen[], beleg), `GLOSSAR`, `IRRTUEMER`, `QUELLEN` (Kennung → Name als Text, **ohne** Links).
- **Fortschritt** im `localStorage` unter `wissenFortschritt` (Liste erledigter Lektions-IDs). Wie `level`:
  wird von „Alles löschen“ **nicht** gelöscht (Regel in CLAUDE.md, Test `sicherheit.test.mjs` ergänzen).
  Enthält keine Schwungdaten.
- Längen-Tests wie bei `tipps.js`: Kernsatz ≤ 15 Wörter, Karte ≤ 35 Wörter, Quiz genau 3 Antworten, genau
  eine richtig, Erklärung ≤ 25 Wörter.
- Texte nur per `textContent` (Sicherheitsregel), keine Links.

## Stand Schritt 1 (`wissen-geruest`, 0.22.0, 30.09.)

- Umgesetzt: `wissen.js`, `schaubilder.js` (7 Schaubilder für Pfad 1 – vorgezogen aus Schritt 2), Bereich
  „📖 Wissen“, Lektion als Wisch-Karten, Quiz, ✓-Fortschritt, „Übung starten“ (vorgezogen aus Schritt 5),
  Pfad 1 mit 8 Lektionen, Tests `tests/wissen.test.mjs`.
- **Quellen-Kennung = `datei:KÜRZEL`** (z. B. `grundlagen:HM1`), weil die Kürzel nur innerhalb einer Datei
  eindeutig sind. Der Test prüft, dass jede Kennung mit Link in der Datei steht.
- **Übungen ohne Profi-Figur** (Griff aufbauen, Zwei Stäbe, Leiter, Landezone) stehen in `wissen.js` und laufen
  im Übungsmodus nur als Text (Entscheidung Marcel, 30.09.). Lektion 5 nutzt „Schläger am Rücken“ mit Figuren.
- **Zweite Quellen nachgetragen** (Entscheidung Marcel, 30.09.): Loft (Vessel, Mitchell Golf), Hybrid (Arccos,
  Plugged In Golf), Haltung (Perfect Practice, DRVN, GolfDecode), Landezone (GOLFTEC, Bruce Bolt), kurzes Spiel
  zuerst (golf-mag.de, BookGolfLessons). Die feste Reihenfolge Putt → Chip → Pitch → Eisen → Driver hat nur eine
  Quelle und steht deshalb nicht als Regel in der App.
- Texte der Wissensseite gelten für Rechtshänder (Hinweis auf der Übersicht).

## Stand Schritte 2 + 3 (`wissen-pfade-2-3`, 0.23.0, 30.09.)

- **Zusammengelegt** (Entscheidung Marcel, 30.09.): Schaubilder und Pfade 2 + 3 in einem Branch.
- Umgesetzt: Pfad 2 „Der Vollschwung“ und Pfad 3 „Ballflug verstehen & Fehler beheben“ mit je 7 Lektionen,
  12 neue Schaubilder (Ballposition, Messwerte Tour/Amateur, kinematische Kette, Zeitbalken 3 : 1,
  Eintreffwinkel, Fläche + Bahn, neun Flugkurven, Schlagfläche Spitze/Ferse, Bahn von außen, tiefster Punkt,
  Hosel-Treffer, Kurzübersicht) und Figuren aus den Profi-Posen (Top, Treffmoment, Finish als Standbild).
- **P1–P10 als Animation**: sieben echte Posen (P1, P2, P4, P6, P7, P8, P10 – der Schläger nach den
  Lehrbuch-Positionen aus `uebungsbilder.js`). Die P-Beschriftung steht nur da, solange die Figur in der
  Position anhält (sonst stand kurz „Schaft waagerecht“ unter einem senkrechten Schaft). Die Animation läuft
  nur, solange ihre Karte zu sehen ist; „Bewegung reduzieren“ zeigt nur das Endbild.
- **Ballflug-Helfer** (Entscheidung Marcel, 30.09.: zwei Knopfgruppen): eigene Karte nach dem Quiz der Lektion
  „Die neun Ballflüge“ (Feld `werkzeug` in `wissen.js`). Start (links / zum Ziel / rechts) und Kurve (nach links /
  keine / nach rechts) antippen → Name, Einzelbild, Ursache nach den Ballfluggesetzen, Knopf zur passenden
  Fehler-Lektion. Im Bereich „Nachschlagen“ (Schritt 5) wird er ein zweites Mal verlinkt.
- **Pfad-Level**: „Der Vollschwung“ (Plan 🌱→🌿) zählt als 🌿; einzelne Lektionen darin (Phasen, Stand, Finish)
  sind 🌱. „Ballflug“ ist 🌿, „Slice“ und „Fett/getoppt“ darin 🌱 (wie in `docs/wissen/`).
- **Zweite Quellen nachgetragen** (Entscheidung Marcel, 30.09.): Rhythmus 3 : 1 (Yale-Messung Grober &
  Cholewicki), Finish-Haltung (HackMotion, Bruce Bolt), Tee-Höhe (GOLF.com, Voice Caddie), Schachtel-Übung
  (HackMotion), Linien-Übung (GOLF.com), Zwei-Bälle-Übung (Adam Young), Fußpuder-Spray (Tell Me More Golf,
  Colorado AvidGolfer), Ballposition fest vs. wandernd (USGTF, GolfDecode → „Trainer sind uneins“).
  Korrigiert: Die Schachtel liegt außen **und etwas vom Ziel weg** (eine Bahn von außen trifft sie vor dem Ball).
- **Bewusst weggelassen** (nur eine Quelle oder Messrichtung unklar): Fuß ausdrehen 20–30°, „Lag“ halten,
  Wölbung der Driver-Fläche, GOLFTEC „Shoulder Bend“ im Finish, Handtuch-Übungen.
- Neue Übungen nur als Text: „Treffpunkt sichtbar machen“, „Schachtel außen“, „Linien-Übung“, „Zwei Bälle“.
  Vorhandene mit Figuren: „Schläger vor der Brust“, „Hüfte bis Hüfte“, „Po an die Wand“, „Mitzählen“.

## Stand Schritt 4 (`wissen-pfade-4-6`, 0.24.0, 01.10.)

- Umgesetzt: Pfad 4 „Rund ums Grün“, Pfad 5 „Clever spielen“, Pfad 6 „Besser üben“ mit je 6 Lektionen
  (insgesamt jetzt 40 Lektionen wie geplant), 19 neue Schaubilder und eine bewegte Figur „Probeschwung“ (halb,
  dann voll – echte Profi-Posen; der Wechsel springt zurück ins Ansprechen statt rückwärts zu schwingen).
- **Regel der 12 nur als „Trainer sind uneins“**: Die Fassungen widersprechen sich (12 minus Schlägernummer =
  PW 1 : 2, 8er 1 : 4 gegenüber The Left Rough PW 1 : 1, 8er 1 : 2), Don Trahan hält sie für zu grob. Die Zahlen in
  `docs/wissen/kurzes-spiel.md` waren falsch übernommen und sind korrigiert. Lektion heißt deshalb
  „Chippen: Flug und Rollen“ (ID `gruen-chip` unverändert) und lehrt den belegten Grundsatz „mehr Loft → mehr Flug,
  weniger Rollen“ und den Landepunkt.
- **Atmung „4 – 6“ statt 4-2-6**: belegt durch eine Studie (Magnon u. a. 2021: 4 s ein, 6 s aus); 4-2-6 hatte nur
  eine Blog-Quelle.
- **Zweite Quellen nachgetragen** (Entscheidung Marcel, 01.10.): Uhren-System (Golfwell, Foy), Grünlesen bergab
  und letztes Drittel (Foy, Frankly Golf), Falllinie (Golf Smart Academy), Bogey-Plan und „sicher heraus“ (Hole19,
  Swingminder), Rough/Flyer (Golf Tips Magazine, SportsRec), Kälte und Nässe (Arccos, Blue Tees), Denk-/Spiel-Zone
  (The Golf Swing Company).
- **Bewusst weggelassen**: welcher Fuß beim Grünlesen „schwerer“ ist, 2-m-Kreis bei langen Putts, „Swing easy when
  breezy“, „Doppel-Bogeys vermeiden“, 3–7 von 10 (Adam Young), Sekunden in der Spiel-Zone, ca. 45° beim Drehtest.
- Übungen: „Landezone“ und „Leiter“ nutzen Pfad 1 und Pfad 4 gemeinsam. Neu nur als Text: „Wedge-Längen“,
  „Linie im Sand“, „Füße fühlen“, „Atmung 4 – 6“, „Range-Runde“, „Aufwärmen 10 Minuten“.
- Pfad-Level: „Rund ums Grün“ und „Clever spielen“ 🌿, „Besser üben“ 🌱 (wie im Plan). „Wind, Rough und Nässe“ ist
  🌳 (wie in `platzstrategie.md`).
- **Korrekturen nach dem Golf-App-Check (01.10.)**: „Selbst bestimmte Rückmeldung hilft“ ist laut Meta-Analyse
  2022 nicht belegt → Lektion „Üben mit dieser App“ sagt jetzt „nicht eindeutig“. „Routine hilft am besten“ → „eine
  der wirksamsten Hilfen“. „Ball ans Loch sterben lassen“ widersprach Pelz → „Ball knapp hinter das Loch rollen
  lassen“. Par 3 im Bogey-Plan mit Chip. Neuer Test: bewegte Figuren laufen nur vorwärts.

## Umsetzung in Schritten (je 1 Branch = 1 PR)

| Schritt | Branch | Inhalt |
|---|---|---|
| 1 | `wissen-geruest` | `wissen.js` mit Datenaufbau + Tests, Bereich „📖 Wissen“, Pfad-Übersicht, Lektionsansicht (Karten, Quiz, ✓), Fortschritt, **Pfad 1 komplett** mit vorhandenen Figuren und ersten Schaubildern |
| 2 + 3 | `wissen-pfade-2-3` | ✓ 0.23.0: Schaubilder für Pfad 2 + 3, Vollschwung, Ballflug + **Ballflug-Helfer** (zusammengelegt) |
| 4 | `wissen-pfade-4-6` | ✓ 0.24.0: Rund ums Grün, Clever spielen, Besser üben – mit den Schaubildern dafür |
| 5 | `wissen-nachschlagen` | Glossar, Irrtümer, Regeln, Ausrüstung, Suche, Verknüpfung Karte → Lektion, „Übung starten“ |

Bei jedem Schritt: neue JS-Dateien in `sw.js` und `pwa.js` (`APP_DATEIEN`), `APP_VERSION` erhöhen,
`node --test`, im Browser ansehen, danach `/golf-app-check`, README-Dateiliste.

## Außerdem (kleiner eigener Branch, z. B. mit der Aufräum-Runde, Backlog Nr. 4)

Sichere Umformulierungen in `tipps.js` (Verbot → positiv, gleicher Inhalt):
- `kopfhoehe` tief: „Nicht in die Knie gehen“ → „Größe halten“ (passt zur Übung „Höhe halten“).
- `oberkoerperTreff`: „Rechte Schulter runter, nicht raus“ → „Rechte Schulter geht nach unten“.
Danach `docs/plan-tipps-neu.md` neu erzeugen.
