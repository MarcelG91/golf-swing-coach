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
  const erlaubt = new Set(["127.0.0.1", "cdn.jsdelivr.net", "storage.googleapis.com", "api.anthropic.com"]);
  const hostsIn = (text) => [...text.matchAll(/https?:\/\/[^\s"'`]+/g)]
    .map(([adresse]) => new URL(adresse.replace(/[),;]+$/, "")).hostname);
  assert.deepEqual([...new Set(hostsIn(QUELLTEXT))].filter((host) => !erlaubt.has(host)), []);
  // api.anthropic.com (Coach, V2) nur an der einen Stelle in app.js – nirgends sonst
  const mitAnthropic = QUELLDATEIEN.filter(({ text }) => hostsIn(text).includes("api.anthropic.com")).map(({ datei }) => datei);
  assert.deepEqual(mitAnthropic, ["app.js"]);
  assert.equal(APP.match(/https:\/\/api\.anthropic\.com/g)?.length, 1);
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
  "tipps.js", "strichfigur.js", "uebungsbilder.js", "coach.js", "schwuenge.js", "gesamtauswertung.js",
];

test("Rechenlogik-Dateien benutzen keinen Browser-Code", () => {
  for (const datei of RECHENLOGIK) {
    const code = ohneKommentare(QUELLDATEIEN.find((q) => q.datei === datei).text);
    assert.doesNotMatch(code, /\b(document|window|navigator|localStorage|indexedDB|fetch)\b|innerHTML/, `${datei} enthält Browser-Code`);
  }
});

test("Robuste Analyse: Knöpfe im finally frei, zentrale Fehleranzeige, Startsignal (S2, S7, S9)", () => {
  const analyse = APP.slice(APP.indexOf("async function analysiereAlles"), APP.indexOf("// 4b. Mehrere Schwünge"));
  assert.match(analyse, /finally\s*{[\s\S]*?analyseLaeuft = false;[\s\S]*?setzeKnoepfeAktiv\(true\)/, "S2: Knöpfe im finally freigeben");
  assert.match(APP, /addEventListener\("error"/, "S7: Fehler in der Statuszeile");
  assert.match(APP, /addEventListener\("unhandledrejection"/, "S7: abgelehnte Promises in der Statuszeile");
  assert.match(APP, /dataset\.appGestartet = /, "S9: app.js meldet den Start");
  assert.match(PWA, /dataset\.appGestartet/, "S9: pwa.js prüft den Start");
});

test("Check robuste Analyse: keine Umgehung der Längenprüfung, keine Fehlalarme", () => {
  const laden = APP.slice(APP.indexOf("function ladeDatei"), APP.indexOf("function gibVideoFrei"));
  // Scheitert das Laden, darf die Datei nicht als "geladen" gelten (sonst überspringt die Analyse S3)
  assert.match(laden, /geladeneDatei = null/, "ladeDatei vergisst nicht lesbare Dateien");
  // Jedes play() fängt seine Ablehnung selbst ab – sonst meldet S7 harmlose Abbrüche als Fehler
  for (const [aufruf] of QUELLTEXT.matchAll(/\.play\(\)[^;\n]*/g)) {
    assert.match(aufruf, /\.catch\(/, `play() ohne catch: ${aufruf}`);
  }
  // Kommt app.js nach dem 20-s-Hinweis doch noch an, verschwindet der Hinweis wieder
  assert.match(APP, /startsWith\("Die App ist nicht vollständig geladen"\)/, "S9: Hinweis wird zurückgenommen");
  assert.match(PWA, /Die App ist nicht vollständig geladen/, "S9: gleicher Text in pwa.js");
});

test("Coach (V2): Schlüssel nur im localStorage, SDK mit fester Version, nie in Speicher oder Export", () => {
  const speicher = QUELLDATEIEN.find(({ datei }) => datei === "speicher.js").text;
  assert.ok(!speicher.includes("coachSchluessel"), "Der Schlüssel gehört nie in die Schwung-Datenbank");
  assert.match(APP, /const COACH_SDK_URL = "https:\/\/cdn\.jsdelivr\.net\/npm\/@anthropic-ai\/sdk@\d+\.\d+\.\d+\/\+esm"/, "SDK-Version fest");
  assert.equal(APP.match(/dangerouslyAllowBrowser/g)?.length, 2, "Browser-Freigabe nur an der einen Stelle (plus Kommentar)");
  const exportTeil = APP.slice(APP.indexOf("function exportiereDaten"), APP.indexOf("function heute"));
  assert.ok(!/localStorage|coach/i.test(exportTeil), "Posedaten-Export enthält nichts vom Coach");
  // Das SDK steht nicht in der Vorab-Liste des Service Workers (nach dem ersten Laden
  // speichert er es wie jede jsDelivr-Datei – feste Version, siehe bericht.md C1)
  assert.ok(!SERVICE_WORKER.includes("@anthropic-ai/sdk"));
  // Der Client geht ausdrücklich an die erlaubte Adresse
  assert.match(APP, /new Anthropic\(\{[^}]*baseURL: COACH_API_URL/);
});

test("Check 11b: eine Coach-Anfrage zur Zeit, Antwort nur in den eigenen Schwung-Eintrag", () => {
  const frage = APP.slice(APP.indexOf("async function frageCoach"), APP.indexOf("function baueCoachAntwort"));
  assert.match(frage, /if \(coachLaeuft\) return;/, "zweites Tippen startet keine zweite Anfrage");
  assert.match(frage, /finally \{\s*coachLaeuft = false;/, "Sperre wird im finally gelöst");
  assert.match(APP, /coachKnopf\.disabled = !online \|\| coachLaeuft;/, "Neuzeichnen gibt den Knopf nicht frei");
  assert.match(frage, /aktualisiereSchwung\(schwung\.id, \{ coach \}\)/, "nur das Feld coach wird nachgetragen");
  const speicher = QUELLDATEIEN.find(({ datei }) => datei === "speicher.js").text;
  const aktualisiere = speicher.slice(speicher.indexOf("export async function aktualisiereSchwung"));
  assert.match(aktualisiere, /if \(!anfrage\.result\) return;/, "gelöschter Schwung taucht nicht wieder auf");
  const loesche = APP.slice(APP.indexOf("function loescheCoachSchluessel"), APP.indexOf("function coachGrundlage"));
  assert.match(loesche, /removeItem\(EINWILLIGUNG_NAME\)/, "Schlüssel löschen nimmt auch die Einwilligung zurück");
});

test("Coach: Sperre gegen Doppeltipp steht VOR dem ersten await (sonst zwei bezahlte Anfragen)", () => {
  // Kommentarzeilen weglassen – dort darf das Wort "await" ruhig vorkommen
  const funktion = APP.slice(APP.indexOf("async function frageCoach"), APP.indexOf("// Die Coach-Antwort als Karte"))
    .split("\n").filter((zeile) => !zeile.trim().startsWith("//")).join("\n");
  const sperre = funktion.indexOf("coachLaeuft = true");
  const erstesAwait = funktion.indexOf("await ");
  assert.ok(sperre > 0 && erstesAwait > 0 && sperre < erstesAwait, "coachLaeuft = true muss vor dem ersten await stehen");
});
