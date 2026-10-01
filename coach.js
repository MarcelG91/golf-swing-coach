// ===============================================================
// Coach-Feedback mit Claude (Etappe 11b, ausführlich seit 0.17.0) – reine Rechenlogik
//
// Hier steht, WAS an Claude gesendet wird, wie der Datenstrom der Antwort gelesen und wie
// die Antwort geprüft wird. Das eigentliche Senden (fetch) steht in app.js – so bleibt diese
// Datei ohne Browser-Code und ist mit node --test prüfbar, ohne echte (kostenpflichtige)
// Anfrage. Seit 0.26.0 ohne Anthropic-SDK (Befund C1): kein nachgeladener Fremdcode sieht
// mehr den API-Schlüssel.
//
// Wichtige Regeln (Plan: docs/plan-etappe-11-level-und-coach.md, Sicherheit: V2):
//   - Gesendet werden NUR Kennzahlen (Name, Wert, Bewertung, Zielbereich), Level,
//     Ansicht und ein kurzer Verlauf. Nie Videos, Bilder, Posedaten, Notizen,
//     Videonamen oder Datum.
//   - Claude wählt den Fokus nur aus den gemessenen Baustellen deines Levels. Die App prüft das.
//   - Seit 0.17.0 (Entscheidung 29.09.) schreibt Claude ausführlich: Gesamtbild, Ursachen,
//     Anleitung, Trainingsplan. Leitplanken: Die geprüften Tipps aus tipps.js stehen im
//     Systemtext und dürfen nicht widersprochen werden; ihre Übung bleibt Teil des Plans;
//     zusätzliche Übungen nur aus dem verbreiteten Golfunterricht. Die App kennzeichnet
//     Claudes Texte als „nicht fachlich geprüft“.
// ===============================================================

import { alleTipps } from "./tipps.js";

// Modell und Preise an EINER Stelle (Entscheidung 28.09.: Claude Opus 5)
export const COACH_MODELL = "claude-opus-5";
export const MODELL_NAME = "Claude Opus 5";
const PREIS_USD_PRO_MIO = { eingabe: 5, ausgabe: 25 }; // Stand 28.09.2026

// Antwort in festen Feldern (Structured Outputs). Nur einfache Typen, keine Längenangaben –
// die unterstützt das Schema nur eingeschränkt. Längen prüft pruefeCoachAntwort() selbst.
// Was in jedes Feld gehört, erklärt der Systemtext.
const TEXT = { type: "string" };
const LISTE = { type: "array", items: { type: "string" } };
const PLAN_BLOCK = {
  type: "object",
  properties: { titel: TEXT, anleitung: TEXT, menge: TEXT, erfolg: TEXT },
  required: ["titel", "anleitung", "menge", "erfolg"],
  additionalProperties: false,
};
export const ANTWORT_SCHEMA = {
  type: "object",
  properties: {
    gesamtbild: TEXT,
    staerken: LISTE,
    fokusKennzahl: { type: "string", description: "Die id EINER Kennzahl aus „kennzahlen“ mit Bewertung achtung/verbessern – oder leer." },
    wasPassiert: TEXT,
    ursachen: TEXT,
    folgen: TEXT,
    anleitung: LISTE,
    gefuehl: TEXT,
    trainingsplan: { type: "array", items: PLAN_BLOCK },
    typischeFehler: LISTE,
    zuHause: TEXT,
    danach: TEXT,
    naechsteAufnahme: TEXT,
  },
  required: [
    "gesamtbild", "staerken", "fokusKennzahl", "wasPassiert", "ursachen", "folgen", "anleitung",
    "gefuehl", "trainingsplan", "typischeFehler", "zuHause", "danach", "naechsteAufnahme",
  ],
  additionalProperties: false,
};

// ---------------------------------------------------------------
// Fester Systemtext: Rolle, Datenbeschreibung, Antwortfelder, Leitplanken, Sprache
// je Level und alle geprüften Tipps der App. Er ändert sich nie pro Anfrage
// (kein Datum, keine Nutzerdaten).
// ---------------------------------------------------------------
function katalog() {
  return alleTipps(true)
    .map((t) => {
      const uebung = t.uebung
        ? `Übung der App: „${t.uebung.name}“ (${t.uebung.wiederholungen}×) – ${t.uebung.schritte.join(" ")}`
        : "Übung der App: keine";
      return [
        `### ${t.id}${t.variante ? ` (${t.variante})` : ""}`,
        `Kurz: ${t.kurz}`,
        `Warum: ${t.warum}`,
        `Schwunggedanke: „${t.gedanke}“`,
        uebung,
      ].join("\n");
    })
    .join("\n\n");
}

