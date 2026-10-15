# Biomechanik des Vollschwungs: Übergang/Abschwung, Treffmoment, Finish und Tempo

Stand: 15.10.2026 · Perspektive Rechtshänder (vorne = links = Zielseite) · Notizen in eigenen Worten (keine langen Zitate).

**Bewertung der Quellen:** **Stufe A** = begutachtete Studie, Messdaten, offizielle Regeln · **Stufe B** = Fachbuch,
Verbands-Lehrplan, gut dokumentierte Firmendaten · **Stufe C** = Blog/Magazin (nur Hinweis, nie alleiniger Beleg).
**Lesestatus:** **[VT]** = Volltext gelesen · **[AB]** = nur Abstract/Zusammenfassung/Sekundärquelle.

**Ausgangslage der App** (gelesen, nicht verändert): `tipps.js` (SKALEN Z. 366–381), `technik.js`, `kennzahlen.js`, `phasen.js`,
`docs/wissen/vollschwung.md`. Alle App-Werte sind **2D-Größen aus MediaPipe-Punkten** aus *einer* Kamera:
- `oberkoerperTreff` = Winkel der Linie Hüftmitte→Schultermitte zur Senkrechten, frontal (`technik.js` `neigung`).
- `vorneigungHalten` = dieselbe Linie von hinten, Ansprechen minus Treffmoment (`kennzahlen.js` `vorneigung`).
- `hueftBall` = Verschiebung der Hüftmitte zum Ball (von hinten), in % der Rumpflänge.
- `gewicht` = Lage der Hüftmitte **im Finish** zwischen den Knöcheln (0 % hinten, 100 % vorn) – also **kein Druck/Gewicht**.
- `fuehrungsarmTreff` = 2D-Winkel Schulter–Ellbogen–Handgelenk im Treffmoment (frontal).
- `tempo` = Zeit Ansprechen→Top : Top→Treffmoment aus der Handbewegung (`phasen.js`); Variante „schnell“ (Text „Rückschwung zu
  hastig“) wird allein aus Verhältnis < 2,4 gewählt (`tipps.js` `variante`).

---

## 1. Positionen im Abschwung, Treffmoment und Finish: Was messen Studien bei Profis und Amateuren?

### Takeaway
Die belastbarste Großstudie (Chu et al. 2010, n = 308, Driver) zeigt im Treffmoment eine Rumpf-Seitneigung vom Ziel weg von
**14,4 ± 6,5°**, ein um **35 ± 12°** geöffnetes Becken, einen um **23 ± 10°** geöffneten Oberkörper und **keinen mittleren Verlust
der Vorneigung** (22,0° am Top → 22,6° im Treffen); Druck/Kraft liegt im Treffmoment zu **etwa zwei Dritteln bis drei Vierteln
vorn**, aber mit großer Streuung und einem auf allen Spielstärken vorkommenden „Reverse“-Stil. Für Führungsarm-Beugung im
Treffmoment und Beckenschub zum Ball fand ich **keine frei zugänglichen begutachteten Normwerte**.

### Cited Findings

