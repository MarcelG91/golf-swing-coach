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
- **Übung: Arme baumeln lassen** · 10×
  1. Ansprechhaltung ohne Schläger.
  2. Arme 3 Sekunden locker hängen lassen.
  3. Hände zusammen, Schläger hineinlegen.

**Hände zu nah am Körper**

- **kurz:** Hände zu nah am Körper
- **warum:** Sind die Hände zu nah am Körper, haben die Arme im Abschwung keinen Platz. Du musst ausweichen oder dich aufrichten.
- **gedanke:** Eine Faust Platz
- **Übung: Faust-Check** · 5×
  1. Ansprechhaltung mit Schläger.
  2. Rechte Hand als Faust zwischen Griffende und linken Oberschenkel.
  3. Passt die Faust knapp hinein, stimmt der Abstand.

gut: Arme hängen locker unter den Schultern

### Vorneigung beim Ansprechen (von hinten)

**Zu aufrecht**

- **kurz:** Du stehst zu aufrecht
- **warum:** Stehst du aufrecht, dreht sich der Oberkörper eher waagerecht. Der Schwung wird flach, die Treffer oft dünn.
- **gedanke:** Aus der Hüfte kippen
- **Übung: Schläger am Rücken** · 5×
  1. Schläger längs an den Rücken: Kopf, Schulterblätter, Steißbein.
  2. Aus der Hüfte kippen, bis du auf den Ball schaust.
  3. Der Schläger bleibt an allen drei Punkten.

**Zu weit vorgebeugt**

- **kurz:** Du beugst dich zu weit vor
- **warum:** Weit vorgebeugt fehlen dir Gleichgewicht und Drehfreiheit. Oft kippst du im Schwung nach vorne oder richtest dich auf.
- **gedanke:** Gewicht auf die Fußmitte
- **Übung: Schläger am Rücken** · 5×
  1. Schläger längs an den Rücken: Kopf, Schulterblätter, Steißbein.
  2. Aus der Hüfte kippen, bis du auf den Ball schaust.
  3. Der Schläger bleibt an allen drei Punkten.

gut: Gute Vorneigung beim Ansprechen

### Linker Arm im Treffmoment (frontal)

- **kurz:** Linker Arm knickt im Treffmoment
- **warum:** Knickt der Arm, wird dein Schwungkreis kleiner und der Schläger kommt zu hoch an den Ball. Die Folge: dünne oder getoppte Bälle und weniger Weite.
- **gedanke:** Lange Arme durch den Ball
- **Übung: Hüfte bis Hüfte** · 20×
  1. Nur bis Hüfthöhe ausholen.
  2. Bis Hüfthöhe durchschwingen.
  3. Nach dem Ball sind beide Arme lang.

gut: Linker Arm ist im Treffmoment lang

### Schulterdrehung am Top (frontal)

- **kurz:** Schultern drehen nicht voll
- **warum:** Ohne volle Drehung müssen die Arme die Arbeit machen. Das kostet Weite und führt oft zu einem Abschwung von außen – dem Slice.
- **gedanke:** Rücken zum Ziel
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
- **Übung: Griffende zum Bauchnabel** · 10×
  1. Tief am Schaft greifen, Griffende an den Bauchnabel.
  2. Nur mit der Brust bis Hüfthöhe ausholen.
  3. Das Griffende bleibt am Bauchnabel.

gut: Arme und Oberkörper arbeiten zusammen

### Seitneigung beim Ansprechen (frontal)

**Zum Ziel geneigt**

- **kurz:** Oberkörper neigt zum Ziel
- **warum:** Deine rechte Hand greift tiefer, also gehört auch die rechte Schulter tiefer. Sonst stehst du schon „vor dem Ball“ – das begünstigt Slices.
- **gedanke:** Rechte Schulter etwas tiefer
- **Übung: Hand hängen lassen** · 10×
  1. Ansprechhaltung einnehmen.
  2. Rechte Hand vom Griff nehmen, locker hängen lassen.
  3. So zurück an den Griff – die Neigung passt.

**Zu stark vom Ziel weg**

- **kurz:** Zu stark vom Ziel weg geneigt
- **warum:** Zu viel Neigung verlagert den tiefsten Punkt des Schwungs nach hinten. Dann triffst du oft zuerst den Boden, dann den Ball.
- **gedanke:** Nur leicht neigen
- **Übung:** – (bewusst keine)

