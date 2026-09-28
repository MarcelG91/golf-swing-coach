// ===============================================================
// Golf Swing Coach – Etappe 1 bis 5 + Technik-Tipps + mehrere Schwünge + Speichern
// Video(s) laden, Skelett zeichnen, Schwungphasen erkennen, Schwung bewerten,
// Tipps zu Armen, Oberkörperhaltung und Drehung mit Messlinien im Video.
// Mehrere Videos oder lange Videos mit mehreren Schlägen → Gesamtauswertung.
// Schwünge auf dem Gerät speichern und wieder öffnen (Etappe 8).
// ===============================================================

// MediaPipe (von Google) erkennt 33 Körperpunkte in einem Bild.
// Wir laden es direkt aus dem Internet (CDN), installieren müssen wir nichts.
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

// Alle Schwünge in einem Video finden und einzeln auswerten – Phasen, Kennzahlen,
// Technik (siehe schwuenge.js, nutzt phasen.js, kennzahlen.js und technik.js)
import { findeSchwuenge } from "./schwuenge.js";
// Zusammenfassung über mehrere Schwünge (siehe gesamtauswertung.js)
import { gesamtauswertung } from "./gesamtauswertung.js";
// Kategorien + wichtigste Baustellen (siehe technik.js)
import { ordneEin, wichtigsteBaustellen, KATEGORIEN } from "./technik.js";
// Rote Abweichungen und gelbe Ideallinien im Video (siehe ideallinien.js)
import { ideallinien, MIT_LINIE } from "./ideallinien.js";
// Schnelle Analyse durch Abspielen statt Springen (siehe videoanalyse.js)
import { analysiereVideo, springe } from "./videoanalyse.js";
// Offline-Prüfung (siehe pwa.js)
import { meldeOfflineBereitschaft, pruefeOfflineDateien, dateiname, APP_VERSION } from "./pwa.js";
// Schwünge auf dem Gerät speichern (siehe speicher.js und videokuerzen.js)
import {
  clipGrenzen,
  schwungZumSpeichern,
  speichereSitzung,
  ladeSitzungen,
  ladeSchwuengeDerSitzung,
  ladeMedium,
  loescheSchwung,
  loescheSitzung,
  speicherBelegung,
  ladeMedienGroessen,
  loescheVideosUndBilder,
  loescheAlles,
  zaehleBilder,
  sitzungenAelterAls,
} from "./speicher.js";
import { kannKuerzen, schneideClip } from "./videokuerzen.js";
import { LEVEL, LEVEL_OPTIONEN, anzahlBaustellen, fuerLevel, levelVorschlag } from "./level.js";
// Kurze Tipps (Kurzzeile, Warum, Schwunggedanke, Übung) und die Skala auf den Karten
import { tipp, gutText, skala, skalaPosition } from "./tipps.js";
// Kleine Strichfigur aus deinen Posedaten für die Karten (ohne Springen im Video)
import { strichfigur } from "./strichfigur.js";
// Strichfiguren zu den Übungen (Übungsmodus)
import { bildZuSchritt, zeichnung, gesamtDauer } from "./uebungsbilder.js";

const MP_MODUL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const WASM_URL = `${MP_MODUL}/wasm`;
// "full" ist genauer als "lite" und für Videoanalyse schnell genug.
const MODELL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";

const BILD_DAUER = 1 / 30; // ein Einzelbild bei 30 Bildern pro Sekunde

// Die vier Phasen mit deutschen Namen und kurzer Erklärung
const PHASEN = [
  { schluessel: "ansprechen", name: "Ansprechen", info: "Ausgangsposition am Ball" },
  { schluessel: "top", name: "Top", info: "Höchster Punkt im Rückschwung" },
  { schluessel: "treffmoment", name: "Treffmoment", info: "Schläger trifft den Ball" },
  { schluessel: "finish", name: "Finish", info: "Endposition nach dem Schwung" },
];

// --- Elemente aus index.html holen ---
const $ = (id) => document.getElementById(id);
const videoInput = $("videoInput");
const statusText = $("status");
const buehne = $("buehne");
const video = $("video");
const canvas = $("overlay");
const steuerung = $("steuerung");
const playPauseBtn = $("playPause");
const zurueckBtn = $("zurueck");
const vorBtn = $("vor");
const tempoSelect = $("tempo");
const skelettAn = $("skelettAn");
const analysierenBtn = $("analysieren");
const ergebnisBox = $("ergebnis");
const phasenKnoepfe = $("phasenKnoepfe");
const ansichtInfo = $("ansichtInfo");
const kennzahlenListe = $("kennzahlenListe");
const baustellenListe = $("baustellenListe");
const selbstCheckListe = $("selbstCheckListe");
const selbstCheckTitel = $("selbstCheckTitel");
const warnungenListe = $("warnungen");
const exportierenBtn = $("exportieren");
const uebersichtBox = $("uebersicht");
const gesamtListe = $("gesamtListe");
const schwungListe = $("schwungListe");
const einzelBox = $("einzel");
const schwungTitel = $("schwungTitel");
// Etappe 8: Speichern und Meine Schwünge
const zuAnalyseBtn = $("zuAnalyse");
const zuGespeichertBtn = $("zuGespeichert");
const zuEinstellungenBtn = $("zuEinstellungen");
const analyseBereich = $("analyseBereich");
const gespeichertBereich = $("gespeichertBereich");
const einstellungenBereich = $("einstellungenBereich");
const levelAnzeige = $("levelAnzeige");
const levelAuswahl = $("levelAuswahl");
const levelVorschlagBox = $("levelVorschlag");
// Wisch-Karten und Schwunggedanke
const gedankeBox = $("gedankeBox");
const gedankeText = $("gedankeText");
const kartenZaehler = $("kartenZaehler");
const kartenPunkte = $("kartenPunkte");
// Übungsmodus (Vollbild)
const uebungsmodus = $("uebungsmodus");
const uebungTitel = $("uebungTitel");
const uebungZuBtn = $("uebungZu");
const uebungFortschritt = $("uebungFortschritt");
const uebungBild = $("uebungBild");
const uebungTakt = $("uebungTakt");
const uebungSchrittNr = $("uebungSchrittNr");
const uebungSchritt = $("uebungSchritt");
const uebungZaehlerBtn = $("uebungZaehler");
const uebungZurueckBtn = $("uebungZurueck");
const uebungWeiterBtn = $("uebungWeiter");
const speichernBox = $("speichernBox");
const speichernDatum = $("speichernDatum");
const speichernSchlaeger = $("speichernSchlaeger");
const speichernNotiz = $("speichernNotiz");
const speichernAuswahl = $("speichernAuswahl");
const speichernKnopf = $("speichernKnopf");
const gespeichertBox = $("gespeichertBox");
const gespeichertInfo = $("gespeichertInfo");
const schwungLoeschenBtn = $("schwungLoeschen");
const sitzungLoeschenBtn = $("sitzungLoeschen");
const belegungText = $("belegung");
const sitzungsListe = $("sitzungsListe");
// Speicher verwalten: Videos löschen, alles löschen
const videosSitzungLoeschenBtn = $("videosSitzungLoeschen");
const datenUebersicht = $("datenUebersicht");
const videosAuswahl = $("videosAuswahl");
const videosLoeschenBtn = $("videosLoeschen");
const allesLoeschenBtn = $("allesLoeschen");
const datenMeldung = $("datenMeldung");
const loeschDialog = $("loeschDialog");
const loeschTitel = $("loeschTitel");
const loeschWeg = $("loeschWeg");
const loeschBleibt = $("loeschBleibt");
const loeschHakenZeile = $("loeschHakenZeile");
const loeschHaken = $("loeschHaken");
const loeschBestaetigen = $("loeschBestaetigen");

const ctx = canvas.getContext("2d");
const zeichner = new DrawingUtils(ctx);

let poseLandmarker = null;
let poseStatus = "laedt"; // "laedt" | "bereit" | "fehler"
let genutzterRechner = ""; // "GPU" (Grafikchip) oder "CPU" (Prozessor)
let poseFehlerText = "";
let letzterZeitstempel = -1;
let analyseLaeuft = false;
let videoName = "";

// Ergebnis der letzten Analyse: alle Bilder mit Körperpunkten + Bewertung
let analyseBilder = [];
let bewertung = null;
let technik = null; // Arme, Oberkörper, Drehung (technik.js)
let phasenErgebnis = null; // Zeitpunkte von Ansprechen, Top, Treffmoment, Finish
let alleKennzahlen = []; // alle Kennzahlen mit Kennung, Kategorie und Videomoment
let aktuellerGedanke = ""; // Schwunggedanke der wichtigsten Baustelle (wird mit der Sitzung gespeichert)
// Welche Kennzahl gerade per "Im Video zeigen" eingezeichnet wird
let aktiveMessung = null;

// Mehrere Videos / mehrere Schwünge
let dateien = []; // ausgewählte Videodateien
let geladeneDatei = null; // welche davon gerade im Videoplayer steckt
let videoAdresse = null;
let alleSchwuenge = []; // alle gefundenen Schwünge aus allen Videos (siehe schwuenge.js)
let aktuellerSchwung = null; // welcher davon gerade im Detail zu sehen ist

// Speichern (Etappe 8)
let gespeicherteSitzung = null; // aus "Meine Schwünge" geöffnet? (null = frisch analysiert)
let schonGespeichert = false; // verhindert, dass dieselbe Analyse zweimal gespeichert wird
let aktuellesLevel = LEVEL_OPTIONEN.some((option) => option.wert === localStorage.getItem("level"))
  ? localStorage.getItem("level")
  : null;

// Ergebnis der letzten Analyse vergessen (neues Video, neue Analyse)
function setzeErgebnisZurueck() {
  analyseBilder = [];
  bewertung = null;
  technik = null;
  phasenErgebnis = null;
  aktiveMessung = null;
  alleKennzahlen = [];
  aktuellerGedanke = "";
  ergebnisBox.hidden = true;
}

// Farben im Video
const GRUEN = "#4ade80"; // Skelett und alles im Zielbereich
const ROT = "#ef4444"; // Körperlinie außerhalb des Zielbereichs
const GELB = "#facc15"; // Ideallinie: hier sollte die Linie liegen

// Liegt eine Kennzahl außerhalb des Zielbereichs?
const ausserhalb = (k) => k.bewertung === "verbessern" || k.bewertung === "achtung";

function setStatus(text) {
  statusText.textContent = text;
}

// Zahlen deutsch formatieren: 0.93 → "0,93"
function zahl(wert, stellen = 2) {
  return wert.toFixed(stellen).replace(".", ",");
}

// ---------------------------------------------------------------
// 1. Pose-Erkennung laden (erst mit Grafikkarte, sonst mit Prozessor)
// ---------------------------------------------------------------
async function ladePoseErkennung() {
  setzePoseStatus("laedt");
  // Welche Dateien MediaPipe auf diesem Gerät braucht (mit/ohne SIMD) –
  // das wird lokal entschieden, dafür ist kein Internet nötig.
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  const benoetigt = [MP_MODUL, vision.wasmLoaderPath, vision.wasmBinaryPath, MODELL_URL];

  let letzterFehler = null;
  for (const delegate of ["GPU", "CPU"]) {
    try {
      poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODELL_URL, delegate },
        runningMode: "VIDEO",
        numPoses: 1, // nur eine Person: du
      });
      genutzterRechner = delegate;
      setzePoseStatus("bereit");
      setStatus(
        video.src
          ? "Pose-Erkennung bereit. Tippe auf „Analysieren“."
          : "Bereit. Wähle ein Schwungvideo aus."
      );
      // Im Hintergrund prüfen, ob alles für den Offline-Betrieb gespeichert ist
      meldeOfflineBereitschaft(benoetigt);
      return;
    } catch (fehler) {
      letzterFehler = fehler;
      console.warn(`Pose-Erkennung mit ${delegate} fehlgeschlagen:`, fehler);
    }
  }

  // Beide Versuche gescheitert: genau sagen, woran es liegt
  const { fehlend } = await pruefeOfflineDateien(benoetigt);
  if (fehlend.length) {
    poseFehlerText =
      `Die Pose-Erkennung ist auf diesem Gerät nicht vollständig gespeichert ` +
      `(fehlt: ${fehlend.map(dateiname).join(", ")}). Öffne die App einmal mit Internet ` +
      `und warte, bis unten „Offline bereit ✓“ steht.`;
  } else {
    poseFehlerText =
      `Die Pose-Erkennung konnte nicht geladen werden (${letzterFehler?.message || "unbekannter Fehler"}). ` +
      `Internetverbindung prüfen und die App neu öffnen.`;
  }
  setzePoseStatus("fehler");
  setStatus(poseFehlerText);
}

// Der Analysieren-Knopf ist nur aktiv, wenn die Pose-Erkennung bereit ist
function setzePoseStatus(neu) {
  poseStatus = neu;
  const texte = {
    laedt: "⏳ Pose-Erkennung lädt …",
    bereit: "🔍 Analysieren",
    fehler: "⚠️ Pose-Erkennung fehlt",
  };
  analysierenBtn.textContent = texte[neu];
  analysierenBtn.disabled = neu !== "bereit" || analyseLaeuft;
}

// ---------------------------------------------------------------
// 2. Ein Videobild analysieren und das Skelett zeichnen
// ---------------------------------------------------------------
// Verkleinerte Kopie des Videobilds. Das Modell rechnet intern ohnehin nur mit
// 256 × 256 Pixeln – bei großen Handyvideos (1080p, 4K) spart das Rechenzeit.
const kleineLeinwand = document.createElement("canvas");
const kleinCtx = kleineLeinwand.getContext("2d");
const KLEIN_MAX_SEITE = 720;

