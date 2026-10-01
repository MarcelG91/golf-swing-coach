// ===============================================================
// Schaubilder für die Wissensseite (Plan: docs/plan-wissensseite.md, Abschnitt „Bilder“)
//
// Schematische, beschriftete Zeichnungen: Sie zeigen Prinzipien, keine Körperhaltung.
// Für Körperhaltungen gibt es FIGUREN – die kommen aus uebungsbilder.js (echte Profi-Posen).
//
// Reine Rechenlogik ohne Browser-Code (tests/wissen.test.mjs). app.js zeichnet die
// Elemente als SVG. Farben sind NAMEN von Variablen aus style.css (z. B. "akzent" →
// var(--akzent)), damit die Bilder hell und dunkel passen. Der Test prüft, dass es
// jede Variable in beiden Farbsätzen gibt.
//
//   gibtBild(name)   → true, wenn es das Bild gibt (Schaubild oder Figur)
//   schaubild(name, hervor) → { ausschnitt, elemente } oder null (hervor: nur bei neunFlugkurven)
//   ballflugBild(start, kurve) → ein einzelner Ballflug von oben (für den Ballflug-Helfer)
//   FIGUREN[name]    → Bildbeschreibung für zeichnung() aus uebungsbilder.js
//
// Elemente (Koordinaten in Bildpunkten, y wächst nach unten):
//   linie   { von, bis, farbe, breite, gestrichelt }
//   kreis   { mitte, radius, farbe, breite, fuellung }      fuellung = Farbname oder null
//   rechteck{ x, y, breite, hoehe, farbe, fuellung, rundung, strich }  breite = Breite des Rechtecks,
//                                                               strich = Strichstärke
//   pfad    { punkte, farbe, breite, gestrichelt, fuellung } Linienzug (fuellung → geschlossen)
//   text    { bei, inhalt, farbe, groesse, anker, fett }    anker: "middle" | "start" | "end"
// ===============================================================

import { BALLFLUG_NAMEN } from "./wissen.js";

// Weg zu einer Pose ohne Beschriftung, dann Pause MIT Beschriftung – so steht „P6 · Schaft
// waagerecht“ nur da, wenn der Schaft auch wirklich waagerecht ist (nicht schon unterwegs)
const halt = (pose, dauer, halten, text) => [{ pose, dauer, text: "" }, { pose, dauer: 0, halten, text }];

// ---------------------------------------------------------------
// Figuren aus echten Posen (uebungsbilder.js). Von hinten gibt es nur die geprüfte
// Ansprechhaltung als Standbild (siehe Kommentar oben in uebungsbilder.js).
// lot = gestrichelte Linie: Arme hängen senkrecht unter der Schulter.
// ---------------------------------------------------------------
export const FIGUREN = {
  ansprechenHinten: { ansicht: "hinten", folge: [{ pose: "ansprechen" }], hilfen: { lot: true } },
  // Profi-Schwung von vorn, langsam mit Pausen. Der Schläger ist nach den Lehrbuch-Positionen
  // eingezeichnet (uebungsbilder.js): halbRueck = P2, abschwung = P6, halbDurch = P8 (Schaft waagerecht).
  // text = Beschriftung unter der Figur, nur während sie in der Position anhält
  schwungPhasen: {
    ansicht: "vorne",
    hilfen: { ball: true },
    folge: [
      { pose: "ansprechen", dauer: 0, halten: 1200, text: "P1 · Ansprechen" },
      ...halt("halbRueck", 900, 1000, "P2 · Schaft waagerecht"),
      ...halt("top", 800, 1100, "P4 · Top"),
      ...halt("abschwung", 600, 1000, "P6 · Schaft waagerecht"),
      ...halt("treff", 400, 1100, "P7 · Treffmoment"),
      ...halt("halbDurch", 400, 1000, "P8 · Schaft waagerecht"),
      ...halt("finish", 700, 1800, "P10 · Finish"),
    ],
  },
  // Probeschwünge beim Aufwärmen: erst halb, dann voll (Beschriftung passt die ganze Zeit)
  probeschwung: {
    ansicht: "vorne",
    hilfen: {},
    folge: [
      { pose: "ansprechen", dauer: 0, halten: 800, text: "halber Probeschwung" },
      { pose: "halbRueck", dauer: 900, halten: 200, text: "halber Probeschwung" },
      { pose: "treff", dauer: 500, text: "halber Probeschwung" },
      { pose: "halbDurch", dauer: 450, halten: 700, text: "halber Probeschwung" },
      // dauer 0: neu ansprechen statt rückwärts zurückschwingen (das wäre keine echte Bewegung)
      { pose: "ansprechen", dauer: 0, halten: 900, text: "voller Probeschwung" },
      { pose: "halbRueck", dauer: 600, text: "voller Probeschwung" },
      { pose: "top", dauer: 600, halten: 150, text: "voller Probeschwung" },
      { pose: "abschwung", dauer: 230, text: "voller Probeschwung" },
      { pose: "treff", dauer: 110, text: "voller Probeschwung" },
      { pose: "halbDurch", dauer: 160, text: "voller Probeschwung" },
      { pose: "finish", dauer: 450, halten: 1400, text: "voller Probeschwung" },
    ],
  },
  topProfi: { ansicht: "vorne", folge: [{ pose: "top" }], hilfen: { ball: true } },
  treffProfi: { ansicht: "vorne", folge: [{ pose: "treff" }], hilfen: { ball: true } },
  finishProfi: { ansicht: "vorne", folge: [{ pose: "finish" }], hilfen: {} },
};

// Kleine Bausteine, damit die Bilder unten kurz bleiben
function baukasten() {
  const e = [];
  return {
    elemente: e,
    linie: (von, bis, farbe = "text", breite = 2, gestrichelt = false) => e.push({ art: "linie", von, bis, farbe, breite, gestrichelt }),
    kreis: (mitte, radius, farbe = "text", breite = 2, fuellung = null) => e.push({ art: "kreis", mitte, radius, farbe, breite, fuellung }),
    rechteck: (x, y, breite, hoehe, farbe = "text", fuellung = null, rundung = 3, strich = 1.5) => e.push({ art: "rechteck", x, y, breite, hoehe, farbe, fuellung, rundung, strich }),
    pfad: (punkte, farbe = "text", breite = 2, gestrichelt = false, fuellung = null) => e.push({ art: "pfad", punkte, farbe, breite, gestrichelt, fuellung }),
    text: (bei, inhalt, { farbe = "text", groesse = 11, anker = "middle", fett = false } = {}) => e.push({ art: "text", bei, inhalt, farbe, groesse, anker, fett }),
  };
}

// Pfeilspitze am Ende der Strecke von → bis (zwei kurze Linien)
function pfeilspitze(b, von, bis, farbe, laenge = 8) {
  const w = Math.atan2(bis[1] - von[1], bis[0] - von[0]);
  for (const seite of [-0.45, 0.45]) {
    b.linie(bis, [bis[0] - laenge * Math.cos(w + seite), bis[1] - laenge * Math.sin(w + seite)], farbe, 2);
  }
}

// Wurfparabel von start bis ende mit dem höchsten Punkt "hoehe" über der Verbindungslinie
function bogen(start, ende, hoehe, schritte = 24) {
  const punkte = [];
  for (let i = 0; i <= schritte; i++) {
    const t = i / schritte;
    punkte.push([start[0] + (ende[0] - start[0]) * t, start[1] + (ende[1] - start[1]) * t - 4 * hoehe * t * (1 - t)]);
  }
  return punkte;
}