**Rumpf-Seitneigung, Vorneigung, Drehung im Treffmoment (Driver)**
- Chu, Sell & Lephart 2010, *J Sports Sci* 28(11):1251–1259 (**Stufe A, [VT]**): 308 Golfer (266 Männer, 42 Frauen),
  Alter 43 ± 16 J., USGA-Hcp **8,4 ± 8,4**; eigene Driver, 8 Kameras 240 Hz, 2 Kraftmessplatten 1200 Hz, je 5 schnellste von 10
  Schlägen gemittelt. Werte (Mittel ± SD) an Top / Beschleunigung (⅔ des Abschwungs) / 40 ms vor Treffen / Treffen:
  - Rumpf-Seitneigung zur Hinterseite (zur globalen Senkrechten): **3,9 ± 7,4° / 8,6 ± 6,0° / 11,7 ± 6,0° / 14,4 ± 6,5°**.
  - Rumpf-Vorneigung: **22,0 ± 7,2° / 24,2 ± 7,7° / 23,2 ± 7,9° / 22,6 ± 7,7°** (kein mittlerer Verlust bis zum Treffen).
  - Becken offen: −49,0 ± 12,0° (Top) → **35,2 ± 12,3°** (Treffen); Oberkörper: −98,0 ± 14,1° → **22,9 ± 9,7°**;
    X-Faktor Top −49,0 ± 11,6° → Treffen −12,3 ± 9,1°.
  - Becken hebt sich bis zum Treffen um 0,09 ± 0,06 m (Becken „steigt“), seitlich 0,02 ± 0,03 m zum Ziel (ab Top).
  - Vorderes Knie: 41,6° gebeugt am Top → 16,2 ± 9,4° im Treffen (Bein streckt sich).
  - Abschwungdauer **0,30 ± 0,06 s**; Beschleunigung→Treffen nur 0,10 ± 0,02 s.
  [PDF](https://people.stfx.ca/smackenz/Courses/HK396/Handouts/Chu%202010%20The%20relationship%20between%20biomechanical%20variables%20and%20driving%20performance.pdf)
- Myers et al. 2008, *J Sports Sci* 26(2):181–188 (**Stufe A, [VT]**): 100 Freizeitgolfer mit Hcp, Driver, Gruppen nach
  Ballgeschwindigkeit (niedrig/mittel/hoch). Becken offen im Treffen **29,4 ± 8,6 / 35,3 ± 17,0 / 38,3 ± 7,2°** (nicht signifikant,
  p = 0,163), Oberkörper offen 20,3 / 22,8 / 25,2° (n. s.). Die Positionen im Treffmoment hingen **nicht** mit der Ballgeschwindigkeit
  zusammen – wohl aber Geschwindigkeiten im Abschwung (siehe Frage 3).
  [PDF](https://chs.uky.edu/sites/default/files/2023-12/Myers_2008_Role%20of%20upper%20torso%20and%20pelvis%20during%20golf%20swing.pdf)
- Joyce, Burnett, Wilkie & Ball 2013, *Sports Biomech* 12(2):108–120 (**Stufe A, [AB]**): 15 Low-Hcp-Männer (Hcp 2,5 ± 1,9),
  250 Hz. Zwischen Driver und 5-Eisen unterschieden sich Rumpf-Beugung/Streckung und Rotation des unteren Rumpfs, **nicht** die
  Seitneigung. [ECU](https://ro.ecu.edu.au/ecuworks2013/748)
- GOLFTEC SwingTRU 2016 (**Stufe B−/C**, Firmendaten, Methodik nicht offen; Zusammenfassung Golf Digest, [AB]): Profi-Mittel im
  Treffen: Hüfte **36° offen**, Hüfte **1,6 in (≈ 4 cm) zum Ziel** verschoben, „Shoulder Tilt“ **39°**; am Top Schulterneigung 36°
  vs. 29,6° bei hohem Hcp; je niedriger das Hcp, desto näher an diesen Werten.
  [Golf Digest](https://www.golfdigest.com/story/swing-by-numbers-new-study-unlocks-6-swing-secrets)
  Hinweis: „Shoulder Tilt“ ist die Neigung der **Schulterlinie**, nicht der Rumpf-Seitneigung – nicht mit `oberkoerperTreff` gleichsetzen.

**Beckenschub zum Ball / Early Extension / Haltungsverlust**
- TPI (**Stufe B/C**, [VT] Webseite): Early Extension = jede Bewegung des Beckens zum Ball in Rück- oder Abschwung; nach TPI
  **67 % von > 90.000** gescreenten Golfern, aber ca. **99 % von > 100 Tourprofis ohne**. Hauptursache laut TPI: tiefe Kniebeuge
  (Overhead Deep Squat) nicht möglich. Folgen: Block/Push/Hook, fette und dünne Schläge, Shank.
  [TPI](https://www.mytpi.com/articles/swing/early-extension-swing-characteristic)
- TPI-Zahlen über Sekundärquellen (**Stufe C**, [AB]): „Loss of Posture“ **64 %**, „Reverse Spine“ **39 %**, „Chicken Winging“
  **36 %** der Amateure; Methodik nicht veröffentlicht. [Foothills Rehab](https://foothillsrehab.com/blog/blog-golf-is-in-the-air/)
- Sportsbox AI / Golf Digest (**Stufe C**, [AB]): Tour-Becken bewegt sich bis zum Treffen > 5 in (≈ 13 cm) zum Ziel und bleibt in
  Richtung Ball/weg vom Ball „innerhalb von ein paar Zoll“ der Ansprechposition.
  [Golf Digest](https://www.golfdigest.com/story/useful-golf-swingfacts-sportsbox-ai-graph)
- GOLFTEC-Blog (**Stufe C**, [AB]): Tour-Hüftmitte (7-Eisen) Top → Treffen ≈ 3 in (≈ 8 cm) zum Ziel.
  [GOLFTEC](https://golftec.com/blog-posts/fix-my-fault---better-swing-starts-with-your-hips)
- Begutachtete Studien mit Normwerten zur Beckenverschiebung **zum Ball** (anterior) fand ich nicht (siehe Gaps).

**Führungsarm im Treffmoment**
- TPI „Chicken Winging“ (**Stufe B/C**, [VT]): vorderer Ellbogen knickt und Handgelenk „cuppt“ durch den Treffmoment; Ursachen u. a.
  fehlende Kraft/Übertragung aus dem Unterkörper, fehlende Außenrotation der vorderen Schulter, steiler Abschwung; Folgen:
  Kraftverlust, mehr Loft, mehr Spin. [TPI](https://www.mytpi.com/improve-my-game/swing-characteristics/chicken-winging)
- Chu et al. 2010 (**Stufe A, [VT]**): „Leading arm angle“ ist dort die **Ausrichtung** des Arms im Raum (63,3 ± 6,8° im Treffen),
  **kein Ellbogenwinkel** – taugt nicht als Norm für `fuehrungsarmTreff`.
- Zheng et al. 2008, *Int J Sports Med* 29:487–493 (**Stufe A, [AB]**): je 18 Profis, Low-, Mid-, High-Hcp, 240 Hz; die meisten
  Größen unterschieden sich zwischen den guten Gruppen und High-Hcp. Ellbogenwerte im Abstract nicht genannt; Volltext war
  nicht zugänglich (Bot-Sperre). [BISp](https://www.bisp-surf.de/Record/PU200809002851)

**Gewichts-/Druckverlagerung (Kraftmessplatten)**
- Chu et al. 2010 (**Stufe A, [VT]**): Vertikalkraft vorderer Fuß **29,0 ± 12,1 % KG** am Top → **93,9 ± 28,5 %** bei „Beschleunigung“
  → 95,1 ± 30,5 % (40 ms vorher) → **74,7 ± 29,7 %** im Treffen; hinterer Fuß im Treffen 35,5 ± 21,0 % KG. Als Verteilung
  gerechnet bleiben **66–69 % vorn** bis zum Treffen; die Gesamtkraft sinkt, weil der Körper nach oben arbeitet.
- McGhie (unveröffentlicht), präsentiert von S. Lynn/Swing Catalyst (**Stufe B−**, Folien, [VT]): 25 Golfer, 259 Schwünge.
  Druck **vorn beim Ansprechen** ≈ 54 % (alle Schläger). **Hinten am Top**: Driver 78,3 ± 14,0 %, mittlere Eisen 75,3 ± 12,4 %,
  kurze Eisen 71,7 ± 11,6 %. **Vorn im Treffen**: Driver **75,9 ± 17,7 %** (Spanne **3,6–100 %**), mittlere Eisen **81,8 ± 10,5 %**,
  kurze Eisen **84,2 ± 8,8 %**. Schlägerkopf 110 / 94 / 86 mph.
  [PDF](https://carolinas.pga.com/wp-content/uploads/sites/3/2019/03/Dr.-Scott-Lynn-PhD-Swing-Catalyst.pdf)
- BodiTrak-Auswertung (**Stufe C**, [AB]): die meisten Tourspieler ≥ 80 % hinten im Rückschwung und ≥ 80 % vorn im Treffen (Driver).
  [GolfWRX](https://golfwrx.com/372764/how-pga-tour-players-use-the-ground-trends-from-boditrak/)
- Ball, Best et al. 2002 (ISBS, 40 Golfer, Hcp +2 bis 26, **Stufe A, [AB]**): Clusteranalyse ergibt zwei Stile – **„Front Foot“**
  (Druck im Abschwung nach vorn, Treffen aus Fußmitte) und **„Reverse“** (Druck nach der Mitte des Abschwungs zurück nach hinten,
  Treffen mit Druck Richtung Zehen). [ISBS](https://ojs.ub.uni-konstanz.de/cpa/article/view/663)
- Ball 2006 (Dissertation, 62 Golfer, **Stufe A, [AB]**): beide Stile vom Profi bis zum hohen Hcp → **kein Fehler an sich**.
  [VU](https://vuir.vu.edu.au/1432/) · Ball & Best 2011, *J Sports Sci* 29(6):587–590 (46 Golfer, **[AB]**): beide Stile bei Driver,
  3- und 7-Eisen; **96 %** behalten ihren Stil über alle Schläger. [VU](https://vuir.vu.edu.au/9101/)
- Ball & Best 2012, *Sports Biomech* (5 Golfer × 50 Driver, **Stufe A, [AB]**): konsistentester Zusammenhang = größere Spanne der
  Druckverlagerung ↔ höhere Schlägerkopfgeschwindigkeit, aber stark individuell.
  [Suche](https://lida.sport-iat.de/twm/Record/4025708?lng=en)
- Han et al. 2019, *Sports Biomech* 18(2):115–134 (63 Männer Hcp ≤ 3, Driver/5-Eisen/PW, **Stufe A, [AB]**): Spitzenkräfte und
  Bodenmomente korrelieren mit max. Schlägerkopfgeschwindigkeit; vorderer Fuß erzeugt v. a. das Kraftmoment, hinterer das
  Drehmoment; die Belastung des vorderen Fußes um „Führungsarm waagerecht“ im Abschwung ist entscheidend.
  [TWU](https://twu-ir.tdl.org/items/473a3ba9-da5f-492c-a0e1-6b78412eb1ff)
- Penn State Golf Biomechanics (**Stufe B**, [AB]): Druckmittelpunkt (CoP) wandert früh im Abschwung schnell nach vorn, der
  Körperschwerpunkt (CoM) bewegt sich deutlich weniger seitlich.
  [PSU](https://golf.psu.edu/biomechanics-of-golf/biomechanical-assessment-of-3d-data/forces-center-of-pressure-center-of-mass-in-the-golf-swing)

**Kinematische Kette**
- Tinmark et al. 2010, *Sports Biomech* 9(4):236–244 (**Stufe A, [VT]** ISBS-Kurzfassung): 47 Golfer (11 Tourprofis, 23 Amateure
  Hcp 0 ± 2, 13 Frauen Hcp −2 ± 2), Wedge 40/55/70 m, 5-Eisen, Driver, 240 Hz: Beginn und Spitze der Winkelgeschwindigkeit
  **Becken → Oberkörper → Hand** in **allen** Schlagarten, bei Männern, Frauen, Profis und Amateuren; Geschwindigkeitszuwachs
  Oberkörper→Hand bei Profis größer als bei Amateurinnen. [ISBS](https://ojs.ub.uni-konstanz.de/cpa/article/view/3136) ·
  [PubMed](https://pubmed.ncbi.nlm.nih.gov/21309298/)
- Cheetham et al. (2007/2008, zitiert in Zhou et al. 2022, **[AB]** Sekundär): Profis Becken → Brustkorb → Arm → Schläger;
  bei Amateuren liegt die Armspitze im Mittel **vor** der Brustkorbspitze (Arme zu früh).
- Zhou et al. 2022, *Front Sports Act Living* 4:986281 (**Stufe A, [VT]**): 11 Profis, 5-Eisen: max. Oberkörper 551,7 ± 47,6 °/s,
  Becken 415,2 ± 32,9 °/s im Abschwung. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9816382)

### Inferences
- Für die Driver-Seitneigung im Treffen liegt der Bereich „Mittel ± 1 SD“ bei Chu ungefähr **8–21°**; die App-Grenze 8° entspricht
  damit grob dem unteren 16-%-Rand einer Gruppe mit Hcp ~8 – vorausgesetzt, 2D-App-Winkel und 3D-Studienwinkel wären gleich
  (sind sie nicht, siehe Frage 4).
- Bei Eisen ist nach Joyce 2013 kein signifikanter Unterschied der Seitneigung zum Driver belegt (kleine Stichprobe); die verbreitete
  Lehrmeinung „Eisen weniger Neigung“ ist damit nicht belegt, aber auch nicht widerlegt.
- Vorneigung „halten“ ist im Mittel guter bis mittlerer Spieler messbar (Chu: Top → Treffen +0,6°). Ein Bezug Ansprechen → Treffen
  fehlt in Chu, weil kein Ansprechwert berichtet wird.
- Druck im Treffmoment bei Eisen höher vorn (≈ 82–84 %) als beim Driver (≈ 70–76 %); eine einzige Schwelle für alle Schläger passt
  daher nicht, und einzelne gute Spieler haben im Treffen wenig Druck vorn (Reverse-Stil).

### Gaps
- Keine frei zugänglichen begutachteten Normwerte (Mittel/SD nach Hcp) für **Ellbogenwinkel des Führungsarms im Treffmoment**
  (Zheng 2008 Volltext gesperrt; Suche ohne Treffer).
- Keine begutachteten Normwerte für **Beckenverschiebung zum Ball** (anterior) in cm oder % – nur TPI-Häufigkeiten und Firmenaussagen.
- Keine begutachteten Daten zur **Hüftlage im Finish**.
- GOLFTEC-Definitionen („Shoulder Tilt“, „Shoulder Bend“) und Stichproben nicht offen gelegt.

---

## 2. Tempo: Rückschwung : Abschwung – was ist gemessen, was ist Behauptung?

### Takeaway
Das Verhältnis **~3 : 1 bei Tourprofis** ist durch eine unabhängige Sensor-Messung gestützt (12 Playing Pros: **2,5–3,5**, Mittel
≈ 3,0, sehr gleichmäßig), aber **nicht** durch eine begutachtete Studie belegt, die das Verhältnis mit Leistung oder Handicap
verknüpft. Was gute Spieler auszeichnet, ist vor allem die **geringe Schwankung** und der **schnellere Abschwung**; ein niedriges
Verhältnis kann von einem **langsamen Abschwung** kommen, nicht nur von einem hastigen Rückschwung.

### Cited Findings
- Novosel & Garrity, *Tour Tempo* (2004) (**Stufe B/C**, Buch; über Grober 2006 [VT]): Auszählung von 30-Bilder/s-Videos;
  meist **24 : 8 Bilder** (≈ 0,8 s : 0,27 s), alle berichteten Spieler zwischen **21/7 und 30/10** – also durchweg ≈ 3 : 1 bei
  unterschiedlicher Gesamtdauer.
- Grober & Cholewicki 2006, arXiv physics/0611291 (**Stufe A−**: Messdaten, Preprint, [VT]): Beschleunigungssensoren im Schaft.
  **Playing Pros n = 12**: Verhältnis **2,5–3,5**, Mittel nahe **3,0**, sehr kleine SD von Schwung zu Schwung, Rückschwung
  **0,7–0,8 s**. **Lehrer + gute Amateure n = 13** und **übrige Golfer n = 18**: Mittel ebenfalls ≈ 3,0, aber deutlich breitere
  Streuung zwischen Spielern und größere SD innerhalb eines Spielers; Profis schwingen insgesamt schneller. Federmodell
  (harmonischer Oszillator): Verhältnis 2,5–3,5, solange Kraft Abschwung : Rückschwung 1–3 beträgt; Rückschwungdauer nahezu
  unabhängig von der Schlaglänge. [arXiv](https://arxiv.org/pdf/physics/0611291)
- Grober 2010, arXiv 1001.1137 (**Stufe A−**, Preprint, [VT]), Einzelfälle (Mittel ± SD):
  - Profi (7 Schwünge): **731 ± 21 / 258 ± 8 ms → 2,8 : 1**.
  - Hcp ~25, „bemerkenswert gleichmäßig“: 830 ± 18 / **433 ± 18 ms → ≈ 1,9 : 1** (langsamer Abschwung, wenig Kraft).
  - Hcp ~10: 817 ± 16 / 385 ± 20 ms → ≈ 2,1 : 1.
  - College-Spieler: 692 ± 48 / 201 ± 33 ms → ≈ 3,4 : 1; Tempo schwankt ≈ 10 %, laut Autor „nicht vorteilhaft“.
  - PGA-Tour-Profi: 724 ± 23 / 248 ± 4 ms → ≈ 2,9 : 1.
  - Long-Drive-Profi: 750 ± 30 / 310 ± 11 ms → ≈ 2,4 : 1.
  [arXiv](https://arxiv.org/pdf/1001.1137)
- Chu et al. 2010 (**Stufe A, [VT]**): Abschwung Top → Treffen **0,30 ± 0,06 s** (n = 308, Driver, Hcp 8,4).
- Sommer & Rönnqvist 2009, *JSSM* 8:648–656 (**Stufe A, [AB]**): 26 Golfer (Hcp 12,6), randomisiert; 4 Wochen synchronisiertes
  Metronom-Training → bessere Zeitgebung und **signifikant genauere Schläge mit weniger Streuung**; Kontrollgruppe ohne Effekt.
  [JSSM](https://www.jssm.org/jssm-08-648.xml-abst)
- Blast Motion (**Stufe C**): Vollschwung-Ziel 2,5–3,1 : 1, ohne Methodik. [Blast](https://blastmotion.com/blog/what-is-golf-swing-tempo-ratio/)
- Grober 2009/2011 Putten (**[AB]**): beim Putten ≈ 2 : 1 – nicht auf den Vollschwung übertragen.
  [Technology Review](https://www.technologyreview.com/2009/03/13/214919/the-secret-of-world-class-putting/)

### Inferences
- Ein grünes Band um 3 : 1 ist für **gute Spieler** gestützt (2,5–3,5). Das App-Band **2,4–4,0** ist am oberen Ende großzügiger als
  die Profidaten, lässt sich aber mit dem **Messfehler bei 30 Bildern/s** rechtfertigen: Ein Abschwung von 0,25–0,30 s sind nur
  7–9 Bilder; ±1 Bild = ±11–13 % → ein echtes 3,0 erscheint als ≈ 2,65–3,4, ein echtes 3,5 bis ≈ 4,0.
- Die App-Logik „Verhältnis < 2,4 = Rückschwung zu hastig“ ist **nicht immer richtig**: Grobers gleichmäßiger Hcp-25-Spieler (Rückschwung
  0,83 s, also eher lang) hätte 1,9 : 1 wegen eines **langsamen Abschwungs** (0,43 s). Die absoluten Zeiten (stehen bereits im
  `detail`) sollten die Tipp-Variante bestimmen.
- „Gute Spieler sind gleichmäßig“ (kleine SD) ist besser belegt als „gute Spieler haben 3 : 1“ – Amateure liegen im Mittel ebenfalls
  bei ≈ 3 : 1, streuen aber stärker (Grober 2006).

### Gaps
- Keine begutachtete Studie, die das Verhältnis mit Handicap, Schlägerkopfgeschwindigkeit oder Treffqualität statistisch verknüpft.
- Grober-Daten nur als Preprint/Abbildung; Einzelwerte der 43 Golfer nicht tabelliert.
- Unterschiedliche Definitionen von „Start“ und „Top“ (Schläger vs. Hände) verändern das Verhältnis; nicht systematisch untersucht.

---

## 3. Was hängt mit Schlägerkopfgeschwindigkeit, Treffqualität, Konstanz und Rückenschmerz zusammen?

### Takeaway
Mit **Geschwindigkeit** verbunden sind vor allem X-Faktor/X-Faktor-Stretch, die Rotationsgeschwindigkeit des Oberkörpers im
Abschwung, frühe Kraft auf den vorderen Fuß und die Seitneigung des (Gesamt-)Rumpfs zum Treffen hin (Chu, Myers, Han). Für
**Konstanz/Treffqualität** zählt eher die Gleichmäßigkeit von Haltung und Timing (Yamamoto 2023, Sommer 2009). Für
**Rückenschmerz** gibt es **keinen schlüssigen Beleg**, dass „schlechte Technik“ ihn verursacht; belegt sind Alter und Körpermasse.

### Cited Findings
- Chu et al. 2010 (**Stufe A, [VT]**): Schrittweise Regression erklärt **43,7 / 66,0 / 73,5 / 50,5 %** der Ballgeschwindigkeit
  (Top / Beschleunigung / 40 ms / Treffen). Seitneigung ist zu jedem Zeitpunkt Prädiktor (Beta 0,27 / 0,17 / 0,16 / 0,28), ihre
  Geschwindigkeit ab Beschleunigung; mehr Vertikalkraft vorn bei Beschleunigung (Beta 0,19) und 40 ms vorher (0,22) günstig;
  Vorneigung im Treffen Beta 0,26; X-Faktor am Top Beta −0,25 (negativ definiert → mehr Trennung = schneller).
  Ballgeschwindigkeit korreliert mit Hcp **r = −0,71**.
- Myers et al. 2008 (**Stufe A, [VT]**): X-Faktor am Top **r = −0,55**, maximaler X-Faktor (Stretch) **r = −0,54** mit
  Ballgeschwindigkeit (negativ definiert); max. Oberkörper-Drehgeschwindigkeit 591 ± 67 / 675 ± 84 / 767 ± 73 °/s (alle drei Gruppen
  signifikant verschieden), max. Becken 358 / 410 / 434 °/s; **Positionen im Treffmoment ohne Zusammenhang**.
- Joyce 2016, *J Sports Sci* (35 Amateure ohne Rückenschmerz) und Joyce et al. 2013/2017 (15 Low-Hcp) (**Stufe A, [AB]**): höhere
  Schlägerkopfgeschwindigkeit mit **weniger Seitneigung des unteren Rumpfs** (Lendenbereich relativ zum Becken) und mehr
  X-Faktor-Stretch des unteren Rumpfs. [Joyce 2010 Methodik](https://vuir.vu.edu.au/7114/)
  → Widerspricht Chu nur scheinbar: Chu misst den Gesamt-Rumpf zur Senkrechten, Joyce die Lende relativ zum Becken.
- Nesbit 2005, *JSSM* 4:499–519 (**Stufe A, [VT]**): 84 Männer + 1 Frau; stärkste Zusammenhänge mit Hcp: geleistete Gesamtarbeit
  und Handbahn (kleinerer innerer Radius); Grifftempo kaum. [JSSM](https://www.jssm.org/jssm-04-499.xml-Fulltext)
- Han et al. 2019 (**Stufe A, [AB]**): Bodenkräfte und -momente korrelieren mit max. Schlägerkopfgeschwindigkeit (63 Low-Hcp).
- Yamamoto et al. 2023, *Front Sports Act Living* 5:1272038 (**Stufe A, [VT]**): 27 Uni-Golfer, 7-Eisen, 240 Hz von hinten,
  HRNet-Pose. **Mittlere Vorneigung** (Ohr–Hüfte) **ohne** Zusammenhang mit dem Score (r = −0,18), aber die **Schwankung der
  Vorneigung über die Schwünge** stark (r = 0,80 mit Score; r = 0,61 mit Genauigkeit). (Einige Konfidenzintervalle im Artikel
  wirken unstimmig.) [Frontiers](https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2023.1272038/full)
- Ball & Best 2012 (**[AB]**): größere Spanne der Druckverlagerung ↔ höhere Schlägerkopfgeschwindigkeit, individuell verschieden.
- Izumoto et al. (**Stufe A, [AB]**): Golfer mit CoP vor bzw. hinter dem Schwerpunkt im Treffen unterschieden sich nicht in den
  äußeren Momenten → verschiedene Strategien funktionieren. [AUT](https://sprinz.aut.ac.nz/__data/assets/pdf_file/0013/203116/237_1584_Izumoto.pdf)
- **Rücken:** Watson et al. 2024, *J Sports Sci* (systematische Übersicht, 9 Studien, **Stufe A, [AB]**): Hinweise u. a. auf höhere
  lumbale Seitneigungs-Geschwindigkeit, aber Evidenz sehr begrenzt, widersprüchlich, hohes Bias-Risiko, keine prospektiven
  Studien; **kein schlüssiger Beleg** für „schlechte Technik → Rückenschmerz“. [QMUL](https://qmro.qmul.ac.uk/xmlui/handle/123456789/95238)
- Smith et al. 2018, *Sports Health* (Metaanalyse, 19 Studien, **Stufe A, [AB]**): gepoolt signifikant nur **Alter** und **Körpermasse**.
  [UNLV](https://digitalscholarship.unlv.edu/pt_fac_articles/55)
- Cole & Grimshaw 2014 (**Stufe A, [AB]**): „Crunch-Faktor“ (Seitneigung × Rotationsgeschwindigkeit) trennt 12 Golfer mit
  Rückenschmerz nicht von 15 ohne. [HBKU](https://elmi.hbku.edu.qa/en/publications/the-crunch-factors-role-in-golf-related-low-back-pain/)
  Cole & Grimshaw 2016, *Sports Med* 46(3):339–351 (Review, [AB]): Mechanismus unklar, wenig direkte Forschung.
  [ACU](https://acuresearchbank.acu.edu.au/item/85zx1/the-biomechanics-of-the-modern-golf-swing-implications-for-lower-back-injuries)
- Tsai et al. 2010, *JOSPT* 40(7) (**Stufe A, [VT]** teilw.): Golfer mit Rückenschmerz-Vorgeschichte: weniger Rumpfstreckkraft,
  weniger Drehung zur Nicht-Zielseite, schwächere Adduktion der linken Hüfte; **Rotationsgeschwindigkeiten im Schwung nicht
  verschieden**. [PDF](https://chs.uky.edu/sites/default/files/2023-12/Tsai_2010_A%20Comparison%20of%20Physical%20Characteristics%20and%20Swing%20Mechanics%20Between%20Golfers%20With%20and%20Without%20a%20History%20of%20Low%20Back%20Pain.pdf)

### Inferences
- Mehr Seitneigung des **Gesamtrumpfs** im Treffen geht (Driver) mit mehr Geschwindigkeit einher; übertriebenes Abknicken in der
  **Lende** nicht. Ein App-Tipp sollte die Neigung aus dem Becken-/Hüftschub entstehen lassen („Hüfte leicht zum Ziel, Oberkörper
  bleibt zurück“) statt „Schulter runter drücken“.
- Positionen im Treffmoment allein erklären die Geschwindigkeit schlecht (Myers); Geschwindigkeiten und Timing sind wichtiger –
  die App kann aber vor allem Positionen messen.
- Aussagen zu Verletzungsrisiko durch einzelne Schwungmerkmale sind derzeit **nicht** belegt und sollten in der App fehlen.

### Gaps
- Kein Nachweis, dass Early Extension Treffqualität **kausal** verschlechtert (nur TPI-Beobachtung und Lehrmeinung).
- Keine Längsschnittstudie zu Rückenschmerz und Seitneigung/Early Extension.

---

## 4. Wie genau kann 2D-Video (MediaPipe, frontal/von hinten) diese Größen schätzen?

### Takeaway
**Zeiten/Phasen** lassen sich mit 2D-Video gut messen (ICC > 0,93 gegenüber Vicon); **Winkel** aus einer Kamera sind durch
Projektion verzerrt, und Pose-Modelle sind für Golf nicht gegen 3D validiert. **Gewicht/Druck kann man aus Pose nicht messen**;
die Hüftlage ist nur ein grober Ersatz für die Schwerpunktlage, und der Schwerpunkt ist nicht der Druck.

### Cited Findings
- *Scientific Reports* 2022 (12 Golfer, Kinovea/SiliconCoach vs. Vicon, **Stufe A, [AB]**): Schwungzeit und Phasen ohne signifikante
  Unterschiede, ICC > 0,929; ein Vergleich der Beschleunigungsphase wich ab. [PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9385988/)
- DTU-Studie „Evaluating current state of monocular 3D pose models for golf“ (Autoren nicht geprüft, **Stufe A, [AB]**): monokulare 3D-Pose
  sieht plausibel aus, ist aber gegenüber Marker-Capture für Kinematik **zu ungenau**; 2D-Winkel leiden unter Parallaxe (gleiche
  Bewegung → andere Winkel je Blickrichtung). [DTU](https://orbit.dtu.dk/en/publications/evaluating-current-state-of-monocular-3d-pose-models-for-golf/)
- Yamamoto et al. 2023 (**Stufe A, [VT]**): selbst bei 240 Hz und HRNet erklären die Autoren, dass die Genauigkeit unter 3D liegt und
  gegen 3D erst noch zu prüfen ist; Golf hat Drehungen, die eine Kamera nicht voll erfasst.
- Laufstudie mit MediaPipe/OpenPose (**Stufe A, [AB]** über Suche): hohe Korrelationen, aber Schwächen bei **Spitzenwinkeln**
  (maximale Beugung/Streckung). [CORE](https://core.ac.uk/works/131636332)
- Gewicht: CoP (Druck) kann sich schnell bewegen, ohne dass der Schwerpunkt viel wandert (PSU, **Stufe B**); Hertfordshire-Arbeit:
  Beziehung Schwerpunkt ↔ CoP ist komplex (**[AB]**) [UH](https://uhra.herts.ac.uk/id/eprint/16733/); Izumoto: unklare Wechselwirkung.
  Eine validierte Formel „Hüftlage → Gewicht“ fand ich nicht.

### Inferences
- **Bildrate:** bei 30 Bildern/s ±33 ms je Ereignis → Abschwung (≈ 250–300 ms) ±11–13 %; bei 60 Bildern/s ±6 %; bei 240 Bildern/s
  (iPhone-Zeitlupe) ≈ ±1,5 %. Für das Tempo ist Zeitlupe mit bekannter Bildrate am genauesten (die App behandelt Zeitlupe derzeit
  als „unsicher“).
- **`oberkoerperTreff` (frontal):** Im Treffen ist der Oberkörper ≈ 23° geöffnet und ≈ 23° vorgeneigt (Chu). Ein Teil der Vorneigung
  zeigt dann in Zielrichtung und **verringert** den sichtbaren 2D-Winkel (grob 23° · sin 23° ≈ 9°). Eine 3D-Seitneigung von 14° könnte
  im Bild also deutlich kleiner erscheinen (eigene Überschlagsrechnung, nicht validiert). Die 8°-Grenze kann daher gute Spieler
  fälschlich als „zu gerade“ markieren – an den echten Testschwüngen in `tests/daten/` prüfen.
- **`vorneigungHalten` (von hinten):** Beckenöffnung (35°) und Seitneigung (14°) drehen die Rumpflinie im Treffen teilweise aus der
  Bildebene; der 2D-Winkel ist damit eine Mischgröße. Kameraposition (Höhe, genau auf Ziellinie) beeinflusst ihn zusätzlich.
- **`hueftBall`:** MediaPipe-Hüftpunkte sind Hüftgelenk-Schätzungen; wenn sich das Becken um ≈ 35° öffnet und um die vordere Hüfte
  dreht, wandert die Hüftmitte im Bild auch ohne echten Schub. Kleine Werte (< ~5 % Rumpflänge) sind deshalb nicht deutbar.
- **`fuehrungsarmTreff`:** frontal liegt der Führungsarm im Treffen ungefähr in der Bildebene → 2D-Winkel brauchbar; Bewegungsunschärfe
  bei 30 Bildern/s und Handgelenk-Erkennung am Schläger sind Hauptfehlerquellen.
- **`gewicht`:** misst die Hüftlage im Finish – das ist ein vernünftiger Ersatz für **Balance/Schwerpunkt über dem vorderen Fuß im
  Finish**, aber **nicht** für Druck oder Gewicht im Treffmoment.

### Gaps
- Keine golfspezifische Validierung von MediaPipe-2D-Winkeln gegen 3D-Motion-Capture gefunden.
- Keine validierte Pose-basierte Schätzung des Druckmittelpunkts im Golfschwung gefunden.

---

## 5. Welche Übungen/Interventionen sind belegt oder werden von seriösen Lehrplänen einheitlich gelehrt?

### Takeaway
Für **Tempo** gibt es eine randomisierte Studie (Metronom-Training verbessert Genauigkeit). Für Early Extension, Gewichtsverlagerung,
Führungsarm und Seitneigung gibt es **keine** frei zugänglichen kontrollierten Übungsstudien; die Übungen stammen aus Lehrplänen
(TPI, Stufe B) und werden dort mit **körperlichen Ursachen** (Beweglichkeit/Kraft) verknüpft.

### Cited Findings
- **Tempo:** Sommer & Rönnqvist 2009 (**Stufe A, [AB]**): 4 Wochen Metronom-Synchronisation → genauere, gleichmäßigere Schläge.
  Tour Tempo (Novosel, **Stufe B/C**): Töne im 3 : 1-Takt (z. B. 24/8 bzw. 21/7 „Bilder“). [Golf Digest/Grober](https://www.golfdigest.com/story/yale-professor-robert-grober-golf-swing-tempo-lecture)
- **Early Extension** (TPI, **Stufe B/C**, [VT]): Übungen „Merry Go Round“, „Too Close“, „Arrows“, „Beltloop Back“ (Gefühl der
  Hüftbewegung im Übergang) plus Kniebeuge-Progression; Screening mit Overhead Deep Squat.
  [TPI](https://www.mytpi.com/articles/swing/early-extension-swing-characteristic)
- **Führungsarm / Chicken Wing** (TPI, **Stufe B/C**, [VT]): „Supine Egyptian Presses“ (Schulterrotation), „Forehand Topspin Drill“
  (Unterarm-Release), Schwünge nur mit dem Führungsarm, „Motorcycle“ (Handgelenk); Ursache oft Unterkörper/Schulter-Außenrotation.
  [TPI](https://www.mytpi.com/improve-my-game/swing-characteristics/chicken-winging)
- **Gewicht/Druck:** Han 2019 (**Stufe A, [AB]**) betont das Belasten des vorderen Fußes **früh** im Abschwung (bis „Arm waagerecht“);
  Ball & Best (**Stufe A**) zeigen, dass der Reverse-Stil kein Fehler sein muss. Ein Trainer schreibt, hohe Hcps verlagern zu **spät**
  (**Stufe C**, Einzelmeinung). [GolfWRX](https://golfwrx.com/202921/the-difference-between-professionals-and-amateurs-is-in-the-ground/)
- **Rücken/Bewegungsumfang:** Tsai 2010 (**Stufe A**) nennt verkürzten Rückschwung als mögliche Schutzstrategie bei eingeschränkter
  Drehung (mit Verweis auf Daten ohne großen Geschwindigkeitsverlust).

### Inferences
- Die App-Übung „Mitzählen“ passt zum Prinzip der Metronom-Studie; ein hörbarer Takt (Töne statt Zählen) wäre näher an der Evidenz.
- „Po an die Wand“ / „Golftasche hinter dem Po“ entsprechen dem TPI-Prinzip (Gesäß bleibt hinten, Wand-/Stuhl-Referenz) –
  Stufe B, nicht in Studien geprüft. Wenn ein Spieler die tiefe Kniebeuge nicht schafft, nennt TPI Beweglichkeit als Ursache; ein
  kurzer Hinweis darauf wäre fachlich gedeckt.
- „Finish 3 Sekunden halten“ ist als Balance-Übung plausibel, aber nicht als Mittel gegen den Reverse-Stil belegt.

### Gaps
- Keine kontrollierten Studien zu Übungen gegen Early Extension, Chicken Wing oder zu wenig Seitneigung gefunden.
- Studien zu äußerem Fokus (Wulf u. a.) wurden in dieser Runde nicht geprüft (eigenes Thema „Richtig üben“).

---

## Abgleich mit der App

| Kennzahl | App heute | Urteil | Vorschlag | Quellen |
|---|---|---|---|---|
| `fuehrungsarmTreff` | Gut 155–180°, Achtung 140–155°; Text: Knick → Schwungkreis kleiner, dünn/getoppt, weniger Weite | **unklar** (Richtung plausibel, Zahl nicht belegt) | Grenze als **eigene Festlegung** kennzeichnen. Folgen-Text an TPI anlehnen: „kostet Kraft, mehr Loft und Spin“ (getoppt/dünn ist nicht belegt). Ursache nennen: „oft stoppt die Körperdrehung“ (steht schon im `gefuehl` – gut). Optional zweiter Messpunkt kurz **nach** dem Treffen (Chicken Wing zeigt sich dort deutlicher). | TPI Chicken Winging (B/C); keine A-Quelle gefunden |
| `oberkoerperTreff` | Gut ≥ 8° vom Ziel weg, Achtung 2–8°; Text: nur mit tieferer rechter Schulter kommt der Schläger flach von innen; gerade → steil, Slice, tiefe Divots | **anpassen** | Zahl: Driver 3D-Mittel 14,4 ± 6,5° (Chu, Hcp 8) → 8° wäre in 3D ≈ Mittel − 1 SD; in 2D frontal erscheint der Winkel wegen Vorneigung + offenem Oberkörper vermutlich **kleiner**. Grenze an `tests/daten/` (Profi-Schwünge) kalibrieren, eher **5–6°** als 8°, bis geprüft. Text: Geschwindigkeits-Bezug ist belegt („mehr Neigung im Treffen geht mit mehr Ballgeschwindigkeit einher“), der Slice/Divot-Satz **nicht** (keine Quelle gefunden) → abschwächen. Gefühl nicht „Schulter runter drücken“, sondern „Hüfte leicht zum Ziel, Brust bleibt hinter dem Ball“ (Joyce: Abknicken in der Lende bringt nichts). | Chu 2010 (A); Joyce 2013/2016 (A); GOLFTEC (C) |
| `gewicht` | Hüftmitte im Finish ≥ 85 % zum vorderen Fuß; Name „Gewicht vorne“; Text: Gewicht hinten → fehlt Kraft im Treffmoment, Ball zu hoch/seitlich | **anpassen** (Messung ok, Deutung falsch benannt) | Umbenennen in **„Balance im Finish“** / „Hüfte über dem vorderen Fuß“. 85 % als Finish-Balance plausibel (eigene Festlegung). Text nicht auf den Treffmoment beziehen: Druck im Treffen liegt bei guten Spielern im Schnitt ≈ 76 % (Driver) bis ≈ 84 % (kurze Eisen) vorn, aber mit großer Streuung, und der **Reverse-Stil** kommt bei allen Spielstärken vor. Belegt ist: früh im Abschwung Druck nach vorn → mehr Ballgeschwindigkeit. „Ball zu hoch oder zur Seite“ ist nicht belegt → streichen. | Chu 2010 (A); McGhie/Lynn (B−); Ball & Best 2002/2006/2011 (A); Han 2019 (A) |
| `vorneigungHalten` | Verlust ≤ 10° gut, 10–15° Achtung; Text: Aufrichten ändert Abstand → Toppen, Shanks | **belegt in der Richtung, Zahl unklar** | Mittlere Vorneigung bleibt bei guten Spielern Top→Treffen gleich (Chu: +0,6°); 10° Toleranz ist bei 2D-Mischwinkel und Kamerafehlern vernünftig – als eigene Festlegung kennzeichnen. Ergänzen: **Gleichmäßigkeit über mehrere Schwünge** ist stärker mit dem Score verbunden als der Mittelwert (Yamamoto r = 0,80) → in Gesamtauswertung/Fortschritt die Streuung zeigen. Folgen-Text um „Block/Push“ ergänzen (TPI). | Chu 2010 (A); Yamamoto 2023 (A); TPI (B/C) |
| `hueftBall` | ≤ 12 % Rumpflänge gut, 12–22 % Achtung; Text: Hüfte nimmt den Armen den Platz | **plausibel / unklar** | 12 % von ≈ 50 cm Rumpf ≈ 6 cm passt zur Aussage „Tour-Becken bleibt innerhalb von ein paar Zoll“ (C-Quelle) und zu TPI (99 % der Profis ohne Early Extension). Als eigene Festlegung kennzeichnen; Werte < 5 % nicht deuten (Hüftmitte wandert durch Beckendrehung). Beweglichkeits-Hinweis (tiefe Kniebeuge) als mögliche Ursache ergänzen. | TPI (B/C); Sportsbox/GOLFTEC (C); keine A-Quelle |
| `tempo` | Gut 2,4–4,0 : 1, Achtung 2,0–2,4 und 4,0–4,6; Gut-Text „Rhythmus wie gute Spieler (3 : 1)“; < 2,4 → „Rückschwung zu hastig“ | **Band belegt (mit Messfehler), Tipp-Logik anpassen** | Profis 2,5–3,5 (Mittel ≈ 3,0, n = 12); das breitere App-Band ist mit ±1 Bild bei 30 fps (±11–13 %) begründet → beibehalten. **Variante nach absoluten Zeiten wählen**: Rückschwung < ≈ 0,7 s → „hastig“; Abschwung > ≈ 0,35 s → „Abschwung kraftlos/zögerlich“ (Grober: Hcp 25 mit 0,83 s / 0,43 s = 1,9 : 1). Text „Gute Spieler brauchen zurück etwa dreimal so lange“ ist ok; ergänzen: „Wichtiger als die genaue Zahl ist, dass es jedes Mal gleich ist“ und Gleichmäßigkeit über mehrere Schwünge messen. Metronom/Töne als Übung (Sommer 2009). | Grober & Cholewicki 2006 (A−); Grober 2010 (A−); Novosel (B/C); Sommer & Rönnqvist 2009 (A); Chu 2010 (A) |
| Kinematische Kette (Hintergrund, `vollschwung.md`) | „Hüfte → Brust → Arme → Schläger“ | **belegt** | Kernsatz bleibt. Zahlen ergänzen: Becken ≈ 360–430 °/s, Oberkörper ≈ 550–770 °/s (Myers, Zhou); gilt für alle Schlagarten und Spielstärken (Tinmark). Mit 2D nicht messbar – nur als Wissen, nicht als Kennzahl. | Tinmark 2010 (A); Myers 2008 (A); Zhou 2022 (A); Cheetham (A, sekundär) |
| Bodenkräfte (Hintergrund, `vollschwung.md`) | „Druck zuerst nach links … 80 % → 52 %“ (ein Tourspieler) | **belegt, erweitern** | Gruppendaten ergänzen: Top ≈ 72–78 % hinten, Treffen ≈ 76–84 % vorn (McGhie, 25 Golfer), Kraft vorn steigt schon bei ⅔ des Abschwungs auf ≈ 94 % KG (Chu). Reverse-Stil als zulässige Variante erwähnen. | Chu 2010 (A); McGhie/Lynn (B−); Ball & Best (A) |
| Hüfte offen im Treffen (`vollschwung.md`: 36° vs. 20°) | GOLFTEC-Werte | **belegt in der Größenordnung** | Begutachtete Werte bestätigen ≈ 35° (Chu 35,2 ± 12,3°; Myers 29–38°), aber kein signifikanter Zusammenhang mit Ballgeschwindigkeit (Myers). „20° bei hohem Hcp“ bleibt C-Quelle. | Chu 2010 (A); Myers 2008 (A); GOLFTEC (C) |
| Rücken-/Verletzungsaussagen | (keine in den Tipps; `vollschwung.md` warnt vor „umgekehrtem C“) | **belegt als Vorsicht, nicht als Risiko-Aussage** | Keine Aussage „Fehler X verursacht Rückenschmerz“ in die App (Watson 2024: kein schlüssiger Beleg). Hinweis auf übertriebenes Hohlkreuz im Finish als Lehrmeinung (B) belassen. | Watson 2024 (A); Smith 2018 (A); Cole & Grimshaw (A) |
