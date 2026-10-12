// ===============================================================
// Live-Schwung und Aufnahme-Stück zusammenbringen (Etappe 12d)
//
// Die Kamera nimmt laufend in überlappenden Stücken auf (aufnahme.js). Ist ein Schwung
// erkannt, muss man wissen: In welchem Stück liegt er komplett? Und wo genau im Stück
// (Zeit seit Stückbeginn)? Diese Datei rechnet das – ohne Browser, testbar mit node --test.
//
// Alle Zeiten "Uhrzeit" sind Sekunden der Browser-Uhr (performance.now() / 1000).
// ===============================================================

import { aufRasterLegen, BILD_DAUER } from "./videoanalyse.js";
import { werteAus } from "./schwuenge.js";

const RAND = 1; // 1 s Video vor dem Ansprechen und nach dem Finish (wie speicher.js)

// Welchen Zeitraum soll der Clip des Schwungs abdecken? (Uhrzeit)
export function clipFenster(schwung) {
  return {
    von: schwung.phasen.ansprechen.zeit - RAND,
    bis: schwung.phasen.finish.zeit + RAND,
  };
}

// Ein Stück, das den ganzen Zeitraum enthält (sonst null).
// stuecke = [{ start, ende }] (Uhrzeit). Unter mehreren gewinnt das mit dem größten
// Abstand zum Rand – dort ist der Schwung am sichersten komplett drin.
export function findeStueck(fenster, stuecke) {
  let beste = null;
  let besterRand = -Infinity;
  for (const stueck of stuecke) {
    if (stueck.start > fenster.von || stueck.ende < fenster.bis) continue;
    const rand = Math.min(fenster.von - stueck.start, stueck.ende - fenster.bis);
    if (rand > besterRand) {
      beste = stueck;
      besterRand = rand;
    }
  }
  return beste;
}

// Rechnet einen live erkannten Schwung auf die Zeit im Stück um und legt die Bilder in das
// 30-Bilder-Raster, das die gespeicherten Posedaten brauchen (Platz i = Zeit i/30 s).
// Danach wird der Schwung neu ausgewertet, damit Phasen und Kennzahlen zum Raster passen.
// stueckStart = Uhrzeit, zu der das Stück begonnen hat. Rückgabe: Schwung wie von werteAus().
export function schwungImStueck(schwung, stueckStart, seitenverhaeltnis, nummer = 1) {
  const imStueck = schwung.bilder.map((b) => ({ zeit: b.zeit - stueckStart, punkte: b.punkte }));
  const letzte = imStueck.at(-1).zeit;
  const ersterPlatz = Math.max(0, Math.floor(imStueck[0].zeit / BILD_DAUER));
  const raster = aufRasterLegen(imStueck, letzte).slice(ersterPlatz);
  return werteAus(raster, seitenverhaeltnis, nummer);
}
