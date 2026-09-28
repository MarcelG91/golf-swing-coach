// ===============================================================
// Level und levelgerechte Kennzahlen
// Reine Rechenlogik ohne Browser-Code, damit sie mit node --test prüfbar ist.
// ===============================================================

export const LEVEL = Object.freeze({
  EINSTEIGER: "einsteiger",
  FORTGESCHRITTEN: "fortgeschritten",
  KOENNER: "koenner",
});

export const LEVEL_OPTIONEN = Object.freeze([
  { wert: LEVEL.EINSTEIGER, name: "Einsteiger", symbol: "🌱", beschreibung: "Ich lerne gerade Golf (Platzreife oder erste Runden)." },
  { wert: LEVEL.FORTGESCHRITTEN, name: "Fortgeschritten", symbol: "🌿", beschreibung: "Ich spiele regelmäßig und treffe den Ball meistens ordentlich." },
  { wert: LEVEL.KOENNER, name: "Könner", symbol: "🌳", beschreibung: "Ich spiele gut und will an Feinheiten arbeiten." },
]);

const STUFEN = [LEVEL.EINSTEIGER, LEVEL.FORTGESCHRITTEN, LEVEL.KOENNER];

// Die Kennzahl-IDs kommen aus kennzahlen.js und technik.js (über ordneEin()).
export const AB_LEVEL = Object.freeze({
  vorneigungAnsprechen: LEVEL.EINSTEIGER,
  armeAnsprechen: LEVEL.EINSTEIGER,
  tempo: LEVEL.EINSTEIGER,
  armschwungTop: LEVEL.EINSTEIGER,
  gewicht: LEVEL.EINSTEIGER,
  seitneigungAnsprechen: LEVEL.FORTGESCHRITTEN,
  schulterdrehung: LEVEL.FORTGESCHRITTEN,
  hueftSway: LEVEL.FORTGESCHRITTEN,
  fuehrungsarmTreff: LEVEL.FORTGESCHRITTEN,
  vorneigungHalten: LEVEL.FORTGESCHRITTEN,
  kopfhoehe: LEVEL.KOENNER,
  kopfSeitlich: LEVEL.KOENNER,
  hueftBall: LEVEL.KOENNER,
  oberkoerperTop: LEVEL.KOENNER,
  oberkoerperTreff: LEVEL.KOENNER,
});

const STUFENNUMMER = Object.fromEntries(STUFEN.map((wert, index) => [wert, index]));

export function fuerLevel(kennzahlen, level) {
  const stufe = STUFENNUMMER[level] ?? 0;
  const sichtbar = [];
  const fuerSpaeter = [];
  for (const kennzahl of kennzahlen) {
    const kennzahlStufe = STUFENNUMMER[AB_LEVEL[kennzahl.id]] ?? 0;
    (kennzahlStufe <= stufe ? sichtbar : fuerSpaeter).push(kennzahl);
  }
  return { sichtbar, fuerSpaeter };
}

export function anzahlBaustellen(level) {
  return (STUFENNUMMER[level] ?? 0) + 1;
}

// Erwartet gespeicherte Schwünge in beliebiger Reihenfolge und betrachtet die
// zehn zuletzt gespeicherten, sicheren Schwünge. Sitzungs-IDs sind Zeitstempel.
export function levelVorschlag(schwuenge, level) {
  const aktuelleStufe = STUFENNUMMER[level];
  if (aktuelleStufe === undefined) return null;

  const sichere = schwuenge
    .map((schwung, reihenfolge) => ({ schwung, reihenfolge, zeit: zeitpunkt(schwung) }))
    .filter(({ schwung }) => schwung.sicher && Array.isArray(schwung.kennzahlen))
    .sort((a, b) => a.zeit - b.zeit || a.reihenfolge - b.reihenfolge)
    .slice(-10)
    .map(({ schwung }) => schwung);
  if (sichere.length < 10) return null;

  const aufstiegsKennzahlen = Object.keys(AB_LEVEL).filter(
    (id) => STUFENNUMMER[AB_LEVEL[id]] <= aktuelleStufe,
  );
  const aufstieg = quote(sichere, aufstiegsKennzahlen);

  if (aktuelleStufe < STUFEN.length - 1 && aufstieg.messbar.length) {
    const anteilGruen = aufstieg.gruen / aufstieg.gesamt;
    const jedeKennzahlStabil = aufstieg.messbar.every((k) => k.gruen / k.anzahl >= 0.6);
    if (anteilGruen >= 0.7 && jedeKennzahlStabil) {
      return {
        art: "aufsteigen",
        von: level,
        nach: STUFEN[aktuelleStufe + 1],
        gruenVonZehn: Math.round(anteilGruen * 10),
        fehlendeKennzahlen: aufstieg.fehlend,
      };
    }
  }

  if (aktuelleStufe > 0) {
    const grundlagen = Object.keys(AB_LEVEL).filter(
      (id) => STUFENNUMMER[AB_LEVEL[id]] < aktuelleStufe,
    );
    const rueckstieg = quote(sichere, grundlagen);
    if (rueckstieg.messbar.length && rueckstieg.gruen / rueckstieg.gesamt < 0.4) {
      return {
        art: "zurueckstufen",
        von: level,
        nach: STUFEN[aktuelleStufe - 1],
        gruenVonZehn: Math.round((rueckstieg.gruen / rueckstieg.gesamt) * 10),
        fehlendeKennzahlen: rueckstieg.fehlend,
      };
    }
  }
  return null;
}

function quote(schwuenge, ids) {
  const messbar = [];
  const fehlend = [];
  for (const id of ids) {
    const werte = schwuenge
      .flatMap((schwung) => schwung.kennzahlen)
      .filter((kennzahl) => kennzahl.id === id && ["gut", "achtung", "verbessern"].includes(kennzahl.bewertung));
    if (werte.length < 3) {
      fehlend.push(id);
      continue;
    }
    messbar.push({ anzahl: werte.length, gruen: werte.filter((k) => k.bewertung === "gut").length });
  }
  return {
    messbar,
    fehlend,
    gruen: messbar.reduce((summe, k) => summe + k.gruen, 0),
    gesamt: messbar.reduce((summe, k) => summe + k.anzahl, 0),
  };
}

function zeitpunkt(schwung) {
  const sitzung = Number(schwung.sitzungId ?? String(schwung.id ?? "").split("-")[0]);
  return Number.isFinite(sitzung) && sitzung > 0 ? sitzung : 0;
}