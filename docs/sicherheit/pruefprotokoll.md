# Prüfprotokoll

Neueste Einträge oben. Jeder `/golf-app-check` fügt hier einen Eintrag hinzu.
Der aktuelle Stand aller Befunde steht in [`bericht.md`](bericht.md).

## Golf-App-Check 2026-09-28 · Branch `robuste-analyse` @ 9d1162c · main @ 20750c0 · Urteil 🟡
- Geprüft (unabhängiger Prüfer, lokal): `origin/main` (0.13.1) im eigenen Worktree und `robuste-analyse` (0.14.0, noch nicht hochgeladen); `node --test` main 102/102, Branch 104/104, mit Check-Fix 105/105 grün; JavaScript-Syntax und `git diff --check` grün; Branch lässt sich ohne Konflikt mit `main` zusammenführen.
- Live: Version 0.13.1, Seite und `app.js` HTTP 200, Cache 10 Minuten, keine CSP; SHA-256 von 5 App-Dateien gleich `origin/main`. CI auf `main` grün, `main` geschützt.
- Datenschutz/Sicherheit: keine Videos oder Posedaten in Git, keine Geheimnismuster, nur erlaubte Hosts, keine neuen Netzwerkaufrufe. Neue Meldungen (auch Dateinamen und Fehlertexte) nur per `textContent`. Keine neue Datei, Version erhöht.
- Erledigt (im Branch): S2, S3, S7, S9; S8 teilweise (Ladezeit in der Statuszeile). Check-Fix: Längenprüfung greift auch beim vorgeladenen Video; harmlose Abspiel-Abbrüche erscheinen nicht als „Unerwarteter Fehler“; Speichern hängt nicht, wenn der Browser das Abspielen verweigert; Start-Hinweis verschwindet, wenn die App bei langsamem Netz doch noch startet.
- Neu: S10 (P3, Laden eines Videos ohne Zeitgrenze). Offen P1: V2 (erst 11b), C1, S8 (iPhone-Messung).
- Fix-Branch: `check-robuste-analyse` (3 Commits inkl. Übernahme von `main`): Check-Fix mit Test, Version 0.14.1; Bericht und Protokoll.
- Nicht geprüft: Browser-Messung durch den Prüfer (lokal kein Playwright, kein Claude in Chrome; die Bau-Sitzung hat Chrome ohne Fenster mit Testvideo und absichtlich eingebauten Fehlern genutzt), Check-Fix im Browser, echtes iPhone/Safari (Stromsparmodus, Ladezeit), CI auf dem Branch (noch kein PR).

## GitHub-Einstellungen (Etappe S0) 2026-09-28 · main @ e64462d · manuell
- C2 erledigt: Zwei-Faktor mit Authenticator-App und Passkey, Wiederherstellungscodes sicher abgelegt; Sitzungen, Tokens, Apps und SSH-Schlüssel von Marcel im Browser aufgeräumt. Per API geprüft: kein SSH-Schlüssel mehr hinterlegt, Kommandozeile hat weiter Zugriff, einziger Mitarbeiter am Repo ist das Hauptkonto.
- V5 erledigt: globale Git-Einstellung auf die noreply-Adresse umgestellt (lokal geprüft), E-Mail in GitHub privat und Pushes mit echter Adresse gesperrt. Ältere Commits bleiben bewusst unverändert.
- T1 bestätigt: Ruleset „main schützen“ per API geprüft (aktiv, keine Ausnahmen, Löschen und Force-Push gesperrt, Pull Request mit Pflicht-Check „Tests“). Dieser Doku-PR ist der erste Merge unter der Regel.
- Nicht geprüft: Zwei-Faktor und E-Mail-Einstellung selbst (dem Token der Kommandozeile fehlt die Berechtigung) – laut Marcel eingeschaltet.

