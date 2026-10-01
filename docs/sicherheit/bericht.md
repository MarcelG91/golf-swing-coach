# Sicherheits- und Betriebsbericht

Stand: 01.10.2026 · geprüft auf `origin/main` @ `9773ca2` (Version 0.24.0, live) und Branch `wissen-nachschlagen` (Version 0.25.0)
Fortgeschrieben von `/golf-app-check`. Verlauf der Prüfungen: [`pruefprotokoll.md`](pruefprotokoll.md)

**Kurz:** Die App ist im Kern sicher gebaut. Videos, Bilder und Posedaten verlassen das Handy nie,
und im Repo liegen weder Videos noch Geheimnisse. Seit 0.15.0 gibt es den **ersten gewollten
Datenweg**: Der freiwillige Coach sendet nach Einwilligung nur Kennzahlen an `api.anthropic.com`,
mit dem eigenen API-Schlüssel des Nutzers (V2). Seit 0.17.0 gehen dabei alle gemessenen Kennzahlen
mit (die über dem Level nur als Hintergrund); eine ältere Einwilligung gilt dafür nicht mehr. Offen
sind vor allem die Echtheitsprüfung des nachgeladenen Fremdcodes – auch des Anthropic-SDK, das den
Schlüssel sieht (C1) – und ein automatischer Test im echten Browser (T3). `main` ist per Regel
geschützt, das GitHub-Konto ist abgesichert und die E-Mail-Adresse privat (Etappe S0 erledigt).

> **Regel für diesen öffentlichen Bericht:** keine Geheimnisse und keine Anleitung, wie man eine
> noch offene Lücke ausnutzt. Solche Details stehen nur im Chat.

## Ampel

| Thema | Ampel | Kurzbewertung |
|---|---|---|
| Videos und Datenschutz | Grün | Videos, Bilder und Posedaten bleiben auf dem Handy. Kennzahlen verlassen das Gerät nur über den freiwilligen Coach: eigener Schlüssel, Einwilligung, feste Auswahl der Felder (Test), Vorschau „Was wird gesendet?“. Im Code und im Browser (abgefangene Anfrage) geprüft: kein Dateiname, keine Notiz, kein Datum, keine Posedaten in der Anfrage; Antworten nur per `textContent`. Seit dem Check-Fix 0.17.1 nennt die Einwilligung jedes gesendete Feld (Test, V8). Der Lernfortschritt der Wissensseite (0.22.0) ist nur eine Liste von Lektions-IDs im `localStorage`, verlässt das Gerät nie und bleibt bei „Alles löschen“ erhalten (Test). „Nachschlagen“ (0.25.0) speichert nichts Neues: Suche und gewählte Ansicht leben nur bis zum Neuladen (`localStorage` vorher = nachher gemessen). |
| Cybersecurity | Gelb | MediaPipe und das Anthropic-SDK (feste Versionen) kommen ohne Echtheitsprüfung von jsDelivr und Google (C1); das SDK sieht den API-Schlüssel. Noch keine CSP (C3). Der Schlüssel liegt im Browser (bewusst, mit Ausgabenlimit). |
| Test und Deploy | Gelb | 146 Tests grün im Branch `wissen-nachschlagen` (`main` 137). CI auf `main` grün, Live-Stand gleich `main` (0.24.0). `main` ist per Regel geschützt (T1). Offen: kein automatisierter Browser-Test in der CI (T3), echter Coach-Test mit Marcels Schlüssel. |
| Stabilität | Grün | Analyse, Speichern, Löschen und Coach geben die Knöpfe immer wieder frei, unerwartete Fehler stehen in der Statuszeile, Videos ohne bekannte Länge werden abgelehnt. Coach: nur eine Anfrage zur Zeit (S11); seit dem Check-Fix 0.17.1 wird die Antwort auch nach einem Rückfall auf ein anderes Modell vollständig gelesen (S12). Offen nur S10 (P3). |
| Geschwindigkeit | Gelb | Live 01.10. (Mac, frisches Profil): „Bereit“ nach 0,7 s, „Offline bereit ✓“ nach 0,8 s; Warmstart 0,5 s ohne Datenübertragung. Bewegte Figuren (Übungsmodus, Wissensseite) laufen mit ca. 30 Bildern pro Sekunde und nur, solange sie zu sehen sind. Analyse spielt das Video ab statt Bild für Bild zu springen. Die Statuszeile zeigt seit 0.14.0 auch die Ladezeit des Videos; iPhone-Messung steht noch aus (S8). |

