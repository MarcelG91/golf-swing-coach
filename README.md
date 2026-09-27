# ⛳ Golf Swing Coach

Eine Web-App, die Golfschwung-Videos analysiert und Verbesserungstipps gibt.
Die Pose-Erkennung (MediaPipe) läuft komplett im Browser – Videos verlassen das Gerät nicht.

**Was die App kann:**

- Schwung filmen oder aus den Fotos wählen – frontal oder von hinten (erkennt sie selbst)
- Auch **lange Videos mit mehreren Schlägen** oder **mehrere Videos auf einmal** – mit Gesamtauswertung
- Skelett über das Video zeichnen und die Phasen finden: Ansprechen, Top, Treffmoment, Finish
- Tempo, Kopf, Hüfte, Arme, Oberkörperhaltung und Drehung bewerten (Ampel: gut / Achtung / verbessern)
- Die **3 wichtigsten Baustellen** mit Gefühl-Tipp und Übung nennen
- Fehler direkt im Video zeigen: **rot** = deine Linie, **gelb** = Ideallinie, dazu Pfeil und Sprechblase
- Schwünge **auf dem Handy speichern** – mit kurzem Video, Schläger und Notiz – und später wieder öffnen
- Als App auf dem iPhone-Home-Bildschirm laufen – auch **offline** auf der Range

