// ===============================================================
// Fotos für die Wissensseite (Feedback 13.10.: „mehr mit Bildern arbeiten, auch aus dem Internet“)
//
// Entscheidung 13.10.: Nur Fotos mit freier Lizenz von Wikimedia Commons. Sie liegen als Datei im
// Ordner fotos/ (kein Nachladen von fremden Servern, offline verfügbar) und tragen unter dem Bild
// Fotograf, Lizenz und Herkunft. Ausführliche Herkunft mit Adressen: fotos/README.md.
// Jedes Foto wurde fachlich angesehen: Es zeigt nur, was die Lektion daneben sagt (keine falsche
// Technik, siehe CLAUDE.md). Schwungfotos zeigen deshalb einen Tourspieler.
//
// Reine Daten ohne Browser-Code (tests/wissen.test.mjs prüft Datei, Lizenz und Angaben).
// In den Lektionen (wissen.js) heißt ein Foto "foto:<name>", z. B. bild: "foto:top".
//   datei   – Pfad im Repo (auch in sw.js / pwa.js für den Offline-Betrieb)
//   alt     – Beschreibung für Bildschirmleser
//   text    – kurzer Satz unter dem Foto: worauf man achten soll
//   urheber – so, wie die Lizenz es verlangt
//   lizenz  – Kurzname; erlaubt sind nur freie Lizenzen (LIZENZEN unten)
// ===============================================================

export const LIZENZEN = ["CC0", "CC BY 4.0", "CC BY-SA 4.0", "gemeinfrei"];

// Alle Wiesberger-Fotos: Lyoness Open 2016 (European Tour), veröffentlicht von „Shot Clock Masters“ als CC0
const TURNIER = "Tourspieler, Lyoness Open 2016";

export const FOTOS = {
  "griff-linke-hand": {
    datei: "fotos/griff-linke-hand.jpg",
    alt: "Linke Hand mit offener Handfläche, der Golfgriff liegt schräg über den Fingern",
    text: "Linke Hand: Der Griff liegt schräg in den Fingern – nicht in der Handfläche.",
    urheber: "Bobjgalindo",
    lizenz: "CC BY 4.0",
  },
  // Vardon-Tafeln (1912): Das Buch ist von Harry Vardon, die Fotos laut Bildverzeichnis von Arthur Ullyett
  // („action photographs specially taken by Arthur Ullyett“) – deshalb steht er als Fotograf da (Check 14.10.).
  "griff-ueberlappend": {
    datei: "fotos/griff-ueberlappend.jpg",
    alt: "Zwei Hände greifen einen Golfschläger eng zusammen, die rechte Hand überlappt die linke",
    text: "Der überlappende Griff, wie Harry Vardon ihn 1912 zeigt: Beide Hände liegen eng zusammen und arbeiten als Einheit.",
    urheber: "Arthur Ullyett, in Harry Vardon: How to Play Golf (1912)",
    lizenz: "gemeinfrei",
  },
  "griff-falsch": {
    datei: "fotos/griff-falsch.jpg",
    alt: "Griff von vorn, die rechte Hand ist weit unter den Schaft gedreht",
    text: "Laut Vardon „eindeutig falsch“: Die rechte Hand ist zu weit unter den Schaft gedreht.",
    urheber: "Arthur Ullyett, in Harry Vardon: How to Play Golf (1912)",
    lizenz: "gemeinfrei",
  },
  top: {
    datei: "fotos/top.jpg",
    alt: "Golfer am höchsten Punkt des Rückschwungs, Rücken zum Ziel gedreht",
    text: "Am Top: Schultern voll gedreht, der Rücken zeigt zum Ziel.",
    urheber: `${TURNIER} · Shot Clock Masters`,
    lizenz: "CC0",
  },
  "nach-dem-treffen": {
    datei: "fotos/nach-dem-treffen.jpg",
    alt: "Golfer kurz nach dem Treffen mit einem Eisen, Rasenstück fliegt vor der Ballposition",
    text: "Kurz nach dem Treffen mit dem Eisen: Das Rasenstück (Divot) fliegt erst nach dem Ball – erst Ball, dann Boden.",
    urheber: `${TURNIER} · Shot Clock Masters`,
    lizenz: "CC0",
  },
  finish: {
    datei: "fotos/finish.jpg",
    alt: "Golfer im Finish, Brust zum Ziel, Schläger über der Schulter",
    text: "Finish: Brust zum Ziel, Gewicht vorn, ruhig stehen bleiben.",
    urheber: `${TURNIER} · Shot Clock Masters`,
    lizenz: "CC0",
  },
  bunker: {
    datei: "fotos/bunker.jpg",
    alt: "Golfer im Grünbunker, der Schläger schlägt eine Sandfontäne heraus",
    text: "Der Schläger trifft den Sand – der Sand trägt den Ball aus dem Bunker.",
    urheber: `${TURNIER} · Shot Clock Masters`,
    lizenz: "CC0",
  },
  "gruen-lesen": {
    datei: "fotos/gruen-lesen.jpg",
    alt: "Golfer hockt hinter dem Ball und schaut die Puttlinie entlang",
    text: "Grün lesen: hinter dem Ball in die Hocke, die Linie bis zum Loch ansehen.",
    urheber: `${TURNIER} · Shot Clock Masters`,
    lizenz: "CC0",
  },
};

// "foto:top" → Eintrag oder null
export function foto(name) {
  if (typeof name !== "string" || !name.startsWith("foto:")) return null;
  return FOTOS[name.slice(5)] ?? null;
}

// CC BY und CC BY-SA verlangen im Nachweis außerdem die Adresse der Lizenz und den Hinweis,
// dass das Bild verändert wurde (alle Fotos sind verkleinert, manche beschnitten – fotos/README.md).
// Die Adresse steht nur als Text da: Die App hat keine Links und lädt nichts nach (Check 14.10.).
// Bei CC0 und gemeinfreien Fotos ist beides nicht nötig.
const LIZENZ_ADRESSE = {
  "CC BY 4.0": "creativecommons.org/licenses/by/4.0",
  "CC BY-SA 4.0": "creativecommons.org/licenses/by-sa/4.0",
};

// Zeile unter dem Foto, z. B. "Foto: Shot Clock Masters · CC0 · Wikimedia Commons" oder
// "Foto: Bobjgalindo · CC BY 4.0 (creativecommons.org/licenses/by/4.0) · Wikimedia Commons · bearbeitet"
export function fotoNachweis(f) {
  const adresse = LIZENZ_ADRESSE[f.lizenz];
  if (!adresse) return `Foto: ${f.urheber} · ${f.lizenz} · Wikimedia Commons`;
  return `Foto: ${f.urheber} · ${f.lizenz} (${adresse}) · Wikimedia Commons · bearbeitet`;
}