## Befunde

Prio: **P1** = vor der nächsten Etappe · **P2** = in den nächsten Wochen · **P3** = bei Gelegenheit.
Status: **Offen**, **Teilweise**, **Erledigt** (mit Datum/PR), **Akzeptiert** (bewusst so gelassen).

### Videos und Datenschutz (V)

| Nr | Prio | Status | Befund | Maßnahme |
|---|---|---|---|---|
| V1 | P1 | Erledigt 27.09. (PR #6) | Lokaler Testserver war im ganzen WLAN erreichbar. | README: `python3 -m http.server 8000 --bind 127.0.0.1` |
| V2 | P1 vor Etappe 11b | Erledigt 28.09. (PR #23, 0.15.0 + Check-Fix 0.15.1; erweitert 29.09. mit 0.17.0) | Coach-Feedback mit Claude ist der erste Weg, auf dem Daten das Handy verlassen. | Umgesetzt wie entschieden: **eigener Schlüssel des Nutzers** nur im `localStorage` des Geräts (nie im Code, in der Datenbank oder im Export; angezeigt werden nur die letzten 4 Zeichen). Gesendet wird nur eine feste Auswahl (`coachDaten()` in `coach.js`: Level, Ansicht, Händigkeit, Anzahl Schwünge, Kennzahlen mit Name/Wert/Bewertung/Zielbereich – seit 0.17.0 alle gemessenen, die über dem Level als `hintergrundKennzahlen` –, kurzer Verlauf) – Test mit Dateiname, Notiz, Datum und Posedaten als Köder. Weil 0.17.0 mehr Kennzahlen sendet, gilt eine ältere Einwilligung nicht mehr (neuer gespeicherter Wert). Einwilligung vor dem ersten Senden; „Schlüssel löschen“ nimmt sie zurück (Check-Fix). Einzige neue Adresse `api.anthropic.com`, im Code ausdrücklich gesetzt und per Test auf `app.js` beschränkt. README-Versprechen angepasst. Offen: echter Test mit Marcels Schlüssel. |
| V3 | P2 | Erledigt 27.09. (PR #6) | `.gitignore` schützte `IMG_1234.MOV` nur auf dem Mac, einige Formate fehlten. | Groß-/Kleinschreibung, weitere Formate, Video-Wächter-Test. |
| V4 | P3 | Offen | jsDelivr, Google und GitHub sehen IP-Adresse und Zeitpunkt beim Laden; wer den Coach nutzt, zusätzlich Anthropic. | Für private Nutzung unkritisch. Der Einwilligungsdialog des Coachs nennt IP-Adresse und Browserkennung. Nutzen Freunde die App, einen kurzen Datenschutzhinweis für die ganze App ergänzen. C1 würde jsDelivr und Google entfernen. |
| V5 | P3 | Erledigt 28.09., manuell (ältere Commits akzeptiert) | Ältere Commits tragen die Geschäfts-E-Mail-Adresse, das Repo ist öffentlich. | Globale Git-Einstellung auf dem Mac ist die noreply-Adresse; in GitHub sind „Keep my email addresses private“ und „Block command line pushes that expose my email“ an. Die Historie wird bewusst nicht umgeschrieben (bräuchte Force-Push). Merge-Commits von GitHub beim nächsten PR stichprobenartig prüfen. |
| V6 | P2 vor Etappe 9 | Offen | Geplante Sicherung mit Videos läge in iCloud Drive nicht Ende-zu-Ende verschlüsselt (außer mit „Erweiterter Datenschutz“). | Sicherung optional mit Passwort verschlüsseln (Web Crypto) oder ohne Videos anbieten. |
| V7 | P3 | Erledigt 27.09. (dieser PR) | `.claude/settings.local.json` (persönliche Claude-Code-Einstellungen) war nicht von Git ausgeschlossen. | In `.gitignore` eingetragen. |
| V8 | P3 | Erledigt 29.09. (Check-Fix 0.17.1, Branch `check-2026-09-29`) | Der Einwilligungsdialog des Coachs nannte zwei Felder nicht, die gesendet werden: die Anzahl erkannter Schwünge und die wichtigste Baustelle aus Sicht der App. Beides ist aus denselben Messungen abgeleitet (keine neue Art von Daten); die Vorschau „Was wird gesendet?“ zeigte sie schon. | Dialog und README ergänzt. Neuer Test: Jedes Feld aus `coachDaten()` muss im Dialog stehen – kommt ein Feld dazu, schlägt der Test an (dann Dialog ergänzen und bei neuer Datenart `EINWILLIGUNG_WERT` ändern). Die gespeicherte Einwilligung bleibt gültig, weil sich an den gesendeten Daten nichts ändert. |

**Gespeicherte Schwünge (Etappe 8), Level (Etappe 11a) und Aufräumen (0.11.0):** Gekürzte Videos, Posedaten und Vorschaubilder liegen nur in der Browser-Datenbank auf dem Handy (IndexedDB). Die aktuelle Levelwahl liegt in `localStorage`, das beim Speichern gewählte Level im Sitzungsobjekt. Es gibt keinen neuen Netzwerkaufruf; `speicher.js` und `videokuerzen.js` senden nichts ins Netz (Wächter-Test in `tests/sicherheit.test.mjs`). Einen Schwung oder eine Sitzung löschen entfernt Schwung, Video, Posedaten und Vorschau gemeinsam in einem Schritt. „Videos und Bilder löschen“ entfernt nur Videos und Vorschaubilder; Kennzahlen, Notizen und Posedaten (nur Zahlen, kein Bild) bleiben. „Alles löschen“ leert die drei Speicher der Datenbank; Level, andere Einstellungen und die Offline-Dateien bleiben, entfernt wird nur der Merker für den nächsten Level-Vorschlag. Vor diesen beiden Aktionen zeigt die App, was gelöscht wird und was bleibt. Im Browser nachgeprüft (28.09.): Es wird genau das Angekündigte gelöscht, und der Platz wird sofort frei. Die App zeigt an, wie viel Speicher belegt ist; Fehler beim Speichern und Löschen werden gemeldet. Geschützt sind die Daten durch den Gerätecode des iPhones. Eigene Verschlüsselung gibt es nicht und ist für Daten auf dem Gerät auch nicht nötig. Wichtig wird das erst bei der Sicherung (V6).

**Tipps neu (0.12.0):** Neue Texte (Kurzzeile, Warum, Schwunggedanke, Übung, Skala) stehen fest in `tipps.js` und kommen nur per `textContent` in die Seite. Der Schwunggedanke wird zusätzlich im Sitzungsobjekt gespeichert und ebenfalls nur per `textContent` angezeigt. Die Strichfigur wird aus den vorhandenen Posedaten als SVG gezeichnet (einziges `innerHTML` mit festem Text); es gibt keinen neuen Netzwerkaufruf und keine neue Adresse. Seit dem Check-Fix prüft ein Test, dass die Rechenlogik-Dateien keinen Browser-Code enthalten.

**Übungsmodus (0.13.0):** Vollbild-Übungen mit Strichfiguren. Die Figuren kommen aus der neuen Rechenlogik `uebungsbilder.js` (feste Posen, kein Browser-Code, eigene Tests) und werden als SVG gezeichnet: einziges `innerHTML` ist fester Text, Beschriftungen und Übungstexte kommen per `textContent`. Kein neuer Netzwerkaufruf, keine neue Adresse, nichts wird gespeichert. Die Animation (ca. 30 Bilder pro Sekunde, höchstens 19 Elemente pro Bild) stoppt beim Schließen und beim Seitenwechsel. Der Bildschirm bleibt während der Übung an (Wake Lock) und wird beim Schließen freigegeben. Seit dem Check-Fix (0.13.1) ist die Seite dahinter für Tastatur und Bildschirmleser gesperrt, solange der Übungsmodus offen ist.

**Coach mit Claude (0.15.0, Check-Fix 0.15.1):** Der Coach erscheint nur mit eigenem API-Schlüssel. Vor dem ersten Senden fragt ein Dialog um Einwilligung; unter dem Knopf steht immer, dass Kennzahlen an Anthropic gehen, und „Was wird gesendet?“ zeigt genau die Daten der Anfrage. Das SDK wird erst nach Einwilligung und nur mit Schlüssel geladen. Die Antwort wird geprüft (Fokus nur aus den gemessenen Baustellen, Texte und Listen gekürzt) und nur per `textContent` gezeigt; Schwunggedanke und Übung zum Fokus kommen immer aus `tipps.js`. Seit 0.17.0 schreibt Claude zusätzlich ausführliche Erklärungen und einen Trainingsplan (Leitplanken im Systemtext, Hinweis „fachlich geprüft ist nur die Übung der App“ unter jeder Antwort) und die Antwort kommt als Datenstrom – an Adresse und gesendeten Feldern ändert das nichts. Bei gespeicherten Schwüngen trägt die App nur das Feld `coach` in den vorhandenen Eintrag nach – wurde der Schwung inzwischen gelöscht, passiert nichts. „Videos löschen“ behält Coach-Antworten, „Alles löschen“ entfernt sie; Schlüssel und Level bleiben. Fehlermeldungen sind feste Texte, SDK-Fehlertexte gehen nur in die Entwicklerkonsole. Der Service Worker leitet die Anfragen an Anthropic (POST) nur durch und speichert sie nicht; das SDK selbst (feste Version, dazu drei kleine Hilfsdateien) legt er nach dem ersten Laden wie jede jsDelivr-Datei im Offline-Speicher ab. Check 29.09.: SDK 0.129.0 ist die aktuelle Version, auch die drei Hilfsdateien sind fest versioniert; Anfrage (Modell, Rückfall-Modus mit passender Beta-Kennung, adaptives Denken, strukturierte Antwort, Datenstrom) passt zur aktuellen API. Im Browser mit abgefangener Anfrage geprüft: genau eine Anfrage, gesendete Daten gleich der Vorschau. Seit dem Check-Fix 0.17.1 wird die Antwort auch nach einem Rückfall auf ein anderes Modell mitten im Datenstrom vollständig gelesen (S12).

**Wissensseite (0.22.0):** Neuer Bereich „📖 Wissen“ mit Lernpfaden. Lektionen, Quiz, Quellen und Schaubilder stehen als feste Daten in `wissen.js` und `schaubilder.js` (Rechenlogik ohne Browser-Code, eigene Tests) und kommen nur per `textContent` in die Seite. Die SVG-Schaubilder nutzen nur feste Farbnamen aus `style.css`, einziges `innerHTML` ist fester Text. Quellen erscheinen nur als Name, ohne Link (Test). Es gibt keinen Netzwerkaufruf und keine neue Adresse. Der Lernfortschritt ist eine Liste erledigter Lektions-IDs im `localStorage` (`wissenFortschritt`), gelesen mit Fehlerbehandlung; unbekannte oder kaputte Einträge werden ignoriert. „Alles löschen“ lässt ihn stehen und sagt das im Dialog (Test in `tests/sicherheit.test.mjs`).

**Wissensseite Pfade 2 + 3 (0.23.0):** Zwei weitere Lernpfade, zwölf Schaubilder, eine bewegte Figur (P1–P10) und die Karte „Ballflug-Helfer“. Alles sind feste Daten in `wissen.js` und `schaubilder.js`; es gibt keine neue Datei, keinen Netzwerkaufruf, keine neue Adresse und kein neues `innerHTML` (im Browser gemessen: 0 Anfragen). Die Knöpfe des Helfers liefern nur feste Werte, unbekannte Werte ergeben „kein Ergebnis“ (Test). Die Animation läuft nur, solange ihre Karte zu sehen ist, und stoppt beim Wegwischen, „Alle Lektionen“ und Bereichswechsel; bei „Bewegung reduzieren“ gibt es nur das Endbild (im Browser gemessen). Es wird nichts Neues gespeichert.

**Wissensseite Pfade 4–6 (0.24.0):** Drei weitere Lernpfade (18 Lektionen), 19 Schaubilder und eine bewegte Figur „Probeschwung“. Wieder nur feste Daten, keine neue Datei, kein Netzwerkaufruf, keine neue Adresse, kein neues `innerHTML`, nichts Neues gespeichert (im Browser gemessen: 0 Anfragen). Ein Test stellt sicher, dass bewegte Figuren nie rückwärts laufen. Gesundheitliches nur allgemein (Aufwärmen), Selbsttests ausdrücklich „keine Diagnose“ mit Arzt-Hinweis.

### Cybersecurity (C)

| Nr | Prio | Status | Befund | Maßnahme |
|---|---|---|---|---|
| C1 | P1 | Offen (seit 0.15.0 erweitert) | MediaPipe-Code, Rechenkern und Modell werden ohne Echtheitsprüfung von zwei Anbietern geladen. Dieser Code sieht jedes Videobild. Seit 11b kommt das Anthropic-SDK dazu (von jsDelivr erzeugte Bündel, feste Version): Es läuft nur bei Coach-Nutzern, sieht dann aber den API-Schlüssel und läuft mit denselben Rechten wie die App. | Dateien selbst ausliefern (Build mit Prüfsummen) oder Prüfsummen im Service Worker kontrollieren – das SDK gleich mit einbeziehen. Bis dahin begrenzt das Ausgabenlimit des eigenen Workspaces den Schaden. Größerer Umbau, nur nach Absprache. |
| C2 | P1 | Erledigt 28.09., manuell | Das GitHub-Konto ist der Generalschlüssel zur App. | Zwei-Faktor mit Authenticator-App und Passkey, Wiederherstellungscodes sicher abgelegt, Sitzungen, Tokens, Apps und SSH-Schlüssel aufgeräumt. Nur der Zugang der Kommandozeile bleibt. Einziger Mitarbeiter am Repo ist das Hauptkonto. |
| C3 | P2 | Offen | Keine Content Security Policy. | Nach C1 als `<meta>`-Tag: nur eigene Dateien, `'wasm-unsafe-eval'`; Verbindungen nur zur eigenen Adresse, zu den zwei Anbietern der Pose-Erkennung und (Coach) zu `api.anthropic.com`. In Safari und Chrome testen. |
| C4 | P3 | Offen | MediaPipe 0.10.14 ist gepinnt, aktuell ist 1.0.1 (geprüft 29.09.). | Kein Eil-Update. Später gezielt in eigenem Branch mit Tests. |
| C5 | P3 | Akzeptiert | Schutz gegen Einbetten in fremde Seiten ist auf GitHub Pages nicht setzbar. | Kein Login, keine Zahlungen, daher geringes Risiko. |
| C6 | P3 | Offen | Kein LICENSE, Lizenzen der Testdaten-Quellen nicht vermerkt. | In `tests/daten/QUELLEN.md` ergänzen oder später eigene Schwünge verwenden. |
| C7 | P3 | Offen (derzeit kein Risiko) | Alle GitHub-Pages-Seiten eines Kontos teilen sich im Browser einen Speicherbereich (Level, Lernfortschritt, Coach-Schlüssel, Schwung-Datenbank). Derzeit hat das Konto nur diese eine Pages-Seite (per API geprüft 28.09., 29.09. und 30.09.). | Keine weitere Pages-Seite unter diesem Konto veröffentlichen – oder die App vorher auf eine eigene (Sub-)Domain umziehen. Bei jedem Check prüfen. |

### Test und Deploy (T)

| Nr | Prio | Status | Befund | Maßnahme |
|---|---|---|---|---|
| T1 | P1 | Erledigt 28.09. (Ruleset „main schützen“) | `main` war ohne Regel gegen direkte Pushes. | Ruleset aktiv, ohne Ausnahmen: nur per Pull Request (0 Approvals), Pflicht-Check „Tests“, kein Force-Push, kein Löschen. Geprüft per GitHub-API. |
| T2 | P1 | Erledigt 27.09. (PR #6) | Tests liefen nur von Hand. | Workflow `.github/workflows/pruefen.yml` bei jedem Pull Request. |
| T3 | P2 | Offen | Kein Test im echten Browser. | Playwright-Rauchtest: Seite lädt, „Bereit“ erscheint, keine Konsolenfehler. Alternative ohne Zusatzbibliothek: Chrome ohne Fenster über das DevTools-Protokoll (bei den Checks am 28.09. und 29.09. lokal genutzt, noch nicht in der CI). |
| T4 | P2 | Erledigt 27.09. (PR #9, CLAUDE.md) | Versionsmix nach Updates, Versionsnummer blieb stehen. | Versionsnummer wird bei jeder App-Änderung erhöht, Regel steht in `CLAUDE.md`. |
| T5 | P3 | Erledigt 27.09. (PR #4) | Branch `technik-tipps` lag hinter `main`. | Gemergt. |
| T6 | P3 | Erledigt 27.09. (PR #6) | Kein beschriebener Rückweg bei Problemen. | Abschnitt „Rückweg“ im README. |

### Stabilität (S)

| Nr | Prio | Status | Befund | Maßnahme |
|---|---|---|---|---|
| S1 | P1 | Erledigt 27.09. (Etappe 7) | App startete ohne Internet nicht. | Service Worker speichert App und Pose-Erkennung. |
| S2 | P1 | Erledigt 28.09. (Branch `robuste-analyse`, 0.14.0/0.14.1) | Scheiterte die Analyse selbst, blieben alle Knöpfe gesperrt, bis die Seite neu geladen wurde. | `try/catch/finally` um die ganze Analyse, pro Video eigene Fehlerbehandlung (die anderen Videos laufen weiter), Knöpfe im `finally` frei. Check-Fix 0.14.1: Verweigert der Browser beim Speichern das Abspielen, wird der Schwung ohne Video gespeichert, statt dass das Speichern hängt. |
| S3 | P2 | Erledigt 28.09. (Branch `robuste-analyse`, 0.14.0/0.14.1) | Keine Längengrenze und keine Prüfung, ob die Videolänge endlich ist. | `pruefeVideoLaenge()` in `videoanalyse.js` (mit Tests): unbekannte Länge = nicht lesbar, ab 20 s ein Hinweis. Check-Fix 0.14.1: Die Prüfung greift auch beim ersten, schon vorgeladenen Video. |
| S4 | P2 | Erledigt 27.09. | Zeichenfläche war so groß wie das Video (bei 4K rund 33 MB). | Auf höchstens 1280 px begrenzt. |
| S5 | P2 | Erledigt 28.09. (PR #16) | Beim Laden eines Videos entsteht eine Browser-Adresse (`URL.createObjectURL`), die nie freigegeben wird. Mit mehreren Videos pro Analyse wächst der Speicher. | Die alte Adresse wird beim Laden des nächsten Videos freigegeben. Seit 0.11.0 auch, wenn ein gelöschtes Video aus dem Player genommen wird. |
| S6 | P3 | Erledigt 28.09. (PR #16) | „Posedaten speichern“ gibt die Datei-Adresse sofort nach dem Klick frei. Safari auf dem iPhone findet die Datei dann oft nicht mehr. | Die Freigabe erfolgt verzögert nach 60 s. |
| S7 | P3 | Erledigt 28.09. (Branch `robuste-analyse`, 0.14.0/0.14.1) | Unerwartete Fehler landeten nur in der Entwicklerkonsole. | Fehler und abgelehnte Promises erscheinen in der Statuszeile. Check-Fix 0.14.1: Harmlose Abbrüche beim Abspielen gehen nur in die Konsole, damit sie keine richtige Meldung überschreiben. |
| S8 | P1 | Teilweise | Videos brauchen auf dem iPhone lange, bis sie in der App sind. Die Ursache liegt meist vor der App (Umwandeln in Safari, iCloud-Download, 4K). | Tipps im README (PR #6). Analyse deutlich schneller (PR #8), Statuszeile zeigt Messwerte. Seit 0.14.0 zeigt „Analyse fertig (…)“ auch „Video geladen in … s“. Diese Zeit beginnt erst, wenn die Auswahl in der App ankommt – das „Wird vorbereitet“ der Foto-Auswahl davor ist nicht enthalten. Offen: iPhone-Messung auswerten. |
| S9 | P3 | Erledigt 28.09. (Branch `robuste-analyse`, 0.14.0/0.14.1) | Kam beim allerersten Öffnen eine App-Datei nicht an (z. B. schlechtes Netz), blieb die App ohne Hinweis bei „Lade die Pose-Erkennung …“ stehen. | `pwa.js` prüft nach 20 s, ob `app.js` gestartet ist, und bittet sonst um Neuladen. Check-Fix 0.14.1: Kommt `app.js` bei sehr langsamem Netz doch noch an, verschwindet der Hinweis wieder; der genauere Offline-Hinweis bleibt stehen. |
| S11 | P2 | Erledigt 28.09. (Check-Fix 0.15.1, Branch `check-etappe-11b`) | Coach: Wurde die Ansicht während einer laufenden Anfrage neu gezeichnet (Level- oder Schwungwechsel, Internet wieder da), war der Knopf wieder frei – eine zweite, bezahlte Anfrage war möglich. Fehlermeldungen konnten beim falschen Schwung erscheinen, eine Antwort bei einem Sitzungswechsel verloren gehen. | Sperre für die Dauer der Anfrage (im `finally` gelöst), Antwort und Meldung nur beim eigenen Schwung, Nachtragen per Schwung-id statt über die gerade geöffnete Sitzung. Test in `tests/sicherheit.test.mjs`. |
| S10 | P3 | Offen | Meldet der Browser beim Laden eines Videos weder „geladen“ noch „Fehler“, wartet die Analyse ohne Zeitgrenze (Knöpfe bleiben gesperrt). Nicht beobachtet, nur im Code gesehen. | Zeitgrenze beim Laden (z. B. 30 s) mit Meldung. Erst nach der iPhone-Messung festlegen, damit große Videos nicht fälschlich abgebrochen werden. |
| S12 | P3 | Erledigt 29.09. (Check-Fix 0.17.1, Branch `check-2026-09-29`) | Coach: Lehnt Claude mitten in der Antwort ab, schreibt laut API ein anderes Modell im selben Datenstrom weiter (Anfang, Markierung, Fortsetzung in getrennten Textblöcken). Die App las nur den ersten Textblock und meldete „unvollständig“, obwohl die Antwort vollständig angekommen und bezahlt war. Selten (nur bei einer Ablehnung), im Browser mit nachgebauter Antwort gezeigt. | `leseAntwort()` in `coach.js` setzt alle Textblöcke zusammen; beginnt das zweite Modell von vorn, gilt der letzte Textblock. Tests in `tests/coach.test.mjs` und `tests/sicherheit.test.mjs`, im Browser für Normalfall, Rückfall und Neubeginn geprüft. Bei Gelegenheit: Die Kostenanzeige zählt nach einem Rückfall nur den letzten Versuch. |

### Geschwindigkeit (Messwerte vom 27.09., Mac, schnelles Netz)

| Datei | Anbieter | Übertragen | Zwischenspeicher |
|---|---|---|---|
| Seite und eigener Code | GitHub Pages | ca. 15 KB | 10 Minuten |
| MediaPipe-Programmcode | cdn.jsdelivr.net | 92 KB | 1 Jahr |
| MediaPipe-Rechenkern (WASM) | cdn.jsdelivr.net | 2,6 MB | 1 Jahr |
| Pose-Modell „full“ | storage.googleapis.com | 9,4 MB | 1 Stunde (seit Etappe 7 dauerhaft im Service Worker) |

Warmstart bis „Bereit“: 0,3 s ohne Datenübertragung (28.09. und 29.09., Mac, schnelles Netz). Kaltstart mit frischem Profil am 29.09.: „Bereit“ und „Offline bereit ✓“ nach 2,0 s, die Browser-Messung der Seite zählt 2,7 MB (das Modell mit ca. 9,4 MB lädt beim ersten Start der Service Worker, es ist darin nicht enthalten). Der Kaltstart (rund 12 MB) fällt seit Etappe 7 nur einmal an. Das Coach-SDK (ca. 190 KB) wird nur bei Coach-Nutzung geladen.

## Umsetzungsplan

| Etappe | Inhalt | Status |
|---|---|---|
| S0 GitHub-Einstellungen | C2 Zwei-Faktor, T1 Regel für `main`, V5 E-Mail privat | Erledigt 28.09., manuell (C2, T1, V5) |
| S1 Sicherheitsnetz | T2, V3, V1, T6 | Erledigt 27.09. (PR #6) |
| S2 Robuste Analyse | S2, S3, S7, S9, Rest von S8 (S5, S6 erledigt) | Erledigt 28.09. (PR #22). Rest: iPhone-Messung (S8), S10 |
| S3 Echtheit und Browser-Test | C1 (inkl. Anthropic-SDK), T3, C4 | Offen, nur nach Absprache |
| S4 Hausordnung | C3 | Offen, nach S3 |
| Vor Etappe 9 | V6 | Offen |
| Vor Etappe 11b | V2 | Erledigt 28.09. (PR #23) mit Check-Fix. Rest: echter Test mit Marcels Schlüssel (erster Test 29.09. → ausführlicheres Coaching in 0.17.0) |

## Quellen

- [GitHub Pages: Grenzen und Nutzungsregeln](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [WebKit: 7-Tage-Grenze und Ausnahme für Home-Bildschirm-Apps](https://webkit.org/tracking-prevention/)
- [Blob-Download scheitert auf dem iPhone bei zu früher Freigabe](https://dev.to/jamiebuildsfree/the-download-button-worked-everywhere-except-iphone-9ka)
- [Apple Developer Forums: Safari komprimiert Videos aus der Fotos-Mediathek](https://developer.apple.com/forums/thread/731042)
- [Apple Support: HEIF/HEVC und „Maximale Kompatibilität“](https://support.apple.com/en-us/116944)
