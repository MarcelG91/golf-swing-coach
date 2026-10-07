// Tests für coach.js (Coach-Feedback mit Claude, Etappe 11b) – ohne echte Anfrage, kostet nichts.
//
// 1. Die Anfrage enthält nur Kennzahlen – keine Posedaten, Videonamen, Notizen, Bilder.
// 2. Der Systemtext ist fest (kein Datum) und enthält alle geprüften Tipps der App vollständig.
// 3. Claude kann keinen Fokus "erfinden": ungültige Antworten fallen auf die App zurück.
// 4. Die ausführliche Antwort (ab 0.17.0) wird geprüft und gekürzt.
// 5. Die Antwort wird auch nach einem Rückfall auf ein anderes Modell vollständig gelesen.
// 6. Seit 0.26.0 ohne SDK: Kopfzeilen, Datenstrom (SSE) und Fehlerarten (HTTP-Status) selbst.
// Ausführen im Projektordner:  node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COACH_MODELL, COACH_BETA, baueKopierText, SYSTEMTEXT, ANTWORT_SCHEMA, coachDaten, baueCoachAnfrage, coachKopfzeilen,
  neuerDatenstrom, coachFehlerArt, pruefeCoachAntwort, verlaufKurz, kostenCent, leseAntwortText, leseAntwort, COACH_FEHLER,
} from "../coach.js";
import { TIPP_IDS, alleTipps } from "../tipps.js";

// Eine Kennzahl, wie die App sie intern hat – mit vielen Feldern, die NICHT gesendet werden dürfen
const kennzahl = (id, bewertung, extra = {}) => ({
  id, name: `Name ${id}`, wert: "12°", bewertung, detail: "Gut: 8–30°",
  messwert: 12, text: "langer Text", tipp: "alte Übung", kategorie: "oberkoerper", phase: "top", gewicht: 2,
  punkte: [{ x: 0.1, y: 0.2 }], videoName: "IMG_1234.MOV", notiz: "Range Hamburg", datum: "2026-09-28", ...extra,
});
const KENNZAHLEN = [kennzahl("tempo", "gut"), kennzahl("hueftSway", "verbessern"), kennzahl("schulterdrehung", "achtung")];
// Kennzahlen über dem Level – gehen nur als Hintergrund mit
const HINTERGRUND = [kennzahl("kopfSeitlich", "verbessern"), kennzahl("hueftBall", "gut")];

// Eine vollständige, gültige Antwort im neuen Format (Fokus: schulterdrehung)
const ANTWORT = {
  gesamtbild: " Dein Rhythmus passt, die Drehung fehlt. ",
  staerken: ["Ruhiges Tempo.", "  ", 42],
  fokusKennzahl: "schulterdrehung",
  wasPassiert: "Die Schultern drehen nur halb.",
  ursachen: "Oft zu aufrecht.",
  folgen: "Weniger Weite.",
  anleitung: ["Schritt 1", "Schritt 2", "Schritt 3", "Schritt 4"],
  gefuehl: "Rücken zeigt zum Ziel.",
  trainingsplan: [
    { titel: "Schläger vor der Brust", anleitung: "App-Übung", menge: "10×", erfolg: "Ende zeigt auf den Ball" },
    { titel: "Halbe Schwünge", anleitung: "Mit Ball", menge: "15 Bälle", erfolg: "Sauberer Treffer" },
    null,
  ],
  typischeFehler: ["Nur die Arme drehen"],
  zuHause: "Vor dem Spiegel.",
  danach: "Dann die Hüfte.",
  naechsteAufnahme: "Wieder von vorne filmen.",
};
test("Gesendet werden nur Kennzahlen – keine Posedaten, Videonamen, Notizen oder Daten", () => {
  const daten = coachDaten({ kennzahlen: KENNZAHLEN, hintergrund: HINTERGRUND, level: "fortgeschritten", ansicht: "frontal", wichtigste: KENNZAHLEN[1] });
  assert.deepEqual(Object.keys(daten).sort(),
    ["ansicht", "anzahlSchwuenge", "hintergrundKennzahlen", "kennzahlen", "level", "rechtshaender", "verlauf", "wichtigsteBaustelleDerApp"]);
  for (const k of [...daten.kennzahlen, ...daten.hintergrundKennzahlen]) {
    assert.deepEqual(Object.keys(k).sort(), ["bewertung", "id", "name", "wert", "ziel"]);
  }
  assert.deepEqual(daten.hintergrundKennzahlen.map((k) => k.id), ["kopfSeitlich", "hueftBall"]);
  // Ohne Hintergrund bleibt die Liste leer (z. B. Könner: alle Kennzahlen sind im Level)
  assert.deepEqual(coachDaten({ kennzahlen: KENNZAHLEN, level: "koenner", ansicht: "frontal" }).hintergrundKennzahlen, []);
  const gesendet = JSON.stringify(baueCoachAnfrage(daten));
  for (const verboten of ["IMG_1234", "Range Hamburg", "2026-09-28", "punkte", "videoName", "notiz", "posedaten", "langer Text"]) {
    assert.ok(!gesendet.includes(verboten), `„${verboten}“ darf nicht gesendet werden`);
  }
  assert.equal(daten.wichtigsteBaustelleDerApp, "hueftSway");
});

