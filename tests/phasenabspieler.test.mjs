// Tests für phasenabspieler.js: gleiche Abschnittsdauer bei beiden Schwüngen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { planeAbschnitte, abschnittFuerZeit } from "../phasenabspieler.js";

const phasen = (a, t, tr, f) => ({ ansprechen: { zeit: a }, top: { zeit: t }, treffmoment: { zeit: tr }, finish: { zeit: f } });

test("Gleiche Schwünge: überall die gewünschte Geschwindigkeit", () => {
  const p = phasen(1, 2, 2.3, 3.3);
  for (const a of planeAbschnitte(p, p, 0.5)) assert.deepEqual(a.rate, [0.5, 0.5]);
});

test("Verschieden schnelle Schwünge: jeder Abschnitt dauert bei beiden gleich lang", () => {
  const langsam = phasen(1, 2.2, 2.6, 3.8); // Rückschwung 1,2 s
  const schnell = phasen(0.5, 1.3, 1.6, 2.6); // Rückschwung 0,8 s
  const abschnitte = planeAbschnitte(langsam, schnell, 1);
  assert.equal(abschnitte.length, 3);
  for (const a of abschnitte) {
    const dauerA = (a.bis[0] - a.von[0]) / a.rate[0];
    const dauerB = (a.bis[1] - a.von[1]) / a.rate[1];
    assert.ok(Math.abs(dauerA - dauerB) < 1e-9, `${dauerA} gegen ${dauerB}`);
  }
  // Der langsamere Schwung wird beschleunigt, der schnellere gebremst
  assert.ok(abschnitte[0].rate[0] > 1 && abschnitte[0].rate[1] < 1);
});

test("Extreme Unterschiede bleiben in den Grenzen des Browsers", () => {
  const a = phasen(0, 3, 3.1, 4); // Rückschwung 3 s
  const b = phasen(0, 0.3, 0.6, 1); // 0,3 s
  for (const abschnitt of planeAbschnitte(a, b, 1)) {
    for (const r of abschnitt.rate) assert.ok(r >= 0.25 && r <= 2, `Rate ${r}`);
  }
});

test("Fehlende oder falsch geordnete Phasen: kein Plan", () => {
  assert.equal(planeAbschnitte(phasen(1, 2, 2.3, 3.3), { ansprechen: { zeit: 1 } }, 1), null);
  assert.equal(planeAbschnitte(phasen(1, 2, 2.3, 3.3), phasen(1, 3, 2, 4), 1), null);
  assert.equal(planeAbschnitte(null, null, 1), null);
});

test("abschnittFuerZeit: findet den Abschnitt zur Zeit im Clip", () => {
  const ab = planeAbschnitte(phasen(1, 2, 2.3, 3.3), phasen(0, 1, 1.4, 2.4), 1);
  assert.equal(abschnittFuerZeit(ab, 0, 1.0), 0);
  assert.equal(abschnittFuerZeit(ab, 0, 2.1), 1);
  assert.equal(abschnittFuerZeit(ab, 1, 1.2), 1);
  assert.equal(abschnittFuerZeit(ab, 0, 9), 2);
  assert.equal(abschnittFuerZeit(ab, 0, 0), 0);
});
