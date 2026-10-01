// Tests für Verlauf, Trend, Fokus, Meilensteine und Wochenrückblick.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  schlaegerGruppe, sichereSchwuenge, verlauf, gleitenderMittelwert, trend, fokus, meilensteine, wochenRueckblick,
} from "../fortschritt.js";

// Baut einen Schwung mit einer Kennzahl je Eintrag in "werte" ({ id: bewertung }).
function schwung(nr, werte, extra = {}) {
  return {
    id: `${nr}-1`,
    sitzungId: nr,
    nummer: 1,
    datum: "2026-09-01",
    schlaeger: "Eisen 7",
    ansicht: "frontal",
    sicher: true,
    kennzahlen: Object.entries(werte).map(([id, bewertung]) => ({ id, bewertung, messwert: nr })),
    ...extra,
  };
}

const reihe = (bewertungen, id = "tempo", extra = {}) =>
  bewertungen.map((b, i) => schwung(i + 1, { [id]: b }, extra));

test("Schlägergruppen passen zur Auswahlliste", () => {
  assert.equal(schlaegerGruppe("Driver"), "hoelzer");
  assert.equal(schlaegerGruppe("Eisen 9"), "eisen");
  assert.equal(schlaegerGruppe("SW"), "wedges");
  assert.equal(schlaegerGruppe("Putter"), null);
});

test("Filter: nur sichere Schwünge, Ansicht und Gruppe, ältester zuerst", () => {
  const alle = [
    schwung(3, { tempo: "gut" }),
    schwung(1, { tempo: "gut" }),
    schwung(2, { tempo: "gut" }, { sicher: false }),
    schwung(4, { tempo: "gut" }, { ansicht: "hinten" }),
    schwung(5, { tempo: "gut" }, { schlaeger: "Driver" }),
  ];
  assert.deepEqual(sichereSchwuenge(alle).map((s) => s.sitzungId), [1, 3, 4, 5]);
  assert.deepEqual(sichereSchwuenge(alle, { ansicht: "frontal", gruppe: "eisen" }).map((s) => s.sitzungId), [1, 3]);
});

test("Verlauf: unsichere Messungen und fehlende Kennzahlen fehlen", () => {
  const alle = [schwung(1, { tempo: "gut" }), schwung(2, { tempo: "unsicher" }), schwung(3, { gewicht: "gut" }), schwung(4, { tempo: "achtung" })];
  const punkte = verlauf(alle, "tempo");
  assert.deepEqual(punkte.map((p) => p.bewertung), ["gut", "achtung"]);
  assert.equal(punkte[0].messwert, 1);
});

test("Gleitender Mittelwert", () => {
  assert.deepEqual(gleitenderMittelwert([2, 4, 6, 8], 2), [2, 3, 5, 7]);
  assert.deepEqual(gleitenderMittelwert([2, null, 6], 2), [2, 2, 6]);
});

test("Trend: zu wenig Daten", () => {
  const t = trend(verlauf(reihe(["gut", "gut", "gut"]), "tempo"));
  assert.equal(t.urteil, "zuWenigDaten");
  // 10 neue, aber nur 3 alte → ebenfalls zu wenig
  const t2 = trend(verlauf(reihe([...Array(3).fill("gut"), ...Array(10).fill("gut")]), "tempo"));
  assert.equal(t2.urteil, "zuWenigDaten");
});

test("Trend: verbessert, verschlechtert, stabil", () => {
  const schlecht = Array(10).fill("verbessern");
  const gut = Array(10).fill("gut");
  assert.equal(trend(verlauf(reihe([...schlecht, ...gut]), "tempo")).urteil, "verbessert");
  assert.equal(trend(verlauf(reihe([...gut, ...schlecht]), "tempo")).urteil, "verschlechtert");
  assert.equal(trend(verlauf(reihe([...gut, ...gut]), "tempo")).urteil, "stabil");
});

