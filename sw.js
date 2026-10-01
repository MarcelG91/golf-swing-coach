// ===============================================================
// Service Worker
// Ein kleines Programm, das der Browser im Hintergrund zwischen App und
// Internet schaltet. Es speichert die App-Dateien und die Pose-Erkennung
// zwischen, damit die App auch ohne Netz funktioniert (z. B. auf der Range).
// ===============================================================

// Wenn sich hier etwas Grundlegendes ändert, die Nummer erhöhen –
// dann werden alte Zwischenspeicher beim nächsten Start aufgeräumt.
// 0.26.0: "cdn-v1" (MediaPipe von jsDelivr und Google) fällt weg, die Pose-Erkennung
// liegt jetzt in vendor/ (Befund C1). Neue Namen = der alte CDN-Speicher wird gelöscht.
const CACHE_APP = "app-v2";
const CACHE_VENDOR = "vendor-v1";

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
  "./wissen.js",
  "./nachschlagen.js",
  "./schaubilder.js",
  "./coach.js",
  "./pwa.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

// Pose-Erkennung von Google (ca. 19 MB): Programm, WebAssembly, Modell.
// Liegt geprüft im Ordner vendor/ (siehe vendor/README.md). Diese Dateien ändern sich nie –
// eine neue Version bekommt einen neuen Ordner. Deshalb: Speicher zuerst, kein Nachfragen.
const VENDOR_DATEIEN = [
  "./vendor/mediapipe-0.10.14/vision_bundle.mjs",
  "./vendor/mediapipe-0.10.14/wasm/vision_wasm_internal.js",
  "./vendor/mediapipe-0.10.14/wasm/vision_wasm_internal.wasm",
  "./vendor/pose-landmarker-full-float16-v1/pose_landmarker_full.task",
];
// Der Ordner als Adresspfad, z. B. "/golf-swing-coach/vendor/" auf GitHub Pages
const VENDOR_PFAD = new URL("./vendor/", self.location).pathname;

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
      const vendor = await caches.open(CACHE_VENDOR);
      // Einzeln speichern: Klappt eine Datei nicht, läuft der Rest trotzdem
      // (fehlende Dateien lädt pwa.js beim nächsten Start mit Internet nach)
      await Promise.all([
        ...APP_DATEIEN.map((url) => app.add(url).catch((f) => console.warn("Nicht gespeichert:", url, f))),
        ...VENDOR_DATEIEN.map((url) => vendor.add(url).catch((f) => console.warn("Nicht gespeichert:", url, f))),
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
        if (![CACHE_APP, CACHE_VENDOR].includes(name)) await caches.delete(name);
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

  if (url.origin !== self.location.origin) return; // fremde Adressen: normal ins Netz

  if (url.pathname.startsWith(VENDOR_PFAD)) {
    // Pose-Erkennung: ändert sich nie (fester Ordner je Version) → Speicher zuerst
    event.respondWith(speicherZuerst(anfrage));
  } else {
    // Eigene Dateien: erst Netz (damit Updates sofort ankommen), sonst Speicher
    event.respondWith(netzZuerst(anfrage));
  }
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
  const cache = await caches.open(CACHE_VENDOR);
  // ignoreVary: Antworten mit "Vary"-Kopfzeile findet Safari sonst unter Umständen
  // nicht wieder – dann fehlt die Pose-Erkennung offline.
  const gespeichert = await cache.match(anfrage.url, { ignoreVary: true });
  if (gespeichert) return gespeichert;
  // Noch nicht gespeichert (z. B. Installieren war unterbrochen): laden und aufheben.
  // Ohne Netz scheitert das – app.js zeigt dann, welche Datei fehlt.
  const antwort = await fetch(anfrage.url);
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
