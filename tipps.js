// ===============================================================
// Kurze Tipps: was los ist, warum es wichtig ist, ein Schwunggedanke und eine Übung
//
// Alle Texte der Baustellen-Karten stehen hier an EINER Stelle, damit man sie
// leicht prüfen und korrigieren kann (Durchsicht siehe docs/plan-tipps-neu.md).
// Reine Rechenlogik ohne Browser-Code, damit sie mit node --test prüfbar ist.
//
//   tipp(kennzahl, rechtshaender)  → { kurz, warum, gedanke, uebung } für eine Baustelle
//   gutText(kennzahl, rechtshaender) → eine Zeile Lob für die Karte "Läuft schon gut"
//   skala(kennzahl)                → Balken mit Zielbereich und deinem Wert (oder null)
//
// Längen-Regeln (prüft tests/tipps.test.mjs): kurz ≤ 6 Wörter, warum ≤ 30 Wörter,
// gedanke ≤ 5 Wörter, Übung 2–4 Schritte mit je ≤ 12 Wörtern.
// ===============================================================

import { seiten } from "./technik.js";

// Tempo: Zeiten, ab denen die Ursache eines kleinen Verhältnisses (< 2,4 : 1) klar ist.
// Eigene Festlegung nach Grober & Cholewicki 2006 (Profis: Rückschwung 0,7–0,8 s) und
// Grober 2010 (Hcp 25: 0,83 s zurück, 0,43 s runter = 1,9 : 1 durch einen langsamen Abschwung).
// Bei 30 Bildern pro Sekunde sind die Zeiten auf etwa ±0,03 s genau.
const HASTIG_RUECKSCHWUNG_S = 0.7;
const LANGER_ABSCHWUNG_S = 0.35;

// Rückschwung- und Abschwungzeit stehen als Text in "detail" ("Rückschwung 0,83 s · Abschwung 0,43 s").
// Daraus lesen wir sie wieder aus – das klappt auch bei Schwüngen, die vor dieser Version gespeichert wurden.
function tempoZeiten(k) {
  const treffer = /Rückschwung (\d+,\d+) s.*Abschwung (\d+,\d+) s/.exec(k.detail || "");
  if (!treffer) return null;
  return { rueckschwung: Number(treffer[1].replace(",", ".")), abschwung: Number(treffer[2].replace(",", ".")) };
}

// Kleines Verhältnis heißt NICHT immer "Rückschwung zu hastig": Es kann auch an einem langen Abschwung liegen.
// Hastig ist nur, wer wirklich schnell zurückschwingt und dessen Abschwung nicht auffällig lang ist.
function tempoKleinesVerhaeltnis(k) {
  const zeiten = tempoZeiten(k);
  if (!zeiten) return "schnell"; // ohne Zeiten (z. B. Beispieldaten) bleibt es beim bisherigen Verhalten
  if (zeiten.abschwung > LANGER_ABSCHWUNG_S) return "zoegerlich";
  return zeiten.rueckschwung < HASTIG_RUECKSCHWUNG_S ? "schnell" : "zoegerlich";
}

// ---------------------------------------------------------------
// Welche Spielart des Fehlers liegt vor? (z. B. zu aufrecht ODER zu weit vorgebeugt)
// Wird aus Messwert und Bewertung abgeleitet – so klappt es auch mit Schwüngen,
// die vor dieser Version gespeichert wurden.
// ---------------------------------------------------------------
export function variante(k) {
  const w = k.messwert;
  switch (k.id) {
    case "armeAnsprechen": return w > 0 ? "vorn" : "nah";
    case "vorneigungAnsprechen": return w < 25 ? "aufrecht" : "vorgebeugt";
    case "seitneigungAnsprechen": return w < 0 ? "zumZiel" : "zuWeit";
    case "tempo": return w < 2.4 ? tempoKleinesVerhaeltnis(k) : "langsam";
    case "kopfhoehe": return w > 0.08 ? "hoch" : "tief";
    case "kopfSeitlich": return w > 0.08 ? "vorBall" : "schieben";
    default: return "";
  }
}

