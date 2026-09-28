import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJEKT = fileURLToPath(new URL("..", import.meta.url));
const QUELLDATEIEN = fs.readdirSync(PROJEKT)
  .filter((datei) => /\.(js|html|webmanifest)$/.test(datei))
  .map((datei) => ({ datei, text: fs.readFileSync(path.join(PROJEKT, datei), "utf8") }));
const QUELLTEXT = QUELLDATEIEN.map(({ text }) => text).join("\n");
const APP = QUELLDATEIEN.find(({ datei }) => datei === "app.js").text;
const PWA = QUELLDATEIEN.find(({ datei }) => datei === "pwa.js").text;
const SERVICE_WORKER = QUELLDATEIEN.find(({ datei }) => datei === "sw.js").text;

function dateiliste(text) {
  const treffer = text.match(/APP_DATEIEN\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(treffer, "APP_DATEIEN muss vorhanden sein");
  return [...treffer[1].matchAll(/["']([^"']+)["']/g)].map(([, datei]) => datei);
}

test("Nur erlaubte Netzwerk-Hosts sind eingebaut", () => {
  const erlaubt = new Set(["127.0.0.1", "cdn.jsdelivr.net", "storage.googleapis.com"]);
  const hosts = [...QUELLTEXT.matchAll(/https?:\/\/[^\s"'`]+/g)]
    .map(([adresse]) => new URL(adresse.replace(/[),;]+$/, "")).hostname);
  assert.deepEqual([...new Set(hosts)].filter((host) => !erlaubt.has(host)), []);
});

test("MediaPipe-Version und Modell stimmen in App und Service Worker überein", () => {
  const appVersion = APP.match(/tasks-vision@(\d+\.\d+\.\d+)/)?.[1];
  const workerVersion = SERVICE_WORKER.match(/tasks-vision@(\d+\.\d+\.\d+)/)?.[1];
  const modell = APP.match(/const MODELL_URL\s*=\s*\n?\s*["']([^"']+)["']/)?.[1];
  assert.ok(appVersion, "MediaPipe-Version muss in app.js stehen");
  assert.equal(workerVersion, appVersion);
  assert.ok(modell, "Modell-Adresse muss in app.js stehen");
  assert.ok(SERVICE_WORKER.includes(modell));
});

test("Alle JavaScript-Appdateien stehen in beiden Offline-Listen", () => {
  const serviceWorkerDateien = dateiliste(SERVICE_WORKER);
  const pwaDateien = dateiliste(PWA);
  const appDateien = fs.readdirSync(PROJEKT)
    .filter((datei) => datei.endsWith(".js") && datei !== "sw.js");
  const fehlen = appDateien.filter((datei) =>
    !serviceWorkerDateien.includes(`./${datei}`) || !pwaDateien.includes(`./${datei}`)
  );
  assert.deepEqual(fehlen, [], `Fehlende Offline-Dateien: ${fehlen.join(", ")}`);
});

test("Kein dynamischer Code wird ausgeführt", () => {
  assert.doesNotMatch(QUELLTEXT, /\beval\s*\(|\bnew\s+Function\s*\(|setTimeout\(\s*["'`]/);
});

// ---------------------------------------------------------------
// Speichern und Löschen bleiben lokal und fassen nur die Schwung-Datenbank an
// ---------------------------------------------------------------

// Kommentare entfernen: Dort dürfen die Wörter stehen – z. B. als Erklärung, warum
// wir etwas NICHT tun. "https://" bleibt erhalten (vor dem // steht kein Leerzeichen).
const ohneKommentare = (text) =>
  text.replace(/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g, "").replace(/(^|\s)\/\/.*$/gm, "$1");
const SPEICHER_CODE = ohneKommentare(QUELLDATEIEN.find(({ datei }) => datei === "speicher.js").text);

test("speicher.js sendet nichts ins Netz", () => {
  assert.doesNotMatch(SPEICHER_CODE, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource/);
});

test("speicher.js fasst den localStorage nicht an (Level, später Coach-Schlüssel)", () => {
  assert.doesNotMatch(SPEICHER_CODE, /localStorage|sessionStorage/);
});

test("Nirgends wird der ganze Einstellungsspeicher, die Datenbank oder der Offline-Speicher gelöscht", () => {
  // localStorage.clear() würde Level und Coach-Schlüssel mitlöschen,
  // deleteDatabase() die Datenbank im Ganzen (Löschen geht nur gezielt über speicher.js).
  assert.doesNotMatch(ohneKommentare(QUELLTEXT), /localStorage\.clear\s*\(|sessionStorage\.clear\s*\(|indexedDB\.deleteDatabase/);
  // Alte Offline-Speicher räumt nur der Service Worker beim Update auf.
  const ohneServiceWorker = QUELLDATEIEN.filter(({ datei }) => datei !== "sw.js").map(({ text }) => ohneKommentare(text)).join("\n");
  assert.doesNotMatch(ohneServiceWorker, /caches\.delete\s*\(/);
});

// ---------------------------------------------------------------
// Rechenlogik bleibt frei von Browser-Code (Regel aus CLAUDE.md)
// So bleiben diese Dateien mit node --test prüfbar – und die Texte der Tipps
// können nie direkt als HTML in die Seite geraten.
// ---------------------------------------------------------------
const RECHENLOGIK = [
  "phasen.js", "kennzahlen.js", "technik.js", "ideallinien.js", "level.js",
  "tipps.js", "strichfigur.js", "schwuenge.js", "gesamtauswertung.js",
];

test("Rechenlogik-Dateien benutzen keinen Browser-Code", () => {
  for (const datei of RECHENLOGIK) {
    const code = ohneKommentare(QUELLDATEIEN.find((q) => q.datei === datei).text);
    assert.doesNotMatch(code, /\b(document|window|navigator|localStorage|indexedDB|fetch)\b|innerHTML/, `${datei} enthält Browser-Code`);
  }
});
