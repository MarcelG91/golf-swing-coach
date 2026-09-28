// ===============================================================
// Bilder zu den Übungen: kleine Strichfiguren, zum Teil animiert
//
// Anforderung: Die Figuren dürfen KEINE falsche Technik zeigen. Deshalb:
//   - Frontal-Posen stammen aus dem echten Profi-Schwung (tests/daten/faceon_profi.json,
//     Bilder 47, 58, 70, 75, 76, 78, 94). Die App bewertet ihn in allen Kennzahlen mit "gut".
//     Einzige Korrektur: linker Arm am Top gestreckt (dort rät die Pose-Erkennung falsch).
//   - Die Ansprechhaltung von hinten stammt aus tests/daten/hinten_amateur_a.json
//     (Vorneigung 33°, Arme −14 % – beides "gut"). Der SCHWUNG dieses Amateurs hat
//     Fehler, deshalb zeigen wir von hinten nur Standbilder, keine Bewegung.
//   - Wo eine flache Zeichnung täuschen würde (Drehung zur Kamera hin), gibt es
//     bewusst kein Bild – nur den Text.
//   - Den Schläger erkennt die Pose-Erkennung nicht. Er wird über seinen Winkel w nach
//     den Lehrbuch-Positionen eingezeichnet (P2/P6/P8 = Schaft waagerecht, Top knapp vor
//     waagerecht, Treffmoment zum Ball, Finish hinter dem Kopf; Quellen in
//     docs/plan-tipps-neu.md). Der Winkel läuft in der Animation so weiter, dass der
//     Schläger HINTER dem Körper herunterkommt (345° → 180° → 92°).
//
// Reine Rechenlogik: liefert Linien, Kreise und Texte; app.js zeichnet sie als SVG.
//   bildZuSchritt(uebungName, schritt) → Bildbeschreibung oder null (nur Text)
//   zeichnung(bild, ms, rechtshaender) → { ausschnitt, elemente, text } für den Zeitpunkt ms
// ===============================================================

// ---------------------------------------------------------------
// Posen von vorne (Ziel = rechts im Bild). v = vordere Seite (zum Ziel), h = hintere.
// w = Schlägerwinkel in Grad (0 = zum Ziel, 90 = nach unten, 180 = vom Ziel weg).
// ---------------------------------------------------------------
export const POSEN = {
  ansprechen: { kopf: [100, 22], sv: [127, 36], sh: [78, 43], ev: [120, 77], eh: [88, 84], hand: [104, 116],
                hv: [117, 101], hh: [89, 103], kv: [124, 153], kh: [80, 153], fv: [130, 206], fh: [70, 206], w: 92 },
  halbRueck:  { kopf: [94, 23], sv: [115, 44], sh: [72, 34], ev: [93, 80], eh: [64, 71], hand: [58, 106],
                hv: [114, 101], hh: [86, 102], kv: [123, 153], kh: [76, 153], fv: [129, 205], fh: [68, 206], w: 180 },
  top:        { kopf: [89, 25], sv: [107, 38], sh: [83, 34], ev: [85, 22], eh: [63, 22], hand: [62, 6],
                hv: [114, 107], hh: [88, 105], kv: [120, 157], kh: [75, 152], fv: [127, 207], fh: [68, 206], w: 345 },
  abschwung:  { kopf: [97, 36], sv: [126, 50], sh: [89, 48], ev: [102, 82], eh: [89, 80], hand: [78, 105],
                hv: [131, 108], hh: [103, 107], kv: [134, 157], kh: [89, 153], fv: [131, 206], fh: [69, 205], w: 180 },
  treff:      { kopf: [96, 36], sv: [127, 41], sh: [85, 49], ev: [123, 82], eh: [93, 84], hand: [104, 116],
                hv: [133, 102], hh: [106, 105], kv: [134, 156], kh: [93, 154], fv: [133, 206], fh: [70, 205], w: 92 },
  halbDurch:  { kopf: [97, 30], sv: [125, 22], sh: [86, 49], ev: [142, 62], eh: [112, 76], hand: [150, 93],
                hv: [136, 97], hh: [110, 100], kv: [133, 153], kh: [99, 154], fv: [133, 206], fh: [74, 205], w: 0 },
  finish:     { kopf: [139, -8], sv: [112, 16], sh: [149, 13], ev: [86, 15], eh: [145, 11], hand: [113, -9],
                hv: [128, 91], hh: [131, 91], kv: [131, 148], kh: [125, 150], fv: [131, 204], fh: [83, 196], w: -200 },
};
const SCHLAEGER = 90; // Länge Hände bis Schlägerkopf (wie beim Ansprechen)
const BALL = [100, 207];
export const STAB_X = 62; // rechter Fuß beim Ansprechen bei x = 70