// quelle = video (Originalbild) oder kleineLeinwand (verkleinerte Kopie)
function erkennePose(quelle = video) {
  let bild = video;
  if (quelle === kleineLeinwand) {
    kleinCtx.drawImage(video, 0, 0, kleineLeinwand.width, kleineLeinwand.height);
    bild = kleineLeinwand;
  }
  // MediaPipe verlangt stetig steigende Zeitstempel, auch wenn wir im Video zurückspulen.
  const zeitstempel = Math.max(performance.now(), letzterZeitstempel + 1);
  letzterZeitstempel = zeitstempel;
  const ergebnis = poseLandmarker.detectForVideo(bild, zeitstempel);
  return ergebnis.landmarks[0] || null; // Körperpunkte der ersten (einzigen) Person
}

// Misst die Erkennung mit Originalbild und mit verkleinerter Kopie – das Schnellere gewinnt
function waehleSchnellsteQuelle() {
  const skala = Math.min(1, KLEIN_MAX_SEITE / Math.max(video.videoWidth, video.videoHeight));
  kleineLeinwand.width = Math.round(video.videoWidth * skala);
  kleineLeinwand.height = Math.round(video.videoHeight * skala);
  const kandidaten = skala < 1 ? [kleineLeinwand, video] : [video];
  let beste = { quelle: video, ms: Infinity };
  for (const quelle of kandidaten) {
    erkennePose(quelle); // Aufwärmen
    const start = performance.now();
    for (let i = 0; i < 3; i++) erkennePose(quelle);
    const ms = (performance.now() - start) / 3;
    if (ms < beste.ms) beste = { quelle, ms };
  }
  return beste;
}

function analysiereAktuellesBild() {
  if (!poseLandmarker || video.readyState < 2 || analyseLaeuft) return;
  // Nach der Analyse nehmen wir die gespeicherten Punkte: Dann passen Skelett
  // und Messlinien genau zu den Werten in der Bewertung.
  const gespeichert = gespeichertesBild(video.currentTime);
  zeichneSkelett(gespeichert ? gespeichert.punkte : erkennePose());
}

// Das analysierte Bild zu einer Zeit im Video (oder null)
function gespeichertesBild(zeit) {
  const bild = analyseBilder[Math.round(zeit / BILD_DAUER)];
  return bild && bild.punkte && Math.abs(bild.zeit - zeit) < BILD_DAUER / 2 ? bild : null;
}

function zeichneSkelett(punkte) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!punkte) return;

  // Was gehört in dieses Bild? (Abweichungen einer Phase oder "Im Video zeigen")
  const auswahl = technikImBild();
  const ansprechen = auswahl && gespeichertesBild(phasenErgebnis.ansprechen.zeit)?.punkte;
  const linien = [];
  if (ansprechen) {
    for (const k of auswahl.kennzahlen) {
      const l = ideallinien(k, punkte, ansprechen, technik);
      if (l) linien.push({ k, ...l });
    }
  }
  // Bei "Selbst prüfen" bleibt das Bild frei, damit du deinen Körper gut siehst
  const skelettZeigen = skelettAn.checked && !auswahl?.ohneSkelett;

  if (skelettZeigen) {
    // Linienstärke an die Videogröße anpassen, damit es in HD nicht zu dünn wirkt
    const staerke = Math.max(2, canvas.width / 250);
    zeichner.drawConnectors(punkte, PoseLandmarker.POSE_CONNECTIONS, {
      color: GRUEN,
      lineWidth: staerke,
    });
    // Punkte weiß, damit Gelb nur für die Ideallinie steht
    zeichner.drawLandmarks(punkte, {
      color: "#ffffff",
      radius: staerke * 0.8,
    });
    // Der Kopfkreis vom Ansprechen entfällt, wenn eine gelbe Kopf-Ideallinie kommt
    const kopfIdeal = linien.some((l) => ["kopfhoehe", "kopfSeitlich"].includes(l.k.id) && ausserhalb(l.k));
    if (!kopfIdeal) zeichneKopfMarke(staerke);
  }
  if (auswahl) zeichneAbweichungen(linien, auswahl, punkte);
}

// Welche Kennzahlen sollen im gerade gezeigten Videobild eingezeichnet werden?
function technikImBild() {
  if (!technik || !phasenErgebnis) return null;
  const imBild = (zeit) => Math.abs(video.currentTime - zeit) < BILD_DAUER / 2;

  // 1. "Im Video zeigen" / "Selbst prüfen": genau diese eine Kennzahl
  if (aktiveMessung && imBild(aktiveMessung.zeit)) {
    return {
      titel: aktiveMessung.titel,
      kennzahlen: aktiveMessung.kennzahl ? [aktiveMessung.kennzahl] : [],
      ohneSkelett: aktiveMessung.ohneSkelett,
    };
  }
  // 2. Video steht auf einer Schwungphase: alle Abweichungen dieser Phase
  if (!video.paused) return null;
  const phase = PHASEN.find((p) => imBild(phasenErgebnis[p.schluessel].zeit));
  if (!phase) return null;
  const sichtbare = fuerLevel(alleKennzahlen, aktuellesLevel).sichtbar;
  const gemessen = sichtbare.filter((k) => k.phase === phase.schluessel && MIT_LINIE.has(k.id));
  if (gemessen.length === 0) return null;
  const abweichungen = gemessen.filter(ausserhalb);
  return {
    titel: abweichungen.length
      ? `${phase.name}: ${abweichungen.map((k) => k.name).join(", ")}`
      : `${phase.name}: alles im Zielbereich ✓`,
    kennzahlen: abweichungen,
    alleGut: abweichungen.length === 0,
  };
}

