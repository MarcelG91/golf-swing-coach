# Plan: Tipps neu gestalten (kurz, bildlich, zum Mitmachen)

Stand: 28.09.2026 · Branch `tipps-neu` (danach `uebungsmodus`)

## Warum

Rückmeldung aus der Nutzung: Die Trainings- und Verbesserungshinweise sind zu lang und sperrig.
Eine Baustellen-Karte hatte gut 110 Wörter Fließtext – auf der Range liest das niemand.

## Entscheidungen (28.09.)

| Frage | Entscheidung |
|---|---|
| Aufbau des Ergebnisses | **Wisch-Karten**: eine Baustelle pro Karte, Punkte „● ○ ○“, nächste Karte lugt rechts herein, letzte Karte „Läuft schon gut ✓“ |
| Bild pro Baustelle | **Strichfigur + Skala**: Skelett aus den Posedaten im passenden Moment (rot = du, gelb = Ziel) und ein Balken mit grünem Zielbereich |
| Erklärung pro Baustelle | **„Warum?“ in 1–2 Sätzen** direkt auf der Karte (Rückmeldung zum Entwurf 1) |
| Bilder zu den Übungen | **Animierte Strichfiguren** pro Übungsschritt, mit Hilfsmitteln (Stab, Ball, Spiegel, Hilfslinien). Keine echten Videos: zu groß fürs Handy und offline, und Videos gehören nicht ins Repo |
| Lernhilfen | **Schwunggedanke** (Merksatz, wird mit der Sitzung gespeichert) und **Übungsmodus Range** (eigener Branch) |
| Texte | Alle Kennzahlen bekommen Kurzfelder; das Gefühl bleibt unter „So fühlt es sich richtig an“ |
| Tempo auf dem Handy | Kein Springen im Video für die Karten-Bilder (auf dem iPhone langsam). Figuren werden gezeichnet – sofort da, auch ohne Video. Animationen laufen nur, solange sie zu sehen sind |

## Neue Felder pro Kennzahl

- `kurz` – eine Zeile, was los ist (höchstens 6 Wörter)
- `warum` – 1–2 Sätze, warum man das anpassen sollte (höchstens 30 Wörter)
- `gedanke` – Schwunggedanke zum Merken (höchstens 5 Wörter)
- `uebung` – `{ name, wiederholungen, schritte: [2–4 kurze Sätze] }`; animierte Bilder zu den Schritten kommen
  im Branch `uebungsmodus` (Folge von Posen + Hilfsmittel)

Tests prüfen diese Grenzen, damit die Texte nicht wieder wachsen.

## Die Texte (zur Durchsicht, z. B. durch einen Golflehrer)

Maßgeblich ist `tipps.js` – diese Liste ist daraus erzeugt (Stand 28.09., nach der Web-Recherche).
Formulierungen für Rechtshänder; die App setzt links/rechts für Linkshänder automatisch um.

### Arme beim Ansprechen (von hinten)

**Hände zu weit vorn**

- **kurz:** Du greifst nach dem Ball
- **warum:** Greifst du nach dem Ball, sind die Arme angespannt. Der Schwung wird flach und du kippst leicht nach vorne.
- **gedanke:** Arme hängen lassen
- **wort (Live-Rahmen, ≤ 3 Wörter):** Arme hängen lassen
- **Übung: Arme baumeln lassen** · 10×
  1. Ansprechhaltung ohne Schläger.
  2. Arme 3 Sekunden locker hängen lassen.
  3. Hände zusammen, Schläger hineinlegen.

**Hände zu nah am Körper**

- **kurz:** Hände zu nah am Körper
- **warum:** Sind die Hände zu nah am Körper, haben die Arme im Abschwung keinen Platz. Du musst ausweichen oder dich aufrichten.
- **gedanke:** Eine Faust Platz
- **wort (Live-Rahmen, ≤ 3 Wörter):** Etwas mehr Abstand
- **Übung: Faust-Check** · 5×
  1. Ansprechhaltung mit einem Eisen.
  2. Rechte Hand lösen: als Faust zwischen Griffende und linken Oberschenkel halten.
  3. Passt sie knapp, stimmt der Abstand. Hand zurück an den Griff.

gut: Arme hängen locker unter den Schultern

### Vorneigung beim Ansprechen (von hinten)

