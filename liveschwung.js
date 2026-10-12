// ===============================================================
// Schwünge LIVE erkennen (Etappe 12b)
// Die Kamera liefert Bild für Bild { zeit, punkte }. Diese Datei merkt sich die letzten
// Sekunden und meldet, sobald ein Schwung vollständig war (Schlag + Finish).
// Sie nutzt dieselbe Schlag-Erkennung wie bei fertigen Videos (schwuenge.js), kennt aber
// keinen Browser, nur Zahlen → testbar mit node --test.
// ===============================================================

import { findeSchlagZeiten, werteAus, VORLAUF, NACHLAUF, MIN_ABSTAND } from "./schwuenge.js";

// Gedächtnis: so viele Sekunden Bilder bleiben im Speicher (Vorlauf + Nachlauf + Reserve)
const GEDAECHTNIS = VORLAUF + NACHLAUF + 2;

// Erst so lange nach dem schnellsten Moment wird ausgewertet. Danach sind Treffmoment
// und Finish im Fenster (phasen.js sucht das Finish bis 2 s nach dem Treffmoment).
// Kürzer = Rückmeldung schneller, aber das Finish könnte fehlen.
const WARTEN_NACH_SCHLAG = 2.2;

// Die Schlag-Suche läuft nicht bei jedem Bild, sondern höchstens so oft (Sekunden).
// Sie rechnet über das ganze Gedächtnis – das müsste bei 30 Bildern/s nicht sein.
const SUCH_ABSTAND = 0.25;

// Eine neue Live-Erkennung. seitenverhaeltnis = Breite / Höhe des Kamerabilds.
// Rückgabe: Objekt mit neuesBild(bild) und zuruecksetzen().
//   neuesBild gibt den ausgewerteten Schwung zurück (Format wie findeSchwuenge), sonst null.
export function neueLiveErkennung(seitenverhaeltnis = 1) {
  let bilder = [];
  let letzteSuche = -Infinity;
  let erledigt = []; // Zeiten der Schläge, die schon gemeldet wurden
  let nummer = 0;

  return {
    neuesBild(bild) {
      bilder.push(bild);
      // Alte Bilder vergessen
      const grenze = bild.zeit - GEDAECHTNIS;
      if (bilder[0].zeit < grenze) bilder = bilder.filter((b) => b.zeit >= grenze);

      if (bild.zeit - letzteSuche < SUCH_ABSTAND) return null;
      letzteSuche = bild.zeit;

      // Neue, schon "ausgereifte" Schläge: weit genug von gemeldeten entfernt, Finish abgewartet
      const reif = findeSchlagZeiten(bilder, seitenverhaeltnis).filter(
        (z) => bild.zeit - z >= WARTEN_NACH_SCHLAG && erledigt.every((e) => Math.abs(e - z) >= MIN_ABSTAND)
      );
      if (reif.length === 0) return null;

      const z = reif[0];
      // Fenster um den Schlag, nicht über die Mitte zum vorigen Schlag zurück
      const vorher = erledigt.filter((e) => e < z).at(-1);
      const von = vorher === undefined ? z - VORLAUF : Math.max(z - VORLAUF, (vorher + z) / 2);
      const ausschnitt = bilder.filter((b) => b.zeit >= von && b.zeit <= z + NACHLAUF);
      erledigt.push(z);
      erledigt = erledigt.filter((e) => e > bild.zeit - GEDAECHTNIS - MIN_ABSTAND);
      return { ...werteAus(ausschnitt, seitenverhaeltnis, ++nummer), schlagZeit: z };
    },

    zuruecksetzen() {
      bilder = [];
      erledigt = [];
      letzteSuche = -Infinity;
    },
  };
}
