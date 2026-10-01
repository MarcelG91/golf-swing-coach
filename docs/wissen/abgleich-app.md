# Abgleich: Was bedeutet das gesammelte Wissen für die App?

Stand 30.09.2026. Grundlage: alle Dateien in `docs/wissen/` und die heutigen Texte in `tipps.js`
(Stand 0.17.x). **Nichts davon ist schon umgesetzt** – das sind Vorschläge für spätere Branches.
Änderungen an Tipp-Texten nur in `tipps.js`, mit Quelle, danach `docs/plan-tipps-neu.md` neu erzeugen
(Regel aus CLAUDE.md).

## 1. Was die Recherche bestätigt ✅

| Kennzahl / Tipp in der App | Bestätigt durch | Datei |
|---|---|---|
| `armeAnsprechen` – Arme hängen, eine Faust Platz | Set-up-Grundlagen; Faust-Check auch als Mittel gegen Shanks | `grundlagen.md`, `ballflug-und-fehler.md` |
| `vorneigungAnsprechen` – aus der Hüfte kippen | „hinge from the hips, not your back“ | `grundlagen.md` |
| `seitneigungAnsprechen` – rechte Schulter etwas tiefer, beim Driver mehr | Set-up nach Schläger | `grundlagen.md`, `vollschwung.md` |
| `schulterdrehung` – volle Drehung | GOLFTEC: Tour ca. 90°, Amateure 10–30° weniger | `vollschwung.md` |
| `oberkoerperTop` – Oberkörper nicht zum Ziel kippen | GOLFTEC: Schulterneigung am Top Tour 36° vs. 29° | `vollschwung.md` |
| `hueftSway` – drehen statt schieben | GOLFTEC-Faktor „hip sway at top“; TPI | `vollschwung.md`, `mental-und-fitness.md` |
| `hueftBall`, `vorneigungHalten` – Early Extension | GOLFTEC: messbar bei vielen Slicern; Ursache für Shanks; TPI | `ballflug-und-fehler.md` |
| `tempo` – 3 : 1 | Tour Tempo (Novosel) | `vollschwung.md` |
| `kopfhoehe`, `kopfSeitlich` mit Spielraum | Ralph Mann: Kopf wandert ca. 5 cm nach hinten; „Kopf unten“ ist ein Irrtum | `irrtuemer.md` |
| `gewicht` – Finish vorn | Druck am Top 70–80 % rechts, im Treffmoment links | `vollschwung.md` |
| Eine Baustelle pro Karte, ein Schwunggedanke | Motorisches Lernen: ein Fokus zur Zeit | `richtig-ueben.md` |

## 2. Vorschläge zur Verbesserung der Texte 🟡

### 2a. Schwunggedanken mit äußerem Fokus und Bildern (höchster Nutzen)

Belege: Äußerer Fokus hilft Anfängern **und** Könnern (Wulf & Su 2007, Übersicht über 52 Golf-Studien).
Bildhafte Vergleiche (Analogien) halten unter Druck besser als technische Anweisungen (Liao & Masters
2001; Golf-Putt-Studie „Analogy vs. technical learning“). **Verneinungen** („nicht …“) führen unter
Druck eher zum verbotenen Fehler (Wegner et al. 1998: „nicht überschießen“ → mehr zu lange Putts).

Regel für neue Gedanken: **positiv**, **außen** (Schläger, Ball, Ziel, Gegenstand) oder **ein Bild**.
Beim **Ansprechen** (stillstehende Haltung) sind Körperhinweise in Ordnung.

