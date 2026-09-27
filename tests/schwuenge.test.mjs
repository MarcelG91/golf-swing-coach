// Tests für schwuenge.js (mehrere Schwünge in einem Video) und gesamtauswertung.js.
// Ein "langes Video" bauen wir aus den echten Testschwüngen: kurze Ruhepause
// (die Person steht still), dann ein Schwung, wieder Pause, nächster Schwung …
// Ausführen im Projektordner:  node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { erkennePhasen } from "../phasen.js";
import { findeSchwuenge, findeSchlagZeiten } from "../schwuenge.js";
import { gesamtauswertung } from "../gesamtauswertung.js";

const BILD = 1 / 30;

function lade(name) {
  const d = JSON.parse(fs.readFileSync(new URL(`./daten/${name}.json`, import.meta.url), "utf8"));
  const start = d.bilder[0].zeit;
  return {
    seitenverhaeltnis: d.breite / d.hoehe,
    // Zeiten auf 0 verschieben (hinten_amateur_b beginnt bei 13 s)
    bilder: d.bilder.map((b) => ({
      zeit: b.zeit - start,
      punkte: b.punkte ? b.punkte.map(([x, y]) => ({ x, y })) : null,
    })),
  };
}

// Hängt Schwünge hintereinander, vor jedem eine Pause.
// In der Pause geht die Haltung langsam vom Finish des letzten Schwungs in die
// Ansprechhaltung des nächsten über – wie beim echten Aufteen. Ein harter Schnitt
// wäre ein Sprung der Hände in einem Bild und sähe aus wie ein Abschwung.
// Gibt das lange Video und die Startzeit jedes Schwungs darin zurück.
function langesVideo(namen, pause = 3) {
  const bilder = [];
  const starts = [];
  let t = 0;
  for (const name of namen) {
    const clip = lade(name).bilder;
    const ziel = clip.find((b) => b.punkte).punkte;
    const vorher = bilder.findLast((b) => b.punkte)?.punkte ?? ziel;
    for (let p = 0; p < pause; p += BILD) {
      const anteil = p / pause; // 0 = alte Haltung, 1 = neue Haltung
      const punkte = ziel.map((z, k) => ({
        x: vorher[k].x + (z.x - vorher[k].x) * anteil,
        y: vorher[k].y + (z.y - vorher[k].y) * anteil,
      }));
      bilder.push({ zeit: t, punkte });
      t += BILD;
    }
    starts.push(t);
    for (const b of clip) bilder.push({ zeit: t + b.zeit, punkte: b.punkte });
    t += clip.at(-1).zeit + BILD;
  }
  return { bilder, starts };
}

test("Ein Schwung pro Video: gleiche Phasen wie bisher", () => {
  for (const name of ["faceon_profi", "faceon_amateur", "hinten_amateur_a", "hinten_amateur_b"]) {
    const { bilder, seitenverhaeltnis } = lade(name);
    const schwuenge = findeSchwuenge(bilder, seitenverhaeltnis);
    assert.equal(schwuenge.length, 1, `${name}: ${schwuenge.length} Schwünge gefunden`);
    const vorher = erkennePhasen(bilder, seitenverhaeltnis);
    for (const phase of ["ansprechen", "top", "treffmoment", "finish"]) {
      const abweichung = Math.abs(schwuenge[0].phasen[phase].zeit - vorher[phase].zeit);
      assert.ok(abweichung <= 0.05, `${name} ${phase}: ${abweichung.toFixed(2)} s Abweichung`);
    }
    assert.ok(schwuenge[0].sicher, `${name}: ${schwuenge[0].grund}`);
  }
});

test("Langes Video mit 3 Schlägen: alle 3 gefunden, Treffmomente stimmen", () => {
  const namen = ["faceon_amateur", "hinten_amateur_a", "hinten_amateur_b"];
  const { bilder, starts } = langesVideo(namen);
  const schwuenge = findeSchwuenge(bilder, 720 / 1280);
  assert.equal(schwuenge.length, 3);
  namen.forEach((name, i) => {
    const einzeln = lade(name);
    const soll = erkennePhasen(einzeln.bilder, einzeln.seitenverhaeltnis).treffmoment.zeit + starts[i];
    const ist = schwuenge[i].phasen.treffmoment.zeit;
    assert.ok(Math.abs(ist - soll) <= 0.05, `Schwung ${i + 1}: erwartet ${soll.toFixed(2)} s, erkannt ${ist.toFixed(2)} s`);
    assert.equal(schwuenge[i].nummer, i + 1);
  });
  assert.deepEqual(schwuenge.map((s) => s.ansicht), ["frontal", "hinten", "hinten"]);
});