## Golf-App-Check 2026-09-28 · Branch `uebungsmodus` @ ad71505 · main @ c93f5f6 · Urteil 🟡
- Geprüft (unabhängiger Prüfer, lokal): `origin/main` (0.12.1) im eigenen Worktree und `uebungsmodus` (0.13.0, noch nicht hochgeladen); `node --test` main 93/93, Branch 101/101, mit Check-Fix 102/102 grün; JavaScript-Syntax und `git diff --check` grün; Branch lässt sich ohne Konflikt übernehmen (Fast-Forward).
- Live: Version 0.12.1, Seite und `app.js` HTTP 200, Cache 10 Minuten, keine CSP; SHA-256 von 7 App-Dateien gleich `origin/main`. CI auf `main` grün.
- T1 erledigt: Ruleset „main schützen“ aktiv, ohne Ausnahmen (Löschen, Force-Push gesperrt, nur per Pull Request, Pflicht-Check „Tests“); GitHub meldet `main` jetzt als geschützt. V5 teilweise: neue Commits mit noreply-Adresse, GitHub-Merge-Commits und die globale Git-Einstellung noch mit Geschäftsadresse.
- Datenschutz/Sicherheit: keine Videos oder Posedaten in Git, keine Geheimnismuster, nur erlaubte Hosts, keine neuen Netzwerkaufrufe. Übungsmodus: Texte per `textContent`, einziges neues `innerHTML` ist fester Text; neue Datei in beiden Offline-Listen und in der Liste „Rechenlogik ohne Browser-Code“, Version erhöht. Animation wird beim Schließen und Seitenwechsel angehalten; höchstens 19 SVG-Elemente pro Bild.
- Neu: keine Befund-ID. Check-Fix: Seite hinter dem Übungsmodus für Tastatur und Bildschirmleser gesperrt; Bildschirm-anlassen wird auch bei sehr schnellem Schließen freigegeben. Erledigt: T1. Offen P1: V2 (erst 11b), C1, C2, S2, S8.
- Fix-Branch: `check-uebungsmodus` (2 Commits): Fokus und Bildschirmsperre im Übungsmodus, Test für die Übungsbilder, Version 0.13.1; Bericht und Protokoll.
- Nicht geprüft: Browser-Messung durch den Prüfer (lokal kein Playwright, kein Claude in Chrome; die Bau-Sitzung hat Chrome ohne Fenster mit Testvideo genutzt), echtes iPhone/Safari (Wake Lock in der Home-Bildschirm-App, Flüssigkeit der Animation), Zwei-Faktor, CI auf dem Branch (noch kein PR).

## Golf-App-Check 2026-09-28 · Branch `tipps-neu` @ de889b1 · main @ 18dc5c4 · Urteil 🟡
- Geprüft (unabhängiger Prüfer, lokal): `origin/main` (0.11.0) im eigenen Worktree und `tipps-neu` (0.12.0, noch nicht hochgeladen); `node --test` main 84/84, Branch 92/92, mit Check-Fix 93/93 grün; JavaScript-Syntax und `git diff --check` grün; Branch lässt sich ohne Konflikt übernehmen (Fast-Forward).
- Live: Version 0.11.0, Seite und `app.js` HTTP 200, Cache 10 Minuten, keine CSP; SHA-256 von 7 App-Dateien gleich `origin/main`. CI auf `main` grün. Branch-Schutz weiter aus (T1).
- Datenschutz/Sicherheit: keine Videos oder Posedaten in Git, keine Geheimnismuster, nur erlaubte Hosts, keine neuen Netzwerkaufrufe. Neue Texte und der gespeicherte Schwunggedanke nur per `textContent`; einziges neues `innerHTML` ist fester Text für die SVG-Fläche. Neue Dateien in beiden Offline-Listen, Version erhöht. Strichfigur wird nur einmal pro Bewertung gebaut (nicht pro Videobild), Fehler beim Berechnen werden abgefangen.
- Neu: keine Befund-ID. Barrierefreiheit der Wisch-Karten verbessert (Tastatur, Beschreibung der Skala). V5: Der Branch-Commit trägt noch die Geschäftsadresse – vor dem Hochladen korrigieren. Offen P1: V2 (erst 11b), C1, C2, S2, S8, T1.
- Fix-Branch: `check-tipps-neu` (2 Commits): Tastatur/Bildschirmleser, Test „Rechenlogik ohne Browser-Code“, Version 0.12.1; Bericht und Protokoll.
- Nicht geprüft: Browser-Messung durch den Prüfer (lokal kein Playwright, kein Claude in Chrome; die Bau-Sitzung hat Chrome ohne Fenster mit Testvideos genutzt), echtes iPhone/Safari, Zwei-Faktor, CI auf dem Branch (noch kein PR).

