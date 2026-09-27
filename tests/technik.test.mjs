// Tests für technik.js (Arme, Oberkörperhaltung, Drehung).
//
// 1. Die echten Testschwünge aus tests/daten/ müssen plausibel bewertet werden.
// 2. Gespiegelte Videos (= Linkshänder) müssen dieselben Werte ergeben.
// 3. In den Profi-Schwung werden gezielt Fehler "eingebaut" (z. B. ein gebeugter
//    Arm im Treffmoment). Die App muss genau diese Fehler finden.
// Ausführen im Projektordner:  node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { erkennePhasen } from "../phasen.js";
import { bewerteSchwung } from "../kennzahlen.js";
import { bewerteTechnik, schaetzeDrehung, wichtigsteBaustellen, ordneEin } from "../technik.js";

function lade(name) {
  const d = JSON.parse(fs.readFileSync(new URL(`./daten/${name}.json`, import.meta.url), "utf8"));
  const bilder = d.bilder.map((b) => ({
    zeit: b.zeit,
    punkte: b.punkte ? b.punkte.map(([x, y]) => ({ x, y })) : null,
  }));
  return { bilder, seitenverhaeltnis: d.breite / d.hoehe };
}

function analysiere({ bilder, seitenverhaeltnis }) {
  const phasen = erkennePhasen(bilder, seitenverhaeltnis);
  assert.ok(!phasen.fehler, phasen.fehler);
  const bewertung = bewerteSchwung(bilder, phasen, seitenverhaeltnis);
  const technik = bewerteTechnik(bilder, phasen, seitenverhaeltnis, bewertung.ansicht);
  const k = (id) => technik.kennzahlen.find((x) => x.id === id);
  return { phasen, bewertung, technik, k };
}

// Spiegelt das Video links ↔ rechts. Aus einem Rechtshänder wird so ein Linkshänder.
// Die Pose-Erkennung würde dann auch "links" und "rechts" am Körper tauschen.
const PAARE = [[1, 4], [2, 5], [3, 6], [7, 8], [9, 10], [11, 12], [13, 14], [15, 16],
  [17, 18], [19, 20], [21, 22], [23, 24], [25, 26], [27, 28], [29, 30], [31, 32]];
function spiegeln({ bilder, seitenverhaeltnis }) {
  const tausch = Array.from({ length: 33 }, (_, i) => i);
  for (const [a, b] of PAARE) { tausch[a] = b; tausch[b] = a; }
  return {
    seitenverhaeltnis,
    bilder: bilder.map((b) => ({
      zeit: b.zeit,
      punkte: b.punkte ? tausch.map((j) => ({ x: 1 - b.punkte[j].x, y: b.punkte[j].y })) : null,
    })),
  };
}

// Verändert Körperpunkte in allen Bildern rund um einen Zeitpunkt (±0,07 s).
// aendere(punkt, index) bekommt Koordinaten in Bildhöhen (wie in technik.js).
function baueFehlerEin({ bilder, seitenverhaeltnis }, zeit, aendere, spanne = 0.07) {
  const sv = seitenverhaeltnis;
  return {
    seitenverhaeltnis,
    bilder: bilder.map((b) => {
      if (!b.punkte || Math.abs(b.zeit - zeit) > spanne) return b;
      const punkte = b.punkte.map((p) => ({ x: p.x * sv, y: p.y }));
      aendere(punkte);
      return { zeit: b.zeit, punkte: punkte.map((p) => ({ x: p.x / sv, y: p.y })) };
    }),
  };
}

const mitte = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const rumpfLaenge = (p) => Math.hypot(
  mitte(p[11], p[12]).x - mitte(p[23], p[24]).x,
  mitte(p[11], p[12]).y - mitte(p[23], p[24]).y
);
const verschiebe = (punkte, indizes, dx) => { for (const i of indizes) punkte[i].x += dx; };
const OBERKOERPER = [...Array(15).keys()]; // Kopf, Schultern, Ellbogen (0–14), ohne Handgelenke
const HUEFTE_BEINE = [23, 24, 25, 26, 27, 28, 29, 30, 31, 32];