test("Nur ruhiges Stehen: kein Schlag, verständliche Meldung statt Absturz", () => {
  const ruhe = lade("faceon_profi").bilder[0].punkte;
  const bilder = Array.from({ length: 90 }, (_, i) => ({ zeit: i * BILD, punkte: ruhe }));
  assert.deepEqual(findeSchlagZeiten(bilder), []);
  const schwuenge = findeSchwuenge(bilder);
  assert.equal(schwuenge.length, 1);
  // Ein "Schwung" ohne Bewegung darf nicht in die Gesamtauswertung
  assert.equal(schwuenge[0].sicher, false);
});

test("Gesamtauswertung: gleicher Schwung 3-mal → in allen 3 gleich bewertet", () => {
  const { bilder } = langesVideo(["hinten_amateur_a", "hinten_amateur_a", "hinten_amateur_a"]);
  const schwuenge = findeSchwuenge(bilder, 720 / 1280);
  assert.equal(schwuenge.length, 3);
  const [hinten] = gesamtauswertung(schwuenge);
  assert.equal(hinten.ansicht, "hinten");
  assert.equal(hinten.anzahl, 3);
  // Einzeln wird die Vorneigung als "verbessern" erkannt (siehe echte-schwuenge.test.mjs)
  const vorneigung = hinten.kennzahlen.find((k) => k.id === "vorneigungHalten");
  assert.equal(vorneigung.bewertung, "verbessern");
  assert.equal(vorneigung.zaehler.verbessern, 3);
  assert.ok(hinten.baustellen.some((k) => k.id === "vorneigungHalten"));
});

// Künstliche Schwünge für die Gesamtauswertung: nur das, was sie braucht
const kz = (id, bewertung, messwert, gewicht = 1) => ({ id, name: id, bewertung, messwert, wert: `${messwert}`, gewicht });
const schwung = (ansicht, kennzahlen, sicher = true) => ({ ansicht, kennzahlen, sicher });

test("Gesamtauswertung: Ansichten getrennt, unsichere Schwünge zählen nicht", () => {
  const ergebnis = gesamtauswertung([
    schwung("frontal", [kz("tempo", "gut", 3)]),
    schwung("hinten", [kz("tempo", "gut", 3.2)]),
    schwung("hinten", [kz("tempo", "verbessern", 9)], false), // Probeschwung
  ]);
  assert.deepEqual(ergebnis.map((g) => [g.ansicht, g.anzahl]), [["frontal", 1], ["hinten", 1]]);
  assert.equal(ergebnis[1].kennzahlen[0].bewertung, "gut");
});

test("Gesamtauswertung: ein Ausreißer ist keine Baustelle, ein häufiger Fehler schon", () => {
  const [g] = gesamtauswertung([
    schwung("frontal", [kz("kopf", "gut", 0.02, 2), kz("arm", "verbessern", 140)]),
    schwung("frontal", [kz("kopf", "gut", 0.03, 2), kz("arm", "verbessern", 145)]),
    schwung("frontal", [kz("kopf", "verbessern", 0.2, 2), kz("arm", "gut", 160)]),
  ]);
  const kopf = g.kennzahlen.find((k) => k.id === "kopf");
  const arm = g.kennzahlen.find((k) => k.id === "arm");
  assert.equal(kopf.bewertung, "gut"); // nur 1 von 3
  assert.equal(arm.bewertung, "verbessern"); // 2 von 3
  // Typisch = Median der Schwünge, die "verbessern" sind (140, 145) – nicht der gute mit 160
  assert.equal(arm.wert, "typisch 140");
  assert.match(arm.detail, /In 1 von 3 Schwüngen im Zielbereich · Spanne 140 bis 160/);
  assert.deepEqual(g.baustellen.map((k) => k.id), ["arm"]);
});

test("Gesamtauswertung: typischer Wert passt zur Bewertung (Fall aus dem Browsertest)", () => {
  // Profi senkt den Kopf leicht ab (gut), Amateur richtet sich auf (verbessern)
  const [g] = gesamtauswertung([
    schwung("frontal", [kz("kopfhoehe", "verbessern", 0.2)]),
    schwung("frontal", [kz("kopfhoehe", "gut", -0.22)]),
  ]);
  assert.equal(g.kennzahlen[0].bewertung, "verbessern");
  assert.equal(g.kennzahlen[0].wert, "typisch 0.2");
});