## Golf-App-Check 2026-09-28 · Branch `speicher-verwalten` @ 01584d9 · main @ 1f7ea52 · Urteil 🟡
- Geprüft (unabhängiger Prüfer, lokal): `origin/main` (0.10.0) und `origin/speicher-verwalten` (0.11.0, noch ohne PR) in eigenen Worktrees; `node --test` main 77/77, Branch 84/84 grün; JavaScript-Syntax und `git diff --check` grün; Branch lässt sich ohne Konflikt übernehmen (Fast-Forward).
- Browser (Chrome ohne Fenster, lokal): `tests/speicher-browser.html` 23/23 grün. Echter Ablauf mit zwei Testvideos: „Videos älter als 30 Tage“, „Videos dieser Sitzung“ und „Alles löschen“ löschen genau das Angekündigte; Kennzahlen und Posedaten bleiben bei „Videos löschen“; Level, andere Einstellungen und Offline-Speicher bleiben immer; Abbrechen, Esc und Enter löschen nichts; Knöpfe danach wieder frei; Video-Adresse freigegeben. Platz wird sofort frei (Test-Datenbank 41 MB → 0,1 MB auf der Platte).
- Live: Version 0.10.0, Seite und `app.js` HTTP 200, Cache 10 Minuten, keine CSP; SHA-256 von 7 App-Dateien gleich `origin/main`. Frisches Profil: „Bereit“ und „Offline bereit ✓“ nach höchstens 1,5 s, Warmstart 0,3 s ohne Übertragung; Service Worker aktiv; Erststart 4 von 4 in Ordnung. Keine Konsolenfehler.
- Erststart-Hänger aus dem lokalen Test geklärt: Ursache ist der einfache Python-Server (bricht bei vielen gleichzeitigen Anfragen Verbindungen ab), nicht die App. Neu S9: Die App meldet einen solchen Ladeabbruch nicht.
- Datenschutz/Sicherheit: keine Videos oder Posedaten in Git, keine Geheimnismuster, nur erlaubte Hosts, keine neuen Netzwerkaufrufe; neue Texte nur per `textContent`. Branch-Schutz weiter aus (T1). Merge-Commits von GitHub tragen weiter die Geschäftsadresse (V5).
- Verbessert: S2 (Löschen und Öffnen gespeicherter Sitzungen mit Fehlerbehandlung), S5 (auch beim Entfernen gelöschter Videos). Offen P1: V2 (erst 11b), C1, C2, S2, S8, T1.
- Nach dem Check im selben Branch umgesetzt: Nach „Videos dieser Sitzung löschen“ überdeckt die Erfolgsmeldung keinen Fehler beim Neuöffnen mehr; Regel in `CLAUDE.md` präzisiert (Lösch-Dialog nur bei „Videos löschen“ und „Alles löschen“); Notiz zum Erststart-Hänger korrigiert.
- Nicht geprüft: echtes iPhone/Safari, Zwei-Faktor, CI auf dem Branch (noch kein PR), Tests mit Node 22 (CI-Version).

## Golf-App-Check 2026-09-28 · PR #17 · main @ 92cdea3 · Urteil 🟡
- Geprüft: `origin/main` und `etappe-11a-level` @ `5cf56da`; `node --test` 77/77 grün, JavaScript-Syntax und `git diff --check` grün; PR-Check „Tests“ erfolgreich.
- Browser lokal: alle drei Testvideos in allen drei Leveln ausgewertet; Einsteiger zeigt je Ansicht mindestens 3 Kennzahlen, eine Baustelle, keine Kopf-Kennzahlen und keine „Selbst prüfen“-Karten. Levelwahl bleibt nach Neuladen erhalten. Schmale Ansicht (390 px) ohne horizontalen Überlauf; Service Worker aktiv und „Offline bereit ✓“. Testsitzung mit Level gespeichert und anschließend gelöscht.
- Live auf `main`: Version 0.9.1, Seite und `app.js` HTTP 200, Cache 10 Minuten, keine CSP; SHA-256 von `app.js` und `pwa.js` stimmt mit `origin/main` überein. Branch-Schutz nicht aktiv (T1). Neue App-Version 0.10.0 ist noch im PR.
- Datenschutz/Offline: keine Videos oder Posedaten in Git, keine Geheimnismuster, keine neuen Hosts oder Netzwerkaufrufe; Levelwahl nur in `localStorage`, gespeichertes Level im IndexedDB-Sitzungseintrag. Neue Datei in beiden Offline-Listen.
- Erledigt: S5 und S6 durch PR #16; Etappe 11a implementiert. Offen P1: V2 (erst 11b), C1, C2, S2, S8, T1. V5 bleibt offen, weil die globale Git-Adresse noch keine Noreply-Adresse ist; der PR-Commit selbst nutzt Noreply.
- Nicht geprüft: echtes iPhone/Safari, Zwei-Faktor-Status und Live-Auslieferung von Version 0.10.0 (PR noch nicht gemergt).

