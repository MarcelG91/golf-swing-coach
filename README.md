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

## Dateien

| Datei | Aufgabe |
|---|---|
| `index.html` | Aufbau der Seite (Buttons, Video, Leinwand) |
| `style.css` | Aussehen |
| `app.js` | Bedienung: Video laden, Pose erkennen, Skelett zeichnen, Ergebnis anzeigen |
| `phasen.js` | Rechnet aus den Körperpunkten die Schwungphasen und das Tempo aus |
| `tests/phasen.test.mjs` | Prüft `phasen.js` mit künstlich erzeugten Schwüngen |
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

## Fahrplan

- [x] 1. Video hochladen und abspielen
- [x] 2. Skelett über das Video zeichnen
- [x] 3. Schwungphasen erkennen (Ansprechen, Top, Treffmoment, Finish) + Tempo
- [ ] 4. Erste Kennzahl: Kopfstabilität + Tipp
- [ ] 5. Weitere Kennzahlen: Wirbelsäulenwinkel, Führungsarm, Tempo
- [ ] 6. Über GitHub Pages veröffentlichen und aufs Handy bringen
- [ ] 7. Optional: Coach-Feedback mit Claude
