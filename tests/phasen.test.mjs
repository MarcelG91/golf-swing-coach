// Test der Phasenerkennung mit künstlich erzeugten Schwungdaten.
// Ausführen im Projektordner:  node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { erkennePhasen } from "../phasen.js";

// Erzeugt einen künstlichen Schwung mit bekannten Zeitpunkten
function kuenstlicherSchwung({ ansprechen = 1.0, rueck = 0.9, ab = 0.3, durch = 0.6, fps = 30, rauschen = 0.004 }) {
  const top = ansprechen + rueck;
  const treff = top + ab;
  const finish = treff + durch;
  const ende = finish + 1.5;
  const sanft = (p) => 0.5 - 0.5 * Math.cos(Math.PI * p);
  let zufall = 42;
  const noise = () => {
    zufall = (zufall * 16807) % 2147483647;
    return ((zufall / 2147483647) * 2 - 1) * rauschen;
  };

  const bilder = [];
  for (let t = 0; t <= ende; t += 1 / fps) {
    let hx, hy;
    if (t < ansprechen) {
      hx = 0.5; hy = 0.62;
    } else if (t < top) {
      const p = sanft((t - ansprechen) / rueck);
      hx = 0.5 - 0.1 * p; hy = 0.62 - 0.37 * p;
    } else if (t < treff) {
      const p = ((t - top) / ab) ** 2; // Abschwung beschleunigt
      hx = 0.4 + 0.1 * p; hy = 0.25 + 0.38 * p;
    } else if (t < finish) {
      const p = Math.sin((Math.PI / 2) * ((t - treff) / durch)); // Durchschwung bremst ab
      hx = 0.5 + 0.12 * p; hy = 0.63 - 0.41 * p;
    } else {
      hx = 0.62; hy = 0.22;
    }
    const punkte = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5 }));
    punkte[11] = { x: 0.45, y: 0.35 }; punkte[12] = { x: 0.55, y: 0.35 };
    punkte[23] = { x: 0.46, y: 0.55 }; punkte[24] = { x: 0.54, y: 0.55 };
    punkte[15] = { x: hx - 0.01 + noise(), y: hy + noise() };
    punkte[16] = { x: hx + 0.01 + noise(), y: hy + noise() };
    bilder.push({ zeit: t, punkte });
  }
  return { bilder, soll: { ansprechen, top, treff, finish } };
}

const TOLERANZ = 0.12; // Sekunden, etwa 3–4 Videobilder

function pruefe(ergebnis, soll) {
  assert.ok(!ergebnis.fehler, ergebnis.fehler);
  assert.ok(Math.abs(ergebnis.ansprechen.zeit - soll.ansprechen) < TOLERANZ, `Ansprechen ${ergebnis.ansprechen.zeit}`);
  assert.ok(Math.abs(ergebnis.top.zeit - soll.top) < TOLERANZ, `Top ${ergebnis.top.zeit}`);
  assert.ok(Math.abs(ergebnis.treffmoment.zeit - soll.treff) < TOLERANZ, `Treffmoment ${ergebnis.treffmoment.zeit}`);
  assert.ok(Math.abs(ergebnis.finish.zeit - soll.finish) < 0.25, `Finish ${ergebnis.finish.zeit}`);
}

test("Schwung mit Tempo 3:1 wird erkannt", () => {
  const { bilder, soll } = kuenstlicherSchwung({});
  const e = erkennePhasen(bilder);
  pruefe(e, soll);
  assert.ok(e.tempo.verhaeltnis > 2.4 && e.tempo.verhaeltnis < 3.6, `Tempo ${e.tempo.verhaeltnis}`);
  assert.equal(e.warnungen.length, 0);
});

test("Hastiger Schwung mit Tempo 2:1 wird erkannt", () => {
  const { bilder, soll } = kuenstlicherSchwung({ rueck: 0.6, ab: 0.3 });
  const e = erkennePhasen(bilder);
  pruefe(e, soll);
  assert.ok(e.tempo.verhaeltnis > 1.5 && e.tempo.verhaeltnis < 2.5, `Tempo ${e.tempo.verhaeltnis}`);
});

test("Video mit 60 Bildern pro Sekunde", () => {
  const { bilder, soll } = kuenstlicherSchwung({ fps: 60 });
  pruefe(erkennePhasen(bilder), soll);
});

test("Zu wenige Bilder ergeben eine verständliche Fehlermeldung", () => {
  const e = erkennePhasen([{ zeit: 0, punkte: null }]);
  assert.ok(e.fehler);
});
