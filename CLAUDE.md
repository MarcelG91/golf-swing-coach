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
  `cdn.jsdelivr.net` (MediaPipe, Anthropic-SDK) und `storage.googleapis.com` (Modell).
  **Einzige Ausnahme: der freiwillige Coach** (Etappe 11b, `coach.js`) sendet nach Einwilligung Kennzahlen
  an `api.anthropic.com` – nie Videos, Bilder, Posedaten, Notizen, Namen oder Datum (Test: `tests/coach.test.mjs`).
- **Keine Schlüssel, Tokens oder Passwörter im Code** – das Repo ist öffentlich.
  Coach-Feedback mit Claude (Etappe 11b): entschieden am 27.09. – eigener API-Schlüssel des
  Nutzers, nur auf dem Gerät, nur nach Einwilligung, nur Kennzahlen, einzige neue Adresse
  `api.anthropic.com`. Details und Schutzmaßnahmen: `docs/plan-etappe-11-level-und-coach.md`, V2.
- Kein `eval` / `new Function`. `innerHTML` nur mit festen Texten; Dateinamen und
  gespeicherte Daten immer per `textContent`.
- Jede asynchrone Aktion mit Fehlerbehandlung; gesperrte Knöpfe im `finally` wieder freigeben.
- Browser-Adressen aus `URL.createObjectURL` wieder freigeben (bei Downloads verzögert).
- In Commits, Pull Requests und `docs/sicherheit/` keine Details zu noch offenen Lücken.
- **Löschen fasst nur die Schwung-Datenbank an** – nie `localStorage` (Level, später Coach-Schlüssel)
  und nie die Offline-Dateien. Kein `localStorage.clear()`, kein `deleteDatabase`; darüber wacht
  `tests/sicherheit.test.mjs`. Vor „Videos löschen“ und „Alles löschen“ zeigt die App im Dialog, was
  gelöscht wird und was bleibt („Schwung/Sitzung löschen“ fragen weiter kurz per `confirm()`).
- **Nach jeder Bau-Runde `/golf-app-check` ausführen.** Er schreibt `docs/sicherheit/bericht.md`
  und `docs/sicherheit/pruefprotokoll.md` fort.

## Wichtige Dateien

| Datei | Aufgabe |
|---|---|
| `app.js` | Oberfläche, Video, Zeichnen, Ablauf der Analyse |
| `videoanalyse.js` | Video schnell durchgehen (abspielen statt springen, Lücken nachholen) |
| `phasen.js` · `kennzahlen.js` · `technik.js` · `ideallinien.js` | Rechenlogik |
| `speicher.js` · `videokuerzen.js` | Schwünge speichern (IndexedDB), aufräumen (Videos löschen, alles löschen) und als Clip ausschneiden |
| `schwuenge.js` · `gesamtauswertung.js` | Mehrere Schläge pro Video, mehrere Videos, Gesamtauswertung |
| `coach.js` | Coach mit Claude: gesendete Daten (nur Kennzahlen), Systemtext, Antwort prüfen (reine Rechenlogik; Senden in `app.js`) |
| `level.js` | Level-Zuordnung, gefilterte Kennzahlen und Level-Vorschläge (reine Rechenlogik) |
| `tipps.js` · `strichfigur.js` · `uebungsbilder.js` | Alle kurzen Tipp-Texte + Skala (fachlich geprüft, Quellen in `docs/plan-tipps-neu.md`) · Figur für die Karten · Figuren/Animationen im Übungsmodus |
| `pwa.js` · `sw.js` · `manifest.webmanifest` | Installation, Offline, Version |
| `docs/plan-speichern-und-fortschritt.md` | Plan für Etappen 8–10 inkl. Entscheidungen |
| `docs/plan-tipps-neu.md` | Wisch-Karten, Kurztipps, Übungsmodus – Entscheidungen, geprüfte Texte, Quellen |
| `docs/plan-etappe-11-level-und-coach.md` | Plan für Etappe 11: Level-gerechte Tipps (11a) und Coach mit Claude (11b) |
| `docs/sicherheit/` | Sicherheitsbericht (Befunde, Status) und Prüfprotokoll der Checks |

## Bekannte Eigenheiten iPhone / Safari

- Home-Bildschirm-App hat eigenen Speicher (getrennt von Safari) → einmal von dort online öffnen.
- Pose-Modell kommt mit `Vary: Origin` → Cache immer mit `ignoreVary: true` abfragen.
- Bild-für-Bild-Springen in iPhone-Videos (HEVC/4K) ist sehr langsam → `videoanalyse.js` spielt ab.
- Statuszeile nach der Analyse: „Analyse fertig (… s · … ms pro Bild · GPU/CPU · …)“ –
  diese Zeile bei Geschwindigkeitsproblemen von Marcel erfragen.

## Offene Punkte – priorisierter Backlog (Stand 28.09.)

Reihenfolge: **4 → (1 + 2 + 3 parallel bei Marcel) → 5 → 6 → 7 → 8**. Neue Ideen hier passend einsortieren.

### 🔴 Priorität 1 – Gebautes in der Praxis absichern

