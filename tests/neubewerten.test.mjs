// Tests für "Alte Schwünge neu bewerten" (bewerteNeu, geaenderteStufen, GRENZEN_VERSION).
// Ausführen im Projektordner:  node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { findeSchwuenge, bewerteNeu, geaenderteStufen, GRENZEN_VERSION } from "../schwuenge.js";
import { clipGrenzen, schwungZumSpeichern } from "../speicher.js";

const NAMEN = ["faceon_profi", "faceon_amateur", "hinten_amateur_a", "hinten_amateur_b"];

// Echten Testschwung laden, auswerten und wie die App speichern
function gespeichert(name) {
  const d = JSON.parse(fs.readFileSync(new URL(`./daten/${name}.json`, import.meta.url), "utf8"));
  const bilder = d.bilder.map((b) => ({ zeit: b.zeit, punkte: b.punkte ? b.punkte.map(([x, y]) => ({ x, y })) : null }));
  const [schwung] = findeSchwuenge(bilder, d.breite / d.hoehe);
  const original = { ...schwung, datei: { name: `${name}.mp4` } };
  return { original, ...schwungZumSpeichern(original, clipGrenzen(original)) };
}

test("Neue Schwünge tragen die aktuelle Grenzen-Version", () => {
  for (const name of NAMEN) assert.equal(gespeichert(name).schwung.grenzenVersion, GRENZEN_VERSION, name);
  assert.ok(Number.isInteger(GRENZEN_VERSION) && GRENZEN_VERSION >= 2);
});

test("Neu bewertet mit denselben Grenzen = nichts ändert sich", () => {
  for (const name of NAMEN) {
    const { schwung, posedaten } = gespeichert(name);
    const neu = bewerteNeu(schwung, posedaten);
    assert.deepEqual(neu.kennzahlen, schwung.kennzahlen, `${name}: Kennzahlen`);
    assert.deepEqual(geaenderteStufen(schwung.kennzahlen, neu.kennzahlen), [], `${name}: Stufen`);
    assert.equal(neu.ansicht, schwung.ansicht);
    assert.equal(neu.grenzenVersion, GRENZEN_VERSION);
  }
});

test("Ein alter Schwung (Hüfte 12 % war früher grün) wird neu gelb", () => {
  // Der Amateur frontal hat ca. 11 % Hüftverschiebung. Wir bauen ihn so um, wie ihn Version 0.47 gespeichert hätte.
  const { schwung, posedaten } = gespeichert("faceon_amateur");
  const alt = schwung.kennzahlen.map((k) => (k.id === "hueftSway" ? { ...k, bewertung: "gut" } : k));
  const neu = bewerteNeu({ ...schwung, kennzahlen: alt }, posedaten);
  const aenderungen = geaenderteStufen(alt, neu.kennzahlen);
  // Der Amateur ist bei 0.48.0 schon mit 11 % "achtung" gespeichert worden – also nur der künstlich alte Wert ändert sich.
  assert.deepEqual(aenderungen.map((a) => [a.name, a.vorher, a.nachher]), [["Hüfte im Rückschwung", "gut", "achtung"]]);
});

test("Nur die berechneten Felder kommen zurück – nichts, was Notizen, Coach oder Phasen überschreibt", () => {
  const { schwung, posedaten } = gespeichert("faceon_profi");
  const neu = bewerteNeu(schwung, posedaten);
  assert.deepEqual(Object.keys(neu).sort(), ["ansicht", "bewertung", "grenzenVersion", "kennzahlen", "technik"]);
});

test("Fehlende Phasen oder Posedaten: klare Fehlermeldung statt falscher Werte", () => {
  const { schwung, posedaten } = gespeichert("faceon_profi");
  assert.throws(() => bewerteNeu({ ...schwung, phasen: undefined }, posedaten), /fehlen/);
  assert.throws(() => bewerteNeu(schwung, []), /fehlen/);
  assert.throws(() => bewerteNeu(schwung, undefined), /fehlen/);
});

test("geaenderteStufen ignoriert Kennzahlen, die es nur auf einer Seite gibt", () => {
  const alt = [{ id: "a", name: "A", bewertung: "gut" }, { id: "b", name: "B", bewertung: "gut" }];
  const neu = [{ id: "a", name: "A", bewertung: "achtung" }, { id: "c", name: "C", bewertung: "gut" }];
  assert.deepEqual(geaenderteStufen(alt, neu), [{ name: "A", vorher: "gut", nachher: "achtung" }]);
  assert.deepEqual(geaenderteStufen(undefined, neu), []);
});
