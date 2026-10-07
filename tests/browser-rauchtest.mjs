// Rauchtest im echten Browser (Befund T3).
// Startet einen kleinen Webserver und Chrome ohne Fenster, steuert Chrome über das
// DevTools-Protokoll (eingebaut, ohne zusätzliche Bibliothek) und prüft:
//   1. Die App startet und meldet "Bereit".
//   2. Keine Fehler in der Konsole, keine CSP-Verstöße.
//   3. Es gehen keine Anfragen an fremde Adressen.
//   4. Der Bereich "Fortschritt" zeigt Diagramme für gespeicherte Testschwünge.
//
// Aufruf:  node tests/browser-rauchtest.mjs
// Chrome wird automatisch gesucht; sonst Pfad in der Umgebungsvariable CHROME_PFAD angeben.
// Die Datei heißt absichtlich nicht *.test.mjs: `node --test` soll sie nicht mitlaufen lassen
// (dort gibt es kein Chrome), sie hat in der CI einen eigenen Schritt.

import http from "node:http";
import net from "node:net";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIME = {
  ".js": "text/javascript", ".mjs": "text/javascript", ".html": "text/html", ".css": "text/css",
  ".wasm": "application/wasm", ".json": "application/json", ".webmanifest": "application/manifest+json",
  ".png": "image/png", ".svg": "image/svg+xml", ".task": "application/octet-stream",
};

function findeChrome() {
  const kandidaten = [
    process.env.CHROME_PFAD,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  ].filter(Boolean);
  return kandidaten.find((pfad) => fs.existsSync(pfad));
}

// Freien Port bei der Systemverwaltung erfragen (Port 0 = "gib mir irgendeinen freien")
function freierPort() {
  return new Promise((ok) => {
    const server = net.createServer().listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => ok(port));
    });
  });
}

const warte = (ms) => new Promise((ok) => setTimeout(ok, ms));
const probleme = [];
const pruefe = (bedingung, text) => {
  console.log(`${bedingung ? "✔" : "✖"} ${text}`);
  if (!bedingung) probleme.push(text);
};

const chromePfad = findeChrome();
if (!chromePfad) {
  console.error("Kein Chrome gefunden. Pfad in CHROME_PFAD angeben.");
  process.exit(2);
}

// --- Webserver: nur lesen, nur 127.0.0.1 ---
// (Der einfache Python-Server bricht beim Laden der vielen Module manchmal Verbindungen ab.)
const server = http.createServer((anfrage, antwort) => {
  let datei = path.join(WURZEL, decodeURIComponent(anfrage.url.split("?")[0]));
  if (!datei.startsWith(WURZEL)) { antwort.writeHead(403).end(); return; }
  if (datei.endsWith(path.sep)) datei += "index.html";
  fs.readFile(datei, (fehler, daten) => {
    if (fehler) { antwort.writeHead(404).end(); return; }
    antwort.writeHead(200, { "content-type": MIME[path.extname(datei)] || "application/octet-stream" });
    antwort.end(daten);
  });
});
const webPort = await freierPort();
await new Promise((ok) => server.listen(webPort, "127.0.0.1", ok));
const adresse = `http://127.0.0.1:${webPort}/`;

