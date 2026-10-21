// Tests für streuung.js (Gleichmäßigkeit von Schwung zu Schwung).
// Ausführen im Projektordner:  node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import { standardabweichung, streuung, streuungJeSitzung, streuungTrend, MIN_SCHWUENGE, GRENZE_GUT, GRENZE_ACHTUNG } from "../streuung.js";
import { SKALA_IDS, skalenInfo } from "../tipps.js";
import { gesamtauswertung } from "../gesamtauswertung.js";

const naeher = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

test("Standardabweichung: bekanntes Beispiel, ab 2 Werten", () => {
  naeher(standardabweichung([2, 4, 4, 4, 5, 5, 7, 9]), Math.sqrt(32 / 7)); // Stichprobe (n − 1)
  assert.equal(standardabweichung([5]), null);
  assert.equal(standardabweichung([3, 3, 3, 3]), 0);
});

test("Streuung braucht mindestens 4 Werte und eine Skala", () => {
  assert.equal(MIN_SCHWUENGE, 4);
  assert.equal(streuung("tempo", [3, 3, 3]), null);
  assert.equal(streuung("armschwungTop", [1, 2, 3, 4, 5]), null, "armschwungTop hat keine Skala");
  assert.equal(streuung("tempo", [3, 3, NaN, null, undefined]), null, "ungültige Werte zählen nicht mit");
  assert.ok(streuung("tempo", [3, 3, 3, 3, NaN]), "NaN wird übersprungen, vier gültige Werte bleiben");
});

test("Ampel: Streuung im Verhältnis zur Balkenbreite (eigene Festlegung)", () => {
  const breite = skalenInfo("vorneigungAnsprechen").breite; // 50 Grad
  const mit = (sd) => streuung("vorneigungAnsprechen", [30 - sd, 30 + sd, 30 - sd, 30 + sd]); // Stichproben-SD ≈ sd · 1,155
  const sdFaktor = Math.sqrt(4 / 3);
  assert.equal(mit(0.5 * breite * GRENZE_GUT / sdFaktor).stufe, "gut");
  assert.equal(mit(1.2 * breite * GRENZE_GUT / sdFaktor).stufe, "achtung");
  assert.equal(mit(1.2 * breite * GRENZE_ACHTUNG / sdFaktor).stufe, "verbessern");
});

test("Einheiten: Prozent-Kennzahlen werden in Prozentpunkten angezeigt", () => {
  const s = streuung("kopfhoehe", [0.0, 0.1, 0.0, 0.1]); // Messwerte als Anteil, Anzeige in %
  naeher(s.sd, standardabweichung([0, 0.1, 0, 0.1]) * 100, 1e-9);
  assert.match(s.text, /^±\d+(,\d)? %$/);
  assert.match(streuung("tempo", [2.6, 3.0, 3.4, 3.0]).text, /^±0,\d : 1$/);
  assert.match(streuung("vorneigungAnsprechen", [30, 36, 28, 33]).text, /^±\d(,\d)?°$/);
});

test("Alle Kennzahlen mit Skala lassen sich berechnen", () => {
  for (const id of SKALA_IDS) assert.ok(streuung(id, [1, 2, 3, 4]), id);
});

function schwung(sitzungId, nummer, messwert, extra = {}) {
  return { id: `${sitzungId}-${nummer}`, sitzungId, datum: "2026-10-01", sicher: true, kennzahlen: [{ id: "tempo", messwert, bewertung: "gut" }], ...extra };
}

test("Je Sitzung: gruppiert, älteste zuerst, Sitzungen mit zu wenigen Schwüngen fehlen", () => {
  const liste = [
    ...[3, 3.2, 2.8, 3].map((w, i) => schwung(1, i + 1, w)),
    ...[3, 3.4].map((w, i) => schwung(2, i + 1, w)), // nur 2 Schwünge → keine Streuung
    ...[3, 3.4, 2.6, 3.0, 3.2].map((w, i) => schwung(3, i + 1, w)),
  ];
  const s = streuungJeSitzung(liste, "tempo");
  assert.deepEqual(s.map((x) => [x.sitzungId, x.anzahl]), [[1, 4], [3, 5]]);
  assert.equal(streuungJeSitzung(liste, "hueftSway").length, 0, "Kennzahl fehlt überall");
});

test("Unsichere Kennzahlen und fehlende Messwerte zählen nicht", () => {
  const liste = [3, 3, 3, 3].map((w, i) => schwung(1, i + 1, w));
  liste[0].kennzahlen[0].bewertung = "unsicher";
  assert.equal(streuungJeSitzung(liste, "tempo").length, 0, "nur noch 3 gültige Werte");
  liste[1].kennzahlen[0].messwert = null;
  assert.equal(streuungJeSitzung(liste, "tempo").length, 0);
});

test("Trend: neueste Sitzung gegen den Schnitt der bis zu 3 davor, Schwelle 15 %", () => {
  const sitzung = (sd) => ({ sd });
  assert.equal(streuungTrend([sitzung(1)]), null);
  assert.equal(streuungTrend([sitzung(1), sitzung(0.7)]), "gleichmaessiger");
  assert.equal(streuungTrend([sitzung(1), sitzung(1.3)]), "unruhiger");
  assert.equal(streuungTrend([sitzung(1), sitzung(1.1)]), "gleich");
  assert.equal(streuungTrend([sitzung(9), sitzung(1), sitzung(1), sitzung(1), sitzung(0.8)]), "gleichmaessiger", "nur die 3 Sitzungen vor der neuesten zählen");
  assert.equal(streuungTrend([sitzung(0), sitzung(0)]), "gleich");
  assert.equal(streuungTrend([sitzung(0), sitzung(1)]), "unruhiger");
});

test("Gesamtauswertung: Gleichmäßigkeit ab 4 Schwüngen, vorher nicht", () => {
  const mit = (werte) => werte.map((w, i) => ({
    id: `1-${i + 1}`, sicher: true, ansicht: "frontal",
    kennzahlen: [{ id: "tempo", name: "Tempo", wert: `${w} : 1`, messwert: w, bewertung: "gut", gewicht: 1 }],
  }));
  const tempo = (werte) => gesamtauswertung(mit(werte))[0].kennzahlen.find((k) => k.id === "tempo");
  assert.equal(tempo([3, 3.1, 2.9]).streuung, null, "3 Schwünge: zu wenig");
  const ruhig = tempo([3, 3.1, 2.9, 3, 3.05]);
  assert.equal(ruhig.streuung.stufe, "gut");
  assert.match(ruhig.streuung.text, /^±0,\d : 1$/);
  assert.equal(tempo([2, 4, 2.2, 4.4, 3]).streuung.stufe, "verbessern", "stark schwankend");
});
