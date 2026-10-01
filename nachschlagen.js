// ===============================================================
// Nachschlagen im Bereich „📖 Wissen“: Glossar, Irrtümer, Regeln, Ausrüstung und Suche
// (Plan: docs/plan-wissensseite.md, Inhalte mit Quellen: docs/wissen/).
//
// Reine Daten und eine kleine Suchfunktion ohne Browser-Code, damit alles mit
// node --test prüfbar ist (tests/nachschlagen.test.mjs). app.js zeigt Glossar und
// Regeln als Liste, Irrtümer und Ausrüstung als Wisch-Karten.
//
// Gleiche strenge Regeln wie bei den Lektionen (keine Golflehrer-Durchsicht):
//   - Nur Belegtes. Quellen-Kennung = "datei:KÜRZEL" aus QUELLEN in wissen.js,
//     in der App nur als Text.
//   - Glossar: Jeder Begriff ist mit einer Lektion verknüpft, die ihn erklärt,
//     ODER steht in mindestens zwei Quellen.
//   - Längen (prüft der Test): Glossar ≤ 20 Wörter, Irrtum ≤ 10 und „Was stimmt“ ≤ 40,
//     Regel: Situation ≤ 6, Was tun ≤ 30, Strafe ≤ 6, Ausrüstung ≤ 40 Wörter pro Karte.
//   - Links/rechts gelten für Rechtshänder (Hinweis oben im Bereich Wissen).
// ===============================================================

import { LEKTIONEN } from "./wissen.js";

// ---------------------------------------------------------------
// Glossar: Begriff, Englisch, kurze Erklärung, Gruppe, verknüpfte Lektion (oder null), Quellen.
// auch (optional): weitere Suchwörter, z. B. „Wasser“ für Penalty Area (Entscheidung Marcel, 01.10.)
// ---------------------------------------------------------------
export const GLOSSAR_GRUPPEN = [
  { id: "schwung", titel: "Schwung und Technik" },
  { id: "ballflug", titel: "Ballflug und Treffen" },
  { id: "ausruestung", titel: "Schläger und Ausrüstung" },
  { id: "platz", titel: "Platz, Regeln und Spiel" },
];

// Kurzform, damit die lange Liste lesbar bleibt
const WIKI = "glossar:WIKI1";
const DMP = "glossar:DMP1";