test("Anfrage: Modell, strukturierte Antwort, Rückfall bei Ablehnung, gründliches Denken", () => {
  const anfrage = baueCoachAnfrage(coachDaten({ kennzahlen: KENNZAHLEN, level: "koenner", ansicht: "frontal" }));
  assert.equal(anfrage.model, COACH_MODELL);
  assert.equal(anfrage.model, "claude-opus-5");
  assert.deepEqual(anfrage.output_config.format, { type: "json_schema", schema: ANTWORT_SCHEMA });
  assert.equal(anfrage.fallbacks, "default");
  // Genau diese Felder gehen an die API – wie bisher mit dem SDK (es hat "betas" als Kopfzeile
  // gesendet und "stream" selbst ergänzt). Kommt ein Feld dazu, schlägt dieser Test an.
  assert.deepEqual(Object.keys(anfrage).sort(),
    ["fallbacks", "max_tokens", "messages", "model", "output_config", "stream", "system", "thinking"]);
  assert.equal(anfrage.stream, true);
  assert.deepEqual(anfrage.thinking, { type: "adaptive" });
  assert.equal(anfrage.output_config.effort, "high");
  assert.ok(anfrage.max_tokens >= 16000, "genug Platz für Nachdenken plus lange Antwort");
  assert.equal(anfrage.system, SYSTEMTEXT);
  // Das Schema muss für strukturierte Antworten vollständig und geschlossen sein
  assert.equal(ANTWORT_SCHEMA.additionalProperties, false);
  assert.deepEqual([...ANTWORT_SCHEMA.required].sort(), Object.keys(ANTWORT_SCHEMA.properties).sort());
  const block = ANTWORT_SCHEMA.properties.trainingsplan.items;
  assert.equal(block.additionalProperties, false);
  assert.deepEqual([...block.required].sort(), Object.keys(block.properties).sort());
  // Die Beispiel-Antwort oben hat genau die Felder des Schemas
  assert.deepEqual(Object.keys(ANTWORT).sort(), Object.keys(ANTWORT_SCHEMA.properties).sort());
});

test("Systemtext: fest (kein Datum, keine Nutzerdaten), alle geprüften Tipps vollständig, Leitplanken", () => {
  assert.ok(!/\b20\d\d-\d\d-\d\d\b/.test(SYSTEMTEXT), "kein Datum im Systemtext");
  for (const id of TIPP_IDS) assert.ok(SYSTEMTEXT.includes(`### ${id}`), `Kennzahl ${id} fehlt im Katalog`);
  // Jeder Tipp steht vollständig drin: Erklärung, Schwunggedanke und jeder Übungsschritt
  for (const t of alleTipps(true)) {
    assert.ok(SYSTEMTEXT.includes(t.warum), `Erklärung von ${t.id} fehlt`);
    assert.ok(SYSTEMTEXT.includes(`„${t.gedanke}“`), `Schwunggedanke von ${t.id} fehlt`);
    for (const schritt of t.uebung?.schritte ?? []) assert.ok(SYSTEMTEXT.includes(schritt), `Übungsschritt von ${t.id} fehlt`);
  }
  // Leitplanken aus der Entscheidung vom 29.09.
  assert.match(SYSTEMTEXT, /Widersprich ihnen nie/);
  assert.match(SYSTEMTEXT, /Keine eigenen Erfindungen/);
  assert.match(SYSTEMTEXT, /Erfinde keine Messwerte/);
  assert.match(SYSTEMTEXT, /hintergrundKennzahlen: .*nie als Fokus/s);
  // Jedes Antwortfeld ist im Systemtext erklärt
  for (const feld of Object.keys(ANTWORT_SCHEMA.properties)) assert.match(SYSTEMTEXT, new RegExp(`- ${feld}:`), `Feld ${feld} nicht erklärt`);
});