**Zu aufrecht**

- **kurz:** Du stehst zu aufrecht
- **warum:** Stehst du aufrecht, dreht sich der Oberkörper eher waagerecht. Der Schwung wird flach, die Treffer oft dünn.
- **gedanke:** Aus der Hüfte kippen
- **wort (Live-Rahmen, ≤ 3 Wörter):** Mehr vorneigen
- **Übung: Schläger am Rücken** · 5×
  1. Schläger mit einer Hand längs an den Rücken: Kopf, Schulterblätter, Steißbein.
  2. Aus der Hüfte kippen: Der Po geht nach hinten.
  3. Der Schläger bleibt an allen drei Punkten.

**Zu weit vorgebeugt**

- **kurz:** Du beugst dich ziemlich stark vor
- **warum:** Bist du sehr weit vorgebeugt, fällt das Drehen schwerer. Dann kippst du im Schwung leicht nach vorne oder richtest dich auf.
- **gedanke:** Gewicht auf die Fußmitte
- **wort (Live-Rahmen, ≤ 3 Wörter):** Etwas aufrichten
- **Übung: Aufrichten** · 5×
  1. Stell dich ohne Schläger in die Ansprechhaltung.
  2. Richte den Oberkörper ein Stück auf, bis die Arme locker hängen.
  3. Gewicht auf der Fußmitte spüren, dann den Schläger greifen.

gut: Gute Vorneigung beim Ansprechen

### Linker Arm im Treffmoment (frontal)

- **kurz:** Linker Arm knickt im Treffmoment
- **warum:** Knickt der Arm im Treffmoment, wird dein Schwungkreis kleiner. Laut TPI kostet das Kraft und bringt mehr Loft und Spin.
- **gedanke:** Weiter Bogen durch den Ball
- **wort (Live-Rahmen, ≤ 3 Wörter):** Weiter Bogen
- **Übung: Hüfte bis Hüfte** · 20×
  1. Nur bis Hüfthöhe zurückschwingen.
  2. Bis Hüfthöhe durchschwingen.
  3. Nach dem Ball sind beide Arme lang.

gut: Linker Arm ist im Treffmoment lang

### Schulterdrehung am Top (frontal)

- **kurz:** Schultern drehen nicht voll
- **warum:** Ohne volle Drehung müssen die Arme die Arbeit machen. Das kostet Weite und führt oft zu einem Abschwung von außen – dem Slice.
- **gedanke:** Rücken zum Ziel
- **wort (Live-Rahmen, ≤ 3 Wörter):** Mehr Schulterdrehung
- **Übung: Schläger vor der Brust** · 10×
  1. Schläger quer vor die Brust, Ansprechhaltung.
  2. Drehen, bis das linke Schlägerende ungefähr auf den Ball zeigt.
  3. Durchdrehen, bis das rechte Ende zum Ball zeigt.
  4. Danach halbe Schwünge mit diesem Gefühl.

gut: Volle Schulterdrehung am Top

### Armschwung am Top (frontal)

- **kurz:** Arme heben statt drehen
- **warum:** Heben die Arme den Schläger, statt dass der Oberkörper dreht, kommt er steil von oben zurück. Der Treffpunkt wechselt von Schlag zu Schlag.
- **gedanke:** Drehen statt heben
- **wort (Live-Rahmen, ≤ 3 Wörter):** Drehen statt heben
- **Übung: Griffende zum Bauchnabel** · 10×
  1. Tief am Schaft greifen, Griffende an den Bauchnabel.
  2. Nur mit der Brust bis Hüfthöhe zurückschwingen.
  3. Das Griffende bleibt am Bauchnabel.

gut: Arme und Oberkörper arbeiten zusammen

### Seitneigung beim Ansprechen (frontal)

**Zum Ziel geneigt**

- **kurz:** Oberkörper neigt zum Ziel
- **warum:** Deine rechte Hand greift tiefer, also gehört auch die rechte Schulter tiefer. Sonst stehst du schon „vor dem Ball“ – das begünstigt Slices.
- **gedanke:** Rechte Schulter etwas tiefer
- **wort (Live-Rahmen, ≤ 3 Wörter):** Rechte Schulter tiefer
- **Übung: Hand hängen lassen** · 10×
  1. Ansprechhaltung einnehmen.
  2. Rechte Hand vom Griff nehmen, locker hängen lassen.
  3. So zurück an den Griff – die Neigung passt.

