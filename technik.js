// ===============================================================
// Technik-Tipps: Arme, Oberkörperhaltung und Drehung
//
// Ergänzt kennzahlen.js um weitere Kennzahlen und macht aus allen
// Kennzahlen direkte Tipps:
//   1. bewerteTechnik()        misst Arme, Oberkörper und Drehung
//   2. ordneEin()              gibt jeder Kennzahl Kennung, Kategorie und Videomoment
//   3. wichtigsteBaustellen()  wählt die 3 Punkte aus, an denen du zuerst arbeiten solltest
//
// Wie in kennzahlen.js: x wird in "Bildhöhen" umgerechnet und Strecken werden
// in Rumpflängen (Schultermitte bis Hüftmitte) gemessen.
//
// Bewusst NICHT gemessen (siehe README): der Führungsarm am Top und die
// Hüftdrehung. Am Top verdeckt der Körper den Arm, die Hüftpunkte liegen unter
// der Kleidung – die Pose-Erkennung rät dort zu oft falsch. Dafür gibt es
// "Selbst prüfen"-Hinweise, die zum passenden Videobild springen.
// ===============================================================

import { gueltigeBilder } from "./phasen.js";

// Nummern der Körperpunkte bei MediaPipe Pose
const NASE = 0, AUGE_L = 2, AUGE_R = 5, OHR_L = 7, OHR_R = 8;
const SCHULTER_L = 11, SCHULTER_R = 12;
const ELLBOGEN_L = 13, ELLBOGEN_R = 14;
const HANDGELENK_L = 15, HANDGELENK_R = 16;
const HUEFTE_L = 23, HUEFTE_R = 24;

const GRAD = 180 / Math.PI;
const mitte = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const abstand = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const prozent = (wert) => `${wert < 0 ? "−" : ""}${Math.round(Math.abs(wert) * 100)} %`;
const grad = (wert) => `${Math.round(wert)}°`;
const rund = (wert) => Math.round(wert * 100) / 100;

// Winkel am Punkt b zwischen a und c (180° = gestreckt)
function winkel(a, b, c) {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const cos = (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y));
  return Math.acos(Math.max(-1, Math.min(1, cos))) * GRAD;
}

// Bewertung aus drei Bereichen: gut / achtung / sonst verbessern
function einstufen(wert, gut, achtung) {
  const drin = ([von, bis]) => wert >= von && wert <= bis;
  if (drin(gut)) return "gut";
  if (achtung.some(drin)) return "achtung";
  return "verbessern";
}

// ---------------------------------------------------------------
// Schulterdrehung aus der Schulterbreite schätzen
//
// Dreht sich der Oberkörper, sieht man die Schultern von vorne schmaler.
// Bei einer reinen Linie wäre die Breite cos(Drehung). Die Pose-Erkennung setzt
// die Schulterpunkte aber an den Rand des sichtbaren Körpers – auch von der
// Seite ist der Oberkörper noch etwa halb so breit (Brusttiefe). Deshalb:
//   sichtbare Breite = cos(Drehung) + TIEFE · sin(Drehung)
// TIEFE ist so gewählt, dass der Profi-Testschwung am Top ca. 90° ergibt.
// Das Ergebnis ist eine Schätzung, darum zeigt die App "ca." davor.
// ---------------------------------------------------------------
const TIEFE = 0.45;
const MIN_DREHUNG = 2 * Math.atan(TIEFE) * GRAD; // ca. 48°: darunter ist die Formel mehrdeutig

export function schaetzeDrehung(breitenVerhaeltnis) {
  if (breitenVerhaeltnis >= 1) return null; // Drehung unter ca. 50° – nicht genauer bestimmbar
  const breite = (g) => Math.cos(g / GRAD) + TIEFE * Math.sin(g / GRAD);
  let von = MIN_DREHUNG, bis = 170;
  if (breitenVerhaeltnis <= breite(bis)) return bis;
  for (let i = 0; i < 40; i++) {
    const m = (von + bis) / 2;
    if (breite(m) > breitenVerhaeltnis) von = m;
    else bis = m;
  }
  return (von + bis) / 2;
}

// Wörter für links/rechts – Rechtshänder: vorne = links, hinten = rechts
export function seiten(rechtshaender) {
  const [v, h] = rechtshaender ? ["link", "recht"] : ["recht", "link"];
  const gross = (w) => w[0].toUpperCase() + w.slice(1);
  return {
    // "die linke Schulter", "dein linker Arm", "den linken Arm", "dein linkes Knie"
    f: `${v}e`, fer: `${v}er`, fen: `${v}en`, fes: `${v}es`, Fer: gross(`${v}er`),
    h: `${h}e`, her: `${h}er`, hen: `${h}en`, hes: `${h}es`, Her: gross(`${h}er`),
  };
}

