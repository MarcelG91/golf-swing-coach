# Plan: Etappe 11 – Tipps passend zum Level + Coach mit Claude

Stand: 27.09.2026 · Status: **Planung abgeschlossen** (noch kein Code)

## Ziel

1. **Tipps passend zum Können.** Einsteiger bekommen **wenige, aber die wichtigsten** Tipps –
   zuerst die Grundlagen. Feinheiten wie die Kopfhaltung kommen erst später dazu.
2. **Die App kennt dein Level.** Du wählst es selbst. Die App schaut zusätzlich auf deine
   gespeicherten Schwünge und schlägt vor, wann du aufsteigen kannst.
3. **Coach-Feedback von Claude.** Auf Wunsch schreibt Claude aus deinen Kennzahlen eine kurze,
   persönliche Rückmeldung in deinem Level: was gut war, **eine** Sache für das nächste Training,
   eine passende Übung.

## Entscheidungen (27.09.2026)

| Frage | Entscheidung | Folge |
|---|---|---|
| Wie wird das Level bestimmt? | **Selbst wählen + Vorschlag der App** | Zuverlässig ab dem ersten Schwung. Die App sieht nur Körperhaltung (kein Ballflug, kein Handicap) – deshalb schlägt sie nur vor, du entscheidest. |
| Wie viele Stufen? | **3:** 🌱 Einsteiger · 🌿 Fortgeschritten · 🌳 Könner | Überschaubar, klare Schritte |
| Level und Claude zusammen? | **Ja, beides in Etappe 11** | Umsetzung in zwei Teilen: **11a** Level (nur auf dem Handy), **11b** Coach mit Claude |
| Wie spricht die App mit Claude? | **Eigener API-Schlüssel**, nur auf dem jeweiligen Handy gespeichert | Kein Server nötig. Nur wer einen Schlüssel einträgt, sieht den Coach-Knopf. |
| Neue Reihenfolge der Etappen | **11 → 10 → 9** (Sicherung ganz ans Ende) | Die Nummern bleiben gleich, damit alle Verweise (z. B. „V2 vor Etappe 11“) stimmen |

**Bewusste Ausnahmen, die mit 11b einhergehen:**
- Deine allgemeine Regel „keine Cloud-Dienste“: Der Coach nutzt die Claude-Schnittstelle von
  Anthropic im Internet. Das ist freiwillig, abschaltbar und betrifft nur den Coach – alles andere
  bleibt auf dem Handy.
- Sicherheitsbefund **V2** empfahl einen Vermittler-Server statt eines Schlüssels im Browser.
  Entschieden ist der eigene Schlüssel mit Ausgabenlimit (Begründung und Schutzmaßnahmen unten).

**Warum zwei Teile (11a, 11b)?** Teil A löst das Einsteiger-Problem sofort, offline und ohne
Kosten. Teil B baut darauf auf (der Coach schreibt im gewählten Level). Zwei kleinere Pull
Requests sind leichter zu prüfen – und nach der Regel „1 Chat = 1 Branch“ je ein eigener Chat.

---

## Teil A (11a): Level und angepasste Tipps

### Die drei Stufen

Beim ersten Start (und jederzeit unter ⚙️ Einstellungen) wählst du:

| Level | Beschreibung zur Auswahl |
|---|---|
| 🌱 **Einsteiger** | „Ich lerne gerade Golf (Platzreife oder erste Runden).“ |
| 🌿 **Fortgeschritten** | „Ich spiele regelmäßig und treffe den Ball meistens ordentlich.“ |
| 🌳 **Könner** | „Ich spiele gut und will an Feinheiten arbeiten.“ |

### Welche Kennzahl ab welchem Level

Die App misst heute 15 Kennzahlen. **Gemessen und gespeichert wird immer alles** – das Level
bestimmt nur, was angezeigt und als Baustelle vorgeschlagen wird. Steigst du auf, sind die
Werte deiner alten Schwünge also schon da.