// ---------------------------------------------------------------
// Die Texte. s = Wörter für links/rechts (Rechtshänder: vorne = links, hinten = rechts),
// z. B. s.h = "rechte", s.hen = "rechten", s.f = "linke". Siehe seiten() in technik.js.
// ---------------------------------------------------------------
const gross = (text) => text[0].toUpperCase() + text.slice(1);

// Übung für beide Tempo-Fehler mit kleinem Verhältnis (Takt nach Tour Tempo, 3 : 1)
const MITZAEHLEN = { name: "Mitzählen", wiederholungen: 10, schritte: [
  "Sprich laut mit: „und – eins – zwei – drei – vier“.",
  "Auf „und“ beginnt der Rückschwung, auf „drei“ bist du oben.",
  "Fließend weiter: Auf „vier“ triffst du den Ball.",
] };

const TIPPS = {
  armeAnsprechen: {
    vorn: () => ({
      kurz: "Du greifst nach dem Ball",
      warum: "Greifst du nach dem Ball, sind die Arme angespannt. Der Schwung wird flach und du kippst leicht nach vorne.",
      gedanke: "Arme hängen lassen",
      wort: "Arme hängen lassen",
      uebung: { name: "Arme baumeln lassen", wiederholungen: 10, schritte: [
        "Ansprechhaltung ohne Schläger.",
        "Arme 3 Sekunden locker hängen lassen.",
        "Hände zusammen, Schläger hineinlegen.",
      ] },
    }),
    nah: (s) => ({
      kurz: "Hände zu nah am Körper",
      warum: "Sind die Hände zu nah am Körper, haben die Arme im Abschwung keinen Platz. Du musst ausweichen oder dich aufrichten.",
      gedanke: "Eine Faust Platz",
      wort: "Etwas mehr Abstand",
      uebung: { name: "Faust-Check", wiederholungen: 5, schritte: [
        "Ansprechhaltung mit einem Eisen.",
        `${gross(s.h)} Hand lösen: als Faust zwischen Griffende und ${s.fen} Oberschenkel halten.`,
        "Passt sie knapp, stimmt der Abstand. Hand zurück an den Griff.",
      ] },
    }),
    gut: "Arme hängen locker unter den Schultern",
  },

  vorneigungAnsprechen: {
    aufrecht: () => ({
      kurz: "Du stehst zu aufrecht",
      warum: "Stehst du aufrecht, dreht sich der Oberkörper eher waagerecht. Der Schwung wird flach, die Treffer oft dünn (der Ball wird zu weit oben getroffen).",
      gedanke: "Aus der Hüfte kippen",
      wort: "Mehr vorneigen",
      uebung: SCHLAEGER_AM_RUECKEN(),
    }),
    vorgebeugt: () => ({
      kurz: "Du beugst dich ziemlich stark vor",
      warum: "Bist du sehr weit vorgebeugt, fällt das Drehen schwerer. Dann kippst du im Schwung leicht nach vorne oder richtest dich auf.",
      gedanke: "Gewicht auf die Fußmitte",
      wort: "Etwas aufrichten",
      uebung: AUFRICHTEN(),
    }),
    gut: "Gute Vorneigung beim Ansprechen",
  },

  fuehrungsarmTreff: {
    "": (s) => ({
      kurz: `${s.Fer} Arm knickt im Treffmoment`,
      warum: "Knickt der Arm im Treffmoment, wird dein Schwungkreis kleiner. Laut TPI kostet das Kraft und bringt mehr Loft und Spin.",
      gedanke: "Weiter Bogen durch den Ball",
      wort: "Weiter Bogen",
      uebung: { name: "Hüfte bis Hüfte", wiederholungen: 20, schritte: [
        "Nur bis Hüfthöhe zurückschwingen.",
        "Bis Hüfthöhe durchschwingen.",
        "Nach dem Ball sind beide Arme lang.",
      ] },
    }),
    gut: (s) => `${s.Fer} Arm ist im Treffmoment lang`,
  },

  schulterdrehung: {
    "": (s) => ({
      kurz: "Schultern drehen nicht voll",
      warum: "Ohne volle Drehung müssen die Arme die Arbeit machen. Das kostet Weite und führt oft zu einem Abschwung von außen – dem Slice.",
      gedanke: "Rücken zum Ziel",
      wort: "Mehr Schulterdrehung",
      uebung: { name: "Schläger vor der Brust", wiederholungen: 10, schritte: [
        "Schläger quer vor die Brust, Ansprechhaltung.",
        `Drehen, bis das ${s.f} Schlägerende ungefähr auf den Ball zeigt.`,
        `Durchdrehen, bis das ${s.h} Ende zum Ball zeigt.`,
        "Danach halbe Schwünge mit diesem Gefühl.",
      ] },
    }),
    gut: "Volle Schulterdrehung am Top",
  },

  armschwungTop: {
    "": () => ({
      kurz: "Arme heben statt drehen",
      warum: "Heben die Arme den Schläger, statt dass der Oberkörper dreht, kommt er steil von oben zurück. Der Treffpunkt wechselt von Schlag zu Schlag.",
      gedanke: "Drehen statt heben",
      wort: "Drehen statt heben",
      uebung: { name: "Griffende zum Bauchnabel", wiederholungen: 10, schritte: [
        "Tief am Schaft greifen, Griffende an den Bauchnabel.",
        "Nur mit der Brust bis Hüfthöhe zurückschwingen.",
        "Das Griffende bleibt am Bauchnabel.",
      ] },
    }),
    gut: "Arme und Oberkörper arbeiten zusammen",
  },

  seitneigungAnsprechen: {
    zumZiel: (s) => ({
      kurz: "Oberkörper neigt zum Ziel",
      warum: `Deine ${s.h} Hand greift tiefer, also gehört auch die ${s.h} Schulter tiefer. Sonst stehst du schon „vor dem Ball“ – das begünstigt Slices.`,
      gedanke: `${gross(s.h)} Schulter etwas tiefer`,
      wort: `${gross(s.h)} Schulter tiefer`,
      uebung: { name: "Hand hängen lassen", wiederholungen: 10, schritte: [
        "Ansprechhaltung einnehmen.",
        `${gross(s.h)} Hand vom Griff nehmen, locker hängen lassen.`,
        "So zurück an den Griff – die Neigung passt.",
      ] },
    }),
    zuWeit: () => ({
      kurz: "Zu stark vom Ziel weg geneigt",
      warum: "Zu viel Neigung verlagert den tiefsten Punkt des Schwungs nach hinten. Dann triffst du oft zuerst den Boden, dann den Ball.",
      gedanke: "Nur leicht neigen",
      wort: "Weniger neigen",
      uebung: null,
    }),
    gut: "Gute Ausgangsposition hinter dem Ball",
  },

  oberkoerperTop: {
    "": () => ({
      kurz: "Oberkörper kippt am Top zum Ziel",
      warum: "Kippt der Oberkörper zum Ziel, bleibt dein Gewicht vorne und du fällst im Abschwung nach hinten. Das kostet Kraft.",
      gedanke: "Brustbein bleibt hinter dem Ball",
      wort: "Brustbein hinter Ball",
      uebung: { name: "Spiegel-Check", wiederholungen: 10, schritte: [
        "Frontal vor einen Spiegel stellen.",
        "Langsam bis zum Top zurückschwingen, anhalten.",
        "Wirbelsäule senkrecht oder leicht vom Ziel weg.",
      ] },
    }),
    gut: "Oberkörper bleibt am Top hinter dem Ball",
  },

  oberkoerperTreff: {
    "": (s) => ({
      kurz: "Oberkörper im Treffmoment zu gerade",
      warum: `Gute Spieler neigen den Oberkörper im Treffmoment leicht vom Ziel weg, die ${s.h} Schulter ist tiefer. Das hängt mit mehr Schlägertempo zusammen.`,
      gedanke: `${gross(s.h)} Schulter geht nach unten`,
      wort: `${gross(s.h)} Schulter runter`,
      uebung: { name: "Treffposition in Zeitlupe", wiederholungen: 10, schritte: [
        "Langsam vom Top in die Treffposition.",
        "Anhalten und im Spiegel prüfen.",
        `Kopf hinter dem Ball, ${s.h} Schulter tiefer.`,
        "Danach dasselbe mit Ball.",
      ] },
    }),
    gut: "Oberkörper im Treffmoment vom Ziel weg",
  },

  hueftSway: {
    "": (s) => ({
      kurz: "Hüfte schiebt zur Seite",
      warum: "Schiebst du die Hüfte im Rückschwung zur Seite, musst du sie im Abschwung genau zurückbringen. Das gelingt selten gleich – dein Treffpunkt wandert.",
      gedanke: "Drehen statt schieben",
      wort: "Drehen statt schieben",
      uebung: { name: "Stab-Übung", wiederholungen: 10, schritte: [
        `Stab senkrecht direkt außen neben den ${s.hen} Fuß stecken.`,
        "Langsam zurückschwingen – zwischen Hüfte und Stab bleibt Luft.",
        "Danach halbe Schwünge.",
      ] },
    }),
    gut: "Hüfte dreht auf der Stelle",
  },

  tempo: {
    schnell: () => ({
      kurz: "Rückschwung zu hastig",
      warum: "Ein hastiger Rückschwung bringt Arme und Körper aus dem Takt. Gute Spieler brauchen zurück etwa dreimal so lange wie nach vorne.",
      gedanke: "Drei zurück, eins runter",
      wort: "Langsamer zurückschwingen",
      uebung: MITZAEHLEN,
    }),
    zoegerlich: () => ({
      kurz: "Abschwung dauert zu lange",
      warum: "Dein Abschwung dauert im Vergleich zum Rückschwung lange. Gute Spieler brauchen für den Abschwung etwa ein Drittel der Rückschwung-Zeit.",
      gedanke: "Ruhig zurück, frei durch",
      wort: "Frei durchschwingen",
      uebung: MITZAEHLEN,
    }),
    langsam: () => ({
      kurz: "Rückschwung sehr lang",
      warum: "Dein Rückschwung dauert mehr als viermal so lange wie dein Abschwung. Als Richtwert gilt etwa dreimal so lange.",
      gedanke: "Lang zurück, kurz durch",
      wort: "Flüssig schwingen",
      uebung: { name: "Langer Bogen", wiederholungen: 10, schritte: [
        "Flüssig und gleichmäßig zurückschwingen bis oben.",
        "Im selben Takt weiter bis zum Ball: „eins – zwei – drei – vier“.",
      ] },
    }),
    gut: "Rhythmus wie gute Spieler (3\u00a0:\u00a01)", // \u00a0 = Leerzeichen ohne Zeilenumbruch
  },

  kopfhoehe: {
    hoch: (s) => ({
      kurz: "Du richtest dich auf",
      warum: "Richtest du dich auf, ändert sich der Abstand zum Ball. Der Schläger kommt zu hoch an – getoppte oder dünne Schläge.",
      gedanke: "Größe halten",
      wort: "Größe halten",
      uebung: { name: "Später hochschauen", wiederholungen: 10, schritte: [
        "Halbe Schwünge.",
        `${gross(s.hes)} Knie bleibt bis nach dem Treffen gebeugt.`,
        "Erst nach dem Treffen hochschauen.",
      ] },
    }),
    tief: () => ({
      kurz: "Du sackst ab",
      warum: "Sackst du ab, kommt der Schläger zu tief. Er trifft zuerst den Boden, dann den Ball – ein fetter Schlag.",
      gedanke: "Größe halten",
      wort: "Größe halten",
      uebung: { name: "Höhe halten", wiederholungen: 10, schritte: [
        "Ansprechhaltung, Knie leicht gebeugt.",
        "Halbe Schwünge, die Körpergröße bleibt gleich.",
      ] },
    }),
    gut: "Kopfhöhe bleibt stabil",
  },

  kopfSeitlich: {
    vorBall: () => ({
      kurz: "Kopf wandert vor den Ball",
      warum: "Wandert der Kopf vor den Ball, kommt der Schläger steil von oben. Gute Spieler halten den Kopf im Treffmoment hinter dem Ball.",
      gedanke: "Kopf hinter dem Ball",
      wort: "Kopf hinter Ball",
      uebung: { name: "Tee-Blick", wiederholungen: 10, schritte: [
        "Tee ein paar Zentimeter hinter den Ball stecken.",
        "Beim Schwung auf das Tee schauen.",
        "Der Kopf bleibt, bis der Ball weg ist.",
      ] },
    }),
    schieben: () => ({
      kurz: "Kopf schiebt zur Seite",
      warum: "Schiebst du Kopf und Oberkörper zur Seite, musst du im Abschwung genau zurück. Drehen ist leichter zu wiederholen als schieben.",
      gedanke: "Drehen wie im Fass",
      wort: "Kopf ruhig halten",
      uebung: { name: "Enges Fass", wiederholungen: 10, schritte: [
        "Stell dir ein enges Fass um dich vor.",
        "Zurückschwingen, der Körper bleibt im Fass.",
      ] },
    }),
    gut: "Kopf bleibt hinter dem Ball",
  },

  gewicht: {
    "": (s) => ({
      kurz: "Hüfte bleibt im Finish hinten",
      warum: `Im Finish (der Endposition nach dem Schlag) stehen gute Spieler ruhig auf dem ${s.fen} Fuß, die Hüfte darüber. Bei dir bleibt die Hüfte weiter hinten.`,
      gedanke: "Finish halten",
      wort: "Balance im Finish",
      uebung: { name: "Finish 3 Sekunden", wiederholungen: 10, schritte: [
        "Nach dem Schlag im Finish stehen bleiben.",
        `Hüfte über dem ${s.fen} Fuß, ${s.her} Fuß nur auf der Spitze.`,
        "Gürtelschnalle zum Ziel – 3 Sekunden halten.",
      ] },
    }),
    gut: "Hüfte im Finish über dem vorderen Fuß",
  },

  vorneigungHalten: {
    "": (s) => ({
      kurz: "Oberkörper richtet sich auf",
      warum: "Richtest du dich im Abschwung auf, ändert sich der Abstand zum Ball. Mögliche Folgen sind Toppen, Shanks, Push oder Block.",
      gedanke: "Po bleibt hinten",
      wort: "Po hinten lassen",
      uebung: { name: "Po an die Wand", wiederholungen: 10, schritte: [
        "Ohne Schläger: Po berührt leicht die Wand, Arme vor der Brust kreuzen.",
        `Zurückschwingen: die ${s.h} Po-Seite bleibt an der Wand.`,
        `Durchdrehen: die ${s.f} Po-Seite kommt an die Wand.`,
        "Der Po bleibt dabei in Kontakt mit der Wand.",
      ] },
    }),
    gut: "Vorneigung bleibt bis zum Treffmoment",
  },

  hueftBall: {
    "": (s) => ({
      kurz: "Hüfte schiebt zum Ball",
      warum: "Schiebt die Hüfte zum Ball, nimmt sie den Armen den Platz. Du musst ausweichen – der Schläger kommt unsauber an den Ball.",
      gedanke: "Po zur Tasche",
      wort: "Po zur Tasche",
      uebung: { name: "Golftasche hinter dem Po", wiederholungen: 10, schritte: [
        "Golftasche direkt hinter den Po stellen.",
        `Rückschwung: die ${s.h} Po-Seite berührt die Tasche.`,
        `Abschwung: die ${s.f} Po-Seite berührt die Tasche.`,
        "Langsame halbe Schwünge, der Schläger schwingt frei an der Tasche vorbei.",
      ] },
    }),
    gut: "Hüfte bleibt auf Abstand zum Ball",
  },
};

