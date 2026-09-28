// Tests für das Zeitraster der schnellen Analyse (videoanalyse.js)
import { test } from "node:test";
import assert from "node:assert/strict";
import { aufRasterLegen, fehlendePlaetze, toleranzFuer, BILD_DAUER, pruefeVideoLaenge, LANG_AB_SEKUNDEN } from "../videoanalyse.js";

// Erzeugt erkannte Bilder mit gegebener Bildrate; punkte = Nummer des Bilds
function bilderMit(fps, dauer, { ohne = [] } = {}) {
  const bilder = [];
  for (let i = 0; i * (1 / fps) <= dauer + 1e-9; i++) {
    if (!ohne.includes(i)) bilder.push({ zeit: i / fps, punkte: i });
  }
  return bilder;
}

test("30-Bilder-Video: jedes Bild landet auf seinem Platz", () => {
  const raster = aufRasterLegen(bilderMit(30, 2), 2);
  assert.equal(raster.length, 61);
  raster.forEach((platz, i) => {
    assert.equal(platz.punkte, i);
    assert.ok(Math.abs(platz.zeit - i * BILD_DAUER) < 1e-9);
  });
  assert.deepEqual(fehlendePlaetze(bilderMit(30, 2), 2), []);
});

test("60-Bilder-Video: jedes zweite Bild, und zwar das zeitlich passende", () => {
  const raster = aufRasterLegen(bilderMit(60, 1), 1);
  assert.equal(raster.length, 31);
  raster.forEach((platz, i) => assert.equal(platz.punkte, 2 * i));
});

test("24-Bilder-Video: keine leeren Plätze (nächstes Bild wird wiederverwendet)", () => {
  const raster = aufRasterLegen(bilderMit(24, 2), 2);
  assert.ok(raster.every((p) => p.punkte !== null));
  assert.deepEqual(fehlendePlaetze(bilderMit(24, 2), 2), []);
  assert.deepEqual(fehlendePlaetze(bilderMit(25, 2), 2), []);
});

test("Lücke beim Abspielen wird als fehlend erkannt", () => {
  // Bilder 10 bis 14 übersprungen (z. B. weil Safari nicht hinterherkam)
  const bilder = bilderMit(30, 1, { ohne: [10, 11, 12, 13, 14] });
  const fehlend = fehlendePlaetze(bilder, 1);
  assert.deepEqual(fehlend, [10, 11, 12, 13, 14]);
  // Ohne Nachholen: Randplätze bekommen notfalls das Nachbarbild, die Mitte bleibt leer
  const raster = aufRasterLegen(bilder, 1);
  assert.equal(raster[12].punkte, null);
  assert.equal(raster[10].punkte, 9);
});

test("Nachgeholte Bilder füllen die Lücke", () => {
  const bilder = bilderMit(30, 1, { ohne: [11, 12, 13] });
  const nachgeholt = fehlendePlaetze(bilder, 1).map((i) => ({ zeit: i * BILD_DAUER, punkte: i }));
  const raster = aufRasterLegen(bilder.concat(nachgeholt), 1);
  raster.forEach((platz, i) => assert.equal(platz.punkte, i));
});

test("Abspielen bricht vorzeitig ab: der Rest fehlt", () => {
  const bilder = bilderMit(30, 0.5); // nur die erste halbe Sekunde
  const fehlend = fehlendePlaetze(bilder, 1);
  assert.equal(fehlend[0], 16); // letztes erkanntes Bild: Platz 15
  assert.equal(fehlend.at(-1), 30);
});

test("Ohne jedes Bild ist alles fehlend", () => {
  assert.equal(fehlendePlaetze([], 1).length, 31);
});

test("60-Bilder-Video: ein Bild neben dem Raster zählt als fehlend", () => {
  // Statt Bild 20 (genau auf Platz 10) wurde Bild 21 genommen (eine halbe Stelle daneben)
  const bilder = bilderMit(60, 1).filter((b) => b.punkte % 2 === 0 || b.punkte === 21).filter((b) => b.punkte !== 20);
  const toleranz = toleranzFuer(1 / 60);
  assert.deepEqual(fehlendePlaetze(bilder, 1, BILD_DAUER, toleranz), [10]);
  // Ohne Kenntnis der Bildrate wäre das nicht aufgefallen
  assert.deepEqual(fehlendePlaetze(bilder, 1), []);
});

test("Toleranz passt zur Bildrate", () => {
  assert.ok(Math.abs(toleranzFuer(1 / 60) / BILD_DAUER - 0.3) < 1e-9);
  assert.ok(Math.abs(toleranzFuer(1 / 30) / BILD_DAUER - 0.6) < 1e-9);
  assert.ok(Math.abs(toleranzFuer(1 / 24) / BILD_DAUER - 0.75) < 1e-9);
  assert.ok(Math.abs(toleranzFuer(Infinity) / BILD_DAUER - 0.75) < 1e-9);
});

test("Videolänge (S3): unendlich/unbekannt = nicht lesbar, lange Videos mit Hinweis", () => {
  for (const dauer of [Infinity, NaN, 0, -1, undefined]) {
    assert.equal(pruefeVideoLaenge(dauer).lesbar, false, `Dauer ${dauer}`);
  }
  assert.deepEqual(pruefeVideoLaenge(4.2), { lesbar: true, hinweis: "" });
  const lang = pruefeVideoLaenge(LANG_AB_SEKUNDEN + 5);
  assert.equal(lang.lesbar, true);
  assert.match(lang.hinweis, /25 s lang/);
  assert.match(pruefeVideoLaenge(119.9).hinweis, /1:59 min/); // nie "1:60"
});
