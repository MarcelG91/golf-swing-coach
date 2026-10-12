// Tests für ampel.js: Farbe und Kurzwort des Live-Rahmens.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { ampel, WORT_GUT, WORT_NICHT_ERKANNT } from "../ampel.js";
import { findeSchwuenge } from "../schwuenge.js";

function echterSchwung(name) {
  const d = JSON.parse(fs.readFileSync(new URL(`./daten/${name}.json`, import.meta.url), "utf8"));
  const bilder = d.bilder.map((b) => ({ zeit: b.zeit, punkte: b.punkte ? b.punkte.map(([x, y]) => ({ x, y })) : null }));
  return findeSchwuenge(bilder, d.breite / d.hoehe)[0];
}

// Kennzahlen von Hand bauen: id bestimmt das Level, bewertung die Stufe
const k = (id, bewertung, messwert = 0) => ({ id, name: id, bewertung, messwert, gewicht: 1 });
const schwungMit = (...kennzahlen) => ({ kennzahlen, phasen: {} });

test("Profi-Schwung ist grün (alle Level)", () => {
  const profi = echterSchwung("faceon_profi");
  for (const level of ["einsteiger", "fortgeschritten", "koenner"]) {
    assert.deepEqual(ampel(profi, level), { farbe: "gruen", wort: WORT_GUT });
  }
});

test("Amateur-Schwung ist gelb und nennt die wichtigste Baustelle in höchstens 3 Wörtern", () => {
  const u = ampel(echterSchwung("faceon_amateur"), "koenner");
  assert.equal(u.farbe, "gelb");
  assert.ok(u.wort.split(" ").length <= 3, u.wort);
});

test("Stufen: eine kleine Abweichung grün, zwei kleine gelb, eine deutliche gelb, zwei deutliche rot", () => {
  assert.equal(ampel(schwungMit(k("tempo", "achtung")), "koenner").farbe, "gruen");
  assert.equal(ampel(schwungMit(k("tempo", "achtung"), k("gewicht", "achtung")), "koenner").farbe, "gelb");
  assert.equal(ampel(schwungMit(k("tempo", "verbessern", 5)), "koenner").farbe, "gelb");
  assert.equal(ampel(schwungMit(k("tempo", "verbessern", 5), k("gewicht", "verbessern")), "koenner").farbe, "rot");
});

test("Unsichere Kennzahlen zählen nicht", () => {
  assert.equal(ampel(schwungMit(k("tempo", "unsicher"), k("gewicht", "unsicher")), "koenner").farbe, "gruen");
});

test("Level: Könner-Kennzahlen färben den Rahmen eines Einsteigers nicht", () => {
  const s = schwungMit(k("kopfhoehe", "verbessern", 0.2), k("hueftBall", "verbessern"));
  assert.equal(ampel(s, "einsteiger").farbe, "gruen");
  assert.equal(ampel(s, "koenner").farbe, "rot");
});

test("Rot nennt das Wort der wichtigsten Baustelle", () => {
  const u = ampel(schwungMit(k("tempo", "verbessern", 5), k("gewicht", "verbessern")), "einsteiger");
  assert.equal(u.farbe, "rot");
  assert.equal(u.wort, "Flüssig schwingen"); // Tempo wiegt bei gleicher Stufe zuerst (Reihenfolge)
});

test("Nicht auswertbarer Schwung ist grau", () => {
  assert.deepEqual(ampel({ phasen: { fehler: "x" } }, "einsteiger"), { farbe: "grau", wort: WORT_NICHT_ERKANNT });
  assert.deepEqual(ampel(null, "einsteiger"), { farbe: "grau", wort: WORT_NICHT_ERKANNT });
});