// ===============================================================
// 1. Messen und bewerten
// ===============================================================
export function bewerteTechnik(bilder, phasen, seitenverhaeltnis = 1, ansicht = "frontal") {
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
  const schulterMitte = (i) => mitte(punkt(i, SCHULTER_L), punkt(i, SCHULTER_R));
  const hueftMitte = (i) => mitte(punkt(i, HUEFTE_L), punkt(i, HUEFTE_R));
  const haende = (i) => mitte(punkt(i, HANDGELENK_L), punkt(i, HANDGELENK_R));

  const A = phasen.ansprechen.index;
  const T = phasen.top.index;
  const I = phasen.treffmoment.index;
  const rumpf = abstand(schulterMitte(A), hueftMitte(A));

  // Neigung des Oberkörpers (Hüftmitte → Schultermitte) zur Senkrechten in Grad.
  // richtung = +1: positiv, wenn die Schultern weiter rechts im Bild sind als die Hüfte.
  const neigung = (i, richtung) => {
    const s = schulterMitte(i), h = hueftMitte(i);
    return Math.atan2((s.x - h.x) * richtung, h.y - s.y) * GRAD;
  };

  // Zielrichtung im Bild (+1 = rechts, −1 = links), wie in kennzahlen.js:
  // Am Top sind die Hände auf der zielabgewandten Seite.
  const ziel = -Math.sign(haende(T).x - schulterMitte(T).x) || 1;

  // Welche Seite ist vorne (zum Ziel)? Von vorne: die Schulter, die beim Ansprechen
  // näher am Ziel ist. Von hinten schaut ein Rechtshänder nach rechts im Bild (zum Ball).
  const richtungBall = Math.sign(haende(A).x - hueftMitte(A).x) || 1;
  const linksVorne =
    ansicht === "frontal"
      ? (punkt(A, SCHULTER_L).x - punkt(A, SCHULTER_R).x) * ziel > 0
      : richtungBall > 0;
  const rechtshaender = linksVorne;
  const s = seiten(rechtshaender);
  const fuehrung = linksVorne
    ? { schulter: SCHULTER_L, ellbogen: ELLBOGEN_L, handgelenk: HANDGELENK_L }
    : { schulter: SCHULTER_R, ellbogen: ELLBOGEN_R, handgelenk: HANDGELENK_R };
  const hinten = linksVorne ? SCHULTER_R : SCHULTER_L;

  const kennzahlen = [];
  const selbstChecks = [];
  const neu = (k) => kennzahlen.push({ gefuehl: null, ...k });

  if (ansicht === "hinten") {
    // -------------------------------------------------------------
    // ARME beim Ansprechen (von hinten): Hängen die Arme unter den Schultern?
    // + = Hände vor der Schulterlinie (Richtung Ball), − = dichter am Körper
    // -------------------------------------------------------------
    const armAbstand = ((haende(A).x - schulterMitte(A).x) * richtungBall) / rumpf;
    const bw = einstufen(armAbstand, [-0.25, 0.15], [[0.15, 0.3], [-0.4, -0.25]]);
    const k = {
      id: "armeAnsprechen",
      messwert: rund(armAbstand), // Zahl für spätere Fortschrittskurven
      name: "Arme beim Ansprechen",
      kategorie: "arme",
      phase: "ansprechen",
      gewicht: 3,
      wert: `${armAbstand > 0 ? "+" : ""}${prozent(armAbstand)}`,
      detail: "Hände vor (+) oder hinter (−) der Schultermitte, in % der Rumpflänge. Gut: −25 bis +15 %",
      bewertung: bw,
    };
    if (bw !== "gut" && armAbstand > 0) {
      k.gefuehl = "Lass die Arme locker senkrecht aus den Schultern hängen und greif den Schläger dort, wo die Hände hängen. Dann stell dich so weit vom Ball weg, wie der Schläger es vorgibt – nicht umgekehrt.";
    } else if (bw !== "gut") {
      k.gefuehl = "Zwischen Griffende und Oberschenkel passt etwa eine Faust. Die Arme hängen senkrecht unter den Schultern.";
    }
    neu(k);

    // -------------------------------------------------------------
    // OBERKÖRPER: Vorneigung beim Ansprechen (von hinten)
    // -------------------------------------------------------------
    const vorneigung = Math.abs(neigung(A, 1));
    const bv = einstufen(vorneigung, [25, 45], [[18, 25], [45, 52]]);
    const v = {
      id: "vorneigungAnsprechen",
      messwert: rund(vorneigung), // Zahl für spätere Fortschrittskurven
      name: "Vorneigung beim Ansprechen",
      kategorie: "oberkoerper",
      phase: "ansprechen",
      gewicht: 3,
      wert: grad(vorneigung),
      detail: "Neigung des Oberkörpers nach vorne (Hüfte bis Schultern). Gut: 25–45°",
      bewertung: bv,
    };
    if (bv !== "gut" && vorneigung < 25) {
      v.gefuehl = "Kipp aus der Hüfte nach vorne, nicht aus dem Rücken: Po nach hinten, Rücken lang, Knie leicht gebeugt. Die Arme hängen dann von allein unter den Schultern.";
    } else if (bv !== "gut") {
      v.gefuehl = "Etwas aufrichten: Gewicht auf die Fußmitte, Kinn weg von der Brust, Knie nur leicht beugen.";
    }
    neu(v);

    selbstChecks.push({
      name: `${s.Her} Ellbogen am Top`,
      phase: "top",
      text: `Spring zum Top und schau: Zeigt dein ${s.her} Ellbogen eher Richtung Boden oder steht er weit nach hinten ab? Ein abstehender Ellbogen ist kein Fehler an sich – auch Top-Spieler haben ihn. Er kann aber zu einem steilen Abschwung führen. Bei vielen Amateuren liegt es an der Beweglichkeit der Schulter, nicht an der Technik.`,
    });
  } else {
    // -------------------------------------------------------------
    // ARME: Führungsarm im Treffmoment (frontal)
    // Im Treffmoment ist der Arm gut zu sehen – anders als am Top.
    // -------------------------------------------------------------
    const armWinkel = winkel(punkt(I, fuehrung.schulter), punkt(I, fuehrung.ellbogen), punkt(I, fuehrung.handgelenk));
    const ba = einstufen(armWinkel, [155, 180], [[140, 155]]);
    const a = {
      id: "fuehrungsarmTreff",
      messwert: rund(armWinkel), // Zahl für spätere Fortschrittskurven
      name: `${s.Fer} Arm im Treffmoment`,
      kategorie: "arme",
      phase: "treffmoment",
      gewicht: 2,
      wert: grad(armWinkel),
      detail: `Winkel am ${s.fen} Ellbogen (180° = ganz gestreckt). Gut: ab 155°`,
      bewertung: ba,
    };
    if (ba !== "gut") {
      a.gefuehl = `Der ${s.f} Arm und der Schläger bilden im Treffmoment eine lange Linie. Das klappt, wenn dein Körper weiterdreht – stoppt die Drehung, knicken die Arme ein.`;
    }
    neu(a);

    // -------------------------------------------------------------
    // DREHUNG: Schulterdrehung am Top (frontal, Schätzung aus der Breite)
    // -------------------------------------------------------------
    const breite = (i) => (punkt(i, fuehrung.schulter).x - punkt(i, hinten).x) * ziel;
    const verhaeltnis = breite(T) / breite(A);
    const geschaetzt = schaetzeDrehung(verhaeltnis);
    const drehung = geschaetzt === null ? null : Math.round(geschaetzt);
    const bd = drehung === null ? "verbessern" : einstufen(drehung, [80, 180], [[65, 80]]);
    const d = {
      id: "schulterdrehung",
      messwert: drehung, // Zahl für spätere Fortschrittskurven
      name: "Schulterdrehung am Top",
      kategorie: "drehung",
      phase: "top",
      gewicht: 2.5,
      wert: drehung === null ? "unter 50°" : `ca. ${drehung}°`,
      detail: `Schätzung aus der Schulterbreite: am Top noch ${prozent(Math.max(0, verhaeltnis))} der Breite beim Ansprechen. Gut: ab ca. 80°`,
      bewertung: bd,
    };
    if (bd !== "gut") {
      d.gefuehl = `Dreh den Rücken zum Ziel: Die ${s.f} Schulter wandert unter dein Kinn. Dein ${s.hes} Knie bleibt dabei leicht gebeugt, damit sich die Drehung „aufladen“ kann.`;
    }
    neu(d);

    // -------------------------------------------------------------
    // ARME: Armschwung am Top (frontal)
    // Hände sehr hoch UND wenig Drehung = Arme heben statt Oberkörper drehen.
    // -------------------------------------------------------------
    const handHoehe = (schulterMitte(T).y - haende(T).y) / rumpf;
    const volleDrehung = drehung !== null && drehung >= 80;
    let bh = "gut";
    if (handHoehe > 0.75 && !volleDrehung) bh = handHoehe > 0.9 ? "verbessern" : "achtung";
    const h = {
      id: "armschwungTop",
      messwert: rund(handHoehe), // Zahl für spätere Fortschrittskurven
      name: "Armschwung am Top",
      kategorie: "arme",
      phase: "top",
      gewicht: 2,
      wert: prozent(handHoehe),
      detail: "Höhe der Hände über der Schultermitte, in % der Rumpflänge – bewertet zusammen mit der Schulterdrehung",
      bewertung: bh,
    };
    if (bh !== "gut") {
      h.gefuehl = `„Drehen statt heben“: Die Hände bleiben im Rückschwung vor der Brust, die Brust nimmt sie mit nach hinten. Am Top sind die Hände etwa über der ${s.hen} Schulter – nicht hoch über dem Kopf.`;
    }
    neu(h);

    // -------------------------------------------------------------
    // OBERKÖRPER: Seitneigung beim Ansprechen, am Top und im Treffmoment (frontal)
    // Positiv = Oberkörper vom Ziel weg geneigt (hintere Schulter tiefer) – so soll es sein.
    // -------------------------------------------------------------
    const seitAnsprechen = neigung(A, -ziel);
    const bs = einstufen(seitAnsprechen, [0, 20], [[-6, 0], [20, 30]]);
    const sa = {
      id: "seitneigungAnsprechen",
      messwert: rund(seitAnsprechen), // Zahl für spätere Fortschrittskurven
      name: "Seitneigung beim Ansprechen",
      kategorie: "oberkoerper",
      phase: "ansprechen",
      gewicht: 2.5,
      wert: `${seitAnsprechen < 0 ? "−" : ""}${grad(Math.abs(seitAnsprechen))}`,
      detail: "Neigung des Oberkörpers vom Ziel weg (+) oder zum Ziel (−). Gut: 0 bis 20°",
      bewertung: bs,
    };
    if (bs !== "gut" && seitAnsprechen < 0) {
      sa.gefuehl = `Neig den Oberkörper leicht vom Ziel weg: Die ${s.h} Schulter ist etwas tiefer als die ${s.f}, dein Brustbein ist knapp hinter dem Ball.`;
    } else if (bs !== "gut") {
      sa.gefuehl = "Nur leicht neigen: Beim Eisen reichen wenige Grad, beim Driver etwas mehr.";
    }
    neu(sa);

    const seitTop = neigung(T, -ziel);
    const bt = einstufen(seitTop, [-3, 90], [[-10, -3]]);
    const st = {
      id: "oberkoerperTop",
      messwert: rund(seitTop), // Zahl für spätere Fortschrittskurven
      name: "Oberkörper am Top",
      kategorie: "oberkoerper",
      phase: "top",
      gewicht: 2.5,
      wert: `${seitTop < 0 ? "−" : ""}${grad(Math.abs(seitTop))}`,
      detail: "Neigung vom Ziel weg (+) oder zum Ziel (−). Gut: nicht mehr als 3° zum Ziel",
      bewertung: bt,
    };
    if (bt !== "gut") {
      st.gefuehl = `Dreh dich im Rückschwung um deine Wirbelsäule und lass den Oberkörper über dem ${s.hen} Bein. Am Top bleibt dein Brustbein hinter dem Ball.`;
    }
    neu(st);

    const seitTreff = neigung(I, -ziel);
    const bi = einstufen(seitTreff, [8, 90], [[2, 8]]);
    const si = {
      id: "oberkoerperTreff",
      messwert: rund(seitTreff), // Zahl für spätere Fortschrittskurven
      name: "Oberkörper im Treffmoment",
      kategorie: "oberkoerper",
      phase: "treffmoment",
      gewicht: 2,
      wert: `${seitTreff < 0 ? "−" : ""}${grad(Math.abs(seitTreff))}`,
      detail: "Neigung vom Ziel weg (+) oder zum Ziel (−). Gut: ab 8° vom Ziel weg",
      bewertung: bi,
    };
    if (bi !== "gut") {
      si.gefuehl = `Im Abschwung schiebt die Hüfte leicht zum Ziel, der Oberkörper bleibt zurück. Gefühl: Die ${s.h} Schulter geht nach unten zum Ball, nicht nach vorne.`;
    }
    neu(si);

    // -------------------------------------------------------------
    // DREHUNG: Hüfte schiebt im Rückschwung zur Seite ("Sway", frontal)
    // Die Hüftmitte ist gut messbar, auch wenn die Hüftdrehung es nicht ist.
    // -------------------------------------------------------------
    const sway = ((hueftMitte(T).x - hueftMitte(A).x) * -ziel) / rumpf;
    const bw = einstufen(sway, [-1, 0.15], [[0.15, 0.25]]);
    const w = {
      id: "hueftSway",
      messwert: rund(sway), // Zahl für spätere Fortschrittskurven
      name: "Hüfte im Rückschwung",
      kategorie: "drehung",
      phase: "top",
      gewicht: 2,
      wert: prozent(Math.max(0, sway)),
      detail: "Seitliche Verschiebung der Hüfte vom Ziel weg bis zum Top, in % der Rumpflänge. Gut: bis 15 %",
      bewertung: bw,
    };
    if (bw !== "gut") {
      w.gefuehl = `Drehen statt schieben: Dein ${s.hes} Knie bleibt gebeugt und stabil, die Hüfte dreht sich über dem ${s.hen} Fuß wie auf einem Drehteller.`;
    }
    neu(w);

    selbstChecks.push({
      name: `${s.Fer} Arm am Top`,
      phase: "top",
      text: `Am Top verdeckt dein Körper den ${s.fen} Arm – die Pose-Erkennung rät dort oft falsch, deshalb misst die App ihn nicht. Spring zum Top und schau selbst: Ist der Arm weitgehend gerade (ein leichter Knick ist ok)? Ist er stark geknickt, hol kürzer aus – ein ¾-Schwung mit langem Arm ist besser als ein voller mit Knick.`,
    });
  }

  return {
    rechtshaender,
    fuehrung,
    // Für die Ideallinien im Video (ideallinien.js)
    hintereSchulter: hinten,
    ziel,
    richtungBall,
    ansicht,
    seitenverhaeltnis,
    kennzahlen,
    selbstChecks,
    nurAndereAnsicht:
      ansicht === "frontal"
        ? "Vorneigung und Armhaltung beim Ansprechen misst die App im Video von hinten (entlang der Ziellinie)."
        : "Arme im Treffmoment, Schulterdrehung und Seitneigung misst die App im Video von vorne.",
  };
}