**Zu stark vom Ziel weg**

- **kurz:** Zu stark vom Ziel weg geneigt
- **warum:** Zu viel Neigung verlagert den tiefsten Punkt des Schwungs nach hinten. Dann triffst du oft zuerst den Boden, dann den Ball.
- **gedanke:** Nur leicht neigen
- **wort (Live-Rahmen, ≤ 3 Wörter):** Weniger neigen
- **Übung:** – (bewusst keine)

gut: Gute Ausgangsposition hinter dem Ball

### Oberkörper am Top (frontal)

- **kurz:** Oberkörper kippt am Top zum Ziel
- **warum:** Kippt der Oberkörper zum Ziel, bleibt dein Gewicht vorne und du fällst im Abschwung nach hinten. Das kostet Kraft.
- **gedanke:** Brustbein bleibt hinter dem Ball
- **wort (Live-Rahmen, ≤ 3 Wörter):** Brustbein hinter Ball
- **Übung: Spiegel-Check** · 10×
  1. Frontal vor einen Spiegel stellen.
  2. Langsam bis zum Top zurückschwingen, anhalten.
  3. Wirbelsäule senkrecht oder leicht vom Ziel weg.

gut: Oberkörper bleibt am Top hinter dem Ball

### Oberkörper im Treffmoment (frontal)

- **kurz:** Oberkörper im Treffmoment zu gerade
- **warum:** Gute Spieler neigen den Oberkörper im Treffmoment leicht vom Ziel weg, die rechte Schulter ist tiefer. Das hängt mit mehr Schlägertempo zusammen.
- **gedanke:** Rechte Schulter geht nach unten
- **wort (Live-Rahmen, ≤ 3 Wörter):** Rechte Schulter runter
- **Übung: Treffposition in Zeitlupe** · 10×
  1. Langsam vom Top in die Treffposition.
  2. Anhalten und im Spiegel prüfen.
  3. Kopf hinter dem Ball, rechte Schulter tiefer.
  4. Danach dasselbe mit Ball.

gut: Oberkörper im Treffmoment vom Ziel weg

### Hüfte im Rückschwung / Sway (frontal)

- **kurz:** Hüfte schiebt zur Seite
- **warum:** Schiebst du die Hüfte im Rückschwung zur Seite, musst du sie im Abschwung genau zurückbringen. Das gelingt selten gleich – dein Treffpunkt wandert.
- **gedanke:** Drehen statt schieben
- **wort (Live-Rahmen, ≤ 3 Wörter):** Drehen statt schieben
- **Übung: Stab-Übung** · 10×
  1. Stab senkrecht direkt außen neben den rechten Fuß stecken.
  2. Langsam zurückschwingen – zwischen Hüfte und Stab bleibt Luft.
  3. Danach halbe Schwünge.

gut: Hüfte dreht auf der Stelle

### Tempo (beide Ansichten)

Welche Spielart erscheint, hängt bei Verhältnis < 2,4 : 1 von den **Zeiten** ab (Bericht F6): Abschwung über ca. 0,35 s → „Abschwung dauert zu lange“; sonst Rückschwung unter ca. 0,7 s → „hastig“; sonst („Rückschwung ab 0,7 s, Verhältnis trotzdem klein“) → „Abschwung dauert zu lange“. Ab 2,4 : 1 gilt „zu zäh“.

**Rückschwung zu schnell**

- **kurz:** Rückschwung zu hastig
- **warum:** Ein hastiger Rückschwung bringt Arme und Körper aus dem Takt. Gute Spieler brauchen zurück etwa dreimal so lange wie nach vorne.
- **gedanke:** Drei zurück, eins runter
- **wort (Live-Rahmen, ≤ 3 Wörter):** Langsamer zurückschwingen
- **Übung: Mitzählen** · 10×
  1. Sprich laut mit: „und – eins – zwei – drei – vier“.
  2. Auf „und“ beginnt der Rückschwung, auf „drei“ bist du oben.
  3. Fließend weiter: Auf „vier“ triffst du den Ball.

**Abschwung zu lang**