// Weiche Kurve durch Stützpunkte (Catmull-Rom), als Linienzug
function glatt(stuetzen, schritte = 10) {
  const punkte = [];
  for (let i = 0; i < stuetzen.length - 1; i++) {
    const p0 = stuetzen[Math.max(i - 1, 0)], p1 = stuetzen[i], p2 = stuetzen[i + 1], p3 = stuetzen[Math.min(i + 2, stuetzen.length - 1)];
    for (let s = 0; s < schritte; s++) {
      const t = s / schritte, t2 = t * t, t3 = t2 * t;
      const k = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      punkte.push([k(p0[0], p1[0], p2[0], p3[0]), k(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  punkte.push(stuetzen[stuetzen.length - 1]);
  return punkte;
}

// Ellipse als geschlossener Linienzug (für Grüns, Fairways, Streuung)
function ellipse([mx, my], rx, ry, schritte = 36) {
  const punkte = [];
  for (let i = 0; i < schritte; i++) {
    const w = (i / schritte) * 2 * Math.PI;
    punkte.push([mx + rx * Math.cos(w), my + ry * Math.sin(w)]);
  }
  return punkte;
}

// Fahne am Loch: Stange ab "boden" nach oben, Wimpel in Akzentfarbe
function fahne(b, [x, boden], hoehe = 40) {
  b.linie([x, boden], [x, boden - hoehe], "text", 2);
  b.pfad([[x, boden - hoehe], [x + 18, boden - hoehe + 7], [x, boden - hoehe + 14]], "akzent", 1.5, false, "akzent");
}

// ---------------------------------------------------------------
// Die Schaubilder
// ---------------------------------------------------------------
const SCHAUBILDER = {
  // Lektion „Wie lernt man Golf?“: der übliche Weg bis zum Handicap
  weg() {
    const b = baukasten();
    b.pfad(glatt([[14, 170], [60, 160], [120, 140], [185, 104], [240, 72], [288, 50]]), "rand", 7);
    const stationen = [
      { bei: [52, 162], name: "Schnupperkurs", text: [52, 188] },
      { bei: [120, 140], name: "Platzreifekurs", text: [120, 166] },
      { bei: [188, 102], name: "Spielrecht", text: [188, 128] },
      { bei: [246, 69], name: "Handicap", text: [232, 98] },
    ];
    stationen.forEach((s, i) => {
      b.kreis(s.bei, 10, "akzent", 2, "flaeche");
      b.text([s.bei[0], s.bei[1] + 4], String(i + 1), { farbe: "akzent", groesse: 11, fett: true });
      b.text(s.text, s.name, { groesse: 11 });
    });
    fahne(b, [290, 50]);
    b.text([96, 40], "Erst kurzes Spiel,", { farbe: "text-leise" });
    b.text([96, 55], "dann Eisen", { farbe: "text-leise" });
    return { ausschnitt: { x: 0, y: 0, breite: 320, hoehe: 196 }, elemente: b.elemente };
  },

  // Lektion „Die Schläger“: drei Schlagflächen mit ungefährem Loft und Abflugrichtung
  loftFaecher() {
    const b = baukasten();
    const schlaeger = [
      { name: "Driver", loft: 10, farbe: "akzent" },
      { name: "7er-Eisen", loft: 34, farbe: "info" },
      { name: "Sand Wedge", loft: 56, farbe: "gut" },
    ];
    schlaeger.forEach((s, i) => {
      const x0 = 12 + i * 104; // jede Spalte 104 breit
      const fuss = [x0 + 34, 150];
      const rad = (s.loft * Math.PI) / 180;
      b.linie([x0, 150], [x0 + 96, 150], "rand", 2); // Boden
      b.linie(fuss, [fuss[0], 92], "text-leise", 1, true); // senkrecht zum Vergleich
      b.linie(fuss, [fuss[0] - 56 * Math.sin(rad), 150 - 56 * Math.cos(rad)], s.farbe, 5); // Schlagfläche
      const ball = [fuss[0] + 10, 145];
      // Abflug: flacher als der Loft (schematisch), höherer Loft → steiler
      const abflug = (s.loft * 0.8 * Math.PI) / 180;
      const spitze = [ball[0] + 50 * Math.cos(abflug), ball[1] - 50 * Math.sin(abflug)];
      b.linie(ball, spitze, s.farbe, 2, true);
      pfeilspitze(b, ball, spitze, s.farbe);
      b.kreis(ball, 5, "text", 1.5, "flaeche");
      b.text([x0 + 48, 168], s.name, { fett: true });
      b.text([x0 + 48, 183], `ca. ${s.loft}° Loft`, { farbe: "text-leise" });
    });
    return { ausschnitt: { x: 0, y: 80, breite: 324, hoehe: 110 }, elemente: b.elemente };
  },

  // Lektion „Der Griff“: stark vereinfacht, Blick von oben (so auch beschriftet)
  griff() {
    const b = baukasten();
    b.rechteck(150, 6, 20, 176, "rand", "flaeche-innen", 6); // Griff des Schlägers
    // Linke Hand (oben) mit zwei sichtbaren Knöcheln
    b.rechteck(122, 36, 64, 52, "text", "flaeche", 14);
    for (const x of [136, 154]) b.kreis([x, 42], 5, "akzent", 2, "akzent");
    b.linie([128, 42], [84, 34], "akzent", 1.5);
    b.text([80, 30], "2 Knöchel sichtbar", { farbe: "akzent", anker: "end" });
    // Rechte Hand (darunter) mit dem V aus Daumen und Zeigefinger
    b.rechteck(126, 96, 58, 50, "text", "flaeche", 14);
    b.pfad([[150, 132], [166, 110], [178, 130]], "akzent", 3);
    // Das V zeigt zur rechten Schulter (vom Spieler aus gesehen: rechts oben)
    b.linie([166, 110], [246, 58], "akzent", 2, true);
    pfeilspitze(b, [166, 110], [246, 58], "akzent");
    b.text([252, 44], "V zeigt zur", { farbe: "akzent", anker: "start" });
    b.text([252, 58], "rechten Schulter", { farbe: "akzent", anker: "start" });
    b.text([64, 120], "linke Hand oben,", { farbe: "text-leise", anker: "end" });
    b.text([64, 134], "rechte darunter", { farbe: "text-leise", anker: "end" });
    b.text([160, 196], "vereinfachte Skizze · Blick von oben · Rechtshänder", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: -30, y: 0, breite: 380, hoehe: 204 }, elemente: b.elemente };
  },

  // Lektion „Ausrichtung“: Eisenbahnschienen von oben
  schienen() {
    const b = baukasten();
    for (let x = 24; x <= 266; x += 22) b.linie([x, 40], [x, 108], "rand", 3); // Schwellen
    b.linie([14, 48], [290, 48], "akzent", 3); // äußere Schiene: Ball → Ziel
    b.linie([14, 100], [262, 100], "text", 3); // innere Schiene: Körper
    b.kreis([74, 48], 5, "text", 1.5, "flaeche");
    fahne(b, [292, 48], 36);
    b.text([150, 30], "Ball und Ziel", { farbe: "akzent", fett: true });
    // Füße an der inneren Schiene (Spieler steht unterhalb, Ziel = rechts)
    b.rechteck(52, 104, 14, 28, "text", "flaeche-innen", 6);
    b.rechteck(88, 104, 14, 28, "text", "flaeche-innen", 6);
    b.linie([200, 100], [262, 100], "text", 3);
    pfeilspitze(b, [200, 100], [262, 100], "text");
    b.text([190, 122], "Füße, Hüfte, Schultern", { fett: true });
    b.text([190, 137], "parallel links vom Ziel", { farbe: "text-leise" });
    return { ausschnitt: { x: 0, y: 0, breite: 320, hoehe: 146 }, elemente: b.elemente };
  },

  // Lektion „Erster Putt“: Schultern und Arme bilden ein Dreieck, das wie ein Pendel schwingt
  pendel() {
    const b = baukasten();
    const drehpunkt = [160, 40];
    const dreieck = (winkel) => {
      const r = (winkel * Math.PI) / 180;
      const dreh = ([x, y]) => {
        const dx = x - drehpunkt[0], dy = y - drehpunkt[1];
        return [drehpunkt[0] + dx * Math.cos(r) - dy * Math.sin(r), drehpunkt[1] + dx * Math.sin(r) + dy * Math.cos(r)];
      };
      return { sl: dreh([132, 40]), sr: dreh([188, 40]), hand: dreh([160, 104]), kopf: dreh([160, 156]) };
    };
    // Zurück und vor: nur der Putter gestrichelt – so bleibt das Bild ruhig
    for (const w of [-16, 16]) {
      const d = dreieck(w);
      b.linie(d.hand, d.kopf, "text-leise", 1.5, true);
    }
    // Bogen des Putterkopfs mit Pfeilen an beiden Enden
    const bahn = [];
    for (let w = -20; w <= 20; w += 2) {
      const r = (w * Math.PI) / 180;
      bahn.push([drehpunkt[0] - 116 * Math.sin(r), drehpunkt[1] + 116 * Math.cos(r)]);
    }
    b.pfad(bahn, "akzent", 2, true);
    pfeilspitze(b, bahn[1], bahn[0], "akzent");
    pfeilspitze(b, bahn[bahn.length - 2], bahn[bahn.length - 1], "akzent");
    // Mitte: durchgezogen
    const d = dreieck(0);
    b.pfad([d.sl, d.sr, d.hand, d.sl], "text", 3);
    b.linie(d.hand, d.kopf, "text", 3);
    b.linie([d.kopf[0] - 9, d.kopf[1]], [d.kopf[0] + 9, d.kopf[1]], "text", 5); // Putterkopf
    b.kreis([176, 153], 5, "text", 1.5, "flaeche");
    b.linie([90, 159], [230, 159], "rand", 2);
    b.kreis(drehpunkt, 3, "akzent", 1, "akzent");
    b.text([160, 24], "Die Schultern bewegen den Putter", { fett: true });
    b.text([196, 96], "Handgelenke ruhig", { farbe: "text-leise", anker: "start" });
    b.text([160, 180], "gleicher Rhythmus – längerer Rückschwung für längere Putts", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 8, breite: 320, hoehe: 180 }, elemente: b.elemente };
  },

  // Lektion „Erster Chip“: Chip (kurz fliegen, lang rollen) und Pitch (lang fliegen, kurz rollen)
  flugRollen() {
    const b = baukasten();
    b.linie([10, 120], [150, 120], "rand", 3); // Vorgrün
    b.rechteck(150, 117, 160, 6, "gut", "gut", 3); // Grün
    b.text([306, 140], "Grün", { farbe: "text-leise", anker: "end" });
    b.kreis([30, 115], 4.5, "text", 1.5, "flaeche");
    fahne(b, [282, 118], 44);
    // Pitch: hoher Bogen, kurzes Rollen
    b.pfad(bogen([30, 114], [248, 116], 92), "info", 2);
    b.linie([248, 116], [276, 116], "info", 2, true);
    // Chip: flacher Bogen, langes Rollen
    b.pfad(bogen([30, 114], [166, 116], 24), "akzent", 2.5);
    b.linie([166, 116], [276, 116], "akzent", 2.5, true);
    // Legende unter dem Boden, damit keine Beschriftung eine Flugbahn kreuzt
    b.linie([12, 141], [30, 141], "akzent", 3);
    b.text([36, 145], "Chip: wenig Flug, viel Rollen", { farbe: "akzent", fett: true, anker: "start" });
    b.linie([12, 159], [30, 159], "info", 3);
    b.text([36, 163], "Pitch: viel Flug, wenig Rollen", { farbe: "info", fett: true, anker: "start" });
    return { ausschnitt: { x: 0, y: 14, breite: 320, hoehe: 156 }, elemente: b.elemente };
  },

  // Lektion „Platzreife“: die drei Pfahlfarben
  pfahlfarben() {
    const b = baukasten();
    // Drei Zeilen je Pfahl, schmal genug für eine Spalte von ca. 100 Bildpunkten
    const pfaehle = [
      { x: 56, farbe: "pfahl-weiss", farbname: "Weiß", name: "Aus", info: "zurück, +1 Schlag" },
      { x: 160, farbe: "pfahl-gelb", farbname: "Gelb", name: "Penalty Area", info: "Erleichterung +1" },
      { x: 264, farbe: "pfahl-rot", farbname: "Rot", name: "Penalty Area", info: "+1, auch seitlich" },
    ];
    b.linie([10, 118], [310, 118], "rand", 2);
    for (const p of pfaehle) {
      b.rechteck(p.x - 7, 26, 14, 92, "text", p.farbe, 4);
      b.text([p.x, 136], p.farbname, { fett: true });
      b.text([p.x, 151], p.name);
      b.text([p.x, 166], p.info, { farbe: "text-leise", groesse: 10 });
    }
    return { ausschnitt: { x: 0, y: 16, breite: 320, hoehe: 158 }, elemente: b.elemente };
  },

  // ===== Pfad 2: Der Vollschwung =====

  // Lektion „Stand und Ballposition“: Füße von oben, Ballposition je Schläger.
  // Maßstab: Abstand der Fußinnenkanten (108) ≈ schulterbreit, eine Ballbreite ≈ 11.
  ballposition() {
    const b = baukasten();
    b.linie([20, 70], [292, 70], "rand", 1.5, true); // Ziellinie durch die Bälle
    pfeilspitze(b, [262, 70], [292, 70], "text-leise");
    b.text([300, 88], "Ziel", { farbe: "text-leise", anker: "end" });
    // Füße: rechter Fuß links im Bild, linker (zielseitiger) Fuß rechts; Spitzen zeigen zum Ball
    b.rechteck(84, 96, 22, 50, "text", "flaeche", 10);
    b.rechteck(214, 96, 22, 50, "text", "flaeche", 10);
    b.linie([160, 60], [160, 150], "text-leise", 1, true); // Standmitte
    b.text([95, 162], "rechts", { farbe: "text-leise", groesse: 10 });
    b.text([160, 162], "Mitte", { farbe: "text-leise", groesse: 10 });
    b.text([225, 162], "links", { farbe: "text-leise", groesse: 10 });
    const baelle = [
      { x: 160, name: "Wedge", farbe: "gut", schild: 118 },
      { x: 177, name: "7er", farbe: "info", schild: 166 },
      { x: 189, name: "Holz", farbe: "achtung", schild: 214 },
      { x: 216, name: "Driver", farbe: "akzent", schild: 266 },
    ];
    for (const ball of baelle) {
      b.linie([ball.x, 64], [ball.schild, 40], ball.farbe, 1);
      b.kreis([ball.x, 70], 5, ball.farbe, 2, "flaeche");
      b.text([ball.schild, 34], ball.name, { farbe: ball.farbe, fett: true });
    }
    b.text([160, 180], "Blick von oben · Ziel rechts · Rechtshänder", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 18, breite: 320, hoehe: 168 }, elemente: b.elemente };
  },

  // Lektionen „Rückschwung“ und „Treffmoment“: 3D-Messwerte Tourspieler vs. hohe Handicaps
  messwerte() {
    const b = baukasten();
    const massstab = 5; // 1° = 5 Bildpunkte
    b.rechteck(12, 14, 14, 8, "akzent", "akzent", 2);
    b.text([30, 22], "Tourspieler", { anker: "start", groesse: 10 });
    b.rechteck(122, 14, 14, 8, "text-leise", "text-leise", 2);
    b.text([140, 22], "hohes Handicap / Freizeit", { anker: "start", groesse: 10 });
    const zeilen = [
      { name: "Hüftdrehung bei P2", tour: 27.5, tourText: "25–30°", frei: 15, freiText: "höchstens 15°" },
      { name: "Schulterneigung am Top", tour: 36, tourText: "ca. 36°", frei: 30, freiText: "ca. 30°" },
      { name: "Hüfte offen im Treffmoment", tour: 36, tourText: "ca. 36°", frei: 20, freiText: "ca. 20°" },
    ];
    zeilen.forEach((z, i) => {
      const y = 46 + i * 44;
      b.text([12, y], z.name, { anker: "start", fett: true });
      b.rechteck(12, y + 6, z.tour * massstab, 10, "akzent", "akzent", 3);
      b.text([18 + z.tour * massstab, y + 15], z.tourText, { anker: "start", groesse: 10 });
      b.rechteck(12, y + 20, z.frei * massstab, 10, "text-leise", "text-leise", 3);
      b.text([18 + z.frei * massstab, y + 29], z.freiText, { anker: "start", groesse: 10, farbe: "text-leise" });
    });
    b.text([160, 190], "3D-Messungen von GOLFTEC, gerundet", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 6, breite: 320, hoehe: 190 }, elemente: b.elemente };
  },

  // Lektion „Abschwung“: kinematische Kette – vier Glieder erreichen nacheinander ihr Höchsttempo
  kinematischeKette() {
    const b = baukasten();
    const boden = 150, treffmoment = 245;
    b.linie([30, boden], [270, boden], "rand", 1.5);
    b.linie([30, boden], [30, 26], "rand", 1.5);
    pfeilspitze(b, [30, 60], [30, 26], "rand");
    b.text([36, 28], "Tempo", { farbe: "text-leise", anker: "start", groesse: 10 });
    const glieder = [
      { name: "Becken", farbe: "gut", spitze: 95, hoehe: 34, breite: 36 },
      { name: "Brust", farbe: "info", spitze: 140, hoehe: 54, breite: 34 },
      { name: "Arme", farbe: "achtung", spitze: 185, hoehe: 80, breite: 32 },
      { name: "Schläger", farbe: "akzent", spitze: 245, hoehe: 112, breite: 30 },
    ];
    b.linie([treffmoment, boden], [treffmoment, 30], "text-leise", 1, true);
    for (const g of glieder) {
      // Bis zur Spitze eine Glocke. Danach bremst das Glied ab, steht im Treffmoment aber nicht
      // still (TPI) – deshalb fällt die Kurve nur auf einen Restwert (schematisch, nicht gemessen).
      const punkte = [];
      for (let x = 30; x <= treffmoment; x += 5) {
        const glocke = Math.exp(-(((x - g.spitze) / g.breite) ** 2));
        const wert = x > g.spitze ? 0.35 + 0.65 * Math.exp(-(((x - g.spitze) / (g.breite * 1.5)) ** 2)) : glocke;
        punkte.push([x, boden - g.hoehe * wert]);
      }
      b.pfad(punkte, g.farbe, 2.5);
      b.text([g.spitze, boden - g.hoehe - 6], g.name, { farbe: g.farbe, fett: true });
    }
    b.text([30, 164], "Top", { farbe: "text-leise", groesse: 10 });
    b.text([treffmoment, 164], "Treffmoment", { farbe: "text-leise", groesse: 10 });
    b.text([160, 180], "schematisch nach 3D-Messungen (TPI)", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 14, breite: 320, hoehe: 172 }, elemente: b.elemente };
  },

  // Lektion „Finish und Rhythmus“: Zeitbalken 3 : 1 mit Mitzählen
  zeitbalken() {
    const b = baukasten();
    const x0 = 20, einheit = 60; // eine Zählzeit = 60 Bildpunkte
    b.text([160, 28], "3 : 1", { fett: true, groesse: 16 });
    b.rechteck(x0, 62, 3 * einheit, 26, "info", "info", 6);
    b.rechteck(x0 + 3 * einheit + 4, 62, einheit - 4, 26, "akzent", "akzent", 6);
    for (const i of [1, 2]) b.linie([x0 + i * einheit, 62], [x0 + i * einheit, 88], "flaeche-innen", 2); // Zählzeiten
    const zaehlen = ["und", "eins", "zwei", "drei", "vier"];
    zaehlen.forEach((wort, i) => {
      b.linie([x0 + i * einheit, 56], [x0 + i * einheit, 60], "text-leise", 1.5);
      b.text([x0 + i * einheit, 51], wort, { groesse: 10, fett: i >= 3 });
    });
    // Was bei "drei" und "vier" passiert – eigene Zeile, damit nichts überlappt
    b.text([x0 + 3 * einheit, 38], "Top", { groesse: 10, farbe: "info", fett: true });
    b.text([x0 + 4 * einheit, 38], "Treffen", { groesse: 10, farbe: "akzent", fett: true, anker: "end" });
    b.text([x0 + 1.5 * einheit, 106], "Rückschwung", { farbe: "info", fett: true });
    b.text([x0 + 1.5 * einheit, 121], "ca. 0,8 s", { farbe: "text-leise", groesse: 10 });
    b.text([x0 + 3.5 * einheit, 106], "Abschwung", { farbe: "akzent", fett: true });
    b.text([x0 + 3.5 * einheit, 121], "ca. 0,27 s", { farbe: "text-leise", groesse: 10 });
    b.text([160, 146], "Sekunden: Tour Tempo · Verhältnis auch Yale-Messung", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 10, breite: 320, hoehe: 144 }, elemente: b.elemente };
  },

  // Lektion „Driver und Eisen“: Seitenansicht, Eisen leicht abwärts, Driver leicht aufwärts.
  // Schwungbogen = Kreisbogen (Radius 80) um den tiefsten Punkt.
  eintreffwinkel() {
    const b = baukasten();
    const boden = 120, radius = 80;
    const schwungbogen = (tiefX, tiefY, von, bis) => {
      const punkte = [];
      for (let x = von; x <= bis; x += 4) punkte.push([x, tiefY - (radius - Math.sqrt(radius ** 2 - (x - tiefX) ** 2))]);
      return punkte;
    };
    b.linie([160, 24], [160, 158], "rand", 1, true); // Trennlinie zwischen den Bildern
    const bilder = [
      { x0: 0, titel: "Eisen", art: "leicht abwärts", grad: "ca. −3 bis −4°", tiefX: 96, tiefY: 123, ballY: 115, tee: false,
        unten: ["tiefster Punkt nach dem Ball", "erst Ball, dann Boden"] },
      { x0: 162, titel: "Driver", art: "leicht aufwärts", grad: "ca. 0 bis +5°", tiefX: 56, tiefY: 117, ballY: 111, tee: true,
        unten: ["tiefster Punkt vor dem Ball", "Ball auf dem Tee"] },
    ];
    for (const s of bilder) {
      const x = (dx) => s.x0 + dx;
      b.linie([x(10), boden], [x(150), boden], "rand", 2);
      if (!s.tee) b.rechteck(x(86), boden, 26, 5, "rand", "rand", 2); // Divot nach dem Ball
      if (s.tee) b.linie([x(80), boden], [x(80), boden - 4], "text-leise", 2);
      const bahn = schwungbogen(x(s.tiefX), s.tiefY, x(s.tiefX - 60), x(s.tiefX + 52));
      b.pfad(bahn, "akzent", 2.5);
      pfeilspitze(b, bahn[bahn.length - 2], bahn[bahn.length - 1], "akzent");
      b.kreis([x(80), s.ballY], 5, "text", 1.5, "flaeche");
      b.kreis([x(s.tiefX), s.tiefY], 2.5, "akzent", 1, "akzent");
      b.text([x(80), 36], s.titel, { fett: true });
      b.text([x(80), 51], s.art, { farbe: "akzent" });
      b.text([x(80), 65], s.grad, { farbe: "text-leise", groesse: 10 });
      b.text([x(80), 138], s.unten[0], { groesse: 10 });
      b.text([x(80), 152], s.unten[1], { farbe: "text-leise", groesse: 10 });
    }
    b.text([160, 172], "Seitenansicht · Ziel rechts · TrackMan-Richtwerte", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 20, breite: 320, hoehe: 160 }, elemente: b.elemente };
  },

  // ===== Pfad 3: Ballflug verstehen & Fehler beheben (Blick von oben: Ziel oben, Spieler links) =====

  // Lektion „Ballfluggesetze“: Fläche zum Ziel, Bahn von außen → Start fast gerade, Kurve nach rechts
  flaecheBahn() {
    const b = baukasten();
    const ball = [160, 150];
    b.linie(ball, [160, 22], "rand", 1.5, true); // Ziellinie
    b.text([160, 16], "Ziel", { farbe: "text-leise" });
    // Schwungbahn: von außen (unten rechts) nach innen (oben links), als langer Pfeil
    const richtung = [-0.34, -0.94];
    const bahnVon = [ball[0] - 50 * richtung[0], ball[1] - 50 * richtung[1]];
    const bahnBis = [ball[0] + 78 * richtung[0], ball[1] + 78 * richtung[1]];
    b.linie(bahnVon, bahnBis, "info", 3, true);
    pfeilspitze(b, bahnVon, bahnBis, "info");
    // Schlagfläche zeigt zum Ziel (dicker Strich unter dem Ball)
    b.linie([146, 158], [174, 158], "akzent", 5);
    // Ballflug: startet fast in Richtung der Fläche (zum Ziel), kurvt dann nach rechts
    b.pfad(glatt([ball, [161, 112], [166, 78], [180, 50], [198, 30]]), "text", 2.5);
    pfeilspitze(b, [190, 36], [198, 30], "text");
    b.kreis(ball, 5, "text", 1.5, "flaeche");
    b.text([140, 176], "Schlagfläche zeigt", { farbe: "akzent", fett: true, anker: "end" });
    b.text([140, 190], "zum Ziel → Start", { farbe: "akzent", anker: "end" });
    b.text([184, 186], "Schwungbahn", { farbe: "info", fett: true, anker: "start" });
    b.text([184, 200], "von außen nach innen", { farbe: "text-leise", groesse: 10, anker: "start" });
    b.text([210, 62], "Fläche offen", { anker: "start", fett: true });
    b.text([210, 76], "zur Bahn:", { anker: "start" });
    b.text([210, 90], "Kurve nach rechts", { anker: "start" });
    b.text([12, 40], "Blick von oben", { farbe: "text-leise", groesse: 10, anker: "start" });
    return { ausschnitt: { x: 0, y: 4, breite: 320, hoehe: 204 }, elemente: b.elemente };
  },

  // Lektion „Die neun Ballflüge“: 3 × 3 kleine Bilder. Zeilen = Start, Spalten = Kurve.
  // hervor = { start, kurve } hebt ein Bild hervor (Ballflug-Helfer).
  neunFlugkurven(hervor = null) {
    const b = baukasten();
    const richtungen = ["links", "gerade", "rechts"];
    const zahl = { links: -1, gerade: 0, rechts: 1 };
    const spaltenTitel = ["Kurve links", "ohne Kurve", "Kurve rechts"];
    const kurvenFarbe = { links: "info", gerade: "text", rechts: "achtung" };
    const breite = 88, hoehe = 60, x0 = 56, y0 = 24;
    spaltenTitel.forEach((t, i) => b.text([x0 + i * breite + breite / 2, 16], t, { groesse: 10, fett: true }));
    richtungen.forEach((start, zeile) => {
      b.text([28, y0 + zeile * hoehe + 26], "Start", { groesse: 10, farbe: "text-leise" });
      b.text([28, y0 + zeile * hoehe + 39], start, { groesse: 10, fett: true });
      richtungen.forEach((kurve, spalte) => {
        const links = x0 + spalte * breite, oben = y0 + zeile * hoehe;
        const gewaehlt = hervor && hervor.start === start && hervor.kurve === kurve;
        const gedimmt = hervor && !gewaehlt;
        b.rechteck(links + 2, oben + 1, breite - 4, hoehe - 2, gewaehlt ? "akzent" : "rand", gewaehlt ? "flaeche" : null, 6, gewaehlt ? 2 : 1);
        const mitte = links + breite / 2, ballY = oben + 38;
        b.linie([mitte, ballY], [mitte, oben + 6], "rand", 1, true);
        const punkte = [];
        for (let t = 0; t <= 1.001; t += 0.1) punkte.push([mitte + zahl[start] * 12 * t + zahl[kurve] * 14 * t * t, ballY - 30 * t]);
        b.pfad(punkte, gewaehlt ? "akzent" : gedimmt ? "text-leise" : kurvenFarbe[kurve], gewaehlt ? 3 : 2);
        b.kreis([mitte, ballY], 3, "text", 1, "flaeche");
        b.text([mitte, oben + 53], BALLFLUG_NAMEN[start][kurve], {
          groesse: 10, fett: !!gewaehlt, farbe: gewaehlt ? "akzent" : gedimmt ? "text-leise" : "text",
        });
      });
    });
    b.text([160, 212], "Blick von oben · Ziel oben · Rechtshänder", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 2, breite: 320, hoehe: 216 }, elemente: b.elemente };
  },

  // Lektion „Treffpunkt und Gear Effect“: Driver-Schlagfläche von vorn, Schaft an der Ferse
  treffpunktFlaeche() {
    const b = baukasten();
    b.linie([246, 62], [280, 18], "text-leise", 4); // Schaft
    b.rechteck(70, 50, 180, 80, "text", "flaeche", 30);
    for (const y of [74, 90, 106]) b.linie([104, y], [216, y], "rand", 1); // Rillen
    const punkte = [
      { x: 98, name: "Spitze", wirkung: "Draw-Spin", farbe: "info" },
      { x: 160, name: "Mitte", wirkung: "", farbe: "gut" },
      { x: 222, name: "Ferse", wirkung: "Fade-Spin", farbe: "achtung" },
    ];
    for (const p of punkte) {
      b.kreis([p.x, 90], 7, p.farbe, 2, p.farbe);
      b.text([p.x, 148], p.name, { fett: true, farbe: p.farbe });
      if (p.wirkung) b.text([p.x, 38], p.wirkung, { farbe: p.farbe, fett: true });
    }
    b.text([160, 38], "Driver:", { farbe: "text-leise" });
    b.text([160, 170], "Blick von vorn auf die Schlagfläche · Rechtshänder", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 10, breite: 320, hoehe: 168 }, elemente: b.elemente };
  },

  // Lektion „Slice beheben“: Bahn von außen (rot) und von innen (grün), Schachtel außen hinter dem Ball
  bahnVonAussen() {
    const b = baukasten();
    const ball = [150, 120];
    b.linie([150, 196], [150, 26], "rand", 1.5, true);
    pfeilspitze(b, [150, 60], [150, 26], "rand");
    b.text([150, 18], "Ziel", { farbe: "text-leise" });
    // Füße des Spielers (links vom Ball, Blick nach rechts)
    b.rechteck(34, 98, 28, 12, "text-leise", null, 5);
    b.rechteck(34, 132, 28, 12, "text-leise", null, 5);
    b.text([48, 164], "Spieler", { farbe: "text-leise", groesse: 10 });
    const bahn = (richtung, zurueck, vor) => [
      [ball[0] - zurueck * richtung[0], ball[1] - zurueck * richtung[1]],
      [ball[0] + vor * richtung[0], ball[1] + vor * richtung[1]],
    ];
    const [aussenVon, aussenBis] = bahn([-0.375, -0.927], 70, 60);
    b.linie(aussenVon, aussenBis, "verbessern", 3);
    pfeilspitze(b, aussenVon, aussenBis, "verbessern");
    const [innenVon, innenBis] = bahn([0.21, -0.978], 70, 60);
    b.linie(innenVon, innenBis, "gut", 3, true);
    pfeilspitze(b, innenVon, innenBis, "gut");
    // Schachtel: außen und etwas vom Ziel weg – eine Bahn von außen träfe sie vor dem Ball
    b.rechteck(161, 161, 22, 14, "achtung", "achtung", 3);
    b.text([190, 172], "Schachtel", { farbe: "achtung", anker: "start", fett: true });
    b.kreis(ball, 5, "text", 1.5, "flaeche");
    b.text([186, 200], "von außen: Slice", { farbe: "verbessern", anker: "start", fett: true });
    b.text([130, 200], "von innen", { farbe: "gut", anker: "end", fett: true });
    b.text([12, 40], "Blick von oben", { farbe: "text-leise", groesse: 10, anker: "start" });
    return { ausschnitt: { x: 0, y: 6, breite: 320, hoehe: 204 }, elemente: b.elemente };
  },

  // Lektion „Fett und getoppt“: drei Seitenansichten mit dem tiefsten Punkt des Schwungbogens
  tiefsterPunkt() {
    const b = baukasten();
    const boden = 110, radius = 60;
    const bilder = [
      { titel: "richtig", farbe: "gut", tiefX: 60, tiefY: 112, zeilen: ["erst Ball,", "dann Boden"], divot: true },
      { titel: "fett", farbe: "verbessern", tiefX: 36, tiefY: 113, zeilen: ["Boden zuerst,", "tiefster Punkt zu früh"] },
      { titel: "getoppt", farbe: "achtung", tiefX: 60, tiefY: 103, zeilen: ["Bogen zu hoch,", "Ball oben getroffen"] },
    ];
    bilder.forEach((s, i) => {
      const x0 = i * 107;
      b.linie([x0 + 6, boden], [x0 + 100, boden], "rand", 2);
      if (s.divot) b.rechteck(x0 + 54, boden, 20, 4, "rand", "rand", 2);
      const punkte = [];
      for (let x = x0 + 10; x <= x0 + 96; x += 3) {
        punkte.push([x, s.tiefY - (radius - Math.sqrt(radius ** 2 - (x - x0 - s.tiefX) ** 2))]);
      }
      b.pfad(punkte, s.farbe, 2.5);
      pfeilspitze(b, punkte[punkte.length - 2], punkte[punkte.length - 1], s.farbe, 7);
      b.kreis([x0 + 50, 105], 4.5, "text", 1.5, "flaeche");
      b.kreis([x0 + s.tiefX, s.tiefY], 2.5, s.farbe, 1, s.farbe);
      b.text([x0 + 53, 42], s.titel, { farbe: s.farbe, fett: true, groesse: 12 });
      b.text([x0 + 53, 132], s.zeilen[0], { groesse: 10 });
      b.text([x0 + 53, 146], s.zeilen[1], { groesse: 10, farbe: "text-leise" });
    });
    b.text([160, 168], "Seitenansicht · Ziel rechts · Punkt = tiefster Punkt", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 26, breite: 320, hoehe: 150 }, elemente: b.elemente };
  },

  // Lektion „Shank“: Eisen von oben, der Ball trifft den Hosel und fliegt fast rechtwinklig nach rechts
  hoselTreffer() {
    const b = baukasten();
    b.linie([170, 112], [170, 30], "rand", 1.5, true); // Ziellinie durch die Mitte der Fläche
    pfeilspitze(b, [170, 60], [170, 30], "rand");
    b.text([170, 22], "Ziel", { farbe: "text-leise" });
    b.linie([106, 140], [40, 152], "text-leise", 4); // Schaft zu den Händen des Spielers
    b.rechteck(110, 128, 120, 18, "text", "flaeche", 8); // Schlägerkopf, Fläche = obere Kante
    b.kreis([106, 140], 7, "verbessern", 2, "verbessern"); // Hosel (gefüllt)
    b.kreis([170, 121], 6, "gut", 1.5); // hier sollte der Ball liegen
    b.kreis([106, 124], 6, "text", 2, "flaeche"); // Ball am Hosel (wie alle Bälle: hell)
    b.linie([114, 118], [232, 98], "verbessern", 2, true);
    pfeilspitze(b, [114, 118], [232, 98], "verbessern");
    b.text([310, 76], "Ball fliegt fast", { farbe: "verbessern", anker: "end" });
    b.text([310, 90], "rechtwinklig nach rechts", { farbe: "verbessern", anker: "end" });
    b.text([100, 164], "Hosel", { farbe: "verbessern", fett: true });
    b.text([170, 164], "Mitte", { farbe: "gut", fett: true });
    b.text([226, 164], "Spitze", { farbe: "text-leise" });
    b.text([160, 186], "Blick von oben · Rechtshänder", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 8, breite: 320, hoehe: 186 }, elemente: b.elemente };
  },

  // Lektion „Hook, Push, Pull, Sky“: Kurzübersicht mit kleinen Flugbildern
  fehlerUebersicht() {
    const b = baukasten();
    const zeilen = [
      { titel: "Hook – Kurve stark nach links", text: "Fläche zur Bahn geschlossen", start: 0, kurve: -22 },
      { titel: "Push – gerade, rechts vorbei", text: "Fläche und Bahn zeigen nach rechts", start: 14, kurve: 0 },
      { titel: "Pull – gerade, links vorbei", text: "Fläche und Bahn zeigen nach links", start: -14, kurve: 0 },
      { titel: "Sky – steil nach oben (Driver)", text: "zu steil, Oberkante getroffen", sky: true },
    ];
    zeilen.forEach((z, i) => {
      const oben = 20 + i * 42, mitte = 32, ballY = oben + 32;
      b.rechteck(8, oben, 48, 38, "rand", null, 6, 1);
      if (z.sky) {
        // Seitenansicht: Ball steigt fast senkrecht
        b.linie([12, ballY + 2], [52, ballY + 2], "rand", 1.5);
        b.pfad(bogen([mitte - 8, ballY], [mitte + 12, ballY], 30, 16), "akzent", 2);
      } else {
        b.linie([mitte, ballY], [mitte, oben + 4], "rand", 1, true);
        const punkte = [];
        for (let t = 0; t <= 1.001; t += 0.1) punkte.push([mitte + z.start * t + z.kurve * t * t, ballY - 26 * t]);
        b.pfad(punkte, "akzent", 2);
      }
      b.kreis([z.sky ? mitte - 8 : mitte, ballY], 3, "text", 1, "flaeche");
      b.text([66, oben + 16], z.titel, { anker: "start", fett: true });
      b.text([66, oben + 31], z.text, { anker: "start", farbe: "text-leise", groesse: 10 });
    });
    b.text([160, 200], "kleine Bilder: von oben, Ziel oben · Sky: von der Seite", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 12, breite: 320, hoehe: 194 }, elemente: b.elemente };
  },

  // ===== Pfad 4: Rund ums Grün =====

  // Lektion „Putt, Chip oder Pitch?“: drei Fragen, drei Flugbahnen (Seitenansicht)
  entscheidung() {
    const b = baukasten();
    b.text([160, 18], "So flach wie möglich, so hoch wie nötig", { fett: true });
    const zeilen = [
      { frage: "Kurzes, festes Gras bis zum Grün?", wahl: "→ Putten", farbe: "gut", hoehe: 0 },
      { frage: "Genug Grün bis zur Fahne?", wahl: "→ Chippen", farbe: "akzent", hoehe: 9, lande: 44 },
      { frage: "Bunker oder Rough dazwischen?", wahl: "→ Pitchen", farbe: "info", hoehe: 22, lande: 70, hindernis: true },
    ];
    zeilen.forEach((z, i) => {
      const oben = 30 + i * 48, boden = oben + 34;
      b.rechteck(8, oben, 92, 42, "rand", null, 6, 1);
      b.linie([14, boden], [94, boden], "rand", 1.5);
      if (z.hindernis) b.rechteck(36, boden - 2, 24, 5, "achtung", "skala-achtung", 2, 1); // Bunker
      const ball = [18, boden - 3];
      if (z.hoehe === 0) b.linie([22, ball[1]], [80, ball[1]], z.farbe, 2, true);
      else {
        b.pfad(bogen([22, ball[1]], [z.lande, ball[1]], z.hoehe, 12), z.farbe, 2);
        b.linie([z.lande, ball[1]], [80, ball[1]], z.farbe, 2, true);
      }
      b.kreis(ball, 3, "text", 1, "flaeche");
      fahne(b, [80, boden], 22);
      b.text([110, oben + 18], z.frage, { anker: "start" });
      b.text([110, oben + 34], z.wahl, { anker: "start", fett: true, farbe: z.farbe });
    });
    return { ausschnitt: { x: 0, y: 4, breite: 320, hoehe: 174 }, elemente: b.elemente };
  },

  // Lektion „Chippen“: gleiche Weite mit drei Schlägern – mehr Loft = mehr Flug, weniger Rollen
  flugRollenSchlaeger() {
    const b = baukasten();
    const schlaeger = [
      { name: "Sand Wedge", unter: "mehr Loft", farbe: "info", lande: 236, hoehe: 30 },
      { name: "Pitching W.", unter: "", farbe: "akzent", lande: 196, hoehe: 18 },
      { name: "8er-Eisen", unter: "weniger Loft", farbe: "achtung", lande: 156, hoehe: 9 },
    ];
    schlaeger.forEach((s, i) => {
      // Rolllinie knapp über dem Grün, damit sie in hell und dunkel gut sichtbar bleibt
      const boden = 58 + i * 44, ballY = boden - 4;
      b.linie([76, boden], [132, boden], "rand", 2);
      b.rechteck(132, boden, 168, 3, "gut", "gut", 1.5); // Grün
      b.pfad(bogen([88, ballY], [s.lande, ballY], s.hoehe, 16), s.farbe, 2.5);
      b.linie([s.lande, ballY], [292, ballY], s.farbe, 2, true);
      b.kreis([s.lande, ballY], 2.5, s.farbe, 1, s.farbe); // Landepunkt
      b.kreis([84, ballY], 3, "text", 1, "flaeche");
      fahne(b, [296, boden], 24);
      b.text([8, boden - 8], s.name, { anker: "start", fett: true, farbe: s.farbe });
      if (s.unter) b.text([8, boden + 6], s.unter, { anker: "start", farbe: "text-leise", groesse: 10 });
    });
    b.text([160, 176], "schematisch · Flug durchgezogen, Rollen gestrichelt", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 18, breite: 320, hoehe: 166 }, elemente: b.elemente };
  },

  // Lektion „Pitchen“: Uhren-System nach Dave Pelz (linker Arm = Stundenzeiger, Blick von vorn)
  uhr() {
    const b = baukasten();
    const mitte = [86, 92], r = 60;
    const punkt = (stunde, abstand) => {
      const w = (stunde * 30 * Math.PI) / 180;
      return [mitte[0] + abstand * Math.sin(w), mitte[1] - abstand * Math.cos(w)];
    };
    b.kreis(mitte, r, "rand", 1.5);
    for (let h = 1; h <= 12; h++) b.linie(punkt(h, r - 6), punkt(h, r), "text-leise", 1.5);
    // Ziffern außen am Kreis – innen lägen sie unter den Zeigern
    for (const [h, zahl] of [[12, "12"], [3, "3"], [6, "6"], [9, "9"]]) {
      const p = punkt(h, r + 10);
      b.text([p[0], p[1] + 4], zahl, { farbe: "text-leise", groesse: 10 });
    }
    const zeiger = [
      { stunde: 6, zeit: "6:00", text: "Ansprechen", farbe: "text-leise" },
      { stunde: 7.5, zeit: "7:30", text: "kurz", farbe: "gut" },
      { stunde: 9, zeit: "9:00", text: "Arm waagerecht", farbe: "akzent" },
      { stunde: 10.5, zeit: "10:30", text: "lang", farbe: "info" },
    ];
    zeiger.forEach((z, i) => {
      const ende = punkt(z.stunde, r - 8);
      b.linie(mitte, ende, z.farbe, z.stunde === 6 ? 1.5 : 3, z.stunde === 6);
      b.kreis(ende, 3, z.farbe, 1, z.farbe);
      const y = 52 + i * 24;
      b.linie([172, y - 4], [186, y - 4], z.farbe, 3);
      b.text([192, y], z.zeit, { anker: "start", fett: true, farbe: z.farbe });
      b.text([228, y], z.text, { anker: "start" });
    });
    b.kreis(mitte, 3, "text", 1, "text");
    b.text([160, 186], "Linker Arm = Stundenzeiger · Blick von vorn · nach Dave Pelz", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 12, breite: 320, hoehe: 182 }, elemente: b.elemente };
  },

  // Lektion „Bunker“: Der Schläger tritt 2–5 cm hinter dem Ball in den Sand ein (Seitenansicht)
  sandEintritt() {
    const b = baukasten();
    const sand = 112, radius = 90, tief = [190, sand + 9];
    b.rechteck(10, sand, 300, 40, "achtung", "skala-achtung", 2, 1);
    const punkte = [];
    for (let x = 104; x <= 270; x += 4) punkte.push([x, tief[1] - (radius - Math.sqrt(radius ** 2 - (x - tief[0]) ** 2))]);
    b.pfad(punkte, "akzent", 2.5);
    pfeilspitze(b, punkte[punkte.length - 2], punkte[punkte.length - 1], "akzent");
    // Eintritt: dort, wo der Bogen die Sandoberfläche schneidet (ca. 31 Bildpunkte vor dem Ball)
    const eintritt = tief[0] - Math.sqrt(radius ** 2 - (radius - 9) ** 2);
    const ball = [182, sand - 5];
    for (const [dx, dy] of [[6, -22], [14, -16], [20, -8]]) b.linie([ball[0] + 4, sand - 2], [ball[0] + 4 + dx, sand - 2 + dy], "achtung", 1.5);
    b.pfad(bogen(ball, [300, sand - 30], 70), "text", 1.5, true);
    b.kreis(ball, 5, "text", 1.5, "flaeche");
    b.kreis([eintritt, sand], 3, "akzent", 1, "akzent");
    b.linie([eintritt, sand - 22], [ball[0] - 5, sand - 22], "text", 1.5);
    for (const x of [eintritt, ball[0] - 5]) b.linie([x, sand - 26], [x, sand - 18], "text", 1.5);
    b.text([(eintritt + ball[0] - 5) / 2, sand - 30], "2–5 cm", { fett: true });
    // Beide Beschriftungen im Sand – oben rechts verläuft die Flugbahn des Balls
    b.text([eintritt, sand + 26], "Eintritt", { anker: "end", groesse: 10 });
    b.text([300, sand + 26], "Sand trägt den Ball heraus", { anker: "end", groesse: 10 });
    b.text([160, 168], "Seitenansicht · Ziel rechts", { farbe: "text-leise", groesse: 10 });
    // Ausschnitt ab y 14: Die Flugbahn des Balls reicht bis y 24
    return { ausschnitt: { x: 0, y: 14, breite: 320, hoehe: 162 }, elemente: b.elemente };
  },

  // Lektion „Putten: Länge vor Linie“: zu kurz fällt nie – ideal ca. 40 cm hinter dem Loch (Pelz)
  puttZiel() {
    const b = baukasten();
    b.rechteck(8, 34, 304, 104, "gut", "skala-gut", 16, 1); // Grün
    const loch = 214, zeilen = [
      { y: 64, ende: 194, farbe: "verbessern", text: "zu kurz: fällt nie" },
      { y: 108, ende: 266, farbe: "gut", text: "ideal: ca. 40 cm dahinter" },
    ];
    for (const z of zeilen) {
      b.kreis([loch, z.y], 7, "text", 1.5, "flaeche-innen"); // Loch
      b.linie([30, z.y], [z.ende, z.y], z.farbe, 2, true);
      b.kreis([z.ende, z.y], 4.5, z.farbe, 1.5, "flaeche");
      b.kreis([30, z.y], 3, "text-leise", 1, "text-leise"); // Startpunkt
    }
    b.text([30, 52], zeilen[0].text, { anker: "start", fett: true, farbe: "verbessern" });
    b.linie([loch, 124], [266, 124], "gut", 1.5);
    for (const x of [loch, 266]) b.linie([x, 120], [x, 128], "gut", 1.5);
    b.text([30, 96], zeilen[1].text, { anker: "start", fett: true, farbe: "gut" });
    b.text([160, 154], "Blick von oben · Messungen von Dave Pelz", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 26, breite: 320, hoehe: 136 }, elemente: b.elemente };
  },

  // Lektion „Putten“: Wie oft fallen Putts? Tourspieler vs. 20er-Handicap
  puttQuoten() {
    const b = baukasten();
    const massstab = 2; // 1 % = 2 Bildpunkte
    b.rechteck(12, 14, 14, 8, "akzent", "akzent", 2);
    b.text([30, 22], "PGA Tour", { anker: "start", groesse: 10 });
    b.rechteck(110, 14, 14, 8, "text-leise", "text-leise", 2);
    b.text([128, 22], "Handicap 20", { anker: "start", groesse: 10 });
    const zeilen = [{ abstand: "0,9 m", tour: 96, hcp: 90 }, { abstand: "1,5 m", tour: 77, hcp: 55 }, { abstand: "3 m", tour: 40, hcp: 18 }];
    zeilen.forEach((z, i) => {
      const y = 38 + i * 40;
      b.text([12, y + 16], z.abstand, { anker: "start", fett: true });
      b.rechteck(56, y, z.tour * massstab, 11, "akzent", "akzent", 3);
      b.text([62 + z.tour * massstab, y + 10], `ca. ${z.tour} %`, { anker: "start", groesse: 10 });
      b.rechteck(56, y + 15, z.hcp * massstab, 11, "text-leise", "text-leise", 3);
      b.text([62 + z.hcp * massstab, y + 25], `ca. ${z.hcp} %`, { anker: "start", groesse: 10, farbe: "text-leise" });
    });
    b.text([160, 166], "gelochte Putts · PGA-Tour- und Shot-Scope-Daten, gerundet", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 6, breite: 320, hoehe: 168 }, elemente: b.elemente };
  },

  // Lektion „Grüns lesen“: Falllinie von oben, gerader Putt darauf, brechender Putt von der Seite
  falllinie() {
    const b = baukasten();
    // Beschriftungen stehen außerhalb des Grüns, damit sie keinen Rand kreuzen
    const loch = [196, 96];
    b.pfad(ellipse([176, 100], 136, 60), "gut", 1, false, "skala-gut");
    b.linie([loch[0], 30], [loch[0], 168], "info", 2, true);
    pfeilspitze(b, [loch[0], 134], [loch[0], 168], "info");
    b.text([206, 176], "Falllinie: Wasser", { anker: "start", farbe: "info", fett: true, groesse: 10 });
    b.text([206, 189], "fließt nach unten", { anker: "start", farbe: "info", groesse: 10 });
    b.text([206, 34], "hoch", { anker: "start", farbe: "text-leise" });
    // Gerader Putt auf der Falllinie (von unten, bergauf)
    b.linie([loch[0], 146], [loch[0], 106], "gut", 2.5);
    pfeilspitze(b, [loch[0], 146], [loch[0], 106], "gut");
    b.kreis([loch[0], 148], 4, "text", 1.5, "flaeche");
    b.text([186, 136], "gerade", { anker: "end", fett: true, farbe: "gut" });
    // Putt von der Seite: zielt höher, bricht vor allem am Ende (Bezier-Kurve)
    const p0 = [70, 100], k = [168, 56], p1 = [190, 94], kurve = [];
    for (let t = 0; t <= 1.001; t += 0.05) {
      kurve.push([(1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * k[0] + t * t * p1[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * k[1] + t * t * p1[1]]);
    }
    b.pfad(kurve, "akzent", 2.5);
    pfeilspitze(b, kurve[kurve.length - 2], kurve[kurve.length - 1], "akzent");
    b.kreis(p0, 4, "text", 1.5, "flaeche");
    b.kreis(loch, 6, "text", 1.5, "flaeche-innen");
    b.text([8, 22], "bricht – am meisten", { anker: "start", fett: true, farbe: "akzent" });
    b.text([8, 36], "im letzten Drittel", { anker: "start", farbe: "akzent" });
    b.text([8, 186], "Blick von oben", { anker: "start", farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 8, breite: 320, hoehe: 186 }, elemente: b.elemente };
  },

  // ===== Pfad 5: Clever spielen =====

  // Lektion „Streuung“: dieselbe Ellipse, einmal auf die Mitte, einmal nah am Wasser gezielt
  streuung() {
    const b = baukasten();
    const felder = [
      { x0: 0, titel: "Ziel: Mitte", mitte: 64, farbe: "gut", text: "fast alles im Spiel" },
      { x0: 162, titel: "Ziel: nah am Wasser", mitte: 106, farbe: "verbessern", text: "ein Teil im Wasser" },
    ];
    for (const f of felder) {
      const x = (dx) => f.x0 + dx;
      b.rechteck(x(18), 30, 92, 132, "gut", "skala-gut", 26, 1); // Fairway
      b.rechteck(x(116), 30, 34, 132, "info", "gefuehl-grund", 6, 1); // Wasser
      b.text([x(133), 172], "Wasser", { farbe: "info", groesse: 10 });
      b.pfad(ellipse([x(f.mitte), 92], 26, 42), f.farbe, 2, true);
      b.linie([x(f.mitte) - 5, 92], [x(f.mitte) + 5, 92], f.farbe, 2);
      b.linie([x(f.mitte), 87], [x(f.mitte), 97], f.farbe, 2);
      b.text([x(80), 20], f.titel, { fett: true, farbe: f.farbe });
      b.text([x(64), 172], f.text, { groesse: 10 });
    }
    b.text([160, 190], "Ellipse = wo deine Bälle landen (Streuung) · Blick von oben", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 6, breite: 320, hoehe: 190 }, elemente: b.elemente };
  },

  // Lektion „Annäherung“: auf die Grünmitte zielen, Schläger für den hinteren Rand
  gruenZiel() {
    const b = baukasten();
    b.pfad(ellipse([150, 88], 104, 54), "gut", 1, false, "skala-gut"); // Grün
    b.pfad(ellipse([74, 140], 30, 10), "achtung", 1, false, "skala-achtung"); // Bunker vorn links
    b.text([74, 144], "Bunker", { groesse: 10, farbe: "achtung" });
    b.kreis([100, 118], 4, "akzent", 1, "akzent");
    b.text([92, 122], "Fahne", { anker: "end", groesse: 10 });
    b.pfad(ellipse([150, 100], 40, 24), "info", 2, true); // typische Streuung, eher zu kurz
    b.linie([142, 88], [158, 88], "text", 2.5);
    b.linie([150, 80], [150, 96], "text", 2.5);
    b.text([150, 70], "Ziel: Grünmitte", { fett: true });
    b.text([276, 160], "Streuung: meist zu kurz", { anker: "end", farbe: "info", groesse: 10 });
    // Der Schläger wird für die Entfernung bis zum hinteren Rand gewählt
    b.linie([290, 176], [290, 34], "text-leise", 1.5, true);
    pfeilspitze(b, [290, 62], [290, 34], "text-leise");
    b.linie([254, 34], [290, 34], "text-leise", 1, true);
    b.text([286, 22], "Schläger bis zum hinteren Rand", { anker: "end", groesse: 10 });
    b.text([8, 182], "Blick von oben · Spieler unten", { anker: "start", farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 10, breite: 320, hoehe: 180 }, elemente: b.elemente };
  },

  // Lektion „Persönliches Par“: ein Par 4 mit Bogey-Plan (5 Schläge)
  bogeyPlan() {
    const b = baukasten();
    b.rechteck(118, 56, 74, 118, "gut", "skala-gut", 30, 1); // Fairway
    b.pfad(ellipse([155, 34], 36, 16), "gut", 1, false, "skala-gut"); // Grün
    // Bunker seitlich am Grün: Von Punkt 2 ist der Weg aufs Grün frei – passt zum Chip (Pfad 4)
    b.pfad(ellipse([108, 34], 10, 8), "achtung", 1, false, "skala-achtung");
    b.rechteck(146, 178, 18, 8, "text-leise", "text-leise", 2); // Abschlag
    const schlaege = [[155, 182], [148, 126], [160, 78], [150, 32]];
    b.pfad(schlaege, "text", 1.5, true);
    schlaege.slice(1).forEach(([x, y], i) => {
      b.kreis([x, y], 8, "akzent", 1.5, "flaeche");
      b.text([x, y + 4], String(i + 1), { fett: true, farbe: "akzent", groesse: 10 });
    });
    b.text([196, 38], "4–5", { anker: "start", fett: true, farbe: "akzent" });
    const plan = ["Par 4 → Plan: 5", "1 sicherer Abschlag", "2 vor das Grün", "3 Chip aufs Grün", "4–5 zwei Putts"];
    plan.forEach((zeile, i) => b.text([210, 82 + i * 16], zeile, { anker: "start", fett: i === 0, groesse: i === 0 ? 11 : 10 }));
    b.text([12, 100], "Bogey auf", { anker: "start", fett: true });
    b.text([12, 114], "jedem Loch:", { anker: "start", fett: true });
    b.text([12, 130], "Par 72 → 90", { anker: "start", farbe: "akzent", fett: true });
    return { ausschnitt: { x: 0, y: 12, breite: 320, hoehe: 180 }, elemente: b.elemente };
  },

  // Lektion „Hanglagen“: vier Lagen mit typischer Wirkung (Rechtshänder)
  haenge() {
    const b = baukasten();
    // Seitenhang: Blick von hinten (Spieler links, Ball rechts). Bergauf/bergab: Seitenansicht, Ziel rechts.
    const lagen = [
      { titel: "Ball über den Füßen", von: [8, 38], bis: [80, 18], wirkung: "fliegt eher links → etwas rechts zielen" },
      { titel: "Ball unter den Füßen", von: [8, 18], bis: [80, 38], wirkung: "fliegt eher rechts → etwas links zielen" },
      { titel: "Bergauf", von: [8, 38], bis: [80, 18], wirkung: "höher und kürzer → mehr Schläger", flug: 16 },
      { titel: "Bergab", von: [8, 18], bis: [80, 38], wirkung: "flacher und weiter → weniger Schläger", flug: 4 },
    ];
    lagen.forEach((l, i) => {
      const y0 = 4 + i * 44;
      const p = ([x, y]) => [x, y0 + y];
      b.rechteck(2, y0, 316, 40, "rand", null, 6, 1);
      b.linie(p(l.von), p(l.bis), "achtung", 2.5);
      // Bergauf/bergab: Ball auf dem Hang mit Flugbahn; Seitenhang: Füße am Anfang, Ball oben bzw. unten
      const anteil = l.flug === undefined ? 0.75 : 0.3;
      const ball = [l.von[0] + (l.bis[0] - l.von[0]) * anteil, l.von[1] + (l.bis[1] - l.von[1]) * anteil - 4];
      if (l.flug === undefined) {
        const fuss = [l.von[0] + (l.bis[0] - l.von[0]) * 0.15, l.von[1] + (l.bis[1] - l.von[1]) * 0.15];
        b.rechteck(fuss[0] - 6, y0 + fuss[1] - 6, 12, 5, "text-leise", "text-leise", 2);
      } else {
        b.pfad(bogen(p(ball), p([ball[0] + 46, ball[1] - 6]), l.flug, 12), "akzent", 1.5, true);
      }
      b.kreis(p(ball), 4, "text", 1.5, "flaeche");
      b.text([94, y0 + 16], l.titel, { anker: "start", fett: true });
      b.text([94, y0 + 31], l.wirkung, { anker: "start", groesse: 10, farbe: "akzent" });
    });
    b.text([160, 190], "schematisch · Rechtshänder · am Hang mit ca. 80 % Tempo", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 0, breite: 320, hoehe: 196 }, elemente: b.elemente };
  },

  // Lektion „Wind, Rough, Nässe“: Faustregel Gegen- und Rückenwind (Beispiel 150 m, 16 km/h)
  wind() {
    const b = baukasten();
    const massstab = 1.5; // 1 m = 1,5 Bildpunkte
    const zeilen = [
      { titel: "Windstill: 150 m", meter: 150, farbe: "text-leise" },
      { titel: "Gegenwind 16 km/h: wie ca. 165 m", meter: 165, farbe: "verbessern", pfeil: -1 },
      { titel: "Rückenwind 16 km/h: wie ca. 143 m", meter: 143, farbe: "gut", pfeil: 1 },
    ];
    zeilen.forEach((z, i) => {
      const y = 40 + i * 42;
      b.text([12, y - 6], z.titel, { anker: "start", fett: true, farbe: z.farbe === "text-leise" ? "text" : z.farbe });
      b.rechteck(12, y, z.meter * massstab, 12, z.farbe, z.farbe, 3);
      if (z.pfeil) {
        // Windpfeil rechts neben dem Balken
        const von = z.pfeil > 0 ? [270, y + 6] : [304, y + 6], bis = z.pfeil > 0 ? [304, y + 6] : [270, y + 6];
        b.linie(von, bis, z.farbe, 2.5);
        pfeilspitze(b, von, bis, z.farbe);
      }
    });
    b.text([160, 160], "Faustregel: Gegenwind ca. +1 % je 1,6 km/h,", { farbe: "text-leise", groesse: 10 });
    b.text([160, 174], "Rückenwind ca. −0,5 % · Ziel rechts", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 18, breite: 320, hoehe: 164 }, elemente: b.elemente };
  },

  // Lektion „Routine“: Denk-Zone hinter dem Ball, Entscheidungslinie, Spiel-Zone am Ball (Vision54)
  zonen() {
    const b = baukasten();
    b.rechteck(12, 40, 132, 102, "info", "gefuehl-grund", 10, 1.5);
    b.text([78, 62], "Denk-Zone", { fett: true, farbe: "info" });
    b.text([78, 86], "Ziel, Schläger,", { groesse: 10 });
    b.text([78, 100], "Schlagidee", { groesse: 10 });
    b.text([78, 126], "hinter dem Ball", { farbe: "text-leise", groesse: 10 });
    b.linie([160, 34], [160, 148], "akzent", 2.5, true);
    b.text([160, 26], "Entscheidungslinie", { fett: true, farbe: "akzent", groesse: 10 });
    b.rechteck(176, 40, 132, 102, "gut", "skala-gut", 10, 1.5);
    b.text([242, 62], "Spiel-Zone", { fett: true, farbe: "gut" });
    b.text([242, 86], "nur Gefühl", { groesse: 10 });
    b.text([242, 100], "und Ziel", { groesse: 10 });
    b.kreis([242, 124], 4, "text", 1.5, "flaeche");
    b.linie([118, 160], [202, 160], "text-leise", 2);
    pfeilspitze(b, [118, 160], [202, 160], "text-leise");
    b.text([160, 176], "bewusst ein Schritt nach vorn", { farbe: "text-leise", groesse: 10 });
    b.text([160, 192], "nach Vision54 (Nilsson & Marriott)", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 12, breite: 320, hoehe: 186 }, elemente: b.elemente };
  },

  // ===== Pfad 6: Besser üben =====

  // Lektion „Worauf achten?“: innerer vs. äußerer Fokus mit Beispielen
  fokus() {
    const b = baukasten();
    b.text([160, 18], "Worauf achtest du?", { fett: true });
    const spalten = [
      { x0: 8, titel: "innen: Körper", farbe: "text-leise", fuellung: null, saetze: ["„Linker Arm gestreckt“", "„Gewicht nach links“", "„Hüfte zuerst drehen“"] },
      { x0: 164, titel: "außen: Wirkung", farbe: "gut", fuellung: "skala-gut", saetze: ["„Schlägerkopf pendelt“", "„Divot vor dem Ball“", "„Ball zur Fahne“"] },
    ];
    for (const s of spalten) {
      b.rechteck(s.x0, 30, 148, 118, s.farbe, s.fuellung, 10, 1.5);
      b.text([s.x0 + 74, 52], s.titel, { fett: true, farbe: s.farbe === "text-leise" ? "text" : s.farbe });
      s.saetze.forEach((satz, i) => b.text([s.x0 + 74, 82 + i * 22], satz, { groesse: 10.5 }));
    }
    b.text([160, 166], "Studien: Mit äußerem Fokus lernst und triffst du besser", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 4, breite: 320, hoehe: 170 }, elemente: b.elemente };
  },

  // Lektion „Bilder statt Verbote“: ein Bild (Pendel) und positiv statt verboten
  bildStattVerbot() {
    const b = baukasten();
    const dreh = [42, 22];
    b.kreis(dreh, 3, "text", 1, "text");
    const bahn = [];
    for (let w = -28; w <= 28; w += 4) {
      const r = (w * Math.PI) / 180;
      bahn.push([dreh[0] + 56 * Math.sin(r), dreh[1] + 56 * Math.cos(r)]);
    }
    b.pfad(bahn, "akzent", 1.5, true);
    b.linie(dreh, [dreh[0], dreh[1] + 56], "text", 2);
    b.kreis([dreh[0], dreh[1] + 56], 7, "akzent", 2, "akzent");
    b.text([86, 46], "Ein Bild statt vieler Regeln:", { anker: "start", fett: true });
    b.text([86, 62], "„schwing wie ein Pendel“", { anker: "start", farbe: "akzent" });
    b.text([18, 116], "✗", { fett: true, farbe: "verbessern", groesse: 14 });
    b.text([34, 116], "„Nicht zu lang!“ – abgelenkt häufiger zu lang", { anker: "start" });
    b.text([18, 146], "✓", { fett: true, farbe: "gut", groesse: 14 });
    b.text([34, 146], "„Ball knapp hinter das Loch rollen lassen“", { anker: "start", fett: true, farbe: "gut" });
    b.text([160, 172], "nach Studien zu Bildern und Verboten beim Putten", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 10, breite: 320, hoehe: 170 }, elemente: b.elemente };
  },

  // Lektion „Verteilt üben“: dieselbe Zeit, einmal am Stück, einmal verteilt
  kalender() {
    const b = baukasten();
    const tage = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], x0 = 82, breite = 32;
    tage.forEach((tag, i) => b.text([x0 + i * breite + breite / 2, 30], tag, { groesse: 10, farbe: "text-leise" }));
    const reihen = [
      { y: 40, titel: "1 × 60 min", farbe: "verbessern", fuellung: "skala-rot", tage: { 5: "60" } },
      { y: 82, titel: "3 × 20 min", farbe: "gut", fuellung: "skala-gut", tage: { 0: "20", 2: "20", 4: "20" } },
    ];
    for (const r of reihen) {
      b.text([8, r.y + 21], r.titel, { anker: "start", fett: true, farbe: r.farbe });
      tage.forEach((_, i) => {
        const voll = r.tage[i];
        b.rechteck(x0 + i * breite + 2, r.y, breite - 4, 30, voll ? r.farbe : "rand", voll ? r.fuellung : null, 5, voll ? 1.5 : 1);
        if (voll) b.text([x0 + i * breite + breite / 2, r.y + 20], voll, { fett: true, groesse: 10 });
      });
    }
    b.text([160, 136], "Gleiche Zeit, verteilt geübt:", { fett: true });
    b.text([160, 152], "nach 28 Tagen kleinere Fehler (Putt-Studie)", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 16, breite: 320, hoehe: 144 }, elemente: b.elemente };
  },

  // Lektion „Range-Plan“: 60 Minuten als Zeitleiste (Beispiel)
  rangePlan() {
    const b = baukasten();
    const x = (minute) => 14 + minute * 4.86;
    const teile = [
      { von: 0, bis: 10, name: "Aufwärmen", farbe: "text-leise" },
      { von: 10, bis: 25, name: "Technik", farbe: "info" },
      { von: 25, bis: 40, name: "Variabel", farbe: "achtung" },
      { von: 40, bis: 55, name: "Range-Runde", farbe: "akzent" },
      { von: 55, bis: 60, name: "kurzes Spiel", farbe: "gut", unten: true },
    ];
    b.text([160, 24], "60 Minuten auf der Range (Beispiel)", { fett: true });
    for (const t of teile) {
      b.rechteck(x(t.von) + 1, 58, x(t.bis) - x(t.von) - 2, 26, t.farbe, t.farbe, 4);
      if (t.unten) b.text([x(60), 120], t.name, { anker: "end", groesse: 10, fett: true, farbe: t.farbe });
      else b.text([(x(t.von) + x(t.bis)) / 2, 102], t.name, { groesse: 10, fett: true, farbe: t.farbe });
    }
    for (const minute of [0, 10, 25, 40, 55, 60]) {
      b.text([x(minute), 50], String(minute), { groesse: 10, farbe: "text-leise" });
    }
    b.text([160, 146], "erst Block, dann abwechseln, dann wie auf dem Platz", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 8, breite: 320, hoehe: 146 }, elemente: b.elemente };
  },

  // Lektion „Aufwärmen und Beweglichkeit“: drei einfache Selbsttests (nur Hinweise, keine Diagnose)
  selbsttests() {
    const b = baukasten();
    const tests = [
      { titel: "Zehen berühren", zeilen: ["Knie gestreckt,", "Finger zu den Zehen"] },
      { titel: "Tiefe Kniebeuge", zeilen: ["Fersen bleiben", "am Boden"] },
      { titel: "Drehung im Sitzen", zeilen: ["Oberkörper dreht,", "Hüfte bleibt ruhig"] },
    ];
    tests.forEach((t, i) => {
      const x0 = 4 + i * 106, mx = x0 + 50;
      b.text([mx, 18], t.titel, { fett: true, groesse: 10 });
      b.rechteck(x0, 26, 100, 88, "rand", null, 8, 1);
      if (i < 2) {
        b.linie([x0 + 14, 104], [x0 + 86, 104], "text-leise", 2); // Boden
        b.linie([mx, 40], [mx, 96], "akzent", 2.5);
        pfeilspitze(b, [mx, 40], [mx, 96], "akzent");
        if (i === 1) for (const dx of [-16, 16]) b.rechteck(mx + dx - 6, 99, 12, 5, "gut", "gut", 2); // Fersen
      } else {
        const bogenPunkte = [];
        for (let w = 200; w <= 340; w += 10) {
          const r = (w * Math.PI) / 180;
          bogenPunkte.push([mx + 30 * Math.cos(r), 78 + 30 * Math.sin(r)]);
        }
        b.pfad(bogenPunkte, "akzent", 2.5);
        pfeilspitze(b, bogenPunkte[bogenPunkte.length - 2], bogenPunkte[bogenPunkte.length - 1], "akzent");
        b.rechteck(mx - 18, 84, 36, 8, "text-leise", "text-leise", 3); // Sitz
      }
      t.zeilen.forEach((z, j) => b.text([mx, 132 + j * 14], z, { groesse: 10 }));
    });
    b.text([160, 176], "nur Hinweise, keine Diagnose · bei Schmerzen zum Arzt", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 6, breite: 320, hoehe: 178 }, elemente: b.elemente };
  },

  // Lektion „Üben mit dieser App“: Filmen → eine Baustelle → üben → neu filmen
  appAblauf() {
    const b = baukasten();
    const schritte = [
      { titel: "1 Filmen", unter: "Ganzkörper" },
      { titel: "2 Baustelle", unter: "nur eine" },
      { titel: "3 Üben", unter: "mit Übung" },
      { titel: "4 Neu filmen", unter: "1–2 Wochen" },
    ];
    schritte.forEach((s, i) => {
      const x0 = 4 + i * 80;
      b.rechteck(x0, 40, 72, 54, "akzent", "flaeche", 8, 1.5);
      b.text([x0 + 36, 62], s.titel, { fett: true, groesse: 10 });
      b.text([x0 + 36, 80], s.unter, { groesse: 10, farbe: "text-leise" });
      if (i < 3) {
        b.linie([x0 + 73, 67], [x0 + 79, 67], "text-leise", 2);
        pfeilspitze(b, [x0 + 73, 67], [x0 + 79, 67], "text-leise", 5);
      }
    });
    const zurueck = [[280, 96], [280, 116], [40, 116], [40, 98]];
    b.pfad(zurueck, "text-leise", 1.5, true);
    pfeilspitze(b, zurueck[2], zurueck[3], "text-leise", 6);
    b.text([160, 132], "wieder von vorn", { farbe: "text-leise", groesse: 10 });
    b.text([160, 26], "Üben mit der App", { fett: true });
    b.text([160, 156], "Du bestimmst, wann du filmst – dazwischen ohne Video üben", { farbe: "text-leise", groesse: 10 });
    return { ausschnitt: { x: 0, y: 10, breite: 320, hoehe: 154 }, elemente: b.elemente };
  },
};