| Level | Kennzahl | Ansicht | Warum auf diesem Level |
|---|---|---|---|
| 🌱 | Vorneigung beim Ansprechen | hinten | Die Ausgangshaltung entscheidet über fast alles danach |
| 🌱 | Arme beim Ansprechen | hinten | Abstand zum Ball – „nach dem Ball greifen“ ist ein Anfängerklassiker |
| 🌱 | Tempo | beide | Ruhiger Rhythmus statt Schlagen aus dem Top |
| 🌱 | Armschwung am Top | vorne | „Drehen statt Arme heben“ – die wichtigste Bewegungsidee |
| 🌱 | Gewichtsverlagerung | vorne | Im Finish auf dem vorderen Fuß stehen = Gleichgewicht |
| 🌿 | Seitneigung beim Ansprechen | vorne | Feinheit der Ansprechhaltung |
| 🌿 | Schulterdrehung am Top | vorne | Mehr Drehung, sobald „drehen statt heben“ sitzt |
| 🌿 | Hüfte im Rückschwung (Sway) | vorne | Drehen ohne seitliches Schieben |
| 🌿 | Führungsarm im Treffmoment | vorne | Gestreckter Arm für sauberen Treffpunkt |
| 🌿 | Vorneigung halten | hinten | Nicht aufrichten – wichtig für gleichmäßige Treffer |
| 🌳 | Kopfhöhe | beide | Kopfbewegung ist meist eine **Folge** anderer Fehler (Aufrichten, Sway). Für Einsteiger führt „Kopf unten!“ eher zu Verkrampfung. |
| 🌳 | Kopf seitlich | vorne | wie Kopfhöhe |
| 🌳 | Hüfte Richtung Ball (Early Extension) | hinten | Feinheit im Abschwung |
| 🌳 | Oberkörper am Top | vorne | Feinheit („umgekehrter Wirbelsäulenwinkel“) |
| 🌳 | Oberkörper im Treffmoment | vorne | Feinheit („hinter dem Ball bleiben“) |

Jedes Level schließt die Kennzahlen der Level darunter ein (🌿 = 10 Kennzahlen, 🌳 = alle 15).
Für Einsteiger gibt es in jeder Ansicht 3 Kennzahlen – egal, ob du von vorne oder von hinten filmst.

### Was sich pro Level ändert

| | 🌱 Einsteiger | 🌿 Fortgeschritten | 🌳 Könner |
|---|---|---|---|
| Baustellen oben | **1** – die wichtigste | 2 | 3 (wie heute) |
| Baustellen-Karte | „So geht's“ + Übung zuerst, Erklärung zum Aufklappen, **ohne Messwert** | wie heute, mit Messwert | wie heute + Zielbereich |
| „Das machst du schon gut“ | 1–2 grüne Kennzahlen als Lob | 1–2 | – |
| Alle Kennzahlen | nur die 5 des Levels, zugeklappt | die 10 des Levels | alle 15 |
| Kennzahlen höherer Level | zugeklappt unter „Für später“ | ebenso | – |
| Rot/Gelb im Video an den Phasen | nur Level-Kennzahlen | nur Level-Kennzahlen | alle |
| „Selbst prüfen“-Karten | ausgeblendet | sichtbar | sichtbar |
| Gesamtauswertung (mehrere Schwünge) | 1 Baustelle | 2 | 3 |
| Coach-Text (Teil B) | kurz, einfache Worte, keine Fachbegriffe | mittel, Fachbegriffe erklärt | ausführlicher, mit Messwerten |