- **kurz:** Abschwung dauert zu lange
- **warum:** Dein Abschwung dauert im Vergleich zum Rückschwung lange. Gute Spieler brauchen für den Abschwung etwa ein Drittel der Rückschwung-Zeit.
- **gedanke:** Ruhig zurück, frei durch
- **wort (Live-Rahmen, ≤ 3 Wörter):** Frei durchschwingen
- **Übung: Mitzählen** · 10× (wie oben)

**Rückschwung zu langsam**

- **kurz:** Rückschwung sehr lang
- **warum:** Dein Rückschwung dauert mehr als viermal so lange wie dein Abschwung. Als Richtwert gilt etwa dreimal so lange.
- **gedanke:** Lang zurück, kurz durch
- **wort (Live-Rahmen, ≤ 3 Wörter):** Flüssig schwingen
- **Übung: Langer Bogen** · 10×
  1. Flüssig und gleichmäßig zurückschwingen bis oben.
  2. Im selben Takt weiter bis zum Ball: „eins – zwei – drei – vier“.

gut: Rhythmus wie gute Spieler (3 : 1)

### Kopfhöhe (beide Ansichten)

**Aufgerichtet**

- **kurz:** Du richtest dich auf
- **warum:** Richtest du dich auf, ändert sich der Abstand zum Ball. Der Schläger kommt zu hoch an – getoppte oder dünne Schläge.
- **gedanke:** Größe halten
- **wort (Live-Rahmen, ≤ 3 Wörter):** Größe halten
- **Übung: Später hochschauen** · 10×
  1. Halbe Schwünge.
  2. Rechtes Knie bleibt bis nach dem Treffen gebeugt.
  3. Erst nach dem Treffen hochschauen.

**Abgesackt**

- **kurz:** Du sackst ab
- **warum:** Sackst du ab, kommt der Schläger zu tief. Er trifft zuerst den Boden, dann den Ball – ein fetter Schlag.
- **gedanke:** Größe halten
- **wort (Live-Rahmen, ≤ 3 Wörter):** Größe halten
- **Übung: Höhe halten** · 10×
  1. Ansprechhaltung, Knie leicht gebeugt.
  2. Halbe Schwünge, die Körpergröße bleibt gleich.

gut: Kopfhöhe bleibt stabil

### Kopf seitlich (frontal)

**Kopf vor dem Ball**

- **kurz:** Kopf wandert vor den Ball
- **warum:** Wandert der Kopf vor den Ball, kommt der Schläger steil von oben. Gute Spieler halten den Kopf im Treffmoment hinter dem Ball.
- **gedanke:** Kopf hinter dem Ball
- **wort (Live-Rahmen, ≤ 3 Wörter):** Kopf hinter Ball
- **Übung: Tee-Blick** · 10×
  1. Tee ein paar Zentimeter hinter den Ball stecken.
  2. Beim Schwung auf das Tee schauen.
  3. Der Kopf bleibt, bis der Ball weg ist.

**Kopf schiebt im Rückschwung**

- **kurz:** Kopf schiebt zur Seite
- **warum:** Schiebst du Kopf und Oberkörper zur Seite, musst du im Abschwung genau zurück. Drehen ist leichter zu wiederholen als schieben.
- **gedanke:** Drehen wie im Fass
- **wort (Live-Rahmen, ≤ 3 Wörter):** Kopf ruhig halten
- **Übung: Enges Fass** · 10×
  1. Stell dir ein enges Fass um dich vor.
  2. Zurückschwingen, der Körper bleibt im Fass.

gut: Kopf bleibt hinter dem Ball

### Balance im Finish (frontal, Kennung `gewicht`)

Gemessen wird nur die Hüftlage im Finish (0 % hinterer, 100 % vorderer Fuß) – kein Druck und nichts über den Treffmoment (Bericht F5).

- **kurz:** Hüfte bleibt im Finish hinten
- **warum:** Im Finish stehen gute Spieler ruhig auf dem vorderen Fuß, die Hüfte darüber. Bei dir bleibt die Hüfte weiter hinten.
- **gedanke:** Finish halten
- **wort (Live-Rahmen, ≤ 3 Wörter):** Balance im Finish
- **Übung: Finish 3 Sekunden** · 10×
  1. Nach dem Schlag im Finish stehen bleiben.
  2. Hüfte über dem linken Fuß, rechter Fuß nur auf der Spitze.
  3. Gürtelschnalle zum Ziel – 3 Sekunden halten.

