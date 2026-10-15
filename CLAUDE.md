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
- **Sicherung** (`sicherung.js`): Einstellungen kommen nur über die Erlaubt-Liste `EINSTELLUNGEN_IN_SICHERUNG` hinein
  (derzeit nur `wissenFortschritt`) – nie `coachSchluessel` oder die Einwilligung. Neue Felder in Sitzung/Schwung landen
  automatisch in der Sicherung; ändert sich der Aufbau so, dass alte Dateien nicht mehr passen, `SICHERUNG_VERSION`
  erhöhen und alte Versionen weiter einlesen können. Keine Videos in die Sicherung ohne Passwort (V6).
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
| `sicherung.js` | Sicherung als JSON-Datei: bauen (Prüfsumme), prüfen, Zusammenführen planen, Erlaubt-Liste der Einstellungen (reine Rechenlogik; Teilen/Einspielen in `app.js`) |
| `schwuenge.js` · `gesamtauswertung.js` | Mehrere Schläge pro Video, mehrere Videos, Gesamtauswertung |
| `livekamera.js` · `liveschwung.js` · `ampel.js` · `aufnahme.js` · `liveclip.js` | Live-Kamera (Etappe 12): Kamera + Zeitmessung · Schwung live erkennen · Ampelrahmen + Kurzwort · versetzte 16-s-Aufnahmestücke im Arbeitsspeicher · Schwung ↔ Stück zuordnen und aufs Raster umrechnen (alles außer Kamera/Aufnahme reine Rechenlogik) |
| `coach.js` | Coach mit Claude: gesendete Daten (nur Kennzahlen), Systemtext, Antwort prüfen (reine Rechenlogik; Senden in `app.js`) |
| `phasenabspieler.js` | Phasen-Abspieler im Fortschritt (Vorher/Nachher): Abspielgeschwindigkeit je Abschnitt, damit die Phasen bei beiden Schwüngen gleichzeitig kommen (reine Rechenlogik; Abspielen in `app.js`) |
| `fortschritt.js` | Verläufe, Trend, Fokus, Meilensteine, Wochenrückblick aus gespeicherten Schwüngen (reine Rechenlogik, Etappe 10) |
| `level.js` | Level-Zuordnung, gefilterte Kennzahlen und Level-Vorschläge (reine Rechenlogik) |
| `wissen.js` · `nachschlagen.js` · `schaubilder.js` · `fotos.js` | Wissensseite: Lernpfade, Lektionen, Quiz, Quellen (Kennung `datei:KÜRZEL`, nur als Text), Kennzahl → Lektion · Nachschlagen (Glossar, Irrtümer, Regeln, Ausrüstung, Suche) · beschriftete Schaubilder (Farben = Variablen aus `style.css`) · echte Fotos (`fotos/`, freie Lizenz, Nachweis in `fotos/README.md`) |
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

Reihenfolge: **1 + 2 bei Marcel** (4, 6, 8 und 9 erledigt), dann die Feedback-Runde 13.10. (unten). Neue Ideen hier passend einsortieren.

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
2. **Echter Coach-Test** (Marcel, ≥ 0.38.0 mit Claude Opus 5.5, ca. 60 Cent): Erster Test mit 0.15.0 (29.09.): Antworten zu knapp und
   „wertlos“ → 0.17.0 ausführliches Coaching (600–900 Wörter) → zu lang und unübersichtlich (13.10.) → seit 0.40.0
   **Kurz-Coaching** wie auf der Range (Stärke, ein Fokus, 2–3 Anweisungen, „Warum?“ zugeklappt, ≤ 120 Wörter),
   seit 0.43.0 mit **Befund** (Phase, was passiert, Richtung) und präziseren Anweisungen (≤ 140 Wörter).
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
   **Vorher/Nachher erledigt mit 0.29.0** (Branch `vorher-nachher`): ältester gegen neuester Schwung, je Phase ein Bild aus dem
   Clip mit Skelett (fehlt der Clip: Hinweis). **Phasen-Abspieler erledigt mit 0.36.0** (`phasenabspieler.js`): beide Clips nebeneinander, jeder Abschnitt (Ansprechen→Top→Treffmoment→Finish) bei beiden gleich lang, Tempo 0,25×/0,5×/1×.
   Offen bleibt der iPhone-Test mit echten Schwüngen über mehrere Tage.
