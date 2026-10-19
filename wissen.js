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
  "kurzes-spiel:BRO2008": "Broadie 2008: Assessing golfer performance using Golfmetrics (Studie)",
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
  "mental-und-fitness:INJ2": "Golf-related lower back injuries: an epidemiological survey",
  "mental-und-fitness:INJ3": "Golf-related low back pain: a review of causative factors and prevention strategies",
  "mental-und-fitness:INJ4": "AAOS OrthoInfo: Golf injury prevention",
  "platzstrategie:PG3": "Practical Golf: Iron vs. driver off the tee",
  "platzstrategie:TM1": "TrackMan: 6 numbers every amateur should know",
  "platzstrategie:TM2": "TrackMan: Performance of the average male amateur",
  "richtig-ueben:AY3": "Adam Young: The study – differential versus calibrational",
  "putten:HM1": "HackMotion: Gate putting drill",
  "ballflug-und-fehler:GOLF1": "GOLF.com: How fast golfers swing driver by handicap",
  "grundlagen:VAR1": "Harry Vardon: How to Play Golf (1912)",
  "grundlagen:SC1": "Swing Catalyst: Body mass and pressure",
  "putten:LR1": "The Left Rough: How to hit solid putts",
  "vollschwung:HM4": "HackMotion: 6 golf shank drills (Anti-Casting)",
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
  // Pfad 2: Der Vollschwung
  "vollschwung:HM1": "HackMotion: Golf swing positions (P1–P10)",
  "vollschwung:DIY1": "The DIY Golfer: Swing positions",
  "vollschwung:GT1": "PGA.com über die GOLFTEC-SwingTRU-Studie (3D-Messungen)",
  "vollschwung:GT2": "GOLFTEC SwingTRU: 13.440 Schwünge (Pressemitteilung)",
  "vollschwung:GT3": "GOLFTEC: Slice-Ursachen aus 14 Mio. Schwüngen",
  "vollschwung:GOLF1": "GOLF.com: GOLFTEC-Schwungformel Neigung, Drehung, Beugung",
  "vollschwung:CHU2010": "Chu et al. 2010: Biomechanik und Driver-Leistung bei 308 Golfern (Studie)",
  "vollschwung:RS1": "RotarySwing: The 4 pressure shifts",
  "vollschwung:RG1": "Studie: Bodenreaktionskräfte im Golfschwung (Kraftmessplatten)",
  "vollschwung:SC1": "Swing Catalyst: Body mass and pressure",
  "vollschwung:HM2": "HackMotion: Erkenntnisse aus HackMotion-Messdaten",
  "vollschwung:TPI1": "TPI: Kinematic Sequence Revisited",
  "vollschwung:TPI2": "TPI: The Linear Kinematic Sequence",
  "vollschwung:TT1": "Tour Tempo (John Novosel), Zusammenfassung MyGolfSpy",
  "vollschwung:GROB1": "Grober & Cholewicki (Yale, 2006): Tempo im Golfschwung",
  "vollschwung:HM5": "HackMotion: Proper follow-through in golf",
  "vollschwung:BB1": "Bruce Bolt: How to follow through in golf",
  "vollschwung:GOLF2": "GOLF.com: Tee-Höhe beim Driver (GOLF Top 100 Teachers)",
  "vollschwung:VC1": "Voice Caddie: The truth about golf tee height",
  "grundlagen:SWT1": "Performance Golf: Ball position by club",
  "grundlagen:GD1": "Golf Distillery: Correct ball position",
  "grundlagen:USGTF1": "USGTF: Zwei Theorien zur Ballposition",
  "grundlagen:GDC2": "GolfDecode: Golf ball position",
  // Pfad 3: Ballflug verstehen & Fehler beheben
  "ballflug-und-fehler:TM1": "TrackMan: 6 numbers every amateur should know",
  "ballflug-und-fehler:TM2": "TrackMan: Ultimate guide to understanding TrackMan",
  "ballflug-und-fehler:TM3": "TrackMan: Attack Angle",
  "ballflug-und-fehler:TM5": "TrackMan: Leistung des durchschnittlichen männlichen Amateurs",
  "ballflug-und-fehler:TPI1": "TPI: Mehr Länge durch den Eintreffwinkel",
  "ballflug-und-fehler:SAND": "The Sand Trap: Ball flight laws",
  "ballflug-und-fehler:WRX1": "GolfWRX: Use the new ball flight laws",
  "ballflug-und-fehler:GT1": "GOLFTEC: Slice-Ursachen aus 14 Mio. Schwüngen",
  "ballflug-und-fehler:GT2": "GOLFTEC Scramble: Swing path drill to fix your slice",
  "ballflug-und-fehler:GT3": "GOLFTEC: Griff gegen Slice und Hook",
  "ballflug-und-fehler:HM5": "HackMotion: Fix your outside-in golf swing",
  "ballflug-und-fehler:AY1": "Adam Young: Gear Effect",
  "ballflug-und-fehler:AY2": "Adam Young: Fix fat and thin golf shots",
  "ballflug-und-fehler:AY3": "Adam Young: How to stop shanking",
  "ballflug-und-fehler:TPI5": "TPI: Early Extension als Schwungmerkmal (Folgen und Häufigkeit)",
  "ballflug-und-fehler:GOLF2": "GOLF.com: Fersen- oder Spitzentreffer mit dem Driver (Robotertest)",
  "ballflug-und-fehler:GOLF3": "GOLF.com: 10 keys for taking a proper divot",
  "ballflug-und-fehler:HM1": "HackMotion: Low point control drill",
  "ballflug-und-fehler:HM2": "HackMotion: 6 low point control drills",
  "ballflug-und-fehler:HM4": "HackMotion: Skying the driver",
  "ballflug-und-fehler:MGS1": "MyGolfSpy: Driver pop-ups explained",
  "ballflug-und-fehler:GM1": "Golf Monthly: Golf shank causes",
  "ballflug-und-fehler:TMG1": "Tell Me More Golf: Alternativen zum Impact-Tape",
  "ballflug-und-fehler:CAG1": "Colorado AvidGolfer: Dan Sniffin (PGA) zum Fußpuder-Spray",
  // Pfad 4: Rund ums Grün
  "kurzes-spiel:PIG1": "Plugged In Golf: Putting vs. chipping",
  "kurzes-spiel:GOLF1": "GOLF.com: If you can't stop chunking chips",
  "kurzes-spiel:LR2": "The Left Rough: Rule of 12",
  "kurzes-spiel:GAU1": "Golfers Authority: The rule of 12 in golf",
  "kurzes-spiel:SWS1": "Swing Surgeon (Don Trahan): Formula for pitches and chips",
  "kurzes-spiel:PELZ2": "Golf Digest: 5 research-based tips from Dave Pelz",
  "kurzes-spiel:GW1": "Golfwell: Wedges von 30 bis 100 Yards (Uhren-System)",
  "kurzes-spiel:FOY2": "Foy Golf Academy: The 3 wedge system",
  "kurzes-spiel:HM1": "HackMotion: How to hit a bunker shot",
  "kurzes-spiel:MGS1": "MyGolfSpy: Bunker shots explained",
  "kurzes-spiel:GOLF2": "GOLF.com: 10 ways to simplify greenside bunker shots",
  "putten:MGS1": "MyGolfSpy: Putting make percentage by handicap",
  "putten:BT1": "Blue Tees Golf: How to read green slope",
  "putten:GSA1": "Golf Smart Academy: What is the fall line in putting?",
  "putten:FOY1": "Foy Golf Academy: How to putt uphill and downhill",
  "putten:FG1": "Frankly Golf: Uphill and downhill breaking putts",
  "putten:GOLF2": "GOLF.com: AimPoint basics in 30 seconds",
  "putten:DIY1": "The DIY Golfer: AimPoint Express for beginners",
  // Pfad 5: Clever spielen
  "platzstrategie:MGS1": "MyGolfSpy: Course management with DECADE",
  "platzstrategie:PG1": "Practical Golf: Approach shot strategy",
  "platzstrategie:ARC2023": "Arccos: Top 3 approach stats (Firmendaten)",
  "platzstrategie:PG2": "Practical Golf: DECADE – Scott Fawcett",
  "platzstrategie:LS1": "Lou Stagner: Studie „Aim small, miss small?“ (Christina & Alpenfels)",
  "platzstrategie:LS2": "Lou Stagner: Approach shots coming up short",
  "platzstrategie:STIX1": "Stix: Breaking 100",
  "platzstrategie:SWM1": "Swingminder: The bogey golf strategy",
  "platzstrategie:H19": "Hole19: How to break 90 in golf",
  "platzstrategie:HM1": "HackMotion: Uphill and downhill lies",
  "platzstrategie:GT1": "GOLFTEC Scramble: Uneven lies – sidehill shots",
  "platzstrategie:LR1": "The Left Rough: Uneven lies",
  "platzstrategie:PF1": "Peter Field Golf: Wind, temperature and elevation",
  "platzstrategie:DA1": "Dale Abraham: Headwind vs. tailwind",
  "platzstrategie:ARC1": "Arccos: Wetter und Schlaglängen",
  "platzstrategie:BTW1": "Blue Tees Golf: How weather affects golf ball distance",
  "platzstrategie:GTM1": "Golf Tips Magazine (Zachary Allen, PGA): Bad lies",
  "platzstrategie:SR1": "SportsRec: What is a flyer lie?",
  "grundlagen:GM2": "Golf Monthly: Pre-shot routine",
  "grundlagen:GPC1": "The Golf Performance Center: Pre-shot routine",
  "grundlagen:V54": "Vision54: Think Box – Play Box (Zusammenfassung)",
  "grundlagen:GSC1": "The Golf Swing Company: Be a player (Vision54)",
  "mental-und-fitness:BG1": "Better Game Golf: Golf and anxiety",
  "mental-und-fitness:CH1": "Gröpel & Mesagno (2019): Übersichtsarbeit zu Choking im Sport",
  "mental-und-fitness:QE1": "Vine, Moore & Wilson (2011): Quiet-Eye-Training beim Putten",
  "mental-und-fitness:QE2": "Scientific Reports (2024): Quiet Eye beim Putten unter Druck",
  "mental-und-fitness:GSM1": "Golf State of Mind: Breathing techniques",
  "mental-und-fitness:ATM1": "Magnon, Dutheil & Vallet (2021): Langsames Atmen, Vagus und Angst",
  // Pfad 6: Besser üben
  "mental-und-fitness:WU1": "Gergley (2009): Statisches Dehnen und Schlägertempo",
  "mental-und-fitness:WU2": "Fradkin u. a.: Golf-Aufwärmprogramm",
  "mental-und-fitness:WU3": "Studie: Dynamisches vs. statisches Dehnen beim Driver",
  "mental-und-fitness:TPI1": "TPI: Early Extension",
  "mental-und-fitness:TPI3": "Studie: TPI-Bewegungstests und Schwungfehler",
  "mental-und-fitness:TPI4": "TPI: The Toe Touch Test",
  "richtig-ueben:WULF1": "Wulf & Su (2007): Äußerer Fokus und Genauigkeit im Golf",
  "richtig-ueben:REV1": "Übersichtsarbeit: Motorisches Lernen im Golf (2024, 52 Studien)",
  "richtig-ueben:AN1": "Liao & Masters (2001): Lernen mit Analogien",
  "richtig-ueben:AN2": "Studie: Analogie- vs. Technik-Lernen beim Putten",
  "richtig-ueben:IR1": "Wegner, Ansfield & Pilloff (1998): The putt and the pendulum",
  "richtig-ueben:DIST1": "Dail & Christina (2004): Verteiltes Üben beim Putten",
  "richtig-ueben:CI1": "Studie: Zufalls- vs. Block-Üben beim Putten",
  "richtig-ueben:CI2": "Meta-Analyse (2023): Kontext-Interferenz im Sport",
  "richtig-ueben:AY1": "Golfwell: Structuring your practice with Adam Young",
  "richtig-ueben:AY2": "Adam Young: Variability practice for golf",
  "richtig-ueben:FB1": "Meta-Analyse (2022): Seltenere Rückmeldung beim Lernen",
  "richtig-ueben:FB2": "Studie: Selbst bestimmte Rückmeldung beim Lernen",
  "richtig-ueben:FB3": "McKay u. a. (2022): Meta-Analyse zum selbst gesteuerten Üben",
  // Nachschlagen (nachschlagen.js): Glossar, Irrtümer, Regeln, Ausrüstung
  "glossar:WIKI1": "Wikipedia: Glossary of golf",
  "glossar:DMP1": "Deutschland macht Platzreife: Golfglossar",
  "irrtuemer:AY1": "Adam Young: Top myths in golf",
  "irrtuemer:GOLF1": "GOLF.com: Mythos „Kopf still halten“ (Jonathan Yarwood)",
  "irrtuemer:LR1": "The Left Rough: The truth about head movement",
  "irrtuemer:KU1": "Keiser University College of Golf: Debunking golf swing myths",
  "irrtuemer:LR2": "The Left Rough: Short backswing in golf",
  "irrtuemer:GD1": "Golf Distillery: Lift left heel from the ground",
  "irrtuemer:GTM1": "Golf Tips Magazine (Tim Cooke): Lift the heel",
  "irrtuemer:GSA1": "Golf Smart Academy (Tyler Ferrell): Across the line or laid off",
  "irrtuemer:MGS1": "MyGolfSpy Labs: Horizontal impact location study",
  "kurzes-spiel:BRO1": "Mark Broadie: Every Shot Counts (Zusammenfassung The DIY Golfer)",
  "platzstrategie:SS1": "Shot Scope: Driver or 3 wood off the tee (Messdaten)",
  "regeln-etikette:RA3": "The R&A: Rules of Golf, Regeltext",
  "regeln-etikette:USGA2": "USGA: Starting the hole – Teeing area",
  "regeln-etikette:DGV2": "golf.de (DGV): Handicap-Regeln kurz erklärt",
  "ausruestung:MGS1": "MyGolfSpy: Driver shaft flex chart",
  "ausruestung:GOLF1": "GOLF.com: Shaft flex based on swing speed",
  "ausruestung:WOR2012": "Worobets & Stefanyshyn 2012: Schaftflex bei 40 Golfern (Studie)",
  "ausruestung:BET2012": "Betzler et al. 2012: Effects of golf shaft stiffness (R&A-Studie)",
  "ausruestung:GIUK1": "Golf Insider UK: What loft driver should I use",
  "ausruestung:GOLF2": "GOLF.com: 5 reasons to consider a mallet putter",
  "ausruestung:MGS4": "MyGolfSpy: Blade versus mallet putters (über 43.000 Putts)",
  "ausruestung:MGS2": "MyGolfSpy: Golf ball performance by cover type (Balltest 2025)",
  "ausruestung:NCG1": "National Club Golfer: Should you always use the same golf ball",
  "ausruestung:G360A": "Golf 360 (Scott Pickett, PGA): Same golf ball every round",
  "ausruestung:GL1": "Golflens: Golf fitting guide",
  "ausruestung:GOLF3": "GOLF.com: The biggest misconception about club fitting",
  "ausruestung:G360B": "Golf 360 (Scott Pickett, PGA): Is club fitting worth it",
  "ausruestung:EXG1": "ExactGolf: Lie comparison (Messung am GCQuad)",
  "ausruestung:GSK1": "Golf Sidekick: Upright vs. flat lie angle",
  "putten:BRO2008": "Broadie 2008: Assessing golfer performance using Golfmetrics (Studie)",
  "putten:HAS2021": "Hasegawa, Okada & Fujii 2021: Grünlesen bei Profis und Amateuren (Studie)",
  "putten:ALP1": "GOLF.com: 96 percent of golfers make this mistake (Break lesen)",
  "platzstrategie:BRO2012": "Broadie 2012: Assessing golfer performance on the PGA Tour (Studie)",
  "platzstrategie:USGA1": "USGA: Berechnung des Handicap Index (Regel 5.2)",
  "platzstrategie:GPC1": "The Golf Performance Center: Are you playing enough for the wind",
  "platzstrategie:RICE1": "GOLF.com: Wie Hitze und Höhe Schläge verändern (Studie von Rice)",
  "platzstrategie:GDO1": "Golf Digest: Chris O'Connell über Hanglagen",
  "platzstrategie:WW1": "worldwide.golf: Ball über den Füßen spielen (Alex Day)",
  "ballflug-und-fehler:TUT1": "Tutelman: Estimating Slice and Hook (Rechenmodell)",
  "ballflug-und-fehler:WOOD2018": "Wood, Henrikson & Broadie 2018: Ballfluggesetze, PING-Messung (Studie)",
  "ausruestung:TUT2": "Tutelman: Design Notes zum Lie-Winkel",
  "vollschwung:MEI2011": "Meister et al. 2011: Drehbewegungen im Elite-Schwung (Studie)",
  "vollschwung:MCG1": "McGhie und Lynn: Druckverteilung nach Schläger (Swing Catalyst)",
  "vollschwung:BAL2006": "Ball 2006: Druckverlagerungs-Stile im Golfschwung (Dissertation)",
  "vollschwung:SOM2009": "Sommer und Rönnqvist 2009: Metronom-Training im Golf (Studie)",
  "mental-und-fitness:HAT2011": "Hatzigeorgiadis et al. 2011: Selbstgespräch im Sport (Meta-Analyse)",
  "mental-und-fitness:BEI2004": "Beilock et al. 2004: Achtung auf die Technik bei Anfängern und Könnern (Studie)",
  "mental-und-fitness:UTH2021": "Uthoff et al. 2021: Krafttraining und Golfleistung (Übersichtsarbeit)",
  "mental-und-fitness:BRE2024": "Brennan et al. 2024: Körperliche Merkmale und Schlägerkopftempo (Meta-Analyse)",
  "mental-und-fitness:KUI2024": "Kuitunen und Ponkilainen 2024: Verletzungsrate im Golf (Meta-Analyse)",
  "mental-und-fitness:VAD2004": "Vad et al. 2004: Rückenschmerz und Hüftbeweglichkeit bei Profis (Studie)",
  "richtig-ueben:GUA2002": "Guadagnoli et al. 2002: Video-Unterricht im Golf (Studie)",
  "richtig-ueben:SMI1997": "Smith et al. 1997: Rückmeldung mit Bandbreite beim Chippen (Studie)",
};

