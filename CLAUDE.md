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
- **`vendor/` nie von Hand ändern** (MediaPipe + Pose-Modell, seit 0.26.0, C1). Neue Version = neuer Ordner,
  Herkunft prüfen wie in `vendor/README.md`, Prüfsummen in `tests/vendor.test.mjs`, Pfade in `app.js` und
  `sw.js` (`VENDOR_DATEIEN`). Der Service Worker liefert `vendor/` „Speicher zuerst“ – ohne neuen Ordner käme ein Update nie an.
  Dazu `CACHE_VENDOR` in `sw.js` und `pwa.js` hochzählen (`vendor-v2` …), sonst bleiben die alten ~19 MB auf jedem Gerät.
- **Jede Änderung an der App:** `APP_VERSION` in `pwa.js` erhöhen (steht unten in der App –
  so sieht Marcel auf dem iPhone, ob das Update angekommen ist).
- Das gewählte Level liegt lokal unter `localStorage`-Schlüssel `level`; jede gespeicherte
  Sitzung hält zusätzlich fest, welches Level beim Speichern gewählt war.
- Der Lernfortschritt der Wissensseite liegt unter `localStorage`-Schlüssel `wissenFortschritt`
  (nur Liste erledigter Lektions-IDs, keine Schwungdaten). „Alles löschen“ lässt ihn stehen wie das
  Level (Test: `tests/sicherheit.test.mjs`).
- Hell/Dunkel liegt unter `localStorage`-Schlüssel `darstellung` (`auto`/`hell`/`dunkel`, `darstellung.js`).
  Farben nur über die Variablen oben in `style.css` setzen (beide Farbsätze pflegen).
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
  kein `fetch` mit Nutzerdaten. Neue Internetadressen nur nach Rückfrage. Seit 0.26.0 (C1) lädt die App
  **nichts mehr von fremden Servern**: MediaPipe und Modell liegen in `vendor/`, der Coach nutzt kein SDK.
  Die CSP in `index.html` (C3) erlaubt nur `'self'` und `api.anthropic.com` – eine neue Adresse muss dort,
  im Datenschutzhinweis (Einstellungen, README) und in `tests/sicherheit.test.mjs` mit.
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
- **Löschen fasst nur die Schwung-Datenbank an** – nie `localStorage` (Level, Lernfortschritt, Coach-Schlüssel)
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
| `fortschritt.js` | Verläufe, Trend, Fokus, Meilensteine, Wochenrückblick aus gespeicherten Schwüngen (reine Rechenlogik, Etappe 10) |
| `level.js` | Level-Zuordnung, gefilterte Kennzahlen und Level-Vorschläge (reine Rechenlogik) |
| `wissen.js` · `nachschlagen.js` · `schaubilder.js` | Wissensseite: Lernpfade, Lektionen, Quiz, Quellen (Kennung `datei:KÜRZEL`, nur als Text), Kennzahl → Lektion · Nachschlagen (Glossar, Irrtümer, Regeln, Ausrüstung, Suche) · beschriftete Schaubilder (Farben = Variablen aus `style.css`) |
| `tipps.js` · `strichfigur.js` · `uebungsbilder.js` | Alle kurzen Tipp-Texte + Skala (fachlich geprüft, Quellen in `docs/plan-tipps-neu.md`) · Figur für die Karten · Figuren/Animationen im Übungsmodus |
| `pwa.js` · `sw.js` · `manifest.webmanifest` | Installation, Offline, Version |
| `vendor/` | MediaPipe 0.10.14 + Pose-Modell, selbst ausgeliefert und per Prüfsumme festgeschrieben (`tests/vendor.test.mjs`, Herkunft `vendor/README.md`) |
| `style.css` · `darstellung.js` | Aussehen (Design-Variablen, Hell/Dunkel) · Umschalter Hell/Dunkel/Automatisch |
| `docs/plan-speichern-und-fortschritt.md` | Plan für Etappen 8–10 inkl. Entscheidungen |
| `docs/plan-tipps-neu.md` | Wisch-Karten, Kurztipps, Übungsmodus – Entscheidungen, geprüfte Texte, Quellen |
| `docs/wissen/` · `docs/plan-wissensseite.md` | Wissensdatenbank Golf mit Quellen (12 Kapitel, Profile, Abgleich mit der App) · Plan für die Wissensseite |
| `docs/plan-etappe-11-level-und-coach.md` | Plan für Etappe 11: Level-gerechte Tipps (11a) und Coach mit Claude (11b) |
| `docs/sicherheit/` | Sicherheitsbericht (Befunde, Status) und Prüfprotokoll der Checks |

## Bekannte Eigenheiten iPhone / Safari

- Home-Bildschirm-App hat eigenen Speicher (getrennt von Safari) → einmal von dort online öffnen.
- Service-Worker-Cache immer mit `ignoreVary: true` abfragen (Antworten mit `Vary`-Kopfzeile findet Safari sonst
  nicht wieder; aufgefallen beim früheren Modell von Google mit `Vary: Origin`).
