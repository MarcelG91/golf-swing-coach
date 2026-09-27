// Tests mit echten Schwüngen.
// Die Posedaten in tests/daten/ wurden mit derselben Pose-Erkennung wie in der App
// aus echten Videos erzeugt (Quellen: tests/daten/QUELLEN.md). Die erwarteten
// Zeitpunkte wurden Bild für Bild am Video geprüft. Beim Ansprechen ist der
// "richtige" Moment auch mit bloßem Auge nur auf ca. ±0,1 s genau bestimmbar,
// weil der Rückschwung sehr langsam beginnt.
// Ausführen im Projektordner:  node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { erkennePhasen } from "../phasen.js";
import { bewerteSchwung } from "../kennzahlen.js";

function lade(name) {
  const d = JSON.parse(fs.readFileSync(new URL(`./daten/${name}.json`, import.meta.url), "utf8"));
  // Kompaktes Format [x, y] zurück in {x, y} umwandeln
  const bilder = d.bilder.map((b) => ({
    zeit: b.zeit,
    punkte: b.punkte ? b.punkte.map(([x, y]) => ({ x, y })) : null,
  }));
  const seitenverhaeltnis = d.breite / d.hoehe;
  const phasen = erkennePhasen(bilder, seitenverhaeltnis);
  const bewertung = bewerteSchwung(bilder, phasen, seitenverhaeltnis);
  return { phasen, bewertung };
}

function pruefePhasen(phasen, soll) {
  assert.ok(!phasen.fehler, phasen.fehler);
  const toleranz = { ansprechen: 0.12, top: 0.1, treffmoment: 0.1, finish: 0.25 };
  for (const [name, zeit] of Object.entries(soll)) {
    const ist = phasen[name].zeit;
    assert.ok(Math.abs(ist - zeit) <= toleranz[name], `${name}: erwartet ${zeit} s, erkannt ${ist.toFixed(2)} s`);
  }
}

const kennzahl = (bewertung, name) => bewertung.kennzahlen.find((k) => k.name === name);

test("Profi frontal: Phasen stimmen, alles im grünen Bereich", () => {
  const { phasen, bewertung } = lade("faceon_profi");
  pruefePhasen(phasen, { ansprechen: 1.6, top: 2.33, treffmoment: 2.53, finish: 3.13 });
  assert.equal(bewertung.ansicht, "frontal");
  for (const k of bewertung.kennzahlen) assert.equal(k.bewertung, "gut", `${k.name}: ${k.wert}`);
});

test("Amateur frontal: Aufrichten, Kopf Richtung Ziel und Gewicht hinten werden erkannt", () => {
  const { phasen, bewertung } = lade("faceon_amateur");
  pruefePhasen(phasen, { ansprechen: 1.67, top: 2.3, treffmoment: 2.53, finish: 3.0 });
  assert.equal(bewertung.ansicht, "frontal");
  assert.equal(kennzahl(bewertung, "Kopfhöhe").bewertung, "verbessern");
  assert.notEqual(kennzahl(bewertung, "Kopf seitlich").bewertung, "gut");
  assert.notEqual(kennzahl(bewertung, "Gewichtsverlagerung").bewertung, "gut");
});

test("Amateur von hinten (A): verlorene Vorneigung wird erkannt", () => {
  const { phasen, bewertung } = lade("hinten_amateur_a");
  pruefePhasen(phasen, { ansprechen: 0.7, top: 1.8, treffmoment: 2.2, finish: 3.33 });
  assert.equal(bewertung.ansicht, "hinten");
  assert.equal(kennzahl(bewertung, "Vorneigung halten").bewertung, "verbessern");
});

test("Amateur von hinten (B): Vorneigung gut, Hüfte schiebt zum Ball", () => {
  const { phasen, bewertung } = lade("hinten_amateur_b");
  pruefePhasen(phasen, { ansprechen: 14.15, top: 14.9, treffmoment: 15.17, finish: 15.85 });
  assert.equal(bewertung.ansicht, "hinten");
  assert.equal(kennzahl(bewertung, "Vorneigung halten").bewertung, "gut");
  assert.notEqual(kennzahl(bewertung, "Hüfte Richtung Ball").bewertung, "gut");
});