export const GLOSSAR = [
  // Schwung und Technik
  { begriff: "Ansprechen", englisch: "Address", gruppe: "schwung", lektion: "start-haltung", quellen: [WIKI, DMP],
    text: "Die Haltung am Ball vor dem Schwung: Stand einnehmen, Schläger hinter dem Ball aufsetzen (P1)." },
  { begriff: "Rückschwung", englisch: "Backswing", gruppe: "schwung", lektion: "voll-rueckschwung", quellen: [WIKI],
    text: "Die Bewegung vom Ball weg bis zum höchsten Punkt, dem Top." },
  { begriff: "Top", englisch: "Top of backswing", gruppe: "schwung", lektion: "voll-phasen", quellen: [],
    text: "Der höchste Punkt des Schwungs, an dem der Rückschwung in den Abschwung wechselt (P4)." },
  { begriff: "Abschwung", englisch: "Downswing", gruppe: "schwung", lektion: "voll-abschwung", quellen: [WIKI],
    text: "Die Bewegung vom Top bis zum Treffmoment." },
  { begriff: "Treffmoment", englisch: "Impact", gruppe: "schwung", lektion: "voll-treffmoment", quellen: [],
    text: "Der Moment, in dem der Schläger den Ball trifft (P7)." },
  { begriff: "Durchschwung und Finish", englisch: "Follow-through", gruppe: "schwung", lektion: "voll-finish", quellen: [WIKI],
    text: "Alles nach dem Treffen bis zur ruhigen Endposition (P8 bis P10)." },
  { begriff: "P-Positionen", englisch: "P1–P10", gruppe: "schwung", lektion: "voll-phasen", quellen: [],
    text: "Zehn Positionen, die jedem Moment des Schwungs einen Namen geben – von P1 Ansprechen bis P10 Finish." },
  { begriff: "Vorneigung", englisch: "Forward bend", gruppe: "schwung", lektion: "start-haltung", quellen: [],
    text: "Der Oberkörper ist beim Ansprechen aus der Hüfte nach vorn gekippt, der Rücken bleibt lang." },
  { begriff: "Sway", auch: ["Schieben"], englisch: "Sway", gruppe: "schwung", lektion: "voll-rueckschwung", quellen: [],
    text: "Die Hüfte schiebt im Rückschwung seitlich weg, statt sich auf der Stelle zu drehen." },
  { begriff: "Early Extension", auch: ["Aufrichten"], englisch: "Early extension", gruppe: "schwung", lektion: "voll-treffmoment", quellen: [],
    text: "Der Körper richtet sich im Abschwung auf, die Hüfte schiebt zum Ball." },
  { begriff: "Kinematische Kette", englisch: "Kinematic sequence", gruppe: "schwung", lektion: "voll-abschwung", quellen: [],
    text: "Becken, Brust, Arme und Schläger erreichen im Abschwung nacheinander ihr Höchsttempo." },
  { begriff: "Über den Ball kommen", englisch: "Over the top", gruppe: "schwung", lektion: "ball-slice", quellen: [],
    text: "Schultern und Arme starten den Abschwung, der Schläger kommt von außen an den Ball." },
  { begriff: "Rhythmus", auch: ["Takt"], englisch: "Tempo", gruppe: "schwung", lektion: "voll-finish", quellen: [WIKI],
    text: "Verhältnis von Rück- zu Abschwung. Bei Tourspielern dauert der Rückschwung etwa dreimal so lang." },
  { begriff: "Routine", englisch: "Pre-shot routine", gruppe: "schwung", lektion: "platz-routine", quellen: [WIKI],
    text: "Der immer gleiche Ablauf vor jedem Schlag." },
  { begriff: "Quiet Eye", englisch: "Quiet eye", gruppe: "schwung", lektion: "platz-routine", quellen: [],
    text: "Der Blick ruht vor und während der Bewegung auf dem Ball, zum Beispiel beim Putten." },

  // Ballflug und Treffen
  { begriff: "Schlagfläche", englisch: "Face angle", gruppe: "ballflug", lektion: "ball-gesetze", quellen: [],
    text: "Wohin die Schlagfläche im Treffmoment zeigt. Sie bestimmt vor allem, wohin der Ball startet." },
  { begriff: "Schwungbahn", englisch: "Club path", gruppe: "ballflug", lektion: "ball-gesetze", quellen: [],
    text: "Die Richtung, in der sich der Schläger durch den Ball bewegt. Mit der Fläche bestimmt sie die Kurve." },
  { begriff: "Eintreffwinkel", englisch: "Attack angle", gruppe: "ballflug", lektion: "voll-driver-eisen", quellen: [WIKI],
    text: "Ob der Schläger den Ball abwärts (minus) oder aufwärts (plus) trifft. Eisen abwärts, Driver vom Tee besser leicht aufwärts." },
  { begriff: "Tiefster Punkt", englisch: "Low point", gruppe: "ballflug", lektion: "ball-fett-getoppt", quellen: [],
    text: "Der tiefste Punkt des Schwungbogens. Beim Eisen liegt er knapp nach dem Ball." },
  { begriff: "Treffpunkt", englisch: "Impact location", gruppe: "ballflug", lektion: "ball-treffpunkt", quellen: [],
    text: "Die Stelle auf der Schlagfläche, an der der Ball getroffen wird: Mitte, Spitze oder Ferse." },
  { begriff: "Gear Effect", englisch: "Gear effect", gruppe: "ballflug", lektion: "ball-treffpunkt", quellen: [WIKI],
    text: "Außermittige Treffer drehen den Schlägerkopf und geben dem Ball Zusatzspin – beim Driver eine Kurve." },
  { begriff: "Carry", englisch: "Carry", gruppe: "ballflug", lektion: null, quellen: [WIKI, DMP],
    text: "Die Flugweite bis zum ersten Aufkommen, ohne Rollen." },
  { begriff: "Draw und Fade", englisch: "Draw, fade", gruppe: "ballflug", lektion: "ball-neun", quellen: [WIKI],
    text: "Leichte, meist gewollte Kurve: Draw nach links, Fade nach rechts." },
  { begriff: "Hook und Slice", englisch: "Hook, slice", gruppe: "ballflug", lektion: "ball-neun", quellen: [WIKI],
    text: "Starke Kurve: Hook nach links, Slice nach rechts." },
  { begriff: "Push und Pull", englisch: "Push, pull", gruppe: "ballflug", lektion: "ball-neun", quellen: [WIKI],
    text: "Gerader Flug in die falsche Richtung: Push rechts, Pull links am Ziel vorbei." },
  { begriff: "Getoppt", auch: ["Topper", "dünn"], englisch: "Topped, thin", gruppe: "ballflug", lektion: "ball-fett-getoppt", quellen: [WIKI],
    text: "Der Schläger trifft den Ball zu weit oben, der Ball fliegt flach oder rollt nur." },
  { begriff: "Fett", englisch: "Fat, chunk", gruppe: "ballflug", lektion: "ball-fett-getoppt", quellen: [WIKI],
    text: "Der Schläger trifft zuerst den Boden, dann den Ball." },
  { begriff: "Shank (Socket)", englisch: "Shank", gruppe: "ballflug", lektion: "ball-shank", quellen: [WIKI],
    text: "Der Hosel trifft den Ball, er schießt fast rechtwinklig nach rechts." },
  { begriff: "Hosel", englisch: "Hosel", gruppe: "ballflug", lektion: "ball-shank", quellen: [],
    text: "Der Übergang vom Schaft zum Schlägerkopf." },
  { begriff: "Sky", englisch: "Skied shot", gruppe: "ballflug", lektion: "ball-weitere", quellen: [],
    text: "Der Driver trifft den Ball mit der Oberkante, der Ball steigt fast senkrecht." },

  // Schläger und Ausrüstung
  { begriff: "Loft", englisch: "Loft", gruppe: "ausruestung", lektion: "start-schlaeger", quellen: [WIKI, DMP],
    text: "Die Neigung der Schlagfläche. Mehr Loft: Der Ball startet höher und rollt weniger." },
  { begriff: "Bounce", englisch: "Bounce", gruppe: "ausruestung", lektion: "gruen-bunker", quellen: [WIKI, DMP],
    text: "Winkel der Wedge-Sohle: Die Hinterkante liegt tiefer als die Vorderkante, so gleitet sie durch den Sand." },
  { begriff: "Hybrid", englisch: "Hybrid", gruppe: "ausruestung", lektion: "start-schlaeger", quellen: [],
    text: "Ersatz für lange Eisen: Er startet höher und verzeiht Fehltreffer eher." },
  { begriff: "Wedge", auch: ["Sand Wedge", "Pitching Wedge"], englisch: "Wedge", gruppe: "ausruestung", lektion: "start-schlaeger", quellen: [],
    text: "Schläger mit viel Loft für kurze, hohe Schläge und den Bunker." },
  { begriff: "Flex", auch: ["Schaft"], englisch: "Shaft flex", gruppe: "ausruestung", lektion: null, quellen: ["ausruestung:MGS1", "ausruestung:GOLF1"],
    text: "Die Härte des Schafts. Sie richtet sich nach dem Schlägerkopftempo mit dem Driver." },
  { begriff: "Lie-Winkel", englisch: "Lie angle", gruppe: "ausruestung", lektion: null, quellen: ["ausruestung:EXG1", "ausruestung:GSK1"],
    text: "Der Winkel zwischen Schaft und Boden, wenn die Sohle flach aufliegt." },
  { begriff: "Fitting", englisch: "Club fitting", gruppe: "ausruestung", lektion: null, quellen: ["ausruestung:GL1", "ausruestung:GOLF3"],
    text: "Schläger werden mit Messgerät an Größe, Tempo und Schwung angepasst." },
  { begriff: "Mallet", auch: ["Putter"], englisch: "Mallet putter", gruppe: "ausruestung", lektion: null, quellen: ["ausruestung:GOLF2", "ausruestung:MGS4"],
    text: "Putter mit großem Kopf. Er verdreht sich bei Fehltreffern weniger." },

  // Platz, Regeln und Spiel
  { begriff: "Abschlag", auch: ["Tee"], englisch: "Teeing area", gruppe: "platz", lektion: null, quellen: [WIKI, DMP, "regeln-etikette:USGA2"],
    text: "Die Fläche, auf der jedes Loch beginnt: zwischen den Markierungen, bis zwei Schlägerlängen dahinter." },
  { begriff: "Fairway", englisch: "Fairway", gruppe: "platz", lektion: null, quellen: [WIKI, DMP],
    text: "Die kurz gemähte Spielbahn zwischen Abschlag und Grün." },
  { begriff: "Rough", englisch: "Rough", gruppe: "platz", lektion: null, quellen: [WIKI, DMP],
    text: "Das höhere Gras neben dem Fairway." },
  { begriff: "Vorgrün", englisch: "Fringe, apron", gruppe: "platz", lektion: null, quellen: [WIKI, DMP],
    text: "Der kurz gemähte Rand rund ums Grün." },
  { begriff: "Grün", englisch: "Green", gruppe: "platz", lektion: null, quellen: [WIKI, DMP],
    text: "Die besonders kurz gemähte Fläche ums Loch, auf der geputtet wird." },
  { begriff: "Bunker", auch: ["Sand"], englisch: "Bunker", gruppe: "platz", lektion: "gruen-bunker", quellen: [WIKI, DMP],
    text: "Eine mit Sand gefüllte Vertiefung." },
  { begriff: "Penalty Area", auch: ["Wasser", "Wasserhindernis", "Strafe", "gelbe Pfähle", "rote Pfähle"], englisch: "Penalty area", gruppe: "platz", lektion: "start-regeln", quellen: [WIKI, "regeln-etikette:RA3"],
    text: "Wasser oder Gelände mit gelben oder roten Pfählen, früher „Wasserhindernis“." },
  { begriff: "Aus", auch: ["weiße Pfähle", "Out"], englisch: "Out of bounds", gruppe: "platz", lektion: "start-regeln", quellen: [WIKI, DMP],
    text: "Alles außerhalb des Platzes, meist mit weißen Pfählen markiert." },
  { begriff: "Provisorischer Ball", englisch: "Provisional ball", gruppe: "platz", lektion: "start-regeln", quellen: ["regeln-etikette:RA3"],
    text: "Ein zweiter Ball, vorher angesagt, falls der erste verloren oder im Aus sein könnte." },
  { begriff: "Droppen", auch: ["Erleichterung", "Kniehöhe"], englisch: "Drop", gruppe: "platz", lektion: null, quellen: ["regeln-etikette:RA3", "regeln-etikette:SIEK1"],
    text: "Den Ball aus Kniehöhe fallen lassen, zum Beispiel nach einer Erleichterung." },
  { begriff: "Pitchmarke", auch: ["Einschlagloch"], englisch: "Ball mark", gruppe: "platz", lektion: null, quellen: [WIKI, DMP],
    text: "Die Delle, die ein landender Ball ins Grün schlägt. Ausbessern gehört zur Etikette." },
  { begriff: "Divot", englisch: "Divot", gruppe: "platz", lektion: null, quellen: [WIKI, DMP],
    text: "Das beim Schlag herausgeschlagene Rasenstück. Zurücklegen gehört zur Etikette." },
  { begriff: "Par, Birdie, Bogey", englisch: "Par, birdie, bogey", gruppe: "platz", lektion: null, quellen: [WIKI, DMP],
    text: "Par ist die vorgegebene Schlagzahl eines Lochs. Birdie: ein Schlag weniger, Bogey: ein Schlag mehr." },
  { begriff: "Stableford", englisch: "Stableford", gruppe: "platz", lektion: null, quellen: [WIKI, DMP],
    text: "Zählweise mit Punkten pro Loch statt der Summe aller Schläge." },
  { begriff: "Handicap-Index", auch: ["Vorgabe", "WHS"], englisch: "Handicap index", gruppe: "platz", lektion: null, quellen: ["regeln-etikette:DGV2", DMP],
    text: "Spielstärke nach dem World Handicap System: Mittel der besten 8 aus den letzten 20 Runden, höchstens 54." },
  { begriff: "Platzreife", englisch: "", gruppe: "platz", lektion: "start-regeln", quellen: [DMP, "regeln-etikette:DGV1"],
    text: "Der „Führerschein“ für den Golfplatz: Prüfung mit Spiel, Regeln und Etikette." },
  { begriff: "Chip und Pitch", englisch: "Chip, pitch", gruppe: "platz", lektion: "gruen-auswahl", quellen: [WIKI, DMP],
    text: "Kurze Schläge zum Grün: Der Chip fliegt kurz und rollt lang, der Pitch fliegt hoch und rollt wenig." },
  { begriff: "Uhren-System", englisch: "Clock system", gruppe: "platz", lektion: "gruen-pitch", quellen: [],
    text: "Pitch-Längen über die Länge des Rückschwungs steuern – der linke Arm ist der Stundenzeiger." },
  { begriff: "Grün lesen", englisch: "Green reading", gruppe: "platz", lektion: "gruen-lesen", quellen: [],
    text: "Neigung und Bruch eines Putts einschätzen." },
  { begriff: "Falllinie", englisch: "Fall line", gruppe: "platz", lektion: "gruen-lesen", quellen: [],
    text: "Die Richtung, in die das Grün am stärksten fällt. Auf ihr läuft ein Putt gerade." },
  { begriff: "Streuung", englisch: "Dispersion", gruppe: "platz", lektion: "platz-streuung", quellen: [],
    text: "Der Bereich, in dem deine Bälle mit einem Schläger landen – meist eine Ellipse." },
  { begriff: "Strokes Gained", englisch: "Strokes gained", gruppe: "platz", lektion: null, quellen: [WIKI, "kurzes-spiel:PG1"],
    text: "Messgröße von Mark Broadie: Schläge, die man gegenüber einer Vergleichsgruppe gewinnt oder verliert." },
];