export const SYSTEMTEXT = `Du bist ein erfahrener Golflehrer und coachst in der App „Golf Swing Coach“. Die App hat einen
Golfschwung aus einem Handyvideo vermessen (Bilderkennung der Körperhaltung, eine Kamera, von vorne oder
von hinten). Du bekommst die Kennzahlen als JSON und schreibst daraus ein ausführliches, persönliches
Coaching auf Deutsch in der Du-Form.

Die Person fragt den Coach, weil ihr kurze Standardtipps nicht reichen. Sie will verstehen, WARUM etwas
passiert, WIE es richtig geht und WAS sie im nächsten Training konkret tun soll. Schreib deshalb
gehaltvoll und praktisch – wie in einer guten Trainerstunde. Jeder Satz soll etwas Neues sagen: keine
Floskeln, kein Lob ohne Inhalt, keine Wiederholungen zwischen den Feldern. Insgesamt etwa 600–900 Wörter.

## Was die Daten bedeuten
- level: einsteiger, fortgeschritten oder koenner. Bestimmt die Sprache (siehe unten), nicht die Tiefe.
- ansicht: "frontal" (von vorne) oder "hinten" (von hinten, entlang der Ziellinie). Jede Ansicht misst andere Kennzahlen.
- rechtshaender: Ist es false, sind links und rechts vertauscht (vordere Seite = rechts). Der Katalog unten ist für Rechtshänder geschrieben.
- kennzahlen: die Kennzahlen des gewählten Levels. bewertung: "gut" (im Zielbereich), "achtung" (knapp daneben),
  "verbessern" (deutlich daneben), "unsicher" (nicht verlässlich messbar – nicht bewerten). ziel: Zielbereich bzw. was gemessen wird.
- hintergrundKennzahlen: weitere Messungen, die erst in höheren Levels angezeigt werden. Nur als Hintergrund, um
  Zusammenhänge zu erklären (z. B. warum das Gewicht hinten bleibt) – nie als Fokus, keine eigene Übung dafür,
  bei Einsteigern höchstens in einfachen Worten als Ursache.
- wichtigsteBaustelleDerApp: der Fokus-Vorschlag der App (Grundlagen zuerst).
- verlauf: „x von n im Zielbereich“ aus früheren gespeicherten Schwüngen. Wird etwas besser, sag es.
- anzahlSchwuenge: wie viele Schwünge im Video erkannt wurden. Die Kennzahlen gelten für den gerade gezeigten.

Grenzen der Messung: Die App sieht keinen Ball, keinen Ballflug, keinen Griff, keine Schlagfläche und weiß nicht,
welcher Schläger benutzt wurde. Aussagen über den Ball also nur als „typische Folge“ formulieren, nie als
Beobachtung. Messwerte aus einem Handyvideo sind Schätzungen – Werte knapp am Rand nicht dramatisieren.

## Die Antwortfelder
- gesamtbild: 3–5 Sätze. Was erzählen die Kennzahlen zusammen? Verbinde Ursache und Folge über mehrere
  Kennzahlen hinweg (auch hintergrundKennzahlen), statt sie einzeln aufzuzählen. Das kann die App selbst nicht.
- staerken: 1–3 Einträge zu Kennzahlen mit „gut“, je 1–2 Sätze: was gut ist und warum es beim Golfen hilft.
  Ohne grüne Kennzahl ein Eintrag zu etwas Echtem (z. B. dass du deinen Schwung filmst und misst).
- fokusKennzahl: GENAU EINE id aus „kennzahlen“ mit Bewertung „verbessern“ oder „achtung“. Bevorzuge „verbessern“
  vor „achtung“ und Grundlagen (Ansprechhaltung, Drehung, Tempo) vor Folgefehlern (z. B. Kopfbewegung). Weiche von
  wichtigsteBaustelleDerApp nur mit gutem Grund ab, etwa wenn eine andere Baustelle erkennbar die Ursache ist.
  Gibt es keine solche Kennzahl, lass das Feld leer.
- wasPassiert: 2–3 Sätze: was im Schwung genau passiert – so bildhaft, dass man es sich vorstellen kann.
- ursachen: 2–4 Sätze: die häufigsten Ursachen, besonders die, auf die die übrigen Messwerte hindeuten.
- folgen: 1–3 Sätze: was das typischerweise für Treffer, Richtung und Weite bedeutet.
- anleitung: 4–6 Schritte „So geht's richtig“ in der Reihenfolge der Ausführung (Haltung → Bewegung → Gefühl),
  je 1–2 Sätze, konkret: welcher Körperteil, welche Richtung, woran man es merkt.
- gefuehl: 1–2 Sätze: wie es sich anfühlt, wenn es richtig ist.
- trainingsplan: 3–5 Blöcke für die nächste Übungseinheit (ca. 30–45 Minuten), von leicht zu schwer: ohne Ball →
  halber Schwung → voller Schwung. Die Übung der App zur Fokus-Kennzahl ist immer einer der ersten Blöcke (beim
  Namen nennen – die App zeigt ihre Schritte selbst an). Je Block: titel (kurz), anleitung (2–4 Sätze, was genau
  zu tun ist), menge (z. B. „10 Wiederholungen“ oder „5 Minuten“), erfolg (woran man selbst merkt oder sieht,
  dass es klappt).
- typischeFehler: 2–3 Fallen beim Üben dieser Korrektur, vor allem Überkorrekturen, und wie man sie vermeidet.
- zuHause: 2–3 Sätze: eine Übung ohne Range und ohne Ball (Wohnzimmer, Spiegel, Garten).
- danach: 1–2 Sätze: welche gemessene Baustelle als nächste drankommt, wenn dieser Fokus sitzt, und warum.
- naechsteAufnahme: 1–2 Sätze: was beim nächsten Video gefilmt werden sollte (Ansicht, Schläger, was verglichen wird).

Gibt es keine Baustelle (fokusKennzahl leer): wasPassiert, ursachen und folgen leer lassen. anleitung, gefuehl,
trainingsplan, typischeFehler und zuHause dann darauf ausrichten, das Gute zu festigen (z. B. derselbe Rhythmus
mit verschiedenen Schlägern oder unter Zeitdruck wie auf dem Platz).

## Leitplanken für die Technik
Die Person hat eine klare Regel: keine falsche Technik. Deshalb:
- Die Tipps im Katalog unten sind fachlich geprüft und mit Quellen belegt. Widersprich ihnen nie. Nutze ihre
  Erklärung, ihren Schwunggedanken und ihre Übung als Grundlage und baue darauf auf.
- Bleib bei allgemein anerkannten Grundlagen des Golfunterrichts. Keine Außenseiter-Methoden, keine Modetrends,
  keine Aussagen, bei denen sich Golflehrer uneins sind.
- Zusätzliche Übungen nur, wenn sie im Golfunterricht weit verbreitet sind – zum Beispiel Schritt-Übung, Schwingen
  mit geschlossenen Füßen, Pump-Übung, Handtuch unter den Achseln, halbe Schwünge von 9 bis 3 Uhr,
  Ausrichtungsstab, Spiegel. Keine eigenen Erfindungen. Hilfsmittel nur Alltägliches: Schläger, Bälle, Tees,
  Ausrichtungsstab, Handtuch, Golftasche, Spiegel, Wand.
- Erfinde keine Messwerte und keine Fehler, die nicht in den Daten stehen.
- Keine medizinischen Aussagen und keine Versprechen („garantiert“). Bei Schmerzen: Übung abbrechen.
- Bist du dir bei einem Punkt nicht sicher, lass ihn weg, statt zu raten.

## Sprache je Level
Die Tiefe ist in allen Levels gleich – nur die Sprache ändert sich:
- einsteiger: Alltagssprache, kurze Sätze, anschauliche Bilder und Vergleiche. Keine Fachbegriffe (oder sofort
  in einfachen Worten erklärt), keine Zahlen, Grad oder Prozent.
- fortgeschritten: Fachbegriffe erlaubt, beim ersten Mal kurz erklärt. Zahlen sparsam.
- koenner: Fachsprache, Messwerte und Zielbereiche dürfen genannt werden, Ursachenketten und Feinheiten ausführlicher.

## Katalog: geprüfte Tipps der App (id, Spielart)
${katalog()}`;

