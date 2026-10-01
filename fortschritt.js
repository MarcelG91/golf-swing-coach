// ===============================================================
// Fortschritt: Verläufe, Trend, Fokus, Meilensteine, Wochenrückblick
// Reine Rechenlogik ohne Browser-Code, damit sie mit node --test prüfbar ist.
// Eingabe: gespeicherte Schwünge (siehe speicher.js) in beliebiger Reihenfolge.
// ===============================================================

import { AB_LEVEL, fuerLevel } from "./level.js";

// Nur diese Bewertungen sind echte Messungen ("unsicher" zählt nicht mit).
const GEMESSEN = ["gut", "achtung", "verbessern"];

// Warum Punkte statt Rohwerten für den Trend? Jede Kennzahl hat ein anderes Ziel
// (mal "kleiner ist besser", mal "größer"). Die Bewertung der App ist dagegen immer
// gleich zu lesen: gut = 2, achtung = 1, verbessern = 0. So geht "mehr = besser" überall.
const PUNKTE = { gut: 2, achtung: 1, verbessern: 0 };

// Gruppen wie in der Schläger-Auswahl in index.html (optgroup).
export function schlaegerGruppe(schlaeger) {
  if (["Driver", "Holz", "Hybrid"].includes(schlaeger)) return "hoelzer";
  if (/^Eisen \d$/.test(schlaeger)) return "eisen";
  if (["PW", "GW", "SW", "LW"].includes(schlaeger)) return "wedges";
  return null;
}

export const GRUPPEN_NAME = Object.freeze({ hoelzer: "Hölzer", eisen: "Eisen", wedges: "Wedges" });

// Sitzungs-IDs sind Zeitstempel in Millisekunden (siehe app.js, speichereSitzung).
function zeitpunkt(schwung) {
  const sitzung = Number(schwung.sitzungId ?? String(schwung.id ?? "").split("-")[0]);
  return Number.isFinite(sitzung) && sitzung > 0 ? sitzung : 0;
}

// Sichere Schwünge einer Ansicht/Schlägergruppe, ältester zuerst.
// ansicht/gruppe = null bedeutet: nicht filtern.
export function sichereSchwuenge(schwuenge, { ansicht = null, gruppe = null } = {}) {
  return schwuenge
    .map((schwung, reihenfolge) => ({ schwung, reihenfolge, zeit: zeitpunkt(schwung) }))
    .filter(({ schwung }) => schwung && schwung.sicher && Array.isArray(schwung.kennzahlen))
    .filter(({ schwung }) => !ansicht || schwung.ansicht === ansicht)
    .filter(({ schwung }) => !gruppe || schlaegerGruppe(schwung.schlaeger) === gruppe)
    .sort((a, b) => a.zeit - b.zeit || a.reihenfolge - b.reihenfolge || (a.schwung.nummer ?? 0) - (b.schwung.nummer ?? 0))
    .map(({ schwung }) => schwung);
}

function kennzahlVon(schwung, id) {
  return schwung.kennzahlen.find((k) => k.id === id && GEMESSEN.includes(k.bewertung));
}

// ---------------------------------------------------------------
// 1. Verlauf: ein Punkt je Schwung, ältester zuerst
// ---------------------------------------------------------------
export function verlauf(schwuenge, id, filter = {}) {
  const punkte = [];
  for (const schwung of sichereSchwuenge(schwuenge, filter)) {
    const kennzahl = kennzahlVon(schwung, id);
    if (!kennzahl) continue;
    punkte.push({
      schwungId: schwung.id,
      datum: schwung.datum ?? null,
      messwert: Number.isFinite(kennzahl.messwert) ? kennzahl.messwert : null,
      bewertung: kennzahl.bewertung,
    });
  }
  return punkte;
}

// Gleitender Mittelwert: je Punkt der Durchschnitt aus ihm und den bis zu
// (fenster - 1) Werten davor. Am Anfang ist das Fenster eben kleiner.
// Punkte ohne Zahl (null) werden übersprungen, die Linie bleibt dort stehen.
export function gleitenderMittelwert(werte, fenster = 5) {
  return werte.map((_, i) => {
    const teil = werte.slice(Math.max(0, i - fenster + 1), i + 1).filter((w) => w !== null);
    return teil.length ? teil.reduce((s, w) => s + w, 0) / teil.length : null;
  });
}

