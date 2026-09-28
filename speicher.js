// ===============================================================
// Schwünge auf dem Gerät speichern (Etappe 8)
//
// Teil 1: Umrechnen – aus einem analysierten Schwung einen speicherbaren
//         Eintrag machen (Clip-Ausschnitt, Zeiten ab 0 s). Reine Rechnerei
//         ohne Browser → testbar mit node --test.
// Teil 2: Datenbank – IndexedDB, die im Browser eingebaute Datenbank.
//         Nur sie kann große Dateien wie Videos aufnehmen (localStorage schafft
//         nur ca. 5 MB Text). Ihre Bedienung ist umständlich, deshalb verpacken
//         wir sie hier in ein paar einfache Befehle.
// ===============================================================

import { gueltigeBilder } from "./phasen.js";

const BILD_DAUER = 1 / 30; // Raster der Posedaten (wie in app.js)
const RAND = 1; // So viel Video vor dem Ansprechen und nach dem Finish kommt in den Clip (Sekunden)

// Nummer des Rasterplatzes zu einer Zeit: 0,5 s → Platz 15
const platz = (zeit) => Math.round(zeit / BILD_DAUER);

// ---------------------------------------------------------------
// Teil 1: Umrechnen
// ---------------------------------------------------------------

// Welcher Teil des Originalvideos kommt in den Clip? (Sekunden, im 1/30-s-Raster)
// 1 s vor dem Ansprechen bis 1 s nach dem Finish – aber nie über den Ausschnitt
// des Schwungs hinaus (sonst wäre bei mehreren Schlägen der Nachbar mit drin).
export function clipGrenzen(schwung) {
  const von = Math.max(platz(schwung.bilder[0].zeit), platz(schwung.phasen.ansprechen.zeit - RAND));
  const bis = Math.min(platz(schwung.bilder.at(-1).zeit), platz(schwung.phasen.finish.zeit + RAND));
  return { start: von * BILD_DAUER, ende: bis * BILD_DAUER };
}

// Macht aus einem Schwung (aus schwuenge.js / alleSchwuenge in app.js) zwei Teile:
//   schwung   – die kleinen Daten (Kennzahlen, Phasen …) für die Liste und den Fortschritt
//   posedaten – die Körperpunkte jedes Bilds im Clip (groß, wird getrennt gespeichert)
// Alle Zeiten werden so verschoben, dass der Clip bei 0 s beginnt.
// versatz = so viele Sekunden ist der aufgenommene Clip am Anfang länger
// (Zeit zwischen Aufnahmestart und erstem Videobild, siehe videokuerzen.js).
export function schwungZumSpeichern(schwung, { start, ende, versatz = 0 }) {
  const von = platz(start);
  const bis = platz(ende);
  const vorne = Math.max(0, Math.round(versatz / BILD_DAUER)); // leere Bilder für den Versatz
  // Neue Zeit im Clip für eine Zeit im Originalvideo
  const clipZeit = (zeit) => (vorne + platz(zeit) - von) * BILD_DAUER;

  const posedaten = [];
  for (let i = 0; i < vorne; i++) posedaten.push({ zeit: i * BILD_DAUER, punkte: null });
  for (const b of schwung.bilder) {
    const p = platz(b.zeit);
    if (p < von || p > bis) continue;
    posedaten.push({ zeit: clipZeit(b.zeit), punkte: b.punkte ? b.punkte.map(runde) : null });
  }

  // Die vier Phasen in den Clip verschieben. "index" zählt nur Bilder mit erkannter
  // Person (gueltigeBilder) – den rechnen wir neu, damit kennzahlen.js und technik.js
  // den Schwung später aus den gespeicherten Daten genauso neu bewerten können.
  const gueltig = gueltigeBilder(posedaten);
  const verschiebe = (phase) => {
    const zeit = clipZeit(phase.zeit);
    return { zeit, index: gueltig.findIndex((b) => Math.abs(b.zeit - zeit) < BILD_DAUER / 2) };
  };
  const { ansprechen, top, treffmoment, finish } = schwung.phasen;
  const phasen = {
    ...schwung.phasen,
    ansprechen: verschiebe(ansprechen),
    top: verschiebe(top),
    treffmoment: verschiebe(treffmoment),
    finish: verschiebe(finish),
  };

  return {
    schwung: {
      ansicht: schwung.ansicht,
      sicher: schwung.sicher,
      grund: schwung.grund,
      kennzahlen: schwung.kennzahlen,
      phasen,
      bewertung: schwung.bewertung,
      technik: schwung.technik,
      seitenverhaeltnis: schwung.bewertung.seitenverhaeltnis,
      videoName: schwung.datei?.name ?? "",
    },
    posedaten,
  };
}