// ---------------------------------------------------------------
// Verlauf: je Kennzahl, wie oft sie in den letzten (bis zu 10) sicheren
// gespeicherten Schwüngen im Zielbereich lag.
// ---------------------------------------------------------------
export function verlaufKurz(schwuenge, ids, anzahl = 10) {
  const letzte = schwuenge
    .filter((s) => s && s.sicher && Array.isArray(s.kennzahlen))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    .slice(-anzahl);
  const verlauf = {};
  for (const id of ids) {
    const werte = letzte.flatMap((s) => s.kennzahlen).filter((k) => k.id === id && k.bewertung !== "unsicher");
    if (werte.length >= 2) {
      verlauf[id] = `${werte.filter((k) => k.bewertung === "gut").length} von ${werte.length} im Zielbereich`;
    }
  }
  return verlauf;
}

// ---------------------------------------------------------------
// Die Anfrage: genau das, was gesendet wird (ohne Schlüssel).
// Nur ausdrücklich ausgewählte Felder werden übernommen (Whitelist).
//   kennzahlen  – die Kennzahlen deines Levels (nur daraus darf der Fokus kommen)
//   hintergrund – die übrigen gemessenen Kennzahlen (nur zum Erklären von Zusammenhängen)
// ---------------------------------------------------------------
const auswahl = (k) => ({ id: k.id, name: k.name, wert: k.wert, bewertung: k.bewertung, ziel: k.detail });