- CSP mit `'wasm-unsafe-eval'` braucht Safari 16, WebAssembly-SIMD (MediaPipe ohne „nosimd“-Variante) iOS 16.4.
  Ältere Geräte bekommen die Meldung „Dieses Gerät ist zu alt …“ (S13). Mindestversion steht im README.
- Bild-für-Bild-Springen in iPhone-Videos (HEVC/4K) ist sehr langsam → `videoanalyse.js` spielt ab.
- Statuszeile nach der Analyse: „Analyse fertig (… s · … ms pro Bild · GPU/CPU · …)“ –
  diese Zeile bei Geschwindigkeitsproblemen von Marcel erfragen.

## Offene Punkte – priorisierter Backlog (Stand 30.09.)

Reihenfolge: **(1 + 2 bei Marcel) → 7 → 8** (4, 6 und 9 erledigt). Neue Ideen hier passend einsortieren.

### 🔴 Priorität 1 – Gebautes in der Praxis absichern

1. **iPhone-Praxistest** (Marcel, ca. 30 min) – Checkliste: `docs/iphone-testliste.md`. Bündelt:
   - **Sicherheits-Etappe (≥ 0.26.0, zuerst):** erster Start online bis „Offline bereit ✓“, dann im Flugmodus neu öffnen
     und analysieren; Coach einmal mit eigenem Schlüssel (CSP darf nichts blockieren).
   - Schnelle Analyse (≥ 0.7.3) und Ladezeit (≥ 0.14.0, Befund S8): Zeile „Analyse fertig (… · Video geladen in … s)“.
   - Mehrere Schwünge (≥ 0.8.0): langes Range-Video + Mehrfachauswahl. Alle Schläge gefunden? Falsche Treffer
     (Aufteen)? Bisher nur mit zusammengesetzten Testdaten geprüft – Schwelle 3,5 ggf. anpassen.
   - Speichern im Flugmodus (≥ 0.9.0): sitzt das Skelett im gespeicherten Clip?
   - Aufräumen (≥ 0.11.0): Speicheranzeige vorher/nachher; „Alles löschen“ → Level noch da, offline nutzbar?
   - Tipps neu + Übungsmodus (≥ 0.13.0): Wischen flüssig? Figuren/Skala verständlich? Bildschirm bleibt an (Wake Lock ab iOS 16.4)?
2. **Echter Coach-Test** (Marcel, ≥ 0.17.0, ca. 60 Cent): Erster Test mit 0.15.0 (29.09.): Antworten zu knapp und
   „wertlos“ → seit 0.17.0 ausführliches Coaching (Gesamtbild, Ursachen, Anleitung, Trainingsplan, Effort „high“).
   Jetzt alle drei Level – Tiefe, Ton, Länge, Fachlichkeit? Wartezeit und Kosten (steht unter der Antwort) notieren.
3. ~~Golflehrer-Durchsicht~~ – **entfällt** (Entscheidung 30.09.). Fachliche Absicherung stattdessen über die
   strengen Quellenregeln (siehe „Dauerhafte Regeln“ und `docs/plan-wissensseite.md`).
4. ~~Aufräum-Runde~~ – **erledigt mit 0.26.1** (Branch `aufraeumen`): alte Langtexte `tipp` (kein Leser mehr) und `text`
   (nur noch Tempo „nicht bewertbar“) aus `technik.js`/`kennzahlen.js` entfernt, `gefuehl` bleibt; Selbst-Check
   „Ellbogen am Top“ entschärft (kein Fehler an sich); `tipps.js`: `kopfhoehe` tief „Größe halten“, `oberkoerperTreff`
   „Rechte Schulter geht nach unten“; Golf-App-Check-Skill an 0.26.0 und Coach-Entscheidung angepasst.

### 🟡 Priorität 2 – Nächste Etappen

5. ~~Etappe 10: Fortschritt~~ – **erledigt mit 0.27.0 (`fortschritt.js`) und 0.28.0 (Anzeige)**: Meine Schwünge → „📈 Fortschritt“
   mit Wochenrückblick, Fokus + Übung, Meilensteinen, Verlauf und Trend je Kennzahl (nach Ansicht und Schlägergruppe).
   **Offen: Vorher/Nachher** (ältester und neuester Schwung nebeneinander, braucht Bilder aus den Clips) – eigener Branch.
   Offen bleibt der iPhone-Test mit echten Schwüngen über mehrere Tage.
6. ~~Sicherheits-Etappe C1 + C3~~ – **erledigt mit 0.26.0** (Branch `sicherheit-c1-c3`): MediaPipe und Modell in
   `vendor/` mit Prüfsummen, Coach mit eigenem `fetch` statt SDK, CSP, Datenschutzhinweis (V4). Offen nur der
   iPhone-Test dazu (siehe Nr. 1 und `docs/iphone-testliste.md`).
7. **Automatischer Browser-Test (T3):** Chrome ohne Fenster über das DevTools-Protokoll (ohne neue Bibliothek) –
   Seite lädt, „Bereit“, keine Konsolenfehler.
