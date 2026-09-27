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