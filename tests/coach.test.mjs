// Tests für coach.js (Coach-Feedback mit Claude, Etappe 11b) – ohne echte Anfrage, kostet nichts.
//
// 1. Die Anfrage enthält nur Kennzahlen – keine Posedaten, Videonamen, Notizen, Bilder.
// 2. Der Systemtext ist fest (kein Datum) und kennt alle Kennzahlen und Übungen der App.
// 3. Claude kann keinen Fokus "erfinden": ungültige Antworten fallen auf die App zurück.
// Ausführen im Projektordner:  node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COACH_MODELL, SYSTEMTEXT, ANTWORT_SCHEMA, coachDaten, baueCoachAnfrage, pruefeCoachAntwort,
  verlaufKurz, kostenCent, leseAntwortText, COACH_FEHLER,
} from "../coach.js";
import { TIPP_IDS } from "../tipps.js";

// Eine Kennzahl, wie die App sie intern hat – mit vielen Feldern, die NICHT gesendet werden dürfen
const kennzahl = (id, bewertung, extra = {}) => ({
  id, name: `Name ${id}`, wert: "12°", bewertung, detail: "Gut: 8–30°",
  messwert: 12, text: "langer Text", tipp: "alte Übung", kategorie: "oberkoerper", phase: "top", gewicht: 2,
  punkte: [{ x: 0.1, y: 0.2 }], videoName: "IMG_1234.MOV", notiz: "Range Hamburg", datum: "2026-09-28", ...extra,
});
const KENNZAHLEN = [kennzahl("tempo", "gut"), kennzahl("hueftSway", "verbessern"), kennzahl("schulterdrehung", "achtung")];

test("Gesendet werden nur Kennzahlen – keine Posedaten, Videonamen, Notizen oder Daten", () => {
  const daten = coachDaten({ kennzahlen: KENNZAHLEN, level: "fortgeschritten", ansicht: "frontal", wichtigste: KENNZAHLEN[1] });
  assert.deepEqual(Object.keys(daten).sort(),
    ["ansicht", "anzahlSchwuenge", "kennzahlen", "level", "rechtshaender", "verlauf", "wichtigsteBaustelleDerApp"]);
  for (const k of daten.kennzahlen) assert.deepEqual(Object.keys(k).sort(), ["bewertung", "id", "name", "wert", "ziel"]);
  const gesendet = JSON.stringify(baueCoachAnfrage(daten));
  for (const verboten of ["IMG_1234", "Range Hamburg", "2026-09-28", "punkte", "videoName", "notiz", "posedaten", "langer Text"]) {
    assert.ok(!gesendet.includes(verboten), `„${verboten}“ darf nicht gesendet werden`);
  }
  assert.equal(daten.wichtigsteBaustelleDerApp, "hueftSway");
});

test("Anfrage: Modell, strukturierte Antwort, Rückfall bei Ablehnung, adaptives Denken", () => {
  const anfrage = baueCoachAnfrage(coachDaten({ kennzahlen: KENNZAHLEN, level: "koenner", ansicht: "frontal" }));
  assert.equal(anfrage.model, COACH_MODELL);
  assert.equal(anfrage.model, "claude-opus-5");
  assert.deepEqual(anfrage.output_config.format, { type: "json_schema", schema: ANTWORT_SCHEMA });
  assert.equal(anfrage.fallbacks, "default");
  assert.deepEqual(anfrage.betas, ["server-side-fallback-2026-07-01"]);
  assert.deepEqual(anfrage.thinking, { type: "adaptive" });
  assert.equal(anfrage.system, SYSTEMTEXT);
  // Das Schema muss für strukturierte Antworten vollständig und geschlossen sein
  assert.equal(ANTWORT_SCHEMA.additionalProperties, false);
  assert.deepEqual([...ANTWORT_SCHEMA.required].sort(), Object.keys(ANTWORT_SCHEMA.properties).sort());
});

test("Systemtext: fest (kein Datum, keine Nutzerdaten) und kennt alle Kennzahlen der App", () => {
  assert.ok(!/\b20\d\d-\d\d-\d\d\b/.test(SYSTEMTEXT), "kein Datum im Systemtext");
  for (const id of TIPP_IDS) assert.ok(SYSTEMTEXT.includes(`- ${id}`), `Kennzahl ${id} fehlt im Katalog`);
  assert.match(SYSTEMTEXT, /KEINE eigene Übung/);
  assert.match(SYSTEMTEXT, /Stab-Übung/);
});

