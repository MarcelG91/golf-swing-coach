// Tests für liveclip.js: Welches Aufnahme-Stück passt, und stimmt die Umrechnung der Zeiten?
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { neueLiveErkennung } from "../liveschwung.js";
import { clipFenster, findeStueck, schwungImStueck } from "../liveclip.js";
import { clipGrenzen, schwungZumSpeichern } from "../speicher.js";

const BILD = 1 / 30;

function lade(name) {
  const d = JSON.parse(fs.readFileSync(new URL(`./daten/${name}.json`, import.meta.url), "utf8"));
  const start = d.bilder[0].zeit;
  return {
    seitenverhaeltnis: d.breite / d.hoehe,
    bilder: d.bilder.map((b) => ({ zeit: b.zeit - start, punkte: b.punkte ? b.punkte.map(([x, y]) => ({ x, y })) : null })),
  };
}

// Einen echten Testschwung als Live-Strom abspielen. "uhr0" = Uhrzeit des ersten Bildes
// (die Browser-Uhr beginnt nicht bei 0), leichte Schwankung im Bildabstand wie bei der Kamera.
function liveSchwung(name, uhr0 = 5000.3) {
  const { bilder, seitenverhaeltnis } = lade(name);
  const live = neueLiveErkennung(seitenverhaeltnis);
  const vorlauf = [];
  for (let t = -3; t < 0; t += BILD) vorlauf.push({ zeit: t, punkte: bilder[0].punkte });
  const nachlauf = [];
  for (let i = 1; i <= 90; i++) nachlauf.push({ zeit: bilder.at(-1).zeit + i * BILD, punkte: bilder.at(-1).punkte });
  let gefunden = null;
  [...vorlauf, ...bilder, ...nachlauf].forEach((b, i) => {
    const wackeln = ((i * 7) % 5) * 0.001;
    const s = live.neuesBild({ zeit: uhr0 + b.zeit + wackeln, punkte: b.punkte });
    if (s) gefunden = s;
  });
  return { schwung: gefunden, seitenverhaeltnis, uhr0 };
}

test("findeStueck: nur ein Stück, das den ganzen Zeitraum enthält", () => {
  const stuecke = [{ start: 0, ende: 16 }, { start: 8, ende: 24 }];
  assert.equal(findeStueck({ von: 2, bis: 9 }, stuecke), stuecke[0]);
  assert.equal(findeStueck({ von: 10, bis: 18 }, stuecke), stuecke[1]);
  assert.equal(findeStueck({ von: 14, bis: 25 }, stuecke), null); // passt in keins
});

test("findeStueck: bei zwei Treffern das Stück mit mehr Luft zum Rand", () => {
  const stuecke = [{ start: 0, ende: 16 }, { start: 8, ende: 24 }];
  assert.equal(findeStueck({ von: 9, bis: 13 }, stuecke), stuecke[0]); // 3 s Luft statt 1 s
  assert.equal(findeStueck({ von: 19, bis: 23 }, stuecke), stuecke[1]);
});

test("Überlappende Stücke (16 s, Versatz 8 s) fangen jeden Zeitraum bis 8 s", () => {
  const stuecke = [];
  for (let k = 0; k < 6; k++) {
    stuecke.push({ start: k * 16, ende: k * 16 + 16 });
    stuecke.push({ start: 8 + k * 16, ende: 8 + k * 16 + 16 });
  }
  for (let von = 0; von < 70; von += 0.37) {
    assert.ok(findeStueck({ von, bis: von + 8 }, stuecke), `Zeitraum ab ${von.toFixed(2)} s nicht gefunden`);
  }
});

test("Live erkannter Schwung: Zeitraum liegt in einem 16-s-Stück", () => {
  const { schwung } = liveSchwung("faceon_amateur");
  const f = clipFenster(schwung);
  assert.ok(f.bis - f.von > 3 && f.bis - f.von < 8, `Fenster ${(f.bis - f.von).toFixed(1)} s`);
});

test("schwungImStueck: Phasen stimmen mit dem Live-Ergebnis überein, Zeiten sind Stückzeiten", () => {
  for (const name of ["faceon_amateur", "hinten_amateur_a", "hinten_amateur_b"]) {
    const { schwung, seitenverhaeltnis, uhr0 } = liveSchwung(name);
    const stueckStart = uhr0 - 4.2; // das Stück begann 4,2 s vor dem ersten Schwungbild
    const s = schwungImStueck(schwung, stueckStart, seitenverhaeltnis);
    assert.ok(s.phasen && !s.phasen.fehler, `${name}: ${s.grund}`);
    for (const phase of ["ansprechen", "top", "treffmoment", "finish"]) {
      const erwartet = schwung.phasen[phase].zeit - stueckStart;
      assert.ok(Math.abs(s.phasen[phase].zeit - erwartet) <= 0.07, `${name} ${phase}: ${(s.phasen[phase].zeit - erwartet).toFixed(3)} s daneben`);
    }
    // Raster: jeder Platz liegt auf einem Vielfachen von 1/30 s
    for (const b of s.bilder) assert.ok(Math.abs(b.zeit * 30 - Math.round(b.zeit * 30)) < 1e-6);
  }
});

test("Speichern: Posedaten liegen lückenlos im Raster und passen zu den Phasen im Clip", () => {
  const { schwung, seitenverhaeltnis, uhr0 } = liveSchwung("hinten_amateur_a");
  const s = schwungImStueck(schwung, uhr0 - 4.2, seitenverhaeltnis);
  const grenzen = clipGrenzen(s);
  const { schwung: gespeichert, posedaten } = schwungZumSpeichern(s, { ...grenzen, versatz: 0.1 });
  posedaten.forEach((p, i) => assert.ok(Math.abs(p.zeit - i * BILD) < 1e-6, `Platz ${i} hat Zeit ${p.zeit}`));
  const treff = gespeichert.phasen.treffmoment;
  assert.ok(posedaten[Math.round(treff.zeit / BILD)].punkte, "am Treffmoment ist ein Skelett gespeichert");
  assert.ok(gespeichert.kennzahlen.length > 5);
});