gut: Hüfte im Finish über dem vorderen Fuß

### Vorneigung halten (von hinten)

- **kurz:** Oberkörper richtet sich auf
- **warum:** Richtest du dich im Abschwung auf, ändert sich der Abstand zum Ball. Mögliche Folgen sind Toppen, Shanks, Push oder Block.
- **gedanke:** Po bleibt hinten
- **wort (Live-Rahmen, ≤ 3 Wörter):** Po hinten lassen
- **Übung: Po an die Wand** · 10×
  1. Ohne Schläger: Po berührt leicht die Wand, Arme vor der Brust kreuzen.
  2. Zurückschwingen: die rechte Po-Seite bleibt an der Wand.
  3. Durchdrehen: die linke Po-Seite kommt an die Wand.
  4. Der Po bleibt dabei in Kontakt mit der Wand.

gut: Vorneigung bleibt bis zum Treffmoment

### Hüfte Richtung Ball / Early Extension (von hinten)

- **kurz:** Hüfte schiebt zum Ball
- **warum:** Schiebt die Hüfte zum Ball, nimmt sie den Armen den Platz. Du musst ausweichen – der Schläger kommt unsauber an den Ball.
- **gedanke:** Po zur Tasche
- **wort (Live-Rahmen, ≤ 3 Wörter):** Po zur Tasche
- **Übung: Golftasche hinter dem Po** · 10×
  1. Golftasche direkt hinter den Po stellen.
  2. Rückschwung: die rechte Po-Seite berührt die Tasche.
  3. Abschwung: die linke Po-Seite berührt die Tasche.
  4. Langsame halbe Schwünge, der Schläger schwingt frei an der Tasche vorbei.

gut: Hüfte bleibt auf Abstand zum Ball

## Wiederholungszahlen und Formulierungen (Stand 0.51.4, Bericht U19–U21, U29–U31)

- **Wiederholungen (5/10/20) sind eine Orientierung**, keine Forschungszahl: Zu der „richtigen“ Zahl gibt es keine Studie.
  Die App zeigt deshalb „ca. 10×“. Belegt ist: kurze Einheiten, über mehrere Tage verteilt (Dail & Christina 2004), und
  erst langsam und halb, dann mit Ball (Porter & Magill 2010).
- **Positiv formuliert** (keine versteckten Verbote): „Po bleibt in Kontakt mit der Wand“, „Schläger schwingt frei an
  der Tasche vorbei“, „zwischen Hüfte und Stab bleibt Luft“, „der Körper bleibt im Fass“. Den Abstand beim Stab nennen wir
  nicht in Zentimetern (nicht belegt).
- **Äußere Gedanken:** „Weiter Bogen durch den Ball“ statt „Lange Arme durch den Ball“, „Größe halten“ statt „Rechtes
  Knie bleibt gebeugt“ (Kopfhöhe).
- **Abgeschwächt, weil ohne Quelle:** `oberkoerperTreff` (kein Slice/Divot-Bezug mehr, stattdessen Tempo nach Chu 2010),
  `fuehrungsarmTreff` (nicht mehr „dünn/getoppt“, sondern Kraftverlust, Loft und Spin nach TPI), `vorneigungHalten`
  (Toppen, Shanks, Push oder Block; die Trainer sind sich nicht einig).
- **Nicht übernommen:** das Bild „aus dem Becken“ (Joyce 2016) bei `oberkoerperTreff`; es ist noch nicht in `docs/wissen/` belegt.

## Herkunft der Grenzwerte (Stand 0.49.3, Bericht S1–S12)

Eine Zeile je Kennzahl: Woher die Grenze kommt und wie gut sie belegt ist. **Eigene Festlegung** heißt: Es gibt keine Studie,
die genau diese Zahl trägt; sie ist ein Richtwert, der den Messfehler von 2D-Video (frontal oft ±8–10°) mitrechnet. Gelb
bedeutet deshalb „knapp daneben“, nicht „falsch“. Stufen: A = Studie/Messdaten · B = Fachbuch/Verband · C = Blog/Magazin.