test("Trend: kleiner Unterschied im Rauschen bleibt stabil", () => {
  // Beide Hälften schwanken stark, Mittel unterscheiden sich kaum.
  const a = ["gut", "verbessern", "gut", "verbessern", "gut", "verbessern", "gut", "verbessern", "gut", "verbessern"];
  const b = ["verbessern", "gut", "verbessern", "gut", "verbessern", "gut", "verbessern", "gut", "gut", "verbessern"];
  assert.equal(trend(verlauf(reihe([...a, ...b]), "tempo")).urteil, "stabil");
});

test("Fokus: schwächste Kennzahl des Levels, höhere Level-Kennzahlen zählen nicht", () => {
  const alle = Array.from({ length: 10 }, (_, i) =>
    schwung(i + 1, { tempo: "gut", gewicht: i < 3 ? "gut" : "verbessern", kopfhoehe: "verbessern" }));
  const f = fokus(alle, "einsteiger");
  assert.equal(f.id, "gewicht"); // kopfhoehe ist erst ab Könner dran
  assert.equal(f.gruen, 3);
  assert.equal(f.anzahl, 10);
  assert.equal(f.erreicht, false);
  assert.equal(fokus(alle, "koenner").id, "kopfhoehe");
});

test("Fokus: alles stabil, zu wenig Daten", () => {
  const stabil = reihe(Array(10).fill("gut"));
  assert.equal(fokus(stabil, "einsteiger").erreicht, true);
  assert.equal(fokus(reihe(["gut", "gut"]), "einsteiger"), null);
});

test("Fokus: Gleichstand → Grundlage zuerst, nur letzte 10 zählen", () => {
  const alle = Array.from({ length: 15 }, (_, i) => schwung(i + 1, { tempo: "verbessern", vorneigungAnsprechen: "verbessern" }));
  assert.equal(fokus(alle, "einsteiger").id, "vorneigungAnsprechen"); // steht in AB_LEVEL vor tempo
  assert.equal(fokus(alle, "einsteiger").anzahl, 10);
});

test("Meilensteine: Serie in Folge, Pause bricht sie", () => {
  const serie = reihe([...Array(5).fill("gut"), "verbessern", ...Array(2).fill("gut")]);
  const m = meilensteine(serie);
  assert.equal(m.length, 1);
  assert.deepEqual(m[0], { id: "tempo", laengste: 5, aktuell: 2 });
  assert.equal(meilensteine(reihe(Array(4).fill("gut"))).length, 0);
});

test("Meilensteine: Schwung ohne diese Kennzahl unterbricht die Serie nicht", () => {
  const alle = [
    ...reihe(Array(3).fill("gut")),
    schwung(4, { gewicht: "gut" }),
    schwung(5, { tempo: "gut" }),
    schwung(6, { tempo: "gut" }),
  ];
  assert.equal(meilensteine(alle).find((m) => m.id === "tempo").laengste, 5);
});

test("Wochenrückblick: Anzahl, Sitzungen und größte Verbesserung", () => {
  const frueher = Array.from({ length: 4 }, (_, i) => schwung(i + 1, { tempo: "verbessern", gewicht: "gut" }, { datum: "2026-09-01" }));
  const woche = Array.from({ length: 4 }, (_, i) =>
    schwung(100 + i, { tempo: "gut", gewicht: "gut" }, { datum: i < 2 ? "2026-09-28" : "2026-10-01", sitzungId: 100 + (i % 2) }));
  const r = wochenRueckblick([...frueher, ...woche], "2026-10-01");
  assert.equal(r.anzahl, 4);
  assert.equal(r.sitzungen, 2);
  assert.equal(r.besserung.id, "tempo");
  assert.equal(r.besserung.unterschied, 2);
});

test("Wochenrückblick: Grenze von 7 Tagen und ohne Vergleichsdaten", () => {
  const alle = [
    schwung(1, { tempo: "gut" }, { datum: "2026-09-24" }), // genau 7 Tage her → nicht mehr diese Woche
    schwung(2, { tempo: "gut" }, { datum: "2026-09-25" }), // 6 Tage her → diese Woche
  ];
  const r = wochenRueckblick(alle, "2026-10-01");
  assert.equal(r.anzahl, 1);
  assert.equal(r.besserung, null);
});