8. **Etappe 9: Sicherung** (bewusst ans Ende, Entscheidung 27.09.). Mit Verschlüsselung oder ohne Videos (V6).
   Muss den Coach-Schlüssel (`localStorage` `coachSchluessel`) ausdrücklich weglassen.
9. **Wissensseite mit Lernpfaden** (Plan und Entscheidungen 30.09.: `docs/plan-wissensseite.md`). **Schritt 1
   `wissen-geruest` erledigt (0.22.0)**: Bereich, Lektionsansicht, Fortschritt, Pfad 1 mit 7 Schaubildern. **Schritte 2 + 3
   `wissen-pfade-2-3` erledigt (0.23.0)**: Pfade „Vollschwung“ und „Ballflug“ (je 7 Lektionen), 12 Schaubilder, P1–P10
   animiert, Ballflug-Helfer als Karte in „Die neun Ballflüge“. **Schritt 4 `wissen-pfade-4-6` erledigt (0.24.0)**:
   Pfade „Rund ums Grün“, „Clever spielen“, „Besser üben“ (je 6 Lektionen, 19 Schaubilder). **Schritt 5
   `wissen-nachschlagen` erledigt (0.25.0)**: Umschalter „Lernpfade | Nachschlagen“, Suche, Glossar (60), Irrtümer (13),
   Regeln (17), Ausrüstung (6), Ballflug-Helfer; Baustellen-Karte → „📖 Lektion“. **Wissensseite damit komplett.**
   Keine externen Links, lieber Bilder als Text (alles im Code gezeichnet).

### 🟢 Priorität 3 – Später / bei Bedarf

- **Teilen mit Freunden** (Nr. 6 erledigt, nach dem iPhone-Test 0.26.0 möglich): Die App läuft bei jedem kostenlos,
  nur der Coach kostet. Optionen: eigener Schlüssel (umgesetzt) · Schlüssel je Freund aus Marcels Workspace mit Limit ·
  schlüsselfreier Knopf „Für Claude kopieren“. Datenschutzhinweis (V4) ist seit 0.26.0 in der App.
- **Coach-Modell Claude Opus 5.5** (Idee 01.10.): neuer und günstiger als Opus 5 (4/20 statt 5/25 US-Dollar je Mio.
  Tokens). Eigener Branch: Effort-Standard ist dort „medium“ (wir setzen „high“ ausdrücklich), Rückfall-Ziele prüfen,
  danach echter Test (Kosten, Qualität).
- **Zeitgrenze beim Video-Laden (S10):** erst nach der iPhone-Messung aus Nr. 1 festlegen.
- **Übungsfiguren von hinten:** Nur Posen zeigen, die die Grenzwerte der App erfüllen (Tests in
  `tests/uebungsbilder.test.mjs`). Von hinten gibt es bisher nur die Ansprechhaltung; Bewegung erst mit einem
  korrekten Profi-Schwung von hinten als Testdatei.
- Einheitlicher Lösch-Dialog auch für „Schwung löschen“ / „Sitzung löschen“ (ca. 20 Zeilen, Check 28.09.).
- LICENSE und Lizenzen der Testdaten-Quellen (C6) · MediaPipe-Update 0.10.14 → 1.x in eigenem Branch (C4).
- **Rückfragen an den Coach** (Idee 29.09.): kleiner Chat unter der Coach-Antwort („Wie übe ich das ohne Range?“).
  Erst nach dem echten Coach-Test (Nr. 2) entscheiden, ob die ausführliche Antwort schon reicht.

### Dauerhafte Regeln und Hinweise

- **Golfwissen:** `docs/wissen/` ist die belegte Grundlage für neue Tipps und die Wissensseite (jede Aussage mit
  Quelle). **Es gibt keine Golflehrer-Durchsicht** (Entscheidung 30.09.) – deshalb streng: In die App kommt nur, was
  durch Messdaten, Studie oder Regel belegt ist oder was mindestens zwei unabhängige Quellen gleich sagen;
  Umstrittenes nur als „Trainer sind uneins“. Neue Schwunggedanken positiv, mit äußerem Fokus (Schläger/Ball/Ziel) oder als Bild formulieren –
  keine Verbote („nicht …“), siehe `docs/wissen/richtig-ueben.md`.
- **Tipps fachlich:** Golf-Technik muss stimmen (Marcels Anforderung: keine falsche Technik). Texte nur in
  `tipps.js` ändern, mit Quelle; danach Liste in `docs/plan-tipps-neu.md` neu erzeugen.
- **C7:** Keine weitere GitHub-Pages-Seite unter MarcelG91 veröffentlichen (alle Pages-Seiten eines Kontos teilen
  sich im Browser den Speicher, also auch Coach-Schlüssel und Schwünge) – außer die App zieht vorher auf eine
  eigene Domain um.
- Erststart-Hänger im lokalen Chrome-Test (28.09., geklärt): Der einfache Python-Server bricht beim ersten Laden
  einzelne Verbindungen ab (`ERR_CONNECTION_RESET`), dann läuft `app.js` nicht an. Live in Ordnung. Lokal: einmal
  neu laden. Seit 0.14.0 bittet die App nach 20 s selbst um Neuladen (S9 erledigt).