| Kennzahl | Heute | Art | Vorschlag (zum Prüfen mit Golflehrer) |
|---|---|---|---|
| `armeAnsprechen` vorn | Arme hängen lassen | innen, Haltung | bleibt (Ansprechen) |
| `armeAnsprechen` nah | Eine Faust Platz | Bild | bleibt |
| `vorneigungAnsprechen` | Aus der Hüfte kippen · Gewicht auf die Fußmitte | innen, Haltung | bleibt |
| `fuehrungsarmTreff` | Lange Arme durch den Ball | innen | „Weiter Bogen mit dem Schlägerkopf“ |
| `schulterdrehung` | Rücken zum Ziel | außen (Ziel) | bleibt ✓ |
| `armschwungTop` | Drehen statt heben | innen | „Griffende bleibt vor der Brust“ |
| `seitneigungAnsprechen` | Rechte Schulter etwas tiefer | innen, Haltung | bleibt |
| `oberkoerperTop` | Brustbein bleibt hinter dem Ball | gemischt (Ball) | bleibt ✓ |
| `oberkoerperTreff` | Rechte Schulter runter, nicht raus | innen + Verneinung | „Schlägerkopf kommt von innen“ (fachlich prüfen) |
| `hueftSway` | Drehen statt schieben | innen | „Hüfte dreht wie auf einem Drehteller“ (Bild steht schon im Gefühl-Text) |
| `tempo` schnell | Drei zurück, eins runter | Rhythmus | bleibt ✓ |
| `tempo` langsam | Schwingen wie ein Pendel | Bild | bleibt ✓ |
| `kopfhoehe` hoch | Rechtes Knie bleibt gebeugt | innen | „Unter der Decke bleiben“ (Bild) – prüfen |
| `kopfhoehe` tief | **Nicht** in die Knie gehen | Verneinung | „Größe halten“ oder „Höhe halten wie ein Aufzug, der stehen bleibt“ |
| `kopfSeitlich` vorBall | Kopf hinter dem Ball | außen (Ball) | bleibt ✓ |
| `kopfSeitlich` schieben | Drehen wie im Fass | Bild | bleibt ✓ |
| `gewicht` | Finish halten | Ergebnis | bleibt ✓ |
| `vorneigungHalten` | Po bleibt hinten | innen | „Po an die Wand“ (Gegenstand, passt zur Übung) |
| `hueftBall` | Po zur Tasche | außen (Gegenstand) | bleibt ✓ |

Hinweis: Die Grenzen aus `tests/tipps.test.mjs` (Gedanke ≤ 5 Wörter) gelten weiter.

### 2b. Alte Langtexte in `technik.js` (Backlog Nr. 4)

**Erledigt mit 0.26.1:** Die alte Stab-Übung ist mit den Langtexten entfernt (`tipps.js` war schon richtig); der Selbst-Check „Ellbogen“ ist entschärft.

- Stab-Übung bei `hueftSway` in `technik.js` sagt noch „Stab **neben die rechte Hüfte**“; richtig
  (Recherche 28.09., HackMotion) ist „direkt außen neben dem **rechten Fuß**“ – `tipps.js` ist schon
  richtig. Beim Aufräumen entfernen oder angleichen.
- Selbst-Check „fliegender Ellbogen“: Adam Young und TPI zeigen, dass auch Top-Spieler einen
  abstehenden rechten Ellbogen haben; bei Amateuren hängt er oft an der Schulterbeweglichkeit
  (TPI-Test 90/90). Vorschlag: Text entschärfen („kann zu steilem Abschwung führen“, „Beweglichkeit
  prüfen“) statt als Fehler darstellen.

### 2c. Hinweis „kann an der Beweglichkeit liegen“

Bei `hueftBall`, `hueftSway`, `schulterdrehung` einen Zusatz auf der Karte oder im Wissensartikel:
„Tritt der Fehler trotz Übung auf, kann es an der Beweglichkeit liegen → Selbsttest“ (TPI; Zusammenhang
Zehenberührungs-Test ↔ Early Extension belegt). Siehe `mental-und-fitness.md` Abschnitt 3.

### 2d. Positions-Kennzahlen richtig einordnen

Adam Young: Top-Spieler unterscheiden sich in Positionen stark; entscheidend ist der Treffmoment
(Schlagfläche, Bahn, Treffpunkt, tiefster Punkt). Die App kann den Treffmoment nicht messen (kein
Ballflug). → Auf der Wissensseite und evtl. im Ergebnis einmal erklären: „Die App zeigt Auffälligkeiten
in der Bewegung. Was zählt, ist der Ballflug – schau immer auch, wohin der Ball fliegt.“

## 3. Neue Ideen für die App 💡 (in den Backlog einsortieren)

