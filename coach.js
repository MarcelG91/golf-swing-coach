// ===============================================================
// Coach-Feedback mit Claude (Etappe 11b) – reine Rechenlogik
//
// Hier steht, WAS an Claude gesendet wird und wie die Antwort geprüft wird.
// Das eigentliche Senden (SDK laden, Anfrage) steht in app.js – so bleibt diese
// Datei ohne Browser-Code und ist mit node --test prüfbar, ohne echte (kostenpflichtige)
// Anfrage.
//
// Wichtige Regeln (Plan: docs/plan-etappe-11-level-und-coach.md, Sicherheit: V2):
//   - Gesendet werden NUR Kennzahlen (Name, Wert, Bewertung, Zielbereich), Level,
//     Ansicht und ein kurzer Verlauf. Nie Videos, Bilder, Posedaten, Notizen,
//     Videonamen oder Datum.
//   - Claude wählt nur den Fokus aus den gemessenen Baustellen und formuliert
//     Lob und Begründung. Die ÜBUNG zeigt die App aus tipps.js (fachlich geprüft) –
//     Claude soll keine eigenen Übungen oder Technik-Anleitungen erfinden.
// ===============================================================

import { alleTipps } from "./tipps.js";

// Modell und Preise an EINER Stelle (Entscheidung 28.09.: Claude Opus 5)
export const COACH_MODELL = "claude-opus-5";
export const MODELL_NAME = "Claude Opus 5";
const PREIS_USD_PRO_MIO = { eingabe: 5, ausgabe: 25 }; // Stand 28.09.2026

// Antwort in festen Feldern (Structured Outputs). Nur einfache Typen –
// Längen prüft pruefeCoachAntwort() selbst.
export const ANTWORT_SCHEMA = {
  type: "object",
  properties: {
    lob: { type: "string", description: "Was schon gut läuft – bezogen auf eine grüne Kennzahl." },
    fokusKennzahl: { type: "string", description: "Die id EINER Kennzahl mit Bewertung achtung/verbessern – oder leer, wenn es keine gibt." },
    fokusBotschaft: { type: "string", description: "Warum gerade diese Baustelle zuerst – persönlich, ohne Übungsanleitung." },
    naechstesMal: { type: "string", description: "Ein Satz für das nächste Training oder die nächste Aufnahme." },
  },
  required: ["lob", "fokusKennzahl", "fokusBotschaft", "naechstesMal"],
  additionalProperties: false,
};

// ---------------------------------------------------------------
// Fester Systemtext: Rolle, Regeln, Ton je Level und der Katalog der
// App-Tipps. Er ändert sich nie pro Anfrage (kein Datum, keine Nutzerdaten).
// ---------------------------------------------------------------
function katalog() {
  return alleTipps(true)
    .map((t) => `- ${t.id}${t.variante ? ` (${t.variante})` : ""}: „${t.kurz}“ – Übung der App: ${t.uebung ? t.uebung.name : "keine"}`)
    .join("\n");
}