// ---------------------------------------------------------------
// Lernpfade. level = für wen der Pfad gedacht ist (wie in level.js).
// Der Vollschwung (Plan: 🌱→🌿) zählt als 🌿 – einzelne Lektionen darin sind 🌱.
// Weitere Pfade kommen in den nächsten Branches (siehe Plan).
// ---------------------------------------------------------------
export const PFADE = [
  {
    id: "start",
    level: "einsteiger",
    titel: "Start: Die Grundlagen",
    beschreibung: "Schläger, Griff, Haltung, erster Putt und Chip, die wichtigsten Regeln.",
  },
  {
    id: "vollschwung",
    level: "fortgeschritten",
    titel: "Der Vollschwung",
    beschreibung: "Phasen, Stand, Rückschwung, Abschwung, Treffmoment, Finish und Rhythmus – Driver und Eisen.",
  },
  {
    id: "ballflug",
    level: "fortgeschritten",
    titel: "Ballflug verstehen & Fehler beheben",
    beschreibung: "Warum der Ball kurvt, was der Treffpunkt ausmacht – und wie du Slice, Fett, Top und Shank behebst.",
  },
  {
    id: "gruen",
    level: "fortgeschritten",
    titel: "Rund ums Grün",
    beschreibung: "Putt, Chip oder Pitch, Uhren-System, Bunker, die richtige Länge beim Putten und Grüns lesen.",
  },
  {
    id: "strategie",
    level: "fortgeschritten",
    titel: "Clever spielen",
    beschreibung: "Streuung, Annäherung, persönliches Par, Hanglagen, Wind und Routine – weniger Schläge ohne neuen Schwung.",
  },
  {
    id: "ueben",
    level: "einsteiger",
    titel: "Besser üben",
    beschreibung: "Worauf achten, Bilder statt Verbote, verteilt üben, Range-Plan, Aufwärmen und Üben mit dieser App.",
  },
];

// Übungen nur als Text, die zwei Lektionen nutzen (Pfad 1 und Pfad 4)
const LANDEZONE = {
  name: "Landezone",
  wiederholungen: 10,
  schritte: [
    "Du brauchst ein Handtuch oder eine Schlägerhülle als Ziel.",
    "Lege es ein paar Schritte vor dich auf den Boden.",
    "Chippen: Wie viele Bälle landen auf dem Handtuch?",
    "Rollen sie bis zum Loch? Sonst Handtuch verschieben.",
  ],
};
const LEITER = {
  name: "Leiter",
  wiederholungen: 10,
  schritte: [
    "Zwei Schläger als Zone: 3 m und 4,5 m entfernt.",
    "Jeder Ball soll weiter rollen als der vorige.",
    "Zähle, wie viele nacheinander in der Zone bleiben.",
  ],
};

