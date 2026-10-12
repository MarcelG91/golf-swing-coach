// ===============================================================
// Laufend aufnehmen, aber nur kurze Stücke im Speicher halten (Etappe 12d)
//
// Problem: Man kann eine Aufnahme nicht hinten "abschneiden", und erst nach dem Schwung zu
// wissen, wo er anfing, kommt zu spät. Lösung: ZWEI Aufnahmen laufen versetzt, jede
// STUECK_LAENGE Sekunden lang, die zweite startet STUECK_VERSATZ Sekunden später:
//
//   Spur A: |-------- 16 s --------|-------- 16 s --------|
//   Spur B:          |-------- 16 s --------|-------- 16 s --------|
//
// Jeder Zeitraum bis 8 s Länge liegt dadurch ganz in mindestens einem Stück. Stücke ohne
// Schwung werden von app.js sofort verworfen. Aus einem Stück mit Schwung wird später der
// kurze Clip ausgeschnitten (videokuerzen.js).
//
// Wichtig für den Datenschutz: Die Stücke liegen nur im Arbeitsspeicher, bis sie als
// Schwung-Clip in der Datenbank des Geräts landen. Nichts wird gesendet.
// ===============================================================

import { videoFormat } from "./videokuerzen.js";

export const STUECK_LAENGE = 16; // Sekunden
export const STUECK_VERSATZ = 8; // Sekunden, die zweite Spur startet später
const BITRATE = 2_000_000; // Bits pro Sekunde – 720p, ca. 4 MB pro Stück

// Kann dieses Gerät die Kamera aufnehmen?
export function kannAufnehmen() {
  return videoFormat() !== null;
}

// Startet beide Spuren. beiStueck({ blob, start, ende }) wird für jedes fertige Stück
// aufgerufen (start und ende = Uhrzeit in Sekunden, performance.now() / 1000).
// beiFehler(fehler) wird höchstens einmal aufgerufen, wenn die Aufnahme nicht klappt.
// Rückgabe: Funktion, die beendet und wartet, bis alle Stücke abgegeben sind.
export function starteAufnahme(strom, beiStueck, beiFehler) {
  const format = videoFormat();
  const typ = format.split(";")[0];
  let laeuft = true;
  let fehlerGemeldet = false;
  const spuren = [];

  function meldeFehler(fehler) {
    if (fehlerGemeldet) return;
    fehlerGemeldet = true;
    beiFehler(fehler);
  }

  // Eine Spur: nimmt ein Stück auf, stoppt es nach STUECK_LAENGE und beginnt sofort das nächste
  function neueSpur() {
    const spur = { rekorder: null, timer: null, fertig: Promise.resolve() };

    function naechstesStueck() {
      if (!laeuft) return;
      try {
        const rekorder = new MediaRecorder(strom, { mimeType: format, videoBitsPerSecond: BITRATE });
        const teile = [];
        let start = null;
        let ende = null;
        rekorder.ondataavailable = (e) => {
          if (e.data.size > 0) teile.push(e.data);
        };
        rekorder.onstart = () => {
          start = performance.now() / 1000;
        };
        rekorder.onerror = (e) => meldeFehler(e.error ?? new Error("Aufnahmefehler"));
        spur.fertig = new Promise((ok) => {
          rekorder.onstop = () => {
            if (start !== null && ende !== null && teile.length) {
              beiStueck({ blob: new Blob(teile, { type: typ }), start, ende });
            }
            ok();
          };
        });
        rekorder.start();
        spur.rekorder = rekorder;
        spur.timer = setTimeout(() => {
          stoppeRekorder(rekorder);
          naechstesStueck();
        }, STUECK_LAENGE * 1000);
        // Ende des Stücks = Moment des Stoppens (nicht des onstop-Ereignisses, das kommt später)
        rekorder.markiereEnde = () => {
          ende = performance.now() / 1000;
        };
      } catch (fehler) {
        meldeFehler(fehler);
      }
    }

    spur.starte = naechstesStueck;
    return spur;
  }

  function stoppeRekorder(rekorder) {
    if (rekorder.state === "inactive") return;
    rekorder.markiereEnde();
    rekorder.stop();
  }

  const a = neueSpur();
  const b = neueSpur();
  spuren.push(a, b);
  a.starte();
  b.timer = setTimeout(() => b.starte(), STUECK_VERSATZ * 1000);

  return async function beendeAufnahme() {
    laeuft = false;
    for (const spur of spuren) {
      clearTimeout(spur.timer);
      if (spur.rekorder) stoppeRekorder(spur.rekorder);
    }
    await Promise.all(spuren.map((spur) => spur.fertig));
  };
}
