// ===============================================================
// Wissen: Lernpfade aus kurzen Lektionen (Plan: docs/plan-wissensseite.md)
//
// Reine Daten und kleine Hilfsfunktionen ohne Browser-Code, damit alles mit
// node --test prüfbar ist (tests/wissen.test.mjs). app.js zeigt die Lektionen
// als Wisch-Karten: Bildkarte → Inhaltskarten → Quiz → Abschluss.
//
// Strenge Regeln, weil es keine Golflehrer-Durchsicht gibt:
//   - Nur Belegtes: Messdaten, Studie, offizielle Regel oder mindestens zwei
//     unabhängige Quellen, die dasselbe sagen (Feld "beleg").
//   - Jede Lektion nennt ihre Quellen. Kennung = "datei:KÜRZEL", z. B.
//     "grundlagen:HM1" steht in docs/wissen/grundlagen.md mit Link. Die Kürzel
//     sind nur innerhalb einer Datei eindeutig (HM1 ist dort je ein anderer
//     Artikel) – deshalb gehört der Dateiname dazu.
//   - In der App stehen Quellen nur als Text, nie als Link.
//   - Längen (prüft der Test): Kernsatz ≤ 15 Wörter, Karte ≤ 35 Wörter,
//     Quiz genau 3 Antworten, Erklärung ≤ 25 Wörter.
//   - Seitenangaben (links/rechts) gelten für Rechtshänder – steht auf der Übersicht.
// ===============================================================

import { tipp } from "./tipps.js";

// Wie ist eine Lektion belegt? (Plan, Abschnitt „Fachliche Absicherung“)
export const BELEGE = {
  messung: "Messdaten",
  studie: "Studie",
  regel: "Offizielle Golfregeln",
  "zwei-quellen": "Mindestens zwei unabhängige Quellen",
};

// ---------------------------------------------------------------
// Quellen: Kennung → Name (nur Text, ohne Link). Die Links stehen in docs/wissen/.
// ---------------------------------------------------------------
export const QUELLEN = {
  "erste-schritte:DMP1": "Deutschland macht Platzreife: Golf-Kosten",
  "erste-schritte:GM1": "golf-mag.de: Golf lernen als Anfänger – Leitfaden 2026",
  "erste-schritte:BGL1": "BookGolfLessons: Golf lessons for beginners",
  "erste-schritte:PELZ1": "GolfWRX: Dave Pelz – Forschung zum kurzen Spiel",
  "erste-schritte:TM1": "TrackMan: Leistung des durchschnittlichen Amateurs",
  "erste-schritte:TMM1": "Tell Me More Golf: What is a half set",
  "erste-schritte:LYNX1": "Lynx Golf: Beginner golf clubs",
  "erste-schritte:VES2": "Vessel: Understanding golf club loft",
  "erste-schritte:MIT1": "Mitchell Golf: Golf club loft chart",
  "erste-schritte:ARC2": "Arccos: Long irons vs. hybrids (Messdaten)",
  "erste-schritte:PIG2": "Plugged In Golf: Are hybrids better than irons? (Test)",
  "kurzes-spiel:PG1": "Practical Golf: Pros vs. Joes",
  "kurzes-spiel:LR1": "The Left Rough: Chipping vs. pitching",
  "kurzes-spiel:FOY1": "Foy Golf Academy: When to putt, chip or pitch",
  "kurzes-spiel:SIE1": "GOLF.com: James Sieckmann – 5 short-game fundamentals",
  "kurzes-spiel:AGD1": "Australian Golf Digest: The new short-game fundamentals (Sieckmann)",
  "kurzes-spiel:PELZ1": "GOLF.com: 10 short-game tips from Dave Pelz",
  "kurzes-spiel:GTS1": "GOLFTEC: Get up and down more with this drill",
  "kurzes-spiel:BB1": "Bruce Bolt: Golf chipping drills for beginners",
  "ballflug-und-fehler:TM4": "TrackMan: Dynamic Loft",
  "ballflug-und-fehler:HM3": "HackMotion: 6 golf shank drills",
  "grundlagen:HM1": "HackMotion: Golf Grip 101",
  "grundlagen:HM2": "HackMotion: Overlap vs. Interlock",
  "grundlagen:MGS1": "MyGolfSpy: Golf Grip Explained",
  "grundlagen:MGS2": "MyGolfSpy: How to aim in golf",
  "grundlagen:WG1": "Women's Golf: Railroad Tracks",
  "grundlagen:PGN1": "Pro Golf Now: Intermediate targets",
  "grundlagen:GT1": "GOLFTEC: Slice-Ursachen aus 14 Mio. Schwüngen",
  "grundlagen:VES1": "Vessel: Proper golf stance",
  "grundlagen:PP1": "Perfect Practice: Perfect golf posture",
  "grundlagen:DRV1": "DRVN Golf: Golf posture – setup fundamentals",
  "grundlagen:GDC1": "GolfDecode: Complete guide to golf posture",
  "putten:PELZ1": "GOLF.com: 10 short-game tips from Dave Pelz",
  "putten:GOLF1": "GOLF.com: Optimale Schwunglänge beim Putten (SAM PuttLab)",
  "putten:GOLF3": "GOLF.com: How often do Tour pros miss short putts",
  "putten:GM1": "Golf Monthly: What percentage of 10ft putts do pros make",
  "putten:RS1": "RotarySwing: Pendulum putting stroke",
  "putten:GL1": "GolfLink: How to putt",
  "putten:HM2": "HackMotion: Putting drills for distance control",
  "putten:HM3": "HackMotion: 6 putting drills for speed",
  "regeln-etikette:RA2": "The R&A: Rules of Golf",
  "regeln-etikette:USGA1": "USGA: Rules of Golf",
  "regeln-etikette:SIEK1": "Golfplatz Siek: Die wichtigsten Golfregeln einfach erklärt",
  "regeln-etikette:PAR1": "par71: Golfregeln einfach erklärt",
  "regeln-etikette:ETI1": "Golfclub Siegerland: Etikette, Pitchmarken, Divots",
  "regeln-etikette:ETI2": "golf-mag.de: Golf-Etikette für Anfänger",
  "regeln-etikette:DGV1": "Deutscher Golf Verband: FAQ DGV-Platzreife",
  "regeln-etikette:WIKI1": "Wikipedia: Platzerlaubnis",
};

