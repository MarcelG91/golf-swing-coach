// Tests für tipps.js (kurze Tipps, Skala) und strichfigur.js (Figur auf der Karte).
//
// 1. Die Texte bleiben kurz (sonst werden die Karten wieder "sperrig").
// 2. Linkshänder bekommen dieselben Texte mit links/rechts vertauscht.
// 3. Die Skala passt zur Bewertung – bei allen echten Testschwüngen.
// 4. Die Strichfigur enthält alle Linien und einen passenden Ausschnitt.
// Ausführen im Projektordner:  node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { erkennePhasen, gueltigeBilder } from "../phasen.js";
import { bewerteSchwung } from "../kennzahlen.js";
import { bewerteTechnik, ordneEin } from "../technik.js";
import { ideallinien } from "../ideallinien.js";
import { AB_LEVEL } from "../level.js";
import { tipp, gutText, skala, skalaPosition, variante, TIPP_IDS, VARIANTEN, SKALA_IDS } from "../tipps.js";
import { strichfigur } from "../strichfigur.js";

const woerter = (text) => text.match(/[A-Za-zÄÖÜäöüß0-9]+/g) || [];

// Für jede Kennzahl und Spielart eine passende Beispiel-Kennzahl bauen
const BEISPIEL = {
  armeAnsprechen: { vorn: 0.3, nah: -0.4 },
  vorneigungAnsprechen: { aufrecht: 15, vorgebeugt: 55 },
  seitneigungAnsprechen: { zumZiel: -8, zuWeit: 30 },
  tempo: { schnell: 1.8, langsam: 5 },
  kopfhoehe: { hoch: 0.2, tief: -0.5 },
  kopfSeitlich: { vorBall: 0.2, schieben: -0.1 },
};
function beispiele() {
  const liste = [];
  for (const id of TIPP_IDS) {
    for (const v of VARIANTEN[id]) {
      const messwert = BEISPIEL[id]?.[v] ?? 1;
      liste.push({ id, v, k: { id, name: id, messwert, bewertung: "verbessern" } });
    }
  }
  return liste;
}

test("Jede Kennzahl mit Level hat Tipps – und umgekehrt", () => {
  assert.deepEqual([...TIPP_IDS].sort(), Object.keys(AB_LEVEL).sort());
});

test("Die Spielart wird aus dem Messwert richtig abgeleitet", () => {
  for (const { id, v, k } of beispiele()) assert.equal(variante(k), v, `${id}: ${v}`);
});

test("Tipps bleiben kurz", () => {
  for (const { id, v, k } of beispiele()) {
    const t = tipp(k);
    const wo = `${id}/${v || "–"}`;
    assert.ok(t, `${wo}: kein Tipp`);
    assert.ok(woerter(t.kurz).length <= 6, `${wo}: kurz hat zu viele Wörter: ${t.kurz}`);
    assert.ok(woerter(t.warum).length <= 30, `${wo}: warum hat zu viele Wörter`);
    const saetze = t.warum.split(/[.!?](\s|$)/).filter((x) => x && x.trim()).length;
    assert.ok(saetze >= 1 && saetze <= 2, `${wo}: warum soll 1–2 Sätze haben`);
    assert.ok(woerter(t.gedanke).length <= 5, `${wo}: gedanke hat zu viele Wörter: ${t.gedanke}`);
    if (t.uebung === null) continue; // bewusst ohne Übung (z. B. "nur leicht neigen")
    assert.ok(t.uebung.name && t.uebung.wiederholungen > 0, `${wo}: Übung unvollständig`);
    assert.ok(t.uebung.schritte.length >= 2 && t.uebung.schritte.length <= 4, `${wo}: 2–4 Schritte`);
    for (const schritt of t.uebung.schritte) {
      assert.ok(woerter(schritt).length <= 12, `${wo}: Schritt zu lang: ${schritt}`);
    }
  }
  for (const id of TIPP_IDS) {
    const text = gutText({ id, name: id });
    assert.ok(woerter(text).length <= 8, `${id}: Lob zu lang: ${text}`);
  }
});

test("Linkshänder: dieselben Texte, nur links und rechts vertauscht", () => {
  const tausche = (text) => text.replace(/\b([Ll])ink|\b([Rr])echt/g, (_, l, r) =>
    l ? (l === "L" ? "Recht" : "recht") : (r === "R" ? "Link" : "link"));
  for (const { id, v, k } of beispiele()) {
    const rechts = JSON.stringify(tipp(k, true));
    const links = JSON.stringify(tipp(k, false));
    assert.equal(links, tausche(rechts), `${id}/${v}`);
  }
});

