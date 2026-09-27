// ===============================================================
// Kennzahlen und Tipps
// Nimmt die Körperpunkte und die erkannten Phasen und bewertet den Schwung.
//
// Die Grenzwerte sind Richtwerte. Sie stammen aus Messungen an echten Schwungvideos
// von Profis und Amateuren (siehe tests/daten/QUELLEN.md) und aus gängigen
// Golf-Lehrmeinungen. Alle Strecken werden in "Rumpflängen" gemessen
// (Schultermitte bis Hüftmitte), damit es egal ist, wie groß du im Bild bist.
// ===============================================================

import { gueltigeBilder } from "./phasen.js";

// Nummern der Körperpunkte bei MediaPipe Pose
const NASE = 0, AUGE_L = 2, AUGE_R = 5, OHR_L = 7, OHR_R = 8;
const SCHULTER_L = 11, SCHULTER_R = 12;
const HANDGELENK_L = 15, HANDGELENK_R = 16;
const HUEFTE_L = 23, HUEFTE_R = 24;
const KNOECHEL_L = 27, KNOECHEL_R = 28;

// Ab diesem Verhältnis Schulterbreite : Rumpflänge sehen wir dich von vorne
const GRENZE_FRONTAL = 0.6;

const mitte = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const abstand = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const zahl = (wert, stellen = 2) => wert.toFixed(stellen).replace(".", ",");

// Bewertungsstufen: gut (grün), achtung (gelb), verbessern (rot), unsicher (grau)
function stufe(wert, { gutBis, achtungBis }) {
  if (wert <= gutBis) return "gut";
  if (wert <= achtungBis) return "achtung";
  return "verbessern";
}