// ---------------------------------------------------------------
// Irrtümer: je eine Karte „Irrtum → Was stimmt“ (docs/wissen/irrtuemer.md, alle Zeilen nachgelesen)
// ---------------------------------------------------------------
export const IRRTUEMER = [
  {
    id: "kopf",
    irrtum: "„Kopf unten lassen und ganz still halten!“",
    stimmt: "Ein ruhiger Kopf hilft, ein festgehaltener nicht. Im Rückschwung bewegt er sich etwas vom Ziel weg mit, im Durchschwung dreht er mit dem Körper zum Ziel.",
    lektion: null,
    quellen: ["irrtuemer:GOLF1", "irrtuemer:LR1", "irrtuemer:KU1", "irrtuemer:AY1"],
    beleg: "zwei-quellen",
  },
  {
    id: "linker-arm",
    irrtum: "„Der linke Arm muss am Top ganz gerade sein.“",
    stimmt: "Bei vielen sehr guten Spielern ist er am Top leicht gebeugt. Viele Trainer erlauben das ausdrücklich.",
    lektion: null,
    quellen: ["irrtuemer:AY1", "irrtuemer:KU1"],
    beleg: "zwei-quellen",
  },
  {
    id: "schaufeln",
    irrtum: "„Der Ball muss hochgeschaufelt werden.“",
    stimmt: "Beim Eisen triffst du den Ball leicht abwärts: erst Ball, dann Boden. Hoch bringt ihn der Loft. Schaufeln die Hände, wird der Schlag oft fett oder getoppt.",
    lektion: "ball-fett-getoppt",
    quellen: ["ballflug-und-fehler:TM3", "ballflug-und-fehler:AY2", "ballflug-und-fehler:HM1"],
    beleg: "messung",
  },
  {
    id: "startrichtung",
    irrtum: "„Der Ball startet in Richtung der Schwungbahn.“",
    stimmt: "Er startet vor allem in Richtung der Schlagfläche, beim Driver zu ca. 85 %. Die Bahn bestimmt zusammen mit der Fläche, wie der Ball kurvt.",
    lektion: "ball-gesetze",
    quellen: ["ballflug-und-fehler:TM1", "ballflug-und-fehler:TM2", "ballflug-und-fehler:SAND", "ballflug-und-fehler:WRX1"],
    beleg: "messung",
  },
  {
    id: "langsam",
    irrtum: "„Langsam schwingen heißt besser treffen.“",
    stimmt: "Wichtig ist ein gleichmäßiger Rhythmus: Tourspieler holen etwa dreimal so lange aus, wie ihr Abschwung dauert. Besonders langsam schwingen sie nicht.",
    lektion: "voll-finish",
    quellen: ["vollschwung:TT1", "vollschwung:GROB1"],
    beleg: "messung",
  },
  {
    id: "ueberschwingen",
    irrtum: "„Über die Waagerechte ausholen ist immer falsch.“",
    stimmt: "Gute Spieler holen verschieden weit aus: manche über die Waagerechte hinaus, andere deutlich kürzer. Eine einzige richtige Länge gibt es nicht.",
    lektion: null,
    quellen: ["irrtuemer:AY1", "irrtuemer:LR2"],
    beleg: "zwei-quellen",
  },
  {
    id: "ferse",
    irrtum: "„Die Füße müssen fest am Boden bleiben.“",
    stimmt: "Einige große Spieler heben im Rückschwung die linke Ferse, etwa Jack Nicklaus. Manche Trainer empfehlen das sogar, zum Beispiel bei wenig Beweglichkeit.",
    lektion: null,
    quellen: ["irrtuemer:AY1", "irrtuemer:GD1", "irrtuemer:GTM1"],
    beleg: "zwei-quellen",
  },
  {
    id: "top-position",
    irrtum: "„Am Top gibt es nur eine richtige Position.“",
    stimmt: "Schläger am Top links oder rechts vom Ziel, flach oder steil: Sehr gute Spieler zeigen alle Varianten. Entscheidend ist, wie der Schläger danach zum Ball kommt.",
    lektion: null,
    quellen: ["irrtuemer:AY1", "irrtuemer:GSA1"],
    beleg: "zwei-quellen",
  },
  {
    id: "dehnen",
    irrtum: "„Vor dem Spiel ausgiebig dehnen.“",
    stimmt: "Langes Dehnen im Stehen kostete in einer Studie ca. 4 % Schlägertempo. Besser: dynamisch aufwärmen, mit Bewegungen und Probeschwüngen.",
    lektion: "ueben-aufwaermen",
    quellen: ["mental-und-fitness:WU1", "mental-und-fitness:WU3"],
    beleg: "studie",
  },
  {
    id: "kleines-ziel",
    irrtum: "„Kleines Ziel, kleiner Fehler.“",
    stimmt: "In einer Studie mit 32 Golfern trafen die Spieler das Fairway öfter, wenn das ganze Fairway ihr Ziel war – und schlugen sogar weiter.",
    lektion: "platz-streuung",
    quellen: ["platzstrategie:LS1"],
    beleg: "studie",
  },
  {
    id: "putten",
    irrtum: "„Putten ist das Wichtigste.“",
    stimmt: "Putten ist wichtig. Laut Strokes-Gained-Messungen von Mark Broadie entstehen aber rund zwei Drittel des Unterschieds zwischen Profis und Freizeitspielern bei Abschlägen und Annäherungen.",
    lektion: null,
    quellen: ["kurzes-spiel:PG1", "kurzes-spiel:BRO1"],
    beleg: "messung",
  },
  {
    id: "holz3",
    irrtum: "„Holz 3 vom Abschlag ist genauer als der Driver.“",
    stimmt: "Laut Shot-Scope-Daten treffen Freizeitspieler mit beiden etwa gleich oft das Fairway, ca. 47 %. Der Driver fliegt aber im Schnitt ca. 20 m weiter.",
    lektion: null,
    quellen: ["platzstrategie:SS1"],
    beleg: "messung",
  },
  {
    id: "kraft",
    irrtum: "„Mehr Kraft bringt automatisch mehr Länge.“",
    stimmt: "Länge braucht Tempo und einen mittigen Treffer. Treffer an der Ferse flogen mit dem Driver in zwei Tests ca. 17 m kürzer als mittige.",
    lektion: "ball-treffpunkt",
    quellen: ["irrtuemer:MGS1", "ballflug-und-fehler:GOLF2"],
    beleg: "messung",
  },
];