| Kennzahl | Grenze (gut · gelb) | Herkunft | Status |
|---|---|---|---|
| `tempo` | 2,4–4,0 : 1 · 2,0–2,4 / 4,0–4,6 | Profis 2,5–3,5 : 1 (Grober & Cholewicki 2006, A); Band breiter wegen ±1 Bild bei 30 Bildern/s | belegt, Band eigene Abwägung |
| `schulterdrehung` | ≥ 80° · 65–80° | ≈ Mittel − 1 SD bei 308 Golfern (Chu 2010, A); 2D-Fehler ±10–15° | belegt |
| `oberkoerperTop` | ≥ −3° · −10 bis −3° | ≈ Mittel − 1 SD (Chu 2010, A) | eigene Festlegung |
| `oberkoerperTreff` | ≥ 8° · 2–8° | 3D-Mittel Driver 14,4 ± 6,5° (Chu 2010, A); frontal vermutlich kleiner | nicht kalibriert, mehr Profi-Testschwünge nötig (S2) |
| `kopfhoehe` | −40 bis +8 % · +8–15 % | Beim Driver steigt das Becken bis zum Treffen (Chu 2010, A) | nicht kalibriert, evtl. schlägerabhängig (S8) |
| `kopfSeitlich` | Treffmoment ≤ +8 %; Rückschwung gelb ab 25 % vom Ziel weg | Byrne & Kenny 2008 (A, n = 8) | dünne Datenlage (S4) |
| `hueftSway` | ≤ 10 % · 10–20 % | Chu 2010 (A): 2 ± 2 cm vom Ziel weg ≈ 4 ± 4 % | belegt (S1) |
| `seitneigungAnsprechen` | 0–15° · −6–0° / 15–25° | keine Studie zum Ansprechen (Chu misst nur am Top) | **eigene Festlegung** (S3) |
| `vorneigungHalten` | ≤ 10° · 10–15° | Gute Spieler verlieren im Mittel nichts: 22,0° → 22,6° (Chu 2010, A, 3D) | **eigene Festlegung** (S9), 2D-Mischwinkel |
| `hueftBall` | ≤ 12 % · 12–22 % | Nur TPI (B) und Firmenaussagen (C); Hüftmitte wandert durch die Drehung auch ohne Schub | **eigene Festlegung** (S10); Werte unter ca. 5 % nicht deuten |
| `fuehrungsarmTreff` | ≥ 155° · 140–155° | Kein Normwert (Stufe A) gefunden; „lange Linie“ ist ein Lehrbild | **eigene Festlegung** (S11) |
| `vorneigungAnsprechen` | 25–45° · 18–25° / 45–52° | Tourprofis mit dem Eisen ca. 41,5° (Kim 2018, A) | Wert belegt, Grenzen Richtwert (S12) |
| `armeAnsprechen` | −25 bis +15 % · +15–30 % / −40 bis −25 % | Keine Studie; Lehrbild „Arme hängen, eine Faust Platz“ | **eigene Festlegung** (S12) |
| `armschwungTop` | Hände ≤ 75 % oder volle Drehung · 75–90 % | Keine Studie; Lehrbild „Drehen statt heben“ | **eigene Festlegung** (S12) |
| `gewicht` (Balance im Finish) | ≥ 85 % · 65–85 % | Im Recherchebericht nicht einzeln geprüft | Richtwert |

## Web-Recherche (28.09.): was geprüft und korrigiert wurde

Geprüft gegen PGA.com, GOLFTEC, TPI (Titleist Performance Institute), Golf.com, HackMotion u. a.
Direkt bestätigt: Arme baumeln, Schläger am Rücken, Hüfte bis Hüfte (= „9-bis-3-Übung“), Schläger vor
der Brust, Spiegel-Check (TPI „Reverse Spine Angle“), Treffposition/Schulterneigung (GOLFTEC), Stab gegen
Sway (TPI „Sway“), Pendel, Tee-Blick, Enges Fass (Percy Boomer), Finish halten, Golftasche (TPI
„Early Extension“).

Korrigiert:

