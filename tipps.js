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
    case "tempo": return w < 2.4 ? "schnell" : "langsam";
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

const TIPPS = {
  armeAnsprechen: {
    vorn: () => ({
      kurz: "Du greifst nach dem Ball",
      warum: "Greifst du nach dem Ball, sind die Arme angespannt. Der Schwung wird flach und du kippst leicht nach vorne.",
      gedanke: "Arme hängen lassen",
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
      uebung: { name: "Faust-Check", wiederholungen: 5, schritte: [
        "Ansprechhaltung mit Schläger.",
        `${gross(s.h)} Hand als Faust zwischen Griffende und ${s.fen} Oberschenkel.`,
        "Passt die Faust knapp hinein, stimmt der Abstand.",
      ] },
    }),
    gut: "Arme hängen locker unter den Schultern",
  },

  vorneigungAnsprechen: {
    aufrecht: () => ({
      kurz: "Du stehst zu aufrecht",
      warum: "Stehst du aufrecht, dreht sich der Oberkörper eher waagerecht. Der Schwung wird flach, die Treffer oft dünn.",
      gedanke: "Aus der Hüfte kippen",
      uebung: SCHLAEGER_AM_RUECKEN(),
    }),
    vorgebeugt: () => ({
      kurz: "Du beugst dich zu weit vor",
      warum: "Weit vorgebeugt fehlen dir Gleichgewicht und Drehfreiheit. Oft kippst du im Schwung nach vorne oder richtest dich auf.",
      gedanke: "Gewicht auf die Fußmitte",
      uebung: SCHLAEGER_AM_RUECKEN(),
    }),
    gut: "Gute Vorneigung beim Ansprechen",
  },

  fuehrungsarmTreff: {
    "": (s) => ({
      kurz: `${s.Fer} Arm knickt im Treffmoment`,
      warum: "Knickt der Arm, wird dein Schwungkreis kleiner und der Schläger kommt zu hoch an den Ball. Die Folge: dünne oder getoppte Bälle und weniger Weite.",
      gedanke: "Lange Arme durch den Ball",
      uebung: { name: "Hüfte bis Hüfte", wiederholungen: 20, schritte: [
        "Nur bis Hüfthöhe ausholen.",
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
      uebung: { name: "Griffende zum Bauchnabel", wiederholungen: 10, schritte: [
        "Tief am Schaft greifen, Griffende an den Bauchnabel.",
        "Nur mit der Brust bis Hüfthöhe ausholen.",
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
      uebung: null,
    }),
    gut: "Gute Ausgangsposition hinter dem Ball",
  },

  oberkoerperTop: {
    "": () => ({
      kurz: "Oberkörper kippt am Top zum Ziel",
      warum: "Kippt der Oberkörper zum Ziel, bleibt dein Gewicht vorne und du fällst im Abschwung nach hinten. Das kostet Kraft und belastet den unteren Rücken.",
      gedanke: "Brustbein bleibt hinter dem Ball",
      uebung: { name: "Spiegel-Check", wiederholungen: 10, schritte: [
        "Frontal vor einen Spiegel stellen.",
        "Langsam zum Top ausholen, anhalten.",
        "Wirbelsäule senkrecht oder leicht vom Ziel weg.",
      ] },
    }),
    gut: "Oberkörper bleibt am Top hinter dem Ball",
  },

  oberkoerperTreff: {
    "": (s) => ({
      kurz: "Oberkörper im Treffmoment zu gerade",
      warum: `Nur wenn die ${s.h} Schulter tiefer ist, kommt der Schläger flach von innen an den Ball. Stehst du gerade, kommt er steil von oben – typisch sind Slice und tiefe Divots.`,
      gedanke: `${gross(s.h)} Schulter geht nach unten`,
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
      warum: "Schiebst du die Hüfte beim Ausholen zur Seite, musst du sie im Abschwung genau zurückbringen. Das gelingt selten gleich – dein Treffpunkt wandert.",
      gedanke: "Drehen statt schieben",
      uebung: { name: "Stab-Übung", wiederholungen: 10, schritte: [
        `Stab senkrecht direkt außen neben den ${s.hen} Fuß stecken.`,
        "Langsam ausholen – die Hüfte berührt ihn nicht.",
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
      uebung: { name: "Mitzählen", wiederholungen: 10, schritte: [
        "Starte den Rückschwung auf „und“.",
        "„Eins – zwei – drei“: auf „drei“ bist du oben.",
        "Ohne Pause: auf „vier“ ist der Ball getroffen.",
      ] },
    }),
    langsam: () => ({
      kurz: "Rückschwung zu zäh",
      warum: "Ist der Rückschwung sehr zäh, fehlt der Schwung für den Rückweg. Der Abschwung wird dann hektisch oder zögerlich.",
      gedanke: "Schwingen wie ein Pendel",
      uebung: { name: "Pendel", wiederholungen: 10, schritte: [
        "Flüssig zurückschwingen, oben keine Pause.",
        "Im gleichen Rhythmus durchschwingen.",
      ] },
    }),
    gut: "Rhythmus wie gute Spieler (3\u00a0:\u00a01)", // \u00a0 = Leerzeichen ohne Zeilenumbruch
  },

  kopfhoehe: {
    hoch: (s) => ({
      kurz: "Du richtest dich auf",
      warum: "Richtest du dich auf, ändert sich der Abstand zum Ball. Der Schläger kommt zu hoch an – getoppte oder dünne Schläge.",
      gedanke: `${gross(s.hes)} Knie bleibt gebeugt`,
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
      uebung: { name: "Enges Fass", wiederholungen: 10, schritte: [
        "Stell dir ein enges Fass um dich vor.",
        "Ausholen, ohne die Fasswand zu berühren.",
      ] },
    }),
    gut: "Kopf bleibt hinter dem Ball",
  },

  gewicht: {
    "": (s) => ({
      kurz: "Gewicht bleibt hinten",
      warum: "Bleibt das Gewicht hinten, fehlt Kraft im Treffmoment. Der Ball fliegt oft zu hoch oder zur Seite weg.",
      gedanke: "Finish halten",
      uebung: { name: "Finish 3 Sekunden", wiederholungen: 10, schritte: [
        "Nach dem Schlag im Finish stehen bleiben.",
        `Gewicht ${s.f === "linke" ? "links" : "rechts"}, ${s.her} Fuß nur auf der Spitze.`,
        "Gürtelschnalle zum Ziel – 3 Sekunden halten.",
      ] },
    }),
    gut: "Gewicht im Finish vorn",
  },

  vorneigungHalten: {
    "": (s) => ({
      kurz: "Oberkörper richtet sich auf",
      warum: "Richtest du dich im Abschwung auf, ändert sich der Abstand zum Ball. Typische Folgen sind Toppen oder Shanks.",
      gedanke: "Po bleibt hinten",
      uebung: { name: "Po an die Wand", wiederholungen: 10, schritte: [
        "Ohne Schläger: Po berührt leicht die Wand, Arme vor der Brust kreuzen.",
        `Ausholen: die ${s.h} Po-Seite bleibt an der Wand.`,
        `Durchdrehen: die ${s.f} Po-Seite kommt an die Wand.`,
        "Nie ganz von der Wand lösen.",
      ] },
    }),
    gut: "Vorneigung bleibt bis zum Treffmoment",
  },

  hueftBall: {
    "": (s) => ({
      kurz: "Hüfte schiebt zum Ball",
      warum: "Schiebt die Hüfte zum Ball, nimmt sie den Armen den Platz. Du musst ausweichen – der Schläger kommt unsauber an den Ball.",
      gedanke: "Po zur Tasche",
      uebung: { name: "Golftasche hinter dem Po", wiederholungen: 10, schritte: [
        "Golftasche direkt hinter den Po stellen.",
        `Rückschwung: die ${s.h} Po-Seite berührt die Tasche.`,
        `Abschwung: die ${s.f} Po-Seite berührt die Tasche.`,
        "Langsame halbe Schwünge, der Schläger trifft die Tasche nicht.",
      ] },
    }),
    gut: "Hüfte bleibt auf Abstand zum Ball",
  },
};

// Gleiche Übung für "zu aufrecht" und "zu weit vorgebeugt" – als Funktion,
// weil sie oben schon gebraucht wird, bevor diese Zeile gelesen ist.
function SCHLAEGER_AM_RUECKEN() {
  return { name: "Schläger am Rücken", wiederholungen: 5, schritte: [
    "Schläger längs an den Rücken: Kopf, Schulterblätter, Steißbein.",
    "Aus der Hüfte kippen, bis du auf den Ball schaust.",
    "Der Schläger bleibt an allen drei Punkten.",
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
// ---------------------------------------------------------------
const SKALEN = {
  armeAnsprechen: { von: -60, bis: 50, gut: [-25, 15], achtung: [[15, 30], [-40, -25]], faktor: 100, einheit: " %", name: "Hände vor der Schulter" },
  vorneigungAnsprechen: { von: 10, bis: 60, gut: [25, 45], achtung: [[18, 25], [45, 52]], einheit: "°", name: "Vorneigung" },
  fuehrungsarmTreff: { von: 120, bis: 180, gut: [155, 180], achtung: [[140, 155]], einheit: "°", name: "Armwinkel" },
  schulterdrehung: { von: 40, bis: 110, gut: [80, 180], achtung: [[65, 80]], einheit: "°", name: "Schulterdrehung" },
  seitneigungAnsprechen: { von: -15, bis: 35, gut: [0, 20], achtung: [[-6, 0], [20, 30]], einheit: "°", name: "Neigung vom Ziel weg" },
  oberkoerperTop: { von: -20, bis: 30, gut: [-3, 90], achtung: [[-10, -3]], einheit: "°", name: "Neigung vom Ziel weg" },
  oberkoerperTreff: { von: -10, bis: 30, gut: [8, 90], achtung: [[2, 8]], einheit: "°", name: "Neigung vom Ziel weg" },
  hueftSway: { von: 0, bis: 40, gut: [-100, 15], achtung: [[15, 25]], faktor: 100, einheit: " %", name: "Verschiebung" },
  tempo: { von: 1.5, bis: 5.5, gut: [2.4, 4.0], achtung: [[2.0, 2.4], [4.0, 4.6]], einheit: " : 1", name: "Rückschwung : Abschwung" },
  kopfhoehe: { von: -60, bis: 30, gut: [-40, 8], achtung: [[8, 15], [-100, -40]], faktor: 100, einheit: " %", name: "Kopfhöhe" },
  kopfSeitlich: { von: -40, bis: 30, gut: [-100, 8], achtung: [[8, 15]], faktor: 100, einheit: " %", name: "Kopf Richtung Ziel" },
  gewicht: { von: 0, bis: 120, gut: [85, 200], achtung: [[65, 85]], faktor: 100, einheit: " %", name: "Gewicht vorne" },
  vorneigungHalten: { von: -10, bis: 30, gut: [-100, 10], achtung: [[10, 15]], einheit: "°", name: "Aufgerichtet" },
  hueftBall: { von: -10, bis: 40, gut: [-100, 12], achtung: [[12, 22]], faktor: 100, einheit: " %", name: "Hüfte zum Ball" },
};
export const SKALA_IDS = Object.keys(SKALEN);

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