test("Antwort prüfen: gültiger Fokus bleibt, erfundener wird durch die App ersetzt", () => {
  const ok = pruefeCoachAntwort(
    { lob: " Toller Rhythmus. ", fokusKennzahl: "schulterdrehung", fokusBotschaft: "Mehr Drehung bringt Weite.", naechstesMal: "Film von hinten." },
    { kennzahlen: KENNZAHLEN, wichtigste: KENNZAHLEN[1] });
  assert.equal(ok.fokusKennzahl, "schulterdrehung");
  assert.equal(ok.fokusErsetzt, false);
  assert.equal(ok.lob, "Toller Rhythmus.");

  // Kennzahl, die gar nicht gemessen wurde → App-eigene wichtigste Baustelle
  const erfunden = pruefeCoachAntwort(
    { lob: "x", fokusKennzahl: "handgelenkWinkel", fokusBotschaft: "Erfundene Begründung", naechstesMal: "y" },
    { kennzahlen: KENNZAHLEN, wichtigste: KENNZAHLEN[1] });
  assert.equal(erfunden.fokusKennzahl, "hueftSway");
  assert.equal(erfunden.fokusErsetzt, true);
  assert.equal(erfunden.fokusBotschaft, "", "Claudes Begründung passt nicht zum ersetzten Fokus");

  // Eine GRÜNE Kennzahl als Fokus ist auch ungültig
  assert.equal(pruefeCoachAntwort({ fokusKennzahl: "tempo" }, { kennzahlen: KENNZAHLEN, wichtigste: KENNZAHLEN[1] }).fokusKennzahl, "hueftSway");

  // Keine Baustelle gemessen, Claude lässt das Feld leer → kein Fokus, nichts ersetzt
  const allesGut = pruefeCoachAntwort({ lob: "Super", fokusKennzahl: "", fokusBotschaft: "", naechstesMal: "Weiter so" },
    { kennzahlen: [kennzahl("tempo", "gut")], wichtigste: null });
  assert.equal(allesGut.fokusKennzahl, "");
  assert.equal(allesGut.fokusErsetzt, false);

  // Kaputte Antwort (kein Objekt, falsche Typen) → leere Texte, App-Fokus
  const kaputt = pruefeCoachAntwort(null, { kennzahlen: KENNZAHLEN, wichtigste: KENNZAHLEN[1] });
  assert.deepEqual([kaputt.lob, kaputt.fokusKennzahl], ["", "hueftSway"]);
  assert.equal(pruefeCoachAntwort({ lob: 42 }, { kennzahlen: KENNZAHLEN }).lob, "");
  // Überlange Texte werden gekürzt
  assert.equal(pruefeCoachAntwort({ lob: "a".repeat(2000) }, { kennzahlen: KENNZAHLEN }).lob.length, 400);
  assert.equal(leseAntwortText("kein json"), null);
  assert.deepEqual(leseAntwortText('{"lob":"x"}'), { lob: "x" });
});

test("Verlauf: nur sichere Schwünge, höchstens die letzten 10, erst ab 2 Messungen", () => {
  const schwung = (id, bewertung, sicher = true) => ({ id, sicher, kennzahlen: [{ id: "tempo", bewertung }] });
  const schwuenge = [
    ...Array.from({ length: 12 }, (_, i) => schwung(`100${String(i).padStart(2, "0")}-1`, i < 4 ? "verbessern" : "gut")),
    schwung("99999-1", "gut", false), // unsicher: zählt nicht
  ];
  // Die letzten 10 von 12: Nr. 2 und 3 "verbessern", Nr. 4–11 "gut"
  assert.deepEqual(verlaufKurz(schwuenge, ["tempo", "hueftSway"]), { tempo: "8 von 10 im Zielbereich" });
  assert.deepEqual(verlaufKurz([schwung("1-1", "gut")], ["tempo"]), {});
});

test("Kosten in Cent aus den Token-Zahlen, Fehlertexte vorhanden", () => {
  // 3 000 Tokens hinein (5 $/Mio.) + 1 000 heraus (25 $/Mio.) = 0,015 + 0,025 = 0,04 $ = 4 Cent
  assert.equal(kostenCent({ input_tokens: 3000, output_tokens: 1000 }), 4);
  assert.equal(kostenCent(null), null);
  for (const art of ["schluessel", "guthaben", "zuViele", "ueberlastet", "verbindung", "laden", "abgelehnt", "unvollstaendig", "unbekannt"]) {
    assert.ok(COACH_FEHLER[art], art);
  }
});