// ---------------------------------------------------------------
// 2. Trend: letzte 10 gegen die 10 davor
// ---------------------------------------------------------------
function mittel(zahlen) {
  return zahlen.reduce((s, z) => s + z, 0) / zahlen.length;
}

function streuungQuadrat(zahlen) {
  const m = mittel(zahlen);
  return zahlen.reduce((s, z) => s + (z - m) ** 2, 0) / (zahlen.length - 1);
}

// Gibt "verbessert", "stabil", "verschlechtert" oder "zuWenigDaten" zurück.
// Mindestens 5 Messungen je Gruppe, sonst sagt der Vergleich nichts aus.
// "Größer als die normale Streuung": Der Unterschied der Mittelwerte muss mehr als
// das Doppelte des Standardfehlers sein (grobe Faustregel, ca. 95 %) und mindestens
// 0,3 Punkte betragen (sonst wären auch winzige Unterschiede bei gleichmäßigen
// Werten plötzlich "Trend").
export function trend(punkte, anzahl = 10, mindest = 5) {
  const punktzahlen = punkte.map((p) => PUNKTE[p.bewertung]);
  const neu = punktzahlen.slice(-anzahl);
  const alt = punktzahlen.slice(-2 * anzahl, -anzahl);
  if (neu.length < mindest || alt.length < mindest) return { urteil: "zuWenigDaten", anzahlNeu: neu.length, anzahlAlt: alt.length };

  const unterschied = mittel(neu) - mittel(alt);
  const standardfehler = Math.sqrt(streuungQuadrat(neu) / neu.length + streuungQuadrat(alt) / alt.length);
  let urteil = "stabil";
  if (Math.abs(unterschied) > Math.max(2 * standardfehler, 0.3)) {
    urteil = unterschied > 0 ? "verbessert" : "verschlechtert";
  }
  return { urteil, unterschied, anzahlNeu: neu.length, anzahlAlt: alt.length };
}

// ---------------------------------------------------------------
// 3. Fokus: genau eine Kennzahl als Trainingsschwerpunkt
// ---------------------------------------------------------------
function gruenAnteile(schwuenge, ids, anzahl) {
  const letzte = schwuenge.slice(-anzahl);
  const ergebnis = [];
  for (const id of ids) {
    const werte = letzte.map((s) => kennzahlVon(s, id)).filter(Boolean);
    if (werte.length < 3) continue; // zu wenig Messungen für eine Aussage
    const gruen = werte.filter((k) => k.bewertung === "gut").length;
    ergebnis.push({ id, gruen, anzahl: werte.length, anteil: gruen / werte.length });
  }
  return ergebnis;
}

// Nur Kennzahlen des gewählten Levels. Bei Gleichstand gewinnt die Grundlage
// (in AB_LEVEL steht sie weiter oben). Ist die schwächste Kennzahl schon in
// mindestens 70 % der Schwünge grün, ist alles stabil → erreicht: true.
export function fokus(schwuenge, level, filter = {}, anzahl = 10) {
  const sichere = sichereSchwuenge(schwuenge, filter);
  const alleIds = Object.keys(AB_LEVEL);
  const levelIds = fuerLevel(alleIds.map((id) => ({ id })), level).sichtbar.map((k) => k.id);
  const anteile = gruenAnteile(sichere, levelIds, anzahl);
  if (anteile.length === 0) return null;

  // sort ist stabil: bei gleichem Anteil bleibt die Reihenfolge aus AB_LEVEL.
  const sortiert = [...anteile].sort((a, b) => a.anteil - b.anteil);
  const schwaechste = sortiert[0];
  return { ...schwaechste, erreicht: schwaechste.anteil >= 0.7 };
}

