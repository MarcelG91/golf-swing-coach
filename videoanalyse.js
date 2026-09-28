// ===============================================================
// Video schnell analysieren
//
// Früher: Für jedes Einzelbild an eine neue Stelle springen. Das ist auf dem
// iPhone sehr langsam – Safari muss iPhone-Videos (HEVC, oft 4K) bei jedem
// Sprung ab dem letzten Schlüsselbild neu entschlüsseln.
//
// Jetzt: Das Video wird abgespielt, und jedes erscheinende Bild wird erkannt.
// Abspielen entschlüsselt das Video am Stück (dafür ist die Hardware gebaut).
// Kommt die Erkennung nicht hinterher, spielt die App automatisch langsamer ab.
// Hängt das Abspielen, übernimmt das alte Verfahren (Springen) den Rest.
// ===============================================================

export const BILD_DAUER = 1 / 30; // Raster: ein Bild alle 1/30 s

const begrenze = (wert, min, max) => Math.min(max, Math.max(min, wert));

// ---------------------------------------------------------------
// Videolänge prüfen (Befund S3)
// Manche Dateien melden keine endliche Länge (Infinity oder NaN) – dann kann die
// Analyse nicht wissen, wann sie fertig ist. Solche Videos gelten als nicht lesbar.
// Lange Videos (z. B. von der Range mit mehreren Schlägen) sind erlaubt, bekommen
// aber einen Hinweis, wie lange die Analyse ungefähr dauert.
// Reine Rechnerei → mit node --test prüfbar.
// ---------------------------------------------------------------
export const LANG_AB_SEKUNDEN = 20;

export function pruefeVideoLaenge(dauer) {
  if (!Number.isFinite(dauer) || dauer <= 0) {
    return { lesbar: false, hinweis: "Die Länge des Videos ist unbekannt – bitte als normales Video (MP4/MOV) speichern." };
  }
  if (dauer < LANG_AB_SEKUNDEN) return { lesbar: true, hinweis: "" };
  const minuten = Math.floor(dauer / 60);
  const laenge = minuten ? `${minuten}:${String(Math.floor(dauer % 60)).padStart(2, "0")} min` : `${Math.floor(dauer)} s`;
  return {
    lesbar: true,
    hinweis: `Das Video ist ${laenge} lang – die Analyse dauert etwas. Tipp: In der Fotos-App auf den Schwung kürzen.`,
  };
}

// ---------------------------------------------------------------
// Erkannte Bilder in ein festes Raster legen: Platz i gehört zur Zeit i / 30 s.
// So findet die App später zu jeder Zeit im Video direkt das passende Bild
// (analyseBilder[Math.round(zeit / BILD_DAUER)]).
// Jeder Platz bekommt das zeitlich nächste erkannte Bild. Ist keines nah genug
// (mehr als 1,5 Rasterplätze entfernt), bleibt der Platz leer (punkte: null).
// Diese Funktion ist reine Rechnerei → mit node --test prüfbar.
// ---------------------------------------------------------------
export function aufRasterLegen(bilder, dauer, bildDauer = BILD_DAUER) {
  const sortiert = [...bilder].sort((a, b) => a.zeit - b.zeit);
  const anzahl = Math.floor(dauer / bildDauer + 1e-6) + 1;
  const raster = [];
  let j = 0;
  for (let i = 0; i < anzahl; i++) {
    const zeit = i * bildDauer;
    while (j + 1 < sortiert.length && Math.abs(sortiert[j + 1].zeit - zeit) <= Math.abs(sortiert[j].zeit - zeit)) j++;
    const naechstes = sortiert[j];
    const nahGenug = naechstes && Math.abs(naechstes.zeit - zeit) <= 1.5 * bildDauer;
    raster.push({ zeit, punkte: nahGenug ? naechstes.punkte : null });
  }
  return raster;
}