// ---------------------------------------------------------------
// Lektionen. Felder:
//   id, pfad, level, titel, kern (Kernsatz auf der Bildkarte), bild (schaubilder.js),
//   karten: [{ text, bild? }] (2–4 Inhaltskarten),
//   quiz: { frage, antworten: [3 Texte], richtig: Index 0–2, erklaerung },
//   uebung (optional): { tipp: {id, messwert} } = vorhandene Übung aus tipps.js (mit Figuren)
//                      oder { name, wiederholungen, schritte } = neue Übung nur als Text,
//   werkzeug (optional): "ballflugHelfer" = zusätzliche Karte zum Ausprobieren nach dem Quiz,
//   kennzahlen: passende Kennzahl-IDs der App (Baustellen-Karte → Lektion, siehe lektionZurKennzahl),
//   quellen: Kennungen aus QUELLEN, beleg: Schlüssel aus BELEGE.
// ---------------------------------------------------------------
// IDs nie umbenennen oder wiederverwenden – daran hängt der gespeicherte Fortschritt (Test).
export const LEKTIONEN = [
  {
    id: "start-weg",
    pfad: "start",
    level: "einsteiger",
    titel: "Wie lernt man Golf?",
    kern: "Starte mit Putten und Chippen, danach folgen die Schwünge mit dem Eisen.",
    bild: "weg",
    karten: [
      { text: "Der übliche Weg: Schnupperkurs (2–3 Stunden), dann Platzreifekurs beim Golflehrer mit Prüfung. Danach brauchst du ein Spielrecht, zum Beispiel über eine Clubmitgliedschaft. Hast du die Platzreife schon, lies ab der nächsten Karte weiter." },
      { text: "So nutzt du die App zwischen den Stunden: filmen, eine Baustelle (dein wichtigster Verbesserungspunkt) wählen, die passende Übung trainieren, nach 1–2 Wochen neu filmen. Dazwischen ohne Video üben.", bild: "appAblauf" },
      { text: "Zwei Einsteiger-Leitfäden raten: zuerst viel putten und chippen, dann Schwünge mit dem Eisen." },
      { text: "Realistisch bleiben: Ein männlicher Amateur mit Handicap ca. 15 fliegt den Driver im Mittel ca. 187 m weit (Carry). Als Einsteiger kommst du deutlich kürzer – das ist normal. Die App ersetzt keinen Golflehrer." },
    ],
    quiz: {
      frage: "Was raten Einsteiger-Leitfäden zuerst zu üben?",
      antworten: ["Den Driver auf der Range", "Putten und Chippen", "Lange Eisen aus 150 m"],
      richtig: 1,
      erklaerung: "Zuerst putten und chippen, dann Schwünge mit dem Eisen – so raten es zwei Einsteiger-Leitfäden.",
    },
    kennzahlen: [],
    quellen: ["erste-schritte:DMP1", "erste-schritte:GM1", "erste-schritte:BGL1", "erste-schritte:TM1"],
    beleg: "zwei-quellen",
  },
  {
    id: "start-schlaeger",
    pfad: "start",
    level: "einsteiger",
    titel: "Die Schläger",
    kern: "Mehr Loft: Der Ball startet höher und rollt weniger aus.",
    bild: "loftFaecher",
    karten: [
      { text: "Loft ist der Neigungswinkel der Schlagfläche. Ungefähr: Driver 10°, 7er-Eisen 34°, Sand Wedge 56°, Putter 2–4°. Je nach Hersteller weicht das etwas ab." },
      { text: "Wofür welcher? Driver für den Abschlag auf langen Löchern, Eisen für Schläge aufs Grün, Wedges für kurze, hohe Schläge und den Bunker, Putter auf dem Grün." },
      { text: "Erlaubt sind höchstens 14 Schläger (Regel 4.1). Für den Anfang reicht ein halber Satz mit 6–7 Schlägern, zum Beispiel Hybrid, 7er, 9er, Pitching Wedge, Sand Wedge, Putter (evtl. + Driver)." },
      { text: "Was der Loft bewirkt: Laut TrackMan bestimmt er im Treffmoment Abflughöhe und Spin. Mehr Loft heißt höherer Start, mehr Rückwärtsdrall (der Ball dreht sich nach hinten und bremst), steilere Landung, weniger Rollen.", bild: "flugRollenSchlaeger" },
      { text: "Der Lie ist der Winkel zwischen Schaft und Boden. Steht die Schlägerspitze beim Treffen hoch, zeigt die Fläche nach links. Mit Eisen sind das ca. 3 Yards Abweichung je Grad." },
      { text: "Hybrid (Mischung aus Holz und Eisen) statt langer Eisen: Er startet höher und verzeiht Fehltreffer eher." },
    ],
    quiz: {
      frage: "Was bewirkt mehr Loft?",
      antworten: ["Der Ball fliegt flacher und rollt weiter", "Der Ball fliegt gleich hoch, aber kürzer", "Der Ball startet höher und rollt weniger"],
      richtig: 2,
      erklaerung: "Mehr Loft bringt höheren Abflug und mehr Rückwärtsdrall. Deshalb fliegt ein Wedge hoch und kurz, ein Driver flach und weit.",
    },
    kennzahlen: [],
    quellen: ["erste-schritte:VES2", "erste-schritte:MIT1", "ballflug-und-fehler:TM4", "regeln-etikette:USGA1", "regeln-etikette:SIEK1", "erste-schritte:TMM1", "erste-schritte:LYNX1", "ausruestung:TUT2"],
    beleg: "zwei-quellen",
  },
  {
    id: "start-griff",
    pfad: "start",
    level: "einsteiger",
    titel: "Der Griff",
    kern: "Neutraler Griff: Von oben siehst du an der linken Hand zwei Knöchel.",
    bild: "griff",
    karten: [
      { text: "Linke Hand (oben): Lege den Schläger schräg durch die Finger, vom Ansatz des kleinen Fingers bis zum mittleren Glied des Zeigefingers – nicht in die Handfläche. Der Daumen liegt leicht rechts der Mitte.", bild: "foto:griff-linke-hand" },
      { text: "Rechte Hand (darunter): Greife vor allem mit den Fingern. Die Linie am Daumenballen („Lebenslinie“) liegt auf dem linken Daumen. Das V – die Falte zwischen Daumen und Zeigefinger – zeigt zur rechten Schulter." },
      { text: "Knöchel-Check: Schau von oben auf die linke Hand. Zwei Knöchel sind neutral. Drei oder mehr: stark, die Schlagfläche (Vorderseite des Schlägerkopfs) schließt leichter. Null bis eins: schwach, sie bleibt eher offen." },
      { text: "Slice (Ball kurvt nach rechts)? Oft sind nur null bis ein Knöchel zu sehen – zwei bis drei helfen. Rutscht die rechte Hand zu weit unter den Schaft (Bild), droht ein Hook (Ball kurvt nach links).", bild: "foto:griff-falsch" },
      { text: "Verbindung der Hände: überlappend (kleiner Finger rechts auf dem linken Zeigefinger), verzahnt (beide Finger greifen ineinander) oder zehn Finger. Keine ist „richtig“ – nimm die, bei der die Hände als Einheit arbeiten.", bild: "foto:griff-ueberlappend" },
      { text: "Griffdruck etwa 4–5 von 10: fest genug zum Führen, locker genug für lockere Unterarme. Liegt der Schläger in der Handfläche statt in den Fingern, werden die Handgelenke steif." },
    ],
    quiz: {
      frage: "Wie viele Knöchel der linken Hand siehst du beim neutralen Griff?",
      antworten: ["Zwei", "Keinen", "Vier"],
      richtig: 0,
      erklaerung: "Zwei Knöchel gelten als neutral. Mehr heißt stark (die Schlagfläche schließt leichter), weniger heißt schwach (sie bleibt eher offen).",
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
    quellen: ["grundlagen:HM1", "grundlagen:MGS1", "grundlagen:HM2", "grundlagen:GT1", "grundlagen:VAR1"],
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
      { text: "Du stehst neben dem Ball, nicht dahinter. Darum zeigen Füße, Knie, Hüfte und Schultern parallel links am Ziel vorbei – auf der inneren Schiene." },
      { text: "Zwischenziel: Such dir 1–2 m vor dem Ball einen Grashalm oder Fleck auf der Ziellinie. Stell dich hinter den Ball und ziele darauf. Erst die Schlagfläche ausrichten, dann die Füße." },
      { text: "Häufiger Fehler laut GOLFTEC: Füße stimmen, aber die Schultern zeigen zu weit nach links. Das fördert einen Schwung von außen – der Ball kurvt nach rechts (Slice) oder fliegt nach links (Pull)." },
      { text: "Routine: hinter dem Ball das Zwischenziel wählen, Schlagfläche ausrichten, Füße stellen, 1–2 Blicke zum Ziel, schwingen. Eine feste Reihenfolge hilft laut Studien, auch unter Druck.", bild: "zonen" },
      { text: "Die App misst die Ausrichtung nicht. Stell das Handy fest hin und filme von hinten entlang der Ziellinie – so siehst du grob, ob Füße und Schultern parallel stehen." },
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
        "Du brauchst zwei Schläger oder Stäbe als Schienen.",
        "Einer liegt neben dem Ball und zeigt zum Ziel.",
        "Der zweite liegt parallel dazu an deinen Fußspitzen.",
        "Schultern und Hüfte zeigen wie die Schienen.",
      ],
    },
    kennzahlen: [],
    quellen: ["grundlagen:WG1", "grundlagen:MGS2", "grundlagen:PGN1", "grundlagen:GT1", "grundlagen:GM2", "grundlagen:GPC1"],
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
      { text: "Die Arme hängen locker senkrecht unter den Schultern. Zwischen Griffende und linkem Oberschenkel passt mit dem Eisen etwa eine Faust." },
      { text: "Das Gewicht liegt etwa auf der Fußmitte, eher Richtung Ballen. Die App misst deine Vorneigung und den Armabstand, wenn du von hinten filmst." },
      { text: "Die rechte Hand greift tiefer am Griff, deshalb hängt die rechte Schulter etwas tiefer. Das ist normal." },
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
    quellen: ["grundlagen:VES1", "grundlagen:PP1", "grundlagen:DRV1", "grundlagen:GDC1", "vollschwung:HM1", "grundlagen:SC1"],
    beleg: "zwei-quellen",
  },
  {
    id: "start-putt",
    pfad: "start",
    level: "einsteiger",
    titel: "Erster Putt: Pendel und Länge",
    kern: "Die Schultern schwingen wie ein Pendel, die Länge des Rückschwungs bestimmt die Weite.",
    bild: "pendel",
    karten: [
      { text: "Die Schultern bewegen den Putter wie ein Pendel, die Handgelenke bleiben ruhig. Der Rhythmus bleibt gleich – längere Putts brauchen einen längeren Rückschwung." },
      { text: "Aufbau: Augen über dem Ball oder knapp innerhalb der Ziellinie. Aus der Hüfte beugen, die Arme hängen locker – wie beim Vollschwung, nur näher am Ball." },
      { text: "Die Schlagfläche bestimmt den Großteil der Startrichtung. Halte sie beim Treffen im rechten Winkel zur Ziellinie." },
      { text: "Lieber etwas zu weit als zu kurz: Ein Putt, der kurz bleibt, fällt nie." },
      { text: "Kurze Putts zählen: Bei Spielern mit über 97 Schlägen pro Runde kommt fast die Hälfte der Putt-Verluste von Putts zwischen 0,9 und 1,8 m. Übe diese kurzen Putts oft." },
      { text: "Lange Putts über ca. 10 m: Ziel ist ein Kreis von ca. 2 m Durchmesser ums Loch. So vermeidest du Drei-Putts." },
      { text: "Erwartungen: Tourspieler lochen aus 3 m nur ca. 40 % der Putts. Du darfst deutlich weniger erwarten – ein Putt, der knapp neben dem Loch liegen bleibt, ist ein guter Putt." },
    ],
    quiz: {
      frage: "Wie steuerst du die Länge eines Putts?",
      antworten: ["Mit mehr Kraft aus den Handgelenken", "Mit der Länge des Rückschwungs", "Mit einem schnelleren Rhythmus"],
      richtig: 1,
      erklaerung: "Der Rhythmus bleibt immer gleich. Längere Putts brauchen einen längeren Rückschwung, die Handgelenke bleiben ruhig.",
    },
    uebung: LEITER,
    kennzahlen: [],
    quellen: ["putten:PELZ1", "putten:GOLF1", "putten:RS1", "putten:GL1", "putten:GOLF3", "putten:GM1", "putten:HM2", "putten:HM3", "putten:LR1", "putten:BRO2008"],
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
      { text: "Warum flach zuerst? Der schlechteste Putt ist meist besser als der schlechteste Chip – weniger kann schiefgehen. Also putten, wo es geht, sonst chippen, erst dann pitchen.", bild: "entscheidung" },
      { text: "Aufbau – erst zwei Dinge: Gewicht etwas mehr links, Ball mittig. Sitzt das, dazu: enger Stand, Hände leicht vor dem Ball, Griff etwas kürzer fassen." },
      { text: "Schultern und Arme schwingen als Einheit. Für den Anfang ist es einfacher, die Handgelenke ruhig zu halten (Trainer sind sich da nicht ganz einig)." },
      { text: "Gleichmäßiges Tempo durch den Ball. Die Unterseite des Schlägers darf über den Boden gleiten – der Schläger läuft frei durch." },
    ],
    quiz: {
      frage: "Wann passt ein Chip?",
      antworten: ["Ball knapp neben dem Grün, viel Grün bis zur Fahne", "Ein Bunker liegt zwischen Ball und Fahne", "Der Ball liegt 150 m vor dem Grün"],
      richtig: 0,
      erklaerung: "Ein Chip fliegt kurz und rollt lang. Liegt ein Hindernis dazwischen, passt ein Pitch mit mehr Flug besser.",
    },
    uebung: LANDEZONE,
    kennzahlen: [],
    quellen: ["kurzes-spiel:LR1", "kurzes-spiel:FOY1", "kurzes-spiel:SIE1", "kurzes-spiel:AGD1", "kurzes-spiel:PELZ1", "kurzes-spiel:GTS1", "kurzes-spiel:BB1", "kurzes-spiel:PIG1"],
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
      { text: "Weiße Pfähle bedeuten Aus: Du spielst von der Stelle des letzten Schlags noch einmal, dazu 1 Strafschlag (Regel 18.2)." },
      { text: "Gelbe und rote Pfähle markieren eine Penalty Area (Strafzone, meist Wasser). Mit 1 Strafschlag lässt du den Ball woanders aus Kniehöhe fallen (droppen). Bei Rot auch seitlich daneben (Regel 17)." },
      { text: "Ball nach 3 Minuten Suche nicht gefunden: Er gilt als verloren. Wer das ahnt, sagt vorher an: „Ich spiele einen provisorischen Ball“ (Regel 18.3)." },
      { text: "Auf dem Grün darfst du den Ball markieren, aufnehmen und reinigen. Pitchmarken und Spikespuren darfst du ausbessern, die Fahne darf im Loch bleiben (Regel 13)." },
      { text: "Etikette: Divots zurücklegen, Pitchmarken ausbessern, Bunker harken. Ruhig stehen, wenn jemand schlägt. Fliegt ein Ball auf Menschen zu: laut „Fore!“ rufen." },
      { text: "Tempo: Wer an der Reihe ist, soll in höchstens 40 Sekunden schlagen – Empfehlung der R&A. In Privatrunden gilt oft „Ready Golf“: Wer bereit ist, spielt." },
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

  // ===== Pfad 2: Der Vollschwung (docs/wissen/vollschwung.md, grundlagen.md) =====
  {
    id: "voll-phasen",
    pfad: "vollschwung",
    level: "einsteiger",
    titel: "Die Phasen P1–P10",
    kern: "Zehn Positionen geben jedem Moment des Schwungs einen Namen.",
    bild: "schwungPhasen",
    karten: [
      { text: "Bekannt gemacht hat das P-System Mac O'Grady. Trainer, Spieler und Videoprogramme sprechen damit dieselbe Sprache. Die Positionen richten sich nach Schaft und Armen, nicht nach der Zeit." },
      { text: "Rückschwung: P1 Ansprechen, P2 Schaft waagerecht, P3 linker Arm waagerecht, P4 Top – der höchste Punkt, an dem die Richtung wechselt." },
      { text: "Abschwung und Durchschwung: P5 linker Arm waagerecht, P6 Schaft waagerecht, P7 Treffmoment, P8 Schaft waagerecht, P9 rechter Arm waagerecht, P10 Finish." },
      { text: "Die Figur zeigt sieben dieser Positionen: Körper aus einem echten Profi-Schwung, Schläger nach Lehrbuch. Die Zeitleiste der App nutzt vier: Ansprechen (P1), Top (P4), Treffmoment (P7) und Finish (P10)." },
      { text: "So nutzt du das in der App: Nach der Analyse springst du mit den Pfeilen unter dem Video von Phase zu Phase und siehst dort deine Linien." },
    ],
    quiz: {
      frage: "Woran erkennst du P2 im Rückschwung?",
      antworten: ["Der Schläger ist ganz oben", "Der Schaft ist waagerecht", "Der Ball ist getroffen"],
      richtig: 1,
      erklaerung: "Bei P2 steht der Schaft im Rückschwung waagerecht. Die Positionen richten sich nach Schaft und Armen.",
    },
    kennzahlen: [],
    quellen: ["vollschwung:HM1", "vollschwung:DIY1"],
    beleg: "zwei-quellen",
  },
  {
    id: "voll-stand",
    pfad: "vollschwung",
    level: "einsteiger",
    titel: "Stand und Ballposition",
    kern: "Je länger der Schläger, desto breiter der Stand und desto weiter links der Ball.",
    bild: "ballposition",
    karten: [
      { text: "Standbreite: Mit mittleren Eisen etwa schulterbreit, mit kurzen Eisen und Wedges etwas schmaler. Mit dem Driver etwas breiter als die Schultern – das gibt Stabilität." },
      { text: "Füße: Den linken Fuß ca. 20–30° zum Ziel ausdrehen, den rechten gerade oder leicht ausgedreht. Das erleichtert die Drehung – besonders, wenn du wenig beweglich bist." },
      { text: "Ballposition: Wedges in der Standmitte, das 7er-Eisen 1–2 Ballbreiten links davon, Hybrid und Holz 2–3 Ballbreiten. Der Driver liegt an der Innenseite der linken Ferse." },
      { text: "Warum? Beim Eisen liegt der tiefste Punkt des Schwungs nach dem Ball: erst Ball, dann Boden. Den Driver triffst du vom Tee leicht aufwärts – dafür liegt der Ball weiter vorn." },
      { text: "Folgen einer falschen Ballposition: zu weit vorn eher getoppt oder Pull, zu weit hinten eher Push und flacher Flug. Check: Schläger quer in die Standmitte legen." },
      { text: "Trainer sind uneins: Manche lassen den Ball bei allen Schlägern an derselben Stelle und ändern nur die Standbreite – so spielten Hogan und Nicklaus. Wähle ein System und bleib dabei." },
    ],
    quiz: {
      frage: "Wo liegt der Ball beim Driver?",
      antworten: ["In der Mitte des Stands", "Vor dem rechten Fuß", "An der Innenseite der linken Ferse"],
      richtig: 2,
      erklaerung: "Weiter vorn triffst du den Ball vom Tee leicht aufwärts. Das bringt mit dem Driver mehr Länge.",
    },
    kennzahlen: [],
    quellen: ["grundlagen:SWT1", "grundlagen:VES1", "grundlagen:GD1", "ballflug-und-fehler:TM3", "grundlagen:USGTF1", "grundlagen:GDC2"],
    beleg: "zwei-quellen",
  },
  {
    id: "voll-rueckschwung",
    pfad: "vollschwung",
    level: "fortgeschritten",
    titel: "Rückschwung und Top: drehen statt schieben",
    kern: "Am Top sind die Schultern etwa 90° gedreht – der Rücken zeigt zum Ziel.",
    bild: "topProfi",
    karten: [
      { text: "3D-Messungen (GOLFTEC): Tourspieler drehen die Schultern am Top etwa 90°, bei P2 schon ca. 60°. Die Hüfte dreht bei P2 ca. 25–30°, bei vielen Freizeitspielern höchstens 15°.", bild: "messwerteTop" },
      { text: "Das Becken dreht am Top nur ca. 45–49°, die Schultern etwa doppelt so weit (ca. 98°). So gemessen bei 308 Golfern mit Driver und bei Profis mit dem 5er-Eisen." },
      { text: "Die Hüfte dreht auf der Stelle. Wenig seitliches Schieben (Sway) am Top gehört laut GOLFTEC zu sechs Merkmalen, die mit gutem Spiel zusammenhängen. Die App misst das als Verschiebung.", bild: "foto:top" },
      { text: "Am Top liegen bei Tourspielern ca. 70–80 % des Drucks auf dem rechten Fuß. Das linke Handgelenk ist flach – Amateure strecken es im Schnitt ca. 10° mehr, das öffnet die Schlagfläche." },
      { text: "Die Schulterlinie steht am Top links tiefer: GOLFTEC nennt für Tourspieler ca. 36° Neigung, für hohe Handicaps ca. 30° (Firmenmessung)." },
      { text: "Die App misst am Top etwas anderes: die Rumpfachse von der Hüfte zur Schulter. In einer 3D-Studie mit 308 Golfern war sie im Mittel ca. 4° vom Ziel weg geneigt." },
      { text: "Die App misst am Top auch, wie hoch die Hände über der Schulter stehen. Zu hoch heißt oft: Die Arme heben den Schläger, statt dass der Oberkörper dreht." },
    ],
    quiz: {
      frage: "Wie weit drehen Tourspieler die Schultern am Top etwa?",
      antworten: ["Etwa 30°", "Etwa 90°", "Etwa 180°"],
      richtig: 1,
      erklaerung: "Etwa 90° laut 3D-Messungen – der Rücken zeigt dann ungefähr zum Ziel.",
    },
    // Vorhandene Übung mit Figuren (tipps.js, Kennzahl "Schultern drehen nicht voll")
    uebung: { tipp: { id: "schulterdrehung", messwert: 60 } },
    kennzahlen: ["schulterdrehung", "hueftSway", "armschwungTop", "oberkoerperTop"],
    quellen: ["vollschwung:GT1", "vollschwung:GT2", "vollschwung:GOLF1", "vollschwung:CHU2010", "vollschwung:RS1", "vollschwung:RG1", "vollschwung:HM2", "vollschwung:MEI2011"],
    beleg: "messung",
  },
  {
    id: "voll-abschwung",
    pfad: "vollschwung",
    level: "fortgeschritten",
    titel: "Abschwung: die kinematische Kette",
    kern: "Erst Becken, dann Brust, dann Arme, dann Schläger – jedes Glied schneller als das vorige.",
    bild: "kinematischeKette",
    karten: [
      { text: "3D-Messungen (TPI) zeigen: Becken, Brustkorb, Arme und Schläger erreichen ihr Höchsttempo nacheinander. Jedes Glied bremst dann ab und gibt Energie weiter. Der Schläger ist im Treffmoment am schnellsten." },
      { text: "Druck zuerst nach links: Gute Spieler verlagern ihn gleich zu Beginn des Abschwungs. Bei einem gemessenen Tourspieler sank der Druck rechts im ersten Moment von ca. 80 % auf ca. 50 %." },
      { text: "Gruppenwerte statt eines Profis (25 Golfer): Am Top ca. 72–78 % des Drucks hinten, im Treffen ca. 76–84 % vorn. Die Streuung ist groß, beim Driver von 4 bis 100 %." },
      { text: "Es gibt zwei Stile: Der Druck geht im Abschwung nach vorn („Front Foot“) oder wandert zurück nach hinten („Reverse“). Beide kommen vom Profi bis zum hohen Handicap vor." },
      { text: "Häufiger Fehler laut GOLFTEC: Schultern und Arme starten den Abschwung. Dann kommt der Schläger von außen – Slice oder Pull. Ein Bild dafür: Die Hüfte startet, die Arme fallen nach unten." },
      { text: "Winkel halten (Lag): Der Winkel zwischen linkem Arm und Schaft bleibt im Abschwung lange erhalten. Frühes Auflösen kostet Länge und führt zu fetten oder dünnen Treffern." },
      { text: "Aber: Lag entsteht durch die richtige Reihenfolge, nicht durch bewusstes Festhalten. Übe deshalb die Abfolge – und dass das Gewicht am Ende links ist, wie in der Übung unten." },
    ],
    quiz: {
      frage: "Welches Glied erreicht im Abschwung zuerst sein Höchsttempo?",
      antworten: ["Das Becken", "Die Arme", "Der Schläger"],
      richtig: 0,
      erklaerung: "Die Kette läuft vom Becken über Brust und Arme zum Schläger. Der Schläger ist erst im Treffmoment am schnellsten.",
    },
    uebung: { tipp: { id: "gewicht", messwert: 0.5 } },
    kennzahlen: ["gewicht"],
    quellen: ["vollschwung:TPI1", "vollschwung:TPI2", "vollschwung:RS1", "vollschwung:SC1", "vollschwung:GT3", "vollschwung:HM4", "vollschwung:MCG1", "vollschwung:BAL2006"],
    beleg: "messung",
  },
  {
    id: "voll-treffmoment",
    pfad: "vollschwung",
    level: "fortgeschritten",
    titel: "Treffmoment: Hüfte offen, Hände vorn",
    kern: "Im Treffmoment: Hüfte zum Ziel geöffnet, beim Eisen die Hände vor dem Ball.",
    bild: "treffProfi",
    karten: [
      { text: "Die Hüfte ist im Treffmoment bei Tourspielern ca. 36° zum Ziel geöffnet, bei hohen Handicaps nur ca. 20°. Das sind 3D-Messungen von GOLFTEC.", bild: "messwerteTreff" },
      { text: "Bei 308 Golfern mit Driver stand das Becken im Treffen ca. 35° offen. Die Vorneigung blieb vom Top bis zum Treffen gleich (ca. 22°). Das passt zu den GOLFTEC-Werten." },
      { text: "Beim Eisen sind die Hände vor dem Ball, der Schaft neigt sich nach vorn. Laut HackMotion-Messungen strecken Amateure das linke Handgelenk viel früher – ca. 0,07 statt 0,02 Sekunden vorher.", bild: "foto:nach-dem-treffen" },
      { text: "Die Vorneigung bleibt bis zum Treffen, der Po bleibt hinten. Richtet sich der Körper auf (Early Extension), leiden Treffpunkt und Richtung. Trainer sind uneins, welcher Fehlschlag folgt." },
      { text: "Linker Arm lang: Knickt er, wird der Schwungkreis kleiner und der Schläger kommt zu hoch an den Ball. Die Folge sind dünne oder getoppte Bälle." },
      { text: "Kopf hinter dem Ball, vor allem beim Driver. Wandert er vor den Ball, kommt der Schläger steil von oben. Die App misst Kopfhöhe und Kopf seitlich." },
      { text: "So übst du: langsam vom Top in die Treffposition schwingen und anhalten. Im Spiegel prüfen: Hüfte offen, Hände vor dem Ball, Po hinten. Danach dasselbe mit Ball." },
    ],
    quiz: {
      frage: "Wie weit ist die Hüfte bei Tourspielern im Treffmoment zum Ziel geöffnet?",
      antworten: ["Gar nicht, sie steht parallel", "Ca. 90°", "Ca. 36°"],
      richtig: 2,
      erklaerung: "Ca. 36° laut 3D-Messungen, bei hohen Handicaps nur ca. 20°. Die Hüfte dreht vor den Armen zum Ziel.",
    },
    uebung: { tipp: { id: "vorneigungHalten", messwert: 20 } },
    kennzahlen: ["vorneigungHalten", "hueftBall"],
    quellen: ["vollschwung:GOLF1", "vollschwung:GT1", "vollschwung:HM2", "vollschwung:GT3", "vollschwung:CHU2010", "ballflug-und-fehler:TPI5"],
    beleg: "messung",
  },
  {
    id: "voll-finish",
    pfad: "vollschwung",
    level: "einsteiger",
    titel: "Finish und Rhythmus 3 : 1",
    kern: "Zurück dreimal so lang wie nach vorn – und im Finish ruhig stehen bleiben.",
    bild: "finishProfi",
    karten: [
      { text: "Im Finish liegt fast das ganze Gewicht auf dem linken Fuß. Die rechte Ferse ist oben, nur die Schuhspitze berührt den Boden. Brust und Gürtelschnalle zeigen zum Ziel.", bild: "foto:finish" },
      { text: "Ein ruhiges Finish ist die Folge eines guten Ablaufs. Test: Kannst du es halten, bis der Ball landet? Die App-Übung „Finish 3 Sekunden“ trainiert genau das." },
      { text: "Rhythmus 3 : 1: Der Rückschwung dauert etwa dreimal so lang wie der Abschwung. John Novosel maß bei Tourspielern zum Beispiel ca. 0,8 zu 0,27 Sekunden.", bild: "zeitbalken" },
      { text: "Eine Yale-Messung bestätigt: Tourspieler liegen bei ca. 2,5 bis 3,5 : 1 und schwingen sehr gleichmäßig. Wichtig ist also ein gleichmäßiger Rhythmus, nicht besonders langsames Schwingen." },
      { text: "Übung Mitzählen: „und – eins – zwei – drei“ bis zum Top, „vier“ im Treffen. Laut der Yale-Messung streuen Freizeitspieler im Rhythmus viel stärker als Tourspieler." },
      { text: "Hörbarer Takt: In einer Studie mit 26 Golfern verbesserten vier Wochen Training mit dem Metronom das Timing und machten die Schläge genauer. Die Kontrollgruppe blieb gleich." },
    ],
    quiz: {
      frage: "Wie lange dauert der Rückschwung bei guten Spielern im Vergleich zum Abschwung?",
      antworten: ["Etwa dreimal so lang", "Etwa gleich lang", "Etwa halb so lang"],
      richtig: 0,
      erklaerung: "Rhythmus 3 : 1 – zum Mitzählen: „eins – zwei – drei“ zurück, auf „vier“ ist der Ball getroffen.",
    },
    uebung: { tipp: { id: "tempo", messwert: 2 } },
    kennzahlen: ["tempo", "gewicht"],
    quellen: ["vollschwung:HM5", "vollschwung:BB1", "vollschwung:TT1", "vollschwung:GROB1", "vollschwung:SOM2009"],
    beleg: "messung",
  },
  {
    id: "voll-driver-eisen",
    pfad: "vollschwung",
    level: "fortgeschritten",
    titel: "Driver und Eisen",
    kern: "Das Eisen trifft den Ball leicht abwärts, den Driver triffst du leicht aufwärts.",
    bild: "eintreffwinkel",
    karten: [
      { text: "Eisen: Der tiefste Punkt liegt nach dem Ball – erst Ball, dann Boden. Tourspieler treffen das 6er-Eisen im Schnitt mit ca. −4° (PGA) bzw. −2° (LPGA) abwärts." },
      { text: "Driver: Der Ball liegt auf dem Tee, du triffst ihn leicht aufwärts. Laut TPI bringen bei ca. 160 km/h Schlägerkopftempo +5° statt −5° rund 23 m mehr Flugweite." },
      { text: "Beim Driver liegt der Ball an der Innenseite der linken Ferse. Tee-Höhe: Die halbe Ballhöhe schaut über die Oberkante des Schlägerkopfs." },
      { text: "Stand und Neigung: Mit dem Driver etwas breiter als schulterbreit und mehr Neigung vom Ziel weg. Mit dem Eisen etwa schulterbreit und weniger Neigung." },
      { text: "Gefühl: Mit dem Eisen „durch den Ball nach unten“, mit dem Driver „den Ball vom Tee fegen“. Beim Driver bleibt der Kopf im Treffen deutlich hinter dem Ball." },
      { text: "Der männliche Durchschnittsamateur trifft den Driver laut TrackMan mit ca. −1,6° und fliegt ca. 187 m. Mit optimalem Abflug wären bei gleichem Tempo ca. 208 m möglich." },
    ],
    quiz: {
      frage: "Wie triffst du den Ball mit dem Driver am besten?",
      antworten: ["Steil von oben, mit Divot", "Mit einem sehr langsamen Schwung", "Leicht aufwärts vom Tee"],
      richtig: 2,
      erklaerung: "Leicht aufwärts bringt mit dem Driver mehr Flugweite. Beim Eisen ist es umgekehrt: erst Ball, dann Boden.",
    },
    kennzahlen: [],
    quellen: ["ballflug-und-fehler:TM3", "ballflug-und-fehler:TPI1", "ballflug-und-fehler:TM5", "grundlagen:GD1", "grundlagen:SWT1", "vollschwung:GOLF2", "vollschwung:VC1"],
    beleg: "messung",
  },

  // ===== Pfad 3: Ballflug verstehen & Fehler beheben (docs/wissen/ballflug-und-fehler.md) =====
  {
    id: "ball-gesetze",
    pfad: "ballflug",
    level: "fortgeschritten",
    titel: "Die Ballfluggesetze",
    kern: "Die Schlagfläche bestimmt, wo der Ball startet – Fläche und Bahn zusammen, wie er kurvt.",
    bild: "flaecheBahn",
    karten: [
      { text: "Früher hieß es: Der Ball startet in Richtung der Schwungbahn. Physiker wussten schon seit 1968, dass das nicht stimmt; Radar-Messgeräte machten es ab etwa 2006 für alle sichtbar. Die Schlagfläche bestimmt die Startrichtung." },
      { text: "Die Fläche bestimmt die Startrichtung zum größten Teil: beim Driver etwa drei Viertel, beim Eisen etwa zwei Drittel, beim Wedge gut die Hälfte. Je mehr Loft, desto mehr zählt die Bahn mit." },
      { text: "Die Kurve entsteht aus dem Unterschied zwischen Fläche und Bahn. Fläche offen zur Bahn: Kurve nach rechts. Fläche geschlossen zur Bahn: Kurve nach links." },
      { text: "Merkhilfe: Startet der Ball schon falsch, zuerst die Schlagfläche prüfen (Griff, Handgelenk). Kurvt er zu stark, die Bahn prüfen. Passt die Kurve nicht zur Bahn, den Treffpunkt." },
      { text: "Rechenmodell: Beim Driver kostet 1° Flächenfehler bei 200 Yards Carry ca. 9 Yards, der größte Teil davon ist Kurve. Beim Wedge zählt die Bahn für die Startrichtung merklich mit." },
      { text: "Weitere Größen: Das Schlägerkopftempo bestimmt die Länge – als Faustregel bringt 1 mph mehr ca. 2,5 Yards. Der Loft im Treffmoment bestimmt Abflughöhe und Spin." },
      { text: "So nutzt du es: Achte nach jedem Schlag zuerst auf die Startrichtung, dann auf die Kurve. Startet der Ball gerade und kurvt nach rechts, war die Fläche offen zur Bahn." },
    ],
    quiz: {
      frage: "Was bestimmt vor allem, in welche Richtung der Ball startet?",
      antworten: ["Die Schlagfläche", "Die Schwungbahn", "Die Standbreite"],
      richtig: 0,
      erklaerung: "Beim Driver zu etwa drei Vierteln (Messung mit 157 Golfern). Die Bahn im Verhältnis zur Fläche bestimmt dann die Kurve.",
    },
    kennzahlen: [],
    quellen: ["ballflug-und-fehler:TM1", "ballflug-und-fehler:TM2", "ballflug-und-fehler:SAND", "ballflug-und-fehler:WRX1", "ballflug-und-fehler:GT1", "ballflug-und-fehler:GOLF1", "ballflug-und-fehler:TM4", "ballflug-und-fehler:TUT1", "ballflug-und-fehler:WOOD2018"],
    beleg: "messung",
  },
  {
    id: "ball-neun",
    pfad: "ballflug",
    level: "fortgeschritten",
    titel: "Die neun Ballflüge",
    kern: "Drei Startrichtungen mal drei Kurven ergeben neun Ballflüge.",
    bild: "neunFlugkurven",
    karten: [
      { text: "Startet der Ball gerade und kurvt leicht nach links, ist es ein Draw, nach rechts ein Fade. Beides sind gewollte, leichte Kurven. Zu starke Kurven heißen Hook und Slice." },
      { text: "Startet der Ball links, heißt er Pull, startet er rechts, Push. Mit Kurve: Pull-Hook, Pull-Slice, Push-Draw, Push-Slice." },
      { text: "Draw und Hook: Die Fläche ist zur Bahn geschlossen, die Bahn kommt meist von innen. Fade und Slice: Die Fläche ist zur Bahn offen, die Bahn kommt meist von außen." },
      { text: "Beispiel Pull-Slice: Er startet links, weil die Fläche nach links zeigt. Er kurvt nach rechts, weil die Bahn noch weiter von außen kommt – die Fläche ist zur Bahn offen." },
      { text: "Beispiel Push-Draw: Er startet rechts, weil die Fläche nach rechts zeigt. Er kurvt nach links, weil die Bahn noch weiter von innen kommt – die Fläche ist zur Bahn geschlossen." },
    ],
    quiz: {
      frage: "Der Ball startet gerade und kurvt leicht nach rechts. Wie heißt das?",
      antworten: ["Draw", "Pull", "Fade"],
      richtig: 2,
      erklaerung: "Ein Fade: gerader Start, leichte Kurve nach rechts. Die Fläche war zur Bahn etwas offen.",
    },
    werkzeug: "ballflugHelfer",
    kennzahlen: [],
    quellen: ["ballflug-und-fehler:TM1", "ballflug-und-fehler:WRX1", "ballflug-und-fehler:SAND"],
    beleg: "messung",
  },
  {
    id: "ball-treffpunkt",
    pfad: "ballflug",
    level: "fortgeschritten",
    titel: "Treffpunkt und Gear Effect",
    kern: "Wo der Ball die Schlagfläche trifft, verändert Kurve, Länge und Spin.",
    bild: "treffpunktFlaeche",
    karten: [
      { text: "Gear Effect beim Driver: Ein Treffer an der Spitze dreht den Kopf auf – der Ball bekommt Draw-Spin. Ein Treffer an der Ferse gibt Fade-Spin. Ein Robotertest bestätigt das." },
      { text: "Hoch auf der Fläche getroffen, fliegt der Ball höher und mit weniger Spin. Tief getroffen, fliegt er flacher und mit mehr Spin (Robotertest von GOLF.com)." },
      { text: "Ein Fersentreffer bekommt Fade-Spin und kann wie ein Slice aussehen. Deshalb zuerst den Treffpunkt prüfen, dann erst am Schwung arbeiten." },
      { text: "Deshalb ist die Fläche des Drivers leicht gewölbt: Ein Treffer an der Spitze startet etwas rechts und dreht dann zurück zur Mitte." },
      { text: "Beim Eisen ist der Effekt kleiner, weil der Kopf flacher ist. Dort kostet ein Treffer neben der Mitte vor allem Länge." },
    ],
    quiz: {
      frage: "Du triffst mit dem Driver an der Spitze. Welchen Spin bekommt der Ball?",
      antworten: ["Draw-Spin", "Fade-Spin", "Gar keinen Spin"],
      richtig: 0,
      erklaerung: "Bei Spitzentreffern dreht der Kopf auf, der Ball bekommt Draw-Spin. An der Ferse ist es umgekehrt.",
    },
    uebung: {
      name: "Treffpunkt sichtbar machen",
      wiederholungen: 10,
      schritte: [
        "Fußpuder-Spray dünn auf die Schlagfläche sprühen.",
        "Einen Ball schlagen, dann den Abdruck ansehen.",
        "Mitte, Spitze oder Ferse? Das Muster merken.",
        "Abwischen, neu sprühen, weiter üben.",
      ],
    },
    kennzahlen: [],
    quellen: ["ballflug-und-fehler:AY1", "ballflug-und-fehler:GOLF2", "ballflug-und-fehler:TMG1", "ballflug-und-fehler:CAG1"],
    beleg: "messung",
  },
  {
    id: "ball-slice",
    pfad: "ballflug",
    level: "einsteiger",
    titel: "Slice beheben",
    kern: "Beim Slice ist die Schlagfläche offen zur Bahn – und die Bahn kommt oft von außen.",
    bild: "bahnVonAussen",
    karten: [
      { text: "Größter Einzelfaktor laut GOLFTEC (14 Mio. Schwünge): die Schlagfläche. Mittlere Handicaps treffen mit ca. 4–7° offener Fläche zur Bahn. Oft hilft schon ein Griff mit 2–3 sichtbaren Knöcheln." },
      { text: "Zweiter Faktor: Die Bahn kommt von außen, weil Schultern und Arme den Abschwung starten. Mittlere Handicaps kommen ca. 3–6° von außen, Tourspieler im Schnitt 1–3° von innen." },
      { text: "Dritter Faktor laut GOLFTEC: Early Extension – die Hüfte schiebt zum Ball. TPI ordnet sie eher Push, Block, Hook und Shank zu: Trainer sind uneins. Hilfe: Der Po bleibt hinten („Golftasche“)." },
      { text: "Gegen die Bahn von außen hilft ein Hindernis außen neben dem Ball, etwas vom Ziel weg. Der Schläger läuft innen daran vorbei zum Ball." },
      { text: "Erkennen: Der Ball startet links und kurvt nach rechts (Pull-Slice) – oder er startet gerade bis rechts und kurvt weiter nach rechts." },
      { text: "Ein Fersentreffer mit dem Driver kann wie ein Slice aussehen, denn die Ferse gibt Fade-Spin. Prüfe deshalb zuerst den Treffpunkt – wie in der Lektion „Treffpunkt und Gear Effect“.", bild: "treffpunktFlaeche" },
    ],
    quiz: {
      frage: "Was ist laut GOLFTEC der größte Einzelfaktor beim Slice?",
      antworten: ["Ein zu hohes Tee", "Eine zur Bahn offene Schlagfläche", "Ein zu weicher Schaft"],
      richtig: 1,
      erklaerung: "Die offene Fläche zur Bahn ist der größte Faktor. Dazu kommen oft eine Bahn von außen und Early Extension.",
    },
    uebung: {
      name: "Schachtel außen",
      wiederholungen: 10,
      schritte: [
        "Leere Ballschachtel außen neben den Ball, etwas zum rechten Fuß hin.",
        "Halbe Schwünge: Der Schläger läuft innen an der Schachtel vorbei.",
        "Klappt es sicher, zu vollen Schwüngen steigern.",
      ],
    },
    kennzahlen: ["hueftBall", "vorneigungHalten"],
    quellen: ["ballflug-und-fehler:GT1", "ballflug-und-fehler:GT2", "ballflug-und-fehler:HM5", "ballflug-und-fehler:AY1", "ballflug-und-fehler:TPI5"],
    beleg: "messung",
  },
  {
    id: "ball-fett-getoppt",
    pfad: "ballflug",
    level: "einsteiger",
    titel: "Fett und getoppt: der tiefste Punkt",
    kern: "Beim Eisen liegt der tiefste Punkt des Schwungs knapp nach dem Ball.",
    bild: "tiefsterPunkt",
    karten: [
      { text: "Richtig mit dem Eisen: erst Ball, dann Boden – der Divot beginnt nach dem Ball. Tourspieler treffen das 6er-Eisen im Schnitt mit ca. −4° (PGA) bzw. −2° (LPGA) abwärts.", bild: "foto:nach-dem-treffen" },
      { text: "Fett: Der Schläger trifft zuerst den Boden, der tiefste Punkt liegt zu früh – auf der Seite weg vom Ziel. Häufige Gründe: Das Gewicht bleibt rechts oder die Hände schaufeln." },
      { text: "Getoppt: Der Schläger trifft den Ball oben. Der Bogen ist zu hoch, weil du dich aufrichtest oder die Arme kurz werden – oder der Schläger steigt schon wieder." },
      { text: "Wechseln sich fett und getoppt ab, liegt der tiefste Punkt oft hinter dem Ball. Erste Hilfe laut Trainer Adam Young: tiefsten Punkt nach vorn bringen (Linien-Übung). Seltener liegt es an der Bogenhöhe." },
      { text: "Der Tipp „Kopf unten lassen“ hilft gegen Toppen kaum und macht steif. Besser: Größe und Vorneigung bis zum Treffen halten." },
    ],
    quiz: {
      frage: "Wo liegt beim Eisen der tiefste Punkt des Schwungs?",
      antworten: ["Knapp vor dem Ball, weg vom Ziel", "Genau unter dem Kopf", "Knapp nach dem Ball, zum Ziel hin"],
      richtig: 2,
      erklaerung: "Knapp nach dem Ball, also zum Ziel hin: erst Ball, dann Boden. Das Divot liegt vor dem Ball.",
    },
    uebung: {
      name: "Linien-Übung",
      wiederholungen: 10,
      schritte: [
        "Linie auf den Boden: Kreide oder Handtuchkante.",
        "Ohne Ball: Bodenkontakt auf oder kurz nach der Linie.",
        "Dann den Ball auf die Linie legen.",
        "Das Divot beginnt am Ball und liegt zum Ziel hin.",
      ],
    },
    kennzahlen: ["gewicht", "kopfhoehe", "vorneigungHalten"],
    quellen: ["ballflug-und-fehler:AY2", "ballflug-und-fehler:HM1", "ballflug-und-fehler:HM2", "ballflug-und-fehler:GOLF3", "ballflug-und-fehler:TM3"],
    beleg: "zwei-quellen",
  },
  {
    id: "ball-shank",
    pfad: "ballflug",
    level: "fortgeschritten",
    titel: "Shank",
    kern: "Beim Shank trifft der Hosel – der Übergang vom Schaft zum Schlägerkopf – den Ball.",
    bild: "hoselTreffer",
    karten: [
      { text: "Der Ball schießt fast rechtwinklig nach rechts. Häufige Gründe: zu nah am Ball stehen, die Hüfte schiebt zum Ball (Early Extension) oder das Gewicht rutscht auf die Zehen." },
      { text: "Schiebt die Hüfte zum Ball, werden die Hände nach außen gedrückt – der Hosel kommt zuerst an den Ball. Hilfe: Der Po bleibt hinten, das Gewicht auf der Fußmitte." },
      { text: "Check beim Ansprechen: Zwischen Griffende und linkem Oberschenkel passt eine Faust (App-Übung „Faust-Check“). So stimmt der Abstand zum Ball." },
      { text: "Auch eine sehr offene Schlagfläche bringt den Hosel nach vorn an den Ball." },
      { text: "Hilfe gegen Early Extension: ein Stuhl oder Stab knapp hinter dem Po. Der Po bleibt im ganzen Schwung daran." },
    ],
    quiz: {
      frage: "Welcher Teil des Schlägers trifft beim Shank den Ball?",
      antworten: ["Die Spitze", "Der Hosel", "Die Sohle"],
      richtig: 1,
      erklaerung: "Der Hosel, der Übergang vom Schaft zum Kopf. Der Ball schießt dann fast rechtwinklig nach rechts.",
    },
    uebung: {
      name: "Zwei Bälle",
      wiederholungen: 10,
      schritte: [
        "Zwei Bälle nebeneinander, eine Schlägerkopfbreite Abstand.",
        "Den inneren Ball treffen, der näher an deinen Füßen liegt.",
        "Der äußere Ball bleibt liegen.",
        "Erst halbe Schwünge mit dem Wedge.",
      ],
    },
    kennzahlen: ["armeAnsprechen", "hueftBall", "vorneigungHalten"],
    quellen: ["ballflug-und-fehler:HM3", "ballflug-und-fehler:GM1", "ballflug-und-fehler:AY3"],
    beleg: "zwei-quellen",
  },
  {
    id: "ball-weitere",
    pfad: "ballflug",
    level: "fortgeschritten",
    titel: "Hook, Push, Pull und Sky",
    kern: "Hook, Push, Pull und Sky: Jeder dieser Fehlschläge hat eine typische Ursache.",
    bild: "fehlerUebersicht",
    karten: [
      { text: "Hook: das Spiegelbild des Slice. Die Fläche ist zur Bahn geschlossen – oft durch einen zu starken Griff oder eine Bahn weit von innen. Hilfe: ein Griff mit 2 sichtbaren Knöcheln." },
      { text: "Push und Pull: gerader Flug in die falsche Richtung, Fläche und Bahn zeigen beide nach rechts oder links. Zeigen die Schultern nach links, fördert das laut GOLFTEC eine Bahn von außen." },
      { text: "Sky mit dem Driver: Der Ball steigt fast senkrecht, weil der Schläger zu steil kommt und mit der Oberkante trifft. Hilfe: Ball an die linke Ferse, halber Ball über dem Schlägerkopf." },
      { text: "Gerader Flug, aber daneben? Oft liegt es an der Ausrichtung oder der Ballposition: Ball zu weit vorn eher Pull, zu weit hinten eher Push.", bild: "ballposition" },
      { text: "Gegen Sky hilft auch: das Tee kurzzeitig niedriger stecken, den Kopf hinter dem Ball lassen und den Ball „vom Tee fegen“." },
    ],
    quiz: {
      frage: "Der Ball fliegt gerade, aber deutlich rechts am Ziel vorbei. Wie heißt das?",
      antworten: ["Hook", "Sky", "Push"],
      richtig: 2,
      erklaerung: "Push: Fläche und Bahn zeigen beide nach rechts, der Ball fliegt ohne Kurve daneben.",
    },
    kennzahlen: [],
    quellen: ["ballflug-und-fehler:GT3", "ballflug-und-fehler:WRX1", "ballflug-und-fehler:TM1", "grundlagen:GT1", "ballflug-und-fehler:HM4", "ballflug-und-fehler:MGS1", "vollschwung:GOLF2", "vollschwung:VC1"],
    beleg: "zwei-quellen",
  },

  // ===== Pfad 4: Rund ums Grün (docs/wissen/kurzes-spiel.md, putten.md) =====
  {
    id: "gruen-auswahl",
    pfad: "gruen",
    level: "einsteiger",
    titel: "Putt, Chip oder Pitch?",
    kern: "So flach wie möglich, so hoch wie nötig: putten, wenn es geht.",
    bild: "entscheidung",
    karten: [
      { text: "Putten, wenn es geht – chippen, wenn man muss – pitchen nur, wenn es sein muss. Mehrere Kurzspiel-Lehrer empfehlen genau diese Reihenfolge." },
      { text: "Warum flach zuerst? Der schlechteste Putt ist meist besser als der schlechteste Chip. Beim Rollen kann weniger schiefgehen als in der Luft." },
      { text: "Putt vom Vorgrün: kurzes, festes Gras bis zum Grün. Chip: knapp neben dem Grün, genug Grün bis zur Fahne. Pitch: Bunker oder Rough dazwischen oder wenig Grün." },
      { text: "Wie wichtig ist das kurze Spiel? Laut Mark Broadie verlieren Freizeitspieler die meisten Schläge im langen Spiel. Putten, kurzes Spiel und Bunker machen aber noch ca. 44 % aus (Spieler über 97 Schläge)." },
    ],
    quiz: {
      frage: "Zwischen Ball und Grün liegt nur kurzes, festes Gras. Was ist meist die sicherste Wahl?",
      antworten: ["Ein hoher Pitch", "Ein Lob-Schlag", "Putten"],
      richtig: 2,
      erklaerung: "Der schlechteste Putt ist meist besser als der schlechteste Chip. Deshalb: so flach wie möglich.",
    },
    kennzahlen: [],
    quellen: ["kurzes-spiel:LR1", "kurzes-spiel:FOY1", "kurzes-spiel:PIG1", "kurzes-spiel:BRO1", "kurzes-spiel:BRO2008", "kurzes-spiel:PG1"],
    beleg: "zwei-quellen",
  },
  {
    id: "gruen-chip",
    pfad: "gruen",
    level: "einsteiger",
    titel: "Chippen: Flug und Rollen",
    kern: "Mehr Loft: Der Chip fliegt mehr und rollt weniger. Weniger Loft: umgekehrt.",
    bild: "flugRollenSchlaeger",
    karten: [
      { text: "Aufbau – erst zwei Dinge: Gewicht etwas mehr links, Ball mittig. Sitzt das, dazu: enger Stand, Hände leicht vor dem Ball, Griff etwas kürzer fassen." },
      { text: "Laut James Sieckmann läuft der Schläger frei durch den Ball. So gleitet die Unterseite des Schlägers über den Boden und verzeiht einen etwas zu frühen Bodenkontakt." },
      { text: "Welcher Schläger? Trainer sind uneins: Manche nutzen die „Regel der 12“, doch ihre Fassungen widersprechen sich. Andere raten, das Rollen der eigenen Schläger auf dem Übungsgrün zu lernen." },
      { text: "Dein Ziel beim Chip ist der Landepunkt: eine Stelle auf dem Grün, von der der Ball zur Fahne rollt. Genau das übt die Landezone." },
      { text: "Freizeitspieler machen im kurzen Spiel (20–60 Yards) ca. dreimal größere Längen- als Richtungsfehler. Übe deshalb vor allem die Länge, zum Beispiel mit der Landezone." },
      { text: "Größter Fehler im kurzen Spiel laut Dave Pelz: abbremsen. Schwinge deshalb gleich weit vor wie zurück, mit gleichmäßigem Tempo durch den Ball." },
    ],
    quiz: {
      frage: "Was passiert beim Chip mit mehr Loft?",
      antworten: ["Der Ball fliegt mehr und rollt weniger", "Der Ball rollt weiter", "Nur die Richtung ändert sich"],
      richtig: 0,
      erklaerung: "Mehr Loft bringt mehr Flug und mehr Rückwärtsdrall, der Ball rollt weniger. Mit weniger Loft rollt er weiter.",
    },
    uebung: LANDEZONE,
    kennzahlen: [],
    quellen: ["kurzes-spiel:SIE1", "kurzes-spiel:GOLF1", "kurzes-spiel:PELZ1", "kurzes-spiel:AGD1", "kurzes-spiel:LR2", "kurzes-spiel:GAU1", "kurzes-spiel:SWS1", "kurzes-spiel:GTS1", "kurzes-spiel:BB1", "ballflug-und-fehler:TM4", "erste-schritte:VES2", "kurzes-spiel:BRO2008"],
    beleg: "zwei-quellen",
  },
  {
    id: "gruen-pitch",
    pfad: "gruen",
    level: "fortgeschritten",
    titel: "Pitchen mit dem Uhren-System",
    kern: "Gleicher Rhythmus – nur der Rückschwung wird länger oder kürzer.",
    bild: "uhr",
    karten: [
      { text: "Ein Pitch fliegt hoch und rollt wenig. Dafür ist der Schwung länger als beim Chip, Körper und Handgelenke arbeiten mit – ein kleiner Vollschwung." },
      { text: "Uhren-System nach Dave Pelz: Der linke Arm ist der Stundenzeiger. Zurückschwingen bis 7:30, 9:00 (Arm waagerecht) oder 10:30 – das ergibt drei feste Längen." },
      { text: "Rhythmus und Durchschwung bleiben gleich, nur der Rückschwung ändert sich. Mit drei Längen und drei bis vier Wedges hast du neun bis zwölf feste Entfernungen." },
      { text: "Die genauen Uhrzeiten sind nicht heilig – manche Trainer nutzen 8, 9 und 10 Uhr. Wichtig ist, deine Längen auf der Range zu messen und aufzuschreiben." },
    ],
    quiz: {
      frage: "Was änderst du beim Uhren-System von Schlag zu Schlag?",
      antworten: ["Den Rhythmus", "Nur die Länge des Rückschwungs", "Die Ballposition"],
      richtig: 1,
      erklaerung: "Rhythmus und Durchschwung bleiben gleich. So bremst du nicht ab – nach Pelz der größte Fehler im kurzen Spiel.",
    },
    uebung: {
      name: "Wedge-Längen",
      wiederholungen: 10,
      schritte: [
        "Mit einem Wedge zehn Bälle bis 7:30 schlagen.",
        "Dasselbe bis 9:00 und bis 10:30.",
        "Mittlere Fluglänge je Uhrzeit notieren.",
        "Mit den anderen Wedges wiederholen.",
      ],
    },
    kennzahlen: [],
    quellen: ["kurzes-spiel:LR1", "kurzes-spiel:FOY1", "kurzes-spiel:PELZ1", "kurzes-spiel:PELZ2", "kurzes-spiel:GW1", "kurzes-spiel:FOY2"],
    beleg: "zwei-quellen",
  },
  {
    id: "gruen-bunker",
    pfad: "gruen",
    level: "fortgeschritten",
    titel: "Bunker: den Sand treffen",
    kern: "Im Bunker triffst du den Sand – der Sand trägt den Ball heraus.",
    bild: "sandEintritt",
    karten: [
      { text: "Schlagfläche zuerst öffnen, dann greifen – so bleibt sie offen. Die rundliche Sohle gleitet dann durch den Sand, statt sich einzugraben." },
      { text: "Breiter Stand, die Füße leicht in den Sand drehen. Ball links der Mitte, Gewicht links – und dort lassen." },
      { text: "Der Schläger tritt ca. 2–5 cm hinter dem Ball in den Sand ein. Eine Linie im Sand hilft beim Üben, genau diese Stelle zu treffen.", bild: "foto:bunker" },
      { text: "Regel 12.2: Im Bunker berührst du den Sand vor dem Schlag nicht mit dem Schläger – weder beim Probeschwung noch beim Aufsetzen oder im Rückschwung. Im Zählspiel kostet das zwei Strafschläge." },
      { text: "Sand Save (Grünbunker, höchstens zwei Schläge ins Loch): Tour 50 %, Runden von 70–83 Schlägen 26 %, von 84–97 Schlägen 17 %, über 97 Schlägen 7 %. Aufs Grün zu kommen ist schon ein Erfolg." },
      { text: "Schwinge länger, als du denkst: auch für 10–15 m etwa ein Dreiviertelschwung. Bis ins Finish durchschwingen – die Schlagfläche zeigt danach zum Himmel." },
      { text: "Häufige Fehler: Ball zu weit rechts, Gewicht nach rechts, Abbremsen im Sand. Steuere die Länge über die Schwunglänge." },
    ],
    quiz: {
      frage: "Wo tritt der Schläger beim Bunkerschlag in den Sand ein?",
      antworten: ["Genau am Ball", "Ca. 2–5 cm hinter dem Ball", "Ca. 30 cm hinter dem Ball"],
      richtig: 1,
      erklaerung: "Ca. 2–5 cm hinter dem Ball. Der Sand zwischen Schläger und Ball trägt den Ball aus dem Bunker.",
    },
    uebung: {
      name: "Linie im Sand",
      wiederholungen: 10,
      schritte: [
        "Im Übungsbunker eine Linie quer zur Zielrichtung ziehen.",
        "Ohne Ball schwingen: Der Schläger tritt auf der Linie ein.",
        "Ball knapp vor die Linie legen, zum Ziel hin.",
        "Schwingen und bis ins Finish durchziehen.",
      ],
    },
    kennzahlen: [],
    quellen: ["kurzes-spiel:HM1", "kurzes-spiel:MGS1", "kurzes-spiel:GOLF2", "kurzes-spiel:PELZ1", "regeln-etikette:USGA1", "regeln-etikette:SIEK1", "kurzes-spiel:BRO2008"],
    beleg: "zwei-quellen",
  },
  {
    id: "gruen-putt-laenge",
    pfad: "gruen",
    level: "einsteiger",
    titel: "Putten: Länge vor Linie",
    kern: "Ein Putt, der zu kurz bleibt, fällt nie – lieber etwas hinter das Loch.",
    bild: "puttZiel",
    karten: [
      { text: "Nach Messungen von Dave Pelz fallen die meisten Putts, wenn ein verfehlter Putt ca. 40 cm hinter dem Loch liegen bliebe." },
      { text: "Rückschwung zu Durchschwung ca. 60 : 40, gemessen mit dem SAM PuttLab. Der Putter schwingt gleichmäßig durch den Ball, der Rhythmus bleibt immer gleich." },
      { text: "Erwartungen: Aus 1,5 m lochen Tourspieler ca. 77 %, Spieler mit Handicap 20 ca. 55 %. Aus 3 m sind es ca. 40 % und ca. 18 %.", bild: "puttQuoten" },
      { text: "Ein Putt aus 3 m, der knapp neben dem Loch liegen bleibt, ist also ein guter Putt. Übe vor allem die Länge – zum Beispiel mit der Leiter." },
      { text: "Spieler über 97 Schläge verlieren pro Runde 5,1 Putts gegenüber Scratch-Spielern, davon 2,4 aus 0,9–1,8 m. Kurze Putts verdienen deshalb mehr Übungszeit." },
      { text: "Übung Bocksprung: Ab 1,5 m rollt jeder Putt etwas weiter als der vorige, ohne eine Grenze bei ca. 6 m zu überschreiten. Wie viele passen dazwischen?" },
      { text: "Übung Tor für die Startrichtung: zwei Tees knapp breiter als der Putterkopf, der Putter schwingt dazwischen durch. Stell sie so eng, dass 3–4 von 10 Versuchen misslingen." },
    ],
    quiz: {
      frage: "Wo bliebe ein verfehlter Putt nach Dave Pelz idealerweise liegen?",
      antworten: ["Knapp vor dem Loch", "Ca. 40 cm hinter dem Loch", "Ca. 2 m hinter dem Loch"],
      richtig: 1,
      erklaerung: "Ca. 40 cm dahinter. Ein Putt, der zu kurz bleibt, kann nie fallen.",
    },
    uebung: LEITER,
    kennzahlen: [],
    quellen: ["putten:PELZ1", "putten:GOLF1", "putten:GL1", "putten:GM1", "putten:GOLF3", "putten:MGS1", "putten:HM2", "putten:HM3", "putten:HM1", "putten:BRO2008"],
    beleg: "messung",
  },
  {
    id: "gruen-lesen",
    pfad: "gruen",
    level: "fortgeschritten",
    titel: "Grüns lesen",
    kern: "Die Falllinie zeigt, wohin das Grün fällt – auf ihr läuft ein Putt gerade.",
    bild: "falllinie",
    karten: [
      { text: "Die Falllinie ist die Richtung, in die Wasser vom Loch wegfließen würde. Putts genau auf ihr laufen gerade, bergauf oder bergab – alle anderen brechen.", bild: "foto:gruen-lesen" },
      { text: "Bergab bricht ein Putt mehr als bergauf: Er rollt langsamer, und die Neigung wirkt länger auf ihn." },
      { text: "Am meisten bricht ein Putt am Ende, wo er am langsamsten ist. Lies bei langen Putts deshalb vor allem das letzte Drittel." },
      { text: "Mehr Break spielen, als du denkst: Fast alle Golfer lesen ihn zu klein. Bei Spielern über 97 Schlägen liegen ca. 60 % der Fehlputts auf der tiefen Seite des Lochs." },
      { text: "Bei sehr guten Spielern (Handicap ca. 3) kommt die Streuung der Putt-Richtung zu ca. 60 % vom Grünlesen und zu ca. 34 % von Zielen und Schlag. Lesen lohnt sich also." },
      { text: "Mit den Füßen fühlen (Idee aus AimPoint): Auf halber Strecke breitbeinig über die Puttlinie stellen und spüren, wohin das Grün fällt." },
      { text: "AimPoint Express als Idee: Neigung von 1 bis 3 schätzen, so viele Finger mit ausgestrecktem Arm vors Loch halten und an der Außenkante zielen. Für die genaue Anwendung braucht es einen Kurs." },
    ],
    quiz: {
      frage: "Wo bricht ein langer Putt am meisten?",
      antworten: ["Gleich nach dem Treffen", "In der Mitte der Strecke", "Im letzten Drittel, kurz vor dem Loch"],
      richtig: 2,
      erklaerung: "Kurz vor dem Loch ist der Ball am langsamsten. Dort wirkt die Neigung am stärksten.",
    },
    uebung: {
      name: "Füße fühlen",
      wiederholungen: 5,
      schritte: [
        "Auf halber Strecke breitbeinig über die Puttlinie stellen.",
        "Mit den Füßen spüren: Wohin fällt das Grün?",
        "Putten und beobachten: Bricht der Ball dorthin?",
      ],
    },
    kennzahlen: [],
    quellen: ["putten:BT1", "putten:GSA1", "putten:FOY1", "putten:FG1", "putten:GOLF2", "putten:DIY1", "putten:BRO2008", "putten:HAS2021", "putten:ALP1"],
    beleg: "zwei-quellen",
  },

  // ===== Pfad 5: Clever spielen (docs/wissen/platzstrategie.md, grundlagen.md, mental-und-fitness.md) =====
  {
    id: "platz-streuung",
    pfad: "strategie",
    level: "fortgeschritten",
    titel: "Streuung statt Traumschlag",
    kern: "Plane für deine Streuung, nicht für deinen besten Schlag.",
    bild: "streuung",
    karten: [
      { text: "Jeder Spieler hat ein Muster, wo seine Bälle landen: eine Ellipse. Auch Tourspieler treffen nicht auf den Punkt." },
      { text: "Wähle das Ziel so, dass möglichst viel der Ellipse in sicherem Gelände liegt – weg von Wasser und Aus, auch wenn die Fahne dort steht." },
      { text: "Studie mit 32 Golfern: Mit dem ganzen Fairway als Ziel trafen sie es öfter (ca. 67 % statt 50 %) als mit einem kleinen Zielpunkt – und schlugen weiter." },
      { text: "Tourspieler landen aus 137–160 m im Schnitt ca. 8,5 m von der Fahne. Mit Handicap 10 sind es laut Arccos aus 115–135 m ca. 19 m, bei ca. 43 % Grüntreffern." },
      { text: "Doppel-Bogeys vermeiden ist wichtiger als Birdies jagen. Plane für deine Streuung, nicht für deinen besten Schlag." },
      { text: "Am Abschlag zählt laut Mark Broadie Länge mehr als Genauigkeit. Shot-Scope-Daten: Mit Driver und Holz 3 treffen Amateure gleich oft das Fairway, ca. 47 %." },
    ],
    quiz: {
      frage: "Worauf zielst du mit dem Driver laut Studie besser?",
      antworten: ["Auf einen kleinen Punkt", "Auf das ganze Fairway", "Auf den Rand am Wasser"],
      richtig: 1,
      erklaerung: "Mit dem ganzen Fairway als Ziel trafen die Golfer öfter das Fairway und schlugen sogar weiter.",
    },
    kennzahlen: [],
    quellen: ["platzstrategie:MGS1", "platzstrategie:PG2", "platzstrategie:LS1", "platzstrategie:PG1", "platzstrategie:ARC2023", "platzstrategie:SS1", "platzstrategie:PG3"],
    beleg: "studie",
  },
  {
    id: "platz-annaeherung",
    pfad: "strategie",
    level: "einsteiger",
    titel: "Annäherung: Grünmitte und genug Schläger",
    kern: "Ziele auf die Grünmitte und wähle den Schläger für den hinteren Rand.",
    bild: "gruenZiel",
    karten: [
      { text: "Ziele bei der Annäherung auf die Grünmitte statt auf die Fahne. So bleibt bei einem kleinen Fehler mehr Grün für den Ball." },
      { text: "Golfer verfehlen ca. 80–90 % der Grüns zu kurz. Wähle den Schläger deshalb nach der Entfernung zum hinteren Grünrand." },
      { text: "Selten ist ein Schlag perfekt getroffen – ein etwas längerer Schläger gleicht das aus. Die Fahne direkt anzuspielen lohnt erst, wenn neben ihr nichts Gefährliches liegt." },
      { text: "Kenne deine Längen: Miss je Schläger die durchschnittliche Carry-Länge, nicht die längste. Schon das verbessert das Ergebnis ohne jede Technikänderung." },
      { text: "Rough statt Fairway kostet selbst Tourprofis aus ca. 110 m rund 0,23 Schläge. Ein sicherer Abschlag aufs Fairway spart also Schläge, noch bevor der Annäherungsschlag kommt." },
    ],
    quiz: {
      frage: "Wohin verfehlen die meisten Golfer das Grün?",
      antworten: ["Zu kurz", "Zu lang", "Gleich oft kurz und lang"],
      richtig: 0,
      erklaerung: "Ca. 80–90 % der verfehlten Grüns sind zu kurz. Deshalb lieber etwas mehr Schläger nehmen.",
    },
    kennzahlen: [],
    quellen: ["platzstrategie:PG1", "platzstrategie:LS2", "platzstrategie:H19", "platzstrategie:TM1", "platzstrategie:TM2", "platzstrategie:BRO2012"],
    beleg: "zwei-quellen",
  },
  {
    id: "platz-par",
    pfad: "strategie",
    level: "einsteiger",
    titel: "Dein persönliches Par",
    kern: "Plane jedes Loch mit einem Schlag mehr als Par – das nimmt Druck raus.",
    bild: "bogeyPlan",
    karten: [
      { text: "Par 4 mit Bogey-Plan: zwei Schläge bis vor das Grün, ein Chip, zwei Putts. Par 3: Abschlag Richtung Grün, Chip, zwei Putts. Par 5: drei sichere Schläge, Chip, zwei Putts." },
      { text: "Bogey an jedem Loch ergibt auf einem Par-72-Platz 90 Schläge – ein Ziel, das viele Clubspieler nicht erreichen." },
      { text: "Große Zahlen vermeiden spart die meisten Schläge: Aus Bäumen oder tiefem Rough zuerst sicher zurück aufs Fairway statt durch eine enge Lücke." },
      { text: "Lange Löcher: Vorlage auf deine Lieblingsdistanz, dann ein Pitch zur Grünmitte und zwei Putts. So bleibt jeder Schlag einer, den du sicher kannst." },
      { text: "Dein Handicap Index zeigt dein Potenzial: Er zählt die 8 besten deiner letzten 20 Runden. Im Schnitt spielst du also etwas schlechter als dein Handicap." },
    ],
    quiz: {
      frage: "Mit wie vielen Schlägen planst du ein Par 4 beim persönlichen Par?",
      antworten: ["Vier", "Fünf", "Sechs"],
      richtig: 1,
      erklaerung: "Fünf: zwei Schläge vor das Grün, ein Chip, zwei Putts. Das ist ein Bogey – ohne großes Risiko.",
    },
    kennzahlen: [],
    quellen: ["platzstrategie:STIX1", "platzstrategie:SWM1", "platzstrategie:H19", "platzstrategie:USGA1"],
    beleg: "zwei-quellen",
  },
  {
    id: "platz-hang",
    pfad: "strategie",
    level: "fortgeschritten",
    titel: "Hanglagen",
    kern: "Am Hang: sicher stehen, ca. 80 % Tempo, Gleichgewicht vor Kraft.",
    bild: "haenge",
    karten: [
      { text: "Ball über den Füßen: Griff kürzer fassen, aufrechter stehen. Der Ball fliegt eher nach links – ziele etwas rechts." },
      { text: "Ball unter den Füßen: breiter stehen, tiefer in die Knie, Gewicht Richtung Fersen. Der Ball fliegt eher nach rechts – ziele etwas links." },
      { text: "Bergauf: Schultern parallel zum Hang, Ball etwas weiter vorn. Der Ball fliegt höher und kürzer – nimm mehr Schläger." },
      { text: "Bergab: Schultern parallel zum Hang, Ball etwas weiter hinten. Der Ball fliegt flacher und weiter – nimm weniger Schläger." },
      { text: "Bergauf fliegt der Ball zusätzlich eher nach links, bergab eher nach rechts. Ziele deshalb bergauf etwas rechts, bergab etwas links." },
      { text: "Je mehr Loft der Schläger hat, desto stärker wirkt die Schräglage. Ball über den Füßen: Mit einem Wedge fliegt er stärker nach links als mit einem Holz." },
    ],
    quiz: {
      frage: "Der Ball liegt über deinen Füßen. Wohin fliegt er eher?",
      antworten: ["Nach rechts", "Nach links", "Steil nach oben"],
      richtig: 1,
      erklaerung: "Eher nach links. Ziele deshalb etwas rechts und fasse den Griff kürzer.",
    },
    kennzahlen: [],
    quellen: ["platzstrategie:HM1", "platzstrategie:GT1", "platzstrategie:LR1", "platzstrategie:GDO1", "platzstrategie:WW1"],
    beleg: "zwei-quellen",
  },
  {
    id: "platz-wind",
    pfad: "strategie",
    level: "koenner",
    titel: "Wind, Rough und Nässe",
    kern: "Gegenwind kostet mehr Länge, als Rückenwind bringt.",
    bild: "wind",
    karten: [
      { text: "Faustregel: Pro 1,6 km/h Gegenwind ca. 1 % länger spielen, pro 1,6 km/h Rückenwind nur ca. 0,5 % kürzer. Bei starkem Wind wächst der Unterschied." },
      { text: "Der Grund: Gegenwind verstärkt die Wirkung des Rückwärtsdralls, der Ball steigt und verliert Länge. Rückenwind macht den Flug flacher." },
      { text: "Messbeispiel 6er-Eisen bei 32 km/h Wind: gegen den Wind ca. 36 m kürzer, mit dem Wind nur ca. 21 m länger. Die Luftfeuchte spielt kaum eine Rolle." },
      { text: "Leichtes bis mittleres Rough: Gras zwischen Schlagfläche und Ball nimmt Drall weg. Der Ball fliegt und rollt dann oft weiter als erwartet – ein „Flyer“." },
      { text: "Kälte und Nässe: Ein kalter Ball fliegt kürzer, und auf nassem, weichem Boden rollt er kaum. Plane dann mit der reinen Fluglänge." },
      { text: "Eine zweite Faustregel von Arccos und Blue Tees: pro 16 km/h Gegenwind ca. ein Schläger mehr, bei Rückenwind ein halber weniger." },
      { text: "Kälte in Zahlen: Laut Blue Tees fliegt ein Eisen je ca. 5–6 °C unter 21 °C etwa 1–2 Yards kürzer. Aus tiefem Rough mehr Loft nehmen und nur rausspielen." },
    ],
    quiz: {
      frage: "Was wirkt sich stärker auf die Länge aus?",
      antworten: ["Rückenwind", "Gegenwind", "Beides gleich"],
      richtig: 1,
      erklaerung: "Gegenwind: ca. 1 % je 1,6 km/h länger spielen. Rückenwind: nur ca. 0,5 % kürzer.",
    },
    kennzahlen: [],
    quellen: ["platzstrategie:PF1", "platzstrategie:DA1", "platzstrategie:ARC1", "platzstrategie:BTW1", "platzstrategie:GTM1", "platzstrategie:SR1", "platzstrategie:GPC1", "platzstrategie:RICE1"],
    beleg: "zwei-quellen",
  },
  {
    id: "platz-routine",
    pfad: "strategie",
    level: "fortgeschritten",
    titel: "Routine und Nervosität",
    kern: "Eine feste Routine vor dem Schlag hilft nachweislich gegen Nervosität.",
    bild: "zonen",
    karten: [
      { text: "Nervosität ist normal: Am ersten Abschlag steigt der Puls, die Feinmotorik leidet. Eine Übersichtsarbeit (2019) nennt die feste Routine als eine der wirksamsten Hilfen – neben Quiet Eye und Üben unter Druck." },
      { text: "Denk-Zone hinter dem Ball: Ziel, Schläger und Schlagidee festlegen. Dann bewusst einen Schritt nach vorn – in der Spiel-Zone zählen nur noch Gefühl und Ziel." },
      { text: "Auf der European Tour spielten Spieler mit gleich langer Routine über die Saison konstanter. Ausgewertet wurden über 22.000 Schläge." },
      { text: "Quiet Eye beim Putten: Blick ruhig auf die Rückseite des Balls, auch während des Putts. In einer Studie puttete die trainierte Gruppe unter Druck genauer." },
      { text: "Ein anleitendes Kurzwort („Schläger pendeln“) wirkt laut einer Meta-Analyse am stärksten bei Präzision und neuen Bewegungen. Motivierende Sätze wie „Los geht’s“ helfen dort weniger." },
      { text: "Gewöhnung hilft auch: unter leichtem Druck üben – Wettspiele gegen dich selbst, Strafpunkte oder kleine Wetten mit Freunden." },
      { text: "Quiet Eye in Zahlen: Der ruhige Blick der trainierten Gruppe dauerte ca. 2,8 statt 1,4 Sekunden. Im Wettspiel berichteten die Spieler ca. 2 Putts weniger pro Runde." },
    ],
    quiz: {
      frage: "Welche Hilfe gegen Versagen unter Druck nennt die Übersichtsarbeit?",
      antworten: ["Eine feste Routine vor dem Schlag", "Vor dem Schlag die Technik durchgehen", "Schneller schlagen, um nicht zu grübeln"],
      richtig: 0,
      erklaerung: "Eine feste Routine lenkt vom Grübeln ab. Auch Quiet Eye und Üben unter leichtem Druck halfen.",
    },
    uebung: {
      name: "Atmung 4 – 6",
      wiederholungen: 5,
      schritte: [
        "Vier Sekunden ruhig einatmen.",
        "Sechs Sekunden langsam ausatmen.",
        "Fünfmal wiederholen, zum Beispiel vor dem ersten Abschlag.",
      ],
    },
    kennzahlen: [],
    quellen: ["mental-und-fitness:BG1", "mental-und-fitness:CH1", "grundlagen:V54", "grundlagen:GSC1", "grundlagen:GM2", "grundlagen:GPC1", "mental-und-fitness:QE1", "mental-und-fitness:QE2", "mental-und-fitness:ATM1", "mental-und-fitness:GSM1", "mental-und-fitness:HAT2011"],
    beleg: "studie",
  },

  // ===== Pfad 6: Besser üben (docs/wissen/richtig-ueben.md, mental-und-fitness.md) =====
  {
    id: "ueben-fokus",
    pfad: "ueben",
    level: "einsteiger",
    titel: "Worauf achten? Schläger statt Arme",
    kern: "Achte auf den Schläger und das Ziel, nicht auf deine Arme.",
    bild: "fokus",
    karten: [
      { text: "Innerer Fokus heißt: auf den Körper achten, zum Beispiel „linker Arm gestreckt“. Äußerer Fokus heißt: auf die Wirkung achten, zum Beispiel „Ball zur Fahne“." },
      { text: "Studie Wulf & Su (2007): Mit äußerem Fokus pitchten Anfänger und erfahrene Golfer genauer als mit innerem Fokus oder ohne Anweisung." },
      { text: "Eine Übersicht über 52 Golf-Studien bestätigt den Vorteil. Allerdings sind viele Studien klein und untersuchen vor allem Anfänger beim Putten." },
      { text: "So formulierst du um: „Weiter Bogen mit dem Schlägerkopf“ statt „linker Arm gestreckt“. „Divot vor dem Ball“ statt „Gewicht nach links“." },
      { text: "Weitere Beispiele: „Gürtelschnalle zeigt im Finish zum Ziel“ statt „Hüfte zuerst drehen“, „Putterkopf pendelt wie ein Uhrpendel“ statt „Handgelenke ruhig“." },
      { text: "Beim Putten profitierten Anfänger davon, auf ihre Technik zu achten, Könner putteten damit schlechter. Als Einsteiger darfst du beim Üben auf Körperstellungen achten, auf dem Platz hilft ein Kurzwort." },
      { text: "Nimm nur einen Schwunggedanken gleichzeitig mit auf die Range – einen mit äußerem Fokus. So sind auch die Schwunggedanken der App formuliert." },
    ],
    quiz: {
      frage: "Welcher Gedanke ist ein äußerer Fokus?",
      antworten: ["„Linker Arm bleibt gestreckt“", "„Hüfte zuerst drehen“", "„Der Schlägerkopf pendelt wie ein Uhrpendel“"],
      richtig: 2,
      erklaerung: "Der Gedanke richtet sich auf den Schläger, nicht auf den Körper. Das lernt sich laut Studien besser.",
    },
    kennzahlen: [],
    quellen: ["richtig-ueben:WULF1", "richtig-ueben:REV1", "mental-und-fitness:BEI2004"],
    beleg: "studie",
  },
  {
    id: "ueben-bilder",
    pfad: "ueben",
    level: "fortgeschritten",
    titel: "Bilder statt Verbote",
    kern: "Ein Bild sagt mehr als viele Regeln – und positiv wirkt besser als ein Verbot.",
    bild: "bildStattVerbot",
    karten: [
      { text: "Ein Bild wie „schwing wie ein Pendel“ ersetzt viele Einzelanweisungen. Wer mit Bildern lernt, bleibt laut Studien unter Druck stabiler." },
      { text: "In einer Studie sollten Spieler einen Putt „nicht zu lang“ spielen. Unter Ablenkung passierte genau das häufiger." },
      { text: "Deshalb positiv formulieren: „Ball knapp hinter das Loch rollen lassen“ statt „nicht zu lang“, „Größe halten“ statt „nicht in die Knie gehen“." },
      { text: "Aus „Kopf unten lassen“ wird ein Bild: „den Grashalm unter dem Ball anschauen, bis er weg ist“." },
      { text: "Der alte Tipp „Ball ans Loch sterben lassen“ passt nicht: Nach Pelz bliebe ein verfehlter Putt ideal ca. 40 cm hinter dem Loch liegen.", bild: "puttZiel" },
    ],
    quiz: {
      frage: "Welcher Gedanke hilft unter Druck eher?",
      antworten: ["„Bloß nicht zu lang!“", "„Ball knapp hinter das Loch rollen lassen“", "„Nicht verziehen!“"],
      richtig: 1,
      erklaerung: "In der Studie passierte das Verbotene unter Ablenkung häufiger. Ein positives Bild sagt, was passieren soll.",
    },
    kennzahlen: [],
    quellen: ["richtig-ueben:AN1", "richtig-ueben:AN2", "richtig-ueben:IR1", "putten:PELZ1"],
    beleg: "studie",
  },
  {
    id: "ueben-verteilt",
    pfad: "ueben",
    level: "einsteiger",
    titel: "Verteilt und abwechslungsreich üben",
    kern: "Lieber dreimal 20 Minuten pro Woche als einmal 60 Minuten.",
    bild: "kalender",
    karten: [
      { text: "Studie Dail & Christina (2004): 90 Anfänger putteten 240 Putts – verteilt auf vier Tage oder an einem Tag. Nach 28 Tagen machte die verteilte Gruppe deutlich kleinere Fehler." },
      { text: "Zu Hause zählt mit: den Griff aufbauen, das Ansprechen vor dem Spiegel üben, Putts auf dem Teppich." },
      { text: "Block-Üben (20× derselbe Schlag) fühlt sich gut an. Abwechseln (jeder Schlag anders) bleibt oft besser haften – die Forschung ist aber nicht eindeutig." },
      { text: "Faustregel: Neue Bewegungen erst im Block üben. Sitzt eine Bewegung schon etwas, wird abgewechselt." },
      { text: "Praxis: lieber dreimal 20 Minuten in der Woche als einmal 60 Minuten." },
      { text: "Schwierigkeit richtig wählen (Adam Young): Eine Übung soll in 3–7 von 10 Versuchen klappen. Klappt mehr, mach sie schwerer, klappt weniger, leichter." },
    ],
    quiz: {
      frage: "Was brachte in der Putt-Studie mehr?",
      antworten: ["Dieselben Putts verteilt auf vier Tage", "240 Putts an einem Tag", "Nur auf dem Platz spielen"],
      richtig: 0,
      erklaerung: "Verteilt geübt machte die Gruppe nach 28 Tagen deutlich kleinere Fehler.",
    },
    kennzahlen: [],
    quellen: ["richtig-ueben:DIST1", "richtig-ueben:REV1", "richtig-ueben:CI1", "richtig-ueben:CI2", "richtig-ueben:AY1"],
    beleg: "studie",
  },
  {
    id: "ueben-range",
    pfad: "ueben",
    level: "einsteiger",
    titel: "Der Range-Plan",
    kern: "Erst Technik im Block, dann abwechseln, dann spielen wie auf dem Platz.",
    bild: "rangePlan",
    karten: [
      { text: "Beispiel für 60 Minuten: 10 aufwärmen, 15 Technik, 15 variabel, 15 Range-Runde und zum Schluss 5 Minuten kurzes Spiel." },
      { text: "Technik: eine Baustelle aus der App, mit Hilfsmittel. Drei bis fünf Schwünge filmen, dann ohne Video weiterüben. Wann du filmst, bestimmst du selbst." },
      { text: "Variabel: dasselbe Ziel einmal hoch, einmal flach, mit verschiedenen Schlägern. So lernst du, das Ziel auf verschiedenen Wegen zu erreichen." },
      { text: "Range-Runde: Jeder Ball ist ein anderer Schlag wie auf dem Platz – Driver, Eisen, Wedge, jeweils mit voller Routine." },
      { text: "Differenziell üben: bewusst an Spitze und Ferse treffen, absichtlich hooken und slicen. In Adam Youngs kleiner Untersuchung trafen Spieler danach öfter die Mitte." },
    ],
    quiz: {
      frage: "Was macht die Range-Runde aus?",
      antworten: ["20 Bälle mit demselben Schläger", "Nur Driver schlagen", "Jeder Ball ist ein anderer Schlag"],
      richtig: 2,
      erklaerung: "Jeder Ball ein anderer Schlag, mit voller Routine – so übst du wie auf dem Platz.",
    },
    uebung: {
      name: "Range-Runde",
      wiederholungen: 9,
      schritte: [
        "Fairway festlegen: die Zone zwischen zwei Fahnen.",
        "Abschlag mit dem Driver, dann ein Eisen aufs Grün.",
        "Jeder Ball ein anderer Schlag, mit voller Routine.",
        "Treffer zählen und notieren.",
      ],
    },
    kennzahlen: [],
    quellen: ["richtig-ueben:REV1", "richtig-ueben:CI1", "richtig-ueben:AY1", "richtig-ueben:AY2", "richtig-ueben:FB1", "richtig-ueben:FB2", "richtig-ueben:AY3"],
    beleg: "zwei-quellen",
  },
  {
    id: "ueben-aufwaermen",
    pfad: "ueben",
    level: "einsteiger",
    titel: "Aufwärmen und Beweglichkeit",
    kern: "Aufwärmen mit Bewegung statt mit langem Dehnen im Stehen.",
    bild: "probeschwung",
    karten: [
      { text: "Statisches Dehnen direkt vor dem Spiel kostete in einer Studie ca. 4 % Schlägertempo und ca. 6 % Länge. Auch die Genauigkeit litt." },
      { text: "Dynamisches Aufwärmen mit Bewegungen und Schwüngen erhöhte dagegen das Tempo. Ein Golf-Aufwärmprogramm steigerte es in einer Studie über sieben Wochen." },
      { text: "Laut TPI haben viele Schwungfehler körperliche Gründe. Drei einfache Selbsttests: Zehen berühren, tiefe Kniebeuge, Drehung im Sitzen.", bild: "selbsttests" },
      { text: "Die Tests sind nur ein Hinweis, keine Diagnose. Bei Schmerzen frag eine Ärztin, einen Arzt oder die Physiotherapie." },
      { text: "Beweglichkeit zählt: Wer keine tiefe Kniebeuge mit Fersen am Boden schafft, kann die Haltung im Abschwung kaum halten. Eine Studie fand einen Zusammenhang zwischen Zehenberührungs-Test und Early Extension (Hüfte schiebt zum Ball)." },
      { text: "Für die Weite zählt Kraft: Krafttraining brachte in Studien nach etwa acht Wochen ca. 4 % mehr Schlägertempo. Beweglichkeit hing in einer Meta-Analyse nicht mit dem Tempo zusammen." },
      { text: "Golf ist verletzungsarm (ca. 2,5 pro 1.000 Runden), der untere Rücken die häufigste Beschwerdestelle. Profis mit Rückenschmerz hatten weniger Innenrotation der vorderen Hüfte. Aufwärmen und Pausen können entlasten." },
    ],
    quiz: {
      frage: "Wie wärmst du dich vor der Runde am besten auf?",
      antworten: ["Lange Dehnpositionen halten", "Gar nicht, gleich mit dem Driver los", "Mit Bewegungen und Probeschwüngen"],
      richtig: 2,
      erklaerung: "Dynamisch aufwärmen erhöht das Tempo. Langes Dehnen im Stehen kostete in Studien Tempo und Länge.",
    },
    uebung: {
      name: "Aufwärmen 10 Minuten",
      wiederholungen: 1,
      schritte: [
        "Eine Minute gehen, dann Arme und Schultern kreisen.",
        "Rumpf drehen, Schläger hinter den Schultern, 10× je Seite.",
        "Ausfallschritte mit Drehung und Beinpendel, je 5–10×.",
        "Probeschwünge: erst halb, dann dreiviertel, dann voll.",
      ],
    },
    kennzahlen: [],
    quellen: ["mental-und-fitness:WU1", "mental-und-fitness:WU2", "mental-und-fitness:WU3", "mental-und-fitness:TPI1", "mental-und-fitness:TPI3", "mental-und-fitness:TPI4", "mental-und-fitness:INJ2", "mental-und-fitness:INJ3", "mental-und-fitness:INJ4", "mental-und-fitness:UTH2021", "mental-und-fitness:BRE2024", "mental-und-fitness:KUI2024", "mental-und-fitness:VAD2004"],
    beleg: "studie",
  },
  {
    id: "ueben-app",
    pfad: "ueben",
    level: "einsteiger",
    titel: "Üben mit dieser App",
    kern: "Filmen, eine Baustelle wählen, üben – und nach ein bis zwei Wochen neu filmen.",
    bild: "appAblauf",
    karten: [
      { text: "Filmen: frontal oder von hinten, Handy auf Hüfthöhe, der ganze Körper im Bild. Dann eine Baustelle wählen – die erste Karte, nicht alle gleichzeitig." },
      { text: "Üben: die Übung der Karte im Übungsmodus, danach den Schwunggedanken auf der Range. Nach ein bis zwei Wochen neu filmen und vergleichen." },
      { text: "Wie oft Rückmeldung (etwa ein Video) beim Lernen hilft, ist nicht eindeutig: Neuere Meta-Analysen fanden weder für seltene noch für selbst gewählte Rückmeldung einen klaren Vorteil." },
      { text: "Video-Unterricht wirkt mit Verzögerung: In einer Studie mit 30 Golfern spielten die Unterrichtsgruppen direkt danach schlechter, nach zwei Wochen besser. Am besten die Video-Gruppe." },
      { text: "Vor dem Blick ins Video selbst schätzen: „Was war wohl der Fehler?“ Dann in der App nachsehen." },
      { text: "Beim Chippen half Rückmeldung am meisten, wenn sie nur kam, sobald der Fehler außerhalb von 10 % lag, plus ein Hinweis, was zu ändern ist. So arbeiten die Baustellen-Karten." },
      { text: "Ob die Übung wirkt, zeigt Meine Schwünge → Fortschritt: je Kennzahl deine Werte über dem grünen Zielbereich." },
    ],
    quiz: {
      frage: "Was sagt die Forschung, wie oft man Rückmeldung bekommen sollte?",
      antworten: ["Nach jedem Schlag ist am besten", "Möglichst nie", "Das ist nicht eindeutig geklärt"],
      richtig: 2,
      erklaerung: "Meta-Analysen fanden weder für seltene noch für selbst gewählte Rückmeldung einen klaren Vorteil. Du entscheidest, wann du filmst.",
    },
    kennzahlen: [],
    quellen: ["richtig-ueben:FB1", "richtig-ueben:FB3", "richtig-ueben:GUA2002", "richtig-ueben:SMI1997"],
    beleg: "studie",
  },
];

