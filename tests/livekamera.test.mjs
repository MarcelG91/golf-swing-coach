// Prüft die Rechnung der Live-Kamera (ohne Kamera, nur die Messwerte).
import test from "node:test";
import assert from "node:assert/strict";
import { messwerte } from "../livekamera.js";

test("messwerte: Mittel der Rechenzeit und Bilder pro Sekunde", () => {
  // 20 ms Rechenzeit, alle 40 ms ein Bild → 25 Bilder pro Sekunde
  const w = messwerte([10, 20, 30], [40, 40, 40]);
  assert.equal(w.msProBild, 20);
  assert.equal(w.bilderProSekunde, 25);
});

test("messwerte: ohne Daten kommt 0 heraus statt NaN", () => {
  assert.deepEqual(messwerte([], []), { msProBild: 0, bilderProSekunde: 0 });
});
