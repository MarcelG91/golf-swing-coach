# Golf Swing Coach – Regeln für Claude

Web-App (GitHub Pages), die Golfschwung-Videos im Browser analysiert (MediaPipe Pose)
und Tipps gibt. Läuft offline als Home-Bildschirm-App auf dem iPhone.
Live: https://marcelg91.github.io/golf-swing-coach/ · Repo: MarcelG91/golf-swing-coach

## Für wen

Marcel lernt Programmieren und Git (Anfänger) und gerade auch Golf.
- Auf Deutsch antworten, Schritte kurz erklären, Terminal-Befehle einzeln und kopierbar.
- Bei jedem neuen Werkzeug oder Dienst kurz begründen, warum dieses.
- Kommentare im Code auf Deutsch und anfängerfreundlich, Namen auf Deutsch (wie bisher).

## Arbeitsweise: 1 Chat = 1 Branch = 1 Pull Request

1. **Start:** `git checkout main && git pull`, dann `git checkout -b <thema>`.
   Vorher prüfen: `git status` sauber? Liegen noch andere lokale Branches herum, die nicht
   auf GitHub sind (`git branch -vv`)? Dann erst nachfragen.
2. **Nur das eine Thema** des Branches bearbeiten. Neue Ideen → in „Offene Punkte“ unten
   notieren statt mit einbauen.
3. **Prüfen:** `node --test` (alle Tests grün), bei Änderungen an der Oberfläche auch im
   Browser ansehen (`python3 -m http.server 8000 --bind 127.0.0.1`).
4. **Abschluss im selben Chat:** committen, `git push -u origin <thema>`,
   `gh pr create --fill`, warten bis die Checks grün sind, `gh pr merge --merge --delete-branch`,
   `git checkout main && git pull`. Kein Chat endet mit ungepushter Arbeit.
5. Parallel laufende Chats dürfen nicht dieselben Dateien ändern (v. a. `app.js`, `sw.js`,
   `README.md`) – sonst nacheinander.

## Pflichten bei Änderungen

- **Neue JS-Datei?** In `sw.js` (`APP_DATEIEN`) und `pwa.js` (`APP_DATEIEN`) eintragen,
  sonst fehlt sie offline.
- **Jede Änderung an der App:** `APP_VERSION` in `pwa.js` erhöhen (steht unten in der App –
  so sieht Marcel auf dem iPhone, ob das Update angekommen ist).
- Das gewählte Level liegt lokal unter `localStorage`-Schlüssel `level`; jede gespeicherte
  Sitzung hält zusätzlich fest, welches Level beim Speichern gewählt war.
- **Keine Videos, keine exportierten Posedaten ins Repo** (`tests/keine-videos.test.mjs`
  und `.gitignore` wachen darüber). Testvideos nur lokal in `testvideos/`.
- Rechenlogik (Phasen, Kennzahlen, Technik, Raster) bleibt frei von Browser-Code, damit
  sie mit `node --test` prüfbar ist. Echte Testschwünge: `tests/daten/`.
- README-Dateiliste aktuell halten.

## Sicherheit (bei jeder Änderung beachten)

Ausführlicher Stand mit allen Befunden: `docs/sicherheit/bericht.md` (IDs wie V1, C1, S2).
**Vor Änderungen an Netzwerk, Speicherung (IndexedDB, Export, Sicherung), Service Worker oder
nachgeladenem Fremdcode diesen Bericht lesen** und betroffene Befunde gleich mit erledigen.

- **Videos, Einzelbilder, Posedaten und Kennzahlen verlassen das Gerät nie.** Kein Upload,
  kein `fetch` mit Nutzerdaten. Neue Internetadressen nur nach Rückfrage; erlaubt sind
  `cdn.jsdelivr.net` und `storage.googleapis.com` (MediaPipe und Modell).
- **Keine Schlüssel, Tokens oder Passwörter im Code** – das Repo ist öffentlich.
  Coach-Feedback mit Claude (Etappe 11b): entschieden am 27.09. – eigener API-Schlüssel des
  Nutzers, nur auf dem Gerät, nur nach Einwilligung, nur Kennzahlen, einzige neue Adresse
  `api.anthropic.com`. Details und Schutzmaßnahmen: `docs/plan-etappe-11-level-und-coach.md`, V2.