export function bewerteSchwung(bilder, phasen, seitenverhaeltnis = 1) {
  // Gleiche Bildliste wie in phasen.js, x in Bildhöhen umgerechnet
  const liste = gueltigeBilder(bilder).map((b) => ({
    zeit: b.zeit,
    punkte: b.punkte.map((p) => ({ x: p.x * seitenverhaeltnis, y: p.y })),
  }));

  // Punkt k im Bild i, gemittelt mit den Nachbarbildern (gegen Zittern)
  function punkt(i, k) {
    const nachbarn = [i - 1, i, i + 1].filter((j) => liste[j]).map((j) => liste[j].punkte[k]);
    return {
      x: nachbarn.reduce((s, p) => s + p.x, 0) / nachbarn.length,
      y: nachbarn.reduce((s, p) => s + p.y, 0) / nachbarn.length,
    };
  }
  const kopf = (i) => {
    const teile = [NASE, AUGE_L, AUGE_R, OHR_L, OHR_R].map((k) => punkt(i, k));
    return { x: teile.reduce((s, p) => s + p.x, 0) / 5, y: teile.reduce((s, p) => s + p.y, 0) / 5 };
  };
  const schulterMitte = (i) => mitte(punkt(i, SCHULTER_L), punkt(i, SCHULTER_R));
  const hueftMitte = (i) => mitte(punkt(i, HUEFTE_L), punkt(i, HUEFTE_R));
  const haende = (i) => mitte(punkt(i, HANDGELENK_L), punkt(i, HANDGELENK_R));
  // Neigung des Oberkörpers zur Senkrechten in Grad
  const vorneigung = (i) => {
    const s = schulterMitte(i), h = hueftMitte(i);
    return (Math.atan2(Math.abs(s.x - h.x), h.y - s.y) * 180) / Math.PI;
  };

  const A = phasen.ansprechen.index;
  const T = phasen.top.index;
  const I = phasen.treffmoment.index;
  const F = phasen.finish.index;
  const rumpf = abstand(schulterMitte(A), hueftMitte(A));

  // --- Aus welcher Richtung wurde gefilmt? ---
  const schulterBreite = Math.abs(punkt(A, SCHULTER_L).x - punkt(A, SCHULTER_R).x) / rumpf;
  const ansicht = schulterBreite >= GRENZE_FRONTAL ? "frontal" : "hinten";
  const ansichtSicher = Math.abs(schulterBreite - GRENZE_FRONTAL) > 0.15;

  // Zielrichtung im Bild (+1 = rechts, −1 = links): Am Top sind die Hände
  // auf der zielabgewandten Seite. Das klappt für Rechts- und Linkshänder.
  const ziel = -Math.sign(haende(T).x - schulterMitte(T).x) || 1;

  const kennzahlen = [];

  // ---------------------------------------------------------------
  // 1. Tempo (beide Ansichten)
  // ---------------------------------------------------------------
  const { verhaeltnis, rueckschwung, abschwung, plausibel } = phasen.tempo;
  if (verhaeltnis) {
    let bewertung = "gut", text, tipp = null;
    // Gute Spieler liegen um 3 : 1. Das Band ist bewusst breit, weil bei 30 Bildern
    // pro Sekunde ein einziges Bild beim kurzen Abschwung ca. ±15 % ausmacht.
    if (verhaeltnis < 2.0 || verhaeltnis > 4.6) bewertung = "verbessern";
    else if (verhaeltnis < 2.4 || verhaeltnis > 4.0) bewertung = "achtung";

    if (!plausibel) {
      bewertung = "unsicher";
      text = "Die Zeiten passen nicht zu einem Schwung in normaler Geschwindigkeit (Zeitlupe?). Das Tempo wird deshalb nicht bewertet.";
    } else if (verhaeltnis < 2.4) {
      text = "Dein Rückschwung ist im Verhältnis zum Abschwung zu schnell. Das kostet Rhythmus und Treffsicherheit.";
      tipp = "Zähle beim Üben im Rückschwung langsam „eins – zwei – drei“ und schwinge auf „vier“ durch. Oben kurz ankommen lassen, dann erst runter.";
    } else if (verhaeltnis > 4.0) {
      text = "Dein Rückschwung ist im Verhältnis sehr langsam. Oft wird der Abschwung dann hektisch oder zögerlich.";
      tipp = "Schwinge flüssig zurück, ohne oben zu verharren. Denke an ein Pendel: gleichmäßiger Rhythmus statt Pause.";
    } else {
      text = "Dein Rhythmus liegt im Bereich guter Spieler (etwa 3 : 1). Weiter so!";
    }
    kennzahlen.push({
      name: "Tempo",
      wert: `${zahl(verhaeltnis, 1)} : 1`,
      detail: `Rückschwung ${zahl(rueckschwung)} s · Abschwung ${zahl(abschwung)} s`,
      bewertung, text, tipp,
    });
  }

  // ---------------------------------------------------------------
  // 2. Kopfhöhe: richtest du dich bis zum Treffmoment auf? (beide Ansichten)
  //    Leichtes Absinken ist normal, Anheben ist ein typischer Anfängerfehler.
  // ---------------------------------------------------------------
  const kopfHoch = (kopf(A).y - kopf(I).y) / rumpf; // positiv = Kopf höher als beim Ansprechen
  {
    let bewertung, text, tipp = null;
    if (kopfHoch > 0.08) {
      bewertung = kopfHoch > 0.15 ? "verbessern" : "achtung";
      text = "Dein Kopf ist im Treffmoment höher als beim Ansprechen. Du richtest dich auf – das führt oft zu getoppten oder dünnen Schlägen.";
      tipp = "Lass die Knie bis nach dem Treffmoment leicht gebeugt und halte den Blick auf der Rückseite des Balls. Gut dafür: halbe Schwünge, bei denen du erst nach dem Treffen hochschaust.";
    } else if (kopfHoch < -0.4) {
      bewertung = "achtung";
      text = "Dein Kopf sinkt bis zum Treffmoment deutlich ab. Etwas Absinken ist normal, zu viel führt zu fetten Schlägen (Boden vor dem Ball).";
      tipp = "Achte darauf, deine Kniebeugung vom Ansprechen zu halten, statt im Abschwung in die Knie zu gehen.";
    } else {
      bewertung = "gut";
      text = "Deine Kopfhöhe bleibt bis zum Treffmoment stabil.";
    }
    kennzahlen.push({
      name: "Kopfhöhe",
      wert: `${kopfHoch >= 0 ? "+" : "−"}${zahl(Math.abs(kopfHoch) * 100, 0)} %`,
      detail: "Veränderung bis zum Treffmoment, in % deiner Rumpflänge (+ = höher)",
      bewertung, text, tipp,
    });
  }

  if (ansicht === "frontal") {
    // -------------------------------------------------------------
    // 3a. Kopf seitlich (frontal): Bleibt der Kopf hinter dem Ball?
    // -------------------------------------------------------------
    const kopfTop = ((kopf(T).x - kopf(A).x) * ziel) / rumpf; // negativ = weg vom Ziel
    const kopfTreff = ((kopf(I).x - kopf(A).x) * ziel) / rumpf; // positiv = Richtung Ziel
    let bewertung = "gut", text, tipp = null;
    if (kopfTreff > 0.08) {
      bewertung = kopfTreff > 0.15 ? "verbessern" : "achtung";
      text = "Dein Kopf wandert bis zum Treffmoment Richtung Ziel, also vor den Ball. Gute Spieler halten den Kopf im Treffmoment hinter dem Ball.";
      tipp = "Stecke ein Tee ein paar Zentimeter hinter den Ball und schau beim Schwung darauf. Der Kopf bleibt dort, bis der Ball weg ist.";
    } else if (kopfTop < -0.35) {
      bewertung = "achtung";
      text = "Im Rückschwung schiebst du Kopf und Oberkörper stark zur Seite (Sway), statt dich zu drehen.";
      tipp = "Drehe dich im Rückschwung um deine Wirbelsäule. Übung: Stell dir vor, du stehst in einem engen Fass – drehen ja, seitlich schieben nein.";
    } else {
      text = "Dein Kopf bleibt im Treffmoment hinter dem Ball. Sehr gut!";
    }
    kennzahlen.push({
      name: "Kopf seitlich",
      wert: `${kopfTreff >= 0 ? "+" : "−"}${zahl(Math.abs(kopfTreff) * 100, 0)} %`,
      detail: "Verschiebung bis zum Treffmoment, in % der Rumpflänge (+ = Richtung Ziel)",
      bewertung, text, tipp,
    });

    // -------------------------------------------------------------
    // 4a. Gewichtsverlagerung (frontal): Wo steht die Hüfte im Finish?
    //     0 % = über dem hinteren Fuß, 100 % = über dem vorderen Fuß
    // -------------------------------------------------------------
    const kl = punkt(A, KNOECHEL_L), kr = punkt(A, KNOECHEL_R);
    const hintererFuss = (kl.x - kr.x) * ziel > 0 ? kr : kl;
    const vordererFuss = hintererFuss === kr ? kl : kr;
    const standbreite = vordererFuss.x - hintererFuss.x;
    if (Math.abs(standbreite) / rumpf > 0.3) {
      const anteil = (hueftMitte(F).x - hintererFuss.x) / standbreite;
      let bw, txt, tp = null;
      if (anteil >= 0.85) {
        bw = "gut";
        txt = "Im Finish ist dein Gewicht auf dem vorderen Fuß. Genau so soll es sein.";
      } else {
        bw = anteil >= 0.65 ? "achtung" : "verbessern";
        txt = "Im Finish bleibt zu viel Gewicht auf dem hinteren Fuß. Dadurch fehlt Kraft, und der Ball fliegt oft zu hoch oder zur Seite weg.";
        tp = "Halte nach jedem Schlag dein Finish 3 Sekunden: Gewicht fast komplett auf dem vorderen Fuß, hinterer Fuß nur noch auf der Spitze, Gürtelschnalle zeigt zum Ziel.";
      }
      kennzahlen.push({
        name: "Gewichtsverlagerung",
        wert: `${zahl(Math.max(0, Math.min(1.2, anteil)) * 100, 0)} %`,
        detail: "Hüftposition im Finish: 0 % = hinterer Fuß, 100 % = vorderer Fuß",
        bewertung: bw, text: txt, tipp: tp,
      });
    }
  } else {
    // -------------------------------------------------------------
    // 3b. Vorneigung halten (von hinten): Verlierst du den Wirbelsäulenwinkel?
    // -------------------------------------------------------------
    const verlust = vorneigung(A) - vorneigung(I); // positiv = aufgerichtet
    const bewertung = stufe(verlust, { gutBis: 10, achtungBis: 15 });
    kennzahlen.push({
      name: "Vorneigung halten",
      wert: `${verlust > 0 ? "−" : "+"}${zahl(Math.abs(verlust), 0)}°`,
      detail: `Ansprechen ${zahl(vorneigung(A), 0)}° → Treffmoment ${zahl(vorneigung(I), 0)}°`,
      bewertung,
      text: bewertung === "gut"
        ? "Du hältst deine Vorneigung bis zum Treffmoment gut. Ein paar Grad Aufrichten sind normal."
        : "Du richtest den Oberkörper bis zum Treffmoment deutlich auf. Dadurch ändert sich der Abstand zum Ball – typische Folgen sind Toppen oder Shanks.",
      tipp: bewertung === "gut"
        ? null
        : "Übung: Stell dich beim Ansprechen mit dem Po leicht an eine Wand (oder eine Golftasche). Halte den Kontakt im Rückschwung und bis nach dem Treffmoment.",
    });

    // -------------------------------------------------------------
    // 4b. Hüfte Richtung Ball (von hinten): „Early Extension“
    // -------------------------------------------------------------
    const richtungBall = Math.sign(haende(A).x - hueftMitte(A).x) || 1;
    const hueftVor = ((hueftMitte(I).x - hueftMitte(A).x) * richtungBall) / rumpf;
    const bw = stufe(hueftVor, { gutBis: 0.12, achtungBis: 0.22 });
    kennzahlen.push({
      name: "Hüfte Richtung Ball",
      wert: `${zahl(Math.max(0, hueftVor) * 100, 0)} %`,
      detail: "Wie weit die Hüfte bis zum Treffmoment zum Ball schiebt, in % der Rumpflänge",
      bewertung: bw,
      text: bw === "gut"
        ? "Deine Hüfte bleibt im Abschwung auf Abstand zum Ball. Sehr gut!"
        : "Deine Hüfte schiebt im Abschwung Richtung Ball („Early Extension“). Die Arme haben dann keinen Platz mehr.",
      tipp: bw === "gut"
        ? null
        : "Stell eine Golftasche oder einen Stuhl direkt hinter deinen Po. Im Abschwung soll die Gesäßseite des vorderen Beins die Tasche berühren – nicht wegschieben.",
    });
  }

  return { ansicht, ansichtSicher, kennzahlen, kopfBeimAnsprechen: kopf(A), seitenverhaeltnis };
}
