# iPhone-Testliste (Backlog Nr. 1)

Ein Durchgang an der Range, ca. 30 Minuten. Fasst alle offenen iPhone-Tests seit Version 0.8
zusammen. **Wichtig:** Die Zeilen „Analyse fertig (…)“ und die Speicheranzeige am besten per
Bildschirmfoto festhalten und an Claude geben – daraus werden die nächsten Einstellungen
(Zeitgrenze S10, Schwelle für mehrere Schwünge).

## 0. Vorbereitung (zu Hause, mit WLAN)

- [ ] App vom Home-Bildschirm öffnen (nicht Safari – die Home-App hat eigenen Speicher).
- [ ] Unten steht Version **0.26.0** oder höher. Sonst App schließen, neu öffnen, kurz warten.
- [ ] Meldung „Offline bereit ✓“ ist da.

## 0b. Sicherheits-Etappe (Version ≥ 0.26, zuerst testen)

Seit 0.26.0 kommt die Pose-Erkennung von GitHub Pages statt von jsDelivr/Google, der Coach läuft ohne
SDK, und eine Sicherheitsregel (CSP) erlaubt nur noch eigene Dateien und Anthropic.

- [ ] **Erster Start mit Internet** (WLAN, nicht auf der Range): App vom Home-Bildschirm öffnen. Das Update lädt einmalig
      bis ca. 40 MB (die Pose-Erkennung kommt beim Umstieg kurz doppelt) –
      warten, bis unten **„Version 0.26.0 · online · Offline bereit ✓“** steht (Bildschirmfoto). Dauer schätzen: ___ s
- [ ] App ganz schließen (nach oben wischen), **Flugmodus an**, App neu öffnen: „Bereit“ erscheint, unten
      „offline · Offline bereit ✓“.
- [ ] Im Flugmodus ein Video analysieren – Zeile „Analyse fertig (…)“ als Bildschirmfoto.
- [ ] Im Flugmodus kurz „📖 Wissen“ (eine Lektion mit Bild) und eine Übung im Vollbild öffnen.
- [ ] Flugmodus aus. **Coach einmal** mit deinem Schlüssel (ca. 15–25 Cent): Kommt die Antwort? Wartezeit ___ s,
      Kosten laut Zeile unter der Antwort ___ Cent.
- [ ] Einstellungen → ganz unten „Datenschutz – kurz erklärt“: verständlich?
- [ ] Fällt etwas auf (leere Fläche, Knopf ohne Wirkung, Meldung „nicht vollständig geladen“)? Bildschirmfoto.

## 1. Analyse und Ladezeit (Version ≥ 0.14, Befund S8)

- [ ] Einen Schwung frontal filmen, in der App aus „Fotos“ auswählen, analysieren.
- [ ] Bildschirmfoto der Zeile **„Analyse fertig (… · Video geladen in … s)“**.
- [ ] Gefühlt: Wie lange stand vorher „Wird vorbereitet …“ in der Foto-Auswahl? (Sekunden schätzen)

## 2. Mehrere Schwünge in einem Video (Version ≥ 0.8)

- [ ] Ein Video mit **5 Schlägen** am Stück filmen, dazwischen normal aufteen.
- [ ] Wie viele Schwünge findet die App? ___ von 5
- [ ] Falsche Treffer (z. B. Aufteen, Probeschwung)? Welche?
- [ ] Zusätzlich 2–3 Videos auf einmal aus Fotos auswählen – klappt die Gesamtauswertung?

## 3. Wisch-Karten und Übungsmodus (Version ≥ 0.13)

- [ ] Karten wischen: flüssig? Punkte darunter stimmen?
- [ ] Figur und Skala auf der Karte verständlich und lesbar (auch in der Sonne)?
- [ ] „Mit Bildern üben (Vollbild)“ öffnen und **2 Minuten nichts berühren**:
      bleibt der Bildschirm an? (braucht iOS 16.4 oder neuer)
- [ ] Übung einmal wirklich mitmachen: Passen Bild, Text und Zählen zusammen?

## 4. Speichern im Flugmodus (Version ≥ 0.9)

- [ ] Flugmodus an, Schwung analysieren und speichern.
- [ ] App schließen, neu öffnen, Schwung aus der Liste öffnen: Clip spielt, **sitzt das Skelett** auf dem Körper?
- [ ] Flugmodus wieder aus.

## 5. Coach (Version ≥ 0.17, am Mac oder iPhone, kostet ca. 15–25 Cent je Coaching)

- [ ] Schlüssel unter ⚙️ Einstellungen eintragen (Workspace mit Ausgabenlimit, Anleitung steht dort).
      Ausgabenlimit mindestens 5 € (2 € reichen nur für ca. 10 Coachings).
- [ ] Beim ersten Coaching mit 0.17 fragt die App noch einmal um Einwilligung (jetzt alle Kennzahlen) – so gewollt.
- [ ] Denselben Schwung in allen drei Levels (Einsteiger, Fortgeschritten, Könner) coachen lassen.
- [ ] Genug Tiefe? Verstehst du, **warum** der Fehler passiert? Ist der Trainingsplan direkt umsetzbar?
- [ ] Passt die Sprache zum Level (Einsteiger ohne Fachbegriffe und Zahlen)? Klingt etwas nach falscher Technik?
- [ ] Wartezeit ca.: ___ s. Kosten laut Anzeige: ___ / ___ / ___ Cent. Erschien einmal „unvollständig“?

## 6. Aufräumen (Version ≥ 0.11) – ganz zum Schluss, löscht Daten!

- [ ] Speicheranzeige notieren (vorher): ___
- [ ] Bei einer Sitzung „Videos löschen“ → Speicheranzeige (nachher): ___
- [ ] Nur wenn du die Testschwünge nicht brauchst: „Alles löschen“ →
      Level noch gewählt? Coach-Schlüssel noch da? App offline weiter nutzbar (Flugmodus)?

## 7. Neues Design (Version ≥ 0.16)

- [ ] Tab-Leiste unten: liegt sie über dem Home-Balken, nicht dahinter? Alle drei Tabs gut antippbar?
- [ ] Einstellungen → Darstellung: Hell, Dunkel, Automatisch umschalten. App neu starten – bleibt die Wahl?
- [ ] Auf der Range in der Sonne: Hell besser lesbar? Ergebnis-Karten, Skala und Farben (gelb/rot) gut erkennbar?
- [ ] Nach dem Laden eines Videos: verschwinden die Filmtipps, bleibt der Knopf „Video auswählen“?

## Rückmeldung an Claude

Bildschirmfotos aus 1, 2 und 6 plus kurze Stichworte zu 3–5 reichen. Danach werden in
`CLAUDE.md` die Punkte abgehakt und ggf. S10 (Zeitgrenze) und die Schwung-Schwelle angepasst.