- Kein `eval` / `new Function`. `innerHTML` nur mit festen Texten; Dateinamen und
  gespeicherte Daten immer per `textContent`.
- Jede asynchrone Aktion mit Fehlerbehandlung; gesperrte Knöpfe im `finally` wieder freigeben.
- Browser-Adressen aus `URL.createObjectURL` wieder freigeben (bei Downloads verzögert).
- In Commits, Pull Requests und `docs/sicherheit/` keine Details zu noch offenen Lücken.
- **Nach jeder Bau-Runde `/golf-app-check` ausführen.** Er schreibt `docs/sicherheit/bericht.md`
  und `docs/sicherheit/pruefprotokoll.md` fort.

## Wichtige Dateien

| Datei | Aufgabe |
|---|---|
| `app.js` | Oberfläche, Video, Zeichnen, Ablauf der Analyse |
| `videoanalyse.js` | Video schnell durchgehen (abspielen statt springen, Lücken nachholen) |
| `phasen.js` · `kennzahlen.js` · `technik.js` · `ideallinien.js` | Rechenlogik |
| `speicher.js` · `videokuerzen.js` | Schwünge speichern (IndexedDB) und als Clip ausschneiden |
| `schwuenge.js` · `gesamtauswertung.js` | Mehrere Schläge pro Video, mehrere Videos, Gesamtauswertung |
| `level.js` | Level-Zuordnung, gefilterte Kennzahlen und Level-Vorschläge (reine Rechenlogik) |
| `pwa.js` · `sw.js` · `manifest.webmanifest` | Installation, Offline, Version |
| `docs/plan-speichern-und-fortschritt.md` | Plan für Etappen 8–10 inkl. Entscheidungen |
| `docs/plan-etappe-11-level-und-coach.md` | Plan für Etappe 11: Level-gerechte Tipps (11a) und Coach mit Claude (11b) |
| `docs/sicherheit/` | Sicherheitsbericht (Befunde, Status) und Prüfprotokoll der Checks |

## Bekannte Eigenheiten iPhone / Safari

- Home-Bildschirm-App hat eigenen Speicher (getrennt von Safari) → einmal von dort online öffnen.
- Pose-Modell kommt mit `Vary: Origin` → Cache immer mit `ignoreVary: true` abfragen.
- Bild-für-Bild-Springen in iPhone-Videos (HEVC/4K) ist sehr langsam → `videoanalyse.js` spielt ab.
- Statuszeile nach der Analyse: „Analyse fertig (… s · … ms pro Bild · GPU/CPU · …)“ –
  diese Zeile bei Geschwindigkeitsproblemen von Marcel erfragen.

## Offene Punkte

- iPhone-Test der schnellen Analyse (Version ≥ 0.7.3): Statuszeile „Analyse fertig (…)“ auswerten.
- iPhone-Test mehrere Schwünge (Version ≥ 0.8.0): echtes langes Video von der Range mit mehreren
  Schlägen + Mehrfachauswahl aus Fotos. Werden alle Schläge gefunden? Falsche Treffer (z. B. Aufteen)?
  Bisher nur mit zusammengesetzten Testdaten geprüft – Schwelle 3,5 ggf. anpassen.
- iPhone-Test Etappe 8 (Version ≥ 0.9.0): Speichern im Flugmodus, sitzt das Skelett im gespeicherten Clip?
- **Reihenfolge ab jetzt: 11a → 11b → 10 → 9** (Sicherung bewusst ans Ende, Entscheidung 27.09.).
  Etappe 11a: Level + angepasste Tipps · 11b: Coach mit Claude (Plan in `docs/plan-etappe-11-level-und-coach.md`).
  Etappe 10: Fortschritt · Etappe 9: Sicherung (Plan in `docs/plan-speichern-und-fortschritt.md`).
- Speicher sparen: „Nur Videos löschen, Kennzahlen behalten“ (für alte Sitzungen).
- Zwei GitHub-Konten (MarcelG91 aktiv, n4n5wd8w9n-maker alt) → irgendwann zusammenlegen.
