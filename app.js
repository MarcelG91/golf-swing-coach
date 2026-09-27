// ===============================================================
// Golf Swing Coach – Etappe 1 bis 5 + Technik-Tipps
// Video laden, Skelett zeichnen, Schwungphasen erkennen, Schwung bewerten,
// Tipps zu Armen, Oberkörperhaltung und Drehung mit Messlinien im Video.
// ===============================================================

// MediaPipe (von Google) erkennt 33 Körperpunkte in einem Bild.
// Wir laden es direkt aus dem Internet (CDN), installieren müssen wir nichts.
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

// Unsere eigene Logik für die Schwungphasen (reine Rechnerei, siehe phasen.js)
import { erkennePhasen } from "./phasen.js";
// Kennzahlen und Tipps (siehe kennzahlen.js)
import { bewerteSchwung } from "./kennzahlen.js";
// Arme, Oberkörper, Drehung + wichtigste Baustellen (siehe technik.js)
import { bewerteTechnik, ordneEin, wichtigsteBaustellen, KATEGORIEN } from "./technik.js";
// Rote Abweichungen und gelbe Ideallinien im Video (siehe ideallinien.js)
import { ideallinien, MIT_LINIE } from "./ideallinien.js";
// Offline-Prüfung (siehe pwa.js)
import { meldeOfflineBereitschaft, pruefeOfflineDateien, dateiname } from "./pwa.js";

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
const warnungenListe = $("warnungen");
const exportierenBtn = $("exportieren");

const ctx = canvas.getContext("2d");
const zeichner = new DrawingUtils(ctx);

let poseLandmarker = null;
let poseStatus = "laedt"; // "laedt" | "bereit" | "fehler"
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
// Welche Kennzahl gerade per "Im Video zeigen" eingezeichnet wird
let aktiveMessung = null;

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
      setzePoseStatus("bereit");
      setStatus(
        video.src
          ? "Pose-Erkennung bereit. Tippe auf „Schwung analysieren“."
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
    bereit: "🔍 Schwung analysieren",
    fehler: "⚠️ Pose-Erkennung fehlt",
  };
  analysierenBtn.textContent = texte[neu];
  analysierenBtn.disabled = neu !== "bereit" || analyseLaeuft;
}

