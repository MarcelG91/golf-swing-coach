// ===============================================================
// Gleichmäßigkeit: Wie stark schwanken die Werte von Schwung zu Schwung? (Z16)
// Reine Rechenlogik ohne Browser-Code, damit sie mit node --test prüfbar ist.
//
// Warum? In einer Studie mit 27 Golfern hing nicht die MITTLERE Vorneigung mit dem Score zusammen,
// sondern ihre Schwankung von Schwung zu Schwung (Yamamoto 2023, Stufe A, Korrelation, 7er-Eisen).
// Gute Spieler schwingen auch im Tempo sehr gleichmäßig (Grober & Cholewicki 2006, Grober 2010).
//
// Gerechnet wird die Streuung (Standardabweichung) JE SITZUNG, nicht über Wochen gemischt:
// Innerhalb einer Sitzung steht die Kamera gleich, ihr Messfehler verschiebt alle Schwünge
// gleich und fällt aus der Streuung heraus.
//
// Die Ampel ist EINE EIGENE FESTLEGUNG (keine Studie nennt einen Normwert) und vorläufig:
// Die Streuung wird mit der Breite des Balkens der Kennzahl verglichen (tipps.js SKALEN).
// ===============================================================

import { skalenInfo } from "./tipps.js";

export const MIN_SCHWUENGE = 4; // so viele Messwerte braucht eine Streuung mindestens
export const GRENZE_GUT = 0.08; // Streuung bis 8 % der Balkenbreite = gleichmäßig (grün)
export const GRENZE_ACHTUNG = 0.2; // bis 20 % = etwas unruhig (gelb), darüber unruhig (rot)
export const TREND_SCHWELLE = 0.15; // mehr als 15 % Änderung gegenüber früher = gleichmäßiger bzw. unruhiger

export const STREUUNG_TEXT = Object.freeze({ gut: "gleichmäßig", achtung: "etwas unruhig", verbessern: "unruhig" });

// Standardabweichung (Stichprobe: durch n − 1). Ab 2 Werten.
export function standardabweichung(werte) {
  if (werte.length < 2) return null;
  const mittel = werte.reduce((a, b) => a + b, 0) / werte.length;
  const quadrate = werte.reduce((summe, w) => summe + (w - mittel) ** 2, 0);
  return Math.sqrt(quadrate / (werte.length - 1));
}

const text = (zahl) => String(Math.abs(zahl) < 10 ? Math.round(zahl * 10) / 10 : Math.round(zahl)).replace(".", ",");

// Streuung einer Kennzahl aus mehreren Messwerten (Roh-Messwerte der Kennzahlen).
// Liefert null, wenn es zu wenige Werte gibt oder die Kennzahl keinen Balken (Skala) hat.
//   sd    – Standardabweichung in Anzeige-Einheiten (z. B. Prozentpunkte, Grad)
//   stufe – gut / achtung / verbessern (Ampel), text – z. B. "±2,5°"
export function streuung(id, messwerte) {
  const info = skalenInfo(id);
  const werte = messwerte.filter((w) => Number.isFinite(w));
  if (!info || werte.length < MIN_SCHWUENGE) return null;
  const sd = standardabweichung(werte) * info.faktor;
  const anteil = sd / info.breite;
  const stufe = anteil <= GRENZE_GUT ? "gut" : anteil <= GRENZE_ACHTUNG ? "achtung" : "verbessern";
  return { sd, anzahl: werte.length, stufe, text: `±${text(sd)}${info.einheit}` };
}

// Die Streuung jeder Sitzung, älteste zuerst. schwuenge = sichere Schwünge, schon nach Ansicht
// und Schlägergruppe gefiltert und nach Zeit sortiert (sichereSchwuenge in fortschritt.js).
// Sitzungen mit weniger als MIN_SCHWUENGE Messwerten fehlen in der Liste.
export function streuungJeSitzung(schwuenge, id) {
  const gruppen = new Map(); // behält die Reihenfolge
  for (const schwung of schwuenge) {
    const k = (schwung.kennzahlen || []).find((x) => x.id === id && x.bewertung !== "unsicher" && Number.isFinite(x.messwert));
    if (!k) continue;
    if (!gruppen.has(schwung.sitzungId)) gruppen.set(schwung.sitzungId, { sitzungId: schwung.sitzungId, datum: schwung.datum ?? null, werte: [] });
    gruppen.get(schwung.sitzungId).werte.push(k.messwert);
  }
  const liste = [];
  for (const { sitzungId, datum, werte } of gruppen.values()) {
    const s = streuung(id, werte);
    if (s) liste.push({ sitzungId, datum, ...s });
  }
  return liste;
}

// Wird es gleichmäßiger? Die neueste Sitzung gegen den Schnitt der bis zu 3 Sitzungen davor.
// "gleichmaessiger" | "unruhiger" | "gleich", oder null bei weniger als 2 Sitzungen.
export function streuungTrend(sitzungen) {
  if (sitzungen.length < 2) return null;
  const jetzt = sitzungen.at(-1).sd;
  const davor = sitzungen.slice(-4, -1).map((s) => s.sd);
  const frueher = davor.reduce((a, b) => a + b, 0) / davor.length;
  if (frueher === 0) return jetzt === 0 ? "gleich" : "unruhiger";
  if (jetzt < frueher * (1 - TREND_SCHWELLE)) return "gleichmaessiger";
  if (jetzt > frueher * (1 + TREND_SCHWELLE)) return "unruhiger";
  return "gleich";
}