// Hand hängen lassen: rechte Hand vom Griff, Arm hängt locker unter der Schulter
const HAND_HAENGT = { ...POSEN.ansprechen, eh: [78, 80], handH: [79, 116] };

// Griffende am Bauchnabel: tief am Schaft greifen, der Schläger beginnt am Nabel
const nabel = (p) => [(p.hv[0] + p.hh[0]) / 2, (p.hv[1] + p.hh[1]) / 2 - 20];

// ---------------------------------------------------------------
// Ansprechhaltung von hinten (Ball = rechts im Bild). Eine Körperseite genügt,
// von hinten liegen linke und rechte Seite fast übereinander.
// ---------------------------------------------------------------
export const HINTEN = {
  ansprechen: { kopf: [156, 22], schulter: [133, 37], ellbogen: [118, 77], hand: [123, 112],
                huefte: [94, 96], knie: [112, 146], knoechel: [100, 204], zeh: [122, 208] },
  // Aufrecht (für "Schläger am Rücken"): gleiche Rumpflänge, Wirbelsäule fast senkrecht
  aufrecht:   { kopf: [108, 4], schulter: [102, 26], ellbogen: [102, 62], hand: [103, 98],
                huefte: [100, 96], knie: [104, 150], knoechel: [100, 204], zeh: [122, 208] },
};
const HINTEN_SCHLAEGERKOPF = [177, 206]; // Schaft zum Ball, ca. 60° Neigung wie bei Eisen

// ---------------------------------------------------------------
// Welche Bilder gehören zu welchem Übungsschritt?
// Jede Zeile = ein Schritt aus tipps.js (gleiche Reihenfolge). null = nur Text.
//   ansicht: "vorne" | "hinten"
//   folge:   Posen nacheinander; dauer = Übergang dorthin (ms), halten = Pause (ms),
//            text = ab dieser Pose angezeigt (z. B. beim Mitzählen)
//   hilfen:  Hilfsmittel und Hilfslinien (siehe zeichneHilfen)
// ---------------------------------------------------------------
const halbeSchwuenge = [
  { pose: "ansprechen", dauer: 0, halten: 700 }, { pose: "halbRueck", dauer: 900, halten: 250 },
  { pose: "treff", dauer: 450 }, { pose: "halbDurch", dauer: 400, halten: 800 },
];
const ganzerSchwung = [
  { pose: "ansprechen", dauer: 0, halten: 800 }, { pose: "halbRueck", dauer: 600 }, { pose: "top", dauer: 600, halten: 150 },
  { pose: "abschwung", dauer: 230 }, { pose: "treff", dauer: 110 }, { pose: "halbDurch", dauer: 160 },
  { pose: "finish", dauer: 450, halten: 1400 },
];
const vorne = (folge, hilfen = {}) => ({ ansicht: "vorne", folge, hilfen });
const still = (pose, hilfen = {}) => vorne([{ pose }], hilfen);
const hinten = (pose, hilfen = {}) => ({ ansicht: "hinten", folge: [{ pose }], hilfen });

