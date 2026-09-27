// ===============================================================
// Ideallinien für das Video
//
// Für jede Kennzahl: Welche Körperlinie wurde gemessen ("ist") und wo sollte
// sie liegen ("ideal")? app.js färbt die gemessene Linie rot, wenn sie außerhalb
// des Zielbereichs liegt, und zeichnet die Ideallinie gelb dazu.
//
// Eingabe: Körperpunkte des gezeigten Videobilds und des Ansprechens,
//          wie MediaPipe sie liefert (x und y jeweils 0 bis 1).
// Ausgabe: Linien { von, bis } und Kreise { mitte, radius } im selben Format.
//          Der Radius ist ein Anteil der Bildhöhe.
//
// Wie in technik.js wird intern x in "Bildhöhen" umgerechnet – sonst wären
// Winkel in Hochkant-Videos verzerrt.
// ===============================================================

// Zielwerte, auf die die gelbe Linie zeigt. Sie liegen im grünen Bereich
// der Bewertung (technik.js / kennzahlen.js).
export const IDEAL = {
  vorneigungAnsprechen: 35, // Grad nach vorne (gut: 25–45°)
  seitneigungAnsprechen: 7, // Grad vom Ziel weg (gut: 0–20°)
  oberkoerperTop: 5, // Grad vom Ziel weg (gut: ab −3°)
  oberkoerperTreff: 13, // Grad vom Ziel weg (gut: ab 8°), Profi-Testschwung: 12–13°
  armschwungTop: 0.5, // Hände über der Schultermitte, in Rumpflängen (Profi: 0,45)
  schulterBreiteTop: 0.45, // sichtbare Schulterbreite bei 90° Drehung (siehe technik.js)
};

// Kennzahlen, für die es eine Linie im Bild gibt (Tempo z. B. nicht)
export const MIT_LINIE = new Set([
  "fuehrungsarmTreff", "armeAnsprechen", "armschwungTop",
  "vorneigungAnsprechen", "vorneigungHalten", "seitneigungAnsprechen", "oberkoerperTop", "oberkoerperTreff",
  "kopfhoehe", "kopfSeitlich", "hueftBall",
  "schulterdrehung", "hueftSway", "gewicht",
]);

const KOPF = [0, 2, 5, 7, 8];
const GRAD = Math.PI / 180;