// ---------------------------------------------------------------
// 4. Meilensteine: Serien "gut" in Folge
// ---------------------------------------------------------------
// Zählt je Kennzahl die längste und die aktuelle Serie. Schwünge ohne Messung
// dieser Kennzahl überspringen wir (sie unterbrechen die Serie nicht).
export function meilensteine(schwuenge, filter = {}, mindestSerie = 5) {
  const sichere = sichereSchwuenge(schwuenge, filter);
  const ergebnis = [];
  for (const id of Object.keys(AB_LEVEL)) {
    let laengste = 0;
    let aktuell = 0;
    for (const schwung of sichere) {
      const k = kennzahlVon(schwung, id);
      if (!k) continue;
      aktuell = k.bewertung === "gut" ? aktuell + 1 : 0;
      laengste = Math.max(laengste, aktuell);
    }
    if (laengste >= mindestSerie) ergebnis.push({ id, laengste, aktuell });
  }
  return ergebnis.sort((a, b) => b.laengste - a.laengste);
}

// ---------------------------------------------------------------
// 5. Wochenrückblick
// ---------------------------------------------------------------
function tagNummer(datum) {
  const [j, m, t] = String(datum).split("-").map(Number);
  const tage = Date.UTC(j, m - 1, t) / 86400000;
  return Number.isFinite(tage) ? tage : null;
}

// heute = "2026-10-01". Die Woche sind die letzten 7 Tage inklusive heute.
// Größte Verbesserung: Kennzahl, deren Punkte diese Woche am stärksten über dem
// Schnitt aller früheren Schwünge liegen (je Seite mindestens 3 Messungen).
export function wochenRueckblick(schwuenge, heute, filter = {}) {
  const heuteTag = tagNummer(heute);
  const sichere = sichereSchwuenge(schwuenge, filter);
  const dieseWoche = [];
  const frueher = [];
  for (const schwung of sichere) {
    const tag = tagNummer(schwung.datum);
    if (tag === null || heuteTag === null) continue;
    if (tag > heuteTag - 7 && tag <= heuteTag) dieseWoche.push(schwung);
    else if (tag <= heuteTag - 7) frueher.push(schwung);
  }

  let besserung = null;
  for (const id of Object.keys(AB_LEVEL)) {
    const neu = dieseWoche.map((s) => kennzahlVon(s, id)).filter(Boolean).map((k) => PUNKTE[k.bewertung]);
    const alt = frueher.map((s) => kennzahlVon(s, id)).filter(Boolean).map((k) => PUNKTE[k.bewertung]);
    if (neu.length < 3 || alt.length < 3) continue;
    const unterschied = mittel(neu) - mittel(alt);
    if (unterschied >= 0.3 && (!besserung || unterschied > besserung.unterschied)) besserung = { id, unterschied };
  }

  return {
    anzahl: dieseWoche.length,
    sitzungen: new Set(dieseWoche.map((s) => s.sitzungId)).size,
    besserung,
  };
}

// ---------------------------------------------------------------
// 6. Diagramm: Zeichenpunkte für ein SVG (die Zeichnung selbst macht app.js)
// ---------------------------------------------------------------
// Senkrecht: die Bewertung (oben gut, unten verbessern) – jede Kennzahl hat ein anderes
// Ziel, die Bewertung ist aber überall gleich zu lesen. Waagerecht: ein Schwung neben
// dem anderen, gleich verteilt (Abstände in Tagen würden bei Pausen alles zusammenschieben).
// Die Linie ist der gleitende Mittelwert über 5 Schwünge.
export function diagramm(punkte, { breite = 300, hoehe = 120, rand = 14 } = {}) {
  const werte = punkte.map((p) => PUNKTE[p.bewertung]);
  const mittel5 = gleitenderMittelwert(werte, 5);
  const x = (i) => (punkte.length === 1 ? breite / 2 : rand + (i * (breite - 2 * rand)) / (punkte.length - 1));
  const y = (wert) => rand + ((2 - wert) * (hoehe - 2 * rand)) / 2; // 2 = oben
  return {
    punkte: punkte.map((p, i) => ({ x: x(i), y: y(werte[i]), bewertung: p.bewertung })),
    linie: mittel5.map((m, i) => [x(i), y(m)]),
    baender: [0, 1, 2].map((wert) => ({ bewertung: ["verbessern", "achtung", "gut"][wert], y: y(wert) })),
  };
}
