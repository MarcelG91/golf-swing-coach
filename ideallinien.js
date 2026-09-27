// ===============================================================
// Ideallinien für das Video
//
// Für jede Kennzahl: Welche Körperlinie wurde gemessen ("ist") und wo sollte
// sie liegen ("ideal")? app.js färbt die gemessene Linie rot, wenn sie außerhalb
// des Zielbereichs liegt, und zeichnet die Ideallinie gelb dazu.
//
// Eingabe: Körperpunkte des gezeigten Videobilds und des Ansprechens,
//          wie MediaPipe sie liefert (x und y jeweils 0 bis 1).
// Ausgabe: Linien { von, bis } und Kreise { mitte, radius } im selben Format
//          (der Radius ist ein Anteil der Bildhöhe), dazu Pfeile von Rot nach Gelb
//          und ein kurzer Hinweis für die Sprechblase im Video.
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
  // Richtung im Bild, so wie du es auf dem Bildschirm siehst
  const seite = (dx) => (dx < 0 ? "links" : "rechts");
  // Seite am Körper des Golfers (Rechtshänder: vorne = links)
  const fuehrungsSeite = kontext.rechtshaender === false ? "rechten" : "linken";

  const ist = [], istKreise = [], ideal = [], idealKreise = [], pfeile = [];
  let hinweis = "";
  const linie = (liste, von, bis) => liste.push({ von: zurueck(von), bis: zurueck(bis) });
  const kreis = (liste, m, radius) => liste.push({ mitte: zurueck(m), radius });
  // Pfeil von deiner (roten) Linie zur gelben Ideallinie
  const pfeil = (von, bis) => pfeile.push({ von: zurueck(von), bis: zurueck(bis) });

  // Oberkörper-Linie (Hüftmitte → Schultermitte) mit einem Wunschwinkel zur
  // Senkrechten. richtungX: +1 = nach rechts im Bild geneigt, −1 = nach links.
  // Gibt die Schultermitte (rot) und das Ende der gelben Linie zurück.
  const oberkoerperIdeal = (winkel, richtungX) => {
    const h = hueftMitte(P), s = schulterMitte(P);
    const l = laenge(minus(s, h));
    const zielPunkt = { x: h.x + richtungX * l * Math.sin(winkel * GRAD), y: h.y - l * Math.cos(winkel * GRAD) };
    linie(ist, h, s);
    kreis(istKreise, h, 0.008);
    linie(ideal, h, zielPunkt);
    pfeil(s, zielPunkt);
    return { jetzt: s, soll: zielPunkt };
  };
  // Hüftlinie seitlich so verschieben, dass die Hüftmitte bei zielX liegt
  const hueftIdeal = (zielX) => {
    const h = hueftMitte(P);
    const dx = zielX - h.x;
    linie(ist, P[23], P[24]);
    kreis(istKreise, h, 0.01);
    linie(ideal, { x: P[23].x + dx, y: P[23].y }, { x: P[24].x + dx, y: P[24].y });
    kreis(idealKreise, { x: zielX, y: h.y }, 0.01);
    pfeil(h, { x: zielX, y: h.y });
    return dx;
  };
  const armeIst = () => {
    for (const [a, b] of [[11, 13], [13, 15], [12, 14], [14, 16]]) linie(ist, P[a], P[b]);
  };
  // Aktuelle Neigung der Oberkörper-Linie in Grad (+ = in richtungX geneigt)
  const neigungJetzt = (richtungX) => {
    const d = minus(schulterMitte(P), hueftMitte(P));
    return Math.atan2(d.x * richtungX, -d.y) / GRAD;
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
      // Pfeil vom Ellbogen (Knick) senkrecht auf die gerade Linie
      const t = ((E.x - S.x) * richtung.x + (E.y - S.y) * richtung.y) / (laenge(richtung) ** 2 || 1);
      pfeil(E, plus(S, { x: richtung.x * t, y: richtung.y * t }));
      hinweis = `${fuehrungsSeite[0].toUpperCase()}${fuehrungsSeite.slice(1)} Arm gerade lassen und durchschwingen`;
      break;
    }
    case "armeAnsprechen": {
      // Ideal: Hände hängen senkrecht unter der Schultermitte
      const s = schulterMitte(P), h = mitte(P[15], P[16]);
      armeIst();
      kreis(istKreise, h, 0.012);
      linie(ideal, s, { x: s.x, y: h.y });
      kreis(idealKreise, { x: s.x, y: h.y }, 0.012);
      pfeil(h, { x: s.x, y: h.y });
      const zuWeitVorne = (h.x - s.x) * kontext.richtungBall > 0;
      hinweis = zuWeitVorne
        ? `Hände näher zum Körper – Arme locker hängen lassen`
        : `Hände etwas weiter nach ${seite(s.x - h.x)} – weg vom Körper`;
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
      pfeil(h, { x: h.x, y: hoehe });
      hinweis = "Hände tiefer – Schultern drehen statt Arme heben";
      break;
    }

    // ---------------- Oberkörper ----------------
    case "vorneigungAnsprechen": {
      const zuAufrecht = neigungJetzt(kontext.richtungBall) < IDEAL.vorneigungAnsprechen;
      oberkoerperIdeal(IDEAL.vorneigungAnsprechen, kontext.richtungBall);
      hinweis = zuAufrecht ? "Mehr aus der Hüfte nach vorne neigen" : "Oberkörper etwas aufrichten";
      break;
    }
    case "vorneigungHalten": {
      // Ideal: dieselbe Vorneigung wie beim Ansprechen
      const d = minus(schulterMitte(A), hueftMitte(A));
      const soll = Math.atan2(Math.abs(d.x), -d.y) / GRAD;
      const aufgerichtet = neigungJetzt(kontext.richtungBall) < soll;
      oberkoerperIdeal(soll, kontext.richtungBall);
      hinweis = aufgerichtet ? "Vorneigung halten – nicht aufrichten" : "Nicht abtauchen – Vorneigung halten";
      break;
    }
    case "seitneigungAnsprechen": {
      const zuViel = neigungJetzt(-kontext.ziel) > IDEAL.seitneigungAnsprechen;
      const { jetzt, soll } = oberkoerperIdeal(IDEAL.seitneigungAnsprechen, -kontext.ziel);
      hinweis = zuViel
        ? `Oberkörper etwas aufrichten – weniger nach ${seite(jetzt.x - soll.x)}`
        : `Oberkörper leicht nach ${seite(soll.x - jetzt.x)} neigen – weg vom Ziel`;
      break;
    }
    case "oberkoerperTop": {
      const { jetzt, soll } = oberkoerperIdeal(IDEAL.oberkoerperTop, -kontext.ziel);
      hinweis = `Oberkörper nach ${seite(soll.x - jetzt.x)} – nicht zum Ziel kippen`;
      break;
    }
    case "oberkoerperTreff": {
      const { jetzt, soll } = oberkoerperIdeal(IDEAL.oberkoerperTreff, -kontext.ziel);
      hinweis = `Oberkörper nach ${seite(soll.x - jetzt.x)} neigen – hinter dem Ball bleiben`;
      break;
    }
    case "kopfhoehe": {
      // Ideal: Kopf auf der Höhe wie beim Ansprechen (waagerechte gelbe Linie)
      const k = kopf(P), kA = kopf(A);
      kreis(istKreise, k, 0.3 * rumpf);
      linie(ideal, { x: k.x - 0.6 * rumpf, y: kA.y }, { x: k.x + 0.6 * rumpf, y: kA.y });
      pfeil(k, { x: k.x, y: kA.y });
      hinweis = kA.y > k.y ? "Kopf unten lassen – auf Höhe vom Ansprechen" : "Kopf nicht absenken – Knie ruhig halten";
      break;
    }
    case "kopfSeitlich": {
      // Ideal: Kopf seitlich dort, wo er beim Ansprechen war (senkrechte gelbe Linie)
      const k = kopf(P), kA = kopf(A);
      kreis(istKreise, k, 0.3 * rumpf);
      linie(ideal, { x: kA.x, y: k.y - 0.6 * rumpf }, { x: kA.x, y: k.y + 0.6 * rumpf });
      pfeil(k, { x: kA.x, y: k.y });
      hinweis = `Kopf weiter ${seite(kA.x - k.x)} – hinter dem Ball lassen`;
      break;
    }
    case "hueftBall": {
      // Ideal: Hüfte bleibt auf Abstand zum Ball wie beim Ansprechen
      const dx = hueftIdeal(hueftMitte(A).x);
      hinweis = `Po nach hinten – Hüfte zurück nach ${seite(dx)}`;
      break;
    }

    // ---------------- Drehung ----------------
    case "schulterdrehung": {
      // Ideal: Schulterlinie so schmal wie bei ca. 90° Drehung, gleiche Mitte und Neigung
      const s = schulterMitte(P);
      const vorne = P[kontext.fuehrung.schulter], hinten = P[kontext.hintereSchulter];
      linie(ist, vorne, hinten);
      const halbeBreite = ((A[kontext.fuehrung.schulter].x - A[kontext.hintereSchulter].x) * IDEAL.schulterBreiteTop) / 2;
      const halbeHoehe = (vorne.y - hinten.y) / 2;
      const vorneSoll = { x: s.x + halbeBreite, y: s.y + halbeHoehe };
      const hintenSoll = { x: s.x - halbeBreite, y: s.y - halbeHoehe };
      linie(ideal, vorneSoll, hintenSoll);
      // Beide Schultern müssen weiter "hinter" die Mitte – die Schulterlinie wird schmaler
      pfeil(vorne, vorneSoll);
      pfeil(hinten, hintenSoll);
      hinweis = "Schultern weiter drehen – Rücken zum Ziel";
      break;
    }
    case "hueftSway": {
      // Ideal: Hüfte dreht auf der Stelle – Hüftmitte wie beim Ansprechen
      const dx = hueftIdeal(hueftMitte(A).x);
      hinweis = `Hüfte zurück nach ${seite(dx)} – drehen statt schieben`;
      break;
    }
    case "gewicht": {
      // Ideal: Hüftmitte im Finish senkrecht über dem vorderen Fuß
      const vorderer = (A[27].x - A[28].x) * kontext.ziel > 0 ? 27 : 28;
      const dx = hueftIdeal(P[vorderer].x);
      linie(ideal, P[vorderer], { x: P[vorderer].x, y: hueftMitte(P).y });
      hinweis = `Hüfte weiter nach ${seite(dx)} – über den vorderen Fuß`;
      break;
    }
    default:
      return null; // z. B. Tempo: keine Linie im Bild
  }
  // Die Sprechblase zeigt auf den Anfang des ersten Pfeils (deine rote Linie)
  const anker = pfeile[0]?.von ?? ist[0]?.von ?? istKreise[0]?.mitte;
  return { ist, istKreise, ideal, idealKreise, pfeile, hinweis, anker };
}