// ---------------------------------------------------------------
// Regeln: die wichtigsten Situationen (Golfregeln 2023, abgeglichen mit dem R&A-Regeltext am 01.10.2026).
// Kurz und ohne Gewähr – in der App steht der Hinweis aufs offizielle Regelbuch und die Platzregeln.
// ---------------------------------------------------------------
export const REGELN = [
  { id: "verloren", situation: "Ball verloren", regel: "18.2", strafe: "1 Strafschlag",
    tun: "Nach 3 Minuten Suche nicht gefunden: zurück zur Stelle des letzten Schlags und neu spielen." },
  { id: "aus", situation: "Ball im Aus (weiße Pfähle)", regel: "18.2", strafe: "1 Strafschlag",
    tun: "Wie beim verlorenen Ball: zurück zur Stelle des letzten Schlags." },
  { id: "provisorisch", situation: "Provisorischer Ball", regel: "18.3", strafe: "1 Strafschlag, wenn er zählt",
    tun: "Könnte der Ball verloren oder im Aus sein: vorher ansagen und einen zweiten spielen. Findest du den ersten in 3 Minuten (nicht im Aus), gilt er." },
  { id: "gelb", situation: "Gelbe Penalty Area", regel: "17.1", strafe: "1 Strafschlag für Erleichterung",
    tun: "Spielen, wie er liegt, ist straflos. Sonst zurück zur letzten Stelle oder auf der Linie Fahne – Kreuzungspunkt beliebig weit nach hinten droppen." },
  { id: "rot", situation: "Rote Penalty Area", regel: "17.1", strafe: "1 Strafschlag für Erleichterung",
    tun: "Wie bei der gelben Penalty Area. Zusätzlich: innerhalb von 2 Schlägerlängen vom Kreuzungspunkt droppen, nicht näher zur Fahne." },
  { id: "unspielbar", situation: "Ball unspielbar", regel: "19", strafe: "1 Strafschlag",
    tun: "Überall außer in der Penalty Area: zurück zur letzten Stelle, 2 Schlägerlängen seitlich oder auf der Linie Fahne – Ball nach hinten droppen." },
  { id: "unspielbar-bunker", situation: "Ball im Bunker unspielbar", regel: "19.3", strafe: "1 Strafschlag, hinter dem Bunker 2",
    tun: "Zurück zur letzten Stelle, 2 Schlägerlängen seitlich oder nach hinten – beides im Bunker. Oder auf der Linie Fahne – Ball hinter dem Bunker droppen." },
  { id: "droppen", situation: "Droppen", regel: "14.3", strafe: "–",
    tun: "Ball aus Kniehöhe fallen lassen. Rollt er zweimal aus dem Bereich: dort hinlegen, wo er beim zweiten Drop aufkam." },
  { id: "platzverhaeltnisse", situation: "Pfütze, Weg, Boden in Ausbesserung", regel: "16.1", strafe: "straflos",
    tun: "Im Gelände: nächster Punkt, an dem nichts mehr stört, plus 1 Schlägerlänge droppen, nicht näher zur Fahne." },
  { id: "eingebettet", situation: "Ball steckt im Einschlagloch", regel: "16.3", strafe: "straflos",
    tun: "Nur im Gelände (nicht in Penalty Area, Bunker oder auf dem Grün): innerhalb 1 Schlägerlänge von der Stelle direkt dahinter droppen, nicht näher zur Fahne." },
  { id: "naturstoffe", situation: "Blätter, Äste, Steine", regel: "15.1", strafe: "sonst 1 Strafschlag",
    tun: "Dürfen überall weg, auch im Bunker. Bewegt sich dabei der Ball: zurücklegen – auf Grün und Abschlag straflos." },
  { id: "bunker", situation: "Sand im Bunker", regel: "12.2", strafe: "2 Strafschläge (Zählspiel)",
    tun: "Der Schläger berührt den Sand erst beim Schlag – nicht direkt vor oder hinter dem Ball, beim Probeschwung oder im Rückschwung." },
  { id: "gruen", situation: "Auf dem Grün", regel: "13", strafe: "straflos",
    tun: "Ball markieren, aufnehmen und reinigen. Pitchmarken und Spikespuren ausbessern. Die Fahne darf im Loch bleiben. Versehentlich bewegt: zurücklegen." },
  { id: "doppelt", situation: "Ball zweimal getroffen", regel: "10.1", strafe: "straflos",
    tun: "Zählt als ein Schlag." },
  { id: "suche", situation: "Ball bei der Suche bewegt", regel: "7.4", strafe: "straflos",
    tun: "Zurück an die alte Stelle legen." },
  { id: "schlaeger", situation: "Mehr als 14 Schläger", regel: "4.1", strafe: "2 je Loch, höchstens 4 (Zählspiel)",
    tun: "Höchstens 14 Schläger in der Tasche." },
  { id: "abschlag", situation: "Abschlag außerhalb der Abschlagsfläche", regel: "6.1", strafe: "2 Strafschläge (Zählspiel)",
    tun: "Der Ball liegt zwischen den Markierungen, bis 2 Schlägerlängen dahinter. Sonst noch einmal richtig abschlagen." },
];
export const REGEL_QUELLEN = ["regeln-etikette:RA3", "regeln-etikette:USGA1", "regeln-etikette:USGA2", "regeln-etikette:SIEK1", "regeln-etikette:PAR1"];