// Übungen für "zu aufrecht" und "zu weit vorgebeugt" (entgegengesetzte Richtungen, deshalb zwei Übungen).
// Als Funktionen, weil sie oben schon gebraucht werden, bevor diese Zeilen gelesen sind.
function SCHLAEGER_AM_RUECKEN() {
  return { name: "Schläger am Rücken", wiederholungen: 5, schritte: [
    "Schläger mit einer Hand längs an den Rücken: Kopf, Schulterblätter, Steißbein.",
    "Aus der Hüfte kippen: Der Po geht nach hinten.",
    "Der Schläger bleibt an allen drei Punkten.",
  ] };
}
function AUFRICHTEN() {
  return { name: "Aufrichten", wiederholungen: 5, schritte: [
    "Stell dich ohne Schläger in die Ansprechhaltung.",
    "Richte den Oberkörper ein Stück auf, bis die Arme locker hängen.",
    "Gewicht auf der Fußmitte spüren, dann den Schläger greifen.",
  ] };
}

// Alle Kennungen, zu denen es Tipps gibt (für die Tests)
export const TIPP_IDS = Object.keys(TIPPS);
export const VARIANTEN = Object.fromEntries(
  Object.entries(TIPPS).map(([id, t]) => [id, Object.keys(t).filter((v) => v !== "gut")]),
);