// Punkt auf 4 Nachkommastellen runden (wie beim Posedaten-Export) – spart Platz.
// z (Tiefe) nutzt die App nicht, das lassen wir weg.
function runde(p) {
  const neu = { x: Number(p.x.toFixed(4)), y: Number(p.y.toFixed(4)) };
  if (p.visibility !== undefined) neu.visibility = Number(p.visibility.toFixed(2));
  return neu;
}

// ---------------------------------------------------------------
// Teil 1b: Aufräumen – was genau wird gelöscht? (auch reine Rechnerei)
// ---------------------------------------------------------------

// Die großen Dateien pro Schwung (Schlüssel im Speicher "medien": "<id>/<art>")
export const MEDIEN_ARTEN = ["video", "posedaten", "vorschau"];
// "Videos und Bilder löschen": nur das, was dich zeigt. Die Posedaten bleiben –
// das sind reine Zahlen (kein Bild), und Etappe 10 braucht sie, um alte Schwünge
// mit verbesserten Formeln neu auszuwerten.
export const BILD_ARTEN = ["video", "vorschau"];

// Schlüssel der großen Dateien zu einigen Schwüngen, z. B.
// medienSchluessel(["17…-1"], BILD_ARTEN) → ["17…-1/video", "17…-1/vorschau"]
export function medienSchluessel(schwungIds, arten) {
  return schwungIds.flatMap((id) => arten.map((art) => `${id}/${art}`));
}

// Wie viele Videos und Vorschaubilder gehören zu diesen Schwüngen, und wie groß
// sind sie zusammen? groessen = Map "<id>/<art>" → Bytes (aus ladeMedienGroessen)
export function zaehleBilder(groessen, schwungIds) {
  let videos = 0;
  let vorschauen = 0;
  let bytes = 0;
  for (const schluessel of medienSchluessel(schwungIds, BILD_ARTEN)) {
    if (!groessen.has(schluessel)) continue; // schon gelöscht oder nie gespeichert
    if (schluessel.endsWith("/video")) videos++;
    else vorschauen++;
    bytes += groessen.get(schluessel);
  }
  return { videos, vorschauen, bytes };
}

// Sitzungen, deren Datum mehr als `tage` Tage vor `heute` liegt.
// Datumsangaben im Format "2026-09-28" (wie in der Sitzung gespeichert).
export function sitzungenAelterAls(sitzungen, tage, heute) {
  // In ganze Tage umrechnen. Date.UTC statt new Date("…"), damit Sommer-/Winterzeit
  // nicht dazwischenfunkt (sonst hätte ein Tag manchmal 23 oder 25 Stunden).
  const tagNummer = (iso) => {
    const [jahr, monat, tag] = iso.split("-").map(Number);
    return Date.UTC(jahr, monat - 1, tag) / 86_400_000;
  };
  return sitzungen.filter((s) => tagNummer(heute) - tagNummer(s.datum) > tage);
}