const BILDER = {
  "Arme baumeln lassen": [
    hinten("ansprechen", { ohneSchlaeger: true, lot: true }),
    hinten("ansprechen", { ohneSchlaeger: true, lot: true }),
    hinten("ansprechen", { lot: true }),
  ],
  "Faust-Check": [
    hinten("ansprechen"),
    hinten("ansprechen", { faust: true }),
    hinten("ansprechen", { faust: true }),
  ],
  "Schläger am Rücken": [
    hinten("aufrecht", { ohneSchlaeger: true, rueckenStab: true }),
    { ansicht: "hinten", folge: [{ pose: "aufrecht", dauer: 0, halten: 900 }, { pose: "ansprechen", dauer: 1600, halten: 1400 }],
      hilfen: { ohneSchlaeger: true, rueckenStab: true } },
    hinten("ansprechen", { ohneSchlaeger: true, rueckenStab: true }),
  ],
  "Hüfte bis Hüfte": [
    vorne([{ pose: "ansprechen", dauer: 0, halten: 600 }, { pose: "halbRueck", dauer: 1100, halten: 900 }], { ball: true, hueftlinie: true }),
    vorne([{ pose: "halbRueck", dauer: 0, halten: 600 }, { pose: "treff", dauer: 600 }, { pose: "halbDurch", dauer: 500, halten: 900 }], { ball: true, hueftlinie: true }),
    still("halbDurch", { arme: true }),
  ],
  // Die Drehung zeigt zur Kamera hin – als flache Zeichnung würde sie täuschen.
  "Schläger vor der Brust": [
    still("ansprechen", { ohneSchlaeger: true, brustStab: true }),
    null,
    null,
    vorne(halbeSchwuenge, { ball: true }),
  ],
  "Griffende zum Bauchnabel": [
    still("ansprechen", { nabelGriff: true, ball: true }),
    vorne([{ pose: "ansprechen", dauer: 0, halten: 700 }, { pose: "halbRueck", dauer: 1300, halten: 900 }], { nabelGriff: true, ball: true }),
    still("halbRueck", { nabelGriff: true, ball: true }),
  ],
  "Hand hängen lassen": [
    still("ansprechen", { ball: true }),
    vorne([{ pose: HAND_HAENGT }], { ball: true, schulterlinie: true }),
    still("ansprechen", { ball: true, schulterlinie: true }),
  ],
  "Spiegel-Check": [
    still("ansprechen", { spiegel: true }),
    vorne([{ pose: "ansprechen", dauer: 0, halten: 700 }, { pose: "halbRueck", dauer: 800 }, { pose: "top", dauer: 800, halten: 1300 }], { spiegel: true }),
    still("top", { spiegel: true, wirbelsaeule: true }),
  ],
  "Treffposition in Zeitlupe": [
    vorne([{ pose: "top", dauer: 0, halten: 800 }, { pose: "abschwung", dauer: 1800 }, { pose: "treff", dauer: 1000, halten: 1300 }], { ball: true }),
    still("treff", { spiegel: true, ball: true }),
    still("treff", { ball: true, balllinie: true, schulterlinie: true }),
    vorne(ganzerSchwung, { ball: true }),
  ],
  "Stab-Übung": [
    still("ansprechen", { stab: true }),
    vorne([{ pose: "ansprechen", dauer: 0, halten: 700 }, { pose: "halbRueck", dauer: 900 }, { pose: "top", dauer: 900, halten: 1000 }], { stab: true }),
    vorne(halbeSchwuenge, { stab: true }),
  ],
  // Tour Tempo 3 : 1 – Start auf "und", oben ohne Pause
  "Mitzählen": [
    vorne([{ pose: "ansprechen", dauer: 0, halten: 1200, text: "Bereit – los geht es auf „und“" }]),
    { ...vorne(zaehlSchwung()), takt: true },
    { ...vorne(zaehlSchwung(), { ball: true }), takt: true },
  ],
  "Pendel": [
    vorne([{ pose: "ansprechen", dauer: 0, halten: 500 }, { pose: "halbRueck", dauer: 550 }, { pose: "top", dauer: 550 },
           { pose: "abschwung", dauer: 230 }, { pose: "treff", dauer: 110 }, { pose: "halbDurch", dauer: 160 }, { pose: "finish", dauer: 450, halten: 1200 }]),
    vorne(ganzerSchwung, { ball: true }),
  ],
  "Später hochschauen": [
    vorne(halbeSchwuenge, { ball: true }),
    still("treff", { ball: true, hinteresKnie: true }),
    vorne(halbeSchwuenge, { ball: true }),
  ],
  "Höhe halten": [
    still("ansprechen", { ball: true }),
    vorne(halbeSchwuenge, { ball: true }),
  ],
  "Tee-Blick": [
    still("ansprechen", { ball: true, tee: true }),
    vorne(halbeSchwuenge, { ball: true, tee: true }),
    vorne(halbeSchwuenge, { ball: true, tee: true }),
  ],
  "Enges Fass": [
    still("ansprechen", { fass: true }),
    vorne([{ pose: "ansprechen", dauer: 0, halten: 700 }, { pose: "halbRueck", dauer: 800 }, { pose: "top", dauer: 800, halten: 1200 }], { fass: true }),
  ],
  "Finish 3 Sekunden": [
    vorne(ganzerSchwung, { ball: true }),
    still("finish", { hinteresKnie: true }),
    still("finish"),
  ],
  // Von hinten: nur die Ausgangsstellung als Bild, die Drehung als Text
  "Po an die Wand": [
    hinten("ansprechen", { ohneSchlaeger: true, armeGekreuzt: true, wand: true }),
    null,
    null,
    null,
  ],
  "Golftasche hinter dem Po": [
    hinten("ansprechen", { tasche: true }),
    null,
    null,
    null,
  ],
};
export const UEBUNGEN_MIT_BILDERN = Object.keys(BILDER);

