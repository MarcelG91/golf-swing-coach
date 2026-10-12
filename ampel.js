// ===============================================================
// Ampel für das Live-Feedback (Etappe 12c)
// Aus einem ausgewerteten Schwung (liveschwung.js) wird eine Farbe und ein
// Kurzwort (höchstens 3 Wörter) für den Rahmen um das Live-Bild.
//
//   grün  = Schwung ohne Abweichung oder nur mit einer kleinen
//   gelb  = eine deutliche Abweichung oder mehrere kleine
//   rot   = mehrere deutliche Abweichungen (Entscheidung 12.10.: "rot" heißt nicht
//           "ein kritischer Fehler", sondern "hier gibt es mehreres zu tun")
//   grau  = Schwung nicht auswertbar (z. B. Person halb im Bild)
//
// "deutlich" = Bewertung "verbessern", "klein" = Bewertung "achtung" (kennzahlen.js / technik.js).
// Es zählen nur Kennzahlen, die zum gewählten Level gehören (level.js) – ein Einsteiger
// bekommt kein Rot wegen Feinheiten, die erst für Könner wichtig sind.
// Reine Rechenlogik ohne Browser-Code, damit sie mit node --test prüfbar ist.
// ===============================================================

import { fuerLevel } from "./level.js";
import { wichtigsteBaustellen } from "./technik.js";
import { tipp } from "./tipps.js";

export const WORT_GUT = "Perfekt";
export const WORT_NICHT_ERKANNT = "Nicht erkannt";

// Eine Kennzahl ohne Kurzwort (kommt nicht vor, aber sicher ist sicher) zeigt ihren Namen
function wortFuer(kennzahl, rechtshaender) {
  return tipp(kennzahl, rechtshaender)?.wort ?? kennzahl.name;
}

// schwung = Ergebnis von neueLiveErkennung().neuesBild() bzw. findeSchwuenge()
// Rückgabe: { farbe: "gruen" | "gelb" | "rot" | "grau", wort }
export function ampel(schwung, level, rechtshaender = true) {
  if (!schwung?.kennzahlen || schwung.phasen?.fehler) {
    return { farbe: "grau", wort: WORT_NICHT_ERKANNT };
  }
  const { sichtbar } = fuerLevel(schwung.kennzahlen, level);
  const deutlich = sichtbar.filter((k) => k.bewertung === "verbessern").length;
  const klein = sichtbar.filter((k) => k.bewertung === "achtung").length;

  if (deutlich === 0 && klein <= 1) return { farbe: "gruen", wort: WORT_GUT };

  // Die wichtigste Baustelle zuerst (Reihenfolge wie in der Auswertung)
  const [wichtigste] = wichtigsteBaustellen(sichtbar, 1);
  const wort = wortFuer(wichtigste, rechtshaender);
  return { farbe: deutlich >= 2 ? "rot" : "gelb", wort };
}
