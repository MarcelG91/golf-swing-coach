// ===============================================================
// Golf Swing Coach – Etappe 1 + 2
// Video laden, abspielen und das Körperskelett darüber zeichnen.
// ===============================================================

// MediaPipe (von Google) erkennt 33 Körperpunkte in einem Bild.
// Wir laden es direkt aus dem Internet (CDN), installieren müssen wir nichts.
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
// "full" ist genauer als "lite" und für Videoanalyse schnell genug.
const MODELL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";

const BILD_DAUER = 1 / 30; // ein Einzelbild bei 30 Bildern pro Sekunde

// --- Elemente aus index.html holen ---
const videoInput = document.getElementById("videoInput");
const statusText = document.getElementById("status");
const buehne = document.getElementById("buehne");
const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const steuerung = document.getElementById("steuerung");
const playPauseBtn = document.getElementById("playPause");
const zurueckBtn = document.getElementById("zurueck");
const vorBtn = document.getElementById("vor");
const tempoSelect = document.getElementById("tempo");
const skelettAn = document.getElementById("skelettAn");

const ctx = canvas.getContext("2d");
const zeichner = new DrawingUtils(ctx);

let poseLandmarker = null;
let letzterZeitstempel = -1;

// Hier merken wir uns für jeden Zeitpunkt im Video die erkannten Körperpunkte.
// Das brauchen wir ab Etappe 3, um Schwungphasen und Fehler zu finden.
const posenProZeit = new Map();

function setStatus(text) {
  statusText.textContent = text;
}

// ---------------------------------------------------------------
// 1. Pose-Erkennung laden (erst mit Grafikkarte, sonst mit Prozessor)
// ---------------------------------------------------------------
async function ladePoseErkennung() {
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  for (const delegate of ["GPU", "CPU"]) {
    try {
      poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODELL_URL, delegate },
        runningMode: "VIDEO",
        numPoses: 1, // nur eine Person: du
      });
      setStatus("Bereit. Wähle ein Schwungvideo aus.");
      return;
    } catch (fehler) {
      console.warn(`Pose-Erkennung mit ${delegate} fehlgeschlagen:`, fehler);
    }
  }
  setStatus("Die Pose-Erkennung konnte nicht geladen werden. Internetverbindung prüfen und Seite neu laden.");
}

// ---------------------------------------------------------------
// 2. Das aktuelle Videobild analysieren und das Skelett zeichnen
// ---------------------------------------------------------------
function analysiereAktuellesBild() {
  if (!poseLandmarker || video.readyState < 2) return;

  // MediaPipe verlangt stetig steigende Zeitstempel, auch wenn wir im Video zurückspulen.
  const zeitstempel = Math.max(performance.now(), letzterZeitstempel + 1);
  letzterZeitstempel = zeitstempel;

  const ergebnis = poseLandmarker.detectForVideo(video, zeitstempel);
  const punkte = ergebnis.landmarks[0]; // Körperpunkte der ersten (einzigen) Person

  if (punkte) {
    posenProZeit.set(Math.round(video.currentTime * 1000), punkte);
  }
  zeichneSkelett(punkte);
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
// 4. Bedienung
// ---------------------------------------------------------------
videoInput.addEventListener("change", () => {
  const datei = videoInput.files[0];
  if (!datei) return;
  posenProZeit.clear();
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
  setStatus("Video geladen. Abspielen oder Bild für Bild durchgehen.");
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
  setStatus(`${posenProZeit.size} Bilder analysiert.`);
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

// Los geht's
ladePoseErkennung();