// Mitzählen: "und" am Ball, "eins – zwei – drei" bis oben, "vier" = Treffen (3 : 1)
function zaehlSchwung() {
  const zaehlzeit = 350; // ms pro Zählzeit – Rückschwung 3 × 350 ms, Abschwung 350 ms
  return [
    { pose: "ansprechen", dauer: 0, halten: 800 },
    { pose: "halbRueck", dauer: zaehlzeit * 1.5 },
    { pose: "top", dauer: zaehlzeit * 1.5 },
    { pose: "abschwung", dauer: zaehlzeit * 0.6 },
    { pose: "treff", dauer: zaehlzeit * 0.4 },
    { pose: "halbDurch", dauer: 160 },
    { pose: "finish", dauer: 450, halten: 1400 },
  ];
}
// Zählzeiten (ms seit Beginn): Start auf "und", auf "drei" oben, auf "vier" getroffen
const ZAEHLZEIT = 350;
const TAKT = [
  { ab: 0, text: "" },
  { ab: 800, text: "und" },
  { ab: 800 + ZAEHLZEIT, text: "eins" },
  { ab: 800 + 2 * ZAEHLZEIT, text: "zwei" },
  { ab: 800 + 3 * ZAEHLZEIT, text: "drei (oben)" },
  { ab: 800 + 4 * ZAEHLZEIT, text: "vier – getroffen!" },
];
function taktZurZeit(ms) {
  return TAKT.filter((t) => t.ab <= ms).at(-1).text;
}

export function bildZuSchritt(uebungName, schritt) {
  return BILDER[uebungName]?.[schritt] ?? null;
}

// ---------------------------------------------------------------
// Zeitpunkt → Pose (weich zwischen den Posen überblenden)
// ---------------------------------------------------------------
const posenQuelle = (ansicht) => (ansicht === "hinten" ? HINTEN : POSEN);

export function gesamtDauer(bild) {
  return bild.folge.reduce((summe, f) => summe + (f.dauer || 0) + (f.halten || 0), 0);
}

