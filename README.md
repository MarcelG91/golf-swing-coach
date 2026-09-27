# ⛳ Golf Swing Coach

Eine Web-App, die Golfschwung-Videos analysiert und Verbesserungstipps gibt.
Die Pose-Erkennung (MediaPipe) läuft komplett im Browser – Videos verlassen das Gerät nicht.

## Starten (lokal auf dem Mac)

```bash
cd ~/Projekte/golf-swing-coach
python3 -m http.server 8000
```

Dann im Browser öffnen: http://localhost:8000
Beenden mit `Ctrl + C` im Terminal.

> Warum ein lokaler Server? Browser laden JavaScript-Module aus Sicherheitsgründen
> nicht per Doppelklick auf die Datei, sondern nur über eine Web-Adresse.

## Tipps für gute Videos

- Handy auf ein Stativ, auf Hüfthöhe, ca. 3 m entfernt
- Frontal (face-on) oder von hinten entlang der Ziellinie (down-the-line)
- Ganzer Körper plus Schläger im Bild, gutes Licht
- Normale Geschwindigkeit, **keine Zeitlupe** (sonst stimmt das Tempo nicht)
- Aufnahme kurz vor dem Ansprechen starten und erst nach dem Finish beenden
- Ein Schwung pro Video (bei mehreren wird der schnellste ausgewertet)
- Die App erkennt selbst, ob von vorne oder von hinten gefilmt wurde. Beide Ansichten
  liefern unterschiedliche Kennzahlen – am besten abwechselnd beide filmen.

## Ausprobieren ohne eigenes Video

Im Ordner `testvideos/` (nur lokal, nicht auf GitHub) liegen Beispielschwünge
aus öffentlichen GitHub-Projekten. Quellen: `tests/daten/QUELLEN.md`.

## Dateien

| Datei | Aufgabe |
|---|---|
| `index.html` | Aufbau der Seite (Buttons, Video, Leinwand) |
| `style.css` | Aussehen |
| `app.js` | Bedienung: Video laden, Pose erkennen, Skelett zeichnen, Ergebnis anzeigen |
| `phasen.js` | Rechnet aus den Körperpunkten die Schwungphasen und das Tempo aus |
| `kennzahlen.js` | Bewertet den Schwung (Kennzahlen, Ampel, Übungstipps) |
| `tests/phasen.test.mjs` | Prüft `phasen.js` mit künstlich erzeugten Schwüngen |
| `tests/echte-schwuenge.test.mjs` | Prüft Phasen und Bewertung an 4 echten Schwüngen |
| `tests/daten/` | Posedaten der echten Testschwünge (nur Koordinaten, keine Videos) |
| `.gitignore` | Sorgt dafür, dass Videos und Posedaten nicht auf GitHub landen |

## Tests ausführen

```bash
node --test
```

(Braucht Node.js – falls nicht installiert: `brew install node`)

## So erkennt die App die Phasen

1. Für jedes Videobild wird die Position der Hände (Mitte beider Handgelenke) bestimmt.
2. Der Moment, in dem sich die Hände am schnellsten nach unten bewegen, liegt kurz vor dem Treffmoment.
3. **Top** = davor der Umkehrpunkt, an dem die Hände aufhören nach oben zu gehen.
4. **Treffmoment** = danach der tiefste Punkt der Hände.
5. **Ansprechen** = vor dem Rückschwung der letzte Moment, in dem die Hände ruhig waren.
6. **Finish** = nach dem Treffmoment: Hände oben und wieder ruhig.
7. **Tempo** = Dauer Rückschwung : Dauer Abschwung (gute Spieler: etwa 3 : 1).

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

**Bewusst weggelassen:** Der gestreckte Führungsarm. Auf einem normalen 2D-Video
misst die Pose-Erkennung selbst bei Profis nur ca. 110° am Top – die Aussage wäre
nicht verlässlich.

**Genauigkeit:** Bei 30 Bildern pro Sekunde dauert der Abschwung nur 6–9 Bilder.
Ein Bild mehr oder weniger verändert das Tempo-Verhältnis um ca. 15 %.

## Fahrplan

- [x] 1. Video hochladen und abspielen
- [x] 2. Skelett über das Video zeichnen
- [x] 3. Schwungphasen erkennen (Ansprechen, Top, Treffmoment, Finish) + Tempo
- [x] 4. Kopfstabilität (Höhe + seitlich) mit Tipp
- [x] 5. Weitere Kennzahlen: Vorneigung, Hüfte, Gewichtsverlagerung, Tempo – geprüft an echten Schwüngen
- [ ] 6. Über GitHub Pages veröffentlichen und aufs Handy bringen
- [ ] 7. Optional: Coach-Feedback mit Claude
