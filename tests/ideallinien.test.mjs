// Tests für ideallinien.js: Liegen die gelben Ideallinien dort, wo sie hingehören?
// Ausführen im Projektordner:  node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { erkennePhasen } from "../phasen.js";
import { bewerteSchwung } from "../kennzahlen.js";
import { bewerteTechnik, ordneEin } from "../technik.js";
import { ideallinien, IDEAL, MIT_LINIE } from "../ideallinien.js";

const SV = 9 / 16; // Hochkant-Video: x und y haben unterschiedliche Maßstäbe
const inHoehen = (p) => ({ x: p.x * SV, y: p.y }); // wie in ideallinien.js
const nahe = (ist, soll, toleranz, text) => assert.ok(Math.abs(ist - soll) < toleranz, `${text}: ${ist} statt ${soll}`);

// Ein einfacher Körper. Angaben in Bildhöhen, damit Winkel stimmen.
function koerper({ huefte = { x: 0.3, y: 0.6 }, schulter = { x: 0.3, y: 0.35 }, kopf = { x: 0.3, y: 0.28 } } = {}) {
  const p = Array.from({ length: 33 }, () => ({ ...huefte }));
  const setze = (i, x, y) => { p[i] = { x, y }; };
  for (const k of [0, 2, 5, 7, 8]) setze(k, kopf.x, kopf.y);
  setze(11, schulter.x + 0.09, schulter.y); setze(12, schulter.x - 0.09, schulter.y);
  setze(23, huefte.x + 0.06, huefte.y); setze(24, huefte.x - 0.06, huefte.y);
  setze(13, schulter.x + 0.1, schulter.y + 0.12); setze(15, schulter.x + 0.08, schulter.y + 0.24);
  setze(14, schulter.x - 0.1, schulter.y + 0.12); setze(16, schulter.x - 0.08, schulter.y + 0.24);
  setze(27, huefte.x + 0.1, 0.95); setze(28, huefte.x - 0.1, 0.95);
  return p.map((q) => ({ x: q.x / SV, y: q.y })); // zurück ins MediaPipe-Format
}

const KONTEXT = {
  seitenverhaeltnis: SV,
  rechtshaender: true,
  ziel: 1, // Ziel rechts im Bild
  richtungBall: 1,
  fuehrung: { schulter: 11, ellbogen: 13, handgelenk: 15 },
  hintereSchulter: 12,
};
const winkelZurSenkrechten = ({ von, bis }) => {
  const a = inHoehen(von), b = inHoehen(bis);
  return (Math.atan2(b.x - a.x, a.y - b.y) * 180) / Math.PI; // + = nach rechts geneigt
};
const laenge = ({ von, bis }) => Math.hypot(inHoehen(bis).x - inHoehen(von).x, bis.y - von.y);

test("Oberkörper im Treffmoment: gelbe Linie mit Idealneigung vom Ziel weg", () => {
  // Oberkörper neigt sich 10° zum Ziel (nach rechts)
  const s = { x: 0.3 + 0.25 * Math.sin(0.1745), y: 0.6 - 0.25 * Math.cos(0.1745) };
  const p = koerper({ schulter: s });
  const l = ideallinien({ id: "oberkoerperTreff" }, p, koerper(), KONTEXT);
  nahe(winkelZurSenkrechten(l.ist[0]), 10, 0.01, "gemessen");
  nahe(winkelZurSenkrechten(l.ideal[0]), -IDEAL.oberkoerperTreff, 0.01, "ideal (vom Ziel weg = links)");
  nahe(laenge(l.ideal[0]), laenge(l.ist[0]), 1e-9, "gleiche Länge");
  // Pfeil von der roten Schultermitte zum Ende der gelben Linie, Hinweis mit Richtung
  nahe(l.pfeile[0].von.x, l.ist[0].bis.x, 1e-9, "Pfeil beginnt an der roten Linie");
  nahe(l.pfeile[0].bis.x, l.ideal[0].bis.x, 1e-9, "Pfeil endet an der gelben Linie");
  assert.match(l.hinweis, /nach links/);
  assert.deepEqual(l.anker, l.pfeile[0].von);
});

test("Vorneigung von hinten: Ideallinie 35° Richtung Ball", () => {
  const l = ideallinien({ id: "vorneigungAnsprechen" }, koerper(), koerper(), { ...KONTEXT, richtungBall: -1 });
  nahe(winkelZurSenkrechten(l.ideal[0]), -IDEAL.vorneigungAnsprechen, 0.01, "ideal");
});

test("Führungsarm: gelbe Linie ist ein gerader Arm gleicher Länge", () => {
  const p = koerper();
  const l = ideallinien({ id: "fuehrungsarmTreff" }, p, p, KONTEXT);
  const [oben, unten] = l.ist;
  nahe(laenge(l.ideal[0]), laenge(oben) + laenge(unten), 1e-9, "Armlänge");
  // Die Ideallinie zeigt von der Schulter genau in Richtung Hand
  const S = inHoehen(p[11]), H = inHoehen(p[15]), E = inHoehen(l.ideal[0].bis);
  const kreuz = (H.x - S.x) * (E.y - S.y) - (H.y - S.y) * (E.x - S.x);
  nahe(kreuz, 0, 1e-12, "Richtung");
  // Pfeil vom Ellbogen genau auf die gelbe Linie
  const Z = inHoehen(l.pfeile[0].bis);
  nahe((H.x - S.x) * (Z.y - S.y) - (H.y - S.y) * (Z.x - S.x), 0, 1e-12, "Pfeilende auf der Linie");
  assert.match(l.hinweis, /^Linken Arm gerade lassen/);
  const links = ideallinien({ id: "fuehrungsarmTreff" }, p, p, { ...KONTEXT, rechtshaender: false });
  assert.match(links.hinweis, /^Rechten Arm/);
});