// ---------------------------------------------------------------
// Lernpfade. level = für wen der Pfad gedacht ist (wie in level.js).
// Weitere Pfade kommen in den nächsten Branches (siehe Plan).
// ---------------------------------------------------------------
export const PFADE = [
  {
    id: "start",
    level: "einsteiger",
    titel: "Start: Vom ersten Schlag zur Platzreife",
    beschreibung: "Schläger, Griff, Haltung, erster Putt und Chip, die wichtigsten Regeln.",
  },
];

// ---------------------------------------------------------------
// Lektionen. Felder:
//   id, pfad, level, titel, kern (Kernsatz auf der Bildkarte), bild (schaubilder.js),
//   karten: [{ text, bild? }] (2–4 Inhaltskarten),
//   quiz: { frage, antworten: [3 Texte], richtig: Index 0–2, erklaerung },
//   uebung (optional): { tipp: {id, messwert} } = vorhandene Übung aus tipps.js (mit Figuren)
//                      oder { name, wiederholungen, schritte } = neue Übung nur als Text,
//   kennzahlen: passende Kennzahl-IDs der App (für die spätere Verknüpfung Karte → Lektion),
//   quellen: Kennungen aus QUELLEN, beleg: Schlüssel aus BELEGE.
// ---------------------------------------------------------------
// IDs nie umbenennen oder wiederverwenden – daran hängt der gespeicherte Fortschritt (Test).
export const LEKTIONEN = [
  {
    id: "start-weg",
    pfad: "start",
    level: "einsteiger",
    titel: "Wie lernt man Golf?",
    kern: "Am Anfang viel kurzes Spiel üben – dort gibt es die schnellsten Erfolge.",
    bild: "weg",
    karten: [
      { text: "Der übliche Weg: Schnupperkurs (2–3 Stunden), dann Platzreifekurs beim Golflehrer mit Prüfung. Danach brauchst du ein Spielrecht, zum Beispiel über eine Clubmitgliedschaft." },
      { text: "Nach Dave Pelz passieren rund 60–65 % aller Schläge innerhalb von ca. 90 m zur Fahne. Für Einsteiger ist das kurze Spiel der schnellste Hebel." },
      { text: "Zwei Einsteiger-Leitfäden raten: zuerst viel Putten und Chippen, dann Schwünge mit dem Eisen. Einer nennt rund 70 % der Übungszeit fürs kurze Spiel." },
      { text: "Realistisch bleiben: Selbst ein männlicher Amateur mit Handicap ca. 15 fliegt den Driver laut TrackMan nur ca. 190 m weit. Die App ersetzt keinen Golflehrer – sie hilft beim Üben dazwischen." },
    ],
    quiz: {
      frage: "Wo passieren laut Dave Pelz rund 60 % aller Schläge?",
      antworten: ["Am Abschlag mit dem Driver", "Innerhalb von ca. 90 m zur Fahne", "Auf dem Fairway mit langen Eisen"],
      richtig: 1,
      erklaerung: "Rund 60–65 % der Schläge fallen nahe am Grün. Für Einsteiger bringt das kurze Spiel die schnellsten Erfolge.",
    },
    kennzahlen: [],
    quellen: ["erste-schritte:DMP1", "erste-schritte:GM1", "erste-schritte:BGL1", "erste-schritte:PELZ1", "kurzes-spiel:PG1", "erste-schritte:TM1"],
    beleg: "zwei-quellen",
  },
  {
    id: "start-schlaeger",
    pfad: "start",
    level: "einsteiger",
    titel: "Die Schläger",
    kern: "Mehr Loft: Der Ball startet höher, dreht mehr und rollt weniger.",
    bild: "loftFaecher",
    karten: [
      { text: "Loft ist der Neigungswinkel der Schlagfläche. Ungefähr: Driver 10°, 7er-Eisen 34°, Sand Wedge 56°, Putter 2–4°. Je nach Hersteller weicht das etwas ab." },
      { text: "Wofür welcher? Driver für den Abschlag auf langen Löchern, Eisen für Schläge aufs Grün, Wedges für kurze, hohe Schläge und den Bunker, Putter auf dem Grün." },
      { text: "Erlaubt sind höchstens 14 Schläger in der Tasche (Regel 4.1). Für den Anfang reicht ein halber Satz mit ca. 7 Schlägern." },
      { text: "Hybrid statt langer Eisen: Er startet höher und verzeiht Fehltreffer eher. Laut Arccos-Daten treffen Spieler bis Handicap 25 damit öfter das Grün." },
    ],
    quiz: {
      frage: "Was bewirkt mehr Loft?",
      antworten: ["Der Ball fliegt flacher und rollt weiter", "Nur der Schaft wird länger", "Der Ball startet höher und rollt weniger"],
      richtig: 2,
      erklaerung: "Mehr Loft bringt höheren Abflug und mehr Rückwärtsdrall. Deshalb fliegt ein Wedge hoch und kurz, ein Driver flach und weit.",
    },
    kennzahlen: [],
    quellen: ["erste-schritte:VES2", "erste-schritte:MIT1", "ballflug-und-fehler:TM4", "regeln-etikette:USGA1", "regeln-etikette:SIEK1", "erste-schritte:TMM1", "erste-schritte:LYNX1", "erste-schritte:ARC2", "erste-schritte:PIG2"],
    beleg: "messung",
  },
  {
    id: "start-griff",
    pfad: "start",
    level: "einsteiger",
    titel: "Der Griff",
    kern: "Neutraler Griff: zwei Knöchel der linken Hand sichtbar, das V zeigt zur rechten Schulter.",
    bild: "griff",
    karten: [
      { text: "Linke Hand: Den Griff schräg durch die Finger legen, vom kleinen Finger bis zum Zeigefinger – nicht in die Handfläche. Der Daumen liegt leicht rechts der Mitte." },
      { text: "Rechte Hand: Griff vor allem in den Fingern. Die Lebenslinie liegt auf dem linken Daumen, das V zwischen Daumen und Zeigefinger zeigt zur rechten Schulter." },
      { text: "Überlappend, verzahnt oder mit zehn Fingern: Keine Variante ist „richtig“. Wichtig ist, dass beide Hände als Einheit arbeiten." },
      { text: "Griffdruck etwa 4–5 von 10: fest genug für Kontrolle, locker genug für lockere Unterarme. Laut HackMotion greifen 57 % der Tourspieler neutral." },
    ],
    quiz: {
      frage: "Wie viele Knöchel der linken Hand siehst du beim neutralen Griff?",
      antworten: ["Zwei", "Keinen", "Vier"],
      richtig: 0,
      erklaerung: "Zwei Knöchel gelten als neutral. Mehr heißt stark (die Fläche schließt leichter), weniger heißt schwach (sie bleibt eher offen).",
    },
    uebung: {
      name: "Griff aufbauen",
      wiederholungen: 10,
      schritte: [
        "Linke Hand: Griff schräg durch die Finger legen.",
        "Von oben schauen: Siehst du zwei Knöchel?",
        "Rechte Hand dazu: Das V zeigt zur rechten Schulter.",
        "Loslassen und neu aufbauen.",
      ],
    },
    kennzahlen: [],
    quellen: ["grundlagen:HM1", "grundlagen:MGS1", "grundlagen:HM2"],
    beleg: "zwei-quellen",
  },
  {
    id: "start-ausrichtung",
    pfad: "start",
    level: "einsteiger",
    titel: "Ausrichtung: die Eisenbahnschienen",
    kern: "Ball und Ziel auf der äußeren Schiene, Füße und Schultern auf der inneren.",
    bild: "schienen",
    karten: [
      { text: "Dein Körper zielt deshalb parallel links vom Ziel, nicht genau aufs Ziel. Füße, Knie, Hüfte und Schultern liegen alle auf der inneren Schiene." },
      { text: "Zwischenziel: Hinter dem Ball einen Punkt 1–2 m vor dem Ball auf der Ziellinie suchen. Erst die Schlagfläche darauf ausrichten, dann den Körper." },
      { text: "Häufiger Fehler laut GOLFTEC: Die Füße stimmen, aber die Schultern zeigen nach links. Das fördert eine Schwungbahn von außen – Slice oder Pull." },
    ],
    quiz: {
      frage: "Wohin zeigen deine Schultern bei guter Ausrichtung?",
      antworten: ["Genau auf das Ziel", "Rechts neben das Ziel", "Parallel links vom Ziel"],
      richtig: 2,
      erklaerung: "Wie bei Eisenbahnschienen: Der Ball läuft auf der äußeren Schiene zum Ziel, der Körper steht parallel auf der inneren.",
    },
    uebung: {
      name: "Zwei Stäbe",
      wiederholungen: 10,
      schritte: [
        "Einen Stab auf die Ziellinie hinter den Ball legen.",
        "Zweiten Stab parallel an die Fußspitzen legen.",
        "Schläger quer vor die Schultern: parallel zu den Stäben?",
        "Schläge machen, die Stäbe bleiben liegen.",
      ],
    },
    kennzahlen: [],
    quellen: ["grundlagen:WG1", "grundlagen:MGS2", "grundlagen:PGN1", "grundlagen:GT1"],
    beleg: "zwei-quellen",
  },
  {
    id: "start-haltung",
    pfad: "start",
    level: "einsteiger",
    titel: "Haltung beim Ansprechen",
    kern: "Aus der Hüfte kippen, Rücken lang, Arme hängen locker unter den Schultern.",
    bild: "ansprechenHinten",
    karten: [
      { text: "Po leicht nach hinten schieben und aus der Hüfte nach vorn kippen, bis der Schläger den Boden erreicht. Der Rücken bleibt dabei lang." },
      { text: "Die Knie nur leicht beugen – die Beugung kommt vor allem aus der Hüfte. So stehst du sportlich und im Gleichgewicht." },
      { text: "Die Arme hängen locker senkrecht unter den Schultern. Zwischen Griffende und linkem Oberschenkel passt etwa eine Faust." },
      { text: "Das Gewicht liegt etwa auf der Fußmitte, eher Richtung Ballen. Die App misst deine Vorneigung und den Armabstand, wenn du von hinten filmst." },
    ],
    quiz: {
      frage: "Woher kommt die Vorneigung beim Ansprechen?",
      antworten: ["Aus der Hüfte, der Rücken bleibt lang", "Aus einem runden Rücken", "Aus stark gebeugten Knien"],
      richtig: 0,
      erklaerung: "Aus der Hüfte kippen hält den Rücken lang und gibt den Armen Platz. Die Knie beugen sich nur leicht.",
    },
    // Vorhandene Übung mit Figuren (tipps.js, Kennzahl "zu aufrecht")
    uebung: { tipp: { id: "vorneigungAnsprechen", messwert: 15 } },
    kennzahlen: ["vorneigungAnsprechen", "armeAnsprechen"],
    quellen: ["grundlagen:VES1", "grundlagen:PP1", "grundlagen:DRV1", "grundlagen:GDC1", "ballflug-und-fehler:HM3"],
    beleg: "zwei-quellen",
  },
  {
    id: "start-putt",
    pfad: "start",
    level: "einsteiger",
    titel: "Erster Putt: Pendel und Länge",
    kern: "Beim Putten entscheidet die Länge mehr als die Linie.",
    bild: "pendel",
    karten: [
      { text: "Die Schultern bewegen den Putter wie ein Pendel, die Handgelenke bleiben ruhig. Der Rhythmus bleibt gleich – längere Putts brauchen einen längeren Rückschwung." },
      { text: "Laut Dave Pelz bestimmt die Schlagfläche rund 83 % der Startrichtung. Eckig treffen ist also wichtiger als eine perfekte Bahn." },
      { text: "Ideal nach Pelz: Ein verfehlter Putt bliebe ca. 40 cm hinter dem Loch liegen. Ein Putt, der zu kurz bleibt, fällt nie." },
      { text: "Erwartungen: Tourspieler lochen aus 3 m nur ca. 40 % der Putts. Ein Putt, der knapp neben dem Loch liegen bleibt, ist ein guter Putt." },
    ],
    quiz: {
      frage: "Wie steuerst du die Länge eines Putts?",
      antworten: ["Mit mehr Kraft aus den Handgelenken", "Mit der Länge des Rückschwungs", "Mit einem schnelleren Rhythmus"],
      richtig: 1,
      erklaerung: "Der Rhythmus bleibt immer gleich. Längere Putts brauchen einen längeren Rückschwung, die Handgelenke bleiben ruhig.",
    },
    uebung: {
      name: "Leiter",
      wiederholungen: 10,
      schritte: [
        "Zielzone abstecken: ca. 3 m entfernt, 1,5 m tief.",
        "Jeder Ball bleibt hinter dem vorigen liegen.",
        "Alle Bälle bleiben in der Zone.",
      ],
    },
    kennzahlen: [],
    quellen: ["putten:PELZ1", "putten:GOLF1", "putten:RS1", "putten:GL1", "putten:GOLF3", "putten:GM1", "putten:HM2", "putten:HM3"],
    beleg: "messung",
  },
  {
    id: "start-chip",
    pfad: "start",
    level: "einsteiger",
    titel: "Erster Chip",
    kern: "So flach wie möglich, so hoch wie nötig: Ein Chip fliegt kurz und rollt lang.",
    bild: "flugRollen",
    karten: [
      { text: "Chip: Der Ball liegt knapp neben dem Grün, bis zur Fahne ist viel Grün. Pitch: viel Flug, wenig Rollen – wenn ein Hindernis dazwischen liegt." },
      { text: "Aufbau: enger Stand, Ball mittig bis leicht rechts, Gewicht deutlich links, Hände leicht vor dem Ball. Den Griff etwas kürzer fassen." },
      { text: "Schultern und Arme schwingen als Einheit, die Handgelenke bleiben ruhig. Laut Dave Pelz ist Handgelenkeinsatz die häufigste Ursache für fette oder dünne Chips." },
      { text: "Gleichmäßiges Tempo durch den Ball. Die Sohle des Schlägers darf über den Boden gleiten – der Schläger läuft frei durch." },
    ],
    quiz: {
      frage: "Wann passt ein Chip?",
      antworten: ["Ball knapp neben dem Grün, viel Grün bis zur Fahne", "Ein Bunker liegt zwischen Ball und Fahne", "Der Ball liegt 150 m vor dem Grün"],
      richtig: 0,
      erklaerung: "Ein Chip fliegt kurz und rollt lang. Liegt ein Hindernis dazwischen, passt ein Pitch mit mehr Flug besser.",
    },
    uebung: {
      name: "Landezone",
      wiederholungen: 10,
      schritte: [
        "Handtuch ein paar Schritte weit aufs Grün legen.",
        "Chippen: Wie viele Bälle landen auf dem Handtuch?",
        "Rollen sie bis zum Loch? Sonst Handtuch verschieben.",
      ],
    },
    kennzahlen: [],
    quellen: ["kurzes-spiel:LR1", "kurzes-spiel:FOY1", "kurzes-spiel:SIE1", "kurzes-spiel:AGD1", "kurzes-spiel:PELZ1", "kurzes-spiel:GTS1", "kurzes-spiel:BB1"],
    beleg: "zwei-quellen",
  },
  {
    id: "start-regeln",
    pfad: "start",
    level: "einsteiger",
    titel: "Platzreife: Regeln & Etikette in 5 Minuten",
    kern: "Spiel den Ball, wie er liegt, und den Platz, wie du ihn vorfindest.",
    bild: "pfahlfarben",
    karten: [
      { text: "Weiße Pfähle: Aus – zurück zur Stelle des letzten Schlags, 1 Strafschlag (Regel 18.2). Gelbe und rote Pfähle: Penalty Area, Erleichterung kostet 1 Strafschlag (Regel 17)." },
      { text: "Ball nach 3 Minuten Suche nicht gefunden: Er gilt als verloren. Wer das ahnt, sagt vorher an: „Ich spiele einen provisorischen Ball“ (Regel 18.3)." },
      { text: "Etikette: Divots zurücklegen, Pitchmarken ausbessern, Bunker harken. Ruhig stehen, wenn jemand schlägt. Fliegt ein Ball auf Menschen zu: laut „Fore!“ rufen." },
      { text: "Platzreife-Prüfung: Verhalten auf dem Platz, 9 Löcher Spiel und Theorie mit 30 Fragen. Hier nur kurz und ohne Gewähr – es gilt das offizielle Regelbuch." },
    ],
    quiz: {
      frage: "Was bedeuten weiße Pfähle?",
      antworten: ["Wasser – straflos droppen", "Aus – zurück, 1 Strafschlag", "Boden in Ausbesserung"],
      richtig: 1,
      erklaerung: "Weiß heißt Aus (Regel 18.2): zurück zur letzten Stelle mit einem Strafschlag. Gelb und rot markieren Penalty Areas.",
    },
    kennzahlen: [],
    quellen: ["regeln-etikette:RA2", "regeln-etikette:USGA1", "regeln-etikette:SIEK1", "regeln-etikette:PAR1", "regeln-etikette:ETI1", "regeln-etikette:ETI2", "regeln-etikette:DGV1", "regeln-etikette:WIKI1"],
    beleg: "regel",
  },
];

