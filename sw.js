// ===============================================================
// Service Worker
// Ein kleines Programm, das der Browser im Hintergrund zwischen App und
// Internet schaltet. Es speichert die App-Dateien und die Pose-Erkennung
// zwischen, damit die App auch ohne Netz funktioniert (z. B. auf der Range).
// ===============================================================

// Wenn sich hier etwas Grundlegendes ändert, die Nummer erhöhen –
// dann werden alte Zwischenspeicher beim nächsten Start aufgeräumt.
const CACHE_APP = "app-v1";
const CACHE_CDN = "cdn-v1";

// Unsere eigenen Dateien
const APP_DATEIEN = [
  "./",
  "./index.html",
  "./style.css",
  "./darstellung.js",
  "./app.js",
  "./phasen.js",
  "./kennzahlen.js",
  "./technik.js",
  "./ideallinien.js",
  "./videoanalyse.js",
  "./schwuenge.js",
  "./gesamtauswertung.js",
  "./speicher.js",
  "./videokuerzen.js",
  "./level.js",
  "./tipps.js",
  "./strichfigur.js",
  "./uebungsbilder.js",
  "./coach.js",
  "./pwa.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

// Pose-Erkennung von Google (ca. 19 MB): Programm, WebAssembly, Modell
const MP = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const CDN_DATEIEN = [
  MP,
  `${MP}/wasm/vision_wasm_internal.js`,
  `${MP}/wasm/vision_wasm_internal.wasm`,
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
];
const CDN_HOSTS = ["cdn.jsdelivr.net", "storage.googleapis.com"];

// Wie lange wir auf das Netz warten, bevor wir die gespeicherte Version nehmen.
// Wichtig bei schlechtem Empfang auf der Range.
const NETZ_WARTEZEIT_MS = 3000;

// ---------------------------------------------------------------
// 1. Installieren: alles vorab herunterladen und speichern
// ---------------------------------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const app = await caches.open(CACHE_APP);
      const cdn = await caches.open(CACHE_CDN);
      // Einzeln speichern: Klappt eine Datei nicht, läuft der Rest trotzdem
      await Promise.all([
        ...APP_DATEIEN.map((url) => app.add(url).catch((f) => console.warn("Nicht gespeichert:", url, f))),
        ...CDN_DATEIEN.map((url) => cdn.add(url).catch((f) => console.warn("Nicht gespeichert:", url, f))),
      ]);
      await self.skipWaiting(); // neue Version sofort aktivieren
    })()
  );
});

// ---------------------------------------------------------------
// 2. Aktivieren: alte Zwischenspeicher löschen
// ---------------------------------------------------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (![CACHE_APP, CACHE_CDN].includes(name)) await caches.delete(name);
      }
      await self.clients.claim(); // offene Seiten sofort übernehmen
    })()
  );
});

// ---------------------------------------------------------------
// 3. Jede Anfrage der App läuft hier durch
// ---------------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const anfrage = event.request;
  if (anfrage.method !== "GET") return;
  const url = new URL(anfrage.url);

  if (url.origin === self.location.origin) {
    // Eigene Dateien: erst Netz (damit Updates sofort ankommen), sonst Speicher
    event.respondWith(netzZuerst(anfrage));
  } else if (CDN_HOSTS.includes(url.hostname)) {
    // Pose-Erkennung: ändert sich nie (feste Version) → Speicher zuerst
    event.respondWith(speicherZuerst(anfrage));
  }
  // Alles andere geht normal ins Netz
});

async function netzZuerst(anfrage) {
  const cache = await caches.open(CACHE_APP);
  // cache: "no-cache" = beim Server immer nachfragen, ob es eine neuere Version gibt.
  // Ohne das nimmt der Browser eine Datei bis zu 10 Minuten (GitHub Pages) oder
  // noch länger (lokaler Server) aus seinem eigenen Zwischenspeicher. Nach einem
  // Update passen dann z. B. die neue app.js und eine alte ideallinien.js nicht
  // zusammen. Unveränderte Dateien kosten nur eine kurze Rückfrage ("304").
  // Seitenaufrufe (navigate) lassen sich nicht umbauen – für sie nehmen wir die Adresse.
  const frisch =
    anfrage.mode === "navigate"
      ? fetch(anfrage.url, { cache: "no-cache", credentials: "same-origin" })
      : fetch(anfrage, { cache: "no-cache" });
  const ausDemNetz = frisch.then((antwort) => {
    if (antwort.status === 200) cache.put(anfrage, antwort.clone());
    return ohneBrowserZwischenspeicher(antwort);
  });
  try {
    return await mitZeitlimit(ausDemNetz, NETZ_WARTEZEIT_MS);
  } catch {
    // Kein Netz oder zu langsam → gespeicherte Version
    const gespeichert = await cache.match(anfrage, { ignoreSearch: true, ignoreVary: true });
    if (gespeichert) return gespeichert;
    if (anfrage.mode === "navigate") {
      const startseite = await cache.match("./index.html");
      if (startseite) return startseite;
    }
    // Nichts gespeichert: doch weiter auf das Netz warten
    return ausDemNetz.catch(() => Response.error());
  }
}

// Die Antwort mit "Cache-Control: no-cache" an die Seite geben. Sonst hebt der
// Browser die Datei zusätzlich im Arbeitsspeicher auf und fragt beim nächsten
// Laden gar nicht erst nach – dann käme die Rückfrage oben nie beim Server an.
function ohneBrowserZwischenspeicher(antwort) {
  if (antwort.status !== 200) return antwort;
  const kopfzeilen = new Headers(antwort.headers);
  kopfzeilen.set("Cache-Control", "no-cache");
  return new Response(antwort.body, { status: antwort.status, statusText: antwort.statusText, headers: kopfzeilen });
}

async function speicherZuerst(anfrage) {
  const cache = await caches.open(CACHE_CDN);
  // ignoreVary: Das Modell kommt von Google mit "Vary: Origin". Safari findet solche
  // Einträge sonst unter Umständen nicht wieder – dann fehlt es offline.
  const gespeichert = await cache.match(anfrage.url, { ignoreVary: true });
  if (gespeichert) return gespeichert;
  // Mit CORS laden, damit die Antwort lesbar ist und gespeichert werden kann
  let antwort;
  try {
    antwort = await fetch(anfrage.url, { mode: "cors", credentials: "omit" });
  } catch {
    return fetch(anfrage); // Rückfall: so, wie die Seite gefragt hat
  }
  if (antwort.status === 200) cache.put(anfrage.url, antwort.clone());
  return antwort;
}

function mitZeitlimit(versprechen, ms) {
  return new Promise((ok, fehler) => {
    const t = setTimeout(() => fehler(new Error("Zeitlimit")), ms);
    versprechen.then(
      (wert) => { clearTimeout(t); ok(wert); },
      (grund) => { clearTimeout(t); fehler(grund); }
    );
  });
}