export const SYSTEMTEXT = `Du bist ein freundlicher, erfahrener Golftrainer in der App „Golf Swing Coach“.
Die App hat einen Golfschwung aus einem Handyvideo vermessen. Du bekommst die Kennzahlen als JSON
und schreibst ein kurzes, persönliches Feedback auf Deutsch in der Du-Form.

Deine Aufgabe:
1. lob: Ein Satz zu etwas, das schon gut läuft (eine Kennzahl mit Bewertung „gut“). Gibt es keine, lobe den Einsatz.
2. fokusKennzahl: Wähle GENAU EINE Kennzahl mit Bewertung „verbessern“ oder „achtung“ als Fokus fürs nächste
   Training. Nimm die id aus den Daten. Bevorzuge „verbessern“ vor „achtung“ und Grundlagen (Ansprechhaltung,
   Drehung, Tempo) vor Folgefehlern (Kopfbewegung). Die App schlägt in „wichtigsteBaustelleDerApp“ selbst eine vor –
   weiche nur mit gutem Grund davon ab. Gibt es keine solche Kennzahl, lass das Feld leer.
3. fokusBotschaft: Ein bis zwei Sätze, warum gerade das zuerst dran ist und was es bringt.
4. naechstesMal: Ein Satz fürs nächste Mal (z. B. dranbleiben, die andere Ansicht filmen, Verlauf loben).

Feste Regeln:
- Beziehe dich nur auf Kennzahlen, die in den Daten stehen. Erfinde keine Messwerte und keine Fehler.
- Schreibe KEINE eigene Übung und keine Schritt-für-Schritt-Technikanleitung. Die App zeigt zum Fokus ihre
  eigene, fachlich geprüfte Übung (Katalog unten) – du darfst sie beim Namen nennen.
- Keine medizinischen Aussagen, keine Versprechen („garantiert“).
- Ist „rechtshaender“ false, sind links und rechts vertauscht (vordere Seite = rechts).
- Verlauf: „x von n im Zielbereich“ aus früheren Schwüngen. Wird etwas besser, sag es.

Ton je Level:
- einsteiger: sehr einfache Worte, keine Fachbegriffe, keine Zahlen, jedes Feld höchstens ein kurzer Satz.
- fortgeschritten: Fachbegriffe nur mit kurzer Erklärung, jedes Feld höchstens zwei Sätze.
- koenner: knapp und präzise, Messwerte dürfen genannt werden, jedes Feld höchstens zwei Sätze.

Katalog der Kennzahlen (id, Spielart: Kurzbeschreibung – Übung der App):
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
// ---------------------------------------------------------------
export function coachDaten({ kennzahlen, level, ansicht, rechtshaender = true, anzahlSchwuenge = 1, wichtigste = null, verlauf = {} }) {
  return {
    level,
    ansicht,
    rechtshaender,
    anzahlSchwuenge,
    wichtigsteBaustelleDerApp: wichtigste?.id ?? "",
    kennzahlen: kennzahlen.map((k) => ({
      id: k.id,
      name: k.name,
      wert: k.wert,
      bewertung: k.bewertung,
      ziel: k.detail,
    })),
    verlauf,
  };
}

export function baueCoachAnfrage(daten) {
  return {
    model: COACH_MODELL,
    max_tokens: 4000,
    // Bei einer (sehr unwahrscheinlichen) Ablehnung springt automatisch ein anderes Modell ein
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: { type: "json_schema", schema: ANTWORT_SCHEMA } },
    system: SYSTEMTEXT,
    messages: [{ role: "user", content: `Kennzahlen dieses Schwungs:\n${JSON.stringify(daten, null, 2)}` }],
  };
}

// ---------------------------------------------------------------
// Antwort prüfen: Claude darf keinen Fokus "erfinden".
// ---------------------------------------------------------------
const MAX_ZEICHEN = 400;
const text = (wert) => (typeof wert === "string" ? wert.trim().slice(0, MAX_ZEICHEN) : "");

export function pruefeCoachAntwort(roh, { kennzahlen, wichtigste = null }) {
  const antwort = roh && typeof roh === "object" ? roh : {};
  const baustellen = kennzahlen.filter((k) => k.bewertung === "verbessern" || k.bewertung === "achtung");
  const gewaehlt = baustellen.find((k) => k.id === antwort.fokusKennzahl);
  const ersatz = wichtigste && baustellen.some((k) => k.id === wichtigste.id) ? wichtigste.id : "";
  const fokusKennzahl = gewaehlt ? gewaehlt.id : ersatz;
  const fokusErsetzt = !gewaehlt && fokusKennzahl !== text(antwort.fokusKennzahl);
  return {
    lob: text(antwort.lob),
    fokusKennzahl,
    // Hat die App den Fokus ersetzt, passt Claudes Begründung nicht mehr – dann zeigt die App ihre eigene
    fokusBotschaft: fokusErsetzt ? "" : text(antwort.fokusBotschaft),
    naechstesMal: text(antwort.naechstesMal),
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

// Kosten einer Anfrage in US-Cent (aus den Token-Zahlen der Antwort)
export function kostenCent(usage) {
  if (!usage) return null;
  const eingabe = (usage.input_tokens || 0) + (usage.cache_creation_input_tokens || 0) + (usage.cache_read_input_tokens || 0);
  const dollar = (eingabe * PREIS_USD_PRO_MIO.eingabe + (usage.output_tokens || 0) * PREIS_USD_PRO_MIO.ausgabe) / 1e6;
  return Math.round(dollar * 1000) / 10; // auf 0,1 Cent
}

// Verständliche Meldungen je Fehlerart (die Art bestimmt app.js aus den Fehlerklassen des SDK)
export const COACH_FEHLER = {
  schluessel: "Der API-Schlüssel ist ungültig oder gesperrt – bitte unter ⚙️ Einstellungen prüfen.",
  guthaben: "Kein Guthaben mehr oder Ausgabenlimit erreicht – bitte in der Anthropic Console prüfen.",
  zuViele: "Zu viele Anfragen – bitte kurz warten und noch einmal versuchen.",
  ueberlastet: "Claude ist gerade ausgelastet – bitte in einer Minute noch einmal versuchen.",
  verbindung: "Keine Verbindung zu Claude – bitte das Internet prüfen.",
  laden: "Der Coach konnte nicht geladen werden – bitte das Internet prüfen.",
  abgelehnt: "Claude hat diese Anfrage abgelehnt. Die Tipps der App gelten weiter.",
  unvollstaendig: "Die Antwort von Claude war unvollständig – bitte noch einmal versuchen.",
  unbekannt: "Coach-Feedback hat nicht geklappt – bitte später noch einmal versuchen.",
};