6. ~~Sicherheits-Etappe C1 + C3~~ – **erledigt mit 0.26.0** (Branch `sicherheit-c1-c3`): MediaPipe und Modell in
   `vendor/` mit Prüfsummen, Coach mit eigenem `fetch` statt SDK, CSP, Datenschutzhinweis (V4). Offen nur der
   iPhone-Test dazu (siehe Nr. 1 und `docs/iphone-testliste.md`).
7. ~~Automatischer Browser-Test (T3)~~ – **erledigt** (Branch `browser-test`): `node tests/browser-rauchtest.mjs`
   (Chrome ohne Fenster über das DevTools-Protokoll, ohne neue Bibliothek, läuft auch in der CI). Nach Änderungen an
   der Oberfläche einmal lokal laufen lassen.
8. ~~Etappe 9: Sicherung~~ – **erledigt mit 0.37.0** (Branch `etappe-9-sicherung`, `sicherung.js`): Einstellungen →
   „Sicherung erstellen“ legt eine JSON-Datei (SHA-256-Prüfsumme) übers Teilen-Menü ab, „Sicherung einspielen“ prüft
   erst alles und führt dann zusammen (nie ersetzen, `add` statt `put`). Entscheidungen 13.10.: **ohne Videos/Bilder,
   ohne Passwort** (V6 erledigt), nur Zusammenführen, von den Einstellungen nur der Lernfortschritt. **iPhone-Test
   erfolgt (13.10., 0.37.1): Teilen-Menü öffnet sich, Datei liegt in der Dateien-App und ist beim Einspielen antippbar.**
   Noch offen: Einspielen nach „Alles löschen“ und Verhalten mit sehr vielen Schwüngen (S15).
9. **Wissensseite mit Lernpfaden** (Plan und Entscheidungen 30.09.: `docs/plan-wissensseite.md`). **Schritt 1
   `wissen-geruest` erledigt (0.22.0)**: Bereich, Lektionsansicht, Fortschritt, Pfad 1 mit 7 Schaubildern. **Schritte 2 + 3
   `wissen-pfade-2-3` erledigt (0.23.0)**: Pfade „Vollschwung“ und „Ballflug“ (je 7 Lektionen), 12 Schaubilder, P1–P10
   animiert, Ballflug-Helfer als Karte in „Die neun Ballflüge“. **Schritt 4 `wissen-pfade-4-6` erledigt (0.24.0)**:
   Pfade „Rund ums Grün“, „Clever spielen“, „Besser üben“ (je 6 Lektionen, 19 Schaubilder). **Schritt 5
   `wissen-nachschlagen` erledigt (0.25.0)**: Umschalter „Lernpfade | Nachschlagen“, Suche, Glossar (60), Irrtümer (13),
   Regeln (17), Ausrüstung (6), Ballflug-Helfer; Baustellen-Karte → „📖 Lektion“. **Wissensseite damit komplett.**
   Keine externen Links, lieber Bilder als Text (alles im Code gezeichnet).

### 🟠 Feedback-Runde 13.10. (Marcel: „zu viel Text, zu viele Kästchen – keep it short and simple“)

Gut so, nicht umbauen: Schwünge mit Bild, Übung/Übungsmodus, Verlauf je Kennzahl, Diagrammauswahl, Level, Einstellungen.
Reihenfolge (je eigener Branch):
- ~~**A+B Startseite + weniger Text**~~ – **erledigt mit 0.39.0** (Branch `startseite-weniger-text`): Einstiegsbild mit
  Logo und Name, Version/Offline/🔒-Hinweis nur noch auf der Startseite, Live mit großen Knöpfen (Kamera Vorne/Hinten),
  Schwung-Auswahl als Dropdown unter dem Video, Gesamtauswertung mit zugeklappten Karten, Einstellungen mit Aufklappmenüs.
- ~~**Fehler 1 + 2 – Pfeile und Linien**~~ – **erledigt mit 0.41.0** (Branch `pfeile-und-linien`): Pfeile ◀ ▶ springen
  nach der Analyse von Phase zu Phase (vorher 1 Bild). Ursache der fehlenden Linien: Einsteiger hat von vorne beim
  Ansprechen und im Treffmoment keine Kennzahl mit Linie (von hinten nur beim Ansprechen). Entscheidung 13.10.: Dann
  zeigt das Bild die Kennzahlen der höheren Level als „Für später“ (keine Baustellen); ganz ohne Messung ein Schild
  „hier keine Messung“ (`app.js` `technikImBild`).
