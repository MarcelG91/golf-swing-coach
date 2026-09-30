# Plan: Wissensseite in der App (Etappe „Wissen“)

Stand: 30.09.2026 · Branch `wissensdatenbank` (nur Sammeln + Planen, noch kein App-Code)

## Warum

Die App sagt heute, **was** an einem Schwung auffällt (Baustellen-Karten). Beim Golf-Lernen fehlt oft das
**Warum und Wie drumherum**: Ballflug verstehen, Griff, kurzes Spiel, Regeln, richtig üben. Eine
Wissensseite bündelt geprüftes Wissen offline in der App – und die Tipps können darauf verweisen
(„Mehr dazu im Wissen“).

## Grundsätze

| Frage | Vorschlag |
|---|---|
| Wo liegt das Wissen? | Quelle der Wahrheit sind die Markdown-Dateien in `docs/wissen/` (für Menschen und Golflehrer prüfbar). Für die App wird daraus später `wissen.js` (reine Daten, offline, in `sw.js`/`pwa.js` eintragen). |
| Wie lang? | Wie bei den Tipps: kurz und bildlich. Pro Artikel: 1 Satz Kern, 3–6 Stichpunkte, optional 1 Übung. Längere Hintergründe in `docs/wissen/`, nicht in der App. |
| Level | Jeder Artikel trägt ein Level (🌱/🌿/🌳). Die Seite zeigt zuerst Artikel bis zum gewählten Level, der Rest ist aufklappbar. |
| Fachlich richtig | Jede Aussage mit Quelle in `docs/wissen/`. Belegtes (Messdaten, Regeln, Studien) schlägt Meinung. Wo Trainer uneins sind, steht das dabei. |
| Urheberrecht | Nur eigene Worte, keine übernommenen Texte, Bilder oder Videos. Links auf Videos nur als Quellenangabe, nicht eingebettet (offline + Datenschutz: kein YouTube-Einbetten, keine neuen Adressen). |
| Sicherheit | Die Wissensseite ist rein statisch: keine Netzwerkzugriffe, Texte per `textContent`, keine neuen Hosts. Externe Links nur als normale Links mit `rel="noopener"` – oder ganz weglassen (Entscheidung offen, siehe unten). |

## Aufbau (Kapitel → Artikel)

Neuer vierter Knopf in der Leiste: **📖 Wissen**. Oben ein Suchfeld (einfacher Textfilter), darunter die Kapitel.

| # | Kapitel | Artikel (Level) | Datei in `docs/wissen/` |
|---|---|---|---|
| 1 | **Erste Schritte** | Wie lernt man Golf? (🌱) · Der Schlägersatz (🌱) · Platzreife & Handicap (🌱) | `erste-schritte.md` |
| 2 | **Ansprechen (Set-up)** | Griff (🌱) · Ausrichtung (🌱) · Stand & Ballposition (🌱) · Haltung (🌱) · Routine vor dem Schlag (🌿) | `grundlagen.md` |
| 3 | **Der Vollschwung** | Die Phasen P1–P10 (🌱) · Rückschwung & Top (🌿) · Übergang & Abschwung (🌿) · Treffmoment (🌿) · Finish (🌱) · Tempo & Rhythmus (🌱) · Driver vs. Eisen (🌿) | `vollschwung.md` |
| 4 | **Ballflug verstehen** | Die Ballfluggesetze (🌿) · Treffpunkt auf der Schlagfläche (🌿) · Slice, Hook, Push, Pull (🌱) · Getoppt, fett, Shank, Sky (🌱) | `ballflug-und-fehler.md` |
| 5 | **Kurzes Spiel** | Chippen (🌱) · Pitchen (🌿) · Bunker (🌿) · Längenkontrolle (🌿) | `kurzes-spiel.md` |
| 6 | **Putten** | Set-up & Pendel (🌱) · Länge (🌱) · Grüns lesen (🌿) · Putt-Übungen (🌱) | `putten.md` |
| 7 | **Auf dem Platz** | Strategie / Course Management (🌿) · Schlägerwahl (🌱) · Hanglagen (🌿) · Rough, Wind, Nässe (🌳) | `platzstrategie.md` |
| 8 | **Kopf & Körper** | Routine & Nervosität (🌿) · Aufwärmen (🌱) · Beweglichkeit (TPI) (🌿) · Rücken schonen (🌱) | `mental-und-fitness.md` |
| 9 | **Richtig üben** | Wie das Gehirn Bewegungen lernt (🌱) · Range-Plan (🌱) · Üben mit der App (🌱) | `richtig-ueben.md` |
| 10 | **Regeln & Etikette** | Die wichtigsten Regeln (🌱) · Strafen & Erleichterung (🌱) · Etikette & Spieltempo (🌱) | `regeln-etikette.md` |
| 11 | **Ausrüstung** | Welche Schläger am Anfang? (🌱) · Fitting (🌿) · Der richtige Ball (🌿) | `ausruestung.md` |
| 12 | **Nachschlagen** | Glossar (🌱) · Irrtümer (🌱) | `glossar.md`, `irrtuemer.md` |
| – | **Quellen & Profile** | YouTube, Instagram, Webseiten, Bücher – bewertet | `quellen.md` |

## Verknüpfung mit den Baustellen-Karten

`docs/wissen/abgleich-app.md` hält fest, welche Kennzahl zu welchem Artikel passt (z. B. `hueftSway` →
„Rückschwung & Top“, `tempo` → „Tempo & Rhythmus“). Auf der Karte könnte später ein kleiner Link
„📖 Mehr dazu“ stehen.

## Offene Entscheidungen (für Marcel, vor dem Bau)

1. **Externe Links** zu YouTube/Instagram in der App zeigen? Vorteil: direkt zum Video. Nachteil: Nutzer
   verlässt die App, Drittanbieter-Tracking. Vorschlag: nur in `docs/wissen/quellen.md`, in der App höchstens
   ein Hinweis „Quelle: …“ als Text.
2. **Bilder** zu den Artikeln: vorhandene Strichfiguren (`strichfigur.js`, `uebungsbilder.js`) wiederverwenden
   oder nur Text? Vorschlag: Anfang nur Text, Figuren dort, wo es sie schon gibt.
3. **Umfang der ersten Version**: alle 12 Kapitel oder erst 🌱-Artikel? Vorschlag: erst Kapitel 2–6 + 10.

## Umsetzung (späterer Branch `wissensseite`)

- `wissen.js`: Kapitel und Artikel als Daten (reine Logik, Test prüft Längen wie bei `tipps.js`).
- `index.html` / `app.js`: vierter Bereich „Wissen“, Liste + Artikelansicht, Suchfeld.
- `sw.js`, `pwa.js`: `wissen.js` in `APP_DATEIEN`; `APP_VERSION` erhöhen.
- Test: jede Aussage in `wissen.js` hat eine Quelle in `docs/wissen/` (Kennung wie `Q-TPI`).
