# Sicherheits- und Betriebsbericht

Stand: 28.09.2026 · geprüft auf `origin/main` @ `1f7ea52` (Version 0.10.0) und Branch `speicher-verwalten` @ `01584d9` (Version 0.11.0)
Fortgeschrieben von `/golf-app-check`. Verlauf der Prüfungen: [`pruefprotokoll.md`](pruefprotokoll.md)

**Kurz:** Die App ist im Kern sicher gebaut. Videos verlassen das Handy nicht, und im Repo liegen
weder Videos noch Geheimnisse. Offen sind vor allem die Echtheitsprüfung des nachgeladenen
MediaPipe-Codes, der Schutz von `main` und die Fehlerbehandlung während der Analyse.

> **Regel für diesen öffentlichen Bericht:** keine Geheimnisse und keine Anleitung, wie man eine
> noch offene Lücke ausnutzt. Solche Details stehen nur im Chat.

## Ampel

| Thema | Ampel | Kurzbewertung |
|---|---|---|
| Videos und Datenschutz | Grün | Videos und Kennzahlen bleiben auf dem Handy. Neu (0.11.0): Videos gezielt oder alles löschen – im Browser nachgeprüft: gelöscht wird nur, was die Rückfrage nennt, Level und Offline-Dateien bleiben, der Platz wird frei. V2 betrifft erst Teil 11b. |
| Cybersecurity | Gelb | MediaPipe kommt ohne Echtheitsprüfung von jsDelivr und Google (C1), noch keine CSP (C3). |
| Test und Deploy | Gelb | 84 Tests grün (Branch; `main` 77), dazu Browser-Test der Datenbank 23/23. Schutz von `main` fehlt (T1), kein automatisierter Browser-Test (T3). |
| Stabilität | Gelb | Löschen und Öffnen gespeicherter Sitzungen fangen Fehler ab und geben Knöpfe wieder frei. Offen: Ein Analysefehler sperrt weiter die Knöpfe (S2); ein Ladeabbruch beim ersten Öffnen bleibt ohne Meldung (S9). |
| Geschwindigkeit | Gelb | Warmstart bis „Bereit“ 0,3 s ohne Datenübertragung. Analyse spielt das Video ab statt Bild für Bild zu springen. iPhone-Messung steht noch aus (S8). |

## Befunde

Prio: **P1** = vor der nächsten Etappe · **P2** = in den nächsten Wochen · **P3** = bei Gelegenheit.
Status: **Offen**, **Teilweise**, **Erledigt** (mit Datum/PR), **Akzeptiert** (bewusst so gelassen).

### Videos und Datenschutz (V)