// Echte Testschwünge (wie in technik.test.mjs)
function lade(name) {
  const d = JSON.parse(fs.readFileSync(new URL(`./daten/${name}.json`, import.meta.url), "utf8"));
  const bilder = d.bilder.map((b) => ({ zeit: b.zeit, punkte: b.punkte ? b.punkte.map(([x, y]) => ({ x, y })) : null }));
  const seitenverhaeltnis = d.breite / d.hoehe;
  const phasen = erkennePhasen(bilder, seitenverhaeltnis);
  const bewertung = bewerteSchwung(bilder, phasen, seitenverhaeltnis);
  const technik = bewerteTechnik(bilder, phasen, seitenverhaeltnis, bewertung.ansicht);
  const kennzahlen = [...bewertung.kennzahlen, ...technik.kennzahlen].map(ordneEin);
  return { bilder, phasen, technik, kennzahlen, seitenverhaeltnis };
}
const SCHWUENGE = ["faceon_profi", "faceon_amateur", "hinten_amateur_a", "hinten_amateur_b"];

// In welchem Bereich der Skala liegt ein Wert? (grün / gelb / sonst rot)
function bereich(s) {
  const drin = ([von, bis]) => s.wert >= von - 1e-9 && s.wert <= bis + 1e-9;
  if (drin(s.gut)) return "gut";
  if (s.achtung.some(drin)) return "achtung";
  return "verbessern";
}

test("Skala und Bewertung passen bei allen echten Testschwüngen zusammen", () => {
  let geprueft = 0;
  for (const name of SCHWUENGE) {
    for (const k of lade(name).kennzahlen) {
      const s = skala(k);
      if (!s) continue;
      assert.equal(bereich(s), k.bewertung, `${name} · ${k.id}: Wert ${s.wert} liegt nicht im Bereich „${k.bewertung}“`);
      const pos = skalaPosition(s, s.wert);
      assert.ok(pos >= 0 && pos <= 100);
      geprueft++;
    }
  }
  assert.ok(geprueft >= 20, `nur ${geprueft} Skalen geprüft`);
});

test("Skala: jede Kennzahl mit Messwert hat einen Balken (außer Armschwung am Top)", () => {
  assert.deepEqual(
    [...SKALA_IDS].sort(),
    TIPP_IDS.filter((id) => id !== "armschwungTop").sort(),
  );
  // Schulterdrehung unter 50° (nicht genauer messbar) steht ganz links
  const s = skala({ id: "schulterdrehung", messwert: null, bewertung: "verbessern" });
  assert.equal(skalaPosition(s, s.wert), (45 - 40) / (110 - 40) * 100);
  // Nicht bewertbar = kein Balken
  assert.equal(skala({ id: "tempo", messwert: 3, bewertung: "unsicher" }), null);
});

test("Tipps gibt es für jede Baustelle der echten Testschwünge", () => {
  for (const name of SCHWUENGE) {
    const { kennzahlen, technik } = lade(name);
    for (const k of kennzahlen) {
      if (k.bewertung === "achtung" || k.bewertung === "verbessern") {
        assert.ok(tipp(k, technik.rechtshaender), `${name} · ${k.id}`);
      }
    }
  }
});

test("Strichfigur: 12 Körperlinien, Kopf, rote/gelbe Linien und alles im Ausschnitt", () => {
  const { bilder, phasen, technik, kennzahlen, seitenverhaeltnis } = lade("faceon_amateur");
  const liste = gueltigeBilder(bilder);
  const punkte = liste[phasen.top.index].punkte;
  const ansprechen = liste[phasen.ansprechen.index].punkte;
  const k = kennzahlen.find((x) => x.id === "schulterdrehung");
  const linien = ideallinien(k, punkte, ansprechen, technik);
  const f = strichfigur(punkte, linien, seitenverhaeltnis);

  assert.equal(f.knochen.length, 12);
  assert.ok(f.kopf.radius > 0);
  assert.ok(f.rot.length + f.rotKreise.length > 0, "rote Linie fehlt");
  const a = f.ausschnitt;
  const drin = (p) => p.x >= a.x && p.x <= a.x + a.breite && p.y >= a.y && p.y <= a.y + a.hoehe;
  for (const { von, bis } of [...f.knochen, ...f.rot, ...f.gelb]) {
    assert.ok(drin(von) && drin(bis), "Linie ragt aus dem Ausschnitt");
  }
  // Ohne Linien: nur die Figur
  const ohne = strichfigur(punkte, null, seitenverhaeltnis);
  assert.equal(ohne.rot.length + ohne.gelb.length, 0);
});