export function poseZurZeit(bild, ms) {
  const quelle = posenQuelle(bild.ansicht);
  const folge = bild.folge.map((f) => ({ ...f, pose: typeof f.pose === "string" ? quelle[f.pose] : f.pose }));
  if (folge.length === 1) return { pose: folge[0].pose, text: folge[0].text || "" };
  const gesamt = gesamtDauer(bild);
  let zeit = ((ms % gesamt) + gesamt) % gesamt;
  if (bild.takt) return { pose: poseZurZeit({ ...bild, takt: false }, zeit).pose, text: taktZurZeit(zeit) };
  let text = "";
  const weich = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  for (let i = 0; i < folge.length; i++) {
    const f = folge[i];
    const vorher = folge[(i - 1 + folge.length) % folge.length];
    const dauer = f.dauer || 0, halten = f.halten || 0;
    if (zeit < dauer) return { pose: mische(vorher.pose, f.pose, weich(zeit / dauer)), text: f.text ?? text };
    zeit -= dauer;
    if (f.text !== undefined) text = f.text;
    if (zeit < halten) return { pose: f.pose, text };
    zeit -= halten;
  }
  const letzte = folge[folge.length - 1];
  return { pose: letzte.pose, text };
}

// Zwei Posen mischen (t = 0 → a, t = 1 → b). Der Schlägerwinkel w wird als Zahl gemischt.
function mische(a, b, t) {
  const neu = {};
  for (const k of Object.keys(a)) {
    if (!(k in b)) { neu[k] = a[k]; continue; }
    neu[k] = k === "w" ? a.w + (b.w - a.w) * t : [a[k][0] + (b[k][0] - a[k][0]) * t, a[k][1] + (b[k][1] - a[k][1]) * t];
  }
  return neu;
}

// ---------------------------------------------------------------
// Pose + Hilfen → Linien, Kreise, Rechtecke, Texte
// ---------------------------------------------------------------
const FARBE = { koerper: "#cfe3d6", schlaeger: "#94a3b8", gelb: "#facc15", holz: "#c08a5a", spiegel: "#7dd3fc", boden: "#2c5a43" };

export function zeichnung(bild, ms = 0, rechtshaender = true) {
  const { pose, text } = poseZurZeit(bild, ms);
  const h = bild.hilfen || {};
  const e = [];
  const linie = (von, bis, farbe = FARBE.koerper, breite = 3.5, gestrichelt = false) => e.push({ art: "linie", von, bis, farbe, breite, gestrichelt });
  const kreis = (mitte, radius, farbe = FARBE.koerper, breite = 3.5, fuellen = false) => e.push({ art: "kreis", mitte, radius, farbe, breite, fuellen });
  const rechteck = (x, y, breite, hoehe, farbe) => e.push({ art: "rechteck", x, y, breite, hoehe, farbe });
  // Texte werden mittig um "bei" gesetzt – so passen sie auch gespiegelt (Linkshänder)
  const beschriftung = (bei, inhalt, farbe = FARBE.gelb) => e.push({ art: "text", bei, inhalt, farbe });

  let ausschnitt;
  if (bild.ansicht === "hinten") {
    ausschnitt = { x: 30, y: -12, breite: 200, hoehe: 232 };
    zeichneHinten(pose, h, { linie, kreis, rechteck, beschriftung });
  } else {
    ausschnitt = { x: -40, y: -40, breite: 290, hoehe: 258 };
    zeichneVorne(pose, h, { linie, kreis, rechteck, beschriftung });
  }
  // Linkshänder: alles spiegeln (Mitte bei x = 100)
  if (!rechtshaender) {
    const sp = ([x, y]) => [200 - x, y];
    for (const el of e) {
      if (el.von) { el.von = sp(el.von); el.bis = sp(el.bis); }
      if (el.mitte) el.mitte = sp(el.mitte);
      if (el.bei) el.bei = sp(el.bei);
      if (el.art === "rechteck") el.x = 200 - el.x - el.breite;
    }
    ausschnitt = { ...ausschnitt, x: 200 - ausschnitt.x - ausschnitt.breite };
  }
  return { ausschnitt, elemente: e, text };
}

