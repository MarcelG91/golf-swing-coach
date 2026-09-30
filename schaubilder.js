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
