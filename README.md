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

## Dateien

| Datei | Aufgabe |
|---|---|
| `index.html` | Aufbau der Seite (Buttons, Video, Leinwand) |
| `style.css` | Aussehen |
| `app.js` | Logik: Video laden, Pose erkennen, Skelett zeichnen |

## Fahrplan

- [x] 1. Video hochladen und abspielen
- [x] 2. Skelett über das Video zeichnen
- [ ] 3. Schwungphasen erkennen (Ansprechen, Top, Treffmoment, Finish)
- [ ] 4. Erste Kennzahl: Kopfstabilität + Tipp
- [ ] 5. Weitere Kennzahlen: Wirbelsäulenwinkel, Führungsarm, Tempo
- [ ] 6. Über GitHub Pages veröffentlichen und aufs Handy bringen
- [ ] 7. Optional: Coach-Feedback mit Claude
