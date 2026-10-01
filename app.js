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
import { analysiereVideo, springe, pruefeVideoLaenge } from "./videoanalyse.js";
// Offline-Prüfung (siehe pwa.js)
import { meldeOfflineBereitschaft, pruefeOfflineDateien, dateiname, APP_VERSION } from "./pwa.js";
// Schwünge auf dem Gerät speichern (siehe speicher.js und videokuerzen.js)
import {
  clipGrenzen,
  schwungZumSpeichern,
  speichereSitzung,
  ladeSitzungen,
  ladeSchwuengeDerSitzung,
  aktualisiereSchwung,
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
// Wissen: Lernpfade, Lektionen, Quellen (reine Daten) und die Schaubilder dazu
import { BELEGE, pfadeFuerLevel, lektionenImPfad, fortschritt, naechsteLektion, leseFortschritt, setzeErledigt, quelleText, uebungFuer, lektion, BALLFLUG_AUSWAHL, ballflugErgebnis } from "./wissen.js";
import { schaubild, ballflugBild, FIGUREN } from "./schaubilder.js";
// Coach mit Claude: was gesendet wird, Antwort prüfen (reine Rechenlogik, Etappe 11b)
import { coachDaten, baueCoachAnfrage, pruefeCoachAntwort, leseAntwort, verlaufKurz, kostenCent, COACH_FEHLER } from "./coach.js";

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
const phasenZeitleisteBox = $("phasenZeitleisteBox");
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
const zuWissenBtn = $("zuWissen");
const analyseBereich = $("analyseBereich");
const gespeichertBereich = $("gespeichertBereich");
const einstellungenBereich = $("einstellungenBereich");
// Wissen: Übersicht der Lernpfade und eine Lektion als Wisch-Karten
const wissenBereich = $("wissenBereich");
const wissenUebersicht = $("wissenUebersicht");
const pfadListe = $("pfadListe");
const wissenLektion = $("wissenLektion");
const wissenZurueckBtn = $("wissenZurueck");
const lektionTitel = $("lektionTitel");
const lektionZaehler = $("lektionZaehler");
const lektionKarten = $("lektionKarten");
const lektionPunkte = $("lektionPunkte");
const levelAnzeige = $("levelAnzeige");
const levelAuswahl = $("levelAuswahl");
const levelVorschlagBox = $("levelVorschlag");
// Wisch-Karten und Schwunggedanke
const gedankeBox = $("gedankeBox");
const gedankeText = $("gedankeText");
const kartenZaehler = $("kartenZaehler");
const kartenPunkte = $("kartenPunkte");
// Übungsmodus (Vollbild)
// Coach mit Claude
const coachBox = $("coachBox");
const coachAntwort = $("coachAntwort");
const coachKnopf = $("coachKnopf");
const coachHinweis = $("coachHinweis");
const coachVorschau = $("coachVorschau");
const coachEinwilligung = $("coachEinwilligung");
const coachSchluesselFeld = $("coachSchluessel");
const coachSchluesselSpeichernBtn = $("coachSchluesselSpeichern");
const coachSchluesselLoeschenBtn = $("coachSchluesselLoeschen");
const coachSchluesselStatus = $("coachSchluesselStatus");
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
let ladeStart = null; // Zeitpunkt der Videoauswahl (für die Ladezeit, Befund S8)
let videoLadezeit = null; // Sekunden von der Auswahl bis das Video in der App ist
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

// Der Analysieren-Knopf ist nur aktiv, wenn die Pose-Erkennung bereit ist.
// Fester Text (kein Nutzerinhalt), deshalb per innerHTML erlaubt – so bleibt
// beim Knopf "bereit" das Lupen-Symbol erhalten statt eines Emojis.
const ICON_SUCHE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';
function setzePoseStatus(neu) {
  poseStatus = neu;
  const texte = {
    laedt: "Pose-Erkennung lädt …",
    bereit: `${ICON_SUCHE}Analysieren`,
    fehler: "Pose-Erkennung fehlt",
  };
  analysierenBtn.innerHTML = texte[neu];
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
    // Nicht lesbar: "geladeneDatei" wieder vergessen. Sonst hielte der nächste Aufruf
    // (z. B. "Analysieren") das Video für fertig geladen und würde die Prüfung überspringen.
    const scheitern = (text) => {
      if (geladeneDatei === datei) geladeneDatei = null;
      fehler(new Error(text));
    };
    video.addEventListener("loadedmetadata", () => {
      // Befund S3: ohne endliche Länge weiß die Analyse nicht, wann sie fertig ist
      const laenge = pruefeVideoLaenge(video.duration);
      if (laenge.lesbar) fertig();
      else scheitern(`„${datei.name}“: ${laenge.hinweis}`);
    }, { once: true });
    video.addEventListener("error", () => scheitern(`„${datei.name}“ lässt sich nicht abspielen`), { once: true });
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
  const abgebrochen = [];
  let sekunden = 0;
  let letzterLauf = null;

  // Befund S2: Was auch schiefgeht – am Ende (finally) sind die Knöpfe wieder frei.
  try {
    for (const [nr, datei] of dateien.entries()) {
      const vorsilbe = dateien.length > 1 ? `Video ${nr + 1} von ${dateien.length} · ` : "";
      try {
        await ladeDatei(datei);
      } catch (fehler) {
        console.warn(fehler);
        nichtLesbar.push(datei.name); // z. B. Format, das dieser Browser nicht kann
        continue;
      }
      let lauf;
      try {
        lauf = await analysiereGeladenesVideo(vorsilbe);
      } catch (fehler) {
        // Ein Video scheitert (z. B. Speicher voll) – mit den anderen weitermachen
        console.error(fehler);
        abgebrochen.push(datei.name);
        continue;
      }
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
  } catch (fehler) {
    console.error(fehler);
    setStatus(`Die Analyse ist abgebrochen (${fehler.message || fehler.name}). Probiere ein kürzeres Video oder lade die Seite neu.`);
    return;
  } finally {
    video.playbackRate = Number(tempoSelect.value); // Abspieltempo wieder wie eingestellt
    analyseLaeuft = false;
    setzeKnoepfeAktiv(true);
  }

  const hinweisNichtLesbar =
    (nichtLesbar.length ? ` Nicht lesbar: ${nichtLesbar.join(", ")}.` : "") +
    (abgebrochen.length ? ` Abgebrochen: ${abgebrochen.join(", ")}.` : "");
  if (!letzterLauf) {
    setStatus(`Kein Video ließ sich auswerten. Probiere es als MP4 oder in Safari.${hinweisNichtLesbar}`);
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
    `${genutzterRechner || "?"}${letzterLauf.verkleinert ? " · verkleinert" : ""} · ${letzterLauf.verfahren}` +
    (videoLadezeit !== null ? ` · Video geladen in ${zahl(videoLadezeit, 1)} s` : "");
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
    phasenZeitleisteBox.hidden = true;
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
  for (const knopf of [playPauseBtn, zurueckBtn, vorBtn, videoInput, zuAnalyseBtn, zuGespeichertBtn, zuWissenBtn, zuEinstellungenBtn]) {
    knopf.disabled = !aktiv;
  }
  analysierenBtn.disabled = !aktiv || poseStatus !== "bereit";
}

// ---------------------------------------------------------------
// 5. Ergebnis anzeigen
// ---------------------------------------------------------------
function zeigeErgebnis(ergebnis) {
  // Zeitleiste: ein Punkt pro Phase, an der echten Videozeit ausgerichtet
  // (Position in Prozent der Videolänge – nicht gleichmäßig verteilt).
  const dauer = video.duration || 0;
  const position = (zeit) => (dauer > 0 ? Math.min(100, Math.max(0, (zeit / dauer) * 100)) : 0);
  phasenKnoepfe.replaceChildren(neu("div", "zeitleiste-fortschritt"));
  for (const phase of PHASEN) {
    const zeit = ergebnis[phase.schluessel].zeit;
    const knopf = document.createElement("button");
    knopf.type = "button";
    knopf.dataset.phase = phase.schluessel;
    knopf.style.left = `${position(zeit)}%`;
    knopf.setAttribute("aria-label", `${phase.name}: ${zahl(zeit)} s · ${phase.info}`);
    knopf.addEventListener("click", () => zeigePhase(phase.schluessel, ergebnis));
    phasenKnoepfe.appendChild(knopf);
  }
  phasenZeitleisteBox.hidden = false;

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

  // 4. Coach mit Claude (nur mit eigenem Schlüssel)
  zeigeCoach();
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
  karte.append(kopf);

  const hilfe = ausserhalb(k) ? tipp(k, rechtshaender) : null;
  if (hilfe) karte.append(neu("p", "kurz", hilfe.kurz));
  else if (k.bewertung === "gut") karte.append(neu("p", "kurz", gutText(k, rechtshaender)));
  else karte.append(neu("p", "text", k.text)); // nicht bewertbar: der Grund steht im Text

  const mehr = neu("details");
  mehr.open = offen;
  mehr.append(neu("summary", "", hilfe ? "Warum & Übung" : "Messung"));
  if (hilfe) {
    mehr.append(neu("p", "warum", hilfe.warum), neu("p", "gedanke", `„${hilfe.gedanke}“`));
    if (hilfe.uebung) mehr.append(baueUebung(hilfe.uebung, { offen: true, gedanke: hilfe.gedanke }));
  }
  mehr.append(neu("p", "detail", `${k.wert} · ${k.detail}`));
  karte.append(mehr);
  if (k.phase) karte.append(zeigenKnopf(k));
  return karte;
}

// Große Wisch-Karte für eine Baustelle: Strich in der Bewertungsfarbe, Bild,
// Kurzzeile, EINE Zeile mit Wert und Ziel statt Skala-Balken, dann Übung
// (darin auch "Warum?") und "Im Video zeigen". Der Schwunggedanke steht nur
// noch einmal oben auf der Seite (gedankeBox) – hier nicht mehr doppelt.
function baueBaustellenKarte(k, { rechtshaender, einsteiger }) {
  const hilfe = tipp(k, rechtshaender);
  const karte = neu("article", `karte baustelle ${k.bewertung}`);
  karte.append(neu("div", "baustelle-strich"));
  const label = k.phase ? `${STUFEN[k.bewertung]} · ${PHASEN_NAME[k.phase]}` : STUFEN[k.bewertung];
  karte.append(neu("p", "abzeichen-text", label));

  const figur = baueFigur(k);
  if (figur) karte.append(figur);

  karte.append(neu("p", "kurz", hilfe ? hilfe.kurz : k.name));

  const s = skala(k);
  const stat = neu("p", "stat");
  stat.append(neu("b", "", k.wert));
  if (s) stat.append(` · ${s.ziel}`);
  karte.append(stat);

  karte.append(neu("div", "trenner"));
  if (hilfe?.uebung) karte.append(baueUebung(hilfe.uebung, { gedanke: hilfe.gedanke, warum: hilfe.warum }));
  else karte.append(neu("p", "warum", hilfe ? hilfe.warum : k.text));
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
  karte.append(neu("div", "baustelle-strich"));
  karte.append(neu("p", "abzeichen-text", "Läuft schon gut"));
  karte.append(neu("p", "kurz", keineBaustelle ? "Keine größere Baustelle – stark! ✓" : "Das machst du schon richtig ✓"));
  if (keineBaustelle) {
    karte.append(neu("div", "trenner"));
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

// Übung: aufklappbar, Schritte als nummerierte Liste. "warum" nur gesetzt, wenn
// der Aufrufer das "Warum?" nicht schon selbst separat anzeigt (baueKarte tut das).
function baueUebung(uebung, { offen = false, gedanke = "", warum = "" } = {}) {
  const block = neu("details", "uebung");
  block.open = offen;
  block.append(neu("summary", "", `Übung: ${uebung.name} · ${uebung.wiederholungen}×`));
  if (warum) block.append(neu("p", "warum", warum));
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
let weiterGesperrtBis = 0; // Schutz gegen Doppeltipp: aus "Los geht's" wird an gleicher Stelle "Fertig"

function oeffneUebung(daten, gedanke) {
  aktiveUebung = { daten, gedanke, schritt: 0, anzahl: 0, vorherFokus: document.activeElement };
  uebungTitel.textContent = daten.name;
  uebungsmodus.hidden = false;
  document.body.classList.add("ohne-scrollen"); // Seite dahinter soll nicht mitscrollen
  // Seite dahinter "inert" schalten: Tabulator und Bildschirmleser bleiben so im Übungsmodus
  // (aria-modal allein hält die Tastatur nicht fest)
  for (const teil of document.body.children) if (teil !== uebungsmodus) teil.inert = true;
  bildschirmAnlassen();
  zeigeUebungsSchritt();
  uebungZuBtn.focus();
}

function schliesseUebung() {
  if (!aktiveUebung) return;
  halteUebungsbildAn();
  uebungsmodus.hidden = true;
  document.body.classList.remove("ohne-scrollen");
  for (const teil of document.body.children) teil.inert = false;
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
    weiterGesperrtBis = performance.now() + 400;
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
function zeichneUebungsbild(bild) {
  uebungBild.replaceChildren(uebungsbildSvg(bild));
  uebungTakt.textContent = bild.text;
}

function uebungsbildSvg({ ausschnitt: a, elemente }) {
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
  return svg;
}

// Bildschirm anlassen (Wake Lock). Kann nicht jeder Browser – dann geht es einfach ohne.
async function bildschirmAnlassen() {
  if (!("wakeLock" in navigator) || bildschirmSperre) return;
  try {
    const sperre = await navigator.wakeLock.request("screen");
    // Die Anfrage braucht einen Moment. Wurde die Übung inzwischen geschlossen (oder kam
    // eine zweite Anfrage schneller an), die neue Sperre gleich wieder freigeben –
    // sonst bliebe der Bildschirm dauerhaft an.
    if (!aktiveUebung || bildschirmSperre) {
      await sperre.release();
      return;
    }
    bildschirmSperre = sperre;
    sperre.addEventListener("release", () => { if (bildschirmSperre === sperre) bildschirmSperre = null; });
  } catch (fehler) {
    console.warn("Bildschirm kann nicht angelassen werden:", fehler);
  }
}

function bildschirmFreigeben() {
  bildschirmSperre?.release().catch((fehler) => console.warn(fehler));
  bildschirmSperre = null;
}

// ---------------------------------------------------------------
// Wissen: Lernpfade und Lektionen (Daten in wissen.js, Bilder in schaubilder.js)
// Fortschritt = Liste erledigter Lektions-IDs im localStorage "wissenFortschritt".
// Er enthält keine Schwungdaten und bleibt bei "Alles löschen" erhalten (wie das Level).
// ---------------------------------------------------------------
const FORTSCHRITT_NAME = "wissenFortschritt";
let wissenErledigt = leseFortschritt(leseEinstellung(FORTSCHRITT_NAME)); // mit try/catch, siehe leseEinstellung
const LEVEL_SYMBOL = Object.fromEntries(LEVEL_OPTIONEN.map((o) => [o.wert, o.symbol]));

function merkeErledigt(id, ja) {
  wissenErledigt = setzeErledigt(wissenErledigt, id, ja);
  try {
    localStorage.setItem(FORTSCHRITT_NAME, JSON.stringify(wissenErledigt));
  } catch (fehler) {
    // Speicher voll oder gesperrt: Das Häkchen gilt dann nur bis zum Schließen der App
    console.warn("Lernfortschritt nicht gespeichert:", fehler);
  }
}

// Übersicht: alle Pfade, der zum Level passende oben, mit "x von y" und den Lektionen
function zeigeWissenUebersicht() {
  halteLektionFigurAn();
  wissenLektion.hidden = true;
  wissenUebersicht.hidden = false;
  lektionKarten.replaceChildren();
  pfadListe.replaceChildren();
  for (const pfad of pfadeFuerLevel(aktuellesLevel)) {
    const { erledigt, gesamt } = fortschritt(pfad.id, wissenErledigt);
    const box = neu("section", "pfad");
    if (pfad.level === aktuellesLevel) box.append(neu("p", "dein-pfad", "Dein Pfad"));
    box.append(neu("h3", "", `${LEVEL_SYMBOL[pfad.level]} ${pfad.titel}`));
    box.append(neu("p", "hinweis", pfad.beschreibung));
    const balken = neu("div", "pfad-balken");
    const fuellung = neu("i");
    fuellung.style.width = `${Math.round((erledigt / gesamt) * 100)}%`;
    balken.append(fuellung);
    box.append(balken, neu("p", "pfad-stand", `${erledigt} von ${gesamt} erledigt`));

    const liste = neu("ol", "lektionen-liste");
    lektionenImPfad(pfad.id).forEach((l, i) => {
      const fertig = wissenErledigt.includes(l.id);
      const knopf = neu("button", fertig ? "erledigt" : "");
      knopf.append(neu("span", "lektion-nr", fertig ? "✓" : String(i + 1)), neu("span", "", l.titel));
      knopf.setAttribute("aria-label", `${l.titel}${fertig ? ", erledigt" : ""}`);
      knopf.addEventListener("click", () => oeffneLektion(l.id));
      const eintrag = neu("li");
      eintrag.append(knopf);
      liste.append(eintrag);
    });
    box.append(liste);
    pfadListe.append(box);
  }
  pfadListe.append(neu("p", "hinweis klein-text", "Bald dazu: Nachschlagen mit Glossar, Irrtümern, Regeln und Ballflug-Helfer."));
}

// Eine Lektion als Wisch-Karten: Bild + Kernsatz · Inhaltskarten · Quiz · Abschluss
function oeffneLektion(id) {
  const l = lektion(id);
  if (!l) return;
  halteLektionFigurAn();
  const imPfad = lektionenImPfad(l.pfad);
  wissenUebersicht.hidden = true;
  wissenLektion.hidden = false;
  lektionTitel.textContent = l.titel;

  const karten = [];
  // 1. Bildkarte
  const bildKarte = lektionsKarte(`Lektion ${imPfad.indexOf(l) + 1} von ${imPfad.length} · ${LEVEL_SYMBOL[l.level]}`);
  bildKarte.append(wissensBild(l.bild), neu("p", "kurz", l.kern));
  karten.push(bildKarte);
  // 2. Inhaltskarten
  l.karten.forEach((k, i) => {
    const karte = lektionsKarte(`${i + 1} von ${l.karten.length}`);
    if (k.bild) karte.append(wissensBild(k.bild));
    karte.append(neu("p", "inhalt", k.text));
    karten.push(karte);
  });
  // 3. Quiz, danach (falls vorhanden) ein Werkzeug zum Ausprobieren, 4. Abschluss
  karten.push(quizKarte(l.quiz));
  if (l.werkzeug === "ballflugHelfer") karten.push(ballflugHelferKarte());
  karten.push(abschlussKarte(l));

  lektionKarten.replaceChildren(...karten);
  lektionKarten.scrollLeft = 0;
  steuereLektionFigur(aktualisierePunkte(lektionKarten, lektionPunkte, lektionZaehler));
  wissenBereich.scrollIntoView({ block: "start" });
  lektionTitel.focus({ preventScroll: true });
}

// ---------------------------------------------------------------
// Bewegte Figur in einer Lektion (z. B. Phasen P1–P10). Sie läuft nur, solange ihre Karte
// zu sehen ist: Wegwischen, Zurück oder ein anderer Bereich halten sie an.
// Wer im System "Bewegung reduzieren" eingestellt hat, sieht nur das Endbild (wie im Übungsmodus).
// ---------------------------------------------------------------
let lektionAnimation = null; // Nummer von requestAnimationFrame – zum Anhalten
let figurKarte = null; // Karte, deren Figur gerade läuft (oder null)

function halteLektionFigurAn() {
  if (lektionAnimation) cancelAnimationFrame(lektionAnimation);
  lektionAnimation = null;
  figurKarte = null;
}

// nummer = sichtbare Karte (aus aktualisierePunkte)
function steuereLektionFigur(nummer) {
  const karte = lektionKarten.children[nummer] || null;
  if (karte === figurKarte) return; // dieselbe Karte: Die Animation läuft einfach weiter
  halteLektionFigurAn();
  const box = karte?.querySelector(".figur[data-figur]");
  const bild = box && FIGUREN[box.dataset.figur];
  if (!bild || bild.folge.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  figurKarte = karte;
  const start = performance.now();
  let zuletzt = 0;
  const bildchen = (jetzt) => {
    lektionAnimation = requestAnimationFrame(bildchen);
    if (jetzt - zuletzt < 33) return; // ca. 30 Bilder pro Sekunde reichen und schonen den Akku
    zuletzt = jetzt;
    zeichneWissenFigur(box, bild, jetzt - start);
  };
  lektionAnimation = requestAnimationFrame(bildchen);
}

// Figur zum Zeitpunkt ms zeichnen, darunter die Beschriftung (z. B. „P4 · Top“).
// Hat die Figur Beschriftungen, bleibt die Zeile immer da (auch leer) – sonst springt die Höhe.
function zeichneWissenFigur(box, bild, ms) {
  const { ausschnitt, elemente, text } = zeichnung(bild, ms, true);
  box.replaceChildren(uebungsbildSvg({ ausschnitt, elemente }));
  if (bild.folge.some((f) => f.text)) box.append(neu("p", "figur-text", text || " "));
}

// ---------------------------------------------------------------
// Ballflug-Helfer: Start und Kurve antippen → Name, Bild und Ursache (Daten in wissen.js)
// ---------------------------------------------------------------
function ballflugHelferKarte() {
  const karte = lektionsKarte("Ballflug-Helfer");
  karte.append(neu("p", "kurz", "Wie ist dein Ball geflogen? Tippe Start und Kurve an."));
  const gewaehlt = { start: null, kurve: null };
  const ergebnis = neu("div", "helfer-ergebnis");
  ergebnis.setAttribute("aria-live", "polite"); // Bildschirmleser lesen das Ergebnis vor

  const zeigeErgebnis = () => {
    ergebnis.replaceChildren();
    if (!gewaehlt.start || !gewaehlt.kurve) return;
    const e = ballflugErgebnis(gewaehlt.start, gewaehlt.kurve);
    if (!e) return;
    const bildBox = neu("div", "schaubild");
    bildBox.setAttribute("aria-hidden", "true");
    bildBox.append(schaubildSvg(ballflugBild(gewaehlt.start, gewaehlt.kurve)));
    ergebnis.append(neu("p", "helfer-name", e.name), bildBox);
    for (const satz of e.saetze) ergebnis.append(neu("p", "inhalt", satz));
    const passend = e.lektion && lektion(e.lektion);
    if (passend) {
      const knopf = neu("button", "klein breit", `Mehr dazu: ${passend.titel} ›`);
      knopf.addEventListener("click", () => oeffneLektion(passend.id));
      ergebnis.append(knopf);
    }
  };

  const gruppe = (frage, feld) => {
    const box = neu("div", "helfer-gruppe");
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", frage);
    box.append(neu("p", "helfer-frage", frage));
    const reihe = neu("div", "helfer-knoepfe");
    const knoepfe = BALLFLUG_AUSWAHL[feld].map(({ wert, text }) => {
      const knopf = neu("button", "", text);
      knopf.setAttribute("aria-pressed", "false");
      knopf.addEventListener("click", () => {
        gewaehlt[feld] = wert;
        for (const k of knoepfe) k.setAttribute("aria-pressed", String(k === knopf));
        zeigeErgebnis();
      });
      return knopf;
    });
    reihe.append(...knoepfe);
    box.append(reihe);
    return box;
  };

  karte.append(gruppe("Wohin ist der Ball gestartet?", "start"), gruppe("Wie hat er gekurvt?", "kurve"), ergebnis);
  return karte;
}

// Gleicher Aufbau wie die Baustellen-Karten (Strich, kleine Überschrift)
function lektionsKarte(ueberschrift) {
  const karte = neu("article", "karte baustelle lektion");
  karte.append(neu("div", "baustelle-strich"), neu("p", "abzeichen-text", ueberschrift));
  return karte;
}

function quizKarte(quiz) {
  const karte = lektionsKarte("Quiz");
  karte.append(neu("p", "kurz", quiz.frage));
  const antworten = neu("div", "quiz-antworten");
  const erklaerung = neu("p", "quiz-erklaerung");
  erklaerung.tabIndex = -1; // bekommt nach der Antwort den Fokus – die Knöpfe sind dann gesperrt
  const knoepfe = quiz.antworten.map((text, i) => {
    const knopf = neu("button", "", text);
    knopf.addEventListener("click", () => {
      // Nach dem Tippen: richtige Antwort grün, falsch gewählte rot, dann die Erklärung
      for (const [j, k] of knoepfe.entries()) {
        k.disabled = true;
        if (j === quiz.richtig) k.classList.add("richtig");
        else if (j === i) k.classList.add("falsch");
      }
      erklaerung.textContent = `${i === quiz.richtig ? "✓ Richtig! " : "Nicht ganz. "}${quiz.erklaerung}`;
      // Gesperrte Knöpfe verlieren den Fokus – sonst springt er (Tastatur, VoiceOver) an den Seitenanfang
      erklaerung.focus({ preventScroll: true });
    });
    return knopf;
  });
  antworten.append(...knoepfe);
  karte.append(antworten, erklaerung);
  return karte;
}

function abschlussKarte(l) {
  const karte = lektionsKarte("Geschafft");
  karte.append(neu("p", "kurz", "Lektion erledigt?"));
  const erledigtKnopf = neu("button", "haupt breit");
  const zeigeStand = () => {
    const fertig = wissenErledigt.includes(l.id);
    erledigtKnopf.textContent = fertig ? "✓ Erledigt – antippen zum Zurücknehmen" : "✓ Als erledigt markieren";
    erledigtKnopf.setAttribute("aria-pressed", String(fertig));
  };
  erledigtKnopf.addEventListener("click", () => {
    merkeErledigt(l.id, !wissenErledigt.includes(l.id));
    zeigeStand();
  });
  zeigeStand();
  karte.append(erledigtKnopf);

  const uebung = uebungFuer(l, true); // Texte der Wissensseite gelten für Rechtshänder
  if (uebung) {
    const starten = neu("button", "klein breit", `Übung starten: ${uebung.name} · ${uebung.wiederholungen}×`);
    starten.addEventListener("click", () => oeffneUebung(uebung, ""));
    karte.append(starten);
  }
  const naechste = naechsteLektion(l.id);
  const weiter = neu("button", "klein breit", naechste ? `Nächste Lektion: ${naechste.titel} ›` : "Zur Übersicht ›");
  weiter.addEventListener("click", () => (naechste ? oeffneLektion(naechste.id) : zeigeWissenUebersicht()));
  karte.append(weiter);

  karte.append(neu("div", "trenner"));
  const quellen = neu("div", "quellen");
  quellen.append(neu("p", "", `Belegt durch: ${BELEGE[l.beleg]}`));
  const liste = neu("ul");
  for (const kennung of l.quellen) liste.append(neu("li", "", quelleText(kennung)));
  quellen.append(neu("p", "", "Quellen:"), liste);
  karte.append(quellen);
  return karte;
}

// Bild zur Lektion: Figur aus echten Posen (dunkler Kasten wie bei den Übungen)
// oder Schaubild in den Farben der Seite (hell/dunkel)
function wissensBild(name) {
  const figur = FIGUREN[name];
  if (figur) {
    const box = neu("div", "figur");
    box.setAttribute("aria-hidden", "true");
    box.dataset.figur = name; // fester Name aus schaubilder.js – steuereLektionFigur findet die Figur so
    // Erstes Bild; bei "Bewegung reduzieren" gleich das Endbild (wie im Übungsmodus)
    const ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const endbild = gesamtDauer(figur) - (figur.folge[figur.folge.length - 1].halten || 0);
    zeichneWissenFigur(box, figur, ruhig ? endbild : 0);
    return box;
  }
  const box = neu("div", "schaubild");
  box.setAttribute("aria-hidden", "true"); // Der Kernsatz daneben sagt dasselbe in Worten
  const bild = schaubild(name);
  if (bild) {
    // Hohe Bilder (z. B. neun Flugkurven) bekommen mehr Platz, damit die Schrift lesbar bleibt
    if (bild.ausschnitt.hoehe > bild.ausschnitt.breite * 0.6) box.classList.add("hoch");
    box.append(schaubildSvg(bild));
  }
  return box;
}

// Schaubild als SVG. Farben sind Namen von Variablen aus style.css → var(--name).
function schaubildSvg({ ausschnitt: a, elemente }) {
  const huelle = document.createElement("div");
  huelle.innerHTML = "<svg></svg>"; // fester Text – den Namensraum liefert der Browser
  const svg = huelle.firstChild;
  const SVG = svg.namespaceURI;
  svg.setAttribute("viewBox", `${a.x} ${a.y} ${a.breite} ${a.hoehe}`);
  const farbe = (name) => (name ? `var(--${name})` : "none");
  for (const el of elemente) {
    let neuesElement;
    const attribute = {};
    if (el.art === "linie") {
      neuesElement = document.createElementNS(SVG, "line");
      Object.assign(attribute, { x1: el.von[0], y1: el.von[1], x2: el.bis[0], y2: el.bis[1] });
    } else if (el.art === "kreis") {
      neuesElement = document.createElementNS(SVG, "circle");
      Object.assign(attribute, { cx: el.mitte[0], cy: el.mitte[1], r: el.radius });
    } else if (el.art === "rechteck") {
      neuesElement = document.createElementNS(SVG, "rect");
      Object.assign(attribute, { x: el.x, y: el.y, width: el.breite, height: el.hoehe, rx: el.rundung });
    } else if (el.art === "pfad") {
      // Mit Füllung geschlossen (Polygon), sonst offener Linienzug
      neuesElement = document.createElementNS(SVG, el.fuellung ? "polygon" : "polyline");
      attribute.points = el.punkte.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    } else if (el.art === "text") {
      neuesElement = document.createElementNS(SVG, "text");
      Object.assign(attribute, { x: el.bei[0], y: el.bei[1], "font-size": el.groesse, "text-anchor": el.anker, "font-weight": el.fett ? 700 : 400 });
      neuesElement.textContent = el.inhalt;
      neuesElement.style.fill = farbe(el.farbe);
    }
    for (const [name, wert] of Object.entries(attribute)) neuesElement.setAttribute(name, wert);
    if (el.art !== "text") {
      // Farben per style, weil var(--…) in SVG-Attributen nicht überall wirkt
      neuesElement.style.stroke = farbe(el.farbe);
      neuesElement.style.fill = farbe(el.fuellung);
      // Beim Rechteck ist "breite" die Breite – die Strichstärke steht dort in "strich"
      neuesElement.setAttribute("stroke-width", el.art === "rechteck" ? el.strich : el.breite);
      neuesElement.setAttribute("stroke-linecap", "round");
      neuesElement.setAttribute("stroke-linejoin", "round");
      if (el.gestrichelt) neuesElement.setAttribute("stroke-dasharray", "6 5");
    }
    svg.append(neuesElement);
  }
  return svg;
}

// ---------------------------------------------------------------
// Coach mit Claude (Etappe 11b)
// Was gesendet wird und wie die Antwort geprüft wird, steht in coach.js.
// Hier: Schlüssel verwalten, Einwilligung, SDK laden, Anfrage senden, Antwort zeigen.
// ---------------------------------------------------------------

// Offizielles Anthropic-SDK, feste Version, erst beim Tippen auf den Coach-Knopf geladen –
// so startet die App weiter offline und ohne dieses Paket. Nach dem ersten Laden legt der
// Service Worker es (wie alle jsDelivr-Dateien) im Offline-Speicher ab; es kommt nicht in die Vorab-Liste.
const COACH_SDK_URL = "https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.129.0/+esm";
// Die einzige Adresse, an die der Coach sendet (Regel in CLAUDE.md). Steht hier ausdrücklich,
// statt sich auf die Voreinstellung des SDK zu verlassen – so prüft sie auch der Host-Test.
const COACH_API_URL = "https://api.anthropic.com";
// Läuft gerade eine Anfrage? Dann bleibt der Knopf gesperrt – auch wenn die Ansicht
// neu gezeichnet wird (Level- oder Schwungwechsel, Internet wieder da). Sonst: doppelte Kosten.
let coachLaeuft = false;
// Der eigene API-Schlüssel liegt nur hier (localStorage dieses Geräts) – nie im Code,
// nie in der Datenbank, nie in einem Export. "Alles löschen" fasst ihn nicht an.
const SCHLUESSEL_NAME = "coachSchluessel";
const EINWILLIGUNG_NAME = "coachEinwilligung";
// Seit 0.17.0 gehen ALLE gemessenen Kennzahlen mit (nicht nur die des Levels). Weil sich damit
// geändert hat, was gesendet wird, gilt eine alte Einwilligung ("ja") nicht mehr – die App fragt
// einmal neu und speichert dann diesen Wert.
const EINWILLIGUNG_WERT = "ja-alle-kennzahlen";

function leseEinstellung(name) {
  try {
    return localStorage.getItem(name) || "";
  } catch {
    return ""; // z. B. privater Modus – dann eben ohne Coach
  }
}

function zeigeCoachEinstellung() {
  const schluessel = leseEinstellung(SCHLUESSEL_NAME);
  coachSchluesselLoeschenBtn.hidden = !schluessel;
  coachSchluesselStatus.textContent = schluessel
    ? `Schlüssel gespeichert ✓ (endet auf …${schluessel.slice(-4)}). Der Coach-Knopf erscheint nach einer Analyse.`
    : "Kein Schlüssel eingetragen – ohne Schlüssel gibt es keinen Coach, der Rest der App läuft ganz normal.";
}

function speichereCoachSchluessel() {
  const schluessel = coachSchluesselFeld.value.trim();
  if (!schluessel.startsWith("sk-ant-")) {
    coachSchluesselStatus.textContent = "Das sieht nicht wie ein Anthropic-API-Schlüssel aus (er beginnt mit „sk-ant-“).";
    return;
  }
  try {
    localStorage.setItem(SCHLUESSEL_NAME, schluessel);
  } catch (fehler) {
    coachSchluesselStatus.textContent = `Der Schlüssel ließ sich nicht speichern (${fehler.name}).`;
    return;
  }
  coachSchluesselFeld.value = "";
  zeigeCoachEinstellung();
  if (bewertung) zeigeCoach();
}

function loescheCoachSchluessel() {
  try {
    localStorage.removeItem(SCHLUESSEL_NAME); // nur diesen einen Eintrag …
    localStorage.removeItem(EINWILLIGUNG_NAME); // … und die Einwilligung: ein neuer Schlüssel fragt wieder
  } catch (fehler) {
    console.warn(fehler);
  }
  zeigeCoachEinstellung();
  coachBox.hidden = true;
}

// Die sichtbaren Kennzahlen des Levels, die übrigen (nur als Hintergrund für Claude)
// und die wichtigste Baustelle der App
function coachGrundlage() {
  const { sichtbar, fuerSpaeter } = fuerLevel(alleKennzahlen, aktuellesLevel);
  return { sichtbar, fuerSpaeter, wichtigste: wichtigsteBaustellen(sichtbar, 1)[0] || null };
}

// Genau die Daten, die gesendet werden (für die Vorschau und die Anfrage)
async function coachDatenJetzt() {
  const { sichtbar, fuerSpaeter, wichtigste } = coachGrundlage();
  let verlauf = {};
  try {
    // Früher gespeicherte Schwünge – ohne die gerade geöffnete Sitzung
    const sitzungen = (await ladeSitzungen()).filter((s) => s.id !== gespeicherteSitzung?.id);
    const schwuenge = (await Promise.all(sitzungen.map(ladeSchwuengeDerSitzung))).flat();
    verlauf = verlaufKurz(schwuenge, sichtbar.map((k) => k.id));
  } catch (fehler) {
    console.warn("Verlauf für den Coach nicht lesbar:", fehler); // dann eben ohne Verlauf
  }
  return coachDaten({
    kennzahlen: sichtbar,
    hintergrund: fuerSpaeter,
    level: aktuellesLevel,
    ansicht: bewertung.ansicht,
    rechtshaender: technik.rechtshaender,
    anzahlSchwuenge: alleSchwuenge.filter((s) => s.phasen).length || 1,
    wichtigste,
    verlauf,
  });
}

// Coach-Bereich unter den Karten: nur mit Schlüssel sichtbar
function zeigeCoach() {
  coachBox.hidden = !leseEinstellung(SCHLUESSEL_NAME) || !bewertung;
  if (coachBox.hidden) return;
  coachAntwort.replaceChildren();
  if (aktuellerSchwung?.coach) coachAntwort.append(baueCoachAntwort(aktuellerSchwung.coach));
  coachVorschau.textContent = "Wird beim Aufklappen zusammengestellt …";
  zeigeCoachKnopf();
}

function zeigeCoachKnopf() {
  const online = navigator.onLine;
  coachKnopf.disabled = !online || coachLaeuft;
  coachKnopf.textContent = aktuellerSchwung?.coach ? "Neues Coach-Feedback holen" : "Coach-Feedback holen";
  coachHinweis.textContent = coachLaeuft
    ? "Der Coach denkt nach … (ca. 30–90 Sekunden)"
    : online
    ? "Sendet deine Kennzahlen an Anthropic (Claude) · ca. 15–25 Cent"
    : "Der Coach braucht Internet. Gespeicherte Antworten bleiben lesbar.";
}

// Einwilligung einmalig vor dem ersten Senden
function frageCoachEinwilligung() {
  if (leseEinstellung(EINWILLIGUNG_NAME) === EINWILLIGUNG_WERT) return Promise.resolve(true);
  coachEinwilligung.returnValue = "";
  coachEinwilligung.showModal();
  return new Promise((fertig) => {
    coachEinwilligung.addEventListener("close", () => {
      const ja = coachEinwilligung.returnValue === "ja";
      if (ja) {
        try {
          localStorage.setItem(EINWILLIGUNG_NAME, EINWILLIGUNG_WERT);
        } catch (fehler) {
          console.warn(fehler); // dann fragt die App beim nächsten Mal eben noch einmal
        }
      }
      fertig(ja);
    }, { once: true });
  });
}

// Fehler des SDK einer verständlichen Meldung zuordnen (typisierte Fehlerklassen, keine Textsuche)
function coachFehlerArt(fehler, Anthropic) {
  if (fehler.coachArt) return fehler.coachArt;
  if (!Anthropic) return "unbekannt";
  if (fehler instanceof Anthropic.AuthenticationError || fehler instanceof Anthropic.PermissionDeniedError) return "schluessel";
  if (fehler instanceof Anthropic.RateLimitError) return "zuViele";
  if (fehler instanceof Anthropic.InternalServerError) return "ueberlastet";
  if (fehler instanceof Anthropic.APIConnectionError) return "verbindung"; // vor APIError prüfen (Unterklasse)
  if (fehler instanceof Anthropic.APIError && fehler.status === 402) return "guthaben";
  return "unbekannt";
}

const coachFehler = (art) => Object.assign(new Error(COACH_FEHLER[art]), { coachArt: art });

async function frageCoach() {
  if (coachLaeuft) return; // schon unterwegs – keine zweite (bezahlte) Anfrage
  if (!navigator.onLine) return zeigeCoachKnopf();
  const schwung = aktuellerSchwung;
  const schluessel = leseEinstellung(SCHLUESSEL_NAME);
  if (!schwung || !schluessel) return;

  // Sperre SOFORT setzen – noch vor dem ersten await (Einwilligung). Sonst kämen zwei
  // schnelle Tipps beide an der Prüfung oben vorbei und es gäbe zwei bezahlte Anfragen.
  coachLaeuft = true;
  zeigeCoachKnopf(); // Knopf gesperrt
  const level = aktuellesLevel; // Stand beim Tippen – falls du währenddessen das Level wechselst
  let Anthropic = null;
  try {
    if (!(await frageCoachEinwilligung())) return; // "Abbrechen": finally gibt den Knopf wieder frei
    const { wichtigste, sichtbar } = coachGrundlage();
    const anfrage = baueCoachAnfrage(await coachDatenJetzt());
    try {
      ({ default: Anthropic } = await import(COACH_SDK_URL));
    } catch (fehler) {
      console.error(fehler);
      throw coachFehler("laden");
    }
    // dangerouslyAllowBrowser: Das SDK verlangt die ausdrückliche Erlaubnis, im Browser zu laufen,
    // weil der Schlüssel dann im Browser liegt. Genau das ist hier gewollt (eigener Schlüssel mit Limit).
    const client = new Anthropic({ apiKey: schluessel, baseURL: COACH_API_URL, dangerouslyAllowBrowser: true, maxRetries: 1 });
    // Als Datenstrom empfangen: Die ausführliche Antwort braucht bis zu 1–2 Minuten, und ein
    // Datenstrom stößt dabei an kein Zeitlimit. finalMessage() wartet, bis alles da ist.
    const strom = client.beta.messages.stream(anfrage);
    // Sobald Text ankommt, ist das Nachdenken vorbei – das zeigt der Hinweis unter dem Knopf
    strom.on("text", () => {
      coachHinweis.textContent = "Der Coach schreibt seine Antwort …";
    });
    const antwort = await strom.finalMessage();
    if (antwort.stop_reason === "refusal") throw coachFehler("abgelehnt");
    if (antwort.stop_reason === "max_tokens") throw coachFehler("unvollstaendig");
    // Alle Textblöcke zusammen lesen – nach einem Rückfall auf ein anderes Modell steht die
    // Antwort in zwei Teilen (siehe leseAntwort in coach.js)
    const roh = leseAntwort(antwort.content);
    if (!roh) throw coachFehler("unvollstaendig");

    const coach = {
      ...pruefeCoachAntwort(roh, { kennzahlen: sichtbar, wichtigste }),
      level,
      modell: antwort.model,
      kostenCent: kostenCent(antwort.usage),
    };
    schwung.coach = coach;
    // Gespeicherter Schwung (hat eine id aus der Datenbank)? Dann nur die Antwort dort nachtragen.
    // Bewusst am Schwung selbst geprüft, nicht an der gerade geöffneten Sitzung – die kann
    // sich während der Anfrage geändert haben.
    if (schwung.id) await aktualisiereSchwung(schwung.id, { coach });
    if (aktuellerSchwung === schwung) {
      coachAntwort.replaceChildren(baueCoachAntwort(coach));
      coachAntwort.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (fehler) {
    console.error(fehler);
    const art = coachFehlerArt(fehler, Anthropic);
    // Nur beim Schwung zeigen, für den gefragt wurde (nicht bei einem inzwischen gewählten anderen)
    if (aktuellerSchwung === schwung) coachAntwort.replaceChildren(neu("p", "karte unsicher", COACH_FEHLER[art]));
  } finally {
    coachLaeuft = false;
    zeigeCoachKnopf(); // Knopf in jedem Fall wieder freigeben
  }
}

// Die Coach-Antwort als Karte. Schwunggedanke und Übung zum Fokus kommen aus der App
// (tipps.js, fachlich geprüft), alles andere schreibt Claude. Alle Texte per textContent (neu()).
// Antworten von vor 0.17.0 haben nur lob, fokusBotschaft und naechstesMal – auch die zeigt sie an.
function baueCoachAntwort(coach) {
  const rechtshaender = haendigkeit();
  const karte = neu("article", "karte coach-antwort");
  // Abschnitt mit Überschrift, aufgeklappt – wer ihn gelesen hat, kann ihn zuklappen
  const abschnitt = (titel, ...inhalt) => {
    const box = neu("details", "abschnitt");
    box.open = true;
    box.append(neu("summary", "", titel), ...inhalt);
    karte.append(box);
  };
  const liste = (tag, eintraege) => {
    const element = neu(tag);
    for (const eintrag of eintraege) element.append(neu("li", "", eintrag));
    return element;
  };
  // Absatz mit fettem Anfang, z. B. "Häufige Ursachen: …"
  const absatz = (anfang, text) => {
    const p = neu("p");
    p.append(neu("b", "", anfang), text);
    return p;
  };

  if (coach.lob) karte.append(neu("p", "lob", `👍 ${coach.lob}`)); // altes Format
  if (coach.gesamtbild) abschnitt("🔎 Gesamtbild", neu("p", "", coach.gesamtbild));
  if (coach.staerken?.length) abschnitt("👍 Das machst du schon gut", liste("ul", coach.staerken));

  const k = alleKennzahlen.find((x) => x.id === coach.fokusKennzahl);
  const hilfe = k ? tipp(k, rechtshaender) : null;
  if (hilfe) {
    const fokus = [];
    if (coach.wasPassiert) {
      fokus.push(absatz("Was passiert: ", coach.wasPassiert));
      if (coach.ursachen) fokus.push(absatz("Häufige Ursachen: ", coach.ursachen));
      if (coach.folgen) fokus.push(absatz("Folgen für den Schlag: ", coach.folgen));
    } else {
      // Altes Format oder Fokus von der App ersetzt: die geprüfte Erklärung der App
      fokus.push(neu("p", "warum", coach.fokusBotschaft || hilfe.warum));
    }
    abschnitt(`🎯 Dein Fokus: ${hilfe.kurz}`, ...fokus);
  }
  if (coach.anleitung?.length) {
    const inhalt = [liste("ol", coach.anleitung)];
    if (coach.gefuehl) inhalt.push(absatz("So fühlt es sich an: ", coach.gefuehl));
    abschnitt("🛠 So geht's richtig", ...inhalt);
  }
  if (hilfe) {
    karte.append(neu("p", "gedanke", `💭 „${hilfe.gedanke}“`));
    if (hilfe.uebung) karte.append(baueUebung(hilfe.uebung, { gedanke: hilfe.gedanke }));
  }
  if (coach.trainingsplan?.length) {
    const plan = neu("ol", "trainingsplan");
    for (const block of coach.trainingsplan) {
      const punkt = neu("li");
      punkt.append(neu("strong", "", block.menge ? `${block.titel} · ${block.menge}` : block.titel));
      if (block.anleitung) punkt.append(neu("p", "", block.anleitung));
      if (block.erfolg) punkt.append(neu("p", "erfolg", `✓ ${block.erfolg}`));
      plan.append(punkt);
    }
    abschnitt("📋 Dein Trainingsplan", plan);
  }
  if (coach.typischeFehler?.length) abschnitt("⚠️ Typische Fallen beim Üben", liste("ul", coach.typischeFehler));
  if (coach.zuHause) abschnitt("🏠 Zu Hause üben", neu("p", "", coach.zuHause));
  if (coach.danach) karte.append(neu("p", "naechstes", `🔭 Danach: ${coach.danach}`));
  if (coach.naechsteAufnahme) karte.append(neu("p", "naechstes", `🎥 ${coach.naechsteAufnahme}`));
  if (coach.naechstesMal) karte.append(neu("p", "naechstes", `➡️ ${coach.naechstesMal}`)); // altes Format

  const kosten = typeof coach.kostenCent === "number" ? ` · ca. ${zahl(coach.kostenCent, 1)} US-Cent` : "";
  const geprueft = coach.gesamtbild ? " · Erklärungen und Plan von Claude, fachlich geprüft ist nur die Übung der App" : "";
  karte.append(neu("p", "herkunft",
    `Antwort von Claude${kosten}${coach.fokusErsetzt ? " · Fokus von der App gewählt" : ""}${geprueft} · ersetzt keine Trainerstunde`));
  return karte;
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

// Punkte unter den Wisch-Karten und "1 von 3" passend zur sichtbaren Karte.
// Gilt für die Baustellen und für die Lektionen im Bereich Wissen.
// Gibt die Nummer der sichtbaren Karte zurück (0 = erste).
function aktualisierePunkte(liste, punkte, zaehler) {
  const karten = [...liste.children];
  if (karten.length < 2) {
    punkte.replaceChildren();
    zaehler.textContent = "";
    return 0;
  }
  const breite = karten[0].offsetWidth + 28; // 28 = Abstand zwischen den Karten (style.css)
  const nummer = breite > 12 ? Math.min(karten.length - 1, Math.round(liste.scrollLeft / breite)) : 0;
  if (punkte.children.length !== karten.length) {
    punkte.replaceChildren(...karten.map(() => neu("i")));
  }
  [...punkte.children].forEach((punkt, i) => punkt.classList.toggle("aktiv", i === nummer));
  zaehler.textContent = `${nummer + 1} von ${karten.length} · wischen ›`;
  return nummer;
}

function aktualisiereKartenPunkte() {
  aktualisierePunkte(baustellenListe, kartenPunkte, kartenZaehler);
}

// Rechts- oder Linkshänder? Für "linker/rechter Arm" in den Tipps.
function haendigkeit() {
  return technik?.rechtshaender ?? alleSchwuenge.find((s) => s.technik)?.technik.rechtshaender ?? true;
}

// Fester Text (kein Nutzerinhalt – PHASEN_NAME kommt aus phasen.js), deshalb per innerHTML erlaubt
function zeigenKnopf(k) {
  const knopf = document.createElement("button");
  knopf.className = "zeigen";
  knopf.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>' +
    `Im Video zeigen (${PHASEN_NAME[k.phase]})`;
  knopf.addEventListener("click", () => zeigeMessung(k));
  return knopf;
}

// Markiert den passenden Punkt auf der Zeitleiste und zieht den Fortschritt bis dorthin
function setzeAktivePhase(schluessel) {
  let linksProzent = 0;
  for (const knopf of phasenKnoepfe.querySelectorAll("button")) {
    const aktiv = knopf.dataset.phase === schluessel;
    knopf.classList.toggle("aktiv", aktiv);
    if (aktiv) linksProzent = parseFloat(knopf.style.left) || 0;
  }
  const fortschritt = phasenKnoepfe.querySelector(".zeitleiste-fortschritt");
  if (fortschritt) fortschritt.style.width = `${linksProzent}%`;
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
  setzeAktivePhase(k.phase);
  setStatus(`${k.name} – ${PHASEN_NAME[k.phase]} bei ${zahl(zeit)} s`);
}

async function zeigePhase(schluessel, ergebnis) {
  if (!geladeneDatei) return; // gespeicherter Schwung ohne Video
  aktiveMessung = null;
  video.pause();
  await springeZu(ergebnis[schluessel].zeit);
  analysiereAktuellesBild();
  setzeAktivePhase(schluessel);
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
    label.innerHTML = `<input type="radio" name="level" value=""><span><strong></strong><small></small></span>`;
    const radio = label.querySelector("input");
    radio.value = option.wert;
    radio.checked = option.wert === aktuellesLevel;
    label.querySelector("strong").textContent = option.name;
    label.querySelector("small").textContent = option.beschreibung;
    radio.addEventListener("change", () => setzeLevel(option.wert));
    levelAuswahl.appendChild(label);
  }
  levelAnzeige.hidden = !aktuellesLevel;
  levelAnzeige.textContent = aktuellesLevel
    ? `Dein Level: ${LEVEL_OPTIONEN.find((option) => option.wert === aktuellesLevel).name}`
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
  wissenBereich.hidden = welcher !== "wissen";
  einstellungenBereich.hidden = welcher !== "einstellungen";
  zuAnalyseBtn.classList.toggle("aktiv", welcher === "analyse");
  zuGespeichertBtn.classList.toggle("aktiv", welcher === "gespeichert");
  zuWissenBtn.classList.toggle("aktiv", welcher === "wissen");
  zuEinstellungenBtn.classList.toggle("aktiv", welcher === "einstellungen");
  if (welcher !== "wissen") halteLektionFigurAn(); // bewegte Figur einer offenen Lektion anhalten
  if (welcher === "wissen") {
    video.pause();
    zeigeWissenUebersicht();
  }
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
  "alle Kennzahlen, Bewertungen und Coach-Antworten",
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
      "alle Kennzahlen, Notizen, Posedaten und Coach-Antworten",
      ...bilderZeilen(zaehleBilder(groessen, schwungIds)),
    ],
    bleibt: [
      "dein Level, dein Lernfortschritt unter „Wissen“ und dein Coach-Schlüssel",
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
  ladeStart = performance.now(); // Befund S8: Wie lange braucht das Video, bis es in der App ist?
  videoLadezeit = null;
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
  if (ladeStart !== null) {
    videoLadezeit = (performance.now() - ladeStart) / 1000;
    ladeStart = null;
  }
  const was = dateien.length > 1 ? `${dateien.length} Videos ausgewählt` : "Video geladen";
  const lang = pruefeVideoLaenge(video.duration).hinweis; // Befund S3: Hinweis bei langen Videos
  if (poseStatus === "bereit") setStatus(`${was}. Tippe auf „Analysieren“ oder spiel es ab.${lang ? ` ${lang}` : ""}`);
  else if (poseStatus === "fehler") setStatus(`Video geladen – aber: ${poseFehlerText}`);
  else setStatus("Video geladen. Die Pose-Erkennung lädt noch …");
});

video.addEventListener("error", () => {
  if (!video.getAttribute("src")) return; // Video wurde absichtlich entladen (gibVideoFrei)
  setStatus("Dieses Video kann der Browser nicht abspielen. Probiere es als MP4 oder in Safari.");
});

// Nach Springen / Einzelbild: dieses Bild analysieren
video.addEventListener("seeked", analysiereAktuellesBild);

// Icon und Beschriftung des Abspiel-Knopfs: fester Text (kein Nutzerinhalt), deshalb per innerHTML erlaubt
const ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>';
const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';

video.addEventListener("play", () => {
  aktiveMessung = null;
  playPauseBtn.innerHTML = ICON_PAUSE;
  playPauseBtn.setAttribute("aria-label", "Pause");
  schleife();
});

video.addEventListener("pause", () => {
  playPauseBtn.innerHTML = ICON_PLAY;
  playPauseBtn.setAttribute("aria-label", "Abspielen");
});

playPauseBtn.addEventListener("click", () => {
  // play() kann harmlos scheitern (z. B. sofort wieder Pause getippt). Das gehört nicht
  // als "Unerwarteter Fehler" in die Statuszeile, nur in die Konsole.
  if (video.paused) video.play().catch((fehler) => console.warn(fehler));
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
  if (performance.now() < weiterGesperrtBis) return;
  if (aktiveUebung.schritt === aktiveUebung.daten.schritte.length) schliesseUebung();
  else { aktiveUebung.schritt++; zeigeUebungsSchritt(); }
});
uebungZaehlerBtn.addEventListener("click", () => {
  if (aktiveUebung.anzahl < aktiveUebung.daten.wiederholungen) aktiveUebung.anzahl++;
  navigator.vibrate?.(15); // kurzes Summen als Bestätigung (Android; das iPhone kann es nicht)
  zeigeUebungsSchritt();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && aktiveUebung) schliesseUebung(); });
// Coach mit Claude: Schlüssel, Anfrage, Vorschau, Internet an/aus
coachSchluesselSpeichernBtn.addEventListener("click", speichereCoachSchluessel);
coachSchluesselLoeschenBtn.addEventListener("click", loescheCoachSchluessel);
coachKnopf.addEventListener("click", frageCoach);
coachVorschau.closest("details").addEventListener("toggle", async (e) => {
  if (!e.target.open || !bewertung) return;
  try {
    coachVorschau.textContent = JSON.stringify(await coachDatenJetzt(), null, 2);
  } catch (fehler) {
    coachVorschau.textContent = `Vorschau nicht möglich (${fehler.message})`;
  }
});
window.addEventListener("online", () => { if (!coachBox.hidden) zeigeCoachKnopf(); });
window.addEventListener("offline", () => { if (!coachBox.hidden) zeigeCoachKnopf(); });
// Nach dem Entsperren des Handys den Bildschirm wieder anlassen
document.addEventListener("visibilitychange", () => { if (aktiveUebung && document.visibilityState === "visible") bildschirmAnlassen(); });
zuAnalyseBtn.addEventListener("click", () => zeigeBereich("analyse"));
zuGespeichertBtn.addEventListener("click", () => zeigeBereich("gespeichert"));
zuEinstellungenBtn.addEventListener("click", () => zeigeBereich("einstellungen"));
zuWissenBtn.addEventListener("click", () => zeigeBereich("wissen"));
wissenZurueckBtn.addEventListener("click", zeigeWissenUebersicht);
lektionKarten.addEventListener("scroll", () => steuereLektionFigur(aktualisierePunkte(lektionKarten, lektionPunkte, lektionZaehler)), { passive: true });
schwungLoeschenBtn.addEventListener("click", loescheAktuellenSchwung);
sitzungLoeschenBtn.addEventListener("click", loescheGanzeSitzung);
videosSitzungLoeschenBtn.addEventListener("click", loescheVideosDerSitzung);
videosLoeschenBtn.addEventListener("click", loescheVideosAusEinstellungen);
allesLoeschenBtn.addEventListener("click", loescheAllesAusEinstellungen);
// Bei "Alles löschen": Der rote Knopf wird erst mit dem Häkchen antippbar
loeschHaken.addEventListener("change", () => {
  loeschBestaetigen.disabled = !loeschHaken.checked;
});

// Befund S7: Unerwartete Fehler nicht nur in der Entwicklerkonsole, sondern in der Statuszeile
window.addEventListener("error", (ereignis) => {
  setStatus(`Unerwarteter Fehler: ${ereignis.message || "unbekannt"}. Wenn etwas hängt: Seite neu laden.`);
});
window.addEventListener("unhandledrejection", (ereignis) => {
  const grund = ereignis.reason?.message || String(ereignis.reason || "unbekannt");
  setStatus(`Unerwarteter Fehler: ${grund}. Wenn etwas hängt: Seite neu laden.`);
});

// Befund S9: Signal an pwa.js – app.js und alle seine Dateien sind angekommen
document.documentElement.dataset.appGestartet = "ja";
// Bei sehr langsamem Netz kann app.js erst nach dem 20-s-Hinweis aus pwa.js ankommen.
// Dann läuft die App doch – den Hinweis "neu laden" wieder durch den Ladetext ersetzen.
if (statusText.textContent.startsWith("Die App ist nicht vollständig geladen")) {
  setStatus("Lade die Pose-Erkennung …");
}

// Los geht's
zeigeLevelAuswahl();
zeigeCoachEinstellung();
zeigeBereich(aktuellesLevel ? "analyse" : "einstellungen");
ladePoseErkennung().catch((fehler) => {
  poseFehlerText = `Die Pose-Erkennung konnte nicht starten (${fehler.message}).`;
  setzePoseStatus("fehler");
  setStatus(poseFehlerText);
});