function zeichneVorne(p, h, { linie, kreis, rechteck, beschriftung }) {
  // Hilfsmittel HINTER der Figur
  if (h.spiegel) rechteck(40, -30, 130, 245, FARBE.spiegel);
  if (h.fass) rechteck(64, 28, 74, 184, FARBE.holz);
  // Stab senkrecht direkt außen neben dem rechten Fuß, bis Hüfthöhe (der Fuß steht weiter
  // außen als die Hüfte – ein Stab direkt an der Hüfte stünde im Fuß)
  if (h.stab) linie([STAB_X, 92], [STAB_X, 211], FARBE.holz, 5);
  linie([-40, 211], [250, 211], FARBE.boden, 2);

  // Schläger
  if (!h.ohneSchlaeger) {
    const rad = (p.w * Math.PI) / 180;
    if (h.nabelGriff) {
      // Griffende am Bauchnabel, Hände tiefer am Schaft
      const n = nabel(p);
      const kopf = [n[0] + 125 * Math.cos(rad), n[1] + 125 * Math.sin(rad)]; // ganzer Schläger: Nabel bis Boden
      linie(n, kopf, FARBE.schlaeger, 2.5);
      p = { ...p, hand: [n[0] + 26 * Math.cos(rad), n[1] + 26 * Math.sin(rad)] };
      kreis(n, 3, FARBE.gelb, 2, true);
    } else {
      linie(p.hand, [p.hand[0] + SCHLAEGER * Math.cos(rad), p.hand[1] + SCHLAEGER * Math.sin(rad)], FARBE.schlaeger, 2.5);
    }
  }
  if (h.brustStab) linie([p.sh[0] - 14, p.sh[1] + 6], [p.sv[0] + 14, p.sv[1] + 4], FARBE.schlaeger, 2.5);

  // Körper
  const hand = p.hand;
  const handH = p.handH || hand; // rechte Hand darf auch frei hängen
  const armGelb = h.arme ? FARBE.gelb : FARBE.koerper;
  const armBreite = h.arme ? 5 : 3.5;
  linie(p.sh, p.sv); linie(p.sh, p.hh); linie(p.sv, p.hv); linie(p.hh, p.hv);
  linie(p.hv, p.kv); linie(p.kv, p.fv);
  const knieFarbe = h.hinteresKnie ? FARBE.gelb : FARBE.koerper;
  const knieBreite = h.hinteresKnie ? 5 : 3.5;
  linie(p.hh, p.kh, knieFarbe, knieBreite); linie(p.kh, p.fh, knieFarbe, knieBreite);
  linie(p.sv, p.ev, armGelb, armBreite); linie(p.ev, hand, armGelb, armBreite);
  linie(p.sh, p.eh, armGelb, armBreite); linie(p.eh, handH, armGelb, armBreite);
  kreis(p.kopf, 11);

  // Hilfsmittel und Hilfslinien VOR der Figur
  if (h.ball) kreis(BALL, 4.5, "#ffffff", 1, true);
  if (h.tee) { linie([88, 211], [88, 203], "#ffffff", 2); kreis([88, 202], 2, "#ffffff", 1, true); }
  if (h.hueftlinie) { linie([-35, 102], [245, 102], FARBE.gelb, 2.5, true); beschriftung([215, 96], "Hüfthöhe"); }
  if (h.schulterlinie) linie([p.sh[0] - 12, p.sh[1] + 2.5], [p.sv[0] + 12, p.sv[1] - 2.5], FARBE.gelb, 3, true);
  if (h.balllinie) { linie([BALL[0], 200], [BALL[0], -30], FARBE.gelb, 2.5, true); beschriftung([BALL[0] + 18, -24], "Ball"); }
  if (h.wirbelsaeule) {
    const huefte = [(p.hv[0] + p.hh[0]) / 2, (p.hv[1] + p.hh[1]) / 2];
    const schultern = [(p.sv[0] + p.sh[0]) / 2, (p.sv[1] + p.sh[1]) / 2];
    linie(huefte, schultern, FARBE.gelb, 4);
  }
}