**Inhalt:**
[Online nutzen](#online-nutzen-handy) ·
[Lokal starten](#starten-lokal-auf-dem-mac) ·
[Tipps für gute Videos](#tipps-für-gute-videos) ·
[Schwünge speichern](#schwünge-speichern) ·
[Wenn etwas nicht klappt](#wenn-etwas-nicht-klappt) ·
[Dateien](#dateien) ·
[Arbeitsweise](#arbeitsweise-mit-branches) ·
[Tests](#tests-ausführen) ·
[So funktioniert die Analyse](#so-geht-die-app-das-video-durch) ·
[Fahrplan](#fahrplan)

## Online nutzen (Handy)

👉 **https://marcelg91.github.io/golf-swing-coach/**

- Auf dem iPhone in Safari öffnen → Teilen → „Zum Home-Bildschirm“: dann startet die App wie eine normale App.
- **Offline:** Nach dem ersten Öffnen mit Internet (lädt einmalig ca. 20 MB Pose-Erkennung)
  funktioniert die App auch ohne Netz – z. B. auf der Range. **Erst losgehen, wenn unten
  „Offline bereit ✓“ steht.**
- **Wichtig auf dem iPhone:** Die App auf dem Home-Bildschirm hat einen *eigenen* Speicher,
  getrennt von Safari. Sie muss also einmal **vom Home-Bildschirm aus** mit Internet geöffnet werden.
- Fehlt offline etwas, nennt die App in der Statuszeile genau, welche Datei fehlt.
- **Updates:** Mit Internet holt sich die App bei jedem Start automatisch die neueste Version.
  Der Service Worker fragt dafür bei jeder App-Datei kurz beim Server nach – so passen
  alle Dateien immer zur selben Version zusammen. Die Versionsnummer steht ganz unten.
- **„Daten geschützt ✓“** unten erscheint, wenn der Browser zugesagt hat, die Daten der App
  nicht automatisch zu löschen (klappt in der Regel nur als Home-Bildschirm-App).
- „Video auswählen oder aufnehmen“ tippen → direkt filmen oder Videos aus den Fotos wählen
  (mehrere markieren geht auch), dann „🔍 Analysieren“.
- Das Video bleibt auf dem Handy. Aus dem Internet geladen wird nur die Pose-Erkennung.
- Die Online-Version ist immer der Stand von `main`. Nach einem Merge dauert es 1–2 Minuten, bis sie aktualisiert ist.

## Starten (lokal auf dem Mac)

```bash
cd ~/Projekte/golf-swing-coach
python3 -m http.server 8000 --bind 127.0.0.1
```

Dann im Browser öffnen: http://127.0.0.1:8000
Beenden mit `Ctrl + C` im Terminal.

> **Wichtig:** `--bind 127.0.0.1` sorgt dafür, dass nur dein Mac die Seite erreicht.
> Ohne den Zusatz kann jeder im selben WLAN (Golfclub, Café) alle Dateien im Ordner
> abrufen – auch Videos.

> Warum ein lokaler Server? Browser laden JavaScript-Module aus Sicherheitsgründen
> nicht per Doppelklick auf die Datei, sondern nur über eine Web-Adresse.

## Tipps für gute Videos

- Handy auf ein Stativ, auf Hüfthöhe, ca. 3 m entfernt
- Frontal (face-on) oder von hinten entlang der Ziellinie (down-the-line)
- Ganzer Körper plus Schläger im Bild, gutes Licht
- Normale Geschwindigkeit, **keine Zeitlupe** (sonst stimmt das Tempo nicht)
- Aufnahme kurz vor dem Ansprechen starten und erst nach dem Finish beenden
- Ein Schlag pro Video oder mehrere in einem langen Video – zwischen zwei Schlägen
  mindestens 3 Sekunden Pause (Aufteen, Ansprechen reicht völlig)
- Die App erkennt selbst, ob von vorne oder von hinten gefilmt wurde. Beide Ansichten
  liefern unterschiedliche Kennzahlen – am besten abwechselnd beide filmen.

### Damit das Video auf dem Handy schnell geladen ist

Bevor die App ein Video bekommt, bereitet das iPhone es vor. Je größer das Video, desto länger dauert das.

- **1080p statt 4K filmen:** Einstellungen → Kamera → Video aufnehmen → „1080p mit 30 fps“.
  Das reicht völlig, die Pose-Erkennung rechnet intern ohnehin mit 256 × 256 Pixeln.
- **Nur den Schwung auswählen:** Das Video vorher in Fotos auf 5–8 Sekunden kürzen
  (Bearbeiten → Anfang und Ende verschieben). Das spart Zeit beim Laden und bei der Analyse.
- **Liegt das Video nur in iCloud?** Mit „iPhone-Speicher optimieren“ lädt das iPhone ältere
  Videos erst herunter. Frisch gefilmte Videos gehen am schnellsten.
- **Zeigt das iPhone lange „Wird vorbereitet“ oder „Komprimieren“,** wandelt Safari das Video um.
  Zum Ausprobieren: Einstellungen → Kamera → Formate → „Maximale Kompatibilität“,
  oder das Video über „Dateien“ statt über „Fotos“ auswählen.

## Schwünge speichern

Nach der Analyse steht unten der Kasten **„💾 Speichern“**: Datum, Schläger, Notiz, und per
Häkchen, welche Schwünge (unsichere ⚠️ sind nicht vorausgewählt). Beim Speichern spielt jeder
Schwung einmal durch – dabei nimmt die App ihn als kurzes Video auf.

- **Wo liegen die Daten?** Nur auf diesem Gerät, in der Browser-Datenbank (IndexedDB).
  Nichts wird hochgeladen. Home-Bildschirm-App und Safari haben getrennte Speicher.
- **Was wird gespeichert?** Pro Schwung ein Clip (1 s vor dem Ansprechen bis 1 s nach dem
  Finish, 720p, ca. 1–3 MB), ein Vorschaubild, alle Kennzahlen, Phasen und die Posedaten.
- **Sitzung:** Alles aus einer Analyse gehört zusammen („27.09. · Eisen 7 · 5 Schwünge“).
  Die Gesamtauswertung wird beim Öffnen neu berechnet.
- **Wieder ansehen:** Oben auf **„📚 Meine Schwünge“** → Sitzung antippen. Sie öffnet sich wie
  eine frische Analyse – mit Phasen, „Im Video zeigen“ und roten/gelben Linien.
- **Löschen:** In der geöffneten Sitzung ganz unten (einzelner Schwung oder ganze Sitzung).
- **Wichtig:** Gelöschte Safari-Daten oder ein verlorenes Handy = Schwünge weg.
  Eine Sicherung zum Exportieren kommt mit Etappe 9.

## Ausprobieren ohne eigenes Video

Im Ordner `testvideos/` (nur lokal, nicht auf GitHub) liegen Beispielschwünge
aus öffentlichen GitHub-Projekten. Quellen: `tests/daten/QUELLEN.md`.

### Posedaten exportieren (für die Feinabstimmung)

Unter dem Ergebnis gibt es den Knopf **„⬇️ Posedaten exportieren“**. Er lädt eine Datei
`posedaten-<videoname>.json` herunter: nur die Koordinaten der Körperpunkte pro Bild,
kein Video. Damit lassen sich Kennzahlen und Grenzwerte am Rechner mit `node --test`
nachprüfen, ohne das Video erneut analysieren zu müssen.

> Solche Exporte können Rückschlüsse auf dich zulassen und gehören **nicht** auf GitHub.
> `.gitignore` und der Video-Wächter-Test verhindern das. Nur bewusst ausgewählte, fremde
> Beispielschwünge liegen – umbenannt – in `tests/daten/`.

## Wenn etwas nicht klappt

| Problem | Lösung |
|---|---|
| Offline fehlt etwas | Die Statuszeile nennt die fehlende Datei. App **vom Home-Bildschirm aus** mit Internet öffnen und warten, bis unten „Offline bereit ✓“ steht. |
| Update kommt nicht an | Versionsnummer ganz unten prüfen. App mit Internet komplett schließen (nach oben wischen) und neu öffnen. Nach einem Merge 1–2 Minuten warten. |
| Analyse ist langsam | Die Zeile „Analyse fertig (…)“ notieren (siehe [unten](#so-geht-die-app-das-video-durch)). 1080p statt 4K filmen, Video vorher kürzen. |
| Video lädt ewig („Wird vorbereitet“) | Siehe [Damit das Video schnell geladen ist](#damit-das-video-auf-dem-handy-schnell-geladen-ist). |
| „Der Abschwung wirkt ungewöhnlich“ | Meist Zeitlupe oder Probeschwung – mit normaler Geschwindigkeit filmen. |
| Skelett sitzt falsch | Ganzer Körper im Bild? Genug Licht? Keine anderen Personen im Hintergrund? |
| Lokal: Seite leer / Fehler in der Konsole | Über `http://127.0.0.1:8000` öffnen, nicht per Doppelklick auf `index.html`. |

## Dateien

**App**

| Datei | Aufgabe |
|---|---|
| `index.html` | Aufbau der Seite (Buttons, Video, Leinwand) |
| `style.css` | Aussehen |
| `app.js` | Bedienung: Video laden, Pose erkennen, Skelett zeichnen, Ergebnis anzeigen |
| `phasen.js` | Rechnet aus den Körperpunkten die Schwungphasen und das Tempo aus |
| `kennzahlen.js` | Bewertet den Schwung (Kennzahlen, Ampel, Übungstipps) |
| `technik.js` | Technik-Tipps zu Armen, Oberkörperhaltung und Drehung, wählt die 3 wichtigsten Baustellen aus |
| `ideallinien.js` | Rechnet aus, wo die gelbe Ideallinie im Video liegt, dazu Pfeil und Hinweis für die Sprechblase |
| `videoanalyse.js` | Geht das Video schnell durch: abspielen statt Bild für Bild anspringen, Lücken gezielt nachholen |
| `schwuenge.js` | Findet alle Schläge in einem Video und wertet jeden einzeln aus |
| `gesamtauswertung.js` | Fasst mehrere Schwünge zusammen: wie oft gut/Achtung/verbessern, typischer Wert, Baustellen |
| `speicher.js` | Schwünge auf dem Gerät speichern (IndexedDB): Sitzungen, Schwünge, Videos; rechnet Posedaten auf den Clip um |
| `videokuerzen.js` | Schneidet einen Schwung als kurzes 720p-Video aus (Canvas + MediaRecorder) |
| `pwa.js` | Installation, Offline-Status, Speicherschutz, Versionsnummer |
| `sw.js` | Service Worker: speichert App und Pose-Erkennung für den Offline-Betrieb |
| `manifest.webmanifest` | Name, Farben und Symbol der App für den Home-Bildschirm |
| `icons/` | App-Symbole |

**Tests**

| Datei | Aufgabe |
|---|---|
| `tests/phasen.test.mjs` | Prüft `phasen.js` mit künstlich erzeugten Schwüngen |
| `tests/echte-schwuenge.test.mjs` | Prüft Phasen und Bewertung an 4 echten Schwüngen |
| `tests/technik.test.mjs` | Prüft `technik.js`: echte Schwünge, Linkshänder, gezielt eingebaute Fehler |
| `tests/ideallinien.test.mjs` | Prüft, dass die gelben Ideallinien im richtigen Winkel und an der richtigen Stelle liegen |
| `tests/videoanalyse.test.mjs` | Prüft das Zeitraster der schnellen Analyse (30-, 60-, 24-Bilder-Videos, Lücken) |
| `tests/schwuenge.test.mjs` | Prüft mehrere Schläge in einem langen Video und die Gesamtauswertung |
| `tests/speicher.test.mjs` | Prüft das Umrechnen auf den Clip: gespeicherte Schwünge ergeben dieselben Kennzahlen |
| `tests/speicher-browser.html` | Browser-Test der Datenbank (speichern, laden, löschen) – über den lokalen Server öffnen: http://127.0.0.1:8000/tests/speicher-browser.html |
| `tests/keine-videos.test.mjs` | Video-Wächter: keine Videos, Posedaten-Exporte oder zu großen Dateien im Repo |
| `tests/sicherheit.test.mjs` | Prüft erlaubte Hosts, MediaPipe-Version, Offline-Dateilisten und dynamische Codeausführung |
| `tests/daten/` | Posedaten der echten Testschwünge (nur Koordinaten, keine Videos) |
| `tests/daten/QUELLEN.md` | Woher die Testschwünge stammen |

**Projekt**

| Datei | Aufgabe |
|---|---|
| `package.json` | Sagt Node.js, dass die Dateien moderne JavaScript-Module sind; `npm test` = `node --test` |
| `.gitignore` | Sorgt dafür, dass Videos und Posedaten nicht auf GitHub landen |
| `.nojekyll` | Leere Datei: GitHub Pages zeigt die Dateien unverändert an, statt sie umzubauen |
| `.github/workflows/pruefen.yml` | Automatische Prüfung bei jedem Pull Request (siehe unten) |
| `docs/` | Pläne und Entscheidungen |
| `docs/sicherheit/` | Sicherheitsbericht mit allen Befunden und ihrem Status, Prüfprotokoll der Checks |
| `CLAUDE.md` | Regeln für Claude: Arbeitsweise (1 Chat = 1 Branch), Pflichten, offene Punkte |

## Arbeitsweise mit Branches

`main` ist immer lauffähig – daraus wird die Online-Version gebaut.
Jede neue Etappe oder Änderung bekommt einen eigenen Branch:

```bash
git checkout main && git pull                 # neuesten Stand holen
git checkout -b etappe-7-coach-feedback       # neuen Branch anlegen
# ... arbeiten, testen ...
git add . && git commit -m "Beschreibung"
git push -u origin etappe-7-coach-feedback    # Branch hochladen
gh pr create --fill                           # Pull Request anlegen
gh pr merge --merge --delete-branch           # nach Prüfung in main übernehmen
git checkout main && git pull                 # zurück auf main
```

### Checkliste bei Änderungen an der App

- [ ] `APP_VERSION` in `pwa.js` erhöht? (So siehst du auf dem iPhone, ob das Update da ist.)
- [ ] Neue JS-Datei? → in `sw.js` **und** `pwa.js` bei `APP_DATEIEN` eintragen, sonst fehlt sie offline.
- [ ] Rechenlogik ohne Browser-Code (kein `document`, kein `window`), damit `node --test` sie prüfen kann.
- [ ] `node --test` grün und im Browser angesehen?
- [ ] Keine Videos oder Posedaten-Exporte im Commit?
- [ ] Dateiliste in dieser README aktuell?

## Tests ausführen

```bash
node --test
```

(Braucht Node.js – falls nicht installiert: `brew install node`)

### Automatische Prüfung auf GitHub

Bei jedem Pull Request prüft GitHub automatisch (`.github/workflows/pruefen.yml`):

1. ob alle JavaScript-Dateien fehlerfrei lesbar sind,
2. alle Tests,
3. den Video-Wächter: keine Videos, keine Posedaten-Exporte, keine Datei über 5 MB im Repo.

Das Ergebnis steht im Pull Request unter „Checks“. **Nur mergen, wenn der Haken grün ist.**

## Rückweg, wenn ein Update Probleme macht

```bash
git checkout main && git pull
git log --oneline -5                     # Merge-Commit des Updates suchen, z. B. 2922af6
git checkout -b rueckgaengig-update
git revert -m 1 <merge-commit>           # macht das Update rückgängig
git push -u origin rueckgaengig-update
gh pr create --fill                      # Checks abwarten, dann mergen
gh pr merge --merge --delete-branch
```

Nach 1–2 Minuten ist der alte Stand online. Die App holt ihn sich beim nächsten Start mit Internet.

## So geht die App das Video durch

Früher wurde jedes Einzelbild angesprungen. Auf dem iPhone ist das sehr langsam:
Safari muss iPhone-Videos (HEVC, oft 4K) bei jedem Sprung ab dem letzten
Schlüsselbild neu entschlüsseln.

Jetzt (`videoanalyse.js`):

1. Die App misst, wie lange die Pose-Erkennung pro Bild braucht – mit dem Originalbild
   und mit einer auf 720 Pixel verkleinerten Kopie – und nimmt das Schnellere.
2. Das Video wird **abgespielt**, und jedes Bild auf dem 1/30-s-Raster wird erkannt.
   Kommt die Erkennung nicht hinterher, spielt die App automatisch langsamer ab
   (und wieder schneller, sobald es rund läuft).
3. Übersprungene Bilder werden am Ende **gezielt nachgeholt** – so ist das Ergebnis
   Bild für Bild dasselbe wie beim alten Verfahren.

Nach der Analyse steht in der Statuszeile z. B.
`Analyse fertig (6,9 s · 35 ms pro Bild · GPU · verkleinert · abgespielt, 3 Bilder nachgeholt)`:

| Angabe | Bedeutung |
|---|---|
| `6,9 s` | Dauer der ganzen Analyse |
| `35 ms pro Bild` | Rechenzeit der Pose-Erkennung pro Bild – je kleiner, desto schneller das Gerät |
| `GPU` / `CPU` | Rechnet der Grafikchip (schnell) oder der Prozessor (langsamer)? |
| `verkleinert` | Die 720-Pixel-Kopie war schneller als das Originalbild |
| `abgespielt, … nachgeholt` | Verfahren; „nachgeholt“ = Bilder, die beim Abspielen übersprungen wurden |

## So erkennt die App die Phasen

1. Für jedes Videobild wird die Position der Hände (Mitte beider Handgelenke) bestimmt.
2. Der Moment, in dem sich die Hände am schnellsten nach unten bewegen, liegt kurz vor dem Treffmoment.
3. **Top** = davor der Umkehrpunkt, an dem die Hände aufhören nach oben zu gehen.
4. **Treffmoment** = danach der tiefste Punkt der Hände.
5. **Ansprechen** = vor dem Rückschwung der letzte Moment, in dem die Hände ruhig waren.
6. **Finish** = nach dem Treffmoment: Hände oben und wieder ruhig.
7. **Tempo** = Dauer Rückschwung : Dauer Abschwung (gute Spieler: etwa 3 : 1).

### Mehrere Schläge und Gesamtauswertung (`schwuenge.js`, `gesamtauswertung.js`)

1. **Schläge finden:** Jeder Moment, in dem die Hände schneller als 3,5 Rumpflängen pro
   Sekunde nach unten gehen, ist ein Schlag – wenn er mindestens 3 s vom nächsten entfernt ist.
   (Echte Schläge erreichen 4,4 bis 13,4, Ausschwingen und Zittern bleiben unter 2,7.)
2. **Ausschneiden:** 5 s davor bis 2,5 s danach gehört zum Schwung. Darauf laufen die
   Phasenerkennung oben und alle Kennzahlen wie bei einem Einzelvideo.
3. **Unsichere Schwünge** (Tempo passt nicht, z. B. Probeschwung oder Zeitlupe) stehen mit ⚠️
   in der Liste, zählen aber nicht zur Gesamtauswertung.
4. **Gesamtauswertung**, getrennt nach frontal und von hinten:
   - Bewertung = die Stufe, die mindestens die Hälfte der Schwünge erreicht.
     Ein einzelner Ausreißer ist also keine Baustelle.
   - „typisch“ = mittlerer Wert (Median) der Schwünge mit genau dieser Bewertung, dazu die Spanne.
   - Baustellen-Reihenfolge: Anteil der Schwünge mit Fehler × Schwere × Gewicht der Kennzahl.

## So bewertet die App den Schwung

Alle Strecken werden in **Rumpflängen** gemessen (Schultermitte bis Hüftmitte),
damit es egal ist, wie groß du im Bild bist. Die Grenzwerte sind Richtwerte aus
Messungen an Profi- und Amateurschwüngen.

| Kennzahl | Ansicht | Was gemessen wird | Gut |
|---|---|---|---|
| Tempo | beide | Rückschwung : Abschwung | 2,4 – 4,0 : 1 |
| Kopfhöhe | beide | Kopf beim Treffmoment höher als beim Ansprechen? (Aufrichten) | höchstens +8 % |
| Kopf seitlich | frontal | Wandert der Kopf bis zum Treffmoment Richtung Ziel? | höchstens +8 % |
| Gewichtsverlagerung | frontal | Hüfte im Finish zwischen hinterem (0 %) und vorderem Fuß (100 %) | ab 85 % |
| Vorneigung halten | von hinten | Verlust an Oberkörper-Vorneigung bis zum Treffmoment | höchstens 10° |
| Hüfte Richtung Ball | von hinten | Schiebt die Hüfte im Abschwung zum Ball? („Early Extension“) | höchstens 12 % |

### Technik-Tipps: Arme, Oberkörperhaltung, Drehung (`technik.js`)

| Bereich | Kennzahl | Ansicht | Was gemessen wird | Gut |
|---|---|---|---|---|
| Arme | Arme beim Ansprechen | von hinten | Hängen die Hände unter den Schultern? (+ = nach dem Ball greifen) | −25 bis +15 % |
| Arme | Führungsarm im Treffmoment | frontal | Winkel am Ellbogen des vorderen Arms (180° = gestreckt) | ab 155° |
| Arme | Armschwung am Top | frontal | Hände sehr hoch **und** wenig Schulterdrehung = „Arme heben statt drehen“ | Hände ≤ 75 % oder volle Drehung |
| Oberkörper | Vorneigung beim Ansprechen | von hinten | Neigung Hüfte → Schultern nach vorne | 25–45° |
| Oberkörper | Seitneigung beim Ansprechen | frontal | Oberkörper leicht vom Ziel weg (hintere Schulter tiefer) | 0–20° |
| Oberkörper | Oberkörper am Top | frontal | Neigt sich der Oberkörper zum Ziel? („umgekehrter Wirbelsäulenwinkel“) | höchstens 3° zum Ziel |
| Oberkörper | Oberkörper im Treffmoment | frontal | Bleibt der Oberkörper hinter dem Ball? | ab 8° vom Ziel weg |
| Drehung | Schulterdrehung am Top | frontal | Schätzung aus der Schulterbreite (siehe unten) | ab ca. 80° |
| Drehung | Hüfte im Rückschwung | frontal | Schiebt die Hüfte zur Seite, statt zu drehen? („Sway“) | bis 15 % |

### Rot und Gelb im Video

Steht das Video nach der Analyse auf einer Schwungphase (Phasen-Knopf oder Bild für Bild),
zeichnet die App alle Abweichungen dieser Phase ein:

- **Rot** = deine Körperlinie liegt außerhalb des Zielbereichs („Achtung“ oder „Verbessern“)
- **Gelb** = Ideallinie: Dort sollte die Linie liegen

| Kennzahl | Rot (deine Linie) | Gelb (Ideallinie) |
|---|---|---|
| Vorneigung / Seitneigung / Oberkörper am Top / im Treffmoment | Hüftmitte → Schultermitte | gleiche Länge im Idealwinkel (35° vor · 7° / 5° / 13° vom Ziel weg) |
| Vorneigung halten | Oberkörper im Treffmoment | Vorneigung vom Ansprechen |
| Führungsarm im Treffmoment | Ober- und Unterarm | gerader Arm gleicher Länge |
| Arme beim Ansprechen | Arme | Hände senkrecht unter der Schultermitte |
| Armschwung am Top | hinterer Arm, Hände | Höhe der Hände: eine halbe Rumpflänge über den Schultern |
| Schulterdrehung am Top | Schulterlinie | Schulterlinie so schmal wie bei ca. 90° Drehung |
| Kopfhöhe / Kopf seitlich | Kopf | Linie durch die Kopfposition beim Ansprechen |
| Hüfte im Rückschwung / Hüfte Richtung Ball | Hüfte | Hüfte an der Position vom Ansprechen |
| Gewichtsverlagerung | Hüfte im Finish | Hüfte senkrecht über dem vorderen Fuß |

Dazu erscheint an jeder roten Linie eine **Sprechblase** mit einem kurzen Hinweis
(z. B. „Hüfte zurück nach links – drehen statt schieben“ oder „Linken Arm gerade lassen
und durchschwingen“) und ein **weißer Pfeil** von der roten zur gelben Linie.
„Links“ und „rechts“ in den Hinweisen meinen die Richtung im Bild; „linker Arm“
meint deinen Arm. Die Blasen suchen sich selbst einen Platz, an dem sie möglichst
keine Linie verdecken.

Jede Karte hat außerdem einen Knopf **„📍 Im Video zeigen“**: Er springt zum passenden
Moment und zeigt nur diese eine Kennzahl – grün, wenn sie im Zielbereich liegt.
Die Idealwerte stehen oben in `ideallinien.js` (`IDEAL`) und liegen alle im grünen Bereich.

**Die 3 wichtigsten Baustellen** stehen ganz oben, mit „So geht's“ (Gefühl) und Übung.
Reihenfolge: erst „Verbessern“, dann „Achtung“; innerhalb davon zählen Grundlagen
(Ansprechhaltung, Drehung) mehr, weil sich viele andere Fehler daraus ergeben.

**Schulterdrehung ist eine Schätzung:** Von vorne sieht man die Schultern schmaler,
je weiter du dich drehst. Die Pose-Erkennung setzt die Schulterpunkte aber an den
Rand des Körpers – auch von der Seite ist der Oberkörper noch etwa halb so breit.
Die App rechnet deshalb mit `Breite = cos(Drehung) + 0,45 · sin(Drehung)`.
Der Faktor 0,45 ist so gewählt, dass der Profi-Testschwung am Top ca. 90° ergibt.

**Bewusst weggelassen:** Der Führungsarm am Top und die Hüftdrehung.
Am Top verdeckt der Körper den vorderen Arm – selbst beim Profi setzt die
Pose-Erkennung den Ellbogen neben den Kopf und misst nur ca. 110°. Die Hüftpunkte
liegen unter der Kleidung; ihr Abstand ändert sich im Video kaum, wenn die Hüfte dreht.
Für den Arm am Top gibt es stattdessen eine **„Selbst prüfen“**-Karte: Sie springt
zum Top und blendet das Skelett aus, damit du selbst hinschauen kannst.

**Geprüft wurde so:** an den 4 echten Testschwüngen, an denselben Schwüngen gespiegelt
(= Linkshänder) und am Profi-Schwung mit gezielt eingebauten Fehlern
(gebeugter Arm, Oberkörper vor dem Ball, Sway, wenig Drehung, nach dem Ball greifen).

**Genauigkeit:** Bei 30 Bildern pro Sekunde dauert der Abschwung nur 6–9 Bilder.
Ein Bild mehr oder weniger verändert das Tempo-Verhältnis um ca. 15 %.

## Fahrplan

- [x] 1. Video hochladen und abspielen
- [x] 2. Skelett über das Video zeichnen
- [x] 3. Schwungphasen erkennen (Ansprechen, Top, Treffmoment, Finish) + Tempo
- [x] 4. Kopfstabilität (Höhe + seitlich) mit Tipp
- [x] 5. Weitere Kennzahlen: Vorneigung, Hüfte, Gewichtsverlagerung, Tempo – geprüft an echten Schwüngen
- [x] 6. Über GitHub Pages veröffentlichen und aufs Handy bringen
- [x] 7. App auf den Home-Bildschirm, offline nutzbar
- [x] 8. Schwünge speichern (mit gekürztem Video)

Als Nächstes, in dieser Reihenfolge (die Nummern bleiben, damit alle Verweise stimmen):

- [ ] 11. Tipps passend zum Level (🌱 Einsteiger · 🌿 Fortgeschritten · 🌳 Könner) + Coach-Feedback mit Claude
- [ ] 10. Fortschritt messen und Langzeit-Feedback
- [ ] 9. Sicherung exportieren / einspielen

Details: `docs/plan-etappe-11-level-und-coach.md` (Etappe 11) und
`docs/plan-speichern-und-fortschritt.md` (Etappen 8–10)
