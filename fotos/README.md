# Fotos der Wissensseite

Alle Fotos stammen von [Wikimedia Commons](https://commons.wikimedia.org) und stehen unter einer
freien Lizenz (Entscheidung 13.10.2026). Sie liegen hier als Datei, damit die App sie offline zeigt
und nichts von fremden Servern lädt. Die App nennt unter jedem Foto Fotograf, Lizenz und Herkunft
(`fotos.js`), bei CC BY zusätzlich die Lizenzadresse und den Hinweis „bearbeitet“, wie die Lizenz es verlangt.

**Änderungen:** Alle Fotos wurden verkleinert (längste Seite höchstens 800 Pixel) und neu als JPEG
gespeichert. `top.jpg`, `finish.jpg` und `gruen-lesen.jpg` wurden zusätzlich seitlich beschnitten, aus den
Vardon-Tafeln je ein Bild ausgeschnitten (die Tafel mit dem überlappenden Griff ist im Buch quer gedruckt).

**Fachlich geprüft (13.10.2026):** Jedes Foto zeigt nur, was die Lektion daneben sagt. Verworfen
wurden ein Foto der Ansprechhaltung (Haltung zu aufrecht, Ball zu weit weg) und ein Griff-Foto von
1921, bei dem nicht belegt ist, welche Griffart es zeigt, und eine Griff-Zeichnung („GolfGripC“), deren
Lizenzangabe nicht stimmig ist (kein Urheber, vermutlich aus einem geschützten Buch).
Bei den Vardon-Tafeln (1912) steht im Buch selbst, was sie zeigen: „The overlapping grip“ und
„Grips right and wrong“ – „a frequently seen but unquestionably wrong grip … the right hand is turned
too far under the shaft“.

| Datei | Lektion | Original | Urheber | Lizenz |
|---|---|---|---|---|
| `griff-linke-hand.jpg` | Der Griff | [Illustration of golf grip left hand.jpg](https://commons.wikimedia.org/wiki/File:Illustration_of_golf_grip_left_hand.jpg) | Bobjgalindo | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `griff-ueberlappend.jpg` | Der Griff | Tafel „The overlapping grip“ (neben S. 84) in Harry Vardon: *How to Play Golf* (1912), [Internet Archive howtoplaygolf00vardrich](https://archive.org/details/howtoplaygolf00vardrich); dieselbe Tafel auf Commons: [How to play golf (Vardon grip) (page 111 crop).jpg](https://commons.wikimedia.org/wiki/File:How_to_play_golf_(Vardon_grip)_(page_111_crop).jpg) | Harry Vardon (†1937) | gemeinfrei ([PD-US-expired](https://commons.wikimedia.org/wiki/Template:PD-US-expired)) |
| `griff-falsch.jpg` | Der Griff | Tafel „Grips right and wrong“, rechtes Bild (neben S. 82), gleiches Buch; auf Commons: [How to play golf (Vardon grip) (page 107 crop).jpg](https://commons.wikimedia.org/wiki/File:How_to_play_golf_(Vardon_grip)_(page_107_crop).jpg) | Harry Vardon (†1937) | gemeinfrei ([PD-US-expired](https://commons.wikimedia.org/wiki/Template:PD-US-expired)) |
| `top.jpg` | Rückschwung und Top | [2016 Lyoness Open - Bernd Wiesberger (26976946043).jpg](https://commons.wikimedia.org/wiki/File:2016_Lyoness_Open_-_Bernd_Wiesberger_(26976946043).jpg) | Shot Clock Masters | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `nach-dem-treffen.jpg` | Treffmoment · Fett und getoppt | [2016 Lyoness Open - Bernd Wiesberger (27306986930).jpg](https://commons.wikimedia.org/wiki/File:2016_Lyoness_Open_-_Bernd_Wiesberger_(27306986930).jpg) | Shot Clock Masters | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `finish.jpg` | Finish und Rhythmus | [2016 Lyoness Open - Bernd Wiesberger (27583996395).jpg](https://commons.wikimedia.org/wiki/File:2016_Lyoness_Open_-_Bernd_Wiesberger_(27583996395).jpg) | Shot Clock Masters | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `bunker.jpg` | Bunker | [2016 Lyoness Open - Bernd Wiesberger (26992317444).jpg](https://commons.wikimedia.org/wiki/File:2016_Lyoness_Open_-_Bernd_Wiesberger_(26992317444).jpg) | Shot Clock Masters | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `gruen-lesen.jpg` | Grüns lesen | [2016 Lyoness Open - Bernd Wiesberger (27015030424).jpg](https://commons.wikimedia.org/wiki/File:2016_Lyoness_Open_-_Bernd_Wiesberger_(27015030424).jpg) | Shot Clock Masters | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |

Die Fotos der Lyoness Open 2016 (European Tour, Atzenbrugg) zeigen den Tourspieler Bernd Wiesberger.
Die App nennt den Namen nicht und erweckt keinen Eindruck, er empfehle die App.

## Neues Foto aufnehmen

1. Nur freie Lizenzen: CC0, CC BY 4.0, CC BY-SA 4.0 oder gemeinfrei (Liste `LIZENZEN` in `fotos.js`).
2. Fachlich prüfen: zeigt das Foto korrekte Technik und genau das, was die Lektion sagt?
3. Verkleinern (z. B. `sips -Z 720 -s format jpeg -s formatOptions 62 …`), Datei hierher.
4. Eintrag in `fotos.js`, in dieser Tabelle und in `sw.js` **und** `pwa.js` (`APP_DATEIEN`). `tests/wissen.test.mjs`
   und `tests/fotos.test.mjs` prüfen das (auch: keine GPS-Daten in der Datei, Nachweis passend zur Lizenz).