- ~~**C Fortschritt**~~ – **erledigt mit 0.42.0** (Branch `fortschritt-uebersichtlich`): Ansicht/Schläger als kleine
  Knöpfe (Entscheidung 13.10., Auswahl bleibt nötig, App stellt die letzte Sitzung ein), Erklärtexte raus, Meilensteine als
  Abzeichen, Vorher/Nachher ohne Videos nur eine Zeile. Diagramme zeigen jetzt den **echten Messwert** über grünem Zielbereich
  mit Skala (Grenzen aus `tipps.js` `SKALEN`, `wertDiagramm` in `fortschritt.js`); vorher nur die Bewertung in 3 Stufen.
  Ohne Skala (z. B. Armschwung am Top) bleibt das einfache Diagramm. „📖 Lektion“ unter jedem Diagramm.
- ~~**E Coach genauer**~~ – **erledigt mit 0.43.0** (Branch `coach-praeziser`, Entscheidung 13.10. „kurz, aber präziser“):
  neues Feld `befund`, Phase je Kennzahl im Systemtext, Anweisungen mit Körperteil, Richtung und Moment. Gesendete Daten
  unverändert. Offen: echter Test (Nr. 2 oben).
- **D Wissensseite** – in Etappen (Entscheidung 13.10.: alle vier Bereiche; Bilder: freie Fotos, sonst bessere Zeichnungen):
  - ~~**D1 Bilder**~~ – **erledigt mit 0.44.0** (Branch `wissen-fotos`): alle 47 Bilder geprüft (14.10.) – fachlich keins
    falsch; Griff neu gezeichnet (vorher nicht erkennbar), Hanglagen mit Figur und Blickrichtung. 6 Fotos von Wikimedia
    Commons (CC0/CC BY 4.0) in `fotos/` mit Nachweis: Griff linke Hand, Top, nach dem Treffen, Finish, Bunker, Grün lesen.
    Verworfen: Ansprech-Foto (Haltung falsch), Griff-Foto 1921 (Griffart nicht belegt). Ein gutes Foto der
    **Ansprechhaltung** fehlt noch (eigenes Foto von Marcel?).
  - ~~**D2 Grundlagen + Vollschwung**~~ – **erledigt mit 0.45.0** (Branch `wissen-tiefer-grundlagen`, Entscheidung 14.10.:
    **mehr Karten je Lektion** (jetzt 2–7, je ≤ 35 Wörter) statt Aufklappen oder neuer Lektionen). 15 Lektionen mit je 5–6
    Karten: konkreter („was tun, woran merken“), Anwendung/App-Bezug, nur Aussagen aus `docs/wissen/`. Bild passt jetzt zur
    Karte (`messwerte` geteilt in `messwerteTop` und `messwerteTreff`), Übung im Abschwung „Finish 3 Sekunden“ statt Führungsarm.
    Zahlen gegen TrackMan geprüft (Eintreffwinkel 6er −3,2°, PW −3,9° – stimmt). Bewusst weggelassen: „Shoulder Bend“ im
    Finish (Messrichtung bei GOLFTEC unklar) und unbelegte Tipps (z. B. Abstände zwischen Eisen).
  - ~~**Griff-Fotos**~~ – **erledigt mit 0.45.2** (Branch `griff-fotos`, Feedback 14.10.: eigene Skizze „wenig aussagekräftig“):
    zwei gemeinfreie Fotos aus Vardon, *How to Play Golf* (1912) – überlappender Griff, „eindeutig falscher“ Griff –, Titelbild
    jetzt Vergleich schwach/neutral/stark. Verworfen: Zeichnung „GolfGripC“ (Lizenz unstimmig). Eigene Griff-Fotos wären noch besser.
  - ~~**D3 Rund ums Grün + Ballflug**~~ – **erledigt mit 0.46.0** (Branch `wissen-tiefer-gruen-ballflug`): 13 Lektionen mit
    je 4–6 Karten (Beispiele Pull-Slice/Push-Draw, Bulge, Bocksprung, Tor, AimPoint-Idee, Lob, Bunker-Schwunglänge …).
    Korrigiert: Foto vom sauberen Treffer stand auf der Karte „Fett“ – jetzt eigene Karte „Richtig: erst Ball, dann Boden“.
    Weggelassen (nur eine Quelle): Landepunkt bergauf/bergab beim Chip.
  - ~~**D4 Clever spielen + Üben**~~ – **erledigt mit 0.47.0** (Branch `wissen-tiefer-platz-ueben`): 12 Lektionen mit je 4–6
    Karten (Erwartungen an Annäherungen, Abschlag nach Broadie/Shot Scope, eigene Längen, Wind in Schlägern, Kälte, Druck üben,
    Quiet Eye in Zahlen, weitere Fokus-Beispiele, 3–7 von 10, differenziell üben, Beweglichkeit, Rücken). **Wissensseite D damit
    komplett** – offen nur ein gutes Foto der Ansprechhaltung und eigene Griff-Fotos.

