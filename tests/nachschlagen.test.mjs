// Tests für nachschlagen.js (Glossar, Irrtümer, Regeln, Ausrüstung, Suche) und die
// Verknüpfung Baustellen-Karte → Lektion (lektionZurKennzahl in wissen.js).
//
// Gleiche strenge Regeln wie bei den Lektionen (keine Golflehrer-Durchsicht):
// kurze Texte, jede Aussage mit bekannter Quelle, Glossar mit Lektion oder zwei Quellen.
// Ausführen im Projektordner:  node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GLOSSAR, GLOSSAR_GRUPPEN, IRRTUEMER, REGELN, REGEL_QUELLEN, AUSRUESTUNG, suche, vereinfache,
} from "../nachschlagen.js";
import { LEKTIONEN, QUELLEN, BELEGE, lektion, lektionZurKennzahl } from "../wissen.js";
import { AB_LEVEL } from "../level.js";

const woerter = (text) => text.match(/[A-Za-zÄÖÜäöüß0-9]+/g) || [];
const pruefeQuellen = (name, quellen) => {
  for (const kennung of quellen) assert.ok(kennung in QUELLEN, `${name}: Quelle ${kennung} fehlt in QUELLEN (wissen.js)`);
};

test("Glossar: kurze Erklärung, bekannte Gruppe, eindeutige Begriffe", () => {
  const gruppen = GLOSSAR_GRUPPEN.map((g) => g.id);
  const begriffe = GLOSSAR.map((g) => g.begriff);
  assert.equal(new Set(begriffe).size, begriffe.length, "Begriff doppelt");
  assert.ok(GLOSSAR.length >= 50, "mindestens 50 Begriffe");
  for (const g of GLOSSAR) {
    assert.ok(gruppen.includes(g.gruppe), `${g.begriff}: Gruppe ${g.gruppe}`);
    assert.equal(typeof g.englisch, "string", `${g.begriff}: englisch fehlt`);
    const laenge = woerter(g.text).length;
    assert.ok(laenge >= 3 && laenge <= 20, `${g.begriff}: Erklärung hat ${laenge} Wörter`);
    if (g.auch) assert.ok(Array.isArray(g.auch) && g.auch.every((w) => typeof w === "string" && w.length >= 2), `${g.begriff}: Zusatzwörter`);
  }
  // Jede Gruppe hat Einträge
  for (const id of gruppen) assert.ok(GLOSSAR.some((g) => g.gruppe === id), `Gruppe ${id} leer`);
});

test("Glossar: jeder Begriff hat eine erklärende Lektion ODER mindestens zwei Quellen", () => {
  for (const g of GLOSSAR) {
    if (g.lektion) assert.ok(lektion(g.lektion), `${g.begriff}: Lektion ${g.lektion} fehlt`);
    else assert.ok(g.quellen.length >= 2, `${g.begriff}: ohne Lektion braucht es zwei Quellen`);
    pruefeQuellen(g.begriff, g.quellen);
  }
});

test("Irrtümer: Irrtum ≤ 10 Wörter, „Was stimmt“ ≤ 40 Wörter, Quellen und Beleg", () => {
  const ids = IRRTUEMER.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length, "ID doppelt");
  assert.ok(IRRTUEMER.length >= 10);
  for (const i of IRRTUEMER) {
    assert.ok(woerter(i.irrtum).length <= 10, `${i.id}: Irrtum hat ${woerter(i.irrtum).length} Wörter`);
    assert.match(i.irrtum, /^„.*“$/, `${i.id}: Irrtum steht in Anführungszeichen`);
    const laenge = woerter(i.stimmt).length;
    assert.ok(laenge <= 40, `${i.id}: „Was stimmt“ hat ${laenge} Wörter`);
    assert.ok(i.beleg in BELEGE, `${i.id}: Beleg ${i.beleg}`);
    assert.ok(i.quellen.length >= (i.beleg === "zwei-quellen" ? 2 : 1), `${i.id}: zu wenige Quellen`);
    pruefeQuellen(i.id, i.quellen);
    if (i.lektion) assert.ok(lektion(i.lektion), `${i.id}: Lektion ${i.lektion} fehlt`);
  }
});

test("Regeln: kurze Texte, Regelnummer, Quellen", () => {
  const ids = REGELN.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, "ID doppelt");
  for (const r of REGELN) {
    assert.match(r.regel, /^\d{1,2}(\.\d)?$/, `${r.id}: Regelnummer ${r.regel}`);
    assert.ok(woerter(r.situation).length <= 6, `${r.id}: Situation zu lang`);
    assert.ok(woerter(r.tun).length <= 30, `${r.id}: „Was tun“ hat ${woerter(r.tun).length} Wörter`);
    assert.ok(r.strafe.length > 0 && woerter(r.strafe).length <= 6, `${r.id}: Strafe zu lang`);
  }
  assert.ok(REGEL_QUELLEN.length >= 2);
  pruefeQuellen("Regeln", REGEL_QUELLEN);
  // Weiße Pfähle = Aus, 14 Schläger: die wichtigsten Grundregeln sind dabei
  assert.ok(REGELN.some((r) => r.regel === "18.2" && r.situation.includes("weiße Pfähle")));
  assert.ok(REGELN.some((r) => r.regel === "4.1" && r.tun.includes("14")));
  // Regel 16.1 und 16.3: Erleichterung nur im Gelände – nicht in der Penalty Area (R&A-Regeltext)
  for (const regel of ["16.1", "16.3"]) assert.match(REGELN.find((r) => r.regel === regel).tun, /im Gelände/i, regel);
});