// ---------------------------------------------------------------
// Ausrüstung: je Thema eine Wisch-Karte (docs/wissen/ausruestung.md). Keine Markenwerbung.
// tabelle (optional): { kopf: [2 Texte], zeilen: [[2 Texte], …] }
// ---------------------------------------------------------------
export const AUSRUESTUNG = [
  {
    id: "schlaeger",
    titel: "Schläger für den Anfang",
    text: "Ein halber Satz mit ca. 7 Schlägern reicht für den Anfang. Ein Hybrid ersetzt gut die langen Eisen: Er startet höher und verzeiht Fehltreffer eher. Erlaubt sind höchstens 14 Schläger.",
    lektion: "start-schlaeger",
    quellen: ["erste-schritte:TMM1", "erste-schritte:LYNX1", "erste-schritte:ARC2", "erste-schritte:PIG2", "regeln-etikette:RA3"],
    beleg: "zwei-quellen",
  },
  {
    id: "driver-putter",
    titel: "Driver und Putter",
    text: "Für Einsteiger passt meist ein Driver mit mehr Loft, ca. 10,5–12°: Er bringt den Ball leichter in die Luft. Ein Putter mit großem Kopf (Mallet) verzeiht Fehltreffer eher.",
    lektion: null,
    quellen: ["erste-schritte:LYNX1", "ausruestung:GIUK1", "ausruestung:GOLF2", "ausruestung:MGS4"],
    beleg: "zwei-quellen",
  },
  {
    id: "schaft",
    titel: "Schaft: der richtige Flex",
    text: "Die Härte des Schafts richtet sich nach deinem Schlägerkopftempo mit dem Driver. Die Grenzen sind nicht genormt. Ist der Schaft zu steif, fliegt der Ball oft zu flach und nach rechts.",
    tabelle: {
      kopf: ["Flex", "Tempo mit dem Driver"],
      zeilen: [
        ["L (Damen)", "unter ca. 115 km/h"],
        ["A (Senior)", "ca. 115–135 km/h"],
        ["R (Regular)", "ca. 135–155 km/h"],
        ["S (Stiff)", "ca. 155–170 km/h"],
        ["X (Extra Stiff)", "ab ca. 170 km/h"],
      ],
    },
    lektion: null,
    quellen: ["ausruestung:MGS1", "ausruestung:GOLF1", "ausruestung:LR1", "ausruestung:FJ1"],
    beleg: "zwei-quellen",
  },
  {
    id: "ball",
    titel: "Der Ball",
    text: "Spiele immer dasselbe Ballmodell – dann bleiben Länge und Gefühl beim Chippen und Putten gleich. Bälle mit Urethan-Hülle haben laut MyGolfSpy-Messungen rund ums Grün deutlich mehr Spin.",
    lektion: null,
    quellen: ["ausruestung:NCG1", "ausruestung:G360A", "ausruestung:MGS2"],
    beleg: "zwei-quellen",
  },
  {
    id: "fitting",
    titel: "Fitting",
    text: "Beim Fitting werden Schläger mit Messgerät an dich angepasst. Unabhängige Studien zum Nutzen sind selten. Trainer sind uneins: Manche raten Einsteigern früh dazu, andere erst, wenn der Schwung gleichmäßiger ist.",
    lektion: null,
    quellen: ["ausruestung:GL1", "ausruestung:GOLF3", "ausruestung:G360B"],
    beleg: "zwei-quellen",
  },
  {
    id: "lie",
    titel: "Lie-Winkel",
    text: "Der Lie-Winkel liegt zwischen Schaft und Boden. Zeigt die Spitze des Eisens im Treffmoment zu weit nach oben, fliegt der Ball eher links – zu weit nach unten, eher rechts.",
    lektion: null,
    quellen: ["ausruestung:EXG1", "ausruestung:GSK1"],
    beleg: "messung",
  },
];