test("Kopf: gelbe Linien markieren die Kopfposition beim Ansprechen", () => {
  const ansprechen = koerper();
  const jetzt = koerper({ kopf: { x: 0.36, y: 0.25 } });
  // seitlich: senkrechte Linie durch die Ansprechposition
  const seitlich = ideallinien({ id: "kopfSeitlich" }, jetzt, ansprechen, KONTEXT).ideal[0];
  nahe(seitlich.von.x, ansprechen[0].x, 1e-9, "x oben");
  nahe(seitlich.bis.x, ansprechen[0].x, 1e-9, "x unten");
  // Höhe: waagerechte Linie auf Kopfhöhe beim Ansprechen
  const hoehe = ideallinien({ id: "kopfhoehe" }, jetzt, ansprechen, KONTEXT).ideal[0];
  nahe(hoehe.von.y, ansprechen[0].y, 1e-9, "y links");
  nahe(hoehe.bis.y, ansprechen[0].y, 1e-9, "y rechts");
});

test("Hüfte im Rückschwung: gelbe Hüfte zurück an der Ansprechposition", () => {
  const ansprechen = koerper();
  const jetzt = koerper({ huefte: { x: 0.25, y: 0.6 } });
  const l = ideallinien({ id: "hueftSway" }, jetzt, ansprechen, KONTEXT);
  const m = { x: (l.ideal[0].von.x + l.ideal[0].bis.x) / 2 };
  nahe(m.x, (ansprechen[23].x + ansprechen[24].x) / 2, 1e-9, "Hüftmitte");
  // Hüfte ist nach links gerutscht → Pfeil und Hinweis zeigen nach rechts
  assert.ok(l.pfeile[0].bis.x > l.pfeile[0].von.x);
  assert.match(l.hinweis, /^Hüfte zurück nach rechts/);
});

test("Schulterdrehung: gelbe Schulterlinie so schmal wie bei 90° Drehung", () => {
  const ansprechen = koerper();
  const l = ideallinien({ id: "schulterdrehung" }, koerper(), ansprechen, KONTEXT);
  const breite = Math.abs(inHoehen(l.ideal[0].von).x - inHoehen(l.ideal[0].bis).x);
  nahe(breite, 0.18 * IDEAL.schulterBreiteTop, 1e-9, "Breite");
});

test("Tempo hat keine Linie", () => {
  assert.equal(ideallinien({ id: "tempo" }, koerper(), koerper(), KONTEXT), null);
  assert.equal(MIT_LINIE.has("tempo"), false);
});

// Alle Kennzahlen der echten Testschwünge: Linien mit gültigen Zahlen
for (const name of ["faceon_profi", "faceon_amateur", "hinten_amateur_a", "hinten_amateur_b"]) {
  test(`Echter Schwung ${name}: jede Kennzahl mit Linie liefert gültige Koordinaten`, () => {
    const d = JSON.parse(fs.readFileSync(new URL(`./daten/${name}.json`, import.meta.url), "utf8"));
    const sv = d.breite / d.hoehe;
    const bilder = d.bilder.map((b) => ({ zeit: b.zeit, punkte: b.punkte ? b.punkte.map(([x, y]) => ({ x, y })) : null }));
    const phasen = erkennePhasen(bilder, sv);
    const bewertung = bewerteSchwung(bilder, phasen, sv);
    const technik = bewerteTechnik(bilder, phasen, sv, bewertung.ansicht);
    const bildBei = (zeit) => bilder.find((b) => b.zeit === zeit).punkte;
    const alle = [...bewertung.kennzahlen, ...technik.kennzahlen].map(ordneEin);
    for (const k of alle) {
      assert.ok(k.id, `${k.name} ohne Kennung`);
      if (!MIT_LINIE.has(k.id)) continue;
      const l = ideallinien(k, bildBei(phasen[k.phase].zeit), bildBei(phasen.ansprechen.zeit), technik);
      assert.ok(l.ist.length + l.istKreise.length > 0, `${k.id}: keine gemessene Linie`);
      assert.ok(l.ideal.length > 0, `${k.id}: keine Ideallinie`);
      assert.ok(l.pfeile.length > 0, `${k.id}: kein Pfeil`);
      assert.ok(l.hinweis.length > 5, `${k.id}: kein Hinweis`);
      for (const { von, bis } of [...l.ist, ...l.ideal, ...l.pfeile]) {
        for (const w of [von.x, von.y, bis.x, bis.y]) assert.ok(Number.isFinite(w), `${k.id}: ungültige Koordinate`);
      }
    }
  });
}
