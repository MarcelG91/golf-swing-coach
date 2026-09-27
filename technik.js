// ===============================================================
// Technik-Tipps: Arme, Oberkörperhaltung und Drehung
//
// Ergänzt kennzahlen.js um weitere Kennzahlen und macht aus allen
// Kennzahlen direkte Tipps:
//   1. bewerteTechnik()        misst Arme, Oberkörper und Drehung
//   2. ordneEin()              gibt jeder Kennzahl Kategorie, Videomoment und Messlinien
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
  const neu = (k) => kennzahlen.push({ tipp: null, gefuehl: null, ...k });

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
      zeichnung: ["arme"],
      gewicht: 3,
      wert: `${armAbstand > 0 ? "+" : ""}${prozent(armAbstand)}`,
      detail: "Hände vor (+) oder hinter (−) der Schultermitte, in % der Rumpflänge. Gut: −25 bis +15 %",
      bewertung: bw,
    };
    if (bw === "gut") {
      k.text = "Deine Arme hängen beim Ansprechen locker unter den Schultern. So haben sie im Schwung Platz, und dein Abstand zum Ball passt.";
    } else if (armAbstand > 0) {
      k.text = "Deine Hände sind beim Ansprechen deutlich vor der Schulterlinie – du greifst nach dem Ball. Die Arme sind dann angespannt, der Schwung wird flach, und du kippst leicht nach vorne.";
      k.gefuehl = "Lass die Arme locker senkrecht aus den Schultern hängen und greif den Schläger dort, wo die Hände hängen. Dann stell dich so weit vom Ball weg, wie der Schläger es vorgibt – nicht umgekehrt.";
      k.tipp = "Arme baumeln lassen: Ansprechhaltung ohne Schläger, Arme 3 Sekunden locker hängen lassen, Hände zusammenführen und erst dann den Schläger hineinlegen. Vor jedem Übungsball, bis es automatisch geht.";
    } else {
      k.text = "Deine Hände sind beim Ansprechen sehr nah am Körper. Dann haben die Arme im Abschwung keinen Platz – du musst ausweichen oder dich aufrichten.";
      k.gefuehl = "Zwischen Griffende und Oberschenkel passt etwa eine Handbreite. Die Arme hängen senkrecht unter den Schultern.";
      k.tipp = `Handbreit-Check: Halte beim Ansprechen die ${s.hen} Hand flach zwischen Griffende und deinen ${s.fen} Oberschenkel. Passt sie knapp hinein, stimmt der Abstand.`;
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
      zeichnung: ["wirbelsaeule"],
      gewicht: 3,
      wert: grad(vorneigung),
      detail: "Neigung des Oberkörpers nach vorne (Hüfte bis Schultern). Gut: 25–45°",
      bewertung: bv,
    };
    const stockUebung =
      "Schläger am Rücken: Leg einen Schläger längs an deinen Rücken, sodass er Hinterkopf, Schulterblätter und Steißbein berührt. Kipp nach vorne, bis du auf den Ball schaust – der Schläger bleibt an allen drei Punkten. 5× vor jedem Training.";
    if (bv === "gut") {
      v.text = "Deine Vorneigung ist eine gute Ausgangsposition: Der Oberkörper kann sich frei drehen, und die Arme haben Platz.";
    } else if (vorneigung < 25) {
      v.text = "Du stehst beim Ansprechen recht aufrecht. Dann dreht sich der Oberkörper eher waagerecht, der Schwung wird flach, und der Schläger trifft oft den Boden hinter dem Ball.";
      v.gefuehl = "Kipp aus der Hüfte nach vorne, nicht aus dem Rücken: Po nach hinten, Rücken lang, Knie leicht gebeugt. Die Arme hängen dann von allein unter den Schultern.";
      v.tipp = stockUebung;
    } else {
      v.text = "Du beugst dich beim Ansprechen sehr weit vor. Das kostet Gleichgewicht und Drehfreiheit – oft kippst du im Schwung nach vorne oder richtest dich auf.";
      v.gefuehl = "Etwas aufrichten: Gewicht auf die Fußmitte, Kinn weg von der Brust, Knie nur leicht beugen.";
      v.tipp = stockUebung;
    }
    neu(v);

    selbstChecks.push({
      name: `${s.Her} Ellbogen am Top`,
      phase: "top",
      text: `Spring zum Top und schau: Zeigt dein ${s.her} Ellbogen Richtung Boden? Zeigt er nach hinten weg („fliegender Ellbogen“), kommt der Schläger oft steil von oben. Gefühl: wie ein Kellner, der ein Tablett trägt.`,
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
      zeichnung: ["fuehrungsarm"],
      gewicht: 2,
      wert: grad(armWinkel),
      detail: `Winkel am ${s.fen} Ellbogen (180° = ganz gestreckt). Gut: ab 155°`,
      bewertung: ba,
    };
    if (ba === "gut") {
      a.text = `Dein ${s.fer} Arm ist im Treffmoment lang. So bleibt der Abstand zum Ball gleich, und du triffst ihn sauber.`;
    } else {
      a.text = `Dein ${s.fer} Arm ist im Treffmoment gebeugt. Dadurch wird der Schwungkreis kleiner – der Schläger kommt zu hoch an den Ball (dünne oder getoppte Treffer), und du verlierst Kraft.`;
      a.gefuehl = `Der ${s.f} Arm und der Schläger bilden im Treffmoment eine lange Linie. Das klappt, wenn dein Körper weiterdreht – stoppt die Drehung, knicken die Arme ein.`;
      a.tipp = "Halbe Schwünge „Hüfte bis Hüfte“: Nur bis Hüfthöhe ausholen und bis Hüfthöhe durchschwingen. Beide Arme sind nach dem Ball noch lang. 20 Bälle, dann langsam länger werden.";
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
      zeichnung: ["schultern"],
      gewicht: 2.5,
      wert: drehung === null ? "unter 50°" : `ca. ${drehung}°`,
      detail: `Schätzung aus der Schulterbreite: am Top noch ${prozent(Math.max(0, verhaeltnis))} der Breite beim Ansprechen. Gut: ab ca. 80°`,
      bewertung: bd,
    };
    if (bd === "gut") {
      d.text = "Deine Schultern drehen am Top voll – dein Rücken zeigt zum Ziel. Das ist die Grundlage für Weite.";
    } else {
      d.text = "Deine Schultern drehen am Top nicht ganz durch (Ziel: rund 90°, der Rücken zeigt zum Ziel). Ohne volle Drehung müssen die Arme die Arbeit machen – das kostet Weite und führt oft zu einem Abschwung von außen (Slice).";
      d.gefuehl = `Dreh den Rücken zum Ziel: Die ${s.f} Schulter wandert unter dein Kinn. Dein ${s.hes} Knie bleibt dabei leicht gebeugt, damit sich die Drehung „aufladen“ kann.`;
      d.tipp = "Schläger vor der Brust: Halte einen Schläger quer vor der Brust (Hände an den Schultern), Ansprechhaltung einnehmen. Dreh dich, bis das Schlägerende auf den Ball zeigt – das ist eine volle Schulterdrehung. 10× langsam, danach halbe Schwünge mit demselben Gefühl.";
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
      zeichnung: ["haende", "schultern"],
      gewicht: 2,
      wert: prozent(handHoehe),
      detail: "Höhe der Hände über der Schultermitte, in % der Rumpflänge – bewertet zusammen mit der Schulterdrehung",
      bewertung: bh,
    };
    if (bh !== "gut") {
      h.text = "Am Top sind deine Hände sehr hoch, deine Schultern aber noch nicht voll gedreht. Die Arme heben den Schläger nach oben, statt dass der Oberkörper ihn nach hinten dreht. Folge: ein steiler Abschwung und wechselnde Treffpunkte.";
      h.gefuehl = `„Drehen statt heben“: Die Hände bleiben im Rückschwung vor der Brust, die Brust nimmt sie mit nach hinten. Am Top sind die Hände etwa über der ${s.hen} Schulter – nicht hoch über dem Kopf.`;
      h.tipp = "Griffende zum Bauchnabel: Schläger mit langen Armen vor dir halten, das Griffende zeigt auf deinen Bauchnabel. Hol nur durch Drehen der Brust aus, bis die Hände auf Hüfthöhe sind – das Griffende zeigt weiter auf den Bauchnabel. 10× langsam, dann halbe Schwünge mit Ball.";
    } else if (handHoehe > 0.75) {
      h.text = "Deine Hände gehen am Top hoch – das passt, weil sich deine Schultern auch voll drehen.";
    } else {
      h.text = "Arme und Oberkörper arbeiten am Top gut zusammen: Die Hände sind etwa über der Schulter, nicht hoch über dem Kopf.";
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
      zeichnung: ["wirbelsaeule"],
      gewicht: 2.5,
      wert: `${seitAnsprechen < 0 ? "−" : ""}${grad(Math.abs(seitAnsprechen))}`,
      detail: "Neigung des Oberkörpers vom Ziel weg (+) oder zum Ziel (−). Gut: 0 bis 20°",
      bewertung: bs,
    };
    if (bs === "gut") {
      sa.text = "Dein Oberkörper ist beim Ansprechen leicht vom Ziel weg geneigt oder gerade – eine gute Ausgangsposition hinter dem Ball.";
    } else if (seitAnsprechen < 0) {
      sa.text = `Dein Oberkörper neigt sich beim Ansprechen zum Ziel. Weil deine ${s.h} Hand am Griff tiefer sitzt, sollte auch die ${s.h} Schulter etwas tiefer sein – sonst stehst du schon „vor dem Ball“, was einen steilen Abschwung und Slices begünstigt.`;
      sa.gefuehl = `Neig den Oberkörper leicht vom Ziel weg: Die ${s.h} Schulter ist etwas tiefer als die ${s.f}, dein Brustbein ist knapp hinter dem Ball.`;
      sa.tipp = `Knie-Tipp: Tipp in der Ansprechhaltung mit der ${s.hen} Hand kurz seitlich an dein ${s.hes} Knie und führ sie dann zurück an den Griff. So entsteht die leichte Seitneigung von allein. Vor jedem Ball.`;
    } else {
      sa.text = "Du neigst dich beim Ansprechen sehr stark vom Ziel weg. Das kann dazu führen, dass du den Boden hinter dem Ball triffst.";
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
      zeichnung: ["wirbelsaeule"],
      gewicht: 2.5,
      wert: `${seitTop < 0 ? "−" : ""}${grad(Math.abs(seitTop))}`,
      detail: "Neigung vom Ziel weg (+) oder zum Ziel (−). Gut: nicht mehr als 3° zum Ziel",
      bewertung: bt,
    };
    if (bt === "gut") {
      st.text = "Am Top bleibt dein Oberkörper hinter dem Ball. Sehr gut!";
    } else {
      st.text = `Am Top neigt sich dein Oberkörper zum Ziel („umgekehrter Wirbelsäulenwinkel“). Dein Gewicht bleibt dann auf dem ${s.fen} Fuß, und im Abschwung fällst du nach hinten. Das kostet Kraft, macht die Treffer unsauber und belastet den unteren Rücken.`;
      st.gefuehl = `Dreh dich im Rückschwung um deine Wirbelsäule und lass den Oberkörper über dem ${s.hen} Bein. Am Top ist dein Kopf eher über dem ${s.hen} Knie als über dem ${s.fen}.`;
      st.tipp = "Spiegel-Check: Stell dich frontal vor einen Spiegel, hol langsam zum Top aus und halte an. Deine Wirbelsäule ist senkrecht oder leicht vom Ziel weg geneigt – niemals zum Ziel. 10× langsam.";
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
      zeichnung: ["wirbelsaeule"],
      gewicht: 2,
      wert: `${seitTreff < 0 ? "−" : ""}${grad(Math.abs(seitTreff))}`,
      detail: "Neigung vom Ziel weg (+) oder zum Ziel (−). Gut: ab 8° vom Ziel weg",
      bewertung: bi,
    };
    if (bi === "gut") {
      si.text = "Im Treffmoment ist dein Oberkörper vom Ziel weg geneigt – so kommt der Schläger flach von innen an den Ball.";
    } else {
      si.text = `Im Treffmoment steht dein Oberkörper fast senkrecht oder neigt sich schon zum Ziel. Gute Spieler sind hier deutlich vom Ziel weg geneigt, die ${s.h} Schulter ist tiefer als die ${s.f}. Ohne diese Neigung kommt der Schläger steil von oben: typisch sind Slice, gezogene Bälle und zu tiefe Divots.`;
      si.gefuehl = `Im Abschwung schiebt die Hüfte leicht zum Ziel, der Oberkörper bleibt zurück. Gefühl: Die ${s.h} Schulter geht nach unten zum Ball, nicht nach vorne.`;
      si.tipp = `Treffposition in Zeitlupe: Aus dem Top langsam in die Treffposition bewegen und dort anhalten. Kontrolle im Spiegel: Gürtelschnalle leicht zum Ziel gedreht, Kopf hinter dem Ball, ${s.h} Schulter tiefer als die ${s.f}. 10× langsam, dann mit Ball.`;
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
      zeichnung: ["huefte"],
      gewicht: 2,
      wert: prozent(Math.max(0, sway)),
      detail: "Seitliche Verschiebung der Hüfte vom Ziel weg bis zum Top, in % der Rumpflänge. Gut: bis 15 %",
      bewertung: bw,
    };
    if (bw === "gut") {
      w.text = "Deine Hüfte dreht im Rückschwung auf der Stelle, statt zur Seite zu schieben. Gut!";
    } else {
      w.text = "Im Rückschwung schiebst du die Hüfte zur Seite vom Ziel weg („Sway“), statt sie zu drehen. Dann musst du im Abschwung genauso weit zurück – das gelingt selten gleich, und der Treffpunkt wandert.";
      w.gefuehl = `Drehen statt schieben: Dein ${s.hes} Knie bleibt gebeugt und stabil, die Hüfte dreht sich über dem ${s.hen} Fuß wie auf einem Drehteller.`;
      w.tipp = `Stab-Übung: Steck einen Schläger oder Stab senkrecht direkt außen neben deine ${s.h} Hüfte in den Boden. Im Rückschwung darf die Hüfte ihn nicht berühren. 10 langsame Rückschwünge, dann halbe Schwünge.`;
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
// Die neuen Kennzahlen bringen Kategorie, Videomoment und Messlinien selbst mit.
// ===============================================================
const ZUORDNUNG = {
  Tempo: { kategorie: "rhythmus", phase: "top", zeichnung: [], gewicht: 1 },
  Kopfhöhe: { kategorie: "oberkoerper", phase: "treffmoment", zeichnung: ["kopf"], gewicht: 2 },
  "Kopf seitlich": { kategorie: "oberkoerper", phase: "treffmoment", zeichnung: ["kopf"], gewicht: 2 },
  Gewichtsverlagerung: { kategorie: "drehung", phase: "finish", zeichnung: ["huefte"], gewicht: 1.5 },
  "Vorneigung halten": { kategorie: "oberkoerper", phase: "treffmoment", zeichnung: ["wirbelsaeule"], gewicht: 2.5 },
  "Hüfte Richtung Ball": { kategorie: "oberkoerper", phase: "treffmoment", zeichnung: ["huefte"], gewicht: 2 },
};

export const KATEGORIEN = [
  { schluessel: "arme", name: "💪 Arme" },
  { schluessel: "oberkoerper", name: "🧍 Oberkörperhaltung" },
  { schluessel: "drehung", name: "🔄 Drehung" },
  { schluessel: "rhythmus", name: "⏱️ Rhythmus" },
];

export function ordneEin(kennzahl) {
  const extra = ZUORDNUNG[kennzahl.name] || { kategorie: "rhythmus", phase: "top", zeichnung: [], gewicht: 1 };
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
