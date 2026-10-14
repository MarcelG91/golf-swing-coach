// Tests für die Fotos der Wissensseite (fotos.js, fotos/), ergänzt beim Golf-App-Check 14.10.
// Die Grundprüfungen (freie Lizenz, Größe, sw.js, fotos/README.md) stehen in tests/wissen.test.mjs.
// Hier zusätzlich:
//   1. Der Nachweis unter dem Foto erfüllt die Lizenz (CC BY: Adresse der Lizenz + „bearbeitet“).
//   2. Die Offline-Prüfung in pwa.js kennt jedes Foto (sonst „Offline bereit ✓“, obwohl eins fehlt).
//   3. Keine Ortsdaten (GPS) in den Bilddateien – das Repo ist öffentlich.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { FOTOS, fotoNachweis } from "../fotos.js";

const lies = (pfad) => fs.readFileSync(new URL(`../${pfad}`, import.meta.url));

test("Fotos: Nachweis passt zur Lizenz (CC BY mit Lizenzadresse und Hinweis auf Bearbeitung)", () => {
  for (const [name, f] of Object.entries(FOTOS)) {
    const text = fotoNachweis(f);
    assert.ok(text.includes(f.urheber), `${name}: Urheber fehlt im Nachweis`);
    if (f.lizenz.startsWith("CC BY")) {
      // CC BY 4.0, Abschnitt 3(a): Urheber, Hinweis auf die Lizenz mit Adresse, Hinweis auf Änderungen
      const adresse = f.lizenz === "CC BY-SA 4.0" ? "creativecommons.org/licenses/by-sa/4.0" : "creativecommons.org/licenses/by/4.0";
      assert.ok(text.includes(`(${adresse})`), `${name}: Lizenzadresse fehlt`);
      assert.match(text, /bearbeitet$/, `${name}: Hinweis „bearbeitet“ fehlt`);
    } else {
      assert.doesNotMatch(text, /creativecommons|bearbeitet/, `${name}: bei ${f.lizenz} nicht nötig`);
    }
    // Nur Text, keine Adresse mit https:// (die App hat keine Links und lädt nichts nach)
    assert.doesNotMatch(text, /https?:\/\//);
  }
});

test("Fotos: stehen in beiden Offline-Listen (sw.js und pwa.js)", () => {
  const liste = (datei) => {
    const treffer = lies(datei).toString("utf8").match(/APP_DATEIEN\s*=\s*\[([\s\S]*?)\]/);
    return [...treffer[1].matchAll(/["']([^"']+)["']/g)].map(([, pfad]) => pfad);
  };
  const sw = liste("sw.js"), pwa = liste("pwa.js");
  for (const f of Object.values(FOTOS)) {
    assert.ok(sw.includes(`./${f.datei}`), `${f.datei} fehlt in sw.js`);
    assert.ok(pwa.includes(`./${f.datei}`), `${f.datei} fehlt in pwa.js (Offline-Prüfung)`);
  }
  // Und umgekehrt: kein Foto in den Listen, das es nicht mehr gibt
  const bekannt = new Set(Object.values(FOTOS).map((f) => `./${f.datei}`));
  for (const pfad of [...sw, ...pwa].filter((p) => p.startsWith("./fotos/"))) assert.ok(bekannt.has(pfad), `${pfad} gibt es nicht in fotos.js`);
});

// Sucht in einer JPEG-Datei den EXIF-Block (APP1 "Exif") und liefert alle Kennnummern (Tags)
// aus dem ersten Verzeichnis (IFD0). Tag 0x8825 = Zeiger auf GPS-Daten.
function exifTags(daten) {
  let stelle = 2; // nach FF D8 (Anfang der Datei)
  while (stelle + 4 <= daten.length && daten[stelle] === 0xff) {
    const marke = daten[stelle + 1];
    const laenge = daten.readUInt16BE(stelle + 2);
    if (marke === 0xda) break; // ab hier kommen die Bilddaten
    if (marke === 0xe1 && daten.toString("latin1", stelle + 4, stelle + 10) === "Exif\0\0") {
      const tiff = stelle + 10;
      const klein = daten.toString("latin1", tiff, tiff + 2) === "II"; // Byte-Reihenfolge
      const zahl16 = (o) => (klein ? daten.readUInt16LE(o) : daten.readUInt16BE(o));
      const zahl32 = (o) => (klein ? daten.readUInt32LE(o) : daten.readUInt32BE(o));
      const ifd = tiff + zahl32(tiff + 4);
      return Array.from({ length: zahl16(ifd) }, (_, i) => zahl16(ifd + 2 + i * 12));
    }
    stelle += 2 + laenge;
  }
  return [];
}

test("Fotos: echte JPEG-Dateien ohne Ortsdaten (GPS)", () => {
  for (const f of Object.values(FOTOS)) {
    const daten = lies(f.datei);
    assert.equal(daten.readUInt16BE(0), 0xffd8, `${f.datei} ist kein JPEG`);
    assert.ok(!exifTags(daten).includes(0x8825), `${f.datei}: enthält GPS-Daten – bitte entfernen`);
    // GPS kann auch im XMP-Block stehen (Text in der Datei)
    assert.doesNotMatch(daten.toString("latin1"), /exif:GPS|GPSLatitude|GPSLongitude/, `${f.datei}: GPS im XMP-Block`);
  }
});

test("EXIF-Leser findet einen GPS-Zeiger (Gegenprobe mit gebauter Datei)", () => {
  // Kleinstes Gerüst: FF D8, APP1 mit "Exif\0\0", TIFF-Kopf (II, 42, IFD bei 8), 1 Eintrag Tag 0x8825
  const tiff = Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x25, 0x88, 0x04, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const app1 = Buffer.concat([Buffer.from([0xff, 0xe1, 0x00, 2 + 6 + tiff.length]), Buffer.from("Exif\0\0", "latin1"), tiff]);
  const datei = Buffer.concat([Buffer.from([0xff, 0xd8]), app1, Buffer.from([0xff, 0xda, 0x00, 0x02])]);
  assert.deepEqual(exifTags(datei), [0x8825]);
  assert.deepEqual(exifTags(Buffer.from([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02])), []);
});