// ---------------------------------------------------------------
// Teil 2: Datenbank (nur im Browser)
//
// Drei "Speicher" – ähnlich wie Tabellen:
//   sitzungen  – eine Analyse: Datum, Schläger, Notiz, welche Schwünge dazugehören
//   schwuenge  – ein Schwung: Kennzahlen, Phasen, Bewertung (klein, ca. 10–20 KB)
//   medien     – große Dateien: "<id>/video", "<id>/posedaten", "<id>/vorschau"
// Große Dinge liegen getrennt, damit Listen schnell laden, ohne jedes Video anzufassen.
// ---------------------------------------------------------------

let datenbankName = "golf-swing-coach";
let verbindung = null;

// Für den Browser-Test: eine eigene Test-Datenbank benutzen statt der echten
export function nutzeDatenbank(name) {
  datenbankName = name;
  verbindung = null;
}

// IndexedDB meldet Ergebnisse über onsuccess/onerror. Mit einem Promise
// können wir stattdessen einfach "await" schreiben.
function ergebnis(anfrage) {
  return new Promise((ok, fehler) => {
    anfrage.onsuccess = () => ok(anfrage.result);
    anfrage.onerror = () => fehler(anfrage.error);
  });
}

// Eine Transaktion ist eine Gruppe von Änderungen, die ganz oder gar nicht
// passiert – z. B. wird nie nur die Hälfte einer Sitzung gespeichert.
function abgeschlossen(transaktion) {
  return new Promise((ok, fehler) => {
    transaktion.oncomplete = () => ok();
    transaktion.onerror = transaktion.onabort = () => fehler(transaktion.error);
  });
}

function oeffne() {
  if (verbindung) return verbindung;
  const anfrage = indexedDB.open(datenbankName, 1);
  // Läuft nur beim allerersten Öffnen (oder wenn wir die Versionsnummer erhöhen):
  // Hier werden die Speicher angelegt.
  anfrage.onupgradeneeded = () => {
    const db = anfrage.result;
    db.createObjectStore("sitzungen", { keyPath: "id" }); // Schlüssel steckt im Eintrag (Feld "id")
    db.createObjectStore("schwuenge", { keyPath: "id" });
    db.createObjectStore("medien"); // Schlüssel wird beim Speichern mitgegeben
  };
  verbindung = ergebnis(anfrage);
  return verbindung;
}

// Eine Sitzung mit allen Schwüngen speichern – alles in einer Transaktion.
// eintraege = [{ schwung, posedaten, video (Blob oder null), vorschau (Blob) }]
export async function speichereSitzung(sitzung, eintraege) {
  const db = await oeffne();
  const t = db.transaction(["sitzungen", "schwuenge", "medien"], "readwrite");
  t.objectStore("sitzungen").put(sitzung);
  for (const { schwung, posedaten, video, vorschau } of eintraege) {
    t.objectStore("schwuenge").put(schwung);
    const medien = t.objectStore("medien");
    medien.put(posedaten, `${schwung.id}/posedaten`);
    if (video) medien.put(video, `${schwung.id}/video`);
    if (vorschau) medien.put(vorschau, `${schwung.id}/vorschau`);
  }
  await abgeschlossen(t);
}

// Alle Sitzungen, die neueste zuerst: nach dem eingetragenen Datum (kann bei
// nachgetragenen Videos älter sein), am selben Tag nach Speicherzeitpunkt (id)
export async function ladeSitzungen() {
  const db = await oeffne();
  const alle = await ergebnis(db.transaction("sitzungen").objectStore("sitzungen").getAll());
  return alle.sort((a, b) => b.datum.localeCompare(a.datum) || b.id - a.id);
}

export async function ladeSchwuengeDerSitzung(sitzung) {
  const db = await oeffne();
  const speicher = db.transaction("schwuenge").objectStore("schwuenge");
  return Promise.all(sitzung.schwungIds.map((id) => ergebnis(speicher.get(id))));
}

// Eine große Datei laden, z. B. ladeMedium("1790500000000-1/video") → Blob (oder undefined)
export async function ladeMedium(schluessel) {
  const db = await oeffne();
  return ergebnis(db.transaction("medien").objectStore("medien").get(schluessel));
}