// --- Chrome starten ---
const debugPort = await freierPort();
const profil = fs.mkdtempSync(path.join(os.tmpdir(), "golf-rauchtest-"));
const chrome = spawn(chromePfad, [
  "--headless=new", "--no-sandbox", "--disable-gpu", `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profil}`, "--window-size=420,1400", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
let chromeMeldungen = ""; // Fehlerausgabe von Chrome, hilft wenn er nicht startet
chrome.stderr.on("data", (teil) => { chromeMeldungen = (chromeMeldungen + teil).slice(-2000); });
chrome.on("error", (fehler) => { chromeMeldungen += `\nStartfehler: ${fehler.message}`; });

async function aufraeumen() {
  const beendet = new Promise((ok) => chrome.once("exit", ok));
  chrome.kill();
  await Promise.race([beendet, warte(5000)]); // erst warten, bis Chrome fertig ist, sonst ist der Ordner noch belegt
  server.close();
  try {
    fs.rmSync(profil, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch (fehler) {
    // Chrome-Hilfsprozesse schreiben manchmal noch kurz in den Ordner (aufgefallen in der CI).
    // Ein übrig gebliebener Temp-Ordner ist harmlos und soll einen bestandenen Test nicht kippen.
    console.warn("Temp-Ordner nicht gelöscht:", fehler.code);
  }
}

try {
  // Warten, bis Chrome erreichbar ist
  let seiten = null;
  for (let versuch = 0; versuch < 120 && !seiten; versuch++) {
    try { seiten = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json(); } catch { await warte(250); }
  }
  if (!seiten) throw new Error(`Chrome ließ sich nicht starten (${chromePfad})\n${chromeMeldungen}`);
  const ws = new WebSocket(seiten.find((s) => s.type === "page").webSocketDebuggerUrl);
  await new Promise((ok) => { ws.onopen = ok; });

  let nummer = 0;
  const offen = new Map();
  const konsolenFehler = [];
  const fremdeAnfragen = [];
  ws.onmessage = (nachricht) => {
    const d = JSON.parse(nachricht.data);
    if (d.id && offen.has(d.id)) { offen.get(d.id)(d); offen.delete(d.id); return; }
    if (d.method === "Runtime.exceptionThrown") {
      konsolenFehler.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    } else if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") {
      konsolenFehler.push(d.params.args.map((a) => a.value ?? a.description).join(" "));
    } else if (d.method === "Network.requestWillBeSent") {
      const url = d.params.request.url;
      if (!url.startsWith(adresse) && !url.startsWith("data:") && !url.startsWith("blob:")) fremdeAnfragen.push(url);
    }
  };
  const senden = (methode, parameter = {}) => new Promise((ok) => {
    const id = ++nummer;
    offen.set(id, ok);
    ws.send(JSON.stringify({ id, method: methode, params: parameter }));
  });
  const auswerten = async (code) => {
    const antwort = await senden("Runtime.evaluate", { expression: code, awaitPromise: true, returnByValue: true });
    if (antwort.result.exceptionDetails) throw new Error(JSON.stringify(antwort.result.exceptionDetails));
    return antwort.result.result.value;
  };
  const wartenBis = async (code, sekunden = 30) => {
    for (let i = 0; i < sekunden * 4; i++) {
      if (await auswerten(code)) return true;
      await warte(250);
    }
    return false;
  };

  await senden("Runtime.enable");
  await senden("Network.enable");
  await senden("Page.enable");
  // CSP-Verstöße mitschreiben (stehen sonst nur als Konsolenmeldung da)
  await senden("Page.addScriptToEvaluateOnNewDocument", {
    source: `window.__csp = []; document.addEventListener("securitypolicyviolation", (e) => window.__csp.push(e.violatedDirective + " " + e.blockedURI));`,
  });

  // Erster Start: die App verlangt zuerst ein Level (localStorage "level")
  await senden("Page.navigate", { url: adresse });
  await wartenBis(`document.readyState === "complete"`);
  await auswerten(`localStorage.setItem("level", "einsteiger")`);
  await senden("Page.navigate", { url: adresse });

  const gestartet = await wartenBis(`document.documentElement.dataset.appGestartet === "ja"`);
  pruefe(gestartet, "App-Skript ist angelaufen");
  const bereit = await wartenBis(`/Bereit/.test(document.getElementById("status")?.textContent || "")`, 60);
  pruefe(bereit, `Statuszeile meldet „Bereit“ (steht: „${await auswerten(`document.getElementById("status")?.textContent`)}“)`);

  // Fortschritt: Testschwünge direkt in die Datenbank legen (so wie "Speichern" es tut)
  await auswerten(`(async () => {
    const speicher = await import("./speicher.js");
    const tag = 86400000;
    for (let n = 0; n < 3; n++) {
      const sid = Date.now() - (14 - n * 5) * tag;
      const datum = new Date(sid).toISOString().slice(0, 10);
      const ids = [], eintraege = [];
      for (let i = 0; i < 4; i++) {
        const id = sid + "-" + (i + 1);
        ids.push(id);
        eintraege.push({ posedaten: new Blob(["x"]), schwung: { id, sitzungId: sid, nummer: i + 1, datum, schlaeger: "Eisen 7", ansicht: "frontal", sicher: true, appVersion: "test",
          kennzahlen: [{ id: "tempo", name: "Tempo", messwert: 3, wert: "3:1", bewertung: i < n + 1 ? "gut" : "verbessern" }] } });
      }
      await speicher.speichereSitzung({ id: sid, datum, schlaeger: "Eisen 7", notiz: "", schwungIds: ids, appVersion: "test" }, eintraege);
    }
  })()`);
  // Vorher/Nachher: zwei Sitzungen mit einem echten, im Browser aufgenommenen Mini-Clip (1 s, 160x120)
  // und einer Pose (33 Punkte), damit Bild holen, Skelett zeichnen und Anzeige wirklich laufen.
  await auswerten(`(async () => {
    const speicher = await import("./speicher.js");
    const leinwand = document.createElement("canvas");
    leinwand.width = 160; leinwand.height = 120;
    const c = leinwand.getContext("2d");
    const rekorder = new MediaRecorder(leinwand.captureStream(30));
    const teile = [];
    rekorder.ondataavailable = (e) => teile.push(e.data);
    const fertig = new Promise((ok) => { rekorder.onstop = ok; });
    rekorder.start();
    for (let i = 0; i < 30; i++) { c.fillStyle = "hsl(" + i * 8 + ",60%,40%)"; c.fillRect(0, 0, 160, 120); await new Promise((ok) => setTimeout(ok, 33)); }
    rekorder.stop();
    await fertig;
    const clip = new Blob(teile, { type: rekorder.mimeType });
    const tag = 86400000;
    for (const [n, alter] of [[0, 20], [1, 1]]) {
      const sid = Date.now() - alter * tag + n;
      const datum = new Date(sid).toISOString().slice(0, 10);
      const id = sid + "-1";
      const posedaten = Array.from({ length: 30 }, (_, i) => ({ zeit: i / 30, punkte: Array.from({ length: 33 }, (_, k) => ({ x: 0.3 + (k % 5) * 0.1, y: 0.2 + Math.floor(k / 5) * 0.08, z: 0, visibility: 1 })) }));
      const phasen = { ansprechen: { zeit: 0.1 }, top: { zeit: 0.4 }, treffmoment: { zeit: 0.7 }, finish: { zeit: 0.9 } };
      await speicher.speichereSitzung({ id: sid, datum, schlaeger: "Eisen 6", notiz: "", schwungIds: [id], appVersion: "test" }, [{
        posedaten, video: clip,
        schwung: { id, sitzungId: sid, nummer: 1, datum, schlaeger: "Eisen 6", ansicht: "frontal", sicher: true, phasen, appVersion: "test",
          kennzahlen: [{ id: "tempo", name: "Tempo", messwert: 3, wert: "3:1", bewertung: n ? "gut" : "verbessern" }] },
      }]);
    }
  })()`);
  await auswerten(`document.getElementById("zuGespeichert").click()`);
  await auswerten(`document.getElementById("zuFortschritt").click()`);
  const diagramme = await wartenBis(`document.querySelectorAll("#fortschrittInhalt svg.verlauf-bild").length >= 1`, 10);
  pruefe(diagramme, "Fortschritt zeigt ein Verlaufsdiagramm");
  // Eisen 6 ist der zuletzt gespeicherte Schläger → die Auswahl steht schon richtig
  const bilder = await wartenBis(`document.querySelectorAll("#fortschrittInhalt .vergleich-bild canvas").length === 2`, 20);
  pruefe(bilder, "Vorher/Nachher zeigt zwei Bilder aus den Clips");
  // Skelett wurde gezeichnet: grüne Pixel im Bild (GRUEN = #4ade80)
  pruefe(await auswerten(`[...document.querySelectorAll("#fortschrittInhalt .vergleich-bild canvas")].every((l) => { const d = l.getContext("2d").getImageData(0, 0, l.width, l.height).data; for (let i = 0; i < d.length; i += 4) if (d[i] === 74 && d[i + 1] === 222 && d[i + 2] === 128) return true; return false; })`), "Skelett ist in beiden Bildern eingezeichnet");
  pruefe(await auswerten(`/Dein Fokus/.test(document.getElementById("fortschrittInhalt").innerText)`), "Fortschritt zeigt „Dein Fokus“");

  // Ohne Grafikkarte (Chrome ohne Fenster, CI-Server) meldet MediaPipe, dass die GPU fehlt, und die App
  // rechnet auf der CPU weiter (Statuszeile "… CPU"). Das ist gewollt und kein Fehler.
  const erwartet = /kGpuService|emscripten_webgl_create_context|Source Location Trace|calculator_graph|graph_utils/;
  const echteFehler = konsolenFehler.filter((text) => !erwartet.test(text));
  pruefe(echteFehler.length === 0, `Keine Fehler in der Konsole${echteFehler.length ? ": " + echteFehler.join(" | ") : ""}`);
  const csp = await auswerten(`window.__csp`);
  pruefe(csp.length === 0, `Keine CSP-Verstöße${csp.length ? ": " + csp.join(" | ") : ""}`);
  pruefe(fremdeAnfragen.length === 0, `Keine Anfragen an fremde Adressen${fremdeAnfragen.length ? ": " + fremdeAnfragen.join(" | ") : ""}`);
} catch (fehler) {
  probleme.push(`Abbruch: ${fehler.message}`);
  console.error(fehler);
} finally {
  await aufraeumen();
}

console.log(probleme.length ? `\n${probleme.length} Problem(e)` : "\nBrowser-Rauchtest bestanden");
process.exit(probleme.length ? 1 : 0);