// ---------------------------------------------------------------
// 1. Echte Schwünge
// ---------------------------------------------------------------
test("Profi frontal: Arme, Oberkörper und Drehung im grünen Bereich", () => {
  const { technik, k } = analysiere(lade("faceon_profi"));
  assert.equal(technik.rechtshaender, true);
  for (const kz of technik.kennzahlen) assert.equal(kz.bewertung, "gut", `${kz.name}: ${kz.wert}`);
  assert.ok(k("schulterdrehung").messwert >= 80, `Drehung ${k("schulterdrehung").messwert}`);
  assert.equal(k("fuehrungsarmTreff").name, "Linker Arm im Treffmoment");
  assert.equal(technik.selbstChecks[0].phase, "top");
});

test("Amateur frontal: zu wenig Schulterdrehung, Arme heben statt drehen", () => {
  const { k } = analysiere(lade("faceon_amateur"));
  assert.notEqual(k("schulterdrehung").bewertung, "gut");
  assert.notEqual(k("armschwungTop").bewertung, "gut");
  assert.equal(k("fuehrungsarmTreff").bewertung, "gut");
});

test("Von hinten: Armhaltung und Vorneigung beim Ansprechen", () => {
  const a = analysiere(lade("hinten_amateur_a"));
  assert.equal(a.k("armeAnsprechen").bewertung, "gut");
  assert.equal(a.k("vorneigungAnsprechen").bewertung, "gut");
  // Amateur B greift nach dem Ball und steht recht aufrecht
  const b = analysiere(lade("hinten_amateur_b"));
  assert.notEqual(b.k("armeAnsprechen").bewertung, "gut");
  assert.ok(b.k("armeAnsprechen").wert.startsWith("+"));
  assert.notEqual(b.k("vorneigungAnsprechen").bewertung, "gut");
  // Von hinten gibt es keine Werte, die nur von vorne messbar sind
  assert.equal(b.k("schulterdrehung"), undefined);
});

// ---------------------------------------------------------------
// 2. Linkshänder (gespiegeltes Video)
// ---------------------------------------------------------------
for (const name of ["faceon_profi", "faceon_amateur", "hinten_amateur_a", "hinten_amateur_b"]) {
  test(`Gespiegelt (Linkshänder) gleiche Bewertung: ${name}`, () => {
    const original = analysiere(lade(name));
    const gespiegelt = analysiere(spiegeln(lade(name)));
    assert.equal(gespiegelt.technik.rechtshaender, !original.technik.rechtshaender);
    for (const kz of original.technik.kennzahlen) {
      const g = gespiegelt.k(kz.id);
      assert.equal(g.bewertung, kz.bewertung, kz.id);
      assert.equal(g.wert, kz.wert, kz.id);
    }
  });
}

test("Linkshänder bekommen die richtigen Seiten in den Texten", () => {
  const { k } = analysiere(spiegeln(lade("faceon_profi")));
  assert.equal(k("fuehrungsarmTreff").name, "Rechter Arm im Treffmoment");
});

// ---------------------------------------------------------------
// 3. Eingebaute Fehler im Profi-Schwung
// ---------------------------------------------------------------
const profi = lade("faceon_profi");
const profiPhasen = erkennePhasen(profi.bilder, profi.seitenverhaeltnis);
const zielRechts = 1; // beim Profi-Video liegt das Ziel rechts im Bild

test("Fehler: gebeugter linker Arm im Treffmoment", () => {
  const video = baueFehlerEin(profi, profiPhasen.treffmoment.zeit, (p) => {
    // Ellbogen so zur Seite setzen, dass am Ellbogen ein Winkel von 125° entsteht
    const s = p[11], h = p[15], m = mitte(s, h);
    const laenge = Math.hypot(h.x - s.x, h.y - s.y);
    const abstand = laenge / 2 / Math.tan((125 / 2) * (Math.PI / 180));
    p[13] = { x: m.x + ((h.y - s.y) / laenge) * abstand, y: m.y - ((h.x - s.x) / laenge) * abstand };
  });
  const { k, phasen } = analysiere(video);
  assert.equal(phasen.treffmoment.zeit, profiPhasen.treffmoment.zeit);
  assert.equal(k("fuehrungsarmTreff").bewertung, "verbessern", k("fuehrungsarmTreff").wert);
});