// ---------------------------------------------------------------
// Suche über Lektionstitel, Glossar (Deutsch, Englisch, Zusatzwörter), Irrtümer, Regel-Situationen und
// Ausrüstung. Groß/klein und Umlaute sind egal: „ruckschwung“, „rueckschwung“ und
// „Rückschwung“ finden dasselbe.
// ---------------------------------------------------------------
export function vereinfache(text) {
  return String(text)
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Pünktchen und Akzente weg: ü → u
    .replace(/ae/g, "a")
    .replace(/oe/g, "o")
    .replace(/ue/g, "u"); // auch „ue“ → „u“, damit „rueckschwung“ passt (auf beiden Seiten gleich)
}

// → null (weniger als 2 Zeichen) oder { lektionen, begriffe, irrtuemer, regeln, ausruestung }
export function suche(eingabe) {
  const wort = vereinfache(eingabe).trim();
  if (wort.length < 2) return null;
  const passt = (...texte) => texte.some((t) => vereinfache(t).includes(wort));
  return {
    begriffe: GLOSSAR.filter((g) => passt(g.begriff, g.englisch, ...(g.auch || []))),
    lektionen: LEKTIONEN.filter((l) => passt(l.titel)),
    regeln: REGELN.filter((r) => passt(r.situation)),
    irrtuemer: IRRTUEMER.filter((i) => passt(i.irrtum)),
    ausruestung: AUSRUESTUNG.filter((a) => passt(a.titel)),
  };
}
