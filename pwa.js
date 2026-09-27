// ===============================================================
// App-Funktionen rund um Installation und Offline-Betrieb
// Läuft getrennt von app.js: Selbst wenn die Pose-Erkennung nicht lädt,
// funktionieren Hinweise und Statusanzeige trotzdem.
// ===============================================================

export const APP_VERSION = "0.7.1";

// Muss zu den Namen in sw.js passen
const CACHE_APP = "app-v1";
const CACHE_CDN = "cdn-v1";

// Eigene Dateien, die für den Offline-Betrieb gespeichert sein müssen
const APP_DATEIEN = ["./", "./style.css", "./app.js", "./phasen.js", "./kennzahlen.js", "./technik.js", "./ideallinien.js", "./pwa.js"];

const $ = (id) => document.getElementById(id);

// Läuft die App vom Home-Bildschirm (also "installiert")?
const installiert =
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

// iPhone oder iPad? (iPads melden sich teils als Mac mit Touchscreen)
const istIOS =
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

// ---------------------------------------------------------------
// 1. Service Worker anmelden (macht die App offline-fähig)
// ---------------------------------------------------------------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch((fehler) => {
    console.warn("Service Worker konnte nicht starten:", fehler);
  });
}

// ---------------------------------------------------------------
// 2. Statuszeile unten: Version, Netz, Speicherschutz
// ---------------------------------------------------------------
$("version").textContent = `Version ${APP_VERSION}`;

function zeigeNetz() {
  $("netzStatus").textContent = navigator.onLine ? "online" : "offline";
}

// ---------------------------------------------------------------
// Offline-Bereitschaft: Sind alle nötigen Dateien gespeichert?
// Fehlt etwas und wir sind online, wird es direkt nachgeladen.
// ---------------------------------------------------------------
export async function pruefeOfflineDateien(cdnDateien, { reparieren = false } = {}) {
  if (!("caches" in window)) return { bereit: false, fehlend: [...cdnDateien] };
  const fehlend = [];
  const liste = [
    ...APP_DATEIEN.map((pfad) => ({ cache: CACHE_APP, url: new URL(pfad, location.href).href })),
    ...cdnDateien.map((url) => ({ cache: CACHE_CDN, url })),
  ];
  for (const { cache: name, url } of liste) {
    const cache = await caches.open(name);
    let vorhanden = !!(await cache.match(url, { ignoreVary: true, ignoreSearch: name === CACHE_APP }));
    if (!vorhanden && reparieren && navigator.onLine) {
      try {
        await cache.add(new Request(url, { mode: "cors", credentials: "omit" }));
        vorhanden = true;
      } catch (fehler) {
        console.warn("Konnte nicht nachladen:", url, fehler);
      }
    }
    if (!vorhanden) fehlend.push(url);
  }
  return { bereit: fehlend.length === 0, fehlend };
}

// Wird von app.js aufgerufen, sobald die Pose-Erkennung erfolgreich geladen ist
export async function meldeOfflineBereitschaft(cdnDateien) {
  const anzeige = $("offlineStatus");
  anzeige.textContent = "Offline-Prüfung …";
  const { bereit, fehlend } = await pruefeOfflineDateien(cdnDateien, { reparieren: true });
  anzeige.textContent = bereit
    ? "Offline bereit ✓"
    : `Offline noch nicht bereit (${fehlend.length} Datei${fehlend.length === 1 ? "" : "en"} fehlt)`;
  anzeige.title = fehlend.join("\n");
}

// Kurzer, lesbarer Dateiname aus einer Adresse
export function dateiname(url) {
  return url.split("/").pop() || url;
}
window.addEventListener("online", zeigeNetz);
window.addEventListener("offline", zeigeNetz);
zeigeNetz();

async function pruefeSpeicherschutz() {
  const anzeige = $("speicherStatus");
  if (!navigator.storage?.persisted) {
    anzeige.textContent = "Speicherschutz nicht verfügbar";
    return;
  }
  let geschuetzt = await navigator.storage.persisted();
  // Nur als installierte App fragen – dann wird es in der Regel gewährt,
  // und manche Browser zeigen sonst eine Rückfrage an.
  if (!geschuetzt && installiert) geschuetzt = await navigator.storage.persist();
  anzeige.textContent = geschuetzt ? "Daten geschützt ✓" : "Daten nicht dauerhaft geschützt";
}
pruefeSpeicherschutz();

// ---------------------------------------------------------------
// 3. Hinweis: App zum Home-Bildschirm hinzufügen
// ---------------------------------------------------------------
const HINWEIS_WEG = "installHinweisGeschlossen";

function hinweisWurdeGeschlossen() {
  try {
    return localStorage.getItem(HINWEIS_WEG) === "ja";
  } catch {
    return false;
  }
}

$("installHinweisZu").addEventListener("click", () => {
  $("installHinweis").hidden = true;
  try {
    localStorage.setItem(HINWEIS_WEG, "ja");
  } catch {
    // Privater Modus o. ä. – dann erscheint der Hinweis eben beim nächsten Mal wieder
  }
});

// iPhone: Safari hat keinen Installieren-Knopf, also erklären wir den Weg
if (istIOS && !installiert && !hinweisWurdeGeschlossen()) {
  $("installText").innerHTML =
    "📲 <strong>Tipp:</strong> Tippe in Safari auf <strong>Teilen</strong> und dann auf " +
    "<strong>„Zum Home-Bildschirm“</strong>. Dann startet der Swing Coach wie eine App – auch ohne Netz.";
  $("installHinweis").hidden = false;
}

// Android / Chrome: Der Browser bietet einen eigenen Installieren-Dialog an
let installAngebot = null;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installAngebot = event;
  if (hinweisWurdeGeschlossen()) return;
  $("installText").textContent = "📲 Den Swing Coach als App installieren – dann funktioniert er auch ohne Netz.";
  $("installKnopf").hidden = false;
  $("installHinweis").hidden = false;
});

$("installKnopf").addEventListener("click", async () => {
  if (!installAngebot) return;
  installAngebot.prompt();
  await installAngebot.userChoice;
  installAngebot = null;
  $("installHinweis").hidden = true;
});

// ---------------------------------------------------------------
// 4. Offline und Pose-Erkennung noch nie geladen? Verständlich erklären.
// ---------------------------------------------------------------
if (!navigator.onLine) {
  setTimeout(() => {
    const status = $("status");
    if (status.textContent.startsWith("Lade die Pose-Erkennung")) {
      status.textContent =
        "Offline: Die Pose-Erkennung wurde auf diesem Gerät noch nicht gespeichert. " +
        "Öffne die App einmal mit Internet, danach klappt es auch offline.";
    }
  }, 8000);
}