function zeichneHinten(p, h, { linie, kreis, rechteck }) {
  if (h.wand) rechteck(70, 30, 10, 182, FARBE.spiegel); // Wand direkt hinter dem Po
  if (h.tasche) rechteck(66, 104, 18, 104, FARBE.holz); // Golftasche hinter dem Po
  linie([30, 211], [230, 211], FARBE.boden, 2);

  if (!h.ohneSchlaeger) linie(p.hand, HINTEN_SCHLAEGERKOPF, FARBE.schlaeger, 2.5);
  // Körper (eine Seite)
  linie(p.schulter, p.huefte); linie(p.huefte, p.knie); linie(p.knie, p.knoechel); linie(p.knoechel, p.zeh);
  if (h.armeGekreuzt) {
    // Arme vor der Brust gekreuzt: Ellbogen vorne, Hände an der Brust
    const brust = [p.schulter[0] + 4, p.schulter[1] + 16];
    linie(p.schulter, [p.schulter[0] + 16, p.schulter[1] + 20]); linie([p.schulter[0] + 16, p.schulter[1] + 20], brust);
  } else {
    linie(p.schulter, p.ellbogen); linie(p.ellbogen, p.hand);
  }
  // Hals: von der Schulter bis zum Kopfrand (von hinten hängt der Kopf vor dem Körper)
  const zumKopf = [p.kopf[0] - p.schulter[0], p.kopf[1] - p.schulter[1]];
  const abstandKopf = Math.hypot(...zumKopf);
  linie(p.schulter, [p.kopf[0] - (zumKopf[0] / abstandKopf) * 11, p.kopf[1] - (zumKopf[1] / abstandKopf) * 11]);
  kreis(p.kopf, 11);
  // Berührungspunkt Po – Wand bzw. Tasche
  if (h.wand || h.tasche) kreis([h.wand ? 80 : 84, p.huefte[1] + 2], 3.5, FARBE.gelb, 2, true);

  if (h.lot) linie([p.schulter[0], p.schulter[1]], [p.schulter[0], p.hand[1] + 6], FARBE.gelb, 2.5, true); // Arme hängen senkrecht
  if (h.faust) {
    // Faust zwischen Griffende und Oberschenkel
    const griffende = [p.hand[0] - 3, p.hand[1] - 5];
    const t = (griffende[1] - p.huefte[1]) / (p.knie[1] - p.huefte[1]);
    const schenkel = [p.huefte[0] + (p.knie[0] - p.huefte[0]) * t, griffende[1]];
    kreis([(griffende[0] + schenkel[0]) / 2 + 1, griffende[1]], 8, FARBE.gelb, 3);
  }
  if (h.rueckenStab) {
    // Schläger längs am Rücken: berührt Steißbein, Schulterblätter und Hinterkopf.
    // "zurueck" steht senkrecht auf der Wirbelsäule und zeigt zum Rücken (links im Bild).
    const dx = p.schulter[0] - p.huefte[0], dy = p.schulter[1] - p.huefte[1];
    const l = Math.hypot(dx, dy);
    const zurueck = [dy / l, -dx / l];
    const steiss = [p.huefte[0] + zurueck[0] * 9, p.huefte[1] + zurueck[1] * 9];
    const hinterkopf = [p.kopf[0] + zurueck[0] * 11, p.kopf[1] + zurueck[1] * 11];
    const auf = (t) => [steiss[0] + (hinterkopf[0] - steiss[0]) * t, steiss[1] + (hinterkopf[1] - steiss[1]) * t];
    linie(auf(-0.12), auf(1.12), FARBE.schlaeger, 3);
    for (const t of [0, 0.62, 1]) kreis(auf(t), 3, FARBE.gelb, 2, true);
  }
}
