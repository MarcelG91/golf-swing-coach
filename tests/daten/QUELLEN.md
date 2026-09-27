# Quellen der Testdaten

Die Dateien hier enthalten **nur Körperpunkt-Koordinaten** (x, y pro Videobild),
keine Videos. Sie wurden mit MediaPipe Pose Landmarker (Modell „full“, wie in der App)
bei 30 Bildern pro Sekunde erzeugt. Koordinaten mit 4 Nachkommastellen (wie beim Export in der App).

| Datei | Ansicht | Quelle (Beispielvideo aus einem öffentlichen GitHub-Projekt) |
|---|---|---|
| `faceon_profi.json` | frontal | [Rybeau-University/COSC428Project](https://github.com/Rybeau-University/COSC428Project) – `reference_video.mp4` |
| `faceon_amateur.json` | frontal | [Rybeau-University/COSC428Project](https://github.com/Rybeau-University/COSC428Project) – `analysis_video.mp4` |
| `hinten_amateur_a.json` | von hinten | [Doug-Young/GolfSwingAI](https://github.com/Doug-Young/GolfSwingAI) – `VideoEdit.webm` |
| `hinten_amateur_b.json` | von hinten | [ryanboscobanze/GolfPosePro](https://github.com/ryanboscobanze/GolfPosePro) – `input videos/IMG_1022.MP4` (Ausschnitt 13–17 s) |

Weitere Videos, mit denen die Erkennung geprüft wurde (nicht als Testdatei gespeichert):
Zeitlupen von Profis (Max Homa, Ludvig Åberg) aus GolfPosePro, `test_video.mp4` aus
[wmcnally/golfdb](https://github.com/wmcnally/golfdb), `demo_swing.mp4` aus
[Zebster05/Golf-Swing-Analyzer](https://github.com/Zebster05/Golf-Swing-Analyzer),
`Reference_Swing_DTL.mp4` aus [HeleenaRobert/golf-swing-analysis](https://github.com/HeleenaRobert/golf-swing-analysis).