1. **iPhone-Praxistest** (Marcel, ca. 30 min) – Checkliste: `docs/iphone-testliste.md`. Bündelt:
   - Schnelle Analyse (≥ 0.7.3) und Ladezeit (≥ 0.14.0, Befund S8): Zeile „Analyse fertig (… · Video geladen in … s)“.
   - Mehrere Schwünge (≥ 0.8.0): langes Range-Video + Mehrfachauswahl. Alle Schläge gefunden? Falsche Treffer
     (Aufteen)? Bisher nur mit zusammengesetzten Testdaten geprüft – Schwelle 3,5 ggf. anpassen.
   - Speichern im Flugmodus (≥ 0.9.0): sitzt das Skelett im gespeicherten Clip?
   - Aufräumen (≥ 0.11.0): Speicheranzeige vorher/nachher; „Alles löschen“ → Level noch da, offline nutzbar?
   - Tipps neu + Übungsmodus (≥ 0.13.0): Wischen flüssig? Figuren/Skala verständlich? Bildschirm bleibt an (Wake Lock ab iOS 16.4)?
2. **Echter Coach-Test** (Marcel, ≥ 0.15.0, ca. 20 Cent): alle drei Level – passen Ton, Länge, Fokus? Kosten notieren.
   Kommt „unvollständig“, `max_tokens` in `coach.js` von 4000 anheben.
3. **Golflehrer-Durchsicht** der Tipps (`docs/plan-tipps-neu.md`) durch einen PGA-Pro.
4. **Aufräum-Runde** (Claude, ein PR, 1–2 h):
   - Level-Karten (⚙️ Einstellungen): Beschreibung wird in eine schmale Spalte gequetscht („Ich / lerne / gerade …“) –
     Grid-Spalte der `<small>` in `style.css` festlegen.
   - Alte Langtexte (`text`/`tipp` in `technik.js`, `kennzahlen.js`) zeigt die App nicht mehr – entfernen oder an
     `tipps.js` angleichen (z. B. Tempo „oben kurz ankommen“, Kopfhöhe „Knie gebeugt“ sind überholt).
   - Golf-App-Check-Skill Abschnitt 2 („kein API-Schlüssel im Browser“) an die Coach-Entscheidung vom 27.09. anpassen
     und `api.anthropic.com` als erlaubten Host nennen.

### 🟡 Priorität 2 – Nächste Etappen

5. **Etappe 10: Fortschritt** (Plan in `docs/plan-speichern-und-fortschritt.md`). Größter Nutzen fürs Golf-Lernen.
6. **Sicherheits-Etappe C1 + C3** (ca. ½ Tag, nur nach Absprache): MediaPipe, Modell und Anthropic-SDK selbst
   ausliefern bzw. mit Prüfsummen, danach CSP. **Pflicht, bevor Freunde die App nutzen.**
7. **Automatischer Browser-Test (T3):** Chrome ohne Fenster über das DevTools-Protokoll (ohne neue Bibliothek) –
   Seite lädt, „Bereit“, keine Konsolenfehler.
8. **Etappe 9: Sicherung** (bewusst ans Ende, Entscheidung 27.09.). Mit Verschlüsselung oder ohne Videos (V6).
   Muss den Coach-Schlüssel (`localStorage` `coachSchluessel`) ausdrücklich weglassen.

### 🟢 Priorität 3 – Später / bei Bedarf

- **Teilen mit Freunden** (erst nach Nr. 6): Die App läuft bei jedem kostenlos, nur der Coach kostet. Optionen:
  eigener Schlüssel (umgesetzt) · Schlüssel je Freund aus Marcels Workspace mit Limit · schlüsselfreier Knopf
  „Für Claude kopieren“. Dazu kurzer Datenschutzhinweis für die ganze App (V4).
- **Zeitgrenze beim Video-Laden (S10):** erst nach der iPhone-Messung aus Nr. 1 festlegen.
- **Übungsfiguren von hinten:** Nur Posen zeigen, die die Grenzwerte der App erfüllen (Tests in
  `tests/uebungsbilder.test.mjs`). Von hinten gibt es bisher nur die Ansprechhaltung; Bewegung erst mit einem
  korrekten Profi-Schwung von hinten als Testdatei.
- Einheitlicher Lösch-Dialog auch für „Schwung löschen“ / „Sitzung löschen“ (ca. 20 Zeilen, Check 28.09.).
- LICENSE und Lizenzen der Testdaten-Quellen (C6) · MediaPipe-Update 0.10.14 → 1.x in eigenem Branch (C4).
- Zwei GitHub-Konten (MarcelG91 aktiv, n4n5wd8w9n-maker alt) → irgendwann zusammenlegen.

### Dauerhafte Regeln und Hinweise

- **Tipps fachlich:** Golf-Technik muss stimmen (Marcels Anforderung: keine falsche Technik). Texte nur in
  `tipps.js` ändern, mit Quelle; danach Liste in `docs/plan-tipps-neu.md` neu erzeugen.
- **C7:** Keine weitere GitHub-Pages-Seite unter MarcelG91 veröffentlichen (alle Pages-Seiten eines Kontos teilen
  sich im Browser den Speicher, also auch Coach-Schlüssel und Schwünge) – außer die App zieht vorher auf eine
  eigene Domain um.
- Erststart-Hänger im lokalen Chrome-Test (28.09., geklärt): Der einfache Python-Server bricht beim ersten Laden
  einzelne Verbindungen ab (`ERR_CONNECTION_RESET`), dann läuft `app.js` nicht an. Live in Ordnung. Lokal: einmal
  neu laden. Seit 0.14.0 bittet die App nach 20 s selbst um Neuladen (S9 erledigt).