| Nr | Prio | Status | Befund | Maßnahme |
|---|---|---|---|---|
| V1 | P1 | Erledigt 27.09. (PR #6) | Lokaler Testserver war im ganzen WLAN erreichbar. | README: `python3 -m http.server 8000 --bind 127.0.0.1` |
| V2 | P1 vor Etappe 11b | Offen (Weg entschieden 27.09.) | Coach-Feedback mit Claude wäre der erste Weg, auf dem Daten das Handy verlassen. | Kein API-Schlüssel im Code. Marcel hat sich gegen einen Vermittler-Server und für den **eigenen Schlüssel des Nutzers** entschieden (nur auf dem Gerät, eigener Workspace mit Ausgabenlimit, nie in Sicherung/Repo). Nur Kennzahlen senden, vorher sichtbar fragen, README-Versprechen anpassen. Plan: `docs/plan-etappe-11-level-und-coach.md`. |
| V3 | P2 | Erledigt 27.09. (PR #6) | `.gitignore` schützte `IMG_1234.MOV` nur auf dem Mac, einige Formate fehlten. | Groß-/Kleinschreibung, weitere Formate, Video-Wächter-Test. |
| V4 | P3 | Offen | jsDelivr, Google und GitHub sehen IP-Adresse und Zeitpunkt beim Laden. | Für private Nutzung unkritisch. Nutzen Freunde die App, einen kurzen Datenschutzhinweis ergänzen. C1 würde jsDelivr und Google entfernen. |
| V5 | P3 | Offen | Commits tragen die Geschäfts-E-Mail-Adresse, das Repo ist öffentlich. Auch die Merge-Commits von GitHub (PR #16, #17) tragen sie noch. | `git config --global user.email "292231529+MarcelG91@users.noreply.github.com"`, danach in GitHub „Keep my email addresses private“ und „Block command line pushes that expose my email“. |
| V6 | P2 vor Etappe 9 | Offen | Geplante Sicherung mit Videos läge in iCloud Drive nicht Ende-zu-Ende verschlüsselt (außer mit „Erweiterter Datenschutz“). | Sicherung optional mit Passwort verschlüsseln (Web Crypto) oder ohne Videos anbieten. |
| V7 | P3 | Erledigt 27.09. (dieser PR) | `.claude/settings.local.json` (persönliche Claude-Code-Einstellungen) war nicht von Git ausgeschlossen. | In `.gitignore` eingetragen. |

**Gespeicherte Schwünge (Etappe 8), Level (Etappe 11a) und Aufräumen (0.11.0):** Gekürzte Videos, Posedaten und Vorschaubilder liegen nur in der Browser-Datenbank auf dem Handy (IndexedDB). Die aktuelle Levelwahl liegt in `localStorage`, das beim Speichern gewählte Level im Sitzungsobjekt. Es gibt keinen neuen Netzwerkaufruf; `speicher.js` und `videokuerzen.js` senden nichts ins Netz (Wächter-Test in `tests/sicherheit.test.mjs`). Einen Schwung oder eine Sitzung löschen entfernt Schwung, Video, Posedaten und Vorschau gemeinsam in einem Schritt. „Videos und Bilder löschen“ entfernt nur Videos und Vorschaubilder; Kennzahlen, Notizen und Posedaten (nur Zahlen, kein Bild) bleiben. „Alles löschen“ leert die drei Speicher der Datenbank; Level, andere Einstellungen und die Offline-Dateien bleiben, entfernt wird nur der Merker für den nächsten Level-Vorschlag. Vor diesen beiden Aktionen zeigt die App, was gelöscht wird und was bleibt. Im Browser nachgeprüft (28.09.): Es wird genau das Angekündigte gelöscht, und der Platz wird sofort frei. Die App zeigt an, wie viel Speicher belegt ist; Fehler beim Speichern und Löschen werden gemeldet. Geschützt sind die Daten durch den Gerätecode des iPhones. Eigene Verschlüsselung gibt es nicht und ist für Daten auf dem Gerät auch nicht nötig. Wichtig wird das erst bei der Sicherung (V6).

### Cybersecurity (C)

| Nr | Prio | Status | Befund | Maßnahme |
|---|---|---|---|---|
| C1 | P1 | Offen | MediaPipe-Code, Rechenkern und Modell werden ohne Echtheitsprüfung von zwei Anbietern geladen. Dieser Code sieht jedes Videobild. | Dateien selbst ausliefern (Build mit Prüfsummen) oder Prüfsummen im Service Worker kontrollieren. Größerer Umbau, nur nach Absprache. |
| C2 | P1 | Offen (nur Marcel prüfbar) | Das GitHub-Konto ist der Generalschlüssel zur App. | Zwei-Faktor mit Passkey oder App, Wiederherstellungscodes sichern, ungenutzte Tokens löschen. |
| C3 | P2 | Offen | Keine Content Security Policy. | Nach C1 als `<meta>`-Tag: nur eigene Dateien, `'wasm-unsafe-eval'`, Daten nur an die eigene Adresse. In Safari und Chrome testen. |
| C4 | P3 | Offen | MediaPipe 0.10.14 ist gepinnt, aktuell ist 1.0.1. | Kein Eil-Update. Später gezielt in eigenem Branch mit Tests. |
| C5 | P3 | Akzeptiert | Schutz gegen Einbetten in fremde Seiten ist auf GitHub Pages nicht setzbar. | Kein Login, keine Zahlungen, daher geringes Risiko. |
| C6 | P3 | Offen | Kein LICENSE, Lizenzen der Testdaten-Quellen nicht vermerkt. | In `tests/daten/QUELLEN.md` ergänzen oder später eigene Schwünge verwenden. |

### Test und Deploy (T)

| Nr | Prio | Status | Befund | Maßnahme |
|---|---|---|---|---|
| T1 | P1 | Offen (nicht bestätigt) | `main` ist ohne Regel gegen direkte Pushes. | Ruleset: nur per Pull Request, 0 Approvals, Pflicht-Check „Tests“, kein Force-Push, kein Löschen. |
| T2 | P1 | Erledigt 27.09. (PR #6) | Tests liefen nur von Hand. | Workflow `.github/workflows/pruefen.yml` bei jedem Pull Request. |
| T3 | P2 | Offen | Kein Test im echten Browser. | Playwright-Rauchtest: Seite lädt, „Bereit“ erscheint, keine Konsolenfehler. Alternative ohne Zusatzbibliothek: Chrome ohne Fenster über das DevTools-Protokoll (beim Check am 28.09. lokal genutzt). |
| T4 | P2 | Erledigt 27.09. (PR #9, CLAUDE.md) | Versionsmix nach Updates, Versionsnummer blieb stehen. | Versionsnummer wird bei jeder App-Änderung erhöht, Regel steht in `CLAUDE.md`. |
| T5 | P3 | Erledigt 27.09. (PR #4) | Branch `technik-tipps` lag hinter `main`. | Gemergt. |
| T6 | P3 | Erledigt 27.09. (PR #6) | Kein beschriebener Rückweg bei Problemen. | Abschnitt „Rückweg“ im README. |

### Stabilität (S)

| Nr | Prio | Status | Befund | Maßnahme |
|---|---|---|---|---|
| S1 | P1 | Erledigt 27.09. (Etappe 7) | App startete ohne Internet nicht. | Service Worker speichert App und Pose-Erkennung. |
| S2 | P1 | Teilweise | `analysiereAlles()` fängt Fehler beim Laden eines Videos ab; Löschen und Öffnen gespeicherter Sitzungen fangen Fehler ab und geben Knöpfe frei (0.11.0). Scheitert aber die Analyse selbst, bleiben alle Knöpfe gesperrt, bis die Seite neu geladen wird. | `try/finally` um die ganze Analyse, verständliche Meldung, Knöpfe immer wieder freigeben. |
| S3 | P2 | Offen | Keine Längengrenze und keine Prüfung, ob die Videolänge endlich ist. | `Number.isFinite(video.duration)` prüfen, ab etwa 20 s pro Video einen Hinweis zeigen. |
| S4 | P2 | Erledigt 27.09. | Zeichenfläche war so groß wie das Video (bei 4K rund 33 MB). | Auf höchstens 1280 px begrenzt. |
| S5 | P2 | Erledigt 28.09. (PR #16) | Beim Laden eines Videos entsteht eine Browser-Adresse (`URL.createObjectURL`), die nie freigegeben wird. Mit mehreren Videos pro Analyse wächst der Speicher. | Die alte Adresse wird beim Laden des nächsten Videos freigegeben. Seit 0.11.0 auch, wenn ein gelöschtes Video aus dem Player genommen wird. |
| S6 | P3 | Erledigt 28.09. (PR #16) | „Posedaten speichern“ gibt die Datei-Adresse sofort nach dem Klick frei. Safari auf dem iPhone findet die Datei dann oft nicht mehr. | Die Freigabe erfolgt verzögert nach 60 s. |
| S7 | P3 | Offen | Unerwartete Fehler landen nur in der Entwicklerkonsole. | Zentrale Fehleranzeige in der Statuszeile. |
| S8 | P1 | Teilweise | Videos brauchen auf dem iPhone lange, bis sie in der App sind. Die Ursache liegt meist vor der App (Umwandeln in Safari, iCloud-Download, 4K). | Tipps im README (PR #6). Analyse deutlich schneller (PR #8), Statuszeile zeigt Messwerte. Offen: iPhone-Messung auswerten, Ladezeit des Videos selbst messen. |
| S9 | P3 | Offen | Kommt beim allerersten Öffnen eine App-Datei nicht an (z. B. schlechtes Netz), bleibt die App ohne Hinweis bei „Lade die Pose-Erkennung …“ stehen. Lokal nachgestellt, live nicht beobachtet. | `pwa.js` prüft nach ca. 20 s, ob `app.js` gestartet ist, und bittet sonst um Neuladen. Mit S7 im Branch `robuste-analyse`. |

### Geschwindigkeit (Messwerte vom 27.09., Mac, schnelles Netz)

| Datei | Anbieter | Übertragen | Zwischenspeicher |
|---|---|---|---|
| Seite und eigener Code | GitHub Pages | ca. 15 KB | 10 Minuten |
| MediaPipe-Programmcode | cdn.jsdelivr.net | 92 KB | 1 Jahr |
| MediaPipe-Rechenkern (WASM) | cdn.jsdelivr.net | 2,6 MB | 1 Jahr |
| Pose-Modell „full“ | storage.googleapis.com | 9,4 MB | 1 Stunde (seit Etappe 7 dauerhaft im Service Worker) |

Warmstart bis „Bereit“: 0,3 s ohne Datenübertragung (28.09., Mac, schnelles Netz). Der Kaltstart (rund 12 MB) fällt seit Etappe 7 nur einmal an.

## Umsetzungsplan

| Etappe | Inhalt | Status |
|---|---|---|
| S0 GitHub-Einstellungen | C2 Zwei-Faktor, T1 Regel für `main`, V5 E-Mail privat | Offen |
| S1 Sicherheitsnetz | T2, V3, V1, T6 | Erledigt 27.09. (PR #6) |
| S2 Robuste Analyse | S2, S3, S7, S9, Rest von S8 (S5, S6 erledigt) | Offen – nächster Branch `robuste-analyse` |
| S3 Echtheit und Browser-Test | C1, T3, C4 | Offen, nur nach Absprache |
| S4 Hausordnung | C3 | Offen, nach S3 |
| Vor Etappe 9 | V6 | Offen |
| Vor Etappe 11b | V2 | Offen (Weg entschieden 27.09.) |

## Quellen

- [GitHub Pages: Grenzen und Nutzungsregeln](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [WebKit: 7-Tage-Grenze und Ausnahme für Home-Bildschirm-Apps](https://webkit.org/tracking-prevention/)
- [Blob-Download scheitert auf dem iPhone bei zu früher Freigabe](https://dev.to/jamiebuildsfree/the-download-button-worked-everywhere-except-iphone-9ka)
- [Apple Developer Forums: Safari komprimiert Videos aus der Fotos-Mediathek](https://developer.apple.com/forums/thread/731042)
- [Apple Support: HEIF/HEVC und „Maximale Kompatibilität“](https://support.apple.com/en-us/116944)
