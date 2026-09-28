// ===============================================================
// Einen Schwung als kurzes Video ausschneiden (Etappe 8)
//
// Idee: Das Originalvideo spielt den Ausschnitt ganz normal ab. Jedes Bild wird
// auf eine unsichtbare Leinwand (Canvas) gemalt, und der MediaRecorder nimmt diese
// Leinwand als neues Video auf. Beides ist im Browser eingebaut, auch in Safari.
// Die Leinwand ist höchstens 1280 Pixel groß (720p) → ca. 2–3 MB pro Schwung,
// auch wenn das Original ein 4K-Video ist.
// ===============================================================

const MAX_SEITE = 1280;
const BITRATE = 2_500_000; // Bits pro Sekunde – gute Qualität bei kleiner Datei

// Welches Videoformat kann dieser Browser aufnehmen? Safari: MP4, Chrome/Firefox: auch WebM
function videoFormat() {
  if (typeof MediaRecorder === "undefined") return null;
  const formate = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
  return formate.find((f) => MediaRecorder.isTypeSupported(f)) ?? null;
}

// Kann dieses Gerät Clips aufnehmen?
export function kannKuerzen() {
  return (
    videoFormat() !== null &&
    "captureStream" in HTMLCanvasElement.prototype &&
    "requestVideoFrameCallback" in HTMLVideoElement.prototype
  );
}

// Schneidet start bis ende (Sekunden) aus dem Video, das gerade im Player steckt.
// springe(video, zeit) = Funktion aus videoanalyse.js (wartet, bis das Bild da ist)
// Rückgabe: { video: Blob, versatz } – versatz = so viele Sekunden steht am Anfang
// des Clips das erste Bild still, bevor das Video losläuft (siehe unten).
export async function schneideClip(video, start, ende, springe) {
  const skala = Math.min(1, MAX_SEITE / Math.max(video.videoWidth, video.videoHeight));
  const leinwand = document.createElement("canvas");
  // Gerade Zahlen: Videokodierer mögen keine ungeraden Breiten/Höhen
  leinwand.width = Math.round((video.videoWidth * skala) / 2) * 2;
  leinwand.height = Math.round((video.videoHeight * skala) / 2) * 2;
  const ctx = leinwand.getContext("2d");
  const male = () => ctx.drawImage(video, 0, 0, leinwand.width, leinwand.height);

  // Erstes Bild schon malen, bevor die Aufnahme beginnt – sonst wäre der Anfang schwarz.
  // Bis 5 s warten: Springen in iPhone-Videos (HEVC, 4K) kann länger als 1 s dauern.
  await springe(video, start, 5000);
  male();

  const format = videoFormat();
  const strom = leinwand.captureStream(30);
  const rekorder = new MediaRecorder(strom, { mimeType: format, videoBitsPerSecond: BITRATE });
  const teile = [];
  rekorder.ondataavailable = (e) => {
    if (e.data.size > 0) teile.push(e.data);
  };
  const gestoppt = new Promise((ok) => (rekorder.onstop = ok));
  const gestartet = new Promise((ok) => (rekorder.onstart = ok));
  rekorder.start();
  await gestartet;
  const aufnahmeStart = performance.now();

  // Versatz: Zwischen Aufnahmestart und dem ersten neuen Videobild vergehen ein paar
  // Millisekunden. So lange zeigt der Clip das Startbild. Wir messen das, damit
  // speicher.js die Posedaten passend verschieben kann – sonst läge das Skelett
  // im gespeicherten Clip ein paar Bilder neben dem Körper.
  let versatz = null;
  let abspielFehler = null; // verweigert der Browser das Abspielen (z. B. Stromsparmodus)?
  await new Promise((fertig) => {
    let rueckruf = null; // Nummer des angemeldeten Bild-Rückrufs
    // Schluss: am Clip-Ende – oder am Videoende ("ended"), wenn der Schwung ganz am Ende liegt.
    // Den noch angemeldeten Bild-Rückruf abmelden! Sonst meldet er sich beim nächsten
    // Clip und hält dort das Video an der falschen Stelle an.
    const schluss = () => {
      video.cancelVideoFrameCallback(rueckruf);
      video.removeEventListener("ended", schluss);
      video.pause();
      fertig();
    };
    video.addEventListener("ended", schluss);
    function bild(_jetzt, info) {
      male();
      if (versatz === null && info.mediaTime > start + 0.001) {
        versatz = (performance.now() - aufnahmeStart) / 1000 - (info.mediaTime - start);
      }
      if (info.mediaTime >= ende) return schluss();
      rueckruf = video.requestVideoFrameCallback(bild);
    }
    rueckruf = video.requestVideoFrameCallback(bild);
    video.playbackRate = 1; // Echtzeit – der Rekorder nimmt in Echtzeit auf
    // Ohne catch käme nie ein Bild und nie "ended" – das Speichern hinge für immer
    video.play().catch((fehler) => {
      abspielFehler = fehler;
      schluss();
    });
  });

  rekorder.stop();
  await gestoppt;
  strom.getTracks().forEach((spur) => spur.stop());
  // Der Clip wäre nur ein Standbild → Fehler melden; app.js speichert dann ohne Video
  if (abspielFehler) throw abspielFehler;
  return {
    video: new Blob(teile, { type: format.split(";")[0] }),
    versatz: Math.max(0, versatz ?? 0),
  };
}