| Vorher | Jetzt | Grund / Quelle |
|---|---|---|
| „Knie bleiben gebeugt“ | „Rechtes Knie bleibt gebeugt“ | Das linke Bein streckt sich im Treffmoment – Kraftquelle (GOLFTEC, lead/trail knee flex) |
| „Kniebeugung halten“ (Absacken) | „Nicht in die Knie gehen“ | Aus demselben Grund: das linke Bein darf sich strecken |
| Flache Hand zwischen Griffende und Oberschenkel | Eine **Faust** (ca. 10–15 cm) | hititlonger.com, marylandgolfcamps.com |
| Mitzählen mit Pause oben | Start auf „und“, „eins – zwei – drei“ = oben, „vier“ = Treffen, keine Pause | Tour Tempo (Novosel), 3 : 1 |
| Po an die Wand mit Schläger, Start vor der Wand | Ohne Schläger, Arme gekreuzt, Po berührt die Wand von Anfang an | golfsmartacademy.com, TPI |
| Knie-Tipp „außen ans Knie“ | „Hand hängen lassen“ | Die Knie-Variante ist nicht belegt und führt eher zu viel Neigung (golf-info-guide.com: beim Eisen ca. 5°) |
| Griffende zeigt auf den Bauchnabel | Tief greifen, Griffende **am** Bauchnabel | womensgolf.com, golfdistillery.com |
| Stab „außen neben“ die Hüfte | Stab senkrecht **direkt außen neben dem rechten Fuß** | Beim Profi steht der Fuß weiter außen als die Hüfte – ein Stab an der Hüfte stünde im Fuß (Variante „am Fuß“ laut Recherche; hackmotion.com) |
| Golftasche nur im Abschwung | Rückschwung rechte, Abschwung linke Po-Seite, langsam | TPI, whygolf.com |
| Aufrecht → „zuerst Boden“ | Aufrecht → „flach, oft dünne Treffer“ | Häufiger so beschrieben |

Für die animierten Übungsfiguren (Branch `uebungsmodus`) wichtig:
- **P2, P6, P8 sind über den Schaft definiert** (Schaft waagerecht), nicht über „Hände auf Hüfthöhe“.
  P4 (Top): Schaft zeigt zum Ziel, beim Eisen meist kürzer als waagerecht. P7: Hände über dem linken
  Oberschenkel, Schaft nach vorne geneigt (Eisen). P10: Schaft hinter Kopf und Nacken.
- Frei lizenzierte Vorlagen (nur zum Abgleichen, nicht einbetten): Wikimedia Commons
  „Golf_swing_contact_shoulder_illustration.jpg“ und „Illustration_of_golf_swing.jpg“ (CC BY 4.0),
  CC0-Tourfotos „2016 Lyoness Open – Bernd Wiesberger“. Eigene Strichfiguren bleiben der Weg.

Offene fachliche Punkte (nicht in diesem Branch):
- Seitneigung beim Ansprechen: Beim Driver ist mehr Neigung richtig als beim Eisen – Grenzwerte
  könnten den gespeicherten Schläger berücksichtigen. Stand 0.48.0: gut 0–15°, gelb 15–25° und −6 bis 0° –
  **eigene Festlegung** (keine Studie zum Ansprechen, Bericht S3).
- Grenzen mit 0.48.0 (Bericht S1/S3/S4): Hüfte im Rückschwung gut bis 10 % (gelb bis 20 %); Kopf seitlich im
  Rückschwung gelb ab 25 % vom Ziel weg (nie rot). Skala und Bewertung bleiben über `tests/tipps.test.mjs` gekoppelt.
- Oberkörper im Treffmoment: Quellen nennen Werte für die **Schulterlinie** (GOLFTEC ca. 39°), die App
  misst die **Wirbelsäulenachse** (Profi-Testschwung 12–13°). Einen belegten 2D-Wert für die Achse
  gibt es nicht – Grenze 8° beobachten. Prüfung 15.10. (0.48.0): Profi 11,7° und Amateur 10,4° im Testschwung, beide
  über 8° – zwei frontale Schwünge reichen nicht zum Kalibrieren, Grenze bleibt.
- Absacken: Etwas Absinken des Kopfes ist bei Tourspielern normal (GOLFTEC) – die App erlaubt bis −40 %.

## Genauigkeit der Figuren und Übungen (Anforderung: keine falsche Technik)

- **Körperposen stammen aus dem echten Profi-Schwung** `tests/daten/faceon_profi.json` (Bilder 47, 58, 70,
  75, 76, 78, 94 für Ansprechen, halber Rückschwung, Top, halber Abschwung, Treffmoment, halber Durchschwung,
  Finish) – nicht von Hand gezeichnet. Die App bewertet diesen Schwung in allen 11 Kennzahlen mit „gut“.
