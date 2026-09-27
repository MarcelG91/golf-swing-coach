// ===============================================================
// Golf Swing Coach – Etappe 1 bis 5
// Video laden, Skelett zeichnen, Schwungphasen erkennen, Schwung bewerten.
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
  zeichneSkelett(erkennePose());
}

function zeichneSkelett(punkte) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!punkte || !skelettAn.checked) return;

  // Linienstärke an die Videogröße anpassen, damit es in HD nicht zu dünn wirkt
  const staerke = Math.max(2, canvas.width / 250);
  zeichner.drawConnectors(punkte, PoseLandmarker.POSE_CONNECTIONS, {
    color: "#4ade80",
    lineWidth: staerke,
  });
  zeichner.drawLandmarks(punkte, {
    color: "#facc15",
    radius: staerke,
  });
  zeichneKopfMarke(staerke);
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
  bewertung = bewerteSchwung(analyseBilder, ergebnis, seitenverhaeltnis);
  zeigeErgebnis(ergebnis);
  zeigeBewertung(bewertung);
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

function zeigeBewertung({ ansicht, ansichtSicher, kennzahlen }) {
  ansichtInfo.textContent =
    (ansicht === "frontal" ? "Ansicht erkannt: frontal (von vorne)." : "Ansicht erkannt: von hinten (entlang der Ziellinie).") +
    (ansichtSicher ? "" : " Die Ansicht ist nicht eindeutig – filme möglichst genau von vorne oder genau von hinten.");

  kennzahlenListe.innerHTML = "";
  for (const k of kennzahlen) {
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
    karte.querySelector("strong").textContent = k.name;
    karte.querySelector(".abzeichen").textContent = STUFEN[k.bewertung];
    karte.querySelector(".wert").textContent = k.wert;
    karte.querySelector(".detail").textContent = k.detail;
    karte.querySelector(".text").textContent = k.text;
    if (k.tipp) {
      const tipp = document.createElement("p");
      tipp.className = "tipp";
      tipp.textContent = `💡 Übung: ${k.tipp}`;
      karte.appendChild(tipp);
    }
    kennzahlenListe.appendChild(karte);
  }
}

async function zeigePhase(schluessel, ergebnis) {
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
