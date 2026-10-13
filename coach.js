// ===============================================================
// Coach-Feedback mit Claude (Etappe 11b, kurz und klar seit 0.40.0) – reine Rechenlogik
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
//   - Seit 0.40.0 (Entscheidung 13.10.) coacht Claude wie auf der Range: eine Stärke, ein Fokus,
//     2–3 kurze Anweisungen, ein Satz „Warum“ – zusammen höchstens ca. 120 Wörter. Vorher
//     (0.17.0–0.39.x) schrieb Claude 600–900 Wörter in 13 Feldern – viel zu lang.
//     Leitplanken: Die geprüften Tipps aus tipps.js stehen im Systemtext und dürfen nicht
//     widersprochen werden; Schwunggedanke und Übung zeigt die App selbst aus tipps.js.
//     Die App kennzeichnet Claudes Texte als „nicht fachlich geprüft“.
// ===============================================================

import { alleTipps } from "./tipps.js";

// Modell und Preise an EINER Stelle (Entscheidung 28.09.: Claude Opus 5, seit 13.10.: Claude Opus 5.5 –
// neuer und günstiger, gleiche Anfrage)
export const COACH_MODELL = "claude-opus-5-5";
export const MODELL_NAME = "Claude Opus 5.5";
// Preise in US-Dollar je Million Tokens (Stand 13.10.2026). Die zwei älteren Modelle stehen dabei,
// weil bei einer Ablehnung eines davon einspringen kann (Rückfall, siehe COACH_BETA) – die Kosten
// rechnet die App mit dem Preis des Modells, das die Antwort geschrieben hat.
const PREISE_USD_PRO_MIO = {
  "claude-opus-5-5": { eingabe: 4, ausgabe: 20 },
  "claude-opus-5": { eingabe: 5, ausgabe: 25 },
  "claude-opus-4-8": { eingabe: 5, ausgabe: 25 },
};