// Alle Tipps als Liste (jede Kennzahl, jede Spielart) – z. B. für den Systemtext des Coachs
export function alleTipps(rechtshaender = true) {
  const s = seiten(rechtshaender);
  return TIPP_IDS.flatMap((id) => VARIANTEN[id].map((v) => ({ id, variante: v, ...TIPPS[id][v](s) })));
}

export function tipp(k, rechtshaender = true) {
  const eintrag = TIPPS[k.id];
  if (!eintrag) return null;
  const text = eintrag[variante(k)] || eintrag[""];
  return text ? text(seiten(rechtshaender)) : null;
}

export function gutText(k, rechtshaender = true) {
  const text = TIPPS[k.id]?.gut;
  if (!text) return k.name;
  return typeof text === "function" ? text(seiten(rechtshaender)) : text;
}

// ---------------------------------------------------------------
// Skala: Balken mit Zielbereich. Die Grenzen sind dieselben wie in
// technik.js / kennzahlen.js (tests/tipps.test.mjs prüft, dass sie zusammenpassen).
//   von/bis   – Anfang und Ende des Balkens (in Anzeige-Einheiten)
//   gut       – grüner Bereich, achtung – gelbe Bereiche
//   faktor    – Messwert × faktor = Anzeige (100 bei Prozent)
//
// Herkunft der Grenzen: Wo es keine Studie gibt, ist die Grenze eine EIGENE FESTLEGUNG
// (Bericht S9–S12, 15.10.). Das sind `vorneigungHalten`, `hueftBall`, `fuehrungsarmTreff`,
// `armeAnsprechen`, `armschwungTop` und `seitneigungAnsprechen`. Die Tabelle mit Quelle und
// Stufe steht in docs/plan-tipps-neu.md ("Herkunft der Grenzwerte"). Gelb heißt: knapp daneben,
// denn der Messfehler von 2D-Video liegt bei Winkeln in derselben Größe wie viele Grenzen.
// ---------------------------------------------------------------
const SKALEN = {
  armeAnsprechen: { von: -60, bis: 50, gut: [-25, 15], achtung: [[15, 30], [-40, -25]], faktor: 100, einheit: " %", name: "Hände vor der Schulter" },
  vorneigungAnsprechen: { von: 10, bis: 60, gut: [25, 45], achtung: [[18, 25], [45, 52]], einheit: "°", name: "Vorneigung" },
  fuehrungsarmTreff: { von: 120, bis: 180, gut: [155, 180], achtung: [[140, 155]], einheit: "°", name: "Armwinkel" },
  schulterdrehung: { von: 40, bis: 110, gut: [80, 180], achtung: [[65, 80]], einheit: "°", name: "Schulterdrehung" },
  seitneigungAnsprechen: { von: -15, bis: 35, gut: [0, 15], achtung: [[-6, 0], [15, 25]], einheit: "°", name: "Neigung vom Ziel weg" },
  oberkoerperTop: { von: -20, bis: 30, gut: [-3, 90], achtung: [[-10, -3]], einheit: "°", name: "Neigung vom Ziel weg" },
  oberkoerperTreff: { von: -10, bis: 30, gut: [8, 90], achtung: [[2, 8]], einheit: "°", name: "Neigung vom Ziel weg" },
  hueftSway: { von: 0, bis: 40, gut: [-100, 10], achtung: [[10, 20]], faktor: 100, einheit: " %", name: "Verschiebung" },
  tempo: { von: 1.5, bis: 5.5, gut: [2.4, 4.0], achtung: [[2.0, 2.4], [4.0, 4.6]], einheit: " : 1", name: "Rückschwung : Abschwung" },
  kopfhoehe: { von: -60, bis: 30, gut: [-40, 8], achtung: [[8, 15], [-100, -40]], faktor: 100, einheit: " %", name: "Kopfhöhe" },
  kopfSeitlich: { von: -40, bis: 30, gut: [-100, 8], achtung: [[8, 15]], faktor: 100, einheit: " %", name: "Kopf Richtung Ziel" },
  gewicht: { von: 0, bis: 120, gut: [85, 200], achtung: [[65, 85]], faktor: 100, einheit: " %", name: "Hüfte über vorderem Fuß" },
  vorneigungHalten: { von: -10, bis: 30, gut: [-100, 10], achtung: [[10, 15]], einheit: "°", name: "Aufgerichtet" },
  hueftBall: { von: -10, bis: 40, gut: [-100, 12], achtung: [[12, 22]], faktor: 100, einheit: " %", name: "Hüfte zum Ball" },
};
export const SKALA_IDS = Object.keys(SKALEN);