test("Antwort prüfen: gültiger Fokus bleibt, erfundener wird durch die App ersetzt", () => {
  const ok = pruefeCoachAntwort(ANTWORT, { kennzahlen: KENNZAHLEN, wichtigste: KENNZAHLEN[1] });
  assert.equal(ok.fokusKennzahl, "schulterdrehung");
  assert.equal(ok.fokusErsetzt, false);
  assert.equal(ok.gesamtbild, "Dein Rhythmus passt, die Drehung fehlt.");
  assert.deepEqual(ok.staerken, ["Ruhiges Tempo."], "leere Einträge und Nicht-Texte fallen weg");
  assert.equal(ok.wasPassiert, "Die Schultern drehen nur halb.");
  assert.equal(ok.anleitung.length, 4);
  assert.equal(ok.trainingsplan.length, 2, "kaputter Block fällt weg");
  assert.deepEqual(ok.trainingsplan[0], ANTWORT.trainingsplan[0]);
  assert.equal(ok.naechsteAufnahme, "Wieder von vorne filmen.");

  // Kennzahl, die gar nicht gemessen wurde → App-eigene wichtigste Baustelle
  const erfunden = pruefeCoachAntwort({ ...ANTWORT, fokusKennzahl: "handgelenkWinkel" },
    { kennzahlen: KENNZAHLEN, wichtigste: KENNZAHLEN[1] });
  assert.equal(erfunden.fokusKennzahl, "hueftSway");
  assert.equal(erfunden.fokusErsetzt, true);
  // Claudes Texte zum Fokus passen nicht zum ersetzten Fokus – die App zeigt dann ihre eigenen
  for (const feld of ["wasPassiert", "ursachen", "folgen", "gefuehl", "zuHause"]) assert.equal(erfunden[feld], "", feld);
  for (const feld of ["anleitung", "trainingsplan", "typischeFehler"]) assert.deepEqual(erfunden[feld], [], feld);
  // Was nicht am Fokus hängt, bleibt
  assert.equal(erfunden.gesamtbild, "Dein Rhythmus passt, die Drehung fehlt.");
  assert.equal(erfunden.naechsteAufnahme, "Wieder von vorne filmen.");

  // Eine Kennzahl aus dem Hintergrund (über dem Level) ist als Fokus ungültig
  const hintergrund = pruefeCoachAntwort({ ...ANTWORT, fokusKennzahl: "kopfSeitlich" }, { kennzahlen: KENNZAHLEN, wichtigste: KENNZAHLEN[1] });
  assert.equal(hintergrund.fokusKennzahl, "hueftSway");

  // Eine GRÜNE Kennzahl als Fokus ist auch ungültig
  assert.equal(pruefeCoachAntwort({ fokusKennzahl: "tempo" }, { kennzahlen: KENNZAHLEN, wichtigste: KENNZAHLEN[1] }).fokusKennzahl, "hueftSway");

  // Keine Baustelle gemessen, Claude lässt das Feld leer → kein Fokus, nichts ersetzt, Plan zum Festigen bleibt
  const allesGut = pruefeCoachAntwort({ ...ANTWORT, fokusKennzahl: "", wasPassiert: "" },
    { kennzahlen: [kennzahl("tempo", "gut")], wichtigste: null });
  assert.equal(allesGut.fokusKennzahl, "");
  assert.equal(allesGut.fokusErsetzt, false);
  assert.equal(allesGut.trainingsplan.length, 2);

  // Kaputte Antwort (kein Objekt, falsche Typen) → leere Texte, App-Fokus
  const kaputt = pruefeCoachAntwort(null, { kennzahlen: KENNZAHLEN, wichtigste: KENNZAHLEN[1] });
  assert.deepEqual([kaputt.gesamtbild, kaputt.fokusKennzahl, kaputt.staerken], ["", "hueftSway", []]);
  const falscheTypen = pruefeCoachAntwort({ gesamtbild: 42, anleitung: "kein Array", trainingsplan: {} }, { kennzahlen: KENNZAHLEN });
  assert.deepEqual([falscheTypen.gesamtbild, falscheTypen.anleitung, falscheTypen.trainingsplan], ["", [], []]);
  // Überlange Texte und Listen werden gekürzt
  const lang = pruefeCoachAntwort({
    ...ANTWORT,
    gesamtbild: "a".repeat(5000),
    wasPassiert: "b".repeat(5000),
    staerken: Array(10).fill("c".repeat(1000)),
    anleitung: Array(20).fill("Schritt"),
    trainingsplan: Array(10).fill({ titel: "t".repeat(500), anleitung: "x", menge: "y", erfolg: "z" }),
  }, { kennzahlen: KENNZAHLEN });
  assert.equal(lang.gesamtbild.length, 1200);
  assert.equal(lang.wasPassiert.length, 800);
  assert.deepEqual([lang.staerken.length, lang.staerken[0].length], [3, 400]);
  assert.equal(lang.anleitung.length, 8);
  assert.deepEqual([lang.trainingsplan.length, lang.trainingsplan[0].titel.length], [6, 80]);
  assert.equal(leseAntwortText("kein json"), null);
  assert.deepEqual(leseAntwortText('{"lob":"x"}'), { lob: "x" });
});

