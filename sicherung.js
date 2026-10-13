// ===============================================================
// Sicherung der gespeicherten Schwünge (Etappe 9)
//
// Eine Sicherung ist EINE Textdatei im JSON-Format, z. B. "golf-sicherung-2026-10-13.json".
// Sie enthält Sitzungen, Schwünge (Kennzahlen, Phasen, Notizen, Coach-Antworten),
// Posedaten (nur Zahlen) und den Lernfortschritt der Wissensseite.
//
// Bewusst NICHT drin (Entscheidung 13.10.):
//   - Videos und Vorschaubilder: Sie zeigen dich und wären riesig (Befund V6).
//     Ohne Bilder braucht die Datei auch kein Passwort.
//   - Coach-Schlüssel und Coach-Einwilligung: Der Schlüssel ist geheim, die Einwilligung
//     soll auf jedem Gerät neu gegeben werden.
//   - Level, Darstellung, Kamerawahl: Das Level verlangt die App schon beim ersten Start,
//     der Rest ist ein Tipp und hängt am Gerät.
//
// Reine Rechenlogik ohne Browser-Code → mit node --test prüfbar. Lesen und Schreiben der
// Datenbank macht speicher.js, Knöpfe und Teilen-Menü app.js.
// ===============================================================

import { leseFortschritt } from "./wissen.js";

export const SICHERUNG_FORMAT = "golf-swing-coach-sicherung";
export const SICHERUNG_VERSION = 1; // erhöhen, wenn sich der Aufbau der Datei ändert

// Erlaubt-Liste: NUR diese Einstellungen (localStorage) kommen in die Sicherung.
// Absichtlich keine Verboten-Liste – so landet ein neuer Schlüssel (z. B. der Coach-Schlüssel)
// nie aus Versehen in der Datei. Test: tests/sicherung.test.mjs
export const EINSTELLUNGEN_IN_SICHERUNG = ["wissenFortschritt"];

// Einstellungen für die Sicherung einsammeln.
// lese(name) liefert den gespeicherten Text (z. B. localStorage.getItem) – gelesen werden
// nur die Namen der Erlaubt-Liste.
export function einstellungenFuerSicherung(lese) {
  return { wissenFortschritt: leseFortschritt(lese("wissenFortschritt")) };
}

// ---------------------------------------------------------------
// Prüfsumme
// SHA-256 ist ein "Fingerabdruck" eines Textes: Ändert sich auch nur ein Zeichen
// (Datei beschädigt, abgeschnitten), kommt ein völlig anderer Fingerabdruck heraus.
// crypto.subtle ist im Browser und in Node eingebaut – keine Bibliothek nötig.
// ---------------------------------------------------------------
async function fingerabdruck(text) {
  const bytes = new TextEncoder().encode(text);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...hash].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------
// Sicherung bauen
// sitzungen, schwuenge: Einträge aus der Datenbank
// posedaten: { "<schwungId>": [ { zeit, punkte }, … ] }
// Rückgabe: der fertige Text der Datei
// ---------------------------------------------------------------
export async function baueSicherung({ sitzungen, schwuenge, posedaten, einstellungen, appVersion, erstellt }) {
  const daten = { sitzungen, schwuenge, posedaten, einstellungen };
  // Der Fingerabdruck gilt für genau diesen Text. Beim Prüfen wird "daten" wieder genauso
  // in Text verwandelt – JSON.stringify liefert für eingelesene Daten denselben Text.
  const pruefsumme = await fingerabdruck(JSON.stringify(daten));
  return JSON.stringify({ format: SICHERUNG_FORMAT, formatVersion: SICHERUNG_VERSION, appVersion, erstellt, pruefsumme, daten });
}

// ---------------------------------------------------------------
// Sicherung prüfen – BEVOR irgendetwas in die Datenbank geschrieben wird
// Rückgabe: { ok: true, daten, info } oder { ok: false, fehler: "Text für die Anzeige" }
// ---------------------------------------------------------------
const istObjekt = (x) => typeof x === "object" && x !== null && !Array.isArray(x);
const istZahl = (x) => typeof x === "number" && Number.isFinite(x);