### 🟣 Wissen auf Forschungsniveau (Recherche 15.10., Feedback: „zu oberflächlich, Schärfe und Richtigkeit fehlen“)

Bericht: `docs/wissen/recherche/reports/Golfwissen auf Forschungsniveau.md` (Kernliteratur, Mängelliste mit Nummern,
Schreibregeln, Fotos). Abarbeiten je eigener Branch, in dieser Reihenfolge:
1. ~~**F1–F4, F7, F8** falsche Aussagen in `docs/wissen/` und `wissen.js` korrigieren (inkl. Quiz).~~ – **erledigt mit 0.47.2** (Branch `wissen-korrekturen-falsch`; neue Quellen WOR2012, BET2012, ARC2023, BRO2008, CHU2010 mit Stufe; INJ1–INJ3 richtig beschriftet).
2. ~~**F5** `gewicht` heißt, was es misst (Hüfte im Finish), **F6** Tempo-Tipp nach absoluten Zeiten statt nur Verhältnis.~~ – **erledigt mit 0.47.3** (Branch `tipps-gewicht-tempo`; Kennung `gewicht` bleibt, Anzeigename „Balance im Finish“; neue Tempo-Spielart „Abschwung dauert zu lange“; Rücken-Satz bei `oberkoerperTop` entfernt).
3. **Schwellen S1–S4** (`hueftSway`, `seitneigungAnsprechen`, `kopfSeitlich`; `oberkoerperTreff` und `kopfhoehe` erst an
   `tests/daten/` kalibrieren). Ändert die Bewertung gespeicherter Schwünge.
4. S9–S12 als „eigene Festlegung“ kennzeichnen · 5. **U1–U31** präzisieren · 6. **Z1–Z21** als neue Karten.
7. Eigene Fotos von Marcel (Ansprechen vorne/hinten, Griff ×3, Treffmoment, Putten – Anleitung im Bericht) und
   `fotos.js` `LIZENZEN` um CC BY-SA 3.0/CC BY 2.0 erweitern (Bunker-Foto, Stroboskop-Bild).
Ideen für später: Kennzahl „Schulterlinie am Top“, Bewertung je Schläger, Streuung je Kennzahl über mehrere Schwünge.

### 🔵 Etappe 12: Live-Kamera (0.31.0–0.34.0, 12.10.)

Frontkamera → Skelett live (26–36 ms pro Bild auf Marcels iPhone) → Schwung nach Schlag + Finish erkannt (ca. 2,2 s) →
Ampelrahmen (grün/gelb/rot/grau) + Kurzwort → beim „Beenden“ werden nur die erkannten Schwünge als Clip + Analyse gespeichert.
Rot = mehrere deutliche Abweichungen (Entscheidung). **iPhone-Test mit echten Schwüngen erfolgt (13.10.): alle Schwünge erkannt, Feedback (Ampel + Kurzwort) gut.** Nicht
einzeln nachgemessen und weiter offen: Gleichlauf Skelett ↔ Clip im gespeicherten Clip (Startverzögerung der Aufnahme, bis
ca. 0,1 s möglich), Wärme/Akku bei langen Sitzungen, Ampel-Schwellen (`ampel.js`, eigene Festlegung) mit vielen Schwüngen
nachjustieren. Front-/Rückkamera wählbar (0.35.0, `localStorage` `liveKamera`).

### 🟢 Priorität 3 – Später / bei Bedarf

- **Teilen mit Freunden**: Die App läuft bei jedem kostenlos, nur der Coach kostet. **Erledigt mit 0.30.0:** schlüsselfreier
  Knopf „Für Claude kopieren“ (legt Anleitung + Kennzahlen in die Zwischenablage, sendet nichts; `baueKopierText` in
  `coach.js`). Eigener Schlüssel ist ebenfalls umgesetzt. Offen: iPhone-Test des Kopierens (Safari-Zwischenablage, siehe
  `docs/iphone-testliste.md` Abschnitt 5b); „Schlüssel je Freund mit Limit“ bleibt eine spätere Option. Datenschutzhinweis
  (V4) ist in der App.
- ~~Coach-Modell Claude Opus 5.5~~ – **umgestellt mit 0.38.0** (Branch `coach-opus-5-5`): `claude-opus-5-5`, Effort „high“
  ausdrücklich, `max_tokens` 32.000, Kosten je Modell (Rückfall Opus 5/4.8 zu 5/25). Offen: Marcels Test (Nr. 2) –
  danach Kostenhinweis „ca. 15–25 Cent“ in App/README ggf. anpassen und „medium“ erneut abwägen.
- **Zeitgrenze beim Video-Laden (S10):** erst nach der iPhone-Messung aus Nr. 1 festlegen.
- **Übungsfiguren von hinten:** Nur Posen zeigen, die die Grenzwerte der App erfüllen (Tests in
  `tests/uebungsbilder.test.mjs`). Von hinten gibt es bisher nur die Ansprechhaltung; Bewegung erst mit einem
  korrekten Profi-Schwung von hinten als Testdatei.
- Einheitlicher Lösch-Dialog auch für „Schwung löschen“ / „Sitzung löschen“ (ca. 20 Zeilen, Check 28.09.).
- LICENSE und Lizenzen der Testdaten-Quellen (C6) · MediaPipe-Update 0.10.14 → 1.x in eigenem Branch (C4).
- **Rückfragen an den Coach** (Idee 29.09.): kleiner Chat unter der Coach-Antwort („Wie übe ich das ohne Range?“).
  Erst nach dem echten Coach-Test (Nr. 2) entscheiden, ob das Kurz-Coaching (0.40.0) reicht.
- **Coach für längere Auswertungen** (Idee 13.10.): Coaching über viele Schwünge (Gesamtauswertung, Fortschritt) –
  länger als beim Einzelschwung, aber klar gegliedert (Muster, ein Fokus für die nächsten Wochen, kurzer Plan).
  Erst nach dem Test des Kurz-Coachings. Sendet zusammengefasste Kennzahlen → neue Datenart: Einwilligung,
  V2 und Datenschutzhinweis anpassen, eigener Plan.

### Dauerhafte Regeln und Hinweise

- **Golfwissen:** `docs/wissen/` ist die belegte Grundlage für neue Tipps und die Wissensseite (jede Aussage mit
  Quelle). **Es gibt keine Golflehrer-Durchsicht** (Entscheidung 30.09.) – deshalb streng: In die App kommt nur, was
  durch Messdaten, Studie oder Regel belegt ist oder was mindestens zwei unabhängige Quellen gleich sagen;
  Umstrittenes nur als „Trainer sind uneins“. **Seit 15.10. Quellen-Stufen:** A = begutachtete Studie, Messdaten, Regeln ·
  B = Fachbuch, Verbandslehrplan · C = Blog/Magazin (nur Hinweis, nie alleiniger Beleg); Technik-Aussagen brauchen
  mindestens eine Quelle A oder B; Tour-Werte nie als Amateur-Erwartung (Regeln im Recherche-Bericht). Neue Schwunggedanken positiv, mit äußerem Fokus (Schläger/Ball/Ziel) oder als Bild formulieren –
  keine Verbote („nicht …“), siehe `docs/wissen/richtig-ueben.md`.
- **Tipps fachlich:** Golf-Technik muss stimmen (Marcels Anforderung: keine falsche Technik). Texte nur in
  `tipps.js` ändern, mit Quelle; danach Liste in `docs/plan-tipps-neu.md` neu erzeugen.
- **C7:** Keine weitere GitHub-Pages-Seite unter MarcelG91 veröffentlichen (alle Pages-Seiten eines Kontos teilen
  sich im Browser den Speicher, also auch Coach-Schlüssel und Schwünge) – außer die App zieht vorher auf eine
  eigene Domain um.
- Erststart-Hänger im lokalen Chrome-Test (28.09., geklärt): Der einfache Python-Server bricht beim ersten Laden
  einzelne Verbindungen ab (`ERR_CONNECTION_RESET`), dann läuft `app.js` nicht an. Live in Ordnung. Lokal: einmal
  neu laden. Seit 0.14.0 bittet die App nach 20 s selbst um Neuladen (S9 erledigt).