export const SCHAUBILD_NAMEN = Object.keys(SCHAUBILDER);

export function gibtBild(name) {
  return name in SCHAUBILDER || name in FIGUREN;
}

export function schaubild(name, hervor = null) {
  return SCHAUBILDER[name] ? SCHAUBILDER[name](hervor) : null;
}

// Ballflug-Helfer: ein einzelner Ballflug von oben (start/kurve = "links" | "gerade" | "rechts")
export function ballflugBild(start, kurve) {
  const zahl = { links: -1, gerade: 0, rechts: 1 };
  if (!Object.hasOwn(zahl, start) || !Object.hasOwn(zahl, kurve)) return null;
  const b = baukasten();
  const ball = [160, 156];
  b.linie(ball, [160, 26], "rand", 1.5, true);
  b.text([160, 18], "Ziel", { farbe: "text-leise" });
  const punkte = [];
  for (let t = 0; t <= 1.001; t += 0.05) punkte.push([ball[0] + zahl[start] * 40 * t + zahl[kurve] * 48 * t * t, ball[1] - 122 * t]);
  b.pfad(punkte, "akzent", 3);
  pfeilspitze(b, punkte[punkte.length - 2], punkte[punkte.length - 1], "akzent", 9);
  b.kreis(ball, 5, "text", 1.5, "flaeche");
  b.text([160, 176], "Blick von oben · Rechtshänder", { farbe: "text-leise", groesse: 10 });
  return { ausschnitt: { x: 40, y: 4, breite: 240, hoehe: 178 }, elemente: b.elemente };
}