// Antwort in festen Feldern (Structured Outputs). Nur einfache Typen, keine Längenangaben –
// die unterstützt das Schema nur eingeschränkt. Die Längen stehen im Systemtext, und
// pruefeCoachAntwort() kürzt zur Sicherheit selbst. Was in jedes Feld gehört, erklärt der Systemtext.
const TEXT = { type: "string" };
export const ANTWORT_SCHEMA = {
  type: "object",
  properties: {
    staerke: TEXT,
    fokusKennzahl: { type: "string", description: "Die id EINER Kennzahl aus „kennzahlen“ mit Bewertung achtung/verbessern – oder leer." },
    anweisungen: { type: "array", items: TEXT },
    warum: TEXT,
  },
  required: ["staerke", "fokusKennzahl", "anweisungen", "warum"],
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

export const SYSTEMTEXT = `Du bist ein erfahrener Golflehrer auf der Driving Range und coachst in der App „Golf Swing Coach“.
Die App hat einen Golfschwung aus einem Handyvideo vermessen (Bilderkennung der Körperhaltung, eine Kamera,
von vorne oder von hinten). Du bekommst die Kennzahlen als JSON und gibst ein kurzes Coaching auf Deutsch in
der Du-Form.

So coachst du: wie ein guter Trainer zwischen zwei Bällen – kurz, klar, auf den Punkt. Ein Fokus, wenige
Anweisungen, die man beim nächsten Schlag sofort umsetzen kann. Keine Vorträge, keine Floskeln, keine
Wiederholungen. Die ganze Antwort hat höchstens 120 Wörter.

## Was die Daten bedeuten
- level: einsteiger, fortgeschritten oder koenner. Bestimmt die Sprache (siehe unten).
- ansicht: "frontal" (von vorne) oder "hinten" (von hinten, entlang der Ziellinie). Jede Ansicht misst andere Kennzahlen.
- rechtshaender: Ist es false, sind links und rechts vertauscht (vordere Seite = rechts). Der Katalog unten ist für Rechtshänder geschrieben.
- kennzahlen: die Kennzahlen des gewählten Levels. bewertung: "gut" (im Zielbereich), "achtung" (knapp daneben),
  "verbessern" (deutlich daneben), "unsicher" (nicht verlässlich messbar – nicht bewerten). ziel: Zielbereich bzw. was gemessen wird.
- hintergrundKennzahlen: weitere Messungen über dem Level. Nur um die Ursache besser zu treffen – nie als Fokus,
  nicht eigens erwähnen.
- wichtigsteBaustelleDerApp: der Fokus-Vorschlag der App (Grundlagen zuerst).
- verlauf: „x von n im Zielbereich“ aus früheren gespeicherten Schwüngen. Wird der Fokus besser, sag es in staerke.
- anzahlSchwuenge: wie viele Schwünge im Video erkannt wurden. Die Kennzahlen gelten für den gerade gezeigten.

Grenzen der Messung: Die App sieht keinen Ball, keinen Ballflug, keinen Griff, keine Schlagfläche und weiß nicht,
welcher Schläger benutzt wurde. Über den Ball nur als „typische Folge“ sprechen, nie als Beobachtung. Messwerte aus
einem Handyvideo sind Schätzungen – Werte knapp am Rand nicht dramatisieren.

## Die Antwortfelder
- staerke: EIN kurzer Satz (höchstens 15 Wörter) zu etwas, das gut ist (eine Kennzahl mit „gut“ oder ein Fortschritt
  im Verlauf). Ohne grüne Kennzahl etwas Echtes, z. B. dass du deinen Schwung filmst.
- fokusKennzahl: GENAU EINE id aus „kennzahlen“ mit Bewertung „verbessern“ oder „achtung“. Bevorzuge „verbessern“
  vor „achtung“ und Grundlagen (Ansprechhaltung, Drehung, Tempo) vor Folgefehlern (z. B. Kopfbewegung). Weiche von
  wichtigsteBaustelleDerApp nur ab, wenn eine andere Baustelle erkennbar die Ursache ist. Gibt es keine solche
  Kennzahl, lass das Feld leer.
- anweisungen: 2–3 Anweisungen zum Fokus in der Reihenfolge der Ausführung, je höchstens 12 Wörter, in Befehlsform
  („Gewicht auf die Fußballen.“). Konkret: welcher Körperteil, welche Richtung. Positiv formulieren, lieber ein Bild
  oder ein äußeres Ziel (Schläger, Ball, Ziel) als ein Verbot. Nicht den Schwunggedanken oder die Übung der App
  wiederholen – die zeigt die App direkt darunter selbst an.
- warum: 1–2 kurze Sätze (zusammen höchstens 35 Wörter): was im Schwung passiert und was es typischerweise für
  den Schlag bedeutet.

Gibt es keine Baustelle (fokusKennzahl leer): anweisungen sind 1–2 Hinweise, das Gute zu festigen (z. B. derselbe
Rhythmus mit einem anderen Schläger), warum bleibt leer.

## Leitplanken für die Technik
Die Person hat eine klare Regel: keine falsche Technik. Deshalb:
- Die Tipps im Katalog unten sind fachlich geprüft und mit Quellen belegt. Widersprich ihnen nie und baue auf
  ihrer Erklärung auf.
- Bleib bei allgemein anerkannten Grundlagen des Golfunterrichts. Keine Außenseiter-Methoden, keine Modetrends,
  keine Aussagen, bei denen sich Golflehrer uneins sind. Keine eigenen Erfindungen.
- Erfinde keine Messwerte und keine Fehler, die nicht in den Daten stehen.
- Keine medizinischen Aussagen und keine Versprechen („garantiert“).
- Bist du dir bei einem Punkt nicht sicher, lass ihn weg, statt zu raten.

## Sprache je Level
- einsteiger: Alltagssprache, sehr einfache Worte, ein anschauliches Bild. Keine Fachbegriffe, keine Zahlen, Grad oder Prozent.
- fortgeschritten: Fachbegriffe erlaubt, wenn sie gängig sind. Zahlen sparsam.
- koenner: Fachsprache, Messwerte und Zielbereiche dürfen genannt werden.

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

// ---------------------------------------------------------------
// „Für Claude kopieren“ (ohne API-Schlüssel): derselbe Anleitungstext und dieselben Daten wie
// beim Coach, nur als ein Text zum Einfügen in einen eigenen Chat (z. B. claude.ai). Es wird
// nichts gesendet – die App legt den Text nur in die Zwischenablage. Die Daten kommen aus
// coachDaten(), enthalten also ebenfalls nur Kennzahlen.
// ---------------------------------------------------------------
export function baueKopierText(daten) {
  return [
    SYSTEMTEXT,
    "",
    "## Deine Aufgabe jetzt",
    "Schreibe das Coaching als normalen Text auf Deutsch, gegliedert nach den oben beschriebenen Antwortfeldern",
    "(Stärke, Fokus, Anweisungen, Warum) mit je einer kurzen Überschrift. Gib kein JSON aus.",
    "",
    `Kennzahlen dieses Schwungs:\n${JSON.stringify(daten, null, 2)}`,
  ].join("\n");
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
    // Genug Platz für Nachdenken plus Antwort – das Nachdenken zählt mit. Opus 5.5
    // denkt bei gleicher Stufe mehr als Opus 5, deshalb 32.000 statt 16.000 (ungenutzter Platz
    // kostet nichts). Die Antwort kommt als Datenstrom (stream), damit die längere Wartezeit an
    // kein Zeitlimit stößt.
    max_tokens: 32000,
    stream: true,
    fallbacks: "default",
    thinking: { type: "adaptive" },
    // "high": gründlicher beim Verknüpfen der Kennzahlen (Entscheidung 29.09., bestätigt 13.10.).
    // Ausdrücklich setzen: Bei Opus 5.5 wäre ohne Angabe "medium" der Standard.
    output_config: { effort: "high", format: { type: "json_schema", schema: ANTWORT_SCHEMA } },
    system: SYSTEMTEXT,
    messages: [{ role: "user", content: `Kennzahlen dieses Schwungs:\n${JSON.stringify(daten, null, 2)}` }],
  };
}

// ---------------------------------------------------------------
// Antwort prüfen: Claude darf keinen Fokus "erfinden", Texte werden gekürzt.
// Die Grenzen liegen etwas über den Vorgaben im Systemtext – sie sind nur ein Sicherheitsnetz.
// ---------------------------------------------------------------
const text = (wert, max) => (typeof wert === "string" ? wert.trim().slice(0, max) : "");

export function pruefeCoachAntwort(roh, { kennzahlen, wichtigste = null }) {
  const antwort = roh && typeof roh === "object" ? roh : {};
  const baustellen = kennzahlen.filter((k) => k.bewertung === "verbessern" || k.bewertung === "achtung");
  const gewaehlt = baustellen.find((k) => k.id === antwort.fokusKennzahl);
  const ersatz = wichtigste && baustellen.some((k) => k.id === wichtigste.id) ? wichtigste.id : "";
  const fokusKennzahl = gewaehlt ? gewaehlt.id : ersatz;
  const fokusErsetzt = !gewaehlt && fokusKennzahl !== text(antwort.fokusKennzahl, 100);
  // Hat die App den Fokus ersetzt, passen Claudes Texte zum Fokus nicht mehr – dann bleiben
  // sie leer und die App zeigt ihre eigene Erklärung und Übung.
  const zumFokus = fokusErsetzt ? {} : antwort;
  const anweisungen = Array.isArray(zumFokus.anweisungen) ? zumFokus.anweisungen : [];
  return {
    staerke: text(antwort.staerke, 200),
    fokusKennzahl,
    anweisungen: anweisungen.map((eintrag) => text(eintrag, 160)).filter(Boolean).slice(0, 3),
    warum: text(zumFokus.warum, 400),
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

// Kosten einer Anfrage in US-Cent (aus den Token-Zahlen der Antwort und dem Modell, das sie
// geschrieben hat). Unbekanntes Modell: Preis des Coach-Modells.
export function kostenCent(usage, modell = COACH_MODELL) {
  if (!usage) return null;
  const preis = PREISE_USD_PRO_MIO[modell] ?? PREISE_USD_PRO_MIO[COACH_MODELL];
  const eingabe = (usage.input_tokens || 0) + (usage.cache_creation_input_tokens || 0) + (usage.cache_read_input_tokens || 0);
  const dollar = (eingabe * preis.eingabe + (usage.output_tokens || 0) * preis.ausgabe) / 1e6;
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