// ===============================================================
// 2. Kennzahlen aus kennzahlen.js einordnen
// Die neuen Kennzahlen bringen Kennung, Kategorie und Videomoment selbst mit.
// ===============================================================
const ZUORDNUNG = {
  Tempo: { id: "tempo", kategorie: "rhythmus", phase: "top", gewicht: 1 },
  Kopfhöhe: { id: "kopfhoehe", kategorie: "oberkoerper", phase: "treffmoment", gewicht: 2 },
  "Kopf seitlich": { id: "kopfSeitlich", kategorie: "oberkoerper", phase: "treffmoment", gewicht: 2 },
  Gewichtsverlagerung: { id: "gewicht", kategorie: "drehung", phase: "finish", gewicht: 1.5 },
  "Vorneigung halten": { id: "vorneigungHalten", kategorie: "oberkoerper", phase: "treffmoment", gewicht: 2.5 },
  "Hüfte Richtung Ball": { id: "hueftBall", kategorie: "oberkoerper", phase: "treffmoment", gewicht: 2 },
};

export const KATEGORIEN = [
  { schluessel: "arme", name: "💪 Arme" },
  { schluessel: "oberkoerper", name: "🧍 Oberkörperhaltung" },
  { schluessel: "drehung", name: "🔄 Drehung" },
  { schluessel: "rhythmus", name: "⏱️ Rhythmus" },
];

export function ordneEin(kennzahl) {
  const extra = ZUORDNUNG[kennzahl.name] || { kategorie: "rhythmus", phase: "top", gewicht: 1 };
  return { gefuehl: null, ...extra, ...kennzahl };
}

// ===============================================================
// 3. Die wichtigsten Baustellen: erst "verbessern", dann "achtung",
// innerhalb davon nach Gewicht. Grundlagen (Ansprechhaltung, Drehung) wiegen
// mehr, weil sich viele andere Fehler daraus ergeben.
// ===============================================================
export function wichtigsteBaustellen(kennzahlen, anzahl = 3) {
  const stufe = { verbessern: 2, achtung: 1 };
  return kennzahlen
    .map((k, reihenfolge) => ({ k, reihenfolge, punkte: (stufe[k.bewertung] || 0) * (k.gewicht || 1) }))
    .filter((e) => e.punkte > 0)
    .sort((a, b) => b.punkte - a.punkte || a.reihenfolge - b.reihenfolge)
    .slice(0, anzahl)
    .map((e) => e.k);
}