export async function pruefeSicherung(text) {
  const nein = (fehler) => ({ ok: false, fehler });
  let datei;
  try {
    datei = JSON.parse(text);
  } catch {
    return nein("Die Datei ist keine Sicherung dieser App (kein lesbarer Inhalt) oder beschädigt.");
  }
  if (!istObjekt(datei) || datei.format !== SICHERUNG_FORMAT) {
    return nein("Die Datei ist keine Sicherung dieser App.");
  }
  if (!Number.isInteger(datei.formatVersion) || datei.formatVersion < 1) {
    return nein("Die Sicherung hat eine unbekannte Version.");
  }
  if (datei.formatVersion > SICHERUNG_VERSION) {
    return nein("Die Sicherung stammt aus einer neueren Version der App. Bitte zuerst die App aktualisieren (online öffnen).");
  }
  if (!istObjekt(datei.daten) || typeof datei.pruefsumme !== "string") {
    return nein("Die Sicherung ist unvollständig.");
  }
  if ((await fingerabdruck(JSON.stringify(datei.daten))) !== datei.pruefsumme) {
    return nein("Die Sicherung ist beschädigt (Prüfsumme stimmt nicht). Es wurde nichts eingespielt.");
  }

  // Aufbau prüfen. Die Prüfsumme schützt vor Beschädigung – das hier vor Dateien, die
  // jemand von Hand gebaut oder verändert hat. Alles Eingelesene zeigt die App ohnehin
  // nur per textContent an.
  const { sitzungen, schwuenge, posedaten, einstellungen } = datei.daten;
  if (!Array.isArray(sitzungen) || !Array.isArray(schwuenge) || !istObjekt(posedaten) || !istObjekt(einstellungen)) {
    return nein("Die Sicherung ist unvollständig.");
  }
  const schwungNach = new Map();
  for (const s of schwuenge) {
    if (!istObjekt(s) || typeof s.id !== "string" || schwungNach.has(s.id)) return nein("Die Sicherung enthält einen fehlerhaften Schwung.");
    schwungNach.set(s.id, s);
  }
  const sitzungIds = new Set();
  const benutzt = new Set();
  for (const sitzung of sitzungen) {
    const gut =
      istObjekt(sitzung) &&
      Number.isInteger(sitzung.id) && sitzung.id > 0 && !sitzungIds.has(sitzung.id) &&
      typeof sitzung.datum === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sitzung.datum) &&
      Array.isArray(sitzung.schwungIds) && sitzung.schwungIds.length > 0;
    if (!gut) return nein("Die Sicherung enthält eine fehlerhafte Sitzung.");
    sitzungIds.add(sitzung.id);
    for (const id of sitzung.schwungIds) {
      // Schwung-IDs sehen immer so aus: "<Sitzungs-ID>-<Nummer>", z. B. "1790500000000-2"
      const schwung = schwungNach.get(id);
      const passt =
        typeof id === "string" && id.startsWith(`${sitzung.id}-`) && /^\d+-\d+$/.test(id) &&
        !benutzt.has(id) && schwung && schwung.sitzungId === sitzung.id && pruefePosedaten(posedaten[id]);
      if (!passt) return nein("Die Sicherung enthält einen fehlerhaften oder fehlenden Schwung.");
      benutzt.add(id);
    }
  }
  if (benutzt.size !== schwungNach.size) return nein("Die Sicherung enthält Schwünge ohne Sitzung.");

  return {
    ok: true,
    daten: datei.daten,
    info: {
      erstellt: typeof datei.erstellt === "string" ? datei.erstellt : "",
      appVersion: typeof datei.appVersion === "string" ? datei.appVersion : "",
      sitzungen: sitzungen.length,
      schwuenge: schwuenge.length,
    },
  };
}

// Posedaten eines Schwungs: Liste von Bildern { zeit, punkte } – punkte ist null
// (keine Person erkannt) oder eine Liste von Punkten mit x und y.
function pruefePosedaten(bilder) {
  return (
    Array.isArray(bilder) &&
    bilder.every((b) => istObjekt(b) && istZahl(b.zeit) &&
      (b.punkte === null || (Array.isArray(b.punkte) && b.punkte.every((p) => istObjekt(p) && istZahl(p.x) && istZahl(p.y)))))
  );
}

// ---------------------------------------------------------------
// Einspielen planen: Zusammenführen, nie ersetzen (Entscheidung 13.10.)
// Sitzungen, die es auf dem Gerät schon gibt (gleiche ID = gleicher Speicherzeitpunkt),
// werden übersprungen. So entstehen keine Doppelten, und nochmal einspielen schadet nie.
// Rückgabe: { neu: [{ sitzung, schwuenge: [{ schwung, posedaten }] }], schonDa: Anzahl }
// ---------------------------------------------------------------
export function planeEinspielen(daten, vorhandeneSitzungIds) {
  const vorhanden = new Set(vorhandeneSitzungIds);
  const schwungNach = new Map(daten.schwuenge.map((s) => [s.id, s]));
  const neu = daten.sitzungen
    .filter((sitzung) => !vorhanden.has(sitzung.id))
    .map((sitzung) => ({
      sitzung,
      schwuenge: sitzung.schwungIds.map((id) => ({ schwung: schwungNach.get(id), posedaten: daten.posedaten[id] })),
    }));
  return { neu, schonDa: daten.sitzungen.length - neu.length };
}

// Lernfortschritt zusammenführen: Was auf dem Gerät oder in der Sicherung erledigt ist,
// bleibt erledigt. Unbekannte Lektions-IDs fallen weg (prüft leseFortschritt in wissen.js).
export function vereinigeLernfortschritt(aufGeraet, ausSicherung) {
  const sicherung = Array.isArray(ausSicherung) ? ausSicherung : [];
  return leseFortschritt(JSON.stringify([...aufGeraet, ...sicherung]));
}