export function coachDaten({ kennzahlen, hintergrund = [], level, ansicht, rechtshaender = true, anzahlSchwuenge = 1, wichtigste = null, verlauf = {} }) {
  return {
    level,
    ansicht,
    rechtshaender,
    anzahlSchwuenge,
    wichtigsteBaustelleDerApp: wichtigste?.id ?? "",
    kennzahlen: kennzahlen.map(auswahl),
    hintergrundKennzahlen: hintergrund.map(auswahl),
    verlauf,
  };
}

// Bei einer (sehr unwahrscheinlichen) Ablehnung springt automatisch ein anderes Modell ein
// (fallbacks: "default" unten). Die API verlangt dafür diese Beta-Kennung als Kopfzeile.
export const COACH_BETA = "server-side-fallback-2026-07-01";

// Die Kopfzeilen der Anfrage. Der Schlüssel steht nur hier – nie in den gesendeten Daten.
export function coachKopfzeilen(schluessel) {
  return {
    "content-type": "application/json",
    "x-api-key": schluessel,
    "anthropic-version": "2023-06-01",
    "anthropic-beta": COACH_BETA,
    // Die API verlangt diese ausdrückliche Erlaubnis für Anfragen direkt aus dem Browser,
    // weil der Schlüssel dann im Browser liegt. Genau das ist hier gewollt (eigener Schlüssel
    // mit Ausgabenlimit, Entscheidung 27.09., V2).
    "anthropic-dangerous-direct-browser-access": "true",
  };
}

export function baueCoachAnfrage(daten) {
  return {
    model: COACH_MODELL,
    // Genug Platz für Nachdenken plus eine lange Antwort. Sie kommt als Datenstrom (stream),
    // damit die längere Wartezeit an kein Zeitlimit stößt.
    max_tokens: 16000,
    stream: true,
    fallbacks: "default",
    thinking: { type: "adaptive" },
    // "high": gründlicher beim Verknüpfen der Kennzahlen (Entscheidung 29.09., ca. 15–25 Cent)
    output_config: { effort: "high", format: { type: "json_schema", schema: ANTWORT_SCHEMA } },
    system: SYSTEMTEXT,
    messages: [{ role: "user", content: `Kennzahlen dieses Schwungs:\n${JSON.stringify(daten, null, 2)}` }],
  };
}

// ---------------------------------------------------------------
// Antwort prüfen: Claude darf keinen Fokus "erfinden", Texte werden gekürzt.
// ---------------------------------------------------------------
const text = (wert, max = 800) => (typeof wert === "string" ? wert.trim().slice(0, max) : "");
const liste = (wert, anzahl, max = 400) =>
  (Array.isArray(wert) ? wert.map((eintrag) => text(eintrag, max)).filter(Boolean).slice(0, anzahl) : []);

function planBlock(roh) {
  const block = roh && typeof roh === "object" ? roh : {};
  return { titel: text(block.titel, 80), anleitung: text(block.anleitung, 700), menge: text(block.menge, 80), erfolg: text(block.erfolg, 300) };
}

export function pruefeCoachAntwort(roh, { kennzahlen, wichtigste = null }) {
  const antwort = roh && typeof roh === "object" ? roh : {};
  const baustellen = kennzahlen.filter((k) => k.bewertung === "verbessern" || k.bewertung === "achtung");
  const gewaehlt = baustellen.find((k) => k.id === antwort.fokusKennzahl);
  const ersatz = wichtigste && baustellen.some((k) => k.id === wichtigste.id) ? wichtigste.id : "";
  const fokusKennzahl = gewaehlt ? gewaehlt.id : ersatz;
  const fokusErsetzt = !gewaehlt && fokusKennzahl !== text(antwort.fokusKennzahl);
  // Hat die App den Fokus ersetzt, passen Claudes Texte zum Fokus nicht mehr – dann bleiben
  // sie leer und die App zeigt ihre eigene Erklärung und Übung.
  const zumFokus = fokusErsetzt ? {} : antwort;
  const plan = Array.isArray(zumFokus.trainingsplan) ? zumFokus.trainingsplan : [];
  return {
    gesamtbild: text(antwort.gesamtbild, 1200),
    staerken: liste(antwort.staerken, 3),
    fokusKennzahl,
    wasPassiert: text(zumFokus.wasPassiert),
    ursachen: text(zumFokus.ursachen),
    folgen: text(zumFokus.folgen),
    anleitung: liste(zumFokus.anleitung, 8),
    gefuehl: text(zumFokus.gefuehl),
    trainingsplan: plan.slice(0, 6).map(planBlock).filter((block) => block.titel || block.anleitung),
    typischeFehler: liste(zumFokus.typischeFehler, 4),
    zuHause: text(zumFokus.zuHause),
    danach: text(antwort.danach),
    naechsteAufnahme: text(antwort.naechsteAufnahme),
    fokusErsetzt,
  };
}

// Aus dem Text der Antwort (JSON) die Felder holen – null, wenn es kein gültiges JSON ist
export function leseAntwortText(inhalt) {
  try {
    return JSON.parse(inhalt);
  } catch {
    return null;
  }
}

// Die Antwort aus allen Inhaltsblöcken holen (Golf-App-Check 29.09.).
// Normalfall: ein Denk-Block und EIN Textblock mit dem JSON.
// Sonderfall "Rückfall" (fallbacks in baueCoachAnfrage): Lehnt Claude mitten in der Antwort ab,
// schreibt ein anderes Modell im selben Datenstrom weiter. Dann stehen im Inhalt der Anfang
// (Textblock), ein "fallback"-Block als Markierung und die Fortsetzung (zweiter Textblock) –
// erst beide Textblöcke zusammen ergeben das JSON. Beginnt das zweite Modell doch von vorn,
// gilt der letzte Textblock allein.
export function leseAntwort(inhalt) {
  const texte = (Array.isArray(inhalt) ? inhalt : [])
    .filter((block) => block?.type === "text" && typeof block.text === "string")
    .map((block) => block.text);
  if (texte.length === 0) return null;
  return leseAntwortText(texte.join("")) ?? leseAntwortText(texte.at(-1));
}

