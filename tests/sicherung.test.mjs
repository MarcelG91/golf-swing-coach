// Tests für die Sicherung (Etappe 9, sicherung.js)
// Hin und zurück, Prüfung kaputter Dateien, Zusammenführen und: Der Coach-Schlüssel
// steht nie in der Sicherung.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  baueSicherung, pruefeSicherung, planeEinspielen, einstellungenFuerSicherung, vereinigeLernfortschritt,
  EINSTELLUNGEN_IN_SICHERUNG, SICHERUNG_FORMAT, SICHERUNG_VERSION,
} from "../sicherung.js";
import { PFADE, lektionenImPfad } from "../wissen.js";

const KOEDER = "sk-ant-api03-KOEDER-DARF-NIE-IN-DIE-SICHERUNG";
const [LEKTION_A, LEKTION_B, LEKTION_C] = lektionenImPfad(PFADE[0].id).map((l) => l.id);

// Ein Gerät mit allem, was im localStorage liegen kann – auch Schlüssel und Einwilligung
const geraet = new Map([
  ["coachSchluessel", KOEDER],
  ["coachEinwilligung", "ja-2"],
  ["level", "fortgeschritten"],
  ["levelVorschlagAb", "30"],
  ["darstellung", "dunkel"],
  ["liveKamera", "rueck"],
  ["wissenFortschritt", JSON.stringify([LEKTION_A, LEKTION_B])],
]);
const lese = (name) => geraet.get(name) ?? null;

// Zwei Sitzungen wie aus der Datenbank (Schwung-ID = "<Sitzungs-ID>-<Nummer>")
function beispielDaten() {
  const posen = [{ zeit: 0, punkte: null }, { zeit: 1 / 30, punkte: [{ x: 0.1234, y: 0.5, visibility: 0.99 }] }];
  const sitzungen = [
    { id: 1790000000000, datum: "2026-09-20", schlaeger: "Eisen 7", notiz: "Range „Süd“ 🙂", level: "einsteiger", schwungIds: ["1790000000000-1", "1790000000000-2"], appVersion: "0.30.0" },
    { id: 1790500000000, datum: "2026-10-01", schlaeger: "Driver", notiz: "", level: "einsteiger", schwungIds: ["1790500000000-1"], appVersion: "0.36.1" },
  ];
  const schwuenge = sitzungen.flatMap((s) => s.schwungIds.map((id, i) => ({
    id, sitzungId: s.id, nummer: i + 1, datum: s.datum, ansicht: "frontal", sicher: true,
    kennzahlen: [{ id: "tempo", messwert: 3.1, wert: "3,1:1", bewertung: "gut" }],
    phasen: { ansprechen: { zeit: 0, index: 0 }, top: { zeit: 0.7, index: 20 } },
    coach: i === 0 ? { fokus: "tempo", text: "Gut gemacht" } : null,
  })));
  const posedaten = Object.fromEntries(schwuenge.map((s) => [s.id, posen]));
  return { sitzungen, schwuenge, posedaten };
}

const baue = (daten = beispielDaten()) =>
  baueSicherung({ ...daten, einstellungen: einstellungenFuerSicherung(lese), appVersion: "0.37.0", erstellt: "2026-10-13T10:00:00.000Z" });

test("Hin und zurück: alles kommt unverändert wieder heraus", async () => {
  const daten = beispielDaten();
  const ergebnis = await pruefeSicherung(await baue(daten));
  assert.equal(ergebnis.ok, true, ergebnis.fehler);
  assert.deepEqual(ergebnis.daten.sitzungen, daten.sitzungen);
  assert.deepEqual(ergebnis.daten.schwuenge, daten.schwuenge);
  assert.deepEqual(ergebnis.daten.posedaten, daten.posedaten);
  assert.deepEqual(ergebnis.info, { erstellt: "2026-10-13T10:00:00.000Z", appVersion: "0.37.0", sitzungen: 2, schwuenge: 3 });
});

test("Coach-Schlüssel steht nie in der Sicherung – nur Einstellungen der Erlaubt-Liste", async () => {
  const einstellungen = einstellungenFuerSicherung(lese);
  assert.deepEqual(Object.keys(einstellungen), EINSTELLUNGEN_IN_SICHERUNG);
  assert.deepEqual(EINSTELLUNGEN_IN_SICHERUNG, ["wissenFortschritt"]);
  const text = await baue();
  assert.ok(!text.includes(KOEDER), "Köder-Schlüssel steht in der Datei");
  assert.ok(!text.includes("KOEDER") && !text.includes("sk-ant"), "Teile des Schlüssels stehen in der Datei");
  assert.ok(!/coachSchluessel|coachEinwilligung|levelVorschlagAb|liveKamera|darstellung/.test(text), "Fremde Einstellung in der Datei");
  // Einstellungen werden nur über den Namen der Erlaubt-Liste gelesen
  const gelesen = [];
  einstellungenFuerSicherung((name) => { gelesen.push(name); return null; });
  assert.deepEqual(gelesen, EINSTELLUNGEN_IN_SICHERUNG);
});

test("Lernfortschritt: nur gültige Lektionen, beim Einspielen vereinigt", () => {
  assert.deepEqual(einstellungenFuerSicherung(lese).wissenFortschritt, [LEKTION_A, LEKTION_B]);
  assert.deepEqual(einstellungenFuerSicherung(() => "kaputt{").wissenFortschritt, []);
  assert.deepEqual(vereinigeLernfortschritt([LEKTION_B, LEKTION_C], [LEKTION_A, LEKTION_B, "gibt-es-nicht", 42]), [LEKTION_B, LEKTION_C, LEKTION_A]);
  assert.deepEqual(vereinigeLernfortschritt([LEKTION_A], "kein Array"), [LEKTION_A]);
});

