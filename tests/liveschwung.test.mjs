// Tests für liveschwung.js: Die Bilder des langen Testvideos laufen einzeln ein,
// so wie sie später von der Kamera kommen.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { neueLiveErkennung } from "../liveschwung.js";
import { findeSchwuenge } from "../schwuenge.js";

const BILD = 1 / 30;

function lade(name) {
  const d = JSON.parse(fs.readFileSync(new URL(`./daten/${name}.json`, import.meta.url), "utf8"));
  const start = d.bilder[0].zeit;
  return {
    seitenverhaeltnis: d.breite / d.hoehe,
    // Zeiten auf 0 verschieben (hinten_amateur_b beginnt bei 13 s)
    bilder: d.bilder.map((b) => ({
      zeit: b.zeit - start,
      punkte: b.punkte ? b.punkte.map(([x, y]) => ({ x, y })) : null,
    })),
  };
}

// Hängt Schwünge hintereinander, vor jedem eine Pause.
// In der Pause geht die Haltung langsam vom Finish des letzten Schwungs in die
// Ansprechhaltung des nächsten über – wie beim echten Aufteen. Ein harter Schnitt
// wäre ein Sprung der Hände in einem Bild und sähe aus wie ein Abschwung.
// Gibt das lange Video und die Startzeit jedes Schwungs darin zurück.
function langesVideo(namen, pause = 3) {
  const bilder = [];
  const starts = [];
  let t = 0;
  for (const name of namen) {
    const clip = lade(name).bilder;
    const ziel = clip.find((b) => b.punkte).punkte;
    const vorher = bilder.findLast((b) => b.punkte)?.punkte ?? ziel;
    for (let p = 0; p < pause; p += BILD) {
      const anteil = p / pause; // 0 = alte Haltung, 1 = neue Haltung
      const punkte = ziel.map((z, k) => ({
        x: vorher[k].x + (z.x - vorher[k].x) * anteil,
        y: vorher[k].y + (z.y - vorher[k].y) * anteil,
      }));
      bilder.push({ zeit: t, punkte });
      t += BILD;
    }
    starts.push(t);
    for (const b of clip) bilder.push({ zeit: t + b.zeit, punkte: b.punkte });
    t += clip.at(-1).zeit + BILD;
  }
  return { bilder, starts };
}


// Nach dem letzten Schwung bleibt die Person noch kurz stehen (Finish halten) – ohne
// diese Bilder gäbe es kein "Nachlauf-Fenster". Hier 3 s lang die letzte Haltung.
function mitFinishHalten(bilder) {
  const letztes = bilder.at(-1);
  const extra = [];
  for (let i = 1; i <= 90; i++) extra.push({ zeit: letztes.zeit + i * BILD, punkte: letztes.punkte });
  return [...bilder, ...extra];
}

// Bilder nacheinander in die Live-Erkennung geben; gibt Funde samt Zeit des Bildes zurück
function spieleAb(bilder, seitenverhaeltnis) {
  const live = neueLiveErkennung(seitenverhaeltnis);
  const funde = [];
  for (const bild of mitFinishHalten(bilder)) {
    const schwung = live.neuesBild(bild);
    if (schwung) funde.push({ schwung, ankunft: bild.zeit });
  }
  return funde;
}

test("Live: drei Schwünge nacheinander werden alle gefunden", () => {
  const { bilder } = langesVideo(["faceon_amateur", "hinten_amateur_a", "hinten_amateur_b"]);
  const funde = spieleAb(bilder, 720 / 1280);
  assert.equal(funde.length, 3);
  assert.deepEqual(funde.map((f) => f.schwung.nummer), [1, 2, 3]);
});

test("Live: Rückmeldung kommt nach dem Schlag, aber nicht zu spät", () => {
  const { bilder } = langesVideo(["faceon_amateur", "hinten_amateur_a"]);
  for (const f of spieleAb(bilder, 720 / 1280)) {
    const wartezeit = f.ankunft - f.schwung.phasen.treffmoment.zeit;
    assert.ok(wartezeit >= 1.5 && wartezeit <= 3, `Wartezeit ${wartezeit.toFixed(2)} s`);
  }
});

test("Live: gleiche Phasen wie bei der Auswertung des fertigen Videos", () => {
  const { bilder } = langesVideo(["faceon_amateur", "hinten_amateur_a", "hinten_amateur_b"]);
  const live = spieleAb(bilder, 720 / 1280);
  const fertig = findeSchwuenge(bilder, 720 / 1280);
  live.forEach((f, i) => {
    for (const phase of ["ansprechen", "top", "treffmoment", "finish"]) {
      const abweichung = Math.abs(f.schwung.phasen[phase].zeit - fertig[i].phasen[phase].zeit);
      assert.ok(abweichung <= 0.1, `Schwung ${i + 1} ${phase}: ${abweichung.toFixed(2)} s`);
    }
  });
});

test("Live: Stillstehen und fehlende Person lösen nichts aus", () => {
  const still = lade("faceon_amateur").bilder.find((b) => b.punkte).punkte;
  const bilder = [];
  for (let i = 0; i < 600; i++) {
    bilder.push({ zeit: i * BILD, punkte: i % 50 < 10 ? null : still });
  }
  assert.equal(spieleAb(bilder, 720 / 1280).length, 0);
});

test("Live: nach dem Zurücksetzen wird neu angefangen", () => {
  const { bilder } = langesVideo(["faceon_amateur"]);
  const live = neueLiveErkennung(720 / 1280);
  for (const b of mitFinishHalten(bilder)) live.neuesBild(b);
  live.zuruecksetzen();
  let gefunden = 0;
  for (const b of mitFinishHalten(bilder)) if (live.neuesBild(b)) gefunden++;
  assert.equal(gefunden, 1);
});