test("Antwort lesen: ein Textblock, Rückfall mitten in der Antwort, Neubeginn (Check 29.09.)", () => {
  const json = JSON.stringify(ANTWORT);
  const teil = Math.floor(json.length * 0.4);
  const denken = { type: "thinking", thinking: "", signature: "x" };
  const text = (t) => ({ type: "text", text: t });
  // So markiert die API den Wechsel auf ein anderes Modell im Datenstrom
  const rueckfall = { type: "fallback", from: { model: "claude-opus-5" }, to: { model: "claude-opus-4-8" } };

  // Normalfall: Denk-Block und EIN Textblock
  assert.deepEqual(leseAntwort([denken, text(json)]), ANTWORT);
  // Rückfall mitten in der Antwort: Anfang + Markierung + Fortsetzung ergeben zusammen das JSON.
  // Vorher las die App nur den ersten Textblock und meldete "unvollständig" – trotz bezahlter Antwort.
  assert.deepEqual(leseAntwort([denken, text(json.slice(0, teil)), rueckfall, text(json.slice(teil))]), ANTWORT);
  // Rückfall vor dem ersten Wort: die Markierung steht vorn, danach ganz normal
  assert.deepEqual(leseAntwort([rueckfall, denken, text(json)]), ANTWORT);
  // Beginnt das zweite Modell von vorn, zählt der letzte Textblock
  assert.deepEqual(leseAntwort([text(json.slice(0, teil)), rueckfall, text(json)]), ANTWORT);
  // Kein Text, abgebrochenes JSON, gar kein Inhalt → null (die App meldet dann "unvollständig")
  assert.equal(leseAntwort([denken]), null);
  assert.equal(leseAntwort([text(json.slice(0, teil))]), null);
  assert.equal(leseAntwort(undefined), null);
});

test("Kopfzeilen: Schlüssel nur in x-api-key, Browser-Freigabe, Version, Beta für den Rückfall", () => {
  const kopf = coachKopfzeilen("sk-ant-test-1234");
  assert.deepEqual(kopf, {
    "content-type": "application/json",
    "x-api-key": "sk-ant-test-1234",
    "anthropic-version": "2023-06-01",
    "anthropic-beta": "server-side-fallback-2026-07-01",
    "anthropic-dangerous-direct-browser-access": "true",
  });
  assert.equal(COACH_BETA, "server-side-fallback-2026-07-01");
  // Der Schlüssel landet nie in den gesendeten Daten
  const gesendet = JSON.stringify(baueCoachAnfrage(coachDaten({ kennzahlen: KENNZAHLEN, level: "einsteiger", ansicht: "frontal" })));
  assert.ok(!gesendet.includes("sk-ant"));
});