// Welche Rasterplätze haben kein passendes erkanntes Bild?
// (z. B. weil der Browser beim Abspielen Bilder übersprungen hat)
// toleranz (Sekunden): So weit darf das nächste erkannte Bild entfernt sein.
// Standard 0,75 Plätze: Bei 24- oder 25-Bilder-Videos liegt immer ein echtes Bild
// höchstens 0,63 Plätze entfernt – ein übersprungenes Bild ist mindestens 1 Platz weg.
// Kennt man den Abstand der Videobilder, geht es genauer: toleranzFuer(bildAbstand).
export function fehlendePlaetze(bilder, dauer, bildDauer = BILD_DAUER, toleranz = 0.75 * bildDauer) {
  const zeiten = bilder.map((b) => b.zeit).sort((a, b) => a - b);
  const anzahl = Math.floor(dauer / bildDauer + 1e-6) + 1;
  const fehlend = [];
  let j = 0;
  for (let i = 0; i < anzahl; i++) {
    const zeit = i * bildDauer;
    while (j + 1 < zeiten.length && Math.abs(zeiten[j + 1] - zeit) <= Math.abs(zeiten[j] - zeit)) j++;
    if (!zeiten.length || Math.abs(zeiten[j] - zeit) > toleranz) fehlend.push(i);
  }
  return fehlend;
}

// Das nächste echte Videobild liegt höchstens einen halben Bildabstand vom
// Rasterplatz entfernt. Ist das genommene Bild weiter weg, gab es ein passenderes.
// (60-Bilder-Video: 0,3 Plätze · 30: 0,6 · 24: 0,75)
export function toleranzFuer(bildAbstand, bildDauer = BILD_DAUER) {
  if (!Number.isFinite(bildAbstand) || bildAbstand <= 0) return 0.75 * bildDauer;
  return Math.min(0.75 * bildDauer, 0.6 * bildAbstand);
}

// Springt zu einer Zeit und wartet, bis das Bild da ist (höchstens maxMs)
export function springe(video, zeit, maxMs = 1000) {
  return new Promise((fertig) => {
    if (Math.abs(video.currentTime - zeit) < 0.001 && video.readyState >= 2) return fertig();
    const sicherheit = setTimeout(fertig, maxMs);
    video.addEventListener(
      "seeked",
      () => {
        clearTimeout(sicherheit);
        fertig();
      },
      { once: true }
    );
    video.currentTime = zeit;
  });
}

// ---------------------------------------------------------------
// Verfahren 1: Abspielen (schnell)
// erkenne()        → Körperpunkte des gerade angezeigten Bilds
// msStart          → gemessene Erkennungsdauer pro Bild (für das Starttempo)
// beiFortschritt() → wird nach jedem erkannten Bild aufgerufen
// ---------------------------------------------------------------
function perAbspielen(video, erkenne, msStart, beiFortschritt, bildDauer) {
  return new Promise((fertig) => {
    const bilder = [];
    let ms = msStart;
    // So schnell abspielen, wie die Erkennung hinterherkommt (30 % Reserve)
    let tempo = begrenze((bildDauer * 1000 * 0.7) / Math.max(ms, 1), 0.1, 1);
    let beendet = false;
    let wachhund = null;
    let bildAbstand = Infinity; // Abstand der echten Videobilder (1/30 s, 1/60 s, …)
    let letzteZeit = null;
    let ohneAussetzer = 0; // wie viele Bilder in Folge problemlos kamen

    // Das gerade angezeigte erste Bild gleich mitnehmen
    const erstesPunkte = erkenne();
    bilder.push({ zeit: video.currentTime, punkte: erstesPunkte });
    beiFortschritt(video.currentTime, ms, tempo, erstesPunkte);
    let naechstesZiel = (Math.round(video.currentTime / bildDauer) + 1) * bildDauer; // nächster Rasterplatz

    function ende(grund) {
      if (beendet) return;
      beendet = true;
      clearTimeout(wachhund);
      video.removeEventListener("ended", beiEnde);
      video.pause();
      fertig({ bilder, ms, tempo, grund, bildAbstand });
    }
    const beiEnde = () => ende("fertig");
    // Kommt 4 Sekunden lang kein neues Bild, hängt das Abspielen
    const wachhundNeu = () => {
      clearTimeout(wachhund);
      wachhund = setTimeout(() => ende("haengt"), 4000);
    };

    function schritt(_jetzt, info) {
      if (beendet) return;
      wachhundNeu();
      const zeit = info.mediaTime;
      // Kleinster Abstand zweier gezeigter Bilder = Abstand der echten Videobilder
      if (letzteZeit !== null && zeit > letzteZeit) bildAbstand = Math.min(bildAbstand, zeit - letzteZeit);
      letzteZeit = zeit;
      // Nur Bilder nahe am nächsten Rasterplatz nehmen
      // (bei 60-Bilder-Videos so jedes zweite, und zwar das passende)
      if (zeit >= naechstesZiel - 0.26 * bildDauer) {
        // Liegt das Bild weiter vom Rasterplatz weg als nötig, hat der Browser ein
        // passenderes übersprungen – dann kommen wir nicht hinterher.
        const platz = Math.round(zeit / bildDauer) * bildDauer;
        const luecke =
          zeit - naechstesZiel > bildDauer || Math.abs(zeit - platz) > toleranzFuer(bildAbstand, bildDauer);
        const start = performance.now();
        const punkte = erkenne();
        ms = ms * 0.8 + (performance.now() - start) * 0.2;
        bilder.push({ zeit, punkte });
        naechstesZiel = (Math.round(zeit / bildDauer) + 1) * bildDauer;
        // Erkennung kommt nicht hinterher → langsamer abspielen.
        // Läuft es 15 Bilder lang rund → wieder etwas schneller (z. B. nach einem kurzen Ruckler).
        if (luecke) {
          ohneAussetzer = 0;
          if (tempo > 0.1) {
            tempo = Math.max(0.1, tempo * 0.7);
            video.playbackRate = tempo;
          }
        } else if (++ohneAussetzer >= 15 && tempo < 1) {
          ohneAussetzer = 0;
          tempo = Math.min(1, tempo * 1.15);
          video.playbackRate = tempo;
        }
        beiFortschritt(zeit, ms, tempo, punkte);
      }
      if (video.ended || zeit >= video.duration - bildDauer / 2) return ende("fertig");
      video.requestVideoFrameCallback(schritt);
    }

    video.addEventListener("ended", beiEnde);
    video.playbackRate = tempo;
    video.requestVideoFrameCallback(schritt);
    wachhundNeu();
    video.play().catch(() => ende("abspielen-verweigert"));
  });
}

