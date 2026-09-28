// ===============================================================
// Strichfigur für die Baustellen-Karten
//
// Macht aus DEINEN Körperpunkten im passenden Moment (z. B. am Top) eine kleine
// Figur mit denselben roten und gelben Linien wie im Video (ideallinien.js).
// Kein Springen im Video nötig – das ist auf dem iPhone langsam. Die Figur ist
// deshalb sofort da und klappt auch bei gespeicherten Schwüngen ohne Video.
//
// Reine Rechenlogik: liefert nur Koordinaten, app.js zeichnet sie als SVG.
// Koordinaten: x und y in "Bildhöhen × 100" (x mit dem Seitenverhältnis
// umgerechnet, damit nichts verzerrt ist), so wie gefilmt – nicht gespiegelt.
// ===============================================================

// Körperlinien (Nummern der MediaPipe-Punkte): Schultern, Arme, Rumpf, Beine.
// Das Gesicht wird durch einen Kreis ersetzt – das ist ruhiger als viele kleine Punkte.
const KNOCHEN = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
];
const OHR_L = 7, OHR_R = 8;

// punkte      – Körperpunkte des Bilds (MediaPipe, x und y von 0 bis 1)
// linien      – Ergebnis von ideallinien() oder null (dann nur die Figur)
// seitenverhaeltnis – Breite / Höhe des Videos
export function strichfigur(punkte, linien, seitenverhaeltnis = 1) {
  const umrechnen = (p) => ({ x: p.x * seitenverhaeltnis * 100, y: p.y * 100 });
  const P = punkte.map(umrechnen);
  const mitte = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const strecke = ({ von, bis }) => ({ von: umrechnen(von), bis: umrechnen(bis) });
  const kreis = ({ mitte: m, radius }) => ({ mitte: umrechnen(m), radius: radius * 100 });

  // Kopfgröße im Verhältnis zur Rumpflänge (wie bei einem Menschen: knapp ein Fünftel)
  const rumpf = Math.hypot(
    mitte(P[11], P[12]).x - mitte(P[23], P[24]).x,
    mitte(P[11], P[12]).y - mitte(P[23], P[24]).y,
  );
  const kopf = { mitte: mitte(P[OHR_L], P[OHR_R]), radius: rumpf * 0.18 };

  const figur = {
    knochen: KNOCHEN.map(([a, b]) => ({ von: P[a], bis: P[b] })),
    kopf,
    rot: linien ? linien.ist.map(strecke) : [],
    rotKreise: linien ? linien.istKreise.map(kreis) : [],
    gelb: linien ? linien.ideal.map(strecke) : [],
    gelbKreise: linien ? linien.idealKreise.map(kreis) : [],
  };

  // Ausschnitt: alles, was gezeichnet wird, plus etwas Rand
  const xs = [], ys = [];
  const merke = (p) => { xs.push(p.x); ys.push(p.y); };
  for (const { von, bis } of [...figur.knochen, ...figur.rot, ...figur.gelb]) { merke(von); merke(bis); }
  for (const { mitte: m, radius } of [kopf, ...figur.rotKreise, ...figur.gelbKreise]) {
    merke({ x: m.x - radius, y: m.y - radius });
    merke({ x: m.x + radius, y: m.y + radius });
  }
  const links = Math.min(...xs), rechts = Math.max(...xs);
  const oben = Math.min(...ys), unten = Math.max(...ys);
  const rand = Math.max(rechts - links, unten - oben) * 0.08;
  figur.ausschnitt = {
    x: links - rand,
    y: oben - rand,
    breite: rechts - links + 2 * rand,
    hoehe: unten - oben + 2 * rand,
  };
  // Linienstärke passend zur Größe der Figur
  figur.staerke = figur.ausschnitt.hoehe / 70;
  return figur;
}