// ---------------------------------------------------------------
// Datenstrom (SSE) – so, wie ihn die API sendet
// ---------------------------------------------------------------
const sse = (ereignisse, zeilenende = "\n") =>
  ereignisse.map((e) => `event: ${e.type}${zeilenende}data: ${JSON.stringify(e)}${zeilenende}${zeilenende}`).join("");
// Den Text in kleine Stücke zerteilt einfüttern – wie er auch aus dem Netz kommt (mitten in Zeilen)
function lies(text, stueckLaenge = 7) {
  const strom = neuerDatenstrom();
  for (let i = 0; i < text.length; i += stueckLaenge) strom.fuettere(text.slice(i, i + stueckLaenge));
  return strom;
}
const start = (model = "claude-opus-5") => ({
  type: "message_start",
  message: { id: "msg_1", type: "message", role: "assistant", model, content: [], stop_reason: null, usage: { input_tokens: 3000, cache_read_input_tokens: 0, output_tokens: 1 } },
});
const blockStart = (index, content_block) => ({ type: "content_block_start", index, content_block });
const textStueck = (index, text) => ({ type: "content_block_delta", index, delta: { type: "text_delta", text } });
const blockEnde = (index) => ({ type: "content_block_stop", index });
const ende = (stop_reason = "end_turn", output_tokens = 1000) => [
  { type: "message_delta", delta: { stop_reason, stop_sequence: null }, usage: { output_tokens, input_tokens: null } },
  { type: "message_stop" },
];
// Nachdenken: bei Claude Opus 5 kommt nur die Signatur, kein lesbarer Text
const denken = (index) => [
  blockStart(index, { type: "thinking", thinking: "", signature: "" }),
  { type: "content_block_delta", index, delta: { type: "signature_delta", signature: "sig" } },
  blockEnde(index),
];

test("Datenstrom: Normalfall – Nachricht wie vom SDK, auch in kleinen Stücken und mit \\r\\n", () => {
  const json = JSON.stringify(ANTWORT);
  const ereignisse = [
    start(), { type: "ping" }, ...denken(0),
    blockStart(1, { type: "text", text: "" }), textStueck(1, json.slice(0, 50)), { type: "ping" }, textStueck(1, json.slice(50)), blockEnde(1),
    ...ende(),
  ];
  for (const zeilenende of ["\n", "\r\n"]) {
    for (const stueckLaenge of [1, 7, 100000]) {
      const strom = lies(sse(ereignisse, zeilenende), stueckLaenge);
      assert.equal(strom.fertig, true);
      assert.equal(strom.fehlerTyp, "");
      assert.equal(strom.textBegonnen, true);
      assert.equal(strom.nachricht.model, "claude-opus-5");
      assert.equal(strom.nachricht.stop_reason, "end_turn");
      // Token-Zahlen: Eingabe aus message_start bleibt (null überschreibt nicht), Ausgabe aus message_delta
      assert.deepEqual(strom.nachricht.usage, { input_tokens: 3000, cache_read_input_tokens: 0, output_tokens: 1000 });
      assert.deepEqual(strom.nachricht.content[0], { type: "thinking", thinking: "", signature: "sig" });
      assert.deepEqual(leseAntwort(strom.nachricht.content), ANTWORT);
      assert.equal(kostenCent(strom.nachricht.usage), 4);
    }
  }
});