gut: Gute Ausgangsposition hinter dem Ball

### Oberkörper am Top (frontal)

- **kurz:** Oberkörper kippt am Top zum Ziel
- **warum:** Kippt der Oberkörper zum Ziel, bleibt dein Gewicht vorne und du fällst im Abschwung nach hinten. Das kostet Kraft und belastet den unteren Rücken.
- **gedanke:** Brustbein bleibt hinter dem Ball
- **Übung: Spiegel-Check** · 10×
  1. Frontal vor einen Spiegel stellen.
  2. Langsam zum Top ausholen, anhalten.
  3. Wirbelsäule senkrecht oder leicht vom Ziel weg.

gut: Oberkörper bleibt am Top hinter dem Ball

### Oberkörper im Treffmoment (frontal)

- **kurz:** Oberkörper im Treffmoment zu gerade
- **warum:** Nur wenn die rechte Schulter tiefer ist, kommt der Schläger flach von innen an den Ball. Stehst du gerade, kommt er steil von oben – typisch sind Slice und tiefe Divots.
- **gedanke:** Rechte Schulter runter, nicht raus
- **Übung: Treffposition in Zeitlupe** · 10×
  1. Langsam vom Top in die Treffposition.
  2. Anhalten und im Spiegel prüfen.
  3. Kopf hinter dem Ball, rechte Schulter tiefer.
  4. Danach dasselbe mit Ball.

gut: Oberkörper im Treffmoment vom Ziel weg

### Hüfte im Rückschwung / Sway (frontal)

- **kurz:** Hüfte schiebt zur Seite
- **warum:** Schiebst du die Hüfte beim Ausholen zur Seite, musst du sie im Abschwung genau zurückbringen. Das gelingt selten gleich – dein Treffpunkt wandert.
- **gedanke:** Drehen statt schieben
- **Übung: Stab-Übung** · 10×
  1. Stab senkrecht wenige Zentimeter neben die rechte Hüfte stecken.
  2. Langsam ausholen – die Hüfte berührt ihn nicht.
  3. Danach halbe Schwünge.

gut: Hüfte dreht auf der Stelle

### Tempo (beide Ansichten)

**Rückschwung zu schnell**

- **kurz:** Rückschwung zu hastig
- **warum:** Ein hastiger Rückschwung bringt Arme und Körper aus dem Takt. Gute Spieler brauchen zurück etwa dreimal so lange wie nach vorne.
- **gedanke:** Drei zurück, eins runter
- **Übung: Mitzählen** · 10×
  1. Starte den Rückschwung auf „und“.
  2. „Eins – zwei – drei“: auf „drei“ bist du oben.
  3. Ohne Pause: auf „vier“ ist der Ball getroffen.

**Rückschwung zu langsam**

- **kurz:** Rückschwung zu zäh
- **warum:** Ist der Rückschwung sehr zäh, fehlt der Schwung für den Rückweg. Der Abschwung wird dann hektisch oder zögerlich.
- **gedanke:** Schwingen wie ein Pendel
- **Übung: Pendel** · 10×
  1. Flüssig zurückschwingen, oben keine Pause.
  2. Im gleichen Rhythmus durchschwingen.

gut: Rhythmus wie gute Spieler (3 : 1)

### Kopfhöhe (beide Ansichten)

**Aufgerichtet**

- **kurz:** Du richtest dich auf
- **warum:** Richtest du dich auf, ändert sich der Abstand zum Ball. Der Schläger kommt zu hoch an – getoppte oder dünne Schläge.
- **gedanke:** Rechtes Knie bleibt gebeugt
- **Übung: Später hochschauen** · 10×
  1. Halbe Schwünge.
  2. Rechtes Knie bleibt bis nach dem Treffen gebeugt.
  3. Erst nach dem Treffen hochschauen.

**Abgesackt**

- **kurz:** Du sackst ab
- **warum:** Sackst du ab, kommt der Schläger zu tief. Er trifft zuerst den Boden, dann den Ball – ein fetter Schlag.
- **gedanke:** Nicht in die Knie gehen
- **Übung: Höhe halten** · 10×
  1. Ansprechhaltung, Knie leicht gebeugt.
  2. Halbe Schwünge, ohne tiefer in die Knie zu gehen.