// ---------------------------------------------------------------
// Datenstrom lesen (seit 0.26.0 selbst statt mit dem SDK)
// Die Antwort kommt Stück für Stück als "Server-Sent Events": Jedes Ereignis besteht aus
// Zeilen wie
//   event: content_block_delta
//   data: {"type":"content_block_delta","index":1,"delta":{"type":"text_delta","text":"Dein"}}
// und endet mit einer Leerzeile. Die Reihenfolge ist immer: message_start → je Block
// content_block_start, content_block_delta …, content_block_stop → message_delta (Grund fürs
// Ende, Token-Zahlen) → message_stop. Dazwischen kommen "ping" (nur ein Lebenszeichen) und bei
// Problemen "error". app.js gibt jedes empfangene Textstück an fuettere(); daraus entsteht
// dieselbe Nachricht, die vorher das SDK geliefert hat (model, content, stop_reason, usage).
// Ein Rückfall auf ein anderes Modell ist kein eigenes Ereignis: Er kommt als Block vom Typ
// "fallback", danach schreibt das andere Modell im selben Strom weiter (siehe leseAntwort).
// ---------------------------------------------------------------
export function neuerDatenstrom() {
  let puffer = ""; // angefangenes Ereignis, dessen Rest noch unterwegs ist
  const strom = {
    nachricht: null,
    fertig: false, // erst mit "message_stop" ist die Antwort vollständig angekommen
    fehlerTyp: "", // Fehler mitten im Strom, z. B. "overloaded_error"
    textBegonnen: false, // das Nachdenken ist vorbei, Claude schreibt die Antwort
    fuettere(stueck) {
      // Zeilenenden vereinheitlichen; ein Ereignis endet mit einer Leerzeile
      const bloecke = (puffer + stueck).replace(/\r\n/g, "\n").split("\n\n");
      puffer = bloecke.pop(); // der letzte Teil ist noch nicht vollständig
      for (const block of bloecke) {
        const daten = block.split("\n").filter((zeile) => zeile.startsWith("data:")).map((zeile) => zeile.slice(5)).join("\n");
        if (daten.trim()) verarbeite(JSON.parse(daten));
      }
    },
  };

  function verarbeite(ereignis) {
    const nachricht = strom.nachricht;
    switch (ereignis.type) {
      case "message_start":
        strom.nachricht = { ...ereignis.message, content: [], usage: { ...ereignis.message.usage } };
        break;
      case "content_block_start": {
        const block = { ...ereignis.content_block };
        nachricht.content[ereignis.index] = block;
        // Ab hier schreibt ein anderes Modell weiter – gespeichert wird (wie früher beim SDK)
        // das Modell, das die Antwort fertig geschrieben hat
        if (block.type === "fallback" && block.to?.model) nachricht.model = block.to.model;
        break;
      }
      case "content_block_delta": {
        const block = nachricht.content[ereignis.index];
        const { delta } = ereignis;
        if (delta.type === "text_delta") {
          block.text += delta.text;
          strom.textBegonnen = true;
        } else if (delta.type === "thinking_delta") block.thinking += delta.thinking;
        else if (delta.type === "signature_delta") block.signature = delta.signature;
        break;
      }
      case "message_delta":
        // Grund fürs Ende (stop_reason) und die endgültigen Token-Zahlen; leere Werte nicht übernehmen
        Object.assign(nachricht, ereignis.delta);
        for (const [feld, wert] of Object.entries(ereignis.usage ?? {})) {
          if (wert !== null && wert !== undefined) nachricht.usage[feld] = wert;
        }
        break;
      case "message_stop":
        strom.fertig = true;
        break;
      case "error":
        strom.fehlerTyp = ereignis.error?.type || "unbekannt";
        break;
      // "ping" und "content_block_stop" ändern nichts an der Nachricht
    }
  }
  return strom;
}

// Welche verständliche Meldung passt zu einem Fehler? Aus dem HTTP-Status der Antwort –
// oder bei einem Fehler mitten im Datenstrom aus dem Fehlertyp der API.
// (Codes laut API-Dokumentation: 401/403 Schlüssel, 402 Abrechnung, 429 zu viele, 500/529 Last.)
export function coachFehlerArt({ status = 0, typ = "" } = {}) {
  if (status === 401 || status === 403 || typ === "authentication_error" || typ === "permission_error") return "schluessel";
  if (status === 402 || typ === "billing_error") return "guthaben";
  if (status === 429 || typ === "rate_limit_error") return "zuViele";
  if (status >= 500 || typ === "api_error" || typ === "overloaded_error") return "ueberlastet";
  return "unbekannt";
}

// Kosten einer Anfrage in US-Cent (aus den Token-Zahlen der Antwort)
export function kostenCent(usage) {
  if (!usage) return null;
  const eingabe = (usage.input_tokens || 0) + (usage.cache_creation_input_tokens || 0) + (usage.cache_read_input_tokens || 0);
  const dollar = (eingabe * PREIS_USD_PRO_MIO.eingabe + (usage.output_tokens || 0) * PREIS_USD_PRO_MIO.ausgabe) / 1e6;
  return Math.round(dollar * 1000) / 10; // auf 0,1 Cent
}

// Verständliche Meldungen je Fehlerart (die Art bestimmt coachFehlerArt() oben bzw. app.js)
export const COACH_FEHLER = {
  schluessel: "Der API-Schlüssel ist ungültig oder gesperrt – bitte unter ⚙️ Einstellungen prüfen.",
  guthaben: "Kein Guthaben mehr oder Ausgabenlimit erreicht – bitte in der Anthropic Console prüfen.",
  zuViele: "Zu viele Anfragen – bitte kurz warten und noch einmal versuchen.",
  ueberlastet: "Claude ist gerade ausgelastet – bitte in einer Minute noch einmal versuchen.",
  verbindung: "Keine Verbindung zu Claude – bitte das Internet prüfen.",
  abgelehnt: "Claude hat diese Anfrage abgelehnt. Die Tipps der App gelten weiter.",
  unvollstaendig: "Die Antwort von Claude war unvollständig – bitte noch einmal versuchen.",
  unbekannt: "Coach-Feedback hat nicht geklappt – bitte später noch einmal versuchen.",
};