// Gestrichelter Kreis: Dort war dein Kopf beim Ansprechen
function zeichneKopfMarke(staerke) {
  if (!bewertung) return;
  const { kopfBeimAnsprechen, seitenverhaeltnis } = bewertung;
  const x = (kopfBeimAnsprechen.x / seitenverhaeltnis) * canvas.width;
  const y = kopfBeimAnsprechen.y * canvas.height;
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = staerke;
  ctx.setLineDash([staerke * 3, staerke * 2]);
  ctx.beginPath();
  ctx.arc(x, y, canvas.height * 0.045, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------
// Abweichungen einzeichnen
// Rot = deine Körperlinie außerhalb des Zielbereichs, Gelb = Ideallinie.
// (Bei "Im Video zeigen" einer guten Kennzahl ist die Linie grün.)
// ---------------------------------------------------------------
function zeichneAbweichungen(linien, auswahl, punkte) {
  const px = (p) => ({ x: p.x * canvas.width, y: p.y * canvas.height });
  const staerke = Math.max(3, canvas.width / 160);

  const linie = ({ von, bis }, farbe, breite) => {
    const a = px(von), b = px(bis);
    ctx.strokeStyle = farbe;
    ctx.lineWidth = breite;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };
  const kreis = ({ mitte, radius }, farbe, breite) => {
    const m = px(mitte);
    ctx.strokeStyle = farbe;
    ctx.lineWidth = breite;
    ctx.beginPath();
    ctx.arc(m.x, m.y, Math.max(radius * canvas.height, breite * 1.5), 0, Math.PI * 2);
    ctx.stroke();
  };

  ctx.save();
  ctx.lineCap = "round";
  // Dunkler Schatten, damit die Linien auch auf hellem Hintergrund gut sichtbar sind
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = staerke;
  // Erst deine Linien (rot/grün), darüber die Ideallinien (gelb) –
  // so bleibt Gelb auch dort sichtbar, wo beide übereinanderliegen.
  for (const { k, ist, istKreise } of linien) {
    const farbe = ausserhalb(k) ? ROT : GRUEN;
    for (const l of ist) linie(l, farbe, staerke * 1.6);
    for (const c of istKreise) kreis(c, farbe, staerke);
  }
  for (const { k, ideal, idealKreise } of linien) {
    if (!ausserhalb(k)) continue;
    for (const l of ideal) linie(l, GELB, staerke * 1.2);
    for (const c of idealKreise) kreis(c, GELB, staerke);
  }
  // Pfeile: von deiner roten Linie in Richtung der gelben Ideallinie
  for (const { k, pfeile } of linien) {
    if (!ausserhalb(k)) continue;
    for (const p of pfeile || []) zeichnePfeil(px(p.von), px(p.bis), staerke);
  }

  // Beschriftung oben links
  const schrift = Math.max(14, canvas.height * 0.028);
  let legende = "rot = außerhalb des Zielbereichs · gelb = Ideallinie · Pfeil = so korrigieren";
  if (auswahl.ohneSkelett) legende = "Schau selbst hin – das Skelett ist ausgeblendet";
  else if (auswahl.alleGut) legende = "Alle hier gemessenen Linien liegen im Zielbereich";
  else if (auswahl.kennzahlen.length === 0) legende = "Dafür gibt es keine Linie im Bild";
  else if (!auswahl.kennzahlen.some(ausserhalb)) legende = "grün = im Zielbereich";
  const zeilen = [auswahl.titel, legende];
  ctx.shadowBlur = 0;
  ctx.font = `600 ${schrift}px -apple-system, BlinkMacSystemFont, sans-serif`;
  const breite = Math.min(canvas.width - schrift, Math.max(...zeilen.map((z) => ctx.measureText(z).width)) + schrift);
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.fillRect(schrift * 0.5, schrift * 0.5, breite, schrift * 2.9);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(zeilen[0], schrift, schrift * 1.6, breite - schrift);
  ctx.font = `${schrift * 0.75}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText(zeilen[1], schrift, schrift * 2.8, breite - schrift);

  // Sprechblasen mit dem Hinweis, was zu tun ist – nicht über der Beschriftung
  const beschriftung = { x: 0, y: 0, w: breite + schrift, h: schrift * 3.6 };
  const blasen = linien.filter(({ k, hinweis, anker }) => ausserhalb(k) && hinweis && anker);
  // Was die Blasen möglichst nicht verdecken sollen: rote/gelbe Linien und Pfeile
  // (wichtig) sowie die Körperpunkte (weniger wichtig)
  const hindernisse = punkte.map((p) => ({ ...px(p), gewicht: 1 }));
  const abtasten = ({ von, bis }) => {
    for (let t = 0; t <= 1; t += 0.125) {
      hindernisse.push({ x: (von.x + (bis.x - von.x) * t) * canvas.width, y: (von.y + (bis.y - von.y) * t) * canvas.height, gewicht: 4 });
    }
  };
  for (const { k, ist, ideal, pfeile, istKreise } of linien) {
    if (!ausserhalb(k)) continue;
    [...ist, ...ideal, ...(pfeile || [])].forEach(abtasten);
    for (const c of istKreise) hindernisse.push({ ...px(c.mitte), gewicht: 4 });
  }
  zeichneSprechblasen(
    blasen.map(({ hinweis, anker }) => ({ text: hinweis, anker: px(anker) })),
    [beschriftung],
    hindernisse
  );
  ctx.restore();
}

// Weißer Pfeil mit Spitze. Sehr kurze Pfeile werden etwas verlängert,
// damit man die Richtung trotzdem erkennt.
function zeichnePfeil(von, bis, staerke) {
  const dx = bis.x - von.x, dy = bis.y - von.y;
  const laenge = Math.hypot(dx, dy);
  if (laenge < 1) return;
  const spitze = staerke * 3;
  const l = Math.max(laenge, spitze * 2.5);
  const ux = dx / laenge, uy = dy / laenge;
  const ende = { x: von.x + ux * l, y: von.y + uy * l };
  const basis = { x: ende.x - ux * spitze, y: ende.y - uy * spitze };

  ctx.save();
  ctx.setLineDash([]);
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = staerke;
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = staerke * 0.9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(von.x, von.y);
  ctx.lineTo(basis.x, basis.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ende.x, ende.y);
  ctx.lineTo(basis.x - uy * spitze * 0.6, basis.y + ux * spitze * 0.6);
  ctx.lineTo(basis.x + uy * spitze * 0.6, basis.y - ux * spitze * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Sprechblasen: Text in einem weißen Kästchen mit gelbem Rand und einem
// Zipfel, der auf deine rote Linie zeigt. Für jede Blase werden viele Plätze
// rund um den Punkt ausprobiert; gewählt wird der, der am wenigsten verdeckt.
function zeichneSprechblasen(eintraege, belegt, hindernisse) {
  const f = Math.max(13, canvas.height * 0.022);
  const rand = f * 0.4;
  const maxBreite = Math.min(canvas.width * 0.6, f * 15);
  const begrenze = (wert, min, max) => Math.max(min, Math.min(max, wert));
  const ueberlappung = (a, b) =>
    Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
    Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

  ctx.save();
  ctx.setLineDash([]);
  ctx.font = `600 ${f}px -apple-system, BlinkMacSystemFont, sans-serif`;
  for (const { text, anker } of eintraege) {
    const zeilen = umbrechen(text, maxBreite - 2 * rand);
    const w = Math.max(...zeilen.map((z) => ctx.measureText(z).width)) + 2 * rand;
    const h = zeilen.length * f * 1.25 + rand * 1.2;

    // Plätze in 8 Richtungen und 4 Abständen um den Punkt herum bewerten
    let beste = null;
    for (const abstand of [2, 4, 6.5, 9.5].map((a) => a * f)) {
      for (let r = 0; r < 8; r++) {
        const winkel = (r * Math.PI) / 4 - Math.PI / 2; // oben zuerst
        const dx = Math.cos(winkel), dy = Math.sin(winkel);
        const mx = anker.x + dx * (abstand + (w / 2) * Math.abs(dx));
        const my = anker.y + dy * (abstand + (h / 2) * Math.abs(dy));
        const b = {
          x: begrenze(mx - w / 2, rand, canvas.width - w - rand),
          y: begrenze(my - h / 2, rand, canvas.height - h - rand),
          w,
          h,
        };
        let kosten = abstand / f; // lieber nah am Punkt
        for (const p of hindernisse) {
          if (p.x > b.x - rand && p.x < b.x + w + rand && p.y > b.y - rand && p.y < b.y + h + rand) kosten += p.gewicht * 2;
        }
        for (const o of belegt) kosten += (ueberlappung(b, o) / (w * h)) * 400;
        // Der Punkt selbst darf nicht unter der Blase verschwinden
        if (anker.x > b.x && anker.x < b.x + w && anker.y > b.y && anker.y < b.y + h) kosten += 200;
        if (!beste || kosten < beste.kosten) beste = { ...b, kosten };
      }
    }
    const blase = beste;
    belegt.push(blase);

    // Zipfel: vom nächsten Punkt am Kästchen Richtung Anker
    const rx = begrenze(anker.x, blase.x + rand, blase.x + w - rand);
    const ry = begrenze(anker.y, blase.y, blase.y + h);
    const zx = anker.x - rx, zy = anker.y - ry;
    const zl = Math.hypot(zx, zy);
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = f * 0.4;
    ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
    if (zl > f * 0.8) {
      const ux = zx / zl, uy = zy / zl;
      const spitze = { x: anker.x - ux * f * 0.5, y: anker.y - uy * f * 0.5 };
      ctx.beginPath();
      ctx.moveTo(rx - uy * f * 0.45, ry + ux * f * 0.45);
      ctx.lineTo(spitze.x, spitze.y);
      ctx.lineTo(rx + uy * f * 0.45, ry - ux * f * 0.45);
      ctx.closePath();
      ctx.fill();
    }
    // Kästchen mit runden Ecken und gelbem Rand
    rundesRechteck(blase.x, blase.y, w, h, rand * 1.5);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = GELB;
    ctx.lineWidth = Math.max(2, f * 0.15);
    ctx.stroke();
    ctx.fillStyle = "#111827";
    zeilen.forEach((z, i) => ctx.fillText(z, blase.x + rand, blase.y + rand * 0.6 + f * (1 + i * 1.25) - f * 0.15));
  }
  ctx.restore();
}

// Text in Zeilen aufteilen, die höchstens maxBreite breit sind
function umbrechen(text, maxBreite) {
  const zeilen = [];
  let zeile = "";
  for (const wort of text.split(" ")) {
    const probe = zeile ? `${zeile} ${wort}` : wort;
    if (zeile && ctx.measureText(probe).width > maxBreite) {
      zeilen.push(zeile);
      zeile = wort;
    } else {
      zeile = probe;
    }
  }
  if (zeile) zeilen.push(zeile);
  return zeilen;
}

function rundesRechteck(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---------------------------------------------------------------
// 3. Während das Video läuft: jedes neue Bild analysieren
// ---------------------------------------------------------------
function schleife() {
  if (video.paused || video.ended) return;
  analysiereAktuellesBild();
  // requestVideoFrameCallback meldet sich genau bei jedem neuen Videobild
  if ("requestVideoFrameCallback" in video) {
    video.requestVideoFrameCallback(schleife);
  } else {
    requestAnimationFrame(schleife);
  }
}

// ---------------------------------------------------------------
// 4. Alle ausgewählten Videos analysieren (Ablauf pro Video in videoanalyse.js)
// ---------------------------------------------------------------

// Springt zu einer Zeit im Video und wartet, bis das Bild wirklich da ist
const springeZu = (zeit) => springe(video, zeit);

// Eine Datei in den Videoplayer laden und warten, bis Größe und Länge bekannt sind.
// Steckt sie schon drin, passiert nichts (spart Zeit beim Wechseln zwischen Schwüngen).
function ladeDatei(datei) {
  if (geladeneDatei === datei) return Promise.resolve();
  geladeneDatei = datei;
  videoName = datei.name;
  return new Promise((fertig, fehler) => {
    video.addEventListener("loadedmetadata", () => fertig(), { once: true });
    video.addEventListener("error", () => fehler(new Error(`„${datei.name}“ lässt sich nicht abspielen`)), { once: true });
    const neueAdresse = URL.createObjectURL(datei);
    video.src = neueAdresse; // Video bleibt auf deinem Gerät
    if (videoAdresse) URL.revokeObjectURL(videoAdresse);
    videoAdresse = neueAdresse;
  });
}

// Video aus dem Player nehmen und seine Browser-Adresse freigeben. Sonst hält der
// Browser die Videodatei im Arbeitsspeicher fest – auch nachdem sie gelöscht wurde.
function gibVideoFrei() {
  video.pause();
  video.removeAttribute("src");
  video.load(); // Player leert sich und lässt die Datei los
  if (videoAdresse) URL.revokeObjectURL(videoAdresse);
  videoAdresse = null;
  geladeneDatei = null;
}

// Das Video, das gerade im Player steckt, Bild für Bild durchgehen.
// vorsilbe = z. B. "Video 2 von 3 · " für die Statuszeile
async function analysiereGeladenesVideo(vorsilbe) {
  await springeZu(0);
  const { quelle, ms } = waehleSchnellsteQuelle();

  let letzteMeldung = 0;
  const lauf = await analysiereVideo(video, () => erkennePose(quelle), {
    msProBild: ms,
    bildDauer: BILD_DAUER,
    beiFortschritt: (zeit, msBild, tempo, punkte) => {
      // Skelett und Anzeige nur ca. 5-mal pro Sekunde erneuern – jedes Zeichnen kostet Zeit
      const jetzt = performance.now();
      if (jetzt - letzteMeldung < 200) return;
      letzteMeldung = jetzt;
      zeichneSkelett(punkte);
      const prozent = Math.min(100, Math.round((zeit / video.duration) * 100));
      const rest = tempo ? Math.ceil((video.duration - zeit) / tempo) : null;
      setStatus(
        `${vorsilbe}Analysiere … ${prozent} %` +
          (rest !== null ? ` · noch ca. ${rest} s` : "") +
          ` · ${Math.round(msBild)} ms pro Bild`
      );
    },
  });
  return { ...lauf, verkleinert: quelle === kleineLeinwand };
}

async function analysiereAlles() {
  if (poseStatus !== "bereit") {
    setStatus(poseFehlerText || "Die Pose-Erkennung lädt noch – einen Moment.");
    return;
  }
  if (dateien.length === 0) {
    setStatus("Wähle zuerst oben ein Video aus.");
    return;
  }
  video.pause();
  analyseLaeuft = true;
  setzeKnoepfeAktiv(false);
  setzeErgebnisZurueck();
  alleSchwuenge = [];
  const nichtLesbar = [];
  let sekunden = 0;
  let letzterLauf = null;

  for (const [nr, datei] of dateien.entries()) {
    const vorsilbe = dateien.length > 1 ? `Video ${nr + 1} von ${dateien.length} · ` : "";
    try {
      await ladeDatei(datei);
    } catch {
      nichtLesbar.push(datei.name); // z. B. Format, das dieser Browser nicht kann
      continue;
    }
    const lauf = await analysiereGeladenesVideo(vorsilbe);
    sekunden += lauf.sekunden;
    letzterLauf = lauf;

    // Alle Schwünge in diesem Video finden. Jeder Schwung merkt sich sein Video –
    // und alle Bilder des Videos, damit das Skelett später überall passt.
    const seitenverhaeltnis = video.videoWidth / video.videoHeight;
    for (const schwung of findeSchwuenge(lauf.bilder, seitenverhaeltnis)) {
      alleSchwuenge.push({ ...schwung, datei, videoBilder: lauf.bilder });
    }
  }
  // Fortlaufend nummerieren – über alle Videos hinweg
  alleSchwuenge.forEach((s, i) => (s.nummer = i + 1));

  video.playbackRate = Number(tempoSelect.value); // Abspieltempo wieder wie eingestellt
  analyseLaeuft = false;
  setzeKnoepfeAktiv(true);

  const hinweisNichtLesbar = nichtLesbar.length ? ` Nicht lesbar: ${nichtLesbar.join(", ")}.` : "";
  if (!letzterLauf) {
    setStatus(`Kein Video ließ sich abspielen. Probiere es als MP4 oder in Safari.${hinweisNichtLesbar}`);
    return;
  }

  zeigeUebersicht();
  gespeicherteSitzung = null;
  schonGespeichert = false;
  zeigeSpeicherKaesten();
  // Zuerst den ersten Schwung zeigen, der sich auswerten ließ
  await waehleSchwung(alleSchwuenge.find((s) => s.phasen) || alleSchwuenge[0]);

  // Diese Werte helfen bei der Fehlersuche, falls die Analyse langsam ist
  const messwerte =
    `${zahl(sekunden, 1)} s · ${Math.round(letzterLauf.msProBild)} ms pro Bild · ` +
    `${genutzterRechner || "?"}${letzterLauf.verkleinert ? " · verkleinert" : ""} · ${letzterLauf.verfahren}`;
  const anzahl = alleSchwuenge.filter((s) => s.phasen).length;
  const gefunden = alleSchwuenge.length > 1 || dateien.length > 1 ? `${anzahl} Schwünge gefunden. ` : "";
  setStatus(`${gefunden}Analyse fertig (${messwerte}).${hinweisNichtLesbar}`);
}

// ---------------------------------------------------------------
// 4b. Mehrere Schwünge: Gesamtauswertung und Liste
// ---------------------------------------------------------------

// Sekunden als Minuten:Sekunden, z. B. 74 → "1:14"
const uhrzeit = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const ANSICHT_NAME = { frontal: "Von vorne (frontal)", hinten: "Von hinten (entlang der Ziellinie)" };

function zeigeUebersicht() {
  // Nur ein Schwung? Dann sieht alles aus wie früher – ohne Gesamtauswertung.
  uebersichtBox.hidden = alleSchwuenge.length < 2;
  schwungTitel.hidden = alleSchwuenge.length < 2;
  ergebnisBox.hidden = false;
  if (alleSchwuenge.length < 2) return;

  // 1. Gesamtauswertung, getrennt nach Ansicht
  gesamtListe.innerHTML = "";
  const gefilterteSchwuenge = alleSchwuenge.map((s) => ({
    ...s,
    kennzahlen: fuerLevel(s.kennzahlen || [], aktuellesLevel).sichtbar,
  }));
  const gruppen = gesamtauswertung(gefilterteSchwuenge, anzahlBaustellen(aktuellesLevel));
  const nichtGezaehlt = alleSchwuenge.filter((s) => !s.sicher).length;
  if (nichtGezaehlt) {
    const hinweis = document.createElement("p");
    hinweis.className = "hinweis";
    hinweis.textContent = `${nichtGezaehlt} ${nichtGezaehlt === 1 ? "Schwung zählt" : "Schwünge zählen"} nicht mit, weil die Erkennung unsicher war (⚠️ in der Liste unten).`;
    gesamtListe.appendChild(hinweis);
  }
  if (gruppen.length === 0) {
    const hinweis = document.createElement("p");
    hinweis.className = "karte unsicher";
    hinweis.textContent = "Kein Schwung ließ sich sicher auswerten – schau dir die Schwünge unten einzeln an.";
    gesamtListe.appendChild(hinweis);
  }
  for (const gruppe of gruppen) {
    const titel = document.createElement("h3");
    titel.textContent = `${ANSICHT_NAME[gruppe.ansicht]} · ${gruppe.anzahl} ${gruppe.anzahl === 1 ? "Schwung" : "Schwünge"}`;
    gesamtListe.appendChild(titel);

    const baustellen = document.createElement("div");
    baustellen.className = "kennzahlen";
    if (gruppe.baustellen.length === 0) {
      const lob = document.createElement("p");
      lob.className = "karte gut";
      lob.textContent = "Keine Baustelle, die sich wiederholt – stark!";
      baustellen.appendChild(lob);
    }
    gruppe.baustellen.forEach((k, i) => baustellen.appendChild(baueKarte(k, { nummer: i + 1, offen: true })));
    gesamtListe.appendChild(baustellen);

    // Alle Kennzahlen zum Aufklappen, nach Bereichen sortiert
    const details = document.createElement("details");
    const zusammenfassung = document.createElement("summary");
    zusammenfassung.textContent = "Alle Kennzahlen dieser Ansicht";
    details.appendChild(zusammenfassung);
    const liste = document.createElement("div");
    liste.className = "kennzahlen";
    for (const kategorie of KATEGORIEN) {
      const inKategorie = gruppe.kennzahlen.filter((k) => k.kategorie === kategorie.schluessel);
      if (inKategorie.length === 0) continue;
      const ueberschrift = document.createElement("h4");
      ueberschrift.textContent = kategorie.name;
      liste.appendChild(ueberschrift);
      for (const k of inKategorie) liste.appendChild(baueKarte(k));
    }
    details.appendChild(liste);
    gesamtListe.appendChild(details);
  }

  // 2. Liste aller Schwünge – ein Knopf pro Schwung
  schwungListe.innerHTML = "";
  for (const s of alleSchwuenge) {
    const knopf = document.createElement("button");
    knopf.dataset.nummer = s.nummer;
    const wann = s.phasen ? ` · bei ${uhrzeit(s.phasen.treffmoment.zeit)}` : "";
    const ansicht = s.ansicht ? ` · ${s.ansicht === "frontal" ? "von vorne" : "von hinten"}` : "";
    knopf.innerHTML = `<strong></strong><small></small>`;
    knopf.querySelector("strong").textContent = `${s.sicher ? "" : "⚠️ "}Schwung ${s.nummer}`;
    knopf.querySelector("small").textContent =
      `${videoNameVon(s)}${wann}${ansicht}` + (s.sicher ? "" : " · zählt nicht mit");
    knopf.addEventListener("click", async () => {
      await waehleSchwung(s);
      buehne.scrollIntoView({ behavior: "smooth", block: "center" }); // hoch zum Video
    });
    schwungListe.appendChild(knopf);
  }
}

// Name des Originalvideos. Gespeicherte Schwünge ohne Clip (siehe unten) haben keine
// Datei, aber den Namen in ihren Daten.
const videoNameVon = (s) => s.datei?.name ?? s.videoName;

// Einen Schwung im Detail zeigen: sein Video laden, Phasen und Bewertung anzeigen
async function waehleSchwung(s) {
  for (const knopf of schwungListe.children) {
    knopf.classList.toggle("aktiv", Number(knopf.dataset.nummer) === s.nummer);
  }
  aktiveMessung = null;
  aktuellerSchwung = s;
  if (s.datei) {
    await ladeDatei(s.datei);
  } else {
    // Ohne Video gespeichert (Gerät konnte keinen Clip aufnehmen) oder Video
    // später gelöscht: nur die Auswertung zeigen
    gibVideoFrei();
    buehne.hidden = steuerung.hidden = true;
  }
  analyseBilder = s.videoBilder;
  schwungTitel.textContent = `Schwung ${s.nummer} · ${videoNameVon(s)}`;

  if (!s.phasen) {
    // Hier ließ sich kein Schwung erkennen (z. B. Person nicht ganz im Bild)
    phasenErgebnis = bewertung = technik = null;
    alleKennzahlen = [];
    einzelBox.hidden = true;
    // Bei nur einem Video mit einem Schwung gibt es sonst nichts zu zeigen
    if (alleSchwuenge.length < 2) ergebnisBox.hidden = true;
    setStatus(alleSchwuenge.length < 2 ? s.grund : `Schwung ${s.nummer}: ${s.grund}`);
    return;
  }
  phasenErgebnis = s.phasen;
  bewertung = s.bewertung;
  technik = s.technik;
  einzelBox.hidden = false;
  zeigeErgebnis(s.phasen);
  if (!s.sicher && alleSchwuenge.length > 1) {
    const eintrag = document.createElement("li");
    eintrag.textContent = `Dieser Schwung zählt nicht zur Gesamtauswertung: ${s.grund}`;
    warnungenListe.prepend(eintrag);
  }
  zeigeBewertung();
  if (s.datei) await zeigePhase("top", s.phasen);
  else setStatus(`Schwung ${s.nummer}: Für diesen Schwung ist kein Video gespeichert – nur die Auswertung.`);
}

function setzeKnoepfeAktiv(aktiv) {
  // Umschalter auch sperren: Ein Wechsel hält das Video an und würde Analyse/Speichern stören
  for (const knopf of [playPauseBtn, zurueckBtn, vorBtn, videoInput, zuAnalyseBtn, zuGespeichertBtn, zuEinstellungenBtn]) {
    knopf.disabled = !aktiv;
  }
  analysierenBtn.disabled = !aktiv || poseStatus !== "bereit";
}

// ---------------------------------------------------------------
// 5. Ergebnis anzeigen
// ---------------------------------------------------------------
function zeigeErgebnis(ergebnis) {
  // Ein Knopf pro Phase
  phasenKnoepfe.innerHTML = "";
  for (const phase of PHASEN) {
    const knopf = document.createElement("button");
    knopf.dataset.phase = phase.schluessel;
    knopf.innerHTML = `<strong>${phase.name}</strong><small>${zahl(ergebnis[phase.schluessel].zeit)} s · ${phase.info}</small>`;
    knopf.addEventListener("click", () => zeigePhase(phase.schluessel, ergebnis));
    phasenKnoepfe.appendChild(knopf);
  }

  // Hinweise, falls die Erkennung unsicher ist
  warnungenListe.innerHTML = "";
  for (const text of ergebnis.warnungen) {
    const eintrag = document.createElement("li");
    eintrag.textContent = text;
    warnungenListe.appendChild(eintrag);
  }

  ergebnisBox.hidden = false;
}

const STUFEN = {
  gut: "Gut",
  achtung: "Achtung",
  verbessern: "Verbessern",
  unsicher: "Nicht bewertbar",
};

const PHASEN_NAME = Object.fromEntries(PHASEN.map((p) => [p.schluessel, p.name]));

function zeigeBewertung() {
  const { ansicht, ansichtSicher } = bewertung;
  ansichtInfo.textContent =
    (ansicht === "frontal" ? "Ansicht erkannt: frontal (von vorne)." : "Ansicht erkannt: von hinten (entlang der Ziellinie).") +
    (ansichtSicher ? "" : " Die Ansicht ist nicht eindeutig – filme möglichst genau von vorne oder genau von hinten.") +
    ` ${technik.rechtshaender ? "Rechtshänder" : "Linkshänder"}. ${technik.nurAndereAnsicht}`;

  // Alle Kennzahlen (aus kennzahlen.js und technik.js) mit Kategorie und Videomoment
  const alle = [...bewertung.kennzahlen, ...technik.kennzahlen].map(ordneEin);
  alleKennzahlen = alle;
  const { sichtbar, fuerSpaeter } = fuerLevel(alle, aktuellesLevel);

  // 1. Die wichtigsten Baustellen als Wisch-Karten – eine Karte pro Baustelle,
  //    zum Schluss eine Karte "Läuft schon gut"
  baustellenListe.replaceChildren();
  baustellenListe.scrollLeft = 0;
  const baustellen = wichtigsteBaustellen(sichtbar, anzahlBaustellen(aktuellesLevel));
  const rechtshaender = technik.rechtshaender;
  const einsteiger = aktuellesLevel === LEVEL.EINSTEIGER;
  baustellen.forEach((k) => baustellenListe.appendChild(baueBaustellenKarte(k, { rechtshaender, einsteiger })));
  baustellenListe.appendChild(baueGutKarte(sichtbar.filter((k) => k.bewertung === "gut"), {
    rechtshaender,
    keineBaustelle: baustellen.length === 0,
  }));
  aktualisiereKartenPunkte();

  // Schwunggedanke der wichtigsten Baustelle oben hervorheben
  aktuellerGedanke = baustellen.length ? tipp(baustellen[0], rechtshaender)?.gedanke || "" : "";
  gedankeText.textContent = aktuellerGedanke ? `„${aktuellerGedanke}“` : "";
  gedankeBox.hidden = !aktuellerGedanke;

  // 2. Alle Kennzahlen nach Bereichen
  kennzahlenListe.innerHTML = "";

  const aktuelleListe = document.createElement("div");
  aktuelleListe.className = "kennzahlen";
  baueKennzahlenGruppen(aktuelleListe, sichtbar);
  if (aktuellesLevel === LEVEL.KOENNER) kennzahlenListe.appendChild(aktuelleListe);
  else {
    const details = document.createElement("details");
    const zusammenfassung = document.createElement("summary");
    zusammenfassung.textContent = `Alle Kennzahlen dieses Levels (${sichtbar.length})`;
    details.append(zusammenfassung, aktuelleListe);
    kennzahlenListe.appendChild(details);
  }
  if (fuerSpaeter.length) {
    const details = document.createElement("details");
    const zusammenfassung = document.createElement("summary");
    zusammenfassung.textContent = `Für später (${fuerSpaeter.length})`;
    const spaeterListe = document.createElement("div");
    spaeterListe.className = "kennzahlen";
    baueKennzahlenGruppen(spaeterListe, fuerSpaeter);
    details.append(zusammenfassung, spaeterListe);
    kennzahlenListe.appendChild(details);
  }

  // 3. Was die App nicht sicher messen kann: selbst im Video nachschauen
  selbstCheckListe.innerHTML = "";
  const selbstChecks = aktuellesLevel === LEVEL.EINSTEIGER ? [] : technik.selbstChecks;
  selbstCheckTitel.hidden = selbstChecks.length === 0;
  selbstCheckListe.hidden = selbstChecks.length === 0;
  for (const check of selbstChecks) {
    const karte = document.createElement("article");
    karte.className = "karte unsicher";
    karte.innerHTML = `<div class="karte-kopf"><strong></strong></div><p class="text"></p>`;
    karte.querySelector("strong").textContent = check.name;
    karte.querySelector(".text").textContent = check.text;
    karte.appendChild(zeigenKnopf({ ...check, wert: "selbst prüfen", ohneSkelett: true }));
    selbstCheckListe.appendChild(karte);
  }
}

// Gruppen nach Themen sortiert, damit die Karten beim Aufklappen leicht zu finden sind.
function baueKennzahlenGruppen(container, kennzahlen) {
  for (const kategorie of KATEGORIEN) {
    const rang = { verbessern: 0, achtung: 1, unsicher: 2, gut: 3 };
    const inKategorie = kennzahlen
      .filter((k) => k.kategorie === kategorie.schluessel)
      .sort((a, b) => rang[a.bewertung] - rang[b.bewertung]);
    if (inKategorie.length === 0) continue;
    const titel = document.createElement("h4");
    titel.textContent = kategorie.name;
    container.appendChild(titel);
    for (const k of inKategorie) container.appendChild(baueKarte(k));
  }
}

// Kleines Hilfsmittel: Element mit Klasse und Text bauen (Text immer per textContent – sicher)
function neu(tag, klasse = "", text = "") {
  const element = document.createElement(tag);
  if (klasse) element.className = klasse;
  if (text) element.textContent = text;
  return element;
}

// Kompakte Karte für "Alle Kennzahlen" und die Gesamtauswertung:
// Name, Bewertung, Wert und EINE Zeile – Warum, Übung und Messdetails zum Aufklappen.
function baueKarte(k, { nummer = null, offen = false } = {}) {
  const rechtshaender = haendigkeit();
  const karte = neu("article", `karte ${k.bewertung}`);
  const kopf = neu("div", "karte-kopf");
  kopf.append(neu("strong", "", nummer ? `${nummer}. ${k.name}` : k.name), neu("span", "abzeichen", STUFEN[k.bewertung]));
  karte.append(kopf, neu("div", "wert", k.wert));

  const hilfe = ausserhalb(k) ? tipp(k, rechtshaender) : null;
  if (hilfe) karte.append(neu("p", "kurz", hilfe.kurz));
  else if (k.bewertung === "gut") karte.append(neu("p", "kurz", gutText(k, rechtshaender)));
  else karte.append(neu("p", "text", k.text)); // nicht bewertbar: der Grund steht im Text

  const mehr = neu("details");
  mehr.open = offen;
  mehr.append(neu("summary", "", hilfe ? "Warum & Übung" : "Messung"));
  if (hilfe) {
    mehr.append(neu("p", "warum", hilfe.warum), neu("p", "gedanke", `💭 „${hilfe.gedanke}“`));
    if (hilfe.uebung) mehr.append(baueUebung(hilfe.uebung, { offen: true, gedanke: hilfe.gedanke }));
  }
  mehr.append(neu("p", "detail", k.detail));
  karte.append(mehr);
  if (k.phase) karte.append(zeigenKnopf(k));
  return karte;
}

// Große Wisch-Karte für eine Baustelle: Bild, Kurzzeile, Warum, Skala,
// Schwunggedanke, Übung und "Im Video zeigen"
function baueBaustellenKarte(k, { rechtshaender, einsteiger }) {
  const hilfe = tipp(k, rechtshaender);
  const karte = neu("article", `karte baustelle ${k.bewertung}`);
  const kopf = neu("div", "karte-kopf");
  kopf.append(neu("span", "abzeichen", STUFEN[k.bewertung]));
  if (k.phase) kopf.append(neu("span", "moment", `📍 ${PHASEN_NAME[k.phase]}`));
  karte.append(kopf);

  const figur = baueFigur(k);
  if (figur) karte.append(figur);

  karte.append(neu("p", "kurz", hilfe ? hilfe.kurz : k.name));
  const warum = neu("p", "warum");
  warum.append(neu("b", "", "Warum? "), hilfe ? hilfe.warum : k.text);
  karte.append(warum);

  const s = skala(k);
  if (s) karte.append(baueSkala(s, { anzeige: k.wert, ohneZahlen: einsteiger }));
  if (hilfe) {
    karte.append(neu("p", "gedanke", `💭 „${hilfe.gedanke}“`));
    if (hilfe.uebung) karte.append(baueUebung(hilfe.uebung, { gedanke: hilfe.gedanke }));
  }
  if (k.gefuehl) {
    const gefuehl = neu("details");
    gefuehl.append(neu("summary", "", "So fühlt es sich richtig an"), neu("p", "", k.gefuehl));
    karte.append(gefuehl);
  }
  if (k.phase) karte.append(zeigenKnopf(k));
  return karte;
}

// Letzte Wisch-Karte: was schon im Zielbereich liegt
function baueGutKarte(gute, { rechtshaender, keineBaustelle }) {
  const karte = neu("article", "karte baustelle gut");
  const kopf = neu("div", "karte-kopf");
  kopf.append(neu("span", "abzeichen", "Läuft schon gut"));
  karte.append(kopf);
  karte.append(neu("p", "kurz", keineBaustelle ? "Keine größere Baustelle – stark! ✓" : "Das machst du schon richtig ✓"));
  if (keineBaustelle) {
    karte.append(neu("p", "warum", "Filme als Nächstes die andere Ansicht, dann prüft die App weitere Punkte."));
  }
  if (gute.length) {
    const liste = neu("ul", "gut-liste");
    for (const k of gute.slice(0, 5)) liste.append(neu("li", "", gutText(k, rechtshaender)));
    karte.append(liste);
  }
  const alle = neu("button", "zeigen", "Alle Kennzahlen ansehen ›");
  alle.addEventListener("click", () => {
    // Nur die umschließende Box "Alle Kennzahlen …" aufklappen (bei Könnern gibt es keine)
    kennzahlenListe.querySelector(":scope > details")?.setAttribute("open", "");
    kennzahlenListe.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  karte.append(alle);
  return karte;
}

// Übung: aufklappbar, Schritte als nummerierte Liste
function baueUebung(uebung, { offen = false, gedanke = "" } = {}) {
  const block = neu("details", "uebung");
  block.open = offen;
  block.append(neu("summary", "", `▶ Übung: ${uebung.name} · ${uebung.wiederholungen}×`));
  const schritte = neu("ol");
  for (const schritt of uebung.schritte) schritte.append(neu("li", "", schritt));
  const starten = neu("button", "haupt starten", "Mit Bildern üben (Vollbild)");
  starten.addEventListener("click", () => oeffneUebung(uebung, gedanke));
  block.append(schritte, starten);
  return block;
}

// ---------------------------------------------------------------
// Übungsmodus: Vollbild, ein Schritt pro Seite mit Strichfigur, am Ende ein Zähler
// Die Figuren kommen aus uebungsbilder.js (Profi-Posen, geprüft per Test).
// ---------------------------------------------------------------
let aktiveUebung = null; // { daten, gedanke, schritt, anzahl, vorherFokus }
let uebungAnimation = null; // Nummer von requestAnimationFrame – zum Anhalten
let bildschirmSperre = null; // Wake Lock: hält den Bildschirm an, solange geübt wird

function oeffneUebung(daten, gedanke) {
  aktiveUebung = { daten, gedanke, schritt: 0, anzahl: 0, vorherFokus: document.activeElement };
  uebungTitel.textContent = daten.name;
  uebungsmodus.hidden = false;
  document.body.classList.add("ohne-scrollen"); // Seite dahinter soll nicht mitscrollen
  bildschirmAnlassen();
  zeigeUebungsSchritt();
  uebungZuBtn.focus();
}

function schliesseUebung() {
  if (!aktiveUebung) return;
  halteUebungsbildAn();
  uebungsmodus.hidden = true;
  document.body.classList.remove("ohne-scrollen");
  bildschirmFreigeben();
  aktiveUebung.vorherFokus?.focus?.();
  aktiveUebung = null;
}

function zeigeUebungsSchritt() {
  const { daten, schritt, anzahl, gedanke } = aktiveUebung;
  const zaehlseite = schritt === daten.schritte.length;
  const fertig = anzahl >= daten.wiederholungen;

  // Fortschritt oben: ein Strich pro Seite (alle Schritte + Zählseite)
  uebungFortschritt.replaceChildren(...[...daten.schritte, null].map((_, i) => neu("i", i <= schritt ? "fertig" : "")));

  halteUebungsbildAn();
  if (zaehlseite) {
    uebungBild.hidden = true;
    uebungTakt.textContent = "";
    uebungSchrittNr.textContent = gedanke ? `💭 „${gedanke}“` : "";
    uebungSchritt.textContent = fertig ? "Geschafft! Stark. ✓" : "Jetzt üben – tippe nach jeder Wiederholung.";
    uebungZaehlerBtn.hidden = false;
    uebungZaehlerBtn.replaceChildren(neu("span", "zahl", fertig ? "✓" : String(anzahl)), neu("small", "", `von ${daten.wiederholungen}`));
    uebungZaehlerBtn.setAttribute("aria-label", `Wiederholung zählen, ${anzahl} von ${daten.wiederholungen}`);
  } else {
    const bild = bildZuSchritt(daten.name, schritt);
    uebungBild.hidden = !bild;
    if (bild) zeigeUebungsbild(bild);
    else uebungTakt.textContent = "";
    uebungSchrittNr.textContent = `Schritt ${schritt + 1} von ${daten.schritte.length}`;
    uebungSchritt.textContent = daten.schritte[schritt];
    uebungZaehlerBtn.hidden = true;
  }
  uebungZurueckBtn.disabled = schritt === 0;
  uebungWeiterBtn.textContent = zaehlseite ? "Fertig" : schritt === daten.schritte.length - 1 ? "Los geht's ›" : "Weiter ›";
}

// Figur zeichnen – als Animation, solange der Übungsmodus offen ist.
// Wer im System "Bewegung reduzieren" eingestellt hat, sieht nur das Endbild.
function zeigeUebungsbild(bild) {
  const rechtshaender = haendigkeit();
  const ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const letzte = bild.folge[bild.folge.length - 1];
  const endbild = gesamtDauer(bild) - (letzte.halten || 0);
  if (bild.folge.length === 1 || ruhig) {
    zeichneUebungsbild(zeichnung(bild, ruhig ? endbild : 0, rechtshaender));
    return;
  }
  const start = performance.now();
  let zuletzt = 0;
  const bildchen = (jetzt) => {
    uebungAnimation = requestAnimationFrame(bildchen);
    if (jetzt - zuletzt < 33) return; // ca. 30 Bilder pro Sekunde reichen und schonen den Akku
    zuletzt = jetzt;
    zeichneUebungsbild(zeichnung(bild, jetzt - start, rechtshaender));
  };
  uebungAnimation = requestAnimationFrame(bildchen);
}

function halteUebungsbildAn() {
  if (uebungAnimation) cancelAnimationFrame(uebungAnimation);
  uebungAnimation = null;
}

// Linien, Kreise, Rechtecke und Texte aus uebungsbilder.js als SVG zeichnen
function zeichneUebungsbild({ ausschnitt: a, elemente, text }) {
  const huelle = document.createElement("div");
  huelle.innerHTML = "<svg></svg>"; // fester Text – den Namensraum liefert der Browser
  const svg = huelle.firstChild;
  const SVG = svg.namespaceURI;
  svg.setAttribute("viewBox", `${a.x} ${a.y} ${a.breite} ${a.hoehe}`);
  const setze = (element, werte) => { for (const [name, wert] of Object.entries(werte)) element.setAttribute(name, wert); };
  for (const el of elemente) {
    let neuesElement;
    if (el.art === "linie") {
      neuesElement = document.createElementNS(SVG, "line");
      setze(neuesElement, { x1: el.von[0], y1: el.von[1], x2: el.bis[0], y2: el.bis[1], stroke: el.farbe, "stroke-width": el.breite, "stroke-linecap": "round" });
      if (el.gestrichelt) neuesElement.setAttribute("stroke-dasharray", "7 6");
    } else if (el.art === "kreis") {
      neuesElement = document.createElementNS(SVG, "circle");
      setze(neuesElement, { cx: el.mitte[0], cy: el.mitte[1], r: el.radius, stroke: el.farbe, "stroke-width": el.breite, fill: el.fuellen ? el.farbe : "#0b1812" });
    } else if (el.art === "rechteck") {
      neuesElement = document.createElementNS(SVG, "rect");
      setze(neuesElement, { x: el.x, y: el.y, width: el.breite, height: el.hoehe, rx: 5, stroke: el.farbe, "stroke-width": 2, fill: el.farbe, "fill-opacity": 0.1 });
    } else if (el.art === "text") {
      neuesElement = document.createElementNS(SVG, "text");
      setze(neuesElement, { x: el.bei[0], y: el.bei[1], fill: el.farbe, "font-size": 12, "text-anchor": "middle" });
      neuesElement.textContent = el.inhalt;
    }
    svg.append(neuesElement);
  }
  uebungBild.replaceChildren(svg);
  uebungTakt.textContent = text;
}

// Bildschirm anlassen (Wake Lock). Kann nicht jeder Browser – dann geht es einfach ohne.
async function bildschirmAnlassen() {
  if (!("wakeLock" in navigator) || bildschirmSperre) return;
  try {
    bildschirmSperre = await navigator.wakeLock.request("screen");
    bildschirmSperre.addEventListener("release", () => { bildschirmSperre = null; });
  } catch (fehler) {
    console.warn("Bildschirm kann nicht angelassen werden:", fehler);
  }
}

function bildschirmFreigeben() {
  bildschirmSperre?.release().catch((fehler) => console.warn(fehler));
  bildschirmSperre = null;
}

// Balken mit grünem Zielbereich (gelb = Achtung, Rest rot) und einer Marke für deinen Wert
function baueSkala(s, { anzeige, ohneZahlen }) {
  const box = neu("div", "skala");
  const balken = neu("div", "balken");
  // Für Bildschirmleser: der Balken als ein "Bild" mit Beschreibung in Worten
  balken.setAttribute("role", "img");
  balken.setAttribute("aria-label", `${s.name}: ${anzeige}. ${s.ziel}`);
  const zone = ([von, bis], klasse) => {
    const links = skalaPosition(s, von);
    const element = neu("div", `zone ${klasse}`);
    element.style.left = `${links}%`;
    element.style.width = `${skalaPosition(s, bis) - links}%`;
    return element;
  };
  for (const bereich of s.achtung) balken.append(zone(bereich, "achtung"));
  balken.append(zone(s.gut, "gut"));
  const marke = neu("div", "marke");
  marke.style.left = `${skalaPosition(s, s.wert)}%`;
  balken.append(marke);

  const beschriftung = neu("div", "beschriftung");
  const du = neu("span", "", ohneZahlen ? "weißer Strich = du" : `${s.name}: `);
  if (!ohneZahlen) du.append(neu("strong", "", anzeige));
  beschriftung.append(du, neu("span", "", ohneZahlen ? "grün = Ziel" : s.ziel));
  box.append(balken, beschriftung);
  return box;
}

// Strichfigur aus DEINEN Körperpunkten im passenden Moment, mit roter (du) und
// gelber (Ziel) Linie wie im Video. Kein Springen im Video – deshalb sofort da.
function baueFigur(k) {
  if (!k.phase || !MIT_LINIE.has(k.id) || !phasenErgebnis || !technik) return null;
  let figur;
  try {
    const bild = gespeichertesBild(phasenErgebnis[k.phase].zeit);
    const ansprechen = gespeichertesBild(phasenErgebnis.ansprechen.zeit);
    if (!bild || !ansprechen) return null;
    const linien = ideallinien(k, bild.punkte, ansprechen.punkte, technik);
    figur = strichfigur(bild.punkte, linien, technik.seitenverhaeltnis || 1);
  } catch (fehler) {
    // Z. B. gespeicherter Schwung ohne Posedaten: dann eben ohne Bild
    console.warn("Strichfigur nicht möglich:", fehler);
    return null;
  }
  const { ausschnitt: a, staerke } = figur;
  // Die SVG-Fläche baut der Browser aus festem Text. Ihren Namensraum (namespaceURI)
  // brauchen Linien und Kreise – so muss keine Adresse im Code stehen.
  const huelle = document.createElement("div");
  huelle.innerHTML = "<svg></svg>";
  const svg = huelle.firstChild;
  const SVG = svg.namespaceURI;
  svg.setAttribute("viewBox", `${a.x} ${a.y} ${a.breite} ${a.hoehe}`);
  svg.setAttribute("aria-hidden", "true");
  const linie = ({ von, bis }, farbe, breite, gestrichelt = false) => {
    const l = document.createElementNS(SVG, "line");
    for (const [name, wert] of [["x1", von.x], ["y1", von.y], ["x2", bis.x], ["y2", bis.y]]) l.setAttribute(name, wert);
    l.setAttribute("stroke", farbe);
    l.setAttribute("stroke-width", breite);
    l.setAttribute("stroke-linecap", "round");
    if (gestrichelt) l.setAttribute("stroke-dasharray", `${breite * 2} ${breite * 1.6}`);
    svg.append(l);
  };
  const kreis = ({ mitte, radius }, farbe, breite, gestrichelt = false) => {
    const c = document.createElementNS(SVG, "circle");
    c.setAttribute("cx", mitte.x);
    c.setAttribute("cy", mitte.y);
    c.setAttribute("r", Math.max(radius, breite * 1.5));
    c.setAttribute("fill", "none");
    c.setAttribute("stroke", farbe);
    c.setAttribute("stroke-width", breite);
    if (gestrichelt) c.setAttribute("stroke-dasharray", `${breite * 2} ${breite * 1.6}`);
    svg.append(c);
  };
  for (const knochen of figur.knochen) linie(knochen, "#cfe3d6", staerke);
  kreis(figur.kopf, "#cfe3d6", staerke);
  for (const l of figur.rot) linie(l, ROT, staerke * 1.6);
  for (const c of figur.rotKreise) kreis(c, ROT, staerke * 1.3);
  for (const l of figur.gelb) linie(l, GELB, staerke * 1.3, true);
  for (const c of figur.gelbKreise) kreis(c, GELB, staerke * 1.3, true);

  const box = neu("div", "figur");
  const legende = neu("div", "legende");
  legende.append(neu("span", "rot", "du"), neu("span", "gelb", "Ziel"));
  box.append(svg, legende);
  return box;
}

// Punkte unter den Wisch-Karten und "1 von 3" passend zur sichtbaren Karte
function aktualisiereKartenPunkte() {
  const karten = [...baustellenListe.children];
  if (karten.length < 2) {
    kartenPunkte.replaceChildren();
    kartenZaehler.textContent = "";
    return;
  }
  const breite = karten[0].offsetWidth + 12; // 12 = Abstand zwischen den Karten (style.css)
  const nummer = breite > 12 ? Math.min(karten.length - 1, Math.round(baustellenListe.scrollLeft / breite)) : 0;
  if (kartenPunkte.children.length !== karten.length) {
    kartenPunkte.replaceChildren(...karten.map(() => neu("i")));
  }
  [...kartenPunkte.children].forEach((punkt, i) => punkt.classList.toggle("aktiv", i === nummer));
  kartenZaehler.textContent = `${nummer + 1} von ${karten.length} · wischen ›`;
}

// Rechts- oder Linkshänder? Für "linker/rechter Arm" in den Tipps.
function haendigkeit() {
  return technik?.rechtshaender ?? alleSchwuenge.find((s) => s.technik)?.technik.rechtshaender ?? true;
}

function zeigenKnopf(k) {
  const knopf = document.createElement("button");
  knopf.className = "zeigen";
  knopf.textContent = `📍 Im Video zeigen (${PHASEN_NAME[k.phase]})`;
  knopf.addEventListener("click", () => zeigeMessung(k));
  return knopf;
}

// Springt zum passenden Moment und zeichnet die Linie (rot/grün) und die Ideallinie (gelb) ein
async function zeigeMessung(k) {
  if (!geladeneDatei) return; // gespeicherter Schwung ohne Video
  const zeit = phasenErgebnis[k.phase].zeit;
  aktiveMessung = {
    zeit,
    kennzahl: MIT_LINIE.has(k.id) ? k : null,
    titel: `${k.name}: ${k.wert}`,
    ohneSkelett: k.ohneSkelett,
  };
  video.pause();
  buehne.scrollIntoView({ behavior: "smooth", block: "center" });
  await springeZu(zeit);
  analysiereAktuellesBild();
  for (const knopf of phasenKnoepfe.children) {
    knopf.classList.toggle("aktiv", knopf.dataset.phase === k.phase);
  }
  setStatus(`${k.name} – ${PHASEN_NAME[k.phase]} bei ${zahl(zeit)} s`);
}

async function zeigePhase(schluessel, ergebnis) {
  if (!geladeneDatei) return; // gespeicherter Schwung ohne Video
  aktiveMessung = null;
  video.pause();
  await springeZu(ergebnis[schluessel].zeit);
  analysiereAktuellesBild();
  for (const knopf of phasenKnoepfe.children) {
    knopf.classList.toggle("aktiv", knopf.dataset.phase === schluessel);
  }
  const phase = PHASEN.find((p) => p.schluessel === schluessel);
  setStatus(`${phase.name} bei ${zahl(ergebnis[schluessel].zeit)} s`);
}

// Posedaten als Datei speichern – damit können wir die Erkennung später feinjustieren
function exportiereDaten() {
  const daten = {
    video: videoName,
    breite: video.videoWidth,
    hoehe: video.videoHeight,
    bilder: analyseBilder.map((b) => ({
      zeit: Number(b.zeit.toFixed(4)),
      punkte: b.punkte?.map((p) => ({
        x: Number(p.x.toFixed(4)),
        y: Number(p.y.toFixed(4)),
        sichtbar: Number((p.visibility ?? 0).toFixed(2)),
      })) ?? null,
    })),
  };
  const blob = new Blob([JSON.stringify(daten)], { type: "application/json" });
  const link = document.createElement("a");
  const adresse = URL.createObjectURL(blob);
  link.href = adresse;
  link.download = `posedaten-${videoName.replace(/\.[^.]+$/, "") || "schwung"}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(adresse), 60_000);
}

// ---------------------------------------------------------------
// 5b. Speichern (Etappe 8)
// Jeder Schwung wird ein eigener Eintrag mit eigenem kurzem Video. Die "Sitzung"
// hält zusammen, was aus einer Analyse stammt. Die Gesamtauswertung wird beim
// Öffnen einfach neu berechnet – sie muss nicht mitgespeichert werden.
// ---------------------------------------------------------------

// Heutiges Datum als "2026-09-27" – das Format, das <input type="date"> erwartet
function heute() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// "2026-09-27" → "27.09.2026"
const deutschesDatum = (iso) => iso.split("-").reverse().join(".");

// Unter dem Ergebnis: Speichern-Kasten (frisch analysiert) oder Löschen-Kasten (gespeichert)
function zeigeSpeicherKaesten() {
  gespeichertBox.hidden = !gespeicherteSitzung;
  if (gespeicherteSitzung) {
    const { datum, schlaeger, notiz, gedanke } = gespeicherteSitzung;
    gespeichertInfo.textContent = `${deutschesDatum(datum)} · ${schlaeger}${notiz ? ` · ${notiz}` : ""}` +
      `${gedanke ? ` · 💭 „${gedanke}“` : ""}`;
    videosSitzungLoeschenBtn.hidden = !alleSchwuenge.some((s) => s.datei); // noch Videos da?
    speichernBox.hidden = true;
    return;
  }
  // Nur Schwünge mit erkannten Phasen lassen sich speichern
  const speicherbar = alleSchwuenge.filter((s) => s.phasen);
  speichernBox.hidden = schonGespeichert || speicherbar.length === 0;
  speichernDatum.value = heute();
  // Schläger und Notiz bleiben stehen – praktisch, wenn du mit demselben Schläger weitermachst
  speichernAuswahl.innerHTML = "";
  for (const s of speicherbar) {
    const zeile = document.createElement("label");
    zeile.innerHTML = `<input type="checkbox"><span><strong></strong> <small></small></span>`;
    const haken = zeile.querySelector("input");
    haken.checked = s.sicher; // unsichere (Probeschwung? Zeitlupe?) nicht vorausgewählt
    haken.dataset.nummer = s.nummer;
    zeile.querySelector("strong").textContent = `${s.sicher ? "" : "⚠️ "}Schwung ${s.nummer}`;
    zeile.querySelector("small").textContent =
      `${videoNameVon(s)} · ${s.ansicht === "frontal" ? "von vorne" : "von hinten"}`;
    speichernAuswahl.appendChild(zeile);
  }
}

function zeigeLevelAuswahl() {
  levelAuswahl.innerHTML = "";
  for (const option of LEVEL_OPTIONEN) {
    const label = document.createElement("label");
    label.className = option.wert === aktuellesLevel ? "aktiv" : "";
    label.innerHTML = `<input type="radio" name="level" value=""><span class="symbol"></span><strong></strong><small></small>`;
    const radio = label.querySelector("input");
    radio.value = option.wert;
    radio.checked = option.wert === aktuellesLevel;
    label.querySelector(".symbol").textContent = option.symbol;
    label.querySelector("strong").textContent = option.name;
    label.querySelector("small").textContent = option.beschreibung;
    radio.addEventListener("change", () => setzeLevel(option.wert));
    levelAuswahl.appendChild(label);
  }
  levelAnzeige.hidden = !aktuellesLevel;
  levelAnzeige.textContent = aktuellesLevel
    ? `Dein Level: ${LEVEL_OPTIONEN.find((option) => option.wert === aktuellesLevel).symbol} ${LEVEL_OPTIONEN.find((option) => option.wert === aktuellesLevel).name}`
    : "";
}

function setzeLevel(level) {
  if (!LEVEL_OPTIONEN.some((option) => option.wert === level)) return;
  const warNochNichtGewahlt = !aktuellesLevel;
  aktuellesLevel = level;
  aktiveMessung = null;
  localStorage.setItem("level", level);
  localStorage.removeItem("levelVorschlagAb");
  zeigeLevelAuswahl();
  if (bewertung && technik) zeigeBewertung();
  if (bewertung && video.readyState >= 2 && video.paused) analysiereAktuellesBild();
  if (alleSchwuenge.length) zeigeUebersicht();
  if (warNochNichtGewahlt) zeigeBereich("analyse");
}

// Kleines Vorschaubild für die Liste: die Top-Position mit Skelett, als JPEG
async function macheVorschau(s) {
  const zeit = s.phasen.top.zeit;
  await springe(video, zeit, 5000); // bis 5 s warten – iPhone-Videos springen langsam
  const skala = 320 / Math.max(video.videoWidth, video.videoHeight);
  const bild = document.createElement("canvas");
  bild.width = Math.round(video.videoWidth * skala);
  bild.height = Math.round(video.videoHeight * skala);
  const bildCtx = bild.getContext("2d");
  bildCtx.drawImage(video, 0, 0, bild.width, bild.height);
  const punkte = s.videoBilder[Math.round(zeit / BILD_DAUER)]?.punkte;
  if (punkte) {
    new DrawingUtils(bildCtx).drawConnectors(punkte, PoseLandmarker.POSE_CONNECTIONS, { color: GRUEN, lineWidth: 2 });
  }
  // toBlob arbeitet mit einer Rückruf-Funktion – als Promise können wir darauf warten
  return new Promise((fertig) => bild.toBlob(fertig, "image/jpeg", 0.8));
}

async function speichereAuswahl() {
  const nummern = [...speichernAuswahl.querySelectorAll("input:checked")].map((h) => Number(h.dataset.nummer));
  const auswahl = alleSchwuenge.filter((s) => nummern.includes(s.nummer));
  if (!speichernSchlaeger.value) {
    setStatus("Bitte wähle zuerst den Schläger aus.");
    speichernSchlaeger.focus();
    return;
  }
  if (auswahl.length === 0) {
    setStatus("Bitte hake mindestens einen Schwung an.");
    return;
  }

  const zurueck = aktuellerSchwung;
  video.pause();
  // Während des Speicherns läuft das Video durch. Nichts darf dazwischenfunken:
  // kein Zeichnen (wie bei der Analyse), keine Knöpfe. "inert" macht den ganzen
  // Ergebnisbereich vorübergehend unbedienbar.
  analyseLaeuft = true;
  setzeKnoepfeAktiv(false);
  ergebnisBox.inert = true;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const sitzungId = Date.now(); // Speicherzeitpunkt in Millisekunden – eindeutig und sortierbar
  const datum = speichernDatum.value || heute();
  const schlaeger = speichernSchlaeger.value;
  const mitVideo = kannKuerzen();
  let ohneVideo = 0;
  let fehlerText = null;
  try {
    const eintraege = [];
    for (const [i, s] of auswahl.entries()) {
      setStatus(`Speichere Schwung ${i + 1} von ${auswahl.length} …`);
      await ladeDatei(s.datei);
      const vorschau = await macheVorschau(s);
      const grenzen = clipGrenzen(s);
      let clip = null;
      if (mitVideo) {
        try {
          clip = await schneideClip(video, grenzen.start, grenzen.ende, springe);
        } catch (fehler) {
          console.warn("Clip konnte nicht aufgenommen werden:", fehler);
        }
      }
      if (!clip) ohneVideo++;
      const { schwung, posedaten } = schwungZumSpeichern(s, { ...grenzen, versatz: clip?.versatz ?? 0 });
      eintraege.push({
        // In der Sitzung neu durchnummeriert (1, 2, 3 …), auch wenn du nicht alle ausgewählt hast
        schwung: { ...schwung, id: `${sitzungId}-${i + 1}`, sitzungId, nummer: i + 1, datum, schlaeger, appVersion: APP_VERSION },
        posedaten,
        video: clip?.video ?? null,
        vorschau,
      });
    }
    const sitzung = {
      id: sitzungId,
      datum,
      schlaeger,
      notiz: speichernNotiz.value.trim(),
      level: aktuellesLevel,
      gedanke: aktuellerGedanke, // Schwunggedanke, der beim Speichern oben stand
      schwungIds: eintraege.map((e) => e.schwung.id),
      appVersion: APP_VERSION,
    };
    await speichereSitzung(sitzung, eintraege);
    schonGespeichert = true;
    speichernBox.hidden = true;
  } catch (fehler) {
    // Z. B. wenn der Speicher des Geräts voll ist
    console.error(fehler);
    fehlerText = `Speichern hat nicht geklappt (${fehler.message || fehler.name}). Ist der Speicher voll?`;
  }

  analyseLaeuft = false;
  ergebnisBox.inert = false;
  setzeKnoepfeAktiv(true);
  video.playbackRate = Number(tempoSelect.value);
  if (zurueck) await waehleSchwung(zurueck); // wieder den Schwung zeigen, der vorher zu sehen war

  if (fehlerText) setStatus(fehlerText);
  else {
    const anzahl = `${auswahl.length} ${auswahl.length === 1 ? "Schwung" : "Schwünge"}`;
    setStatus(
      `✓ ${anzahl} gespeichert – zu finden unter „Meine Schwünge“.` +
        (ohneVideo ? ` ${ohneVideo} davon ohne Video: Dieses Gerät konnte keinen Clip aufnehmen.` : "")
    );
    zeigeLevelVorschlag(true).catch((fehler) => console.warn("Level-Vorschlag konnte nicht geprüft werden:", fehler));
  }
}

// ---------------------------------------------------------------
// 5c. Meine Schwünge: Liste, Öffnen, Löschen (Etappe 8)
// ---------------------------------------------------------------
let vorschauAdressen = []; // Adressen der Vorschaubilder – werden beim Neuzeichnen freigegeben

// Oben umschalten zwischen "Analyse" und "Meine Schwünge"
function zeigeBereich(welcher) {
  if (!aktuellesLevel) welcher = "einstellungen";
  analyseBereich.hidden = welcher !== "analyse";
  gespeichertBereich.hidden = welcher !== "gespeichert";
  einstellungenBereich.hidden = welcher !== "einstellungen";
  zuAnalyseBtn.classList.toggle("aktiv", welcher === "analyse");
  zuGespeichertBtn.classList.toggle("aktiv", welcher === "gespeichert");
  zuEinstellungenBtn.classList.toggle("aktiv", welcher === "einstellungen");
  if (welcher === "gespeichert") {
    video.pause();
    zeigeMeineSchwuenge().catch((fehler) => {
      console.error(fehler);
      belegungText.textContent = `Die gespeicherten Schwünge ließen sich nicht laden (${fehler.message || fehler.name}).`;
    });
  }
  if (welcher === "einstellungen") {
    datenMeldung.textContent = "";
    zeigeDatenUebersicht();
  }
}

async function zeigeMeineSchwuenge() {
  const belegung = await speicherBelegung();
  belegungText.textContent = belegung
    ? `Die App belegt auf diesem Gerät ${Math.round(belegung.belegt / 1e6)} MB ` +
      `(inkl. Pose-Erkennung, möglich wären ca. ${zahl(belegung.verfuegbar / 1e9, 1)} GB). ` +
      "Platz schaffen kannst du unter ⚙️ Einstellungen."
    : "";

  const sitzungen = await ladeSitzungen();
  const groessen = await ladeMedienGroessen(); // Welche Sitzungen haben noch Videos?
  try {
    await zeigeLevelVorschlag();
  } catch (fehler) {
    console.warn("Level-Vorschlag konnte nicht geladen werden:", fehler);
  }
  vorschauAdressen.forEach((adresse) => URL.revokeObjectURL(adresse));
  vorschauAdressen = [];
  sitzungsListe.innerHTML = "";
  if (sitzungen.length === 0) {
    const leer = document.createElement("p");
    leer.className = "hinweis";
    leer.textContent = "Noch nichts gespeichert. Analysiere ein Video und tippe unten auf „Sitzung speichern“.";
    sitzungsListe.appendChild(leer);
  }
  for (const sitzung of sitzungen) {
    const knopf = document.createElement("button");
    knopf.innerHTML = `<img alt=""><span><strong></strong><small></small></span>`;
    const anzahl = sitzung.schwungIds.length;
    const ohneVideo = zaehleBilder(groessen, sitzung.schwungIds).videos === 0;
    knopf.querySelector("strong").textContent = `${deutschesDatum(sitzung.datum)} · ${sitzung.schlaeger}`;
    knopf.querySelector("small").textContent =
      `${anzahl} ${anzahl === 1 ? "Schwung" : "Schwünge"}` +
      `${sitzung.level ? ` · ${LEVEL_OPTIONEN.find((option) => option.wert === sitzung.level)?.name || ""}` : ""}` +
      `${sitzung.notiz ? ` · ${sitzung.notiz}` : ""}` +
      `${sitzung.gedanke ? ` · 💭 „${sitzung.gedanke}“` : ""}` +
      `${ohneVideo ? " · 📊 nur Kennzahlen" : ""}`;
    // Vorschaubild des ersten Schwungs. createObjectURL macht aus der gespeicherten
    // Datei eine Adresse, die <img> anzeigen kann.
    const vorschau = await ladeMedium(`${sitzung.schwungIds[0]}/vorschau`);
    if (vorschau) {
      const adresse = URL.createObjectURL(vorschau);
      vorschauAdressen.push(adresse);
      knopf.querySelector("img").src = adresse;
    } else {
      // Kein Bild (mehr) da: Platzhalter statt leerem Kasten
      const platzhalter = document.createElement("span");
      platzhalter.className = "ohne-bild";
      platzhalter.textContent = "📊";
      knopf.querySelector("img").replaceWith(platzhalter);
    }
    knopf.addEventListener("click", () => oeffneSitzung(sitzung));
    sitzungsListe.appendChild(knopf);
  }
}

async function zeigeLevelVorschlag(nachSpeichern = false) {
  levelVorschlagBox.hidden = true;
  if (!aktuellesLevel) return;

  const sitzungen = await ladeSitzungen();
  const schwuengeJeSitzung = await Promise.all(sitzungen.map(ladeSchwuengeDerSitzung));
  const schwuenge = schwuengeJeSitzung.flat().filter(Boolean);
  const sichereAnzahl = schwuenge.filter((schwung) => schwung.sicher).length;
  const erneutAb = Number(localStorage.getItem("levelVorschlagAb")) || 0;
  if (sichereAnzahl < 10 || sichereAnzahl < erneutAb) return;

  const vorschlag = levelVorschlag(schwuenge, aktuellesLevel);
  if (!vorschlag) return;
  const neuesLevel = LEVEL_OPTIONEN.find((option) => option.wert === vorschlag.nach);
  const richtung = vorschlag.art === "aufsteigen" ? "Deine Grundlagen sitzen" : "Deine Grundlagen wackeln gerade";
  const hinweis = `${richtung} in etwa ${vorschlag.gruenVonZehn} von 10 Schwüngen. ` +
    (vorschlag.art === "aufsteigen"
      ? `Bereit für ${neuesLevel.symbol} ${neuesLevel.name}?`
      : `Möchtest du eine Zeit lang zurück zu ${neuesLevel.symbol} ${neuesLevel.name}?`);
  const fehlende = vorschlag.fehlendeKennzahlen.length
    ? " Einige Kennzahlen wurden wegen weniger als drei Messungen nicht gewertet, zum Beispiel wenn eine Ansicht noch fehlt."
    : "";

  if (nachSpeichern) {
    if (confirm(`${hinweis}${fehlende}`)) {
      setzeLevel(vorschlag.nach);
      setStatus(`Dein Level ist jetzt ${neuesLevel.symbol} ${neuesLevel.name}.`);
    } else {
      localStorage.setItem("levelVorschlagAb", String(sichereAnzahl + 10));
    }
    return;
  }

  const text = document.createElement("p");
  text.textContent = `${hinweis}${fehlende}`;
  const wechseln = document.createElement("button");
  wechseln.className = "haupt";
  wechseln.textContent = "Level wechseln";
  wechseln.addEventListener("click", () => {
    setzeLevel(vorschlag.nach);
    levelVorschlagBox.hidden = true;
  });
  const spaeter = document.createElement("button");
  spaeter.className = "klein";
  spaeter.textContent = "Noch nicht";
  spaeter.addEventListener("click", () => {
    localStorage.setItem("levelVorschlagAb", String(sichereAnzahl + 10));
    levelVorschlagBox.hidden = true;
  });
  levelVorschlagBox.replaceChildren(text, wechseln, spaeter);
  levelVorschlagBox.hidden = false;
}

// Eine gespeicherte Sitzung in der normalen Analyse-Ansicht öffnen.
// Die gespeicherten Schwünge sehen danach genauso aus wie frisch analysierte –
// deshalb funktionieren Gesamtauswertung, Phasen und "Im Video zeigen" ohne Extra-Code.
async function oeffneSitzung(sitzung) {
  setStatus("Lade gespeicherte Sitzung …");
  try {
    const schwuenge = [];
    for (const eintrag of await ladeSchwuengeDerSitzung(sitzung)) {
      const posedaten = await ladeMedium(`${eintrag.id}/posedaten`);
      const clip = await ladeMedium(`${eintrag.id}/video`);
      schwuenge.push({
        ...eintrag,
        bilder: posedaten,
        videoBilder: posedaten,
        // Als Datei mit dem Namen des Originalvideos – so steht er überall richtig da
        datei: clip ? new File([clip], eintrag.videoName || "Schwung", { type: clip.type }) : null,
      });
    }
    video.pause();
    setzeErgebnisZurueck();
    dateien = [];
    alleSchwuenge = schwuenge;
    gespeicherteSitzung = sitzung;
    zeigeBereich("analyse");
    zeigeUebersicht();
    zeigeSpeicherKaesten();
    window.scrollTo({ top: 0, behavior: "smooth" });
    await waehleSchwung(alleSchwuenge[0]);
    return true;
  } catch (fehler) {
    console.error(fehler);
    setStatus(`Die Sitzung ließ sich nicht öffnen (${fehler.message || fehler.name}).`);
    return false;
  }
}

// ---------------------------------------------------------------
// 5d. Löschen: einzelne Schwünge, Sitzungen, Videos oder alles
// Alles passiert nur in der Datenbank auf diesem Gerät (speicher.js).
// ---------------------------------------------------------------

// "3 Videos", "1 Video" – Anzahl mit passender Einzahl/Mehrzahl
const stueck = (anzahl, eins, mehr) => `${anzahl} ${anzahl === 1 ? eins : mehr}`;
// Bytes als gut lesbare Größe: 3 400 000 → "3,4 MB", 140 000 000 → "140 MB"
const mb = (bytes) => `${zahl(bytes / 1e6, bytes < 1e7 ? 1 : 0)} MB`;

// Während gelöscht wird, alle Lösch-Knöpfe und den Umschalter oben sperren –
// ein zweites Antippen soll nicht dazwischenfunken.
function sperreLoeschKnoepfe(gesperrt) {
  for (const knopf of [videosSitzungLoeschenBtn, schwungLoeschenBtn, sitzungLoeschenBtn, videosLoeschenBtn, allesLoeschenBtn]) {
    knopf.disabled = gesperrt;
  }
  setzeKnoepfeAktiv(!gesperrt);
}

// Eine Lösch-Aktion ausführen: Knöpfe sperren, Fehler verständlich melden, Knöpfe
// immer wieder freigeben (finally). Liefert true, wenn gelöscht wurde.
// Die Datenbank löscht ganz oder gar nicht – "Es wurde nichts gelöscht" stimmt also.
async function loescheMitSperre(aktion, melde = setStatus) {
  sperreLoeschKnoepfe(true);
  try {
    await aktion();
    return true;
  } catch (fehler) {
    console.error(fehler);
    melde(`Löschen hat nicht geklappt (${fehler.message || fehler.name}). Es wurde nichts gelöscht.`);
    return false;
  } finally {
    sperreLoeschKnoepfe(false);
  }
}

// Rückfrage vor dem Löschen: Was wird gelöscht, was bleibt?
// Liefert true nur, wenn "Löschen" angetippt wurde. Abbrechen, Esc oder Wegwischen
// des Fensters liefern false – dann passiert nichts.
// mitHaken: Der Löschen-Knopf wird erst nach dem Häkchen antippbar (für "Alles löschen").
function frageLoeschen({ titel, weg, bleibt, knopf, mitHaken = false }) {
  loeschTitel.textContent = titel;
  for (const [liste, zeilen] of [[loeschWeg, weg], [loeschBleibt, bleibt]]) {
    liste.replaceChildren(
      ...zeilen.map((text) => {
        const eintrag = document.createElement("li");
        eintrag.textContent = text; // Texte immer als Text einsetzen, nie als HTML
        return eintrag;
      })
    );
  }
  loeschHakenZeile.hidden = !mitHaken;
  loeschHaken.checked = false;
  loeschBestaetigen.textContent = knopf;
  loeschBestaetigen.disabled = mitHaken;
  loeschDialog.returnValue = ""; // sonst stünde hier noch die Antwort vom letzten Mal
  loeschDialog.showModal();
  return new Promise((fertig) => {
    loeschDialog.addEventListener("close", () => fertig(loeschDialog.returnValue === "loeschen"), { once: true });
  });
}

// Zeilen für die Rückfrage: welche Videos und Bilder weg sind (nur, was es wirklich gibt)
function bilderZeilen({ videos, vorschauen, bytes }) {
  return [
    videos ? `${stueck(videos, "Video", "Videos")} (ca. ${mb(bytes)})` : null,
    vorschauen ? stueck(vorschauen, "Vorschaubild", "Vorschaubilder") : null,
  ].filter(Boolean);
}

// Was bei "Videos löschen" bleibt – steht so in beiden Rückfragen
const BLEIBT_BEI_VIDEOS = [
  "alle Kennzahlen und Bewertungen",
  "Datum, Schläger und Notiz jeder Sitzung",
  "die Posedaten (nur Zahlen, kein Bild)",
  "dein Level und deine Originalvideos in der Fotos-App",
];

async function loescheAktuellenSchwung() {
  const s = aktuellerSchwung;
  const sitzung = gespeicherteSitzung;
  if (!confirm(`Schwung ${s.nummer} wirklich löschen? Das lässt sich nicht rückgängig machen.`)) return;
  if (!(await loescheMitSperre(() => loescheSchwung(sitzung, s.id)))) return;
  const rest = sitzung.schwungIds.filter((id) => id !== s.id);
  // War es der letzte Schwung, ist auch die Sitzung weg (siehe speicher.js)
  if (rest.length) await oeffneSitzung({ ...sitzung, schwungIds: rest });
  else schliesseGeloeschteSitzung();
}

async function loescheGanzeSitzung() {
  const sitzung = gespeicherteSitzung;
  const anzahl = sitzung.schwungIds.length;
  const frage = `Sitzung vom ${deutschesDatum(sitzung.datum)} mit ${anzahl} ${anzahl === 1 ? "Schwung" : "Schwüngen"} wirklich löschen? Das lässt sich nicht rückgängig machen.`;
  if (!confirm(frage)) return;
  if (!(await loescheMitSperre(() => loescheSitzung(sitzung)))) return;
  schliesseGeloeschteSitzung();
}

// In der geöffneten Sitzung: nur Videos und Vorschaubilder löschen, Kennzahlen bleiben
async function loescheVideosDerSitzung() {
  const sitzung = gespeicherteSitzung;
  let umfang;
  try {
    umfang = zaehleBilder(await ladeMedienGroessen(), sitzung.schwungIds);
  } catch (fehler) {
    console.error(fehler);
    setStatus(`Die gespeicherten Videos ließen sich nicht lesen (${fehler.message || fehler.name}).`);
    return;
  }
  const ja = await frageLoeschen({
    titel: `Videos der Sitzung vom ${deutschesDatum(sitzung.datum)} löschen?`,
    weg: bilderZeilen(umfang),
    bleibt: BLEIBT_BEI_VIDEOS,
    knopf: "Videos löschen",
  });
  if (!ja) return;
  if (!(await loescheMitSperre(() => loescheVideosUndBilder([sitzung])))) return;
  // Neu laden – jetzt ohne Video. Klappt das nicht, das gelöschte Video nicht weiter zeigen.
  if (await oeffneSitzung(sitzung)) {
    setStatus(`✓ Videos gelöscht – ca. ${mb(umfang.bytes)} frei. Die Kennzahlen sind noch da.`);
  } else {
    leereSitzungsAnsicht();
    setStatus("✓ Videos gelöscht. Die Sitzung ließ sich danach nicht neu öffnen – bitte unter „Meine Schwünge“ antippen.");
  }
}

// Einstellungen: Videos und Bilder aller (oder aller alten) Sitzungen löschen
async function loescheVideosAusEinstellungen() {
  datenMeldung.textContent = "";
  const nurAlte = videosAuswahl.value === "alt";
  let sitzungen;
  let groessen;
  try {
    const alle = await ladeSitzungen();
    sitzungen = nurAlte ? sitzungenAelterAls(alle, 30, heute()) : alle;
    groessen = await ladeMedienGroessen();
  } catch (fehler) {
    console.error(fehler);
    datenMeldung.textContent = `Die gespeicherten Daten ließen sich nicht lesen (${fehler.message || fehler.name}).`;
    return;
  }
  const umfang = zaehleBilder(groessen, sitzungen.flatMap((s) => s.schwungIds));
  if (umfang.videos + umfang.vorschauen === 0) {
    datenMeldung.textContent = nurAlte
      ? "In Sitzungen, die älter als 30 Tage sind, liegen keine Videos."
      : "Es sind keine Videos gespeichert.";
    return;
  }
  const betroffen = sitzungen.filter((s) => {
    const { videos, vorschauen } = zaehleBilder(groessen, s.schwungIds);
    return videos + vorschauen > 0;
  });
  const wo = stueck(betroffen.length, "Sitzung", "Sitzungen");
  const ja = await frageLoeschen({
    titel: nurAlte ? `Videos aus ${wo} (älter als 30 Tage) löschen?` : `Videos aus ${wo} löschen?`,
    weg: bilderZeilen(umfang),
    bleibt: BLEIBT_BEI_VIDEOS,
    knopf: "Videos löschen",
  });
  if (!ja) return;
  const melde = (text) => { datenMeldung.textContent = text; };
  if (!(await loescheMitSperre(() => loescheVideosUndBilder(betroffen), melde))) return;
  // Ist eine betroffene Sitzung gerade geöffnet, nimmt sie das Video noch im Speicher mit
  if (gespeicherteSitzung && betroffen.some((s) => s.id === gespeicherteSitzung.id)) leereSitzungsAnsicht();
  melde(`✓ ${stueck(umfang.videos, "Video", "Videos")} gelöscht – ca. ${mb(umfang.bytes)} frei. Die Kennzahlen sind noch da.`);
  await zeigeDatenUebersicht();
}

// Einstellungen: alle gespeicherten Schwünge löschen (nur die Datenbank der App)
async function loescheAllesAusEinstellungen() {
  datenMeldung.textContent = "";
  let sitzungen;
  let groessen;
  try {
    sitzungen = await ladeSitzungen();
    groessen = await ladeMedienGroessen();
  } catch (fehler) {
    console.error(fehler);
    datenMeldung.textContent = `Die gespeicherten Daten ließen sich nicht lesen (${fehler.message || fehler.name}).`;
    return;
  }
  const schwungIds = sitzungen.flatMap((s) => s.schwungIds);
  const ja = await frageLoeschen({
    titel: "Alle gespeicherten Schwünge löschen?",
    weg: [
      `${stueck(sitzungen.length, "Sitzung", "Sitzungen")} mit ${stueck(schwungIds.length, "Schwung", "Schwüngen")}`,
      "alle Kennzahlen, Notizen und Posedaten",
      ...bilderZeilen(zaehleBilder(groessen, schwungIds)),
    ],
    bleibt: [
      "dein Level",
      "die App selbst und die Offline-Dateien (Pose-Erkennung)",
      "deine Originalvideos in der Fotos-App",
      "Dateien, die du exportiert hast",
    ],
    knopf: "Alles löschen",
    mitHaken: true,
  });
  if (!ja) return;
  const melde = (text) => { datenMeldung.textContent = text; };
  if (!(await loescheMitSperre(loescheAlles, melde))) return;
  // "Level-Vorschlag erst wieder ab X Schwüngen" bezog sich auf die gelöschten Schwünge.
  // Nur diesen einen Eintrag entfernen – das Level selbst bleibt.
  localStorage.removeItem("levelVorschlagAb");
  if (gespeicherteSitzung) leereSitzungsAnsicht();
  melde("✓ Alle gespeicherten Schwünge sind gelöscht. Dein Level ist unverändert.");
  await zeigeDatenUebersicht();
}

// Übersicht in den Einstellungen: Was liegt gerade auf dem Gerät?
async function zeigeDatenUebersicht() {
  try {
    const sitzungen = await ladeSitzungen();
    const groessen = await ladeMedienGroessen();
    const schwungIds = sitzungen.flatMap((s) => s.schwungIds);
    const { videos, vorschauen, bytes } = zaehleBilder(groessen, schwungIds);
    datenUebersicht.textContent = sitzungen.length
      ? `Gespeichert: ${stueck(sitzungen.length, "Sitzung", "Sitzungen")} · ` +
        `${stueck(schwungIds.length, "Schwung", "Schwünge")} · ${stueck(videos, "Video", "Videos")} (ca. ${mb(bytes)})`
      : "Noch keine Schwünge gespeichert.";
    videosLoeschenBtn.disabled = videos + vorschauen === 0;
    allesLoeschenBtn.disabled = sitzungen.length === 0 && groessen.size === 0;
  } catch (fehler) {
    console.error(fehler);
    datenUebersicht.textContent = `Die gespeicherten Daten ließen sich nicht lesen (${fehler.message || fehler.name}).`;
  }
}

// Die geöffnete gespeicherte Sitzung aus der Ansicht nehmen (sie wurde gelöscht)
function leereSitzungsAnsicht() {
  gespeicherteSitzung = null;
  alleSchwuenge = [];
  gibVideoFrei();
  setzeErgebnisZurueck();
  buehne.hidden = steuerung.hidden = true;
}

// Nach dem Löschen: alles leeren und zurück zur Liste
function schliesseGeloeschteSitzung() {
  leereSitzungsAnsicht();
  zeigeBereich("gespeichert");
  setStatus("Gelöscht.");
}

// ---------------------------------------------------------------
// 6. Bedienung
// ---------------------------------------------------------------
videoInput.addEventListener("change", () => {
  if (videoInput.files.length === 0) return;
  dateien = [...videoInput.files]; // eine Liste aus allen markierten Videos
  alleSchwuenge = [];
  gespeicherteSitzung = null;
  setzeErgebnisZurueck();
  setStatus(`Lade „${dateien[0].name}“ …`);
  // Das erste Video gleich zeigen. Fehler meldet schon video.addEventListener("error") unten.
  geladeneDatei = null;
  ladeDatei(dateien[0]).catch(() => {});
});

video.addEventListener("loadedmetadata", () => {
  // Leinwand im Seitenverhältnis des Videos, aber höchstens 1280 Pixel breit/hoch:
  // Bei 4K-Videos müsste das Handy sonst bei jedem Bild 8 Millionen Pixel zeichnen.
  const leinwandSkala = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
  canvas.width = Math.round(video.videoWidth * leinwandSkala);
  canvas.height = Math.round(video.videoHeight * leinwandSkala);
  buehne.style.setProperty("--ratio", video.videoWidth / video.videoHeight);
  video.playbackRate = Number(tempoSelect.value);

  buehne.hidden = false;
  steuerung.hidden = false;
  video.currentTime = 0; // löst "seeked" aus → erstes Bild wird analysiert
  // Während der Analyse und beim Wechseln zwischen Schwüngen nicht dazwischenreden
  if (analyseLaeuft || alleSchwuenge.length) return;
  const was = dateien.length > 1 ? `${dateien.length} Videos ausgewählt` : "Video geladen";
  if (poseStatus === "bereit") setStatus(`${was}. Tippe auf „Analysieren“ oder spiel es ab.`);
  else if (poseStatus === "fehler") setStatus(`Video geladen – aber: ${poseFehlerText}`);
  else setStatus("Video geladen. Die Pose-Erkennung lädt noch …");
});

video.addEventListener("error", () => {
  if (!video.getAttribute("src")) return; // Video wurde absichtlich entladen (gibVideoFrei)
  setStatus("Dieses Video kann der Browser nicht abspielen. Probiere es als MP4 oder in Safari.");
});

// Nach Springen / Einzelbild: dieses Bild analysieren
video.addEventListener("seeked", analysiereAktuellesBild);

video.addEventListener("play", () => {
  aktiveMessung = null;
  playPauseBtn.textContent = "⏸ Pause";
  schleife();
});

video.addEventListener("pause", () => {
  playPauseBtn.textContent = "▶︎ Abspielen";
});

playPauseBtn.addEventListener("click", () => {
  if (video.paused) video.play();
  else video.pause();
});

zurueckBtn.addEventListener("click", () => {
  video.pause();
  video.currentTime = Math.max(0, video.currentTime - BILD_DAUER);
});

vorBtn.addEventListener("click", () => {
  video.pause();
  video.currentTime = Math.min(video.duration, video.currentTime + BILD_DAUER);
});

tempoSelect.addEventListener("change", () => {
  video.playbackRate = Number(tempoSelect.value);
});

skelettAn.addEventListener("change", analysiereAktuellesBild);
analysierenBtn.addEventListener("click", analysiereAlles);
exportierenBtn.addEventListener("click", exportiereDaten);
speichernKnopf.addEventListener("click", speichereAuswahl);
// Wisch-Karten: Punkte und "1 von 3" beim Wischen mitführen
baustellenListe.addEventListener("scroll", aktualisiereKartenPunkte, { passive: true });
// Übungsmodus: blättern, zählen, schließen (auch mit Esc)
uebungZuBtn.addEventListener("click", schliesseUebung);
uebungZurueckBtn.addEventListener("click", () => { aktiveUebung.schritt--; zeigeUebungsSchritt(); });
uebungWeiterBtn.addEventListener("click", () => {
  if (aktiveUebung.schritt === aktiveUebung.daten.schritte.length) schliesseUebung();
  else { aktiveUebung.schritt++; zeigeUebungsSchritt(); }
});
uebungZaehlerBtn.addEventListener("click", () => {
  if (aktiveUebung.anzahl < aktiveUebung.daten.wiederholungen) aktiveUebung.anzahl++;
  navigator.vibrate?.(15); // kurzes Summen als Bestätigung (Android; das iPhone kann es nicht)
  zeigeUebungsSchritt();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && aktiveUebung) schliesseUebung(); });