gut: Kopfhöhe bleibt stabil

### Kopf seitlich (frontal)

**Kopf vor dem Ball**

- **kurz:** Kopf wandert vor den Ball
- **warum:** Wandert der Kopf vor den Ball, kommt der Schläger steil von oben. Gute Spieler halten den Kopf im Treffmoment hinter dem Ball.
- **gedanke:** Kopf hinter dem Ball
- **Übung: Tee-Blick** · 10×
  1. Tee ein paar Zentimeter hinter den Ball stecken.
  2. Beim Schwung auf das Tee schauen.
  3. Der Kopf bleibt, bis der Ball weg ist.

**Kopf schiebt im Rückschwung**

- **kurz:** Kopf schiebt zur Seite
- **warum:** Schiebst du Kopf und Oberkörper zur Seite, musst du im Abschwung genau zurück. Drehen ist leichter zu wiederholen als schieben.
- **gedanke:** Drehen wie im Fass
- **Übung: Enges Fass** · 10×
  1. Stell dir ein enges Fass um dich vor.
  2. Ausholen, ohne die Fasswand zu berühren.

gut: Kopf bleibt hinter dem Ball

### Gewichtsverlagerung (frontal)

- **kurz:** Gewicht bleibt hinten
- **warum:** Bleibt das Gewicht hinten, fehlt Kraft im Treffmoment. Der Ball fliegt oft zu hoch oder zur Seite weg.
- **gedanke:** Finish halten
- **Übung: Finish 3 Sekunden** · 10×
  1. Nach dem Schlag im Finish stehen bleiben.
  2. Gewicht links, rechter Fuß nur auf der Spitze.
  3. Gürtelschnalle zum Ziel – 3 Sekunden halten.

gut: Gewicht im Finish vorn

### Vorneigung halten (von hinten)

- **kurz:** Oberkörper richtet sich auf
- **warum:** Richtest du dich im Abschwung auf, ändert sich der Abstand zum Ball. Typische Folgen sind Toppen oder Shanks.
- **gedanke:** Po bleibt hinten
- **Übung: Po an die Wand** · 10×
  1. Ohne Schläger: Po berührt leicht die Wand, Arme vor der Brust kreuzen.
  2. Ausholen: die rechte Po-Seite bleibt an der Wand.
  3. Durchdrehen: die linke Po-Seite kommt an die Wand.
  4. Nie ganz von der Wand lösen.

gut: Vorneigung bleibt bis zum Treffmoment

### Hüfte Richtung Ball / Early Extension (von hinten)

- **kurz:** Hüfte schiebt zum Ball
- **warum:** Schiebt die Hüfte zum Ball, nimmt sie den Armen den Platz. Du musst ausweichen – der Schläger kommt unsauber an den Ball.
- **gedanke:** Po zur Tasche
- **Übung: Golftasche hinter dem Po** · 10×
  1. Golftasche direkt hinter den Po stellen.
  2. Rückschwung: die rechte Po-Seite berührt die Tasche.
  3. Abschwung: die linke Po-Seite berührt die Tasche.
  4. Langsame halbe Schwünge, der Schläger trifft die Tasche nicht.

gut: Hüfte bleibt auf Abstand zum Ball

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
| Stab „außen neben“ die Hüfte | „wenige Zentimeter neben“ | hackmotion.com |
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
  könnten den gespeicherten Schläger berücksichtigen.
- Oberkörper im Treffmoment: Quellen nennen Werte für die **Schulterlinie** (GOLFTEC ca. 39°), die App
  misst die **Wirbelsäulenachse** (Profi-Testschwung 12–13°). Einen belegten 2D-Wert für die Achse
  gibt es nicht – Grenze 8° beobachten.
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

**Branch `uebungsmodus`** (danach)
Vollbild, ein Schritt pro Seite mit animierter Strichfigur, große Schrift, Zähler zum Antippen,
Bildschirm bleibt an (Wake Lock, wo vorhanden). Posen und Animationen als eigene Datei
(z. B. `uebungsbilder.js`, reine Daten + Zeichnen ohne Bibliothek).