test("Kaputte Dateien werden abgelehnt – mit verständlicher Meldung", async () => {
  const text = await baue();
  const nein = async (kaputt, muster) => {
    const ergebnis = await pruefeSicherung(kaputt);
    assert.equal(ergebnis.ok, false);
    assert.match(ergebnis.fehler, muster);
  };
  await nein("", /keine Sicherung/);
  await nein("Hallo", /keine Sicherung/);
  await nein(text.slice(0, -40), /keine Sicherung|beschädigt/); // abgeschnitten
  await nein(JSON.stringify({ format: "etwas-anderes" }), /keine Sicherung dieser App/);
  await nein("[]", /keine Sicherung dieser App/);
  // Ein einziges geändertes Zeichen in den Daten (gültiges JSON) → Prüfsumme passt nicht
  await nein(text.replace('"messwert":3.1', '"messwert":3.2'), /beschädigt/);
  await nein(text.replace("Eisen 7", "Eisen 8"), /beschädigt/);
});

test("Neuere oder unbekannte Version wird abgelehnt", async () => {
  const datei = JSON.parse(await baue());
  assert.equal(datei.format, SICHERUNG_FORMAT);
  assert.equal(datei.formatVersion, SICHERUNG_VERSION);
  const mit = (version) => pruefeSicherung(JSON.stringify({ ...datei, formatVersion: version }));
  assert.match((await mit(SICHERUNG_VERSION + 1)).fehler, /neueren Version/);
  assert.match((await mit(0)).fehler, /unbekannte Version/);
  assert.match((await mit("1")).fehler, /unbekannte Version/);
});

// Von Hand veränderte Datei mit passender Prüfsumme: Der Aufbau wird trotzdem geprüft
async function mitDaten(aendere) {
  const daten = beispielDaten();
  aendere(daten);
  return pruefeSicherung(await baue(daten));
}

test("Aufbau wird geprüft: fehlende Schwünge, falsche IDs, kaputte Posedaten", async () => {
  assert.match((await mitDaten((d) => d.schwuenge.pop())).fehler, /fehlenden Schwung/);
  assert.match((await mitDaten((d) => { d.sitzungen[0].schwungIds[1] = "1790500000000-1"; })).fehler, /fehlerhaften oder fehlenden/);
  assert.match((await mitDaten((d) => { d.sitzungen[1].schwungIds = []; })).fehler, /fehlerhafte Sitzung/);
  assert.match((await mitDaten((d) => { d.sitzungen[1].id = "1790500000000"; })).fehler, /fehlerhafte Sitzung/);
  assert.match((await mitDaten((d) => { d.sitzungen[1].datum = "1.10.2026"; })).fehler, /fehlerhafte Sitzung/);
  assert.match((await mitDaten((d) => { d.sitzungen.push({ ...d.sitzungen[1] }); })).fehler, /fehlerhafte Sitzung/);
  assert.match((await mitDaten((d) => { d.schwuenge.push({ ...d.schwuenge[0] }); })).fehler, /fehlerhaften Schwung/);
  assert.match((await mitDaten((d) => { d.schwuenge.push({ ...d.schwuenge[0], id: "1790000000000-9" }); })).fehler, /ohne Sitzung/);
  assert.match((await mitDaten((d) => { delete d.posedaten["1790000000000-2"]; })).fehler, /fehlenden Schwung/);
  assert.match((await mitDaten((d) => { d.posedaten["1790000000000-2"] = [{ zeit: 0, punkte: [{ x: "0,1", y: 0 }] }]; })).fehler, /fehlenden Schwung/);
  assert.match((await mitDaten((d) => { d.schwuenge[2].sitzungId = 1790000000000; })).fehler, /fehlenden Schwung/);
  assert.match((await mitDaten((d) => { d.sitzungen = null; })).fehler, /unvollständig/);
});

test("Fremde Einstellungen in einer Datei werden beim Einspielen nicht übernommen", async () => {
  // Wer eine Datei von Hand baut, könnte z. B. einen Coach-Schlüssel hineinschreiben.
  // Prüfen lässt sie sich, aber die App übernimmt nur wissenFortschritt (vereinigeLernfortschritt).
  const daten = beispielDaten();
  const text = await baueSicherung({ ...daten, einstellungen: { wissenFortschritt: [LEKTION_C], coachSchluessel: "fremd" }, appVersion: "x", erstellt: "x" });
  const ergebnis = await pruefeSicherung(text);
  assert.equal(ergebnis.ok, true);
  const plan = planeEinspielen(ergebnis.daten, []);
  assert.ok(!JSON.stringify(plan).includes("fremd"));
  assert.deepEqual(vereinigeLernfortschritt([], ergebnis.daten.einstellungen.wissenFortschritt), [LEKTION_C]);
});

test("Zusammenführen: Vorhandene Sitzungen werden übersprungen, keine Doppelten", async () => {
  const { daten } = await pruefeSicherung(await baue());
  const alles = planeEinspielen(daten, []);
  assert.equal(alles.neu.length, 2);
  assert.equal(alles.schonDa, 0);
  assert.deepEqual(alles.neu[0].schwuenge.map((e) => e.schwung.id), ["1790000000000-1", "1790000000000-2"]);
  assert.equal(alles.neu[0].schwuenge[0].posedaten.length, 2);

  const teil = planeEinspielen(daten, [1790000000000, 1234]);
  assert.deepEqual(teil.neu.map((e) => e.sitzung.id), [1790500000000]);
  assert.equal(teil.schonDa, 1);

  // Nochmal einspielen, wenn schon alles da ist → nichts zu tun
  assert.deepEqual(planeEinspielen(daten, [1790000000000, 1790500000000]), { neu: [], schonDa: 2 });
});