Die Texte (Erklärung, „So geht's“, Übung) bleiben dieselben wie heute – Einsteiger sehen nur
weniger davon und in anderer Reihenfolge. Eigene Einsteiger-Texte wären viel Schreibarbeit und
kommen nur, wenn sich im Alltag zeigt, dass sie nötig sind.

### Level-Vorschlag der App

Grundlage sind die **letzten 10 sicheren gespeicherten Schwünge** (Etappe 8). Ohne gespeicherte
Schwünge gibt es keinen Vorschlag.

- **Aufsteigen** (nicht bei 🌳): Mindestens 10 Schwünge, die Kennzahlen deines Levels waren im
  Schnitt in **7 von 10** Fällen grün und keine einzelne unter 6 von 10. Kennzahlen mit weniger
  als 3 Messungen zählen nicht (z. B. wenn du nur von vorne filmst – dann sagt der Vorschlag das dazu).
  → „Deine Grundlagen sitzen in 8 von 10 Schwüngen. Bereit für 🌿 Fortgeschritten?“
- **Zurückgehen** (nicht bei 🌱): Die Kennzahlen des Levels **darunter** sind nur noch in weniger
  als 4 von 10 Fällen grün. → „Die Grundlagen wackeln gerade – eine Zeit lang zurück zu 🌱?“
- **„Noch nicht“** → die App fragt frühestens nach 10 weiteren Schwüngen wieder.
- Die App stellt **nie selbst um**, sie fragt immer.
- Der Vorschlag erscheint nach dem Speichern einer Sitzung und oben in „Meine Schwünge“.

### Wo das Level gespeichert wird

- Die aktuelle Wahl in `localStorage` (Schlüssel `level`) – eine kleine Einstellung, dafür
  reicht der einfache Browserspeicher. Die App nutzt ihn schon für den Installationshinweis.
- Zusätzlich bekommt jede gespeicherte Sitzung das Feld `level`. So weiß der Fortschritt
  (Etappe 10) später, in welchem Level ein Schwung bewertet wurde. Dafür muss die Datenbank
  nicht umgebaut werden (neues Feld in einem bestehenden Eintrag).

### Dateien (11a)

| Datei | Änderung |
|---|---|
| `level.js` | **neu, reine Rechenlogik:** `LEVEL` (die drei Stufen), `AB_LEVEL` (Kennzahl → Level), `fuerLevel(kennzahlen, level)` (sichtbar / für später), `anzahlBaustellen(level)`, `levelVorschlag(schwuenge, level)` |
| `tests/level.test.mjs` | **neu:** Zuordnung vollständig (alle 15 Kennzahlen haben ein Level), Einsteiger hat in jeder Ansicht ≥ 3 Kennzahlen, Vorschlag bei 7/10 grün ja, bei 6/10 nein, zu wenige Daten → kein Vorschlag, Zurückgehen |
| `technik.js` | `wichtigsteBaustellen()` bleibt, bekommt die gefilterten Kennzahlen und die Anzahl je Level |
| `gesamtauswertung.js` | Anzahl der Baustellen als Parameter (statt fest 3) |
| `app.js` | Level-Auswahl beim ersten Start, Filter in `zeigeBewertung()`, `zeigeUebersicht()` und bei den roten/gelben Linien, „Das machst du schon gut“, „Für später“, Vorschlags-Hinweis, `level` beim Speichern |
| `index.html`, `style.css` | ⚙️ Einstellungen als dritter Umschalter oben, Level-Auswahl, Level-Anzeige |
| `sw.js`, `pwa.js` | `level.js` eintragen, Version erhöhen |
| README, CLAUDE.md | Dateiliste, Abschnitt „Level“ |

### Prüfen (11a)

1. `node --test` (neu: `tests/level.test.mjs`)
2. Am Mac im Browser alle drei Level mit denselben Testvideos durchklicken: Einsteiger sieht
   1 Baustelle aus seinen 5 Kennzahlen, keine Kopf-Kennzahlen, keine Selbst-prüfen-Karten.
3. Vorschlag: mit gespeicherten Testsitzungen (Profi-Video mehrfach speichern → Aufstieg vorgeschlagen)
4. iPhone: Level wählen, App schließen, neu öffnen → Level ist noch da

---

## Teil B (11b): Coach-Feedback mit Claude

### Was der Coach macht

Nach einer Analyse (oder beim Öffnen einer gespeicherten Sitzung) gibt es den Knopf
**„🧑‍🏫 Coach-Feedback“**. Claude bekommt deine Kennzahlen und schreibt zurück – im Level-Ton:

> **Gut:** Dein Rhythmus ist schön ruhig – genau so bleibt der Schwung kontrolliert.
> **Dein Fokus fürs nächste Training:** Im Finish auf dem vorderen Fuß ankommen.
> **So fühlt es sich an:** Nach dem Schlag steht dein Gürtel Richtung Ziel, der hintere Fuß nur noch auf der Spitze.
> **Übung:** 10 Bälle mit halbem Schwung, im Finish 3 Sekunden stehen bleiben …
> **Nächstes Mal:** Film auch einmal von hinten – dann prüft die App deine Ansprechhaltung.

Bei gespeicherten Sitzungen bekommt Claude zusätzlich eine kurze Zusammenfassung deiner letzten
Sitzungen (je Kennzahl: wie oft grün) und kann so sagen, was sich verbessert hat.

Die Antwort wird **mit der Sitzung gespeichert** (`sitzung.coach`) – später offline nachlesbar,
ohne erneut zu bezahlen.

### Was gesendet wird – und was nie

| Wird gesendet | Wird **nie** gesendet |
|---|---|
| Level, Ansicht (vorne/hinten), Schlägergruppe | Videos, Einzelbilder, Vorschaubilder |
| Kennzahlen **deines Levels**: Name, Wert, Bewertung | Posedaten (Körperpunkte) |
| Tempo, Zahl der Schwünge in der Sitzung | Notiz, Videoname, Datum, Gerätedaten |
| Kurzer Verlauf: je Kennzahl „x von 10 grün“ | Dein Name oder andere persönliche Angaben |

**Einwilligung:** Vor dem ersten Senden zeigt die App genau diese Liste und fragt
„Einverstanden?“. Unter dem Coach-Knopf steht immer „Sendet deine Kennzahlen an Anthropic“.
Mit „Was wird gesendet?“ lässt sich die konkrete Anfrage vorher ansehen.
Anthropics aktuelle Datenschutzbedingungen für die Schnittstelle lesen wir beim Bau nach und
verlinken sie im Einwilligungstext.

### Der API-Schlüssel

Ein API-Schlüssel ist wie ein Passwort, mit dem Anthropic erkennt, wer bezahlt.

- **Du trägst deinen eigenen Schlüssel** unter ⚙️ Einstellungen ein. Er wird nur auf diesem
  Handy gespeichert (`localStorage`), steht nie im Code, nie auf GitHub und **nie in einer
  Sicherung** (Etappe 9 muss ihn ausdrücklich weglassen). Knopf „Schlüssel löschen“.
- **Ohne Schlüssel** gibt es keinen Coach-Knopf – Freunde nutzen die App ganz normal ohne Claude.
- **Einrichtung (einmalig, ca. 10 Minuten):**
  1. Auf console.anthropic.com anmelden, Guthaben aufladen (z. B. 5 €)
  2. Einen eigenen **Workspace** „Golf Coach“ anlegen und dort ein **Ausgabenlimit pro Monat** setzen
  3. In diesem Workspace einen API-Schlüssel erstellen und in der App eintragen
- **Warum Ausgabenlimit?** Der Schlüssel liegt im Browser. Code, der auf derselben Seite läuft
  (z. B. die von jsDelivr geladene Pose-Erkennung, Befund C1), könnte ihn theoretisch lesen.
  Mit eigenem Workspace und Limit ist der mögliche Schaden auf wenige Euro begrenzt, und der
  Schlüssel lässt sich in der Console jederzeit sperren. Ein Vermittler-Server wäre sicherer,
  bräuchte aber einen dauerhaft laufenden Server im Internet (verworfen, siehe oben).

### Technik

| Baustein | Wofür | Warum dieser |
|---|---|---|
| **Offizielles Anthropic-SDK** (`@anthropic-ai/sdk`, feste Version, von jsDelivr) | Anfrage an Claude | Offizieller Weg, kein Nachbauen. Wird **erst beim Tippen** auf den Coach-Knopf geladen (`import()` mitten im Code) – so startet die App weiterhin offline, auch wenn das SDK nicht gespeichert ist. Das SDK verlangt, dass die Nutzung im Browser ausdrücklich erlaubt wird (weil der Schlüssel dann im Browser liegt); genau das ist hier gewollt. |
| **Modell Claude Opus 5** (`claude-opus-5`) | Coach-Text schreiben | Anthropics aktuelles Standardmodell. Günstiger wären Claude Sonnet 5 oder Claude Haiku 4.5 – das ist deine Entscheidung; der Modellname steht an einer Stelle und lässt sich leicht tauschen. |
| **Strukturierte Antwort** (JSON-Schema) | Claude antwortet in festen Feldern: `lob`, `fokusKennzahl`, `fokusTitel`, `warum`, `gefuehl`, `uebung`, `naechstesMal` | Die App zeigt die Antwort in denselben Karten wie ihre eigenen Tipps. Sie prüft, dass `fokusKennzahl` wirklich eine gemessene Kennzahl deines Levels ist – sonst nimmt sie ihre eigene wichtigste Baustelle. So kann Claude keine Fehler „erfinden“, die gar nicht gemessen wurden. |
| **Fester Systemtext** | Coach-Rolle, Regeln pro Level, Erklärung jeder Kennzahl mit Zielbereich, die Übungen der App | Claude empfiehlt dieselben Übungen wie die App. Der feste Teil wird zwischengespeichert (**Prompt Caching**) → günstiger und schneller. Darum steht im Systemtext nichts, was sich ändert (kein Datum). |
| **Adaptive Thinking, Effort „medium“** | Claude denkt kurz nach, bevor es antwortet | Genug für einen durchdachten Tipp, ohne lange Wartezeit. Anpassbar. |
| **Rückfall bei Ablehnung** (`fallbacks`) | Lehnt das Modell eine Anfrage ab (bei Golftipps sehr unwahrscheinlich), springt automatisch ein anderes Modell ein | Von Anthropic empfohlene Standard-Absicherung |

**Kosten (grobe Schätzung):** ca. 2.500 Wörter-Bausteine („Tokens“) hinein, davon der größte Teil
zwischengespeichert, und ca. 500–1.000 hinaus → etwa **2–5 Cent pro Coach-Feedback**.
Bei 20 Feedbacks im Monat also rund 1 €. Die echten Kosten messen wir beim Bau.

**Ohne Internet:** Coach-Knopf ausgegraut mit „Coach braucht Internet“. Gespeicherte
Coach-Antworten bleiben lesbar.

**Fehler verständlich melden:** Schlüssel ungültig · Ausgabenlimit erreicht · zu viele Anfragen,
kurz warten · keine Verbindung. Der Knopf wird in jedem Fall wieder freigegeben.

### Dateien (11b)

| Datei | Änderung |
|---|---|
| `coach.js` | **neu.** Oben reine Rechenlogik (testbar): `baueCoachAnfrage()` (was gesendet wird), `verlaufKurz()` (x von 10 grün), `pruefeCoachAntwort()`. Unten der Browser-Teil: SDK laden, Anfrage senden. (Aufbau wie `speicher.js`.) |
| `tests/coach.test.mjs` | **neu:** Die Anfrage enthält **keine** Posedaten, Videonamen, Notizen oder Bilder; nur Kennzahlen des Levels; Systemtext ist bei jeder Anfrage gleich (sonst kein Caching); ungültige Antwort → Rückfall auf die App-eigene Baustelle |
| `app.js`, `index.html`, `style.css` | Coach-Knopf, Einwilligung, „Was wird gesendet?“, Schlüssel in ⚙️ Einstellungen, Anzeige der Antwort, Speichern bei der Sitzung |
| `sw.js`, `pwa.js` | `coach.js` eintragen (das SDK selbst nicht – der Coach braucht ohnehin Internet), Version erhöhen |
| README | Versprechen „Videos verlassen das Gerät nicht“ ergänzen: „Nur der freiwillige Coach sendet Kennzahlen an Anthropic“ |
| CLAUDE.md, `docs/sicherheit/bericht.md` | Regel zu `api.anthropic.com` fest eintragen, V2 auf „erledigt“ mit Datum |

### Prüfen (11b)

1. `node --test` (neu: `tests/coach.test.mjs`) – ohne echte Anfrage, kostet nichts
2. **Echte Anfrage nur mit deinem Einverständnis** (kostet Cent-Beträge): du trägst deinen
   Schlüssel am Mac ein, wir testen alle drei Level und schauen, ob Ton und Länge passen
3. Falscher Schlüssel, Flugmodus, Ausgabenlimit → verständliche Meldung, Knopf wieder frei
4. `/golf-app-check` danach (neue Internetadresse!)

---

## Zusammenspiel mit den anderen Etappen

- **Speicher aufräumen (0.11.0, schon umgesetzt):** „Alles löschen“ leert nur die Schwung-Datenbank.
  Coach-Antworten (`sitzung.coach`) verschwinden damit automatisch; der API-Schlüssel liegt im
  `localStorage` und bleibt – `tests/sicherheit.test.mjs` verbietet `localStorage.clear()`. Beim Bau
  von 11b die Rückfrage-Texte in `app.js` um „Coach-Antworten“ (weg) und „Coach-Schlüssel“ (bleibt)
  ergänzen.

- **Etappe 10 (Fortschritt)** nutzt das Level: Der Trainingsfokus kommt nur aus den Kennzahlen
  deines Levels. `verlaufKurz()` aus 11b wird dort durch `fortschritt.js` ersetzt.
- **Etappe 9 (Sicherung)** steht jetzt am Ende. Bis dahin gilt: Home-Bildschirm-App und
  „Daten geschützt ✓“ sind der einzige Schutz vor Datenverlust. Die Sicherung muss später
  Level und Coach-Antworten mitnehmen, **den API-Schlüssel aber nie**.

## Umsetzung

| Teil | Branch | Inhalt | Chat |
|---|---|---|---|
| 11a | `etappe-11a-level` | Level, angepasste Tipps, Vorschlag | eigener Chat |
| 11b | `etappe-11b-coach-claude` | Coach mit Claude, Schlüssel, Einwilligung | eigener Chat, nach 11a |

## Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Level-Vorschlag liegt daneben (Kameraposition, nur eine Ansicht gefilmt) | Nur Vorschlag, nie automatisch; erst ab 10 Schwüngen; Hinweis, wenn eine Ansicht fehlt |
| Einsteiger übersieht einen wichtigen Fehler, weil er „erst später“ kommt | Alles wird gemessen; „Für später“ bleibt aufklappbar; Aufstieg bringt die Kennzahlen zurück |
| API-Schlüssel wird ausgelesen | Eigener Workspace mit Ausgabenlimit, Schlüssel jederzeit sperrbar, nie in Sicherung/Repo |
| Claude gibt einen unpassenden oder falschen Tipp | Feste Antwortfelder, Fokus nur aus gemessenen Kennzahlen, Übungen aus der App im Systemtext, Hinweis „ersetzt keine Trainerstunde“ |
| Kosten laufen weg | Ausgabenlimit im Workspace; Antwort wird gespeichert statt neu angefragt |
| Anthropic ändert Modelle oder Preise | Modellname an einer Stelle; Kosten beim Bau neu messen |

## Später möglich

- Rückfragen an den Coach („Wie übe ich das ohne Range?“) als kleiner Chat
- Eigene, kürzere Einsteiger-Texte für die 5 Grundlagen-Kennzahlen
- Vermittler-Server statt eigenem Schlüssel, falls Freunde den Coach ohne eigenen Schlüssel nutzen sollen

---

## Umsetzung 11b (28.09.2026, Version 0.15.0) – Abweichungen vom Plan

| Punkt | Plan (27.09.) | Umgesetzt (28.09.) | Grund |
|---|---|---|---|
| Modell | Claude Opus 5 | **Claude Opus 5** (`claude-opus-5`), bestätigt | Marcels Wahl; steht an einer Stelle in `coach.js` |
| Übung | Claude schreibt Gefühl und Übung | **Übung, Schritte und Schwunggedanke kommen aus `tipps.js`** – Claude wählt nur den Fokus und schreibt Lob, Begründung, „nächstes Mal“ | Seit „Tipps neu“ sind die Übungen fachlich geprüft; Claude soll keine Technik erfinden |
| Antwortfelder | `lob`, `fokusKennzahl`, `fokusTitel`, `warum`, `gefuehl`, `uebung`, `naechstesMal` | `lob`, `fokusKennzahl`, `fokusBotschaft`, `naechstesMal` | Rest kommt aus der App |
| Prompt Caching | ja | **nein** | Cache hält 5 Minuten; bei ca. einem Feedback pro Sitzung würde fast nur das teurere Schreiben bezahlt |
| SDK | offizielles SDK von jsDelivr | **`@anthropic-ai/sdk@0.129.0`** (`+esm`), erst beim Tippen geladen, nicht in der Vorab-Liste des Service Workers; nach dem ersten Laden liegt es (samt drei kleinen Hilfsdateien von jsDelivr) im Offline-Speicher, wie alle jsDelivr-Dateien (Check 28.09.) | wie geplant |
| SDK (seit 0.26.0) | – | **Kein SDK mehr:** eigenes `fetch` mit Datenstrom an `api.anthropic.com`, Kopfzeilen und Datenstrom-Lesen in `coach.js` (Sicherheits-Etappe C1, Branch `sicherheit-c1-c3`) | Kein nachgeladener Fremdcode sieht mehr den Schlüssel; gesendete Daten unverändert (Test) |
| Rückfall bei Ablehnung | `fallbacks` | `fallbacks: "default"` mit Beta `server-side-fallback-2026-07-01` | Anthropics Empfehlung |
| Denken | adaptiv, Effort „medium“ | wie geplant | |
| Speicherung | `sitzung.coach` | **`schwung.coach`** (pro Schwung), bei gespeicherten Sitzungen sofort nachgetragen (`aktualisiereSchwung`) | Der Coach bewertet den gerade gezeigten Schwung |
| Freunde | offen | **nur eigener Schlüssel** | Marcels Wahl |

Geprüft ohne Kosten: `tests/coach.test.mjs` und ein Browsertest, der die Anfrage an `api.anthropic.com`
abfängt und mit einer Test-Antwort beantwortet (Einwilligung, Senden, Antwort, ungültiger Schlüssel,
Schlüssel löschen). Offen: echter Test mit Marcels Schlüssel.

---

## Überarbeitung 29.09.2026 (Version 0.17.0): ausführliches Coaching

**Anlass:** Marcels erster echter Test: Die Antworten waren „zu einfach und wertlos“. Er will deutlich mehr
Inhalt, Tiefe, Wissen, Praxis und Anleitung.

**Warum die Antworten dünn waren:** 4 Felder mit je 1–2 Sätzen (Einsteiger: ein kurzer Satz, keine Zahlen);
Übung und Schwunggedanke kamen fest aus der App, der Rest der Karte war also fast derselbe Text wie die
Tipp-Karten; Claude sah nur die Kennzahlen des Levels und konnte kaum Zusammenhänge erkennen.

| Frage | Entscheidung (29.09.) | Folge |
|---|---|---|
| Wie frei darf Claude sein? | **Frei mit Leitplanken** | Claude schreibt eigene Erklärungen, Anleitung und Trainingsplan. Die geprüften Tipps aus `tipps.js` stehen vollständig im Systemtext und dürfen nicht widersprochen werden; ihre Übung ist immer Teil des Plans. Zusätzliche Übungen nur aus dem verbreiteten Golfunterricht. Unter jeder Antwort: „fachlich geprüft ist nur die Übung der App“. Verworfen: erst eine große geprüfte Wissensbasis schreiben (viel Arbeit, Tiefe begrenzt). |
| Tiefe je Level? | **Volle Tiefe für alle, Sprache je Level** | Einsteiger: gleiche Abschnitte, aber Alltagssprache ohne Fachbegriffe und Zahlen. Könner: Fachsprache und Messwerte. |
| Welche Kennzahlen sieht Claude? | **Alle gemessenen** | `kennzahlen` (Level, nur daraus der Fokus – die App prüft das) und `hintergrundKennzahlen` (übrige, nur zum Erklären). Weiterhin nur Kennzahlen. Weil sich die gesendeten Daten ändern, fragt die App einmal neu um Einwilligung. |
| Modell und Kosten | **Claude Opus 5, Effort „high“** | ca. 15–25 US-Cent und 30–90 Sekunden pro Coaching (Systemtext ca. 4.600 Tokens). Verworfen: „medium“ (10–15 Cent), Claude Sonnet 5 (5–8 Cent). |

**Antwortfelder:** `gesamtbild`, `staerken[]`, `fokusKennzahl`, `wasPassiert`, `ursachen`, `folgen`, `anleitung[]`,
`gefuehl`, `trainingsplan[]` (je `titel`, `anleitung`, `menge`, `erfolg`), `typischeFehler[]`, `zuHause`, `danach`,
`naechsteAufnahme`. Ersetzt die App einen ungültigen Fokus, fallen alle Texte zum Fokus weg und die App zeigt ihre
eigene Erklärung. Alte gespeicherte Antworten (`lob`, `fokusBotschaft`, `naechstesMal`) zeigt die App weiter an.

**Technik:** `max_tokens` 16.000, Empfang als Datenstrom (`stream().finalMessage()`), damit die längere Antwort
an kein Zeitlimit stößt; sobald Text ankommt, zeigt der Hinweis „Der Coach schreibt …“. Kein Prompt Caching
(weiter ca. ein Coaching pro Sitzung).

**Später möglich:** Rückfragen an den Coach als kleiner Chat – erst nach Marcels Test der neuen Antworten entscheiden.