// Breite und Einheit des Balkens einer Kennzahl (für die Gleichmäßigkeit in streuung.js).
// breite und Einheit gelten in Anzeige-Einheiten; faktor rechnet den Messwert dorthin um.
export function skalenInfo(id) {
  const s = SKALEN[id];
  return s ? { breite: s.bis - s.von, faktor: s.faktor || 1, einheit: s.einheit } : null;
}

// Liefert { von, bis, gut, achtung, wert } in Anzeige-Einheiten plus ein Ziel-Text,
// oder null, wenn es für diese Kennzahl keinen sinnvollen Balken gibt.
export function skala(k) {
  const s = SKALEN[k.id];
  if (!s || k.bewertung === "unsicher") return null;
  // Schulterdrehung unter ca. 50° lässt sich nicht genauer schätzen (messwert null):
  // dann steht die Marke ganz links im roten Bereich.
  const messwert = k.id === "schulterdrehung" && k.messwert === null ? 45 : k.messwert;
  if (typeof messwert !== "number") return null;
  // Kopf schiebt im Rückschwung: bewertet wird dort eine andere Messung als der Messwert
  if (k.id === "kopfSeitlich" && k.bewertung !== "gut" && variante(k) === "schieben") return null;
  const faktor = s.faktor || 1;
  const wert = messwert * faktor;
  const [a, b] = s.gut;
  const zahl = (x) => String(Math.round(x * 10) / 10).replace(".", ",");
  let ziel;
  if (a <= s.von) ziel = `Ziel: bis ${zahl(b)}${s.einheit}`;
  else if (b >= s.bis) ziel = `Ziel: ab ${zahl(a)}${s.einheit}`;
  else ziel = `Ziel: ${zahl(a)} bis ${zahl(b)}${s.einheit}`;
  return { name: s.name, von: s.von, bis: s.bis, gut: s.gut, achtung: s.achtung, wert, ziel };
}

// Position (0–100 %) eines Werts auf dem Balken – außerhalb wird an den Rand gesetzt
export function skalaPosition(s, wert) {
  const x = Math.min(Math.max(wert, s.von), s.bis);
  return ((x - s.von) / (s.bis - s.von)) * 100;
}