// ---------------------------------------------------------------
// 2. Ein Videobild analysieren und das Skelett zeichnen
// ---------------------------------------------------------------
function erkennePose() {
  // MediaPipe verlangt stetig steigende Zeitstempel, auch wenn wir im Video zurückspulen.
  const zeitstempel = Math.max(performance.now(), letzterZeitstempel + 1);
  letzterZeitstempel = zeitstempel;
  const ergebnis = poseLandmarker.detectForVideo(video, zeitstempel);
  return ergebnis.landmarks[0] || null; // Körperpunkte der ersten (einzigen) Person
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
  const gemessen = alleKennzahlen.filter((k) => k.phase === phase.schluessel && MIT_LINIE.has(k.id));
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
// 4. Ganzen Schwung analysieren: Bild für Bild durch das Video gehen
// ---------------------------------------------------------------

// Springt zu einer Zeit im Video und wartet, bis das Bild wirklich da ist
function springeZu(zeit) {
  return new Promise((fertig) => {
    if (Math.abs(video.currentTime - zeit) < 0.001) return fertig();
    const sicherheit = setTimeout(fertig, 2000); // falls der Browser kein "seeked" meldet
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

async function analysiereSchwung() {
  if (poseStatus !== "bereit") {
    setStatus(poseFehlerText || "Die Pose-Erkennung lädt noch – einen Moment.");
    return;
  }
  video.pause();
  analyseLaeuft = true;
  setzeKnoepfeAktiv(false);
  ergebnisBox.hidden = true;
  analyseBilder = [];
  bewertung = null;
  technik = null;
  aktiveMessung = null;
  alleKennzahlen = [];

  const anzahl = Math.floor(video.duration / BILD_DAUER);
  for (let i = 0; i <= anzahl; i++) {
    const zeit = i * BILD_DAUER;
    await springeZu(zeit);
    const punkte = erkennePose();
    analyseBilder.push({ zeit, punkte });
    zeichneSkelett(punkte);
    if (i % 5 === 0) setStatus(`Analysiere … ${Math.round((i / anzahl) * 100)} %`);
  }

  analyseLaeuft = false;
  setzeKnoepfeAktiv(true);

  const seitenverhaeltnis = video.videoWidth / video.videoHeight;
  const ergebnis = erkennePhasen(analyseBilder, seitenverhaeltnis);
  if (ergebnis.fehler) {
    setStatus(ergebnis.fehler);
    return;
  }
  phasenErgebnis = ergebnis;
  bewertung = bewerteSchwung(analyseBilder, ergebnis, seitenverhaeltnis);
  technik = bewerteTechnik(analyseBilder, ergebnis, seitenverhaeltnis, bewertung.ansicht);
  zeigeErgebnis(ergebnis);
  zeigeBewertung();
  setStatus("Analyse fertig.");
  zeigePhase("top", ergebnis);
}

function setzeKnoepfeAktiv(aktiv) {
  for (const knopf of [playPauseBtn, zurueckBtn, vorBtn, videoInput]) {
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

  // 1. Die wichtigsten Baustellen – ausführlich, mit Übung
  baustellenListe.innerHTML = "";
  const baustellen = wichtigsteBaustellen(alle);
  if (baustellen.length === 0) {
    const lob = document.createElement("p");
    lob.className = "karte gut";
    lob.textContent = "Keine größere Baustelle gefunden – stark! Filme als Nächstes die andere Ansicht, dann prüft die App weitere Punkte.";
    baustellenListe.appendChild(lob);
  }
  baustellen.forEach((k, i) => baustellenListe.appendChild(baueKarte(k, { nummer: i + 1, offen: true })));

  // 2. Alle Kennzahlen nach Bereichen
  kennzahlenListe.innerHTML = "";
  for (const kategorie of KATEGORIEN) {
    // Erst was zu verbessern ist, dann Achtung, dann was schon gut ist
    const rang = { verbessern: 0, achtung: 1, unsicher: 2, gut: 3 };
    const inKategorie = alle
      .filter((k) => k.kategorie === kategorie.schluessel)
      .sort((a, b) => rang[a.bewertung] - rang[b.bewertung]);
    if (inKategorie.length === 0) continue;
    const titel = document.createElement("h4");
    titel.textContent = kategorie.name;
    kennzahlenListe.appendChild(titel);
    for (const k of inKategorie) kennzahlenListe.appendChild(baueKarte(k));
  }

  // 3. Was die App nicht sicher messen kann: selbst im Video nachschauen
  selbstCheckListe.innerHTML = "";
  for (const check of technik.selbstChecks) {
    const karte = document.createElement("article");
    karte.className = "karte unsicher";
    karte.innerHTML = `<div class="karte-kopf"><strong></strong></div><p class="text"></p>`;
    karte.querySelector("strong").textContent = check.name;
    karte.querySelector(".text").textContent = check.text;
    karte.appendChild(zeigenKnopf({ ...check, wert: "selbst prüfen", ohneSkelett: true }));
    selbstCheckListe.appendChild(karte);
  }
}

// Eine Karte für eine Kennzahl. offen = Tipp und Übung direkt sichtbar (Baustellen).
function baueKarte(k, { nummer = null, offen = false } = {}) {
  const karte = document.createElement("article");
  karte.className = `karte ${k.bewertung}`;
  // textContent statt innerHTML für die Texte: sicher und einfach
  karte.innerHTML = `
    <div class="karte-kopf">
      <strong></strong>
      <span class="abzeichen"></span>
    </div>
    <div class="wert"></div>
    <p class="detail"></p>
    <p class="text"></p>`;
  karte.querySelector("strong").textContent = nummer ? `${nummer}. ${k.name}` : k.name;
  karte.querySelector(".abzeichen").textContent = STUFEN[k.bewertung];
  karte.querySelector(".wert").textContent = k.wert;
  karte.querySelector(".detail").textContent = k.detail;
  karte.querySelector(".text").textContent = k.text;

  // "So geht's" (Gefühl) und Übung – bei den Baustellen offen, sonst zum Aufklappen
  const hilfen = [];
  if (k.gefuehl) hilfen.push(["gefuehl", `🎯 So geht's: ${k.gefuehl}`]);
  if (k.tipp) hilfen.push(["tipp", `💡 Übung: ${k.tipp}`]);
  if (hilfen.length) {
    const behaelter = offen ? karte : document.createElement("details");
    if (!offen) {
      const zusammenfassung = document.createElement("summary");
      zusammenfassung.textContent = "So verbesserst du es";
      behaelter.appendChild(zusammenfassung);
      karte.appendChild(behaelter);
    }
    for (const [klasse, text] of hilfen) {
      const absatz = document.createElement("p");
      absatz.className = klasse;
      absatz.textContent = text;
      behaelter.appendChild(absatz);
    }
  }
  if (k.phase) karte.appendChild(zeigenKnopf(k));
  return karte;
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
  link.href = URL.createObjectURL(blob);
  link.download = `posedaten-${videoName.replace(/\.[^.]+$/, "") || "schwung"}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ---------------------------------------------------------------
// 6. Bedienung
// ---------------------------------------------------------------
videoInput.addEventListener("change", () => {
  const datei = videoInput.files[0];
  if (!datei) return;
  videoName = datei.name;
  analyseBilder = [];
  bewertung = null;
  technik = null;
  aktiveMessung = null;
  alleKennzahlen = [];
  ergebnisBox.hidden = true;
  video.src = URL.createObjectURL(datei); // Video bleibt auf deinem Gerät
  setStatus(`Lade „${datei.name}“ …`);
});

video.addEventListener("loadedmetadata", () => {
  // Leinwand genau so groß wie das Video machen
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  buehne.style.setProperty("--ratio", video.videoWidth / video.videoHeight);
  video.playbackRate = Number(tempoSelect.value);

  buehne.hidden = false;
  steuerung.hidden = false;
  video.currentTime = 0; // löst "seeked" aus → erstes Bild wird analysiert
  if (poseStatus === "bereit") setStatus("Video geladen. Tippe auf „Schwung analysieren“ oder spiel es ab.");
  else if (poseStatus === "fehler") setStatus(`Video geladen – aber: ${poseFehlerText}`);
  else setStatus("Video geladen. Die Pose-Erkennung lädt noch …");
});

video.addEventListener("error", () => {
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
analysierenBtn.addEventListener("click", analysiereSchwung);
exportierenBtn.addEventListener("click", exportiereDaten);

// Los geht's
ladePoseErkennung().catch((fehler) => {
  poseFehlerText = `Die Pose-Erkennung konnte nicht starten (${fehler.message}).`;
  setzePoseStatus("fehler");
  setStatus(poseFehlerText);
});