## Golf-App-Check 2026-09-27 · main @ 56c9d56 · Urteil 🟡
- Geprüft: `origin/main` und lokaler Fix-Branch `check-2026-09-27`; main 62/62, Branch 66/66 Tests grün; JavaScript-Syntax ok.
- Live: Version 0.9.0, „Bereit“, „Offline bereit ✓“, Service Worker aktiv; DOMContentLoaded 23,1 s, Browser-Transfer 2,7 MB (mit vorhandenem Cache). Seite und `app.js`: HTTP 200, Cache 10 Minuten, keine CSP.
- Lokal: Fix-Branch zeigt Version 0.9.1. Die integrierte Browserumgebung lud dort weder den Service Worker noch den externen Pose-Code; kein Video-/iPhone-Test.
- CI auf `main` grün; keine offenen PRs. GitHub meldet den Branch-Schutz von `main` als nicht aktiv (T1). Keine zusätzlichen Hosts, Datenabflussstellen, Geheimnismuster, Videos oder Posedaten gefunden.
- Vorbereitet: S5 und S6 behoben; vier statische Sicherheitsprüfungen ergänzt. Version 0.9.1. Änderungen sind lokal und ungepusht; PR/CI für den Fix-Branch stehen aus.
- Offen P1: V2, C1, C2, S2, S8, T1. Manuelle Live-Browserprüfung möglich; automatisierter Browser-Test T3 fehlt.

## 2026-09-27 (abends) · main @ f100c18 · Bestandsaufnahme · Urteil 🟡
- Berichte ins Repo übernommen (`docs/sicherheit/`), Sicherheitsregeln in `CLAUDE.md` ergänzt.
- Geprüft: `main` (Version 0.9.0, inkl. Etappe 8 „Schwünge speichern“); Tests 62/62 grün; Syntax aller JS-Dateien ok; Offline-Listen in `sw.js` und `pwa.js` vollständig; nur erlaubte Hosts (jsDelivr, Google). Keine Live-Messung.
- Neu: V7 (`.claude/settings.local.json` nicht ignoriert, in diesem PR behoben) · Erledigt seit der Erstprüfung: V1, V3, T2, T4, T5, T6, S1, S4 · Etappe 8 (Speicherung in IndexedDB) ohne Befund · Teilweise: S2, S8 · Offen P1: V2 (vor Etappe 11), C1, C2, T1
- Fix-Branch: `sicherheit-berichte-im-repo`

## 2026-09-27 (nachmittags) · main @ 4a7ab3e · Etappe S1 · Urteil 🟡
- Pull Request #6 gemergt: automatische Prüfung (Workflow „Prüfen“), Video-Wächter, `.gitignore` erweitert, lokaler Server nur für den Mac, Rückweg im README. Check „Tests“ grün.

## 2026-09-27 (mittags) · main @ 2e39872 · Erstprüfung · Urteil 🟡
- Gesamtprüfung von Informationssicherheit, Cybersecurity, Test und Deploy, Stabilität und Geschwindigkeit, mit Live-Messung.
- Ergebnis: Videos bleiben auf dem Gerät. Offen waren unter anderem CI, Schutz von `main`, Fehlerbehandlung, Offline-Start und die Echtheitsprüfung des Fremdcodes.
- Der ausführliche Erstbericht liegt als privates Dokument in Claude; sein Inhalt ist in `bericht.md` übernommen.