test("Datenstrom: Rückfall mitten in der Antwort – ein Strom, Block „fallback“, Antwort vollständig", () => {
  const json = JSON.stringify(ANTWORT);
  const teil = Math.floor(json.length * 0.4);
  const strom = lies(sse([
    start(), ...denken(0),
    blockStart(1, { type: "text", text: "" }), textStueck(1, json.slice(0, teil)), blockEnde(1),
    // So markiert die API den Wechsel (kein eigenes Ereignis, ein normaler Block)
    blockStart(2, { type: "fallback", from: { model: "claude-opus-5" }, to: { model: "claude-opus-4-8" } }), blockEnde(2),
    blockStart(3, { type: "text", text: "" }), textStueck(3, json.slice(teil)), blockEnde(3),
    ...ende(),
  ]));
  assert.equal(strom.fertig, true);
  assert.equal(strom.nachricht.model, "claude-opus-4-8", "gespeichert wird das Modell, das die Antwort fertig geschrieben hat");
  assert.deepEqual(leseAntwort(strom.nachricht.content), ANTWORT);
});

test("Datenstrom: Fehler mitten im Strom, Abbruch und Ablehnung werden erkannt", () => {
  // API meldet mitten im Strom „überlastet“
  const fehler = lies(sse([start(), blockStart(0, { type: "text", text: "" }), textStueck(0, "{\"ges"),
    { type: "error", error: { type: "overloaded_error", message: "Overloaded" } }]));
  assert.equal(fehler.fehlerTyp, "overloaded_error");
  assert.equal(fehler.fertig, false);
  assert.equal(coachFehlerArt({ typ: fehler.fehlerTyp }), "ueberlastet");
  // Verbindung reißt ab: kein message_stop → nicht fertig (app.js meldet „unvollständig“)
  const abgebrochen = lies(sse([start(), blockStart(0, { type: "text", text: "" }), textStueck(0, "{\"ges")]).slice(0, -5));
  assert.equal(abgebrochen.fertig, false);
  assert.equal(leseAntwort(abgebrochen.nachricht.content), null);
  // Ablehnung (auch nach dem Rückfall): kommt als ganz normales Ende mit stop_reason "refusal"
  const abgelehnt = lies(sse([start(), ...ende("refusal", 0)]));
  assert.equal(abgelehnt.fertig, true);
  assert.equal(abgelehnt.nachricht.stop_reason, "refusal");
  assert.equal(abgelehnt.textBegonnen, false);
});

test("Fehlerart aus HTTP-Status oder Fehlertyp der API", () => {
  const erwartet = { 401: "schluessel", 403: "schluessel", 402: "guthaben", 429: "zuViele", 500: "ueberlastet", 529: "ueberlastet", 400: "unbekannt", 404: "unbekannt", 413: "unbekannt" };
  for (const [status, art] of Object.entries(erwartet)) assert.equal(coachFehlerArt({ status: Number(status) }), art, `Status ${status}`);
  assert.equal(coachFehlerArt({ typ: "authentication_error" }), "schluessel");
  assert.equal(coachFehlerArt({ typ: "billing_error" }), "guthaben");
  assert.equal(coachFehlerArt({ typ: "rate_limit_error" }), "zuViele");
  assert.equal(coachFehlerArt({ typ: "api_error" }), "ueberlastet");
  assert.equal(coachFehlerArt({ typ: "invalid_request_error" }), "unbekannt");
  assert.equal(coachFehlerArt(), "unbekannt");
  for (const art of ["schluessel", "guthaben", "zuViele", "ueberlastet", "unbekannt"]) assert.ok(COACH_FEHLER[art], art);
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
  for (const art of ["schluessel", "guthaben", "zuViele", "ueberlastet", "verbindung", "abgelehnt", "unvollstaendig", "unbekannt"]) {
    assert.ok(COACH_FEHLER[art], art);
  }
});

test("Für Claude kopieren: Anleitung plus dieselben Kennzahlen, nichts Privates", () => {
  const daten = coachDaten({ kennzahlen: KENNZAHLEN, hintergrund: HINTERGRUND, level: "einsteiger", ansicht: "frontal" });
  const text = baueKopierText(daten);
  assert.ok(text.startsWith(SYSTEMTEXT), "enthält den festen Anleitungstext mit den geprüften Tipps");
  assert.ok(text.includes(JSON.stringify(daten, null, 2)), "enthält genau die Coach-Daten");
  for (const verboten of ["IMG_1234", "Range Hamburg", "2026-09-28", "punkte", "messwert"]) {
    assert.ok(!text.includes(verboten), `${verboten} darf nicht im Kopiertext stehen`);
  }
});