// ---------------------------------------------------------------
// Kleine Hilfsfunktionen
// ---------------------------------------------------------------
export function lektion(id) {
  return LEKTIONEN.find((l) => l.id === id) || null;
}

export function lektionenImPfad(pfadId) {
  return LEKTIONEN.filter((l) => l.pfad === pfadId);
}

// Pfade mit dem passenden Level zuerst, sonst in der festen Reihenfolge
export function pfadeFuerLevel(level) {
  return [...PFADE].sort((a, b) => (b.level === level) - (a.level === level));
}

// "3 von 8": wie viele Lektionen eines Pfads sind erledigt?
export function fortschritt(pfadId, erledigt) {
  const liste = lektionenImPfad(pfadId);
  return { erledigt: liste.filter((l) => erledigt.includes(l.id)).length, gesamt: liste.length };
}

// Die Lektion nach dieser im selben Pfad (oder null am Ende)
export function naechsteLektion(id) {
  const aktuell = lektion(id);
  if (!aktuell) return null;
  const liste = lektionenImPfad(aktuell.pfad);
  return liste[liste.indexOf(aktuell) + 1] || null;
}

// Gespeicherten Fortschritt lesen (Text aus dem localStorage "wissenFortschritt").
// Nur bekannte Lektions-IDs zählen – kaputte oder fremde Einträge werden ignoriert.
export function leseFortschritt(text) {
  let liste;
  try {
    liste = JSON.parse(text || "[]");
  } catch {
    return [];
  }
  if (!Array.isArray(liste)) return [];
  return [...new Set(liste.filter((id) => typeof id === "string" && lektion(id)))];
}

// Lektion als erledigt markieren oder das Häkchen wieder wegnehmen → neue Liste
export function setzeErledigt(erledigt, id, jaOderNein) {
  const ohne = erledigt.filter((x) => x !== id);
  return jaOderNein ? [...ohne, id] : ohne;
}

export function quelleText(kennung) {
  return QUELLEN[kennung] || kennung;
}

// Übung zur Lektion im Format des Übungsmodus ({ name, wiederholungen, schritte }) oder null
export function uebungFuer(eintrag, rechtshaender = true) {
  if (!eintrag.uebung) return null;
  if (eintrag.uebung.tipp) {
    const { id, messwert } = eintrag.uebung.tipp;
    return tipp({ id, messwert, bewertung: "verbessern" }, rechtshaender)?.uebung || null;
  }
  return eintrag.uebung;
}