| Idee | Nutzen | Machbarkeit | Wissen |
|---|---|---|---|
| **Wissensseite** (Plan: `docs/plan-wissensseite.md`) | Hoch | Mittel (neuer Bereich, `wissen.js`) | alle Dateien |
| **Ballflug-Helfer**: Nutzer wählt „Ball startet links/gerade/rechts“ + „kurvt links/gar nicht/rechts“ → App erklärt Ursache (Fläche/Bahn/Treffpunkt) und Übung | Hoch, ohne Messung möglich | Leicht (reine Logik, testbar) | `ballflug-und-fehler.md` |
| **Standbreite messen** (frontal, Ansprechen): Abstand Knöchel ÷ Schulterbreite; Driver breiter | Mittel | Leicht (Posedaten vorhanden) | `grundlagen.md` |
| **„Meine Längen“**: Carry pro Schläger lokal speichern, Durchschnitt statt Bestwert | Mittel | Leicht (localStorage/IndexedDB, nichts verlässt das Gerät) | `platzstrategie.md` |
| **Übungsplan-Vorlage** für die Range (Technik → variabel → Range-Runde) | Mittel | Leicht (Text) | `richtig-ueben.md` |
| **Rückmeldung selbst steuern**: vor dem Ergebnis „Was glaubst du, war los?“ fragen | Mittel (Lernforschung) | Leicht | `richtig-ueben.md` |
| **Coach-Systemtext** um Grundsätze ergänzen (Ballfluggesetze, äußerer Fokus, eine Baustelle, keine Verneinungen) | Mittel | Leicht (`coach.js`, Test beachten) | `richtig-ueben.md`, `ballflug-und-fehler.md` |
| **Hüftöffnung im Treffmoment** (Tour 36°, hohe Hcp 20°) | Hoch fachlich | Schwer in 2D (Drehung um Hochachse) – nur als Schätzung wie `schaetzeDrehung` | `vollschwung.md` |
| **Putt-Pendel** (Video von vorn: Schultern statt Handgelenke, Verhältnis 60 : 40) | Mittel | Mittel (eigene Analyse) | `putten.md` |

## 4. Zuordnung Kennzahl → Wissensartikel (für „📖 Mehr dazu“)

| Kennzahl | Artikel |
|---|---|
| `armeAnsprechen`, `vorneigungAnsprechen`, `seitneigungAnsprechen` | Kapitel 2 „Haltung“ |
| `schulterdrehung`, `armschwungTop`, `oberkoerperTop`, `hueftSway` | Kapitel 3 „Rückschwung & Top“ |
| `fuehrungsarmTreff`, `oberkoerperTreff`, `vorneigungHalten`, `hueftBall` | Kapitel 3 „Treffmoment“ |
| `tempo` | Kapitel 3 „Tempo & Rhythmus“ |
| `kopfhoehe`, `kopfSeitlich` | Kapitel 12 „Irrtümer: Kopf unten“ + Kapitel 3 |
| `gewicht` | Kapitel 3 „Finish“ |
| `hueftBall`, `hueftSway`, `schulterdrehung` (zusätzlich) | Kapitel 8 „Beweglichkeit“ |

## 5. Offene fachliche Fragen

Eine Golflehrer-Durchsicht **entfällt** (Entscheidung 30.09.). Diese Fragen bleiben deshalb offen; betroffene
Inhalte kommen nach den strengen Regeln aus `docs/plan-wissensseite.md` **nicht** oder nur als „Trainer sind
uneins“ in die App. Von den Schwunggedanken in 2a werden nur die sicheren Umformulierungen (Verbot → positiv)
umgesetzt.


1. Sind die vorgeschlagenen Schwunggedanken (2a) fachlich richtig und verständlich?
2. `oberkoerperTreff`: Welcher äußere Gedanke passt zu „Schulter runter, nicht raus“?
3. Driver-Ansprechen: Gewichtsverteilung – gibt es eine belastbare Zahl?
4. GOLFTEC „Shoulder Bend“ im Finish (32° vs. 3°): welche Richtung ist gemeint?
5. Sollen Einsteiger den Ball bei allen Eisen an derselben Stelle haben (Hogan) oder wandernd?

## Quellen (zusätzlich zu den Kapiteldateien)

- Wegner, Ansfield & Pilloff (1998): The putt and the pendulum – ironic effects of the mental control of action. Psychological Science 9(3) – https://scholar.harvard.edu/dwegner/publications/putt-and-pendulum-ironic-effects-mental-control-action
- Liao & Masters (2001): Analogy learning – a means to implicit motor learning. J. Sports Sciences – https://www.tandfonline.com/doi/pdf/10.1080/02640410152006081
- Analogy vs. technical learning in a golf putting task (Leistung unter Druck) – https://www.researchgate.net/publication/272261002_Analogy_vs_Technical_Learning_in_a_Golf_Putting_Task_An_Analysis_of_Performance_Outcomes_and_Attentional_Processes_Under_Pressure
- Adam Young: Top myths in golf – https://www.adamyounggolf.com/top-myths-in-golf/
- TPI: Early Extension / Sway / Toe Touch Test – siehe `mental-und-fitness.md`