export function ideallinien(kennzahl, punkte, ansprechen, kontext) {
  const sv = kontext.seitenverhaeltnis || 1;
  // Umrechnen: MediaPipe → Bildhöhen und zurück
  const hin = (p) => ({ x: p.x * sv, y: p.y });
  const zurueck = (p) => ({ x: p.x / sv, y: p.y });
  const P = punkte.map(hin);
  const A = ansprechen.map(hin);

  const mitte = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const plus = (a, v) => ({ x: a.x + v.x, y: a.y + v.y });
  const minus = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
  const laenge = (v) => Math.hypot(v.x, v.y);
  const schulterMitte = (p) => mitte(p[11], p[12]);
  const hueftMitte = (p) => mitte(p[23], p[24]);
  const kopf = (p) => ({
    x: KOPF.reduce((s, k) => s + p[k].x, 0) / KOPF.length,
    y: KOPF.reduce((s, k) => s + p[k].y, 0) / KOPF.length,
  });
  const rumpf = laenge(minus(schulterMitte(A), hueftMitte(A)));

  const ist = [], istKreise = [], ideal = [], idealKreise = [];
  const linie = (liste, von, bis) => liste.push({ von: zurueck(von), bis: zurueck(bis) });
  const kreis = (liste, m, radius) => liste.push({ mitte: zurueck(m), radius });

  // Oberkörper-Linie (Hüftmitte → Schultermitte) mit einem Wunschwinkel zur
  // Senkrechten. richtungX: +1 = nach rechts im Bild geneigt, −1 = nach links.
  const oberkoerperIdeal = (winkel, richtungX) => {
    const h = hueftMitte(P), s = schulterMitte(P);
    const l = laenge(minus(s, h));
    linie(ist, h, s);
    kreis(istKreise, h, 0.008);
    linie(ideal, h, { x: h.x + richtungX * l * Math.sin(winkel * GRAD), y: h.y - l * Math.cos(winkel * GRAD) });
  };
  // Hüftlinie seitlich so verschieben, dass die Hüftmitte bei zielX liegt
  const hueftIdeal = (zielX) => {
    const h = hueftMitte(P);
    const dx = zielX - h.x;
    linie(ist, P[23], P[24]);
    kreis(istKreise, h, 0.01);
    linie(ideal, { x: P[23].x + dx, y: P[23].y }, { x: P[24].x + dx, y: P[24].y });
    kreis(idealKreise, { x: zielX, y: h.y }, 0.01);
  };
  const armeIst = () => {
    for (const [a, b] of [[11, 13], [13, 15], [12, 14], [14, 16]]) linie(ist, P[a], P[b]);
  };

  switch (kennzahl.id) {
    // ---------------- Arme ----------------
    case "fuehrungsarmTreff": {
      // Ideal: gerader Arm von der Schulter in Richtung Hand, so lang wie Ober- + Unterarm
      const { schulter, ellbogen, handgelenk } = kontext.fuehrung;
      const S = P[schulter], E = P[ellbogen], H = P[handgelenk];
      linie(ist, S, E);
      linie(ist, E, H);
      kreis(istKreise, E, 0.01);
      const richtung = minus(H, S);
      const armLaenge = laenge(minus(E, S)) + laenge(minus(H, E));
      const faktor = armLaenge / (laenge(richtung) || 1);
      linie(ideal, S, plus(S, { x: richtung.x * faktor, y: richtung.y * faktor }));
      break;
    }
    case "armeAnsprechen": {
      // Ideal: Hände hängen senkrecht unter der Schultermitte
      const s = schulterMitte(P), h = mitte(P[15], P[16]);
      armeIst();
      kreis(istKreise, h, 0.012);
      linie(ideal, s, { x: s.x, y: h.y });
      kreis(idealKreise, { x: s.x, y: h.y }, 0.012);
      break;
    }
    case "armschwungTop": {
      // Ideal: Hände etwa eine halbe Rumpflänge über der Schultermitte.
      // Rot wird der hintere Arm – den vorderen verdeckt am Top der Körper.
      const s = schulterMitte(P), h = mitte(P[15], P[16]);
      const hs = kontext.hintereSchulter;
      linie(ist, P[hs], P[hs + 2]);
      linie(ist, P[hs + 2], P[hs + 4]);
      kreis(istKreise, h, 0.012);
      const hoehe = s.y - IDEAL.armschwungTop * rumpf;
      linie(ideal, { x: h.x - 0.35 * rumpf, y: hoehe }, { x: h.x + 0.35 * rumpf, y: hoehe });
      kreis(idealKreise, { x: h.x, y: hoehe }, 0.012);
      break;
    }

    // ---------------- Oberkörper ----------------
    case "vorneigungAnsprechen":
      oberkoerperIdeal(IDEAL.vorneigungAnsprechen, kontext.richtungBall);
      break;
    case "vorneigungHalten": {
      // Ideal: dieselbe Vorneigung wie beim Ansprechen
      const d = minus(schulterMitte(A), hueftMitte(A));
      oberkoerperIdeal(Math.atan2(Math.abs(d.x), -d.y) / GRAD, kontext.richtungBall);
      break;
    }
    case "seitneigungAnsprechen":
      oberkoerperIdeal(IDEAL.seitneigungAnsprechen, -kontext.ziel);
      break;
    case "oberkoerperTop":
      oberkoerperIdeal(IDEAL.oberkoerperTop, -kontext.ziel);
      break;
    case "oberkoerperTreff":
      oberkoerperIdeal(IDEAL.oberkoerperTreff, -kontext.ziel);
      break;
    case "kopfhoehe": {
      // Ideal: Kopf auf der Höhe wie beim Ansprechen (waagerechte gelbe Linie)
      const k = kopf(P), kA = kopf(A);
      kreis(istKreise, k, 0.3 * rumpf);
      linie(ideal, { x: k.x - 0.6 * rumpf, y: kA.y }, { x: k.x + 0.6 * rumpf, y: kA.y });
      break;
    }
    case "kopfSeitlich": {
      // Ideal: Kopf seitlich dort, wo er beim Ansprechen war (senkrechte gelbe Linie)
      const k = kopf(P), kA = kopf(A);
      kreis(istKreise, k, 0.3 * rumpf);
      linie(ideal, { x: kA.x, y: k.y - 0.6 * rumpf }, { x: kA.x, y: k.y + 0.6 * rumpf });
      break;
    }
    case "hueftBall":
      // Ideal: Hüfte bleibt auf Abstand zum Ball wie beim Ansprechen
      hueftIdeal(hueftMitte(A).x);
      break;

    // ---------------- Drehung ----------------
    case "schulterdrehung": {
      // Ideal: Schulterlinie so schmal wie bei ca. 90° Drehung, gleiche Mitte und Neigung
      const s = schulterMitte(P);
      const vorne = P[kontext.fuehrung.schulter], hinten = P[kontext.hintereSchulter];
      linie(ist, vorne, hinten);
      const halbeBreite = ((A[kontext.fuehrung.schulter].x - A[kontext.hintereSchulter].x) * IDEAL.schulterBreiteTop) / 2;
      const halbeHoehe = (vorne.y - hinten.y) / 2;
      linie(ideal, { x: s.x + halbeBreite, y: s.y + halbeHoehe }, { x: s.x - halbeBreite, y: s.y - halbeHoehe });
      break;
    }
    case "hueftSway":
      // Ideal: Hüfte dreht auf der Stelle – Hüftmitte wie beim Ansprechen
      hueftIdeal(hueftMitte(A).x);
      break;
    case "gewicht": {
      // Ideal: Hüftmitte im Finish senkrecht über dem vorderen Fuß
      const vorderer = (A[27].x - A[28].x) * kontext.ziel > 0 ? 27 : 28;
      hueftIdeal(P[vorderer].x);
      linie(ideal, P[vorderer], { x: P[vorderer].x, y: hueftMitte(P).y });
      break;
    }
    default:
      return null; // z. B. Tempo: keine Linie im Bild
  }
  return { ist, istKreise, ideal, idealKreise };
}
