// Tests für Level-Filter, Baustellenzahl und Vorschläge.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { findeSchwuenge } from "../schwuenge.js";
import { AB_LEVEL, LEVEL, anzahlBaustellen, fuerLevel, levelVorschlag } from "../level.js";

const EINSTEIGER_KENNZAHLEN = [
  "vorneigungAnsprechen", "armeAnsprechen", "tempo", "armschwungTop", "gewicht",
];
const FORTGESCHRITTEN_KENNZAHLEN = [
  "seitneigungAnsprechen", "schulterdrehung", "hueftSway", "fuehrungsarmTreff", "vorneigungHalten",
];
const KOENNER_KENNZAHLEN = ["kopfhoehe", "kopfSeitlich", "hueftBall", "oberkoerperTop", "oberkoerperTreff"];

function ladeKennzahlen(dateiname) {
  const daten = JSON.parse(fs.readFileSync(new URL(`./daten/${dateiname}.json`, import.meta.url), "utf8"));
  const bilder = daten.bilder.map((bild) => ({
    zeit: bild.zeit,
    punkte: bild.punkte?.map(([x, y]) => ({ x, y })) ?? null,
  }));
  return findeSchwuenge(bilder, daten.breite / daten.hoehe)[0].kennzahlen;
}

function erstelleSchwuenge({ gut = 7, levelKennzahlen = EINSTEIGER_KENNZAHLEN, anzahl = 10 } = {}) {
  return Array.from({ length: anzahl }, (_, index) => ({
    id: `${index + 1}-1`,
    sitzungId: index + 1,
    sicher: true,
    kennzahlen: levelKennzahlen.map((id) => ({ id, bewertung: index < gut ? "gut" : "verbessern" })),
  }));
}

test("Alle 15 Kennzahlen haben ein Level", () => {
  assert.deepEqual(Object.keys(AB_LEVEL).sort(), [
    ...EINSTEIGER_KENNZAHLEN,
    ...FORTGESCHRITTEN_KENNZAHLEN,
    ...KOENNER_KENNZAHLEN,
  ].sort());
});

test("Einsteiger hat in beiden Ansichten mindestens drei Kennzahlen", () => {
  const vorne = ["tempo", "armschwungTop", "gewicht", "seitneigungAnsprechen"];
  const hinten = ["tempo", "vorneigungAnsprechen", "armeAnsprechen", "vorneigungHalten"];
  for (const ids of [vorne, hinten]) {
    const { sichtbar } = fuerLevel(ids.map((id) => ({ id })), LEVEL.EINSTEIGER);
    assert.ok(sichtbar.length >= 3);
  }
});

test("Die echten Analyse-Ergebnisse verwenden bekannte IDs und liefern genug Einsteigerwerte", () => {
  for (const datei of ["faceon_profi", "hinten_amateur_a"]) {
    const kennzahlen = ladeKennzahlen(datei);
    assert.ok(kennzahlen.every((k) => Object.hasOwn(AB_LEVEL, k.id)), `${datei}: unbekannte Kennzahl-ID`);
    assert.ok(fuerLevel(kennzahlen, LEVEL.EINSTEIGER).sichtbar.length >= 3, datei);
  }
});

test("fuerLevel trennt aktuelle und spätere Kennzahlen und Baustellenzahl passt", () => {
  const kennzahlen = [...EINSTEIGER_KENNZAHLEN, ...FORTGESCHRITTEN_KENNZAHLEN, ...KOENNER_KENNZAHLEN]
    .map((id) => ({ id }));
  assert.deepEqual(fuerLevel(kennzahlen, LEVEL.EINSTEIGER), {
    sichtbar: kennzahlen.slice(0, 5),
    fuerSpaeter: kennzahlen.slice(5),
  });
  assert.equal(anzahlBaustellen(LEVEL.EINSTEIGER), 1);
  assert.equal(anzahlBaustellen(LEVEL.FORTGESCHRITTEN), 2);
  assert.equal(anzahlBaustellen(LEVEL.KOENNER), 3);
});

test("Aufstieg wird bei mindestens 7 von 10 grünen Fällen vorgeschlagen", () => {
  const vorschlag = levelVorschlag(erstelleSchwuenge({ gut: 7 }), LEVEL.EINSTEIGER);
  assert.equal(vorschlag.art, "aufsteigen");
  assert.equal(vorschlag.nach, LEVEL.FORTGESCHRITTEN);
  assert.equal(vorschlag.gruenVonZehn, 7);
});

test("Aufstieg wird bei nur 6 von 10 grünen Fällen nicht vorgeschlagen", () => {
  assert.equal(levelVorschlag(erstelleSchwuenge({ gut: 6 }), LEVEL.EINSTEIGER), null);
});

test("Eine einzelne Kennzahl unter 6 von 10 verhindert den Aufstieg", () => {
  const schwuenge = erstelleSchwuenge({ gut: 8 }).map((s) => ({
    ...s,
    kennzahlen: s.kennzahlen.map((k) => ({
      ...k,
      bewertung: k.id === "tempo" && s.sitzungId > 5 ? "verbessern" : k.bewertung,
    })),
  }));
  assert.equal(levelVorschlag(schwuenge, LEVEL.EINSTEIGER), null);
});

test("Unsichere Schwünge zählen nicht und weniger als zehn sichere Schwünge reichen nicht", () => {
  const zuWenige = erstelleSchwuenge({ anzahl: 9 });
  assert.equal(levelVorschlag(zuWenige, LEVEL.EINSTEIGER), null);
  const unsichere = erstelleSchwuenge().map((s) => ({ ...s, sicher: false }));
  assert.equal(levelVorschlag(unsichere, LEVEL.EINSTEIGER), null);
});

test("Kennzahlen mit weniger als drei Messungen zählen nicht und werden benannt", () => {
  const schwuenge = erstelleSchwuenge().map((s) => ({
    ...s,
    kennzahlen: s.kennzahlen.filter((k) => k.id !== "armeAnsprechen" || s.sitzungId <= 2),
  }));
  const vorschlag = levelVorschlag(schwuenge, LEVEL.EINSTEIGER);
  assert.equal(vorschlag.art, "aufsteigen");
  assert.ok(vorschlag.fehlendeKennzahlen.includes("armeAnsprechen"));
});

test("Bei zu schwachen Grundlagen wird ein Schritt zurück vorgeschlagen", () => {
  const schwuenge = erstelleSchwuenge({ gut: 3, levelKennzahlen: EINSTEIGER_KENNZAHLEN });
  assert.equal(levelVorschlag(schwuenge, LEVEL.FORTGESCHRITTEN).art, "zurueckstufen");
});