// ===============================================================
// Phasen-Abspieler: zwei Schwünge nebeneinander abspielen, an den Phasen ausgerichtet
// (Vorher/Nachher im Fortschritt). Hier steht nur die Rechnung – das Abspielen selbst
// macht app.js. Ohne Browser-Code, damit sie mit node --test prüfbar ist.
//
// Idee: Zwei Schwünge sind verschieden schnell. Damit Top und Treffmoment bei beiden
// im selben Moment kommen, wird jeder Abschnitt (Ansprechen → Top → Treffmoment → Finish)
// bei dem Schwung, der ihn schneller schwingt, etwas langsamer abgespielt und beim
// anderen etwas schneller. Beide brauchen für jeden Abschnitt dann gleich lange.
// ===============================================================

const FOLGE = ["ansprechen", "top", "treffmoment", "finish"];

// Browser spielen sehr langsame und sehr schnelle Videos nicht zuverlässig ab
const MIN_RATE = 0.25;
const MAX_RATE = 2;

// Zeiten der vier Phasen eines Schwungs im Clip (oder null, wenn eine fehlt oder die
// Reihenfolge nicht stimmt)
function phasenZeiten(phasen) {
  const zeiten = FOLGE.map((name) => phasen?.[name]?.zeit);
  if (!zeiten.every(Number.isFinite)) return null;
  for (let i = 1; i < zeiten.length; i++) if (zeiten[i] <= zeiten[i - 1]) return null;
  return zeiten;
}

// Plant das gemeinsame Abspielen. tempo: 1 = Echtzeit, 0,5 = halbe Geschwindigkeit
// (Mittelwert beider Schwünge). Rückgabe: Liste von Abschnitten
//   { von: [a, b], bis: [a, b], rate: [a, b] }   – Zeiten im Clip A und B, Abspielgeschwindigkeit
// oder null, wenn ein Schwung keine vollständigen Phasen hat.
export function planeAbschnitte(phasenA, phasenB, tempo = 1) {
  const a = phasenZeiten(phasenA);
  const b = phasenZeiten(phasenB);
  if (!a || !b) return null;
  const abschnitte = [];
  for (let i = 0; i < FOLGE.length - 1; i++) {
    const dauerA = a[i + 1] - a[i];
    const dauerB = b[i + 1] - b[i];
    // So lange soll der Abschnitt bei beiden dauern: Mittel der beiden, durch das Tempo geteilt
    const ziel = (dauerA + dauerB) / 2 / tempo;
    const rate = (dauer) => Math.min(MAX_RATE, Math.max(MIN_RATE, dauer / ziel));
    abschnitte.push({
      von: [a[i], b[i]],
      bis: [a[i + 1], b[i + 1]],
      rate: [rate(dauerA), rate(dauerB)],
    });
  }
  return abschnitte;
}

// In welchem Abschnitt steht Clip "seite" (0 = A, 1 = B) bei dieser Zeit? Vor dem Anfang: 0,
// nach dem Ende: der letzte.
export function abschnittFuerZeit(abschnitte, seite, zeit) {
  const i = abschnitte.findIndex((a) => zeit < a.bis[seite]);
  return i === -1 ? abschnitte.length - 1 : i;
}
