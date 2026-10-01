// Pose-Erkennung selbst ausgeliefert (Befund C1, seit 0.26.0)
//
// Die Dateien in vendor/ wurden einmal sorgfältig geprüft (Herkunft und Prüfung: vendor/README.md).
// Hier steht ihre SHA-256-Prüfsumme fest – eine Art Fingerabdruck. Ändert sich auch nur ein Byte
// oder liegt eine ungeprüfte Datei im Ordner, schlägt der Test an. So kann niemand unbemerkt
// fremden Code unterschieben, der jedes Videobild sieht.
// Ausführen im Projektordner:  node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJEKT = fileURLToPath(new URL("..", import.meta.url));
const lies = (datei) => fs.readFileSync(path.join(PROJEKT, datei), "utf8");

// Neue Version (z. B. C4: MediaPipe 1.x)? Neuer Ordner, Dateien wie in vendor/README.md prüfen,
// dann hier die neuen Prüfsummen eintragen: shasum -a 256 <datei>
const PRUEFSUMMEN = {
  "vendor/mediapipe-0.10.14/LICENSE": "8707eef0533987efc5b155d64761eeb6e20793f50b9bd1a68dad1cf4719d0ed8",
  "vendor/mediapipe-0.10.14/vision_bundle.mjs": "e77f281f9619150d937023c355bae170e9120e3b9e43f1e23a2a7bee07197669",
  "vendor/mediapipe-0.10.14/wasm/vision_wasm_internal.js": "9440cf0cc0cea21800e31581ec32aeedcc5fbf9df4509796bbc7d3f99e52ab9c",
  "vendor/mediapipe-0.10.14/wasm/vision_wasm_internal.wasm": "f82a8e6c05e08a44cc9f9e7ec5f845935bcbb1b1500ebe8c2f4812fb4e2917dc",
  "vendor/pose-landmarker-full-float16-v1/pose_landmarker_full.task": "5134a3aad27a58b93da0088d431f366da362b44e3ccfbe3462b3827a839011b1",
};
// Die Dateien, die die App wirklich lädt (alles außer der Lizenz)
const GELADEN = Object.keys(PRUEFSUMMEN).filter((datei) => !datei.endsWith("LICENSE")).map((datei) => `./${datei}`);

test("Jede Datei in vendor/ hat die festgeschriebene Prüfsumme", () => {
  for (const [datei, erwartet] of Object.entries(PRUEFSUMMEN)) {
    const inhalt = fs.readFileSync(path.join(PROJEKT, datei));
    const ist = crypto.createHash("sha256").update(inhalt).digest("hex");
    assert.equal(ist, erwartet, `${datei} wurde verändert`);
  }
});

test("In vendor/ liegt keine ungeprüfte Datei", () => {
  const dateien = fs.readdirSync(path.join(PROJEKT, "vendor"), { recursive: true })
    .map((datei) => `vendor/${datei.split(path.sep).join("/")}`)
    .filter((datei) => fs.statSync(path.join(PROJEKT, datei)).isFile())
    // README.md ist unsere eigene Beschreibung, .DS_Store legt der Mac-Finder an (nicht im Repo)
    .filter((datei) => datei !== "vendor/README.md" && !datei.endsWith(".DS_Store"));
  assert.deepEqual(dateien.sort(), Object.keys(PRUEFSUMMEN).sort());
});

test("App und Service Worker laden die Pose-Erkennung nur aus vendor/", () => {
  const app = lies("app.js");
  const serviceWorker = lies("sw.js");
  // Service Worker: genau diese Dateien vorab speichern
  const liste = serviceWorker.match(/VENDOR_DATEIEN\s*=\s*\[([\s\S]*?)\]/)?.[1] ?? "";
  assert.deepEqual([...liste.matchAll(/"([^"]+)"/g)].map(([, datei]) => datei), GELADEN);
  // app.js: Modul, Rechenkern (WASM-Ordner) und Modell kommen aus denselben Dateien
  const konstante = (name) => app.match(new RegExp(`const ${name} = "([^"]+)"`))?.[1];
  assert.match(app, /from "\.\/vendor\/mediapipe-0\.10\.14\/vision_bundle\.mjs"/);
  assert.ok(GELADEN.includes(konstante("MP_MODUL")), "MP_MODUL");
  assert.ok(GELADEN.includes(`${konstante("WASM_URL")}/vision_wasm_internal.js`), "WASM_URL (Lader)");
  assert.ok(GELADEN.includes(`${konstante("WASM_URL")}/vision_wasm_internal.wasm`), "WASM_URL (Rechenkern)");
  assert.ok(GELADEN.includes(konstante("MODELL_URL")), "MODELL_URL");
  // Kein Rest der alten CDN-Adressen
  for (const text of [app, serviceWorker]) assert.doesNotMatch(text, /tasks-vision@|mediapipe-models/);
});

test("Cache-Namen in sw.js und pwa.js stimmen überein", () => {
  const namen = (text) => [...text.matchAll(/const (CACHE_\w+) = "([^"]+)"/g)].map(([, name, wert]) => `${name}=${wert}`);
  const imServiceWorker = namen(lies("sw.js"));
  assert.deepEqual(imServiceWorker, ["CACHE_APP=app-v2", "CACHE_VENDOR=vendor-v1"]);
  assert.deepEqual(namen(lies("pwa.js")), imServiceWorker);
});
