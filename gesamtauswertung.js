// ===============================================================
// Gesamtauswertung über mehrere Schwünge
// Eingabe: Schwünge aus schwuenge.js (aus einem oder mehreren Videos)
// Ausgabe: je Ansicht (frontal / von hinten) eine Zusammenfassung:
//   - pro Kennzahl: wie oft gut / Achtung / verbessern, typischer Wert, Spanne
//   - die wichtigsten Baustellen über alle Schwünge
//
// Frontal und von hinten werden getrennt ausgewertet, weil beide Ansichten
// unterschiedliche Dinge messen. Unsichere Schwünge (sicher = false) zählen nicht mit.
// Reine Rechnerei ohne Browser → testbar mit node --test.
// ===============================================================

export function gesamtauswertung(schwuenge, anzahl = 3) {
  const gezaehlt = schwuenge.filter((s) => s.sicher);
  const ergebnis = [];
  for (const ansicht of ["frontal", "hinten"]) {
    const gruppe = gezaehlt.filter((s) => s.ansicht === ansicht);
    if (gruppe.length === 0) continue;

    // Gleiche Kennzahlen aller Schwünge zusammensammeln (Map behält die Reihenfolge)
    const nachId = new Map();
    for (const schwung of gruppe) {
      for (const k of schwung.kennzahlen) {
        if (!nachId.has(k.id)) nachId.set(k.id, []);
        nachId.get(k.id).push(k);
      }
    }
    const kennzahlen = [...nachId.values()].map(fasseZusammen);
    ergebnis.push({ ansicht, anzahl: gruppe.length, kennzahlen, baustellen: baustellenGesamt(kennzahlen, anzahl) });
  }
  return ergebnis;
}

// Eine Kennzahl über mehrere Schwünge zusammenfassen.
// Das Ergebnis sieht aus wie eine normale Kennzahl (Name, Wert, Bewertung, Tipp …),
// damit die Oberfläche es mit denselben Karten anzeigen kann.
function fasseZusammen(liste) {
  const bewertbar = liste.filter((k) => k.bewertung !== "unsicher");
  const anzahl = bewertbar.length;
  const zaehler = { gut: 0, achtung: 0, verbessern: 0 };
  for (const k of bewertbar) zaehler[k.bewertung]++;

  // Gesamtbewertung: die Stufe, die mindestens die Hälfte der Schwünge erreicht.
  // So macht ein einzelner Ausreißer noch keine Baustelle.
  let bewertung = "gut";
  if (anzahl === 0) bewertung = "unsicher";
  else if (zaehler.verbessern >= anzahl / 2) bewertung = "verbessern";
  else if (zaehler.verbessern + zaehler.achtung >= anzahl / 2) bewertung = "achtung";

  // Nach Messwert sortieren: für die Spanne (kleinster bis größter Wert)
  const nachWert = (a, b) => a.messwert - b.messwert;
  const sortiert = bewertbar.filter((k) => typeof k.messwert === "number").sort(nachWert);
  const spanne =
    sortiert.length >= 2 && sortiert[0].wert !== sortiert.at(-1).wert
      ? ` · Spanne ${sortiert[0].wert} bis ${sortiert.at(-1).wert}`
      : "";

  // Typischer Wert = der mittlere (Median) unter den Schwüngen mit genau dieser Bewertung.
  // Sonst könnte "Verbessern" neben dem Wert eines guten Schwungs stehen.
  // Wir nehmen seinen Text (z. B. "+12 %"), dann passt die Schreibweise automatisch.
  // Von diesem Schwung kommen auch Erklärung und Übung – so passt der Text
  // (z. B. "Kopf zu hoch" statt "Kopf sinkt ab").
  const passende = sortiert.filter((k) => k.bewertung === bewertung);
  const typisch = passende[Math.floor((passende.length - 1) / 2)] || sortiert[0] || liste[0];
  const probleme = zaehler.achtung + zaehler.verbessern;

  return {
    ...typisch,
    bewertung,
    wert: `typisch ${typisch.wert}`,
    detail:
      anzahl === 0
        ? "In keinem Schwung sicher messbar"
        : `${probleme === 0 ? "In allen" : `In ${anzahl - probleme} von`} ${anzahl} Schwüngen im Zielbereich${spanne}`,
    zaehler,
    anzahl,
    phase: null, // kein "Im Video zeigen" – es gibt ja mehrere Videomomente
  };
}

// Die wichtigsten Baustellen über alle Schwünge: Wie oft tritt der Fehler auf
// und wie schwer ist er? Punkte = Anteil der Schwünge × Stufe × Gewicht der Kennzahl.
function baustellenGesamt(kennzahlen, anzahl = 3) {
  return kennzahlen
    .filter((k) => k.bewertung === "verbessern" || k.bewertung === "achtung")
    .map((k) => ({ k, punkte: ((2 * k.zaehler.verbessern + k.zaehler.achtung) / k.anzahl) * (k.gewicht || 1) }))
    .sort((a, b) => b.punkte - a.punkte)
    .slice(0, anzahl)
    .map((e) => e.k);
}
