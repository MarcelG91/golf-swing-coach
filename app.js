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

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
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
let letzterZeitstempel = -1;
let analyseLaeuft = false;
let videoName = "";

// Ergebnis der letzten Analyse: alle Bilder mit Körperpunkten + Bewertung
let analyseBilder = [];
let bewertung = null;
let technik = null; // Arme, Oberkörper, Drehung (technik.js)
let phasenErgebnis = null; // Zeitpunkte von Ansprechen, Top, Treffmoment, Finish
// Welche Messlinien gerade im Video eingezeichnet werden ("Im Video zeigen")
let aktiveMessung = null;

// Farben der Messlinien
const MESS_FARBE = "#38bdf8"; // blau: dieser Moment
const GEIST_FARBE = "rgba(255, 255, 255, 0.9)"; // weiß gestrichelt: beim Ansprechen
const LOT_FARBE = "rgba(255, 255, 255, 0.55)"; // senkrechte Hilfslinie

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
  // Messlinien nur in dem Bild zeigen, zu dem "Im Video zeigen" gesprungen ist
  const messungSichtbar = aktiveMessung && Math.abs(video.currentTime - aktiveMessung.zeit) < BILD_DAUER / 2;
  // Bei "Selbst prüfen" bleibt das Bild frei, damit du deinen Körper gut siehst
  const skelettZeigen = skelettAn.checked && !(messungSichtbar && aktiveMessung.ohneSkelett);

  if (skelettZeigen) {
    // Mit Messlinien tritt das Skelett etwas zurück, damit die Linien auffallen
    ctx.globalAlpha = messungSichtbar ? 0.4 : 1;
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
    ctx.globalAlpha = 1;
  }
  if (messungSichtbar) zeichneMessung(punkte);
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
// Messlinien für "Im Video zeigen"
// Blau = dieser Moment, weiß gestrichelt = beim Ansprechen.
// ---------------------------------------------------------------
function zeichneMessung(punkte) {
  const ansprechen = gespeichertesBild(phasenErgebnis.ansprechen.zeit)?.punkte;
  const px = (p) => ({ x: p.x * canvas.width, y: p.y * canvas.height });
  const mittePx = (p, a, b) => px({ x: (p[a].x + p[b].x) / 2, y: (p[a].y + p[b].y) / 2 });
  const staerke = Math.max(3, canvas.width / 160);

  const linie = (a, b, farbe = MESS_FARBE, gestrichelt = false, breite = staerke) => {
    ctx.strokeStyle = farbe;
    ctx.lineWidth = breite;
    ctx.setLineDash(gestrichelt ? [breite * 3, breite * 2] : []);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };
  const kreis = (m, radius, farbe = MESS_FARBE, gefuellt = true) => {
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(m.x, m.y, radius, 0, Math.PI * 2);
    if (gefuellt) {
      ctx.fillStyle = farbe;
      ctx.fill();
    } else {
      ctx.strokeStyle = farbe;
      ctx.lineWidth = staerke;
      ctx.stroke();
    }
  };

  ctx.save();
  ctx.lineCap = "round";
  // Dunkler Schatten, damit die Linien auch auf hellem Hintergrund gut sichtbar sind
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = staerke;
  for (const art of aktiveMessung.zeichnung) {
    if (art === "wirbelsaeule") {
      // Oberkörper-Linie (Hüftmitte → Schultermitte) mit senkrechter Hilfslinie
      const huefte = mittePx(punkte, 23, 24);
      const schulter = mittePx(punkte, 11, 12);
      const laenge = Math.hypot(schulter.x - huefte.x, schulter.y - huefte.y);
      if (ansprechen) linie(mittePx(ansprechen, 23, 24), mittePx(ansprechen, 11, 12), GEIST_FARBE, true);
      linie(huefte, { x: huefte.x, y: huefte.y - laenge }, LOT_FARBE, true, staerke / 2);
      linie(huefte, schulter);
      kreis(huefte, staerke * 1.5);
    }
    if (art === "schultern") {
      if (ansprechen) linie(px(ansprechen[11]), px(ansprechen[12]), GEIST_FARBE, true);
      linie(px(punkte[11]), px(punkte[12]));
    }
    if (art === "huefte") {
      // Hüftmitte jetzt und beim Ansprechen, mit senkrechter Linie als Bezug
      if (ansprechen) {
        const alt = mittePx(ansprechen, 23, 24);
        linie({ x: alt.x, y: alt.y - canvas.height * 0.2 }, { x: alt.x, y: alt.y + canvas.height * 0.2 }, GEIST_FARBE, true, staerke / 2);
        kreis(alt, staerke * 1.5, GEIST_FARBE);
      }
      linie(px(punkte[23]), px(punkte[24]));
      kreis(mittePx(punkte, 23, 24), staerke * 1.8);
    }
    if (art === "fuehrungsarm" && technik) {
      const { schulter, ellbogen, handgelenk } = technik.fuehrung;
      linie(px(punkte[schulter]), px(punkte[ellbogen]));
      linie(px(punkte[ellbogen]), px(punkte[handgelenk]));
      kreis(px(punkte[ellbogen]), staerke * 1.8);
    }
    if (art === "arme") {
      // Senkrechte unter der Schultermitte: Dort sollten die Hände ungefähr hängen
      const schulter = mittePx(punkte, 11, 12);
      const haende = mittePx(punkte, 15, 16);
      linie(schulter, { x: schulter.x, y: haende.y + canvas.height * 0.05 }, GEIST_FARBE, true, staerke / 2);
      linie(schulter, haende);
      kreis(haende, staerke * 1.8);
    }
    if (art === "haende") {
      // Waagerechte in Schulterhöhe: Wie hoch sind die Hände darüber?
      const schulter = mittePx(punkte, 11, 12);
      const haende = mittePx(punkte, 15, 16);
      linie({ x: canvas.width * 0.05, y: schulter.y }, { x: canvas.width * 0.95, y: schulter.y }, LOT_FARBE, true, staerke / 2);
      linie({ x: haende.x, y: schulter.y }, haende, MESS_FARBE, false, staerke / 2);
      kreis(haende, staerke * 1.8);
    }
    if (art === "kopf") {
      const teile = [0, 2, 5, 7, 8].map((k) => punkte[k]);
      const kopf = px({ x: teile.reduce((s, p) => s + p.x, 0) / 5, y: teile.reduce((s, p) => s + p.y, 0) / 5 });
      kreis(kopf, canvas.height * 0.045, MESS_FARBE, false);
    }
  }

  // Beschriftung oben links
  const schrift = Math.max(14, canvas.height * 0.028);
  const zeilen = [
    aktiveMessung.titel,
    aktiveMessung.zeichnung.length ? "blau = dieser Moment · weiß gestrichelt = Ansprechen" : "Schau selbst hin – das Skelett ist ausgeblendet",
  ];
  ctx.shadowBlur = 0;
  ctx.setLineDash([]);
  ctx.font = `600 ${schrift}px -apple-system, BlinkMacSystemFont, sans-serif`;
  const breite = Math.max(...zeilen.map((z) => ctx.measureText(z).width)) + schrift;
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.fillRect(schrift * 0.5, schrift * 0.5, breite, schrift * 2.9);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(zeilen[0], schrift, schrift * 1.6);
  ctx.font = `${schrift * 0.75}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText(zeilen[1], schrift, schrift * 2.8);
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
  if (!poseLandmarker) return;
  video.pause();
  analyseLaeuft = true;
  setzeKnoepfeAktiv(false);
  ergebnisBox.hidden = true;
  analyseBilder = [];
  bewertung = null;
  technik = null;
  aktiveMessung = null;

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
  for (const knopf of [playPauseBtn, zurueckBtn, vorBtn, analysierenBtn, videoInput]) {
    knopf.disabled = !aktiv;
  }
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
    karte.appendChild(zeigenKnopf({ ...check, wert: "selbst prüfen", zeichnung: [], ohneSkelett: true }));
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

// Springt zum passenden Moment und zeichnet die Messlinien ein
async function zeigeMessung(k) {
  const zeit = phasenErgebnis[k.phase].zeit;
  aktiveMessung = { zeit, zeichnung: k.zeichnung || [], titel: `${k.name}: ${k.wert}`, ohneSkelett: k.ohneSkelett };
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
  setStatus("Video geladen. Tippe auf „Schwung analysieren“ oder spiel es ab.");
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
ladePoseErkennung();
