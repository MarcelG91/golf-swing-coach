// Tests für speicher.js, Teil 1 (Umrechnen). Die Datenbank selbst gibt es nur im
// Browser → dafür gibt es tests/speicher-browser.html.
// Wichtigste Frage hier: Kann die App einen gespeicherten Schwung später genauso
// anzeigen und neu bewerten wie direkt nach der Analyse?
// Ausführen im Projektordner:  node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { findeSchwuenge } from "../schwuenge.js";
import { gesamtauswertung } from "../gesamtauswertung.js";
import { bewerteSchwung } from "../kennzahlen.js";
import { bewerteTechnik } from "../technik.js";
import { clipGrenzen, schwungZumSpeichern } from "../speicher.js";

const BILD = 1 / 30;
// Die Testdaten haben gerundete Zeiten (0,0333 statt 1/30) → 1 ms Spielraum
const GENAU = 0.001;
const NAMEN = ["faceon_profi", "faceon_amateur", "hinten_amateur_a", "hinten_amateur_b"];

// Einen echten Testschwung laden und wie in der App auswerten
function schwungAus(name) {
  const d = JSON.parse(fs.readFileSync(new URL(`./daten/${name}.json`, import.meta.url), "utf8"));
  const bilder = d.bilder.map((b) => ({
    zeit: b.zeit,
    punkte: b.punkte ? b.punkte.map(([x, y]) => ({ x, y })) : null,
  }));
  const [schwung] = findeSchwuenge(bilder, d.breite / d.hoehe);
  return { ...schwung, datei: { name: `${name}.mp4` } };
}

function speichere(name, versatz = 0) {
  const original = schwungAus(name);
  const grenzen = clipGrenzen(original);
  return { original, grenzen, ...schwungZumSpeichern(original, { ...grenzen, versatz }) };
}

test("Clip: 1 s vor dem Ansprechen bis 1 s nach dem Finish, im 1/30-s-Raster", () => {
  for (const name of NAMEN) {
    const { original, grenzen } = speichere(name);
    const { ansprechen, finish } = original.phasen;
    assert.ok(grenzen.start >= original.bilder[0].zeit - GENAU, `${name}: Start vor dem Video`);
    assert.ok(grenzen.start <= ansprechen.zeit - 0.9 || grenzen.start <= original.bilder[0].zeit + GENAU, `${name}: Start zu spät`);
    assert.ok(grenzen.ende >= finish.zeit + 0.9 || grenzen.ende >= original.bilder.at(-1).zeit - GENAU, `${name}: Ende zu früh`);
    assert.ok(Math.abs(grenzen.start / BILD - Math.round(grenzen.start / BILD)) < 1e-6, `${name}: Start nicht im Raster`);
  }
});

test("Posedaten beginnen bei 0 s, lückenlos im Raster; die Phasen liegen im Clip", () => {
  for (const name of NAMEN) {
    const { posedaten, schwung, grenzen } = speichere(name);
    // Bild i liegt genau bei i/30 s – so findet app.js es wieder (gespeichertesBild)
    posedaten.forEach((b, i) => assert.ok(Math.abs(b.zeit - i * BILD) < 1e-9, `${name}: Bild ${i} bei ${b.zeit}`));
    assert.equal(posedaten.length, Math.round((grenzen.ende - grenzen.start) / BILD) + 1);
    const { ansprechen, top, treffmoment, finish } = schwung.phasen;
    assert.ok(ansprechen.zeit < top.zeit && top.zeit < treffmoment.zeit && treffmoment.zeit < finish.zeit);
    assert.ok(ansprechen.zeit >= 0 && finish.zeit <= posedaten.at(-1).zeit, `${name}: Phase außerhalb`);
  }
});

test("Phasen sind um genau den Clip-Start verschoben", () => {
  for (const name of NAMEN) {
    const { original, schwung, grenzen } = speichere(name);
    for (const p of ["ansprechen", "top", "treffmoment", "finish"]) {
      assert.ok(Math.abs(schwung.phasen[p].zeit - (original.phasen[p].zeit - grenzen.start)) < GENAU, `${name}: ${p}`);
    }
  }
});

test("Versatz: leere Bilder vorne, alles andere rückt nach hinten", () => {
  const ohne = speichere("faceon_amateur");
  const mit = speichere("faceon_amateur", 0.1); // 0,1 s = 3 Bilder
  assert.equal(mit.posedaten.length, ohne.posedaten.length + 3);
  assert.deepEqual(mit.posedaten.slice(0, 3).map((b) => b.punkte), [null, null, null]);
  assert.deepEqual(mit.posedaten[3].punkte, ohne.posedaten[0].punkte);
  assert.ok(Math.abs(mit.schwung.phasen.top.zeit - ohne.schwung.phasen.top.zeit - 0.1) < 1e-6);
  assert.equal(mit.schwung.phasen.top.index, ohne.schwung.phasen.top.index); // leere Bilder zählen nicht
});

test("Neu berechnet aus den gespeicherten Daten = gleiche Kennzahlen wie vorher", () => {
  // Das braucht Etappe 10: Alte Schwünge mit verbesserten Formeln neu auswerten
  for (const name of NAMEN) {
    const { original, schwung, posedaten } = speichere(name);
    const sv = schwung.seitenverhaeltnis;
    const neu = bewerteSchwung(posedaten, schwung.phasen, sv);
    assert.deepEqual(neu.kennzahlen, original.bewertung.kennzahlen, `${name}: kennzahlen.js`);
    const technik = bewerteTechnik(posedaten, schwung.phasen, sv, neu.ansicht);
    assert.deepEqual(technik.kennzahlen, original.technik.kennzahlen, `${name}: technik.js`);
  }
});

test("Speicherbar (structuredClone wie IndexedDB) und klein genug", () => {
  for (const name of NAMEN) {
    const { schwung, posedaten } = speichere(name);
    assert.deepEqual(structuredClone(schwung), schwung);
    const kb = JSON.stringify(schwung).length / 1000;
    assert.ok(kb < 50, `${name}: Schwung-Eintrag ${kb.toFixed(0)} KB`);
    const kbPose = JSON.stringify(posedaten).length / 1000;
    assert.ok(kbPose < 250, `${name}: Posedaten ${kbPose.toFixed(0)} KB`);
  }
});

test("Gesamtauswertung aus gespeicherten Schwüngen = aus den Originalen", () => {
  const gespeichert = NAMEN.map((name) => speichere(name));
  assert.deepEqual(
    gesamtauswertung(gespeichert.map((g) => g.schwung)),
    gesamtauswertung(gespeichert.map((g) => g.original))
  );
});