test("Fehler: Oberkörper neigt sich am Top zum Ziel", () => {
  const video = baueFehlerEin(profi, profiPhasen.top.zeit, (p) =>
    verschiebe(p, OBERKOERPER, 0.4 * rumpfLaenge(p) * zielRechts));
  const { k } = analysiere(video);
  assert.equal(k("oberkoerperTop").bewertung, "verbessern", k("oberkoerperTop").wert);
});

test("Fehler: Oberkörper vor dem Ball im Treffmoment", () => {
  const video = baueFehlerEin(profi, profiPhasen.treffmoment.zeit, (p) =>
    verschiebe(p, OBERKOERPER, 0.3 * rumpfLaenge(p) * zielRechts));
  const { k } = analysiere(video);
  assert.equal(k("oberkoerperTreff").bewertung, "verbessern", k("oberkoerperTreff").wert);
});

test("Fehler: Hüfte schiebt im Rückschwung zur Seite (Sway)", () => {
  const video = baueFehlerEin(profi, profiPhasen.top.zeit, (p) =>
    verschiebe(p, HUEFTE_BEINE, -0.35 * rumpfLaenge(p) * zielRechts));
  const { k } = analysiere(video);
  assert.equal(k("hueftSway").bewertung, "verbessern", k("hueftSway").wert);
});

test("Fehler: Schultern drehen am Top kaum", () => {
  const ansprechen = profi.bilder.find((b) => b.zeit === profiPhasen.ansprechen.zeit).punkte;
  const breiteAnsprechen = Math.abs(ansprechen[11].x - ansprechen[12].x) * profi.seitenverhaeltnis;
  const video = baueFehlerEin(profi, profiPhasen.top.zeit, (p) => {
    const m = mitte(p[11], p[12]);
    p[11].x = m.x + 0.48 * breiteAnsprechen * zielRechts;
    p[12].x = m.x - 0.48 * breiteAnsprechen * zielRechts;
  });
  const { k } = analysiere(video);
  assert.equal(k("schulterdrehung").bewertung, "verbessern", k("schulterdrehung").wert);
  // Die Hände sind beim Profi nicht hoch → kein "Arme heben statt drehen"
  assert.equal(k("armschwungTop").bewertung, "gut");
});

test("Fehler von hinten: Hände weit vor den Schultern (nach dem Ball greifen)", () => {
  const hinten = lade("hinten_amateur_a");
  // Körper (ohne Hände) in allen Bildern vom Ball weg verschieben
  const video = baueFehlerEin(hinten, 0, (p) =>
    verschiebe(p, [...OBERKOERPER, ...HUEFTE_BEINE], -0.5 * rumpfLaenge(p)), 1e9);
  const { k } = analysiere(video);
  assert.equal(k("armeAnsprechen").bewertung, "verbessern", k("armeAnsprechen").wert);
});

// ---------------------------------------------------------------
// 4. Bausteine
// ---------------------------------------------------------------
test("Schulterdrehung aus der Breite: plausibel und stetig", () => {
  assert.equal(schaetzeDrehung(1.05), null);
  assert.ok(Math.abs(schaetzeDrehung(0.45) - 90) < 1);
  let vorher = 0;
  for (let r = 0.99; r > -0.5; r -= 0.05) {
    const d = schaetzeDrehung(r);
    assert.ok(d > vorher, `nicht steigend bei ${r}`);
    vorher = d;
  }
});

test("Wichtigste Baustellen: erst verbessern, dann achtung, Grundlagen zuerst", () => {
  const liste = [
    { name: "Tempo", bewertung: "verbessern" }, // Gewicht 1 → 2 Punkte
    { name: "A", bewertung: "achtung", gewicht: 3 }, // 3 Punkte
    { name: "B", bewertung: "gut", gewicht: 3 },
    { name: "Vorneigung halten", bewertung: "verbessern" }, // Gewicht 2,5 → 5 Punkte
    { name: "C", bewertung: "achtung", gewicht: 2 }, // 2 Punkte, später in der Liste als Tempo
  ].map(ordneEin);
  assert.deepEqual(wichtigsteBaustellen(liste).map((k) => k.name), ["Vorneigung halten", "A", "Tempo"]);
  assert.deepEqual(wichtigsteBaustellen([{ name: "X", bewertung: "gut" }]), []);
});