// ---------------------------------------------------------------
// Ballflug-Helfer (Lektion „Die neun Ballflüge“): Start und Kurve wählen → Name und Ursache.
// Grundlage: Ballfluggesetze nach TrackMan – die Fläche bestimmt den Start, das Verhältnis
// Fläche ↔ Bahn die Kurve (docs/wissen/ballflug-und-fehler.md, Tabelle „Die neun Ballflüge“).
// ---------------------------------------------------------------
export const BALLFLUG_AUSWAHL = {
  start: [{ wert: "links", text: "links" }, { wert: "gerade", text: "zum Ziel" }, { wert: "rechts", text: "rechts" }],
  kurve: [{ wert: "links", text: "nach links" }, { wert: "gerade", text: "keine" }, { wert: "rechts", text: "nach rechts" }],
};

export const BALLFLUG_NAMEN = {
  links: { links: "Pull-Hook", gerade: "Pull", rechts: "Pull-Slice" },
  gerade: { links: "Draw", gerade: "Gerade", rechts: "Fade" },
  rechts: { links: "Push-Draw", gerade: "Push", rechts: "Push-Slice" },
};

const START_SATZ = {
  links: "Die Schlagfläche zeigte im Treffmoment links vom Ziel.",
  gerade: "Die Schlagfläche zeigte im Treffmoment etwa zum Ziel.",
  rechts: "Die Schlagfläche zeigte im Treffmoment rechts vom Ziel.",
};
const KURVE_SATZ = {
  links: "Sie war zur Schwungbahn geschlossen – deshalb die Kurve nach links.",
  gerade: "Sie passte zur Schwungbahn – deshalb fliegt der Ball ohne Kurve.",
  rechts: "Sie war zur Schwungbahn offen – deshalb die Kurve nach rechts.",
};
// Zusatz je Ballflug: Einordnung und die Lektion, die weiterhilft
const BALLFLUG_ZUSATZ = {
  "gerade-gerade": { text: "Fläche und Bahn zeigten zum Ziel – genau so soll es sein." },
  "gerade-links": { text: "Eine leichte Kurve ist gewollt. Kurvt der Ball stark, heißt es Hook.", lektion: "ball-weitere" },
  "gerade-rechts": { text: "Eine leichte Kurve ist gewollt. Kurvt der Ball stark, heißt es Slice.", lektion: "ball-slice" },
  "links-links": { text: "Links gestartet und weiter nach links: ein Hook.", lektion: "ball-weitere" },
  "links-gerade": { text: "Häufiger Grund: Die Schultern zeigen nach links.", lektion: "ball-weitere" },
  "links-rechts": { text: "Typischer Slice: Die Bahn kam von außen, noch weiter links als die Fläche.", lektion: "ball-slice" },
  "rechts-links": { text: "Die Bahn kam von innen, noch weiter rechts als die Fläche." },
  "rechts-gerade": { lektion: "ball-weitere" },
  "rechts-rechts": { text: "Rechts gestartet und weiter nach rechts: ein Slice.", lektion: "ball-slice" },
};

