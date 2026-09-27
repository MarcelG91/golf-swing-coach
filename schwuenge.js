// ===============================================================
// Mehrere Schwünge in einem Video finden und einzeln auswerten
// Eingabe: alle Bilder eines Videos { zeit, punkte } – egal ob 1 oder 10 Schläge
// Ausgabe: eine Liste von Schwüngen, jeder mit Phasen, Kennzahlen und
//          der Angabe, ob er in die Gesamtauswertung zählt ("sicher").
//
// Idee: Bei jedem Schlag bewegen sich die Hände im Abschwung sehr schnell
// nach unten. Wir suchen alle diese Momente und schneiden um jeden herum ein
// Zeitfenster aus. Darauf läuft dann die bekannte Phasenerkennung (phasen.js).
//
// Wie phasen.js kennt diese Datei keinen Browser, nur Zahlen → testbar mit node --test.
// ===============================================================

import { gueltigeBilder, handBewegung, erkennePhasen } from "./phasen.js";
import { bewerteSchwung } from "./kennzahlen.js";
import { bewerteTechnik, ordneEin } from "./technik.js";

// Ab dieser Geschwindigkeit nach unten (Rumpflängen pro Sekunde) zählt eine Bewegung
// als Schlag. Gemessen an den echten Testschwüngen: Schläge erreichen 4,4 bis 13,4,
// alles andere (Ausschwingen im Finish, Zittern der Erkennung) bleibt unter 2,7.
export const SCHLAG_SCHWELLE = 3.5;

// Zwei Schläge liegen mindestens so weit auseinander (Sekunden). Kleinere Spitzen
// innerhalb eines Schwungs (z. B. im Finish) zählen so nicht als eigener Schlag.
const MIN_ABSTAND = 3;

// So viel Video vor und nach dem schnellsten Moment gehört zu einem Schwung (Sekunden).
// Davor: ruhiges Ansprechen + Rückschwung (bis 2,5 s). Danach: Treffmoment + Finish (bis 2 s).
const VORLAUF = 5;
const NACHLAUF = 2.5;

// Zeitpunkte aller Schläge im Video (Sekunden, aufsteigend)
export function findeSchlagZeiten(bilder, seitenverhaeltnis = 1) {
  const gueltig = gueltigeBilder(bilder);
  if (gueltig.length < 20) return [];
  const { zeit, tempoRunter } = handBewegung(gueltig, seitenverhaeltnis);

  // Alle Bilder über der Schwelle, das schnellste zuerst. Ein Bild wird nur dann
  // ein neuer Schlag, wenn es weit genug von allen schon gefundenen entfernt ist –
  // so gewinnt in jedem Schwung automatisch der schnellste Moment.
  const kandidaten = zeit
    .map((z, i) => ({ zeit: z, tempo: tempoRunter[i] }))
    .filter((k) => k.tempo >= SCHLAG_SCHWELLE)
    .sort((a, b) => b.tempo - a.tempo);
  const schlaege = [];
  for (const k of kandidaten) {
    if (schlaege.every((s) => Math.abs(s - k.zeit) >= MIN_ABSTAND)) schlaege.push(k.zeit);
  }
  return schlaege.sort((a, b) => a - b);
}

// Alle Schwünge im Video finden und jeden einzeln auswerten
export function findeSchwuenge(bilder, seitenverhaeltnis = 1) {
  const zeiten = findeSchlagZeiten(bilder, seitenverhaeltnis);

  // Kein schneller Schlag gefunden: das ganze Video als einen Schwung auswerten
  // (wie früher). phasen.js meldet dann selbst, wenn etwas nicht passt.
  if (zeiten.length === 0) return [werteAus(bilder, seitenverhaeltnis, 1)];

  return zeiten.map((z, i) => {
    // Fenster um den Schlag – aber nie über die Mitte zum Nachbarschlag hinaus,
    // damit sich zwei Schwünge nicht gegenseitig stören.
    const von = i > 0 ? Math.max(z - VORLAUF, (zeiten[i - 1] + z) / 2) : z - VORLAUF;
    const bis = i < zeiten.length - 1 ? Math.min(z + NACHLAUF, (z + zeiten[i + 1]) / 2) : z + NACHLAUF;
    // Die Bilder behalten ihre Zeit im Video → Phasen-Zeiten passen direkt zum Video
    const ausschnitt = bilder.filter((b) => b.zeit >= von && b.zeit <= bis);
    return werteAus(ausschnitt, seitenverhaeltnis, i + 1);
  });
}

// Einen Schwung auswerten: Phasen, Kennzahlen, Technik (wie bisher bei einem Video)
function werteAus(bilder, seitenverhaeltnis, nummer) {
  const phasen = erkennePhasen(bilder, seitenverhaeltnis);
  if (phasen.fehler) {
    return { nummer, bilder, sicher: false, grund: phasen.fehler };
  }
  const bewertung = bewerteSchwung(bilder, phasen, seitenverhaeltnis);
  const technik = bewerteTechnik(bilder, phasen, seitenverhaeltnis, bewertung.ansicht);
  // Unplausibles Tempo = vermutlich Probeschwung oder Zeitlupe → zählt nicht zur Gesamtauswertung
  const sicher = phasen.tempo.plausibel;
  return {
    nummer,
    bilder,
    phasen,
    bewertung,
    technik,
    ansicht: bewertung.ansicht,
    kennzahlen: [...bewertung.kennzahlen, ...technik.kennzahlen].map(ordneEin),
    sicher,
    grund: sicher ? null : "Das Tempo passt nicht zu einem normalen Schwung (Probeschwung oder Zeitlupe?).",
  };
}
