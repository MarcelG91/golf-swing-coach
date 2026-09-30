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
//   schaubild(name)  → { ausschnitt, elemente } oder null
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

// ---------------------------------------------------------------
// Figuren aus echten Posen (uebungsbilder.js). Von hinten gibt es nur die geprüfte
// Ansprechhaltung als Standbild (siehe Kommentar oben in uebungsbilder.js).
// lot = gestrichelte Linie: Arme hängen senkrecht unter der Schulter.
// ---------------------------------------------------------------
export const FIGUREN = {
  ansprechenHinten: { ansicht: "hinten", folge: [{ pose: "ansprechen" }], hilfen: { lot: true } },
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
};

export const SCHAUBILD_NAMEN = Object.keys(SCHAUBILDER);

export function gibtBild(name) {
  return name in SCHAUBILDER || name in FIGUREN;
}

export function schaubild(name) {
  return SCHAUBILDER[name] ? SCHAUBILDER[name]() : null;
}