// Nach dem Entsperren des Handys den Bildschirm wieder anlassen
document.addEventListener("visibilitychange", () => { if (aktiveUebung && document.visibilityState === "visible") bildschirmAnlassen(); });
zuAnalyseBtn.addEventListener("click", () => zeigeBereich("analyse"));
zuGespeichertBtn.addEventListener("click", () => zeigeBereich("gespeichert"));
zuEinstellungenBtn.addEventListener("click", () => zeigeBereich("einstellungen"));
schwungLoeschenBtn.addEventListener("click", loescheAktuellenSchwung);
sitzungLoeschenBtn.addEventListener("click", loescheGanzeSitzung);
videosSitzungLoeschenBtn.addEventListener("click", loescheVideosDerSitzung);
videosLoeschenBtn.addEventListener("click", loescheVideosAusEinstellungen);
allesLoeschenBtn.addEventListener("click", loescheAllesAusEinstellungen);
// Bei "Alles löschen": Der rote Knopf wird erst mit dem Häkchen antippbar
loeschHaken.addEventListener("change", () => {
  loeschBestaetigen.disabled = !loeschHaken.checked;
});

// Los geht's
zeigeLevelAuswahl();
zeigeBereich(aktuellesLevel ? "analyse" : "einstellungen");
ladePoseErkennung().catch((fehler) => {
  poseFehlerText = `Die Pose-Erkennung konnte nicht starten (${fehler.message}).`;
  setzePoseStatus("fehler");
  setStatus(poseFehlerText);
});