test("Ausrüstung: Karten ≤ 40 Wörter, Tabelle mit zwei Spalten, Quellen und Beleg", () => {
  for (const a of AUSRUESTUNG) {
    const laenge = woerter(a.text).length;
    assert.ok(laenge <= 40, `${a.id}: Karte hat ${laenge} Wörter`);
    assert.ok(a.beleg in BELEGE, `${a.id}: Beleg`);
    assert.ok(a.quellen.length >= 2, `${a.id}: zwei Quellen`);
    pruefeQuellen(a.id, a.quellen);
    if (a.lektion) assert.ok(lektion(a.lektion), `${a.id}: Lektion fehlt`);
    if (a.tabelle) {
      assert.equal(a.tabelle.kopf.length, 2);
      for (const zeile of a.tabelle.zeilen) assert.equal(zeile.length, 2, `${a.id}: Tabellenzeile`);
    }
  }
  // Flex-Tabelle: gerundete km/h (72/84/97/105 mph aus MyGolfSpy und GOLF.com)
  const flex = AUSRUESTUNG.find((a) => a.id === "schaft").tabelle.zeilen.map(([, tempo]) => tempo);
  assert.deepEqual(flex, ["unter ca. 115 km/h", "ca. 115–135 km/h", "ca. 135–155 km/h", "ca. 155–170 km/h", "ab ca. 170 km/h"]);
});

test("Umstrittenes steht nur als „Trainer sind uneins“ (Fitting)", () => {
  assert.match(AUSRUESTUNG.find((a) => a.id === "fitting").text, /Trainer sind uneins/);
});

test("Suche: Groß/klein und Umlaute egal, Deutsch und Englisch", () => {
  assert.equal(vereinfache("Rückschwung"), vereinfache("rueckschwung"));
  assert.equal(vereinfache("Rückschwung"), vereinfache("RUCKSCHWUNG"));
  for (const eingabe of ["Rückschwung", "ruckschwung", "rueckschwung", "Backswing"]) {
    assert.ok(suche(eingabe).begriffe.some((g) => g.begriff === "Rückschwung"), `${eingabe} findet Rückschwung`);
  }
  assert.ok(suche("ruckschwung").lektionen.some((l) => l.id === "voll-rueckschwung"), "auch die Lektion");
  // „Bunker“ findet Begriff, Lektion und Regeln
  const bunker = suche("  Bunker ");
  assert.ok(bunker.begriffe.some((g) => g.begriff === "Bunker"));
  assert.ok(bunker.lektionen.some((l) => l.id === "gruen-bunker"));
  assert.ok(bunker.regeln.some((r) => r.id === "bunker"));
  // Rest: Irrtümer und Ausrüstung
  assert.ok(suche("Kopf").irrtuemer.some((i) => i.id === "kopf"));
  assert.ok(suche("flex").ausruestung.some((a) => a.id === "schaft"));
  assert.ok(suche("Slice").lektionen.some((l) => l.id === "ball-slice"));
  // Zusatzwörter (Entscheidung Marcel 01.10.): „Wasser“ findet die Penalty Area
  assert.ok(suche("wasser").begriffe.some((g) => g.begriff === "Penalty Area"));
  assert.ok(suche("weisse Pfahle").begriffe.some((g) => g.begriff === "Aus"));
});

test("Suche: zu kurze, leere und seltsame Eingaben führen nicht zum Absturz", () => {
  assert.equal(suche(""), null);
  assert.equal(suche(" x "), null, "erst ab 2 Zeichen");
  const nichts = suche("zzzz");
  for (const liste of Object.values(nichts)) assert.deepEqual(liste, []);
  for (const seltsam of ["<img src=x>", ".*", "((", "__proto__", "toString"]) {
    const ergebnis = suche(seltsam);
    for (const liste of Object.values(ergebnis)) assert.ok(Array.isArray(liste), seltsam);
  }
});

test("Baustellen-Karte → Lektion: gewählte Lektionen, keine Lektion für 4 Kennzahlen", () => {
  const erwartet = {
    vorneigungAnsprechen: "start-haltung",
    armeAnsprechen: "start-haltung", // Entscheidung Marcel 01.10. (sonst auch „Shank“)
    tempo: "voll-finish",
    armschwungTop: "voll-rueckschwung",
    gewicht: "voll-finish", // Entscheidung Marcel 01.10.
    schulterdrehung: "voll-rueckschwung",
    hueftSway: "voll-rueckschwung",
    vorneigungHalten: "voll-treffmoment", // Entscheidung Marcel 01.10.
    kopfhoehe: "ball-fett-getoppt",
    hueftBall: "voll-treffmoment", // Entscheidung Marcel 01.10.
    oberkoerperTop: "voll-rueckschwung",
    seitneigungAnsprechen: null,
    fuehrungsarmTreff: null,
    kopfSeitlich: null,
    oberkoerperTreff: null,
  };
  assert.deepEqual(Object.keys(erwartet).sort(), Object.keys(AB_LEVEL).sort(), "alle Kennzahlen der App");
  for (const [kennzahl, id] of Object.entries(erwartet)) {
    assert.equal(lektionZurKennzahl(kennzahl)?.id ?? null, id, kennzahl);
  }
  // Die gewählte Lektion nennt die Kennzahl auch selbst – und jede Kennzahl mit mehreren
  // Lektionen hat eine Entscheidung (sonst gäbe es keinen Knopf)
  for (const kennzahl of Object.keys(AB_LEVEL)) {
    const passend = LEKTIONEN.filter((l) => l.kennzahlen.includes(kennzahl));
    const gewaehlt = lektionZurKennzahl(kennzahl);
    if (passend.length > 0) assert.ok(gewaehlt && passend.includes(gewaehlt), `${kennzahl}: keine passende Lektion gewählt`);
  }
  assert.equal(lektionZurKennzahl("toString"), null);
  assert.equal(lektionZurKennzahl("gibtEsNicht"), null);
});