// ---------------------------------------------------------------
// Verfahren 2: Springen – für ältere Browser und um Lücken nachzuholen
// plaetze = Liste von Rasterplätzen (Platz i = Zeit i / 30 s)
// ---------------------------------------------------------------
async function perSpringen(video, erkenne, plaetze, beiFortschritt, bildDauer) {
  const bilder = [];
  let ms = 0;
  for (const i of plaetze) {
    const zeit = Math.min(i * bildDauer, video.duration);
    await springe(video, zeit);
    const start = performance.now();
    const punkte = erkenne();
    ms = ms ? ms * 0.8 + (performance.now() - start) * 0.2 : performance.now() - start;
    bilder.push({ zeit, punkte });
    beiFortschritt(zeit, ms, null, punkte);
  }
  return { bilder, ms };
}

// ---------------------------------------------------------------
// Hauptfunktion: ganzes Video analysieren
// Rückgabe: { bilder (im 1/30-s-Raster), msProBild, verfahren, sekunden }
// ---------------------------------------------------------------
export async function analysiereVideo(video, erkenne, { msProBild = 30, beiFortschritt = () => {}, bildDauer = BILD_DAUER } = {}) {
  const startZeit = performance.now();
  await springe(video, 0);

  let bilder = [];
  let ms = msProBild;
  let verfahren;

  if ("requestVideoFrameCallback" in video) {
    const lauf = await perAbspielen(video, erkenne, msProBild, beiFortschritt, bildDauer);
    bilder = lauf.bilder;
    ms = lauf.ms;
    verfahren = lauf.grund === "fertig" ? "abgespielt" : `abgespielt (${lauf.grund})`;
    // Lücken (übersprungene Bilder, abgebrochenes Abspielen) gezielt nachholen
    const fehlend = fehlendePlaetze(bilder, video.duration, bildDauer, toleranzFuer(lauf.bildAbstand, bildDauer));
    if (fehlend.length) {
      const rest = await perSpringen(video, erkenne, fehlend, beiFortschritt, bildDauer);
      bilder = bilder.concat(rest.bilder);
      verfahren += `, ${fehlend.length} ${fehlend.length === 1 ? "Bild" : "Bilder"} nachgeholt`;
    }
  } else {
    const alle = Array.from({ length: Math.floor(video.duration / bildDauer + 1e-6) + 1 }, (_, i) => i);
    const lauf = await perSpringen(video, erkenne, alle, beiFortschritt, bildDauer);
    bilder = lauf.bilder;
    ms = lauf.ms;
    verfahren = "Bild für Bild angesprungen";
  }

  return {
    bilder: aufRasterLegen(bilder, video.duration, bildDauer),
    msProBild: ms,
    verfahren,
    sekunden: (performance.now() - startZeit) / 1000,
  };
}