- **Einzige Korrektur:** linker Arm am Top gestreckt (dort rät die Pose-Erkennung bekanntermaßen falsch).
- **Schläger:** wird von der Pose-Erkennung nicht erfasst. Er wird nach Lehrbuch-Positionen eingezeichnet
  (Hüfthöhe = Schaft waagerecht, Top = knapp vor waagerecht, Treffmoment = zum Ball) und in der Animation
  über seinen Winkel gedreht – über den halben Abschwung, damit er **hinter dem Körper** herunterkommt.
- **Fehlerbilder** = Profi-Pose mit genau dem einen Fehler in genau der Größe, die die Skala zeigt.
- **Automatische Gegenprobe (Test):** Ziel-Posen müssen mit den Grenzwerten der App „gut“ sein, Fehlerbilder
  „achtung“/„verbessern“ – so können Bild und Bewertung nie auseinanderlaufen.
- **Grenze:** Die Übungen sind gängige Trainingsübungen, aber keine Trainerstunde. Vor dem Einbau sollte
  ein Golflehrer (PGA-Pro) die Tabelle oben und die Figuren einmal gegenlesen.
- Korrigiert am 28.09. nach kritischer Prüfung: „Kopf über rechtem Knie“ (hätte Sway gefördert) → „Brustbein
  bleibt hinter dem Ball“; „Boden vor dem Ball“ (doppeldeutig) → „zuerst den Boden, dann den Ball“;
  Schläger vor der Brust: „linkes“ Schlägerende; Wand-Übung: rechte/linke Po-Seite; „Rechte Schulter runter,
  nicht raus“.

## Umsetzung

**Branch `tipps-neu`**
1. Kurzfelder in eigener Datei `tipps.js` (Texte an einer Stelle), Tests für Längen, Linkshänder und
   Skala (`tests/tipps.test.mjs`). Die Spielart (z. B. „zu aufrecht“) wird aus dem Messwert abgeleitet –
   so bekommen auch früher gespeicherte Schwünge die neuen Texte.
2. Wisch-Karten per CSS `scroll-snap` (ohne Bibliothek) in `app.js` / `style.css`.
3. Strichfigur (`strichfigur.js`: Posedaten im Moment der Phase + Linien aus `ideallinien.js`) und Skala mit Zielbereich.
4. Schwunggedanke oben („💭 Heute auf der Range“), wird mit der Sitzung gespeichert.

**Branch `uebungsmodus`** (umgesetzt 28.09., Version 0.13.0)
- Vollbild, ein Schritt pro Seite, große Schrift, am Ende ein Zähler zum Antippen; Bildschirm bleibt an
  (Wake Lock, wo vorhanden); Esc schließt; „Bewegung reduzieren“ zeigt nur das Endbild.
- Figuren in `uebungsbilder.js` (reine Rechenlogik, Tests in `tests/uebungsbilder.test.mjs`):
  - **Von vorne:** Posen aus dem Profi-Testschwung (Bilder 47, 58, 70, 75, 76, 78, 94), linker Arm am Top
    korrigiert. Tests prüfen die Posen mit den Grenzwerten der App (Arm, Neigung, Sway, Kopf hinter dem Ball).
  - **Schläger:** über seinen Winkel; kommt im Abschwung hinter dem Körper herunter (Test prüft die Richtung).
  - **Von hinten:** nur Standbilder der geprüften Ansprechhaltung (`hinten_amateur_a`: Vorneigung 33°, Arme
    −14 %). Die Drehung von hinten zeigen wir nicht, dafür fehlen korrekte Daten → nur Text.
  - **Nur Text** auch dort, wo eine flache Zeichnung täuschen würde („Schläger vor der Brust“, Schritte 2–3).
  - **Mitzählen:** Takt nach Tour Tempo, 350 ms pro Zählzeit – „und“ Start, „drei“ oben, „vier“ getroffen (3 : 1).
- Offen: Bewegung von hinten (Po an die Wand, Golftasche) als Animation, sobald ein korrekter Profi-Schwung
  von hinten als Testdatei vorliegt.