// start, kurve = "links" | "gerade" | "rechts" → { name, saetze, lektion } oder null
export function ballflugErgebnis(start, kurve) {
  // Object.hasOwn: nur die eigenen Schlüssel – "toString" & Co. zählen nicht als Richtung
  if (!Object.hasOwn(BALLFLUG_NAMEN, start) || !Object.hasOwn(BALLFLUG_NAMEN[start], kurve)) return null;
  const name = BALLFLUG_NAMEN[start][kurve];
  const zusatz = BALLFLUG_ZUSATZ[`${start}-${kurve}`];
  return {
    name,
    saetze: [START_SATZ[start], KURVE_SATZ[kurve], zusatz.text].filter(Boolean),
    lektion: zusatz.lektion || null,
  };
}

// ---------------------------------------------------------------
// Kleine Hilfsfunktionen
// ---------------------------------------------------------------
export function lektion(id) {
  return LEKTIONEN.find((l) => l.id === id) || null;
}

// Baustellen-Karte → „📖 Lektion dazu“. Gehört eine Kennzahl zu mehreren Lektionen,
// gilt die hier gewählte (Entscheidung Marcel, 01.10.); sonst die eine passende Lektion.
const LEKTION_FUER_KENNZAHL = {
  armeAnsprechen: "start-haltung",
  gewicht: "voll-finish",
  vorneigungHalten: "voll-treffmoment",
  hueftBall: "voll-treffmoment",
};

// Kennzahl-ID (z. B. "tempo") → Lektion oder null (für 4 Kennzahlen gibt es noch keine)
export function lektionZurKennzahl(kennzahlId) {
  if (Object.hasOwn(LEKTION_FUER_KENNZAHL, kennzahlId)) return lektion(LEKTION_FUER_KENNZAHL[kennzahlId]);
  const passend = LEKTIONEN.filter((l) => l.kennzahlen.includes(kennzahlId));
  return passend.length === 1 ? passend[0] : null;
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