// Einen Schwung löschen. War es der letzte der Sitzung, verschwindet auch die Sitzung.
export async function loescheSchwung(sitzung, schwungId) {
  const db = await oeffne();
  const t = db.transaction(["sitzungen", "schwuenge", "medien"], "readwrite");
  loescheSchwungIn(t, schwungId);
  const rest = sitzung.schwungIds.filter((id) => id !== schwungId);
  if (rest.length) t.objectStore("sitzungen").put({ ...sitzung, schwungIds: rest });
  else t.objectStore("sitzungen").delete(sitzung.id);
  await abgeschlossen(t);
}

export async function loescheSitzung(sitzung) {
  const db = await oeffne();
  const t = db.transaction(["sitzungen", "schwuenge", "medien"], "readwrite");
  for (const id of sitzung.schwungIds) loescheSchwungIn(t, id);
  t.objectStore("sitzungen").delete(sitzung.id);
  await abgeschlossen(t);
}

function loescheSchwungIn(t, id) {
  t.objectStore("schwuenge").delete(id);
  for (const schluessel of medienSchluessel([id], MEDIEN_ARTEN)) t.objectStore("medien").delete(schluessel);
}

// Welche großen Dateien liegen gespeichert, und wie groß sind sie?
// → Map "<id>/<art>" → Bytes. Posedaten zählen mit 0 (reine Zahlen, kein Bild).
export async function ladeMedienGroessen() {
  const db = await oeffne();
  // Erst nur die Schlüssel holen – das lädt keine einzige Datei
  const schluessel = await ergebnis(db.transaction("medien").objectStore("medien").getAllKeys());
  const bilder = schluessel.filter((s) => !s.endsWith("/posedaten"));
  // Dann Videos und Vorschaubilder: IndexedDB liefert sie als Blob. Ein Blob ist nur ein
  // Verweis auf die Datei – .size kostet nichts, das Video wird dafür nicht geladen.
  const speicher = db.transaction("medien").objectStore("medien");
  const dateien = await Promise.all(bilder.map((s) => ergebnis(speicher.get(s))));
  const groessen = new Map(schluessel.map((s) => [s, 0]));
  bilder.forEach((s, i) => groessen.set(s, dateien[i]?.size ?? 0));
  return groessen;
}

// "Videos und Bilder löschen": Clips und Vorschaubilder dieser Sitzungen entfernen.
// Sitzungen, Schwünge (mit allen Kennzahlen) und Posedaten bleiben erhalten.
// Eine Transaktion: Entweder ist danach alles davon weg – oder bei einem Fehler nichts.
export async function loescheVideosUndBilder(sitzungen) {
  const db = await oeffne();
  const t = db.transaction("medien", "readwrite");
  const medien = t.objectStore("medien");
  for (const schluessel of medienSchluessel(sitzungen.flatMap((s) => s.schwungIds), BILD_ARTEN)) {
    medien.delete(schluessel);
  }
  await abgeschlossen(t);
}

// Alle gespeicherten Schwünge löschen: die drei Speicher dieser Datenbank leeren.
// Bewusst NUR diese Datenbank. Level und (später) Coach-Schlüssel liegen im
// localStorage, die Offline-Dateien beim Service Worker – beides bleibt unberührt.
// indexedDB.deleteDatabase() wäre die Alternative, bleibt aber hängen, solange die
// App die Datenbank geöffnet hat.
export async function loescheAlles() {
  const db = await oeffne();
  const speicher = ["sitzungen", "schwuenge", "medien"];
  const t = db.transaction(speicher, "readwrite");
  for (const name of speicher) t.objectStore(name).clear();
  await abgeschlossen(t);
}

// Wie viel Speicher belegt die App? (in Bytes; der Browser schätzt grob)
export async function speicherBelegung() {
  if (!navigator.storage?.estimate) return null;
  const { usage, quota } = await navigator.storage.estimate();
  return { belegt: usage, verfuegbar: quota };
}
