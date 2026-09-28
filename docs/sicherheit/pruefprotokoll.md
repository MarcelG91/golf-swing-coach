# Prüfprotokoll

Neueste Einträge oben. Jeder `/golf-app-check` fügt hier einen Eintrag hinzu.
Der aktuelle Stand aller Befunde steht in [`bericht.md`](bericht.md).

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
