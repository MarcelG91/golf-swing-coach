// Rauchtest im echten Browser (Befund T3).
// Startet einen kleinen Webserver und Chrome ohne Fenster, steuert Chrome über das
// DevTools-Protokoll (eingebaut, ohne zusätzliche Bibliothek) und prüft:
//   1. Die App startet und meldet "Bereit".
//   2. Keine Fehler in der Konsole, keine CSP-Verstöße.
//   3. Es gehen keine Anfragen an fremde Adressen.
//   4. Der Bereich "Fortschritt" zeigt Diagramme für gespeicherte Testschwünge.
//   5. Sicherung (Etappe 9): erstellen → alles löschen → einspielen → alles wieder da;
//      kaputte Datei ändert nichts, der Coach-Schlüssel steht nie in der Datei.
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
    // Nur für diesen Test: app.js bekommt am Ende einen Zugang zu drei Live-Funktionen, damit der
    // Test einen erkannten Schwung einspeisen kann (die Testkamera zeigt ja keinen Golfschwung).
    // Die echte app.js im Repo enthält das nicht.
    if (datei === path.join(WURZEL, "app.js")) {
      daten = Buffer.concat([daten, Buffer.from("\nwindow.__live = { neuerLiveSchwung, beendeLive, setzeSeitenverhaeltnis: (r) => { liveSeitenverhaeltnis = r; } };\n")]);
    }
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
  "--headless=new", "--no-sandbox", "--disable-gpu",
  // Testkamera statt echter Kamera (Live-Kamera, Etappe 12) und Kamera-Erlaubnis ohne Nachfrage
  "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", `--remote-debugging-port=${debugPort}`,
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

  const gestartet = await wartenBis(`document.documentElement?.dataset.appGestartet === "ja"`);
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
        eintraege.push({ posedaten: [], schwung: { id, sitzungId: sid, nummer: i + 1, datum, schlaeger: "Eisen 7", ansicht: "frontal", sicher: true, appVersion: "test",
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
  // Phasen-Abspieler: beide Clips laufen, Skelett wird auf die Videos gezeichnet, am Ende steht „Nochmal“
  pruefe(await auswerten(`!!document.querySelector("#fortschrittInhalt .vergleich-abspielen button")`), "Phasen-Abspieler hat einen Abspielen-Knopf");
  await auswerten(`document.querySelector("#fortschrittInhalt .vergleich-abspielen button").click()`);
  pruefe(await wartenBis(`document.querySelectorAll("#fortschrittInhalt .abspiel-rahmen video").length === 2`, 15), "Abspieler zeigt beide Videos");
  pruefe(await wartenBis(`/Nochmal/.test(document.querySelector("#fortschrittInhalt .vergleich-abspielen button")?.textContent || "")`, 30), "Abspieler spielt beide Clips bis zum Ende");
  pruefe(await auswerten(`[...document.querySelectorAll("#fortschrittInhalt .abspiel-rahmen canvas")].every((l) => { const d = l.getContext("2d").getImageData(0, 0, l.width, l.height).data; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) return true; return false; })`), "Skelett liegt über beiden Videos");
  // Zurück zu den Bildern: Klick auf eine Phase gibt die Videos frei
  await auswerten(`document.querySelector("#fortschrittInhalt .vergleich-phasen button").click()`);
  pruefe(await auswerten(`document.querySelectorAll("#fortschrittInhalt .abspiel-rahmen").length === 0 && document.querySelectorAll("#fortschrittInhalt .vergleich-bild canvas").length === 2`), "Phase wählen zeigt wieder die Standbilder");
  pruefe(await auswerten(`/Dein Fokus/.test(document.getElementById("fortschrittInhalt").innerText)`), "Fortschritt zeigt „Dein Fokus“");

  // Live-Kamera mit der Testkamera: starten, Skelett-Schleife läuft, beenden. Es gibt keinen
  // Schwung zu sehen, also darf nichts gespeichert werden.
  await auswerten(`document.getElementById("zuAnalyse").click()`);
  // Kamera-Wahl (zwei Knöpfe Vorne/Hinten): die Wahl wird gemerkt; danach zurück auf Vorne (Testkamera)
  const kameraWahl = await auswerten(`(() => {
    const knopf = (wert) => document.querySelector('input[name="liveKamera"][value="' + wert + '"]');
    const start = knopf("user").checked;
    knopf("environment").click();
    const hinten = localStorage.getItem("liveKamera");
    knopf("user").click();
    return { start, hinten, vorne: localStorage.getItem("liveKamera") };
  })()`);
  pruefe(kameraWahl.start && kameraWahl.hinten === "environment" && kameraWahl.vorne === "user", `Kamera-Wahl Vorne/Hinten wird gemerkt (${JSON.stringify(kameraWahl)})`);
  await auswerten(`(() => { const s = document.getElementById("liveSchlaeger"); s.value = "Eisen 7"; document.getElementById("liveStartKnopf").click(); })()`);
  const liveLaeuft = await wartenBis(`/ms pro Bild/.test(document.getElementById("liveWerte")?.textContent || "")`, 30);
  pruefe(liveLaeuft, `Live-Kamera läuft (steht: „${await auswerten(`document.getElementById("liveWerte")?.textContent`)}“)`);
  await auswerten(`document.getElementById("liveStoppKnopf").click()`);
  const keinSchwung = await wartenBis(`/Kein Schwung erkannt/.test(document.getElementById("status")?.textContent || "")`, 15);
  pruefe(keinSchwung, "Live beenden ohne Schwung: nichts gespeichert");
  pruefe(await auswerten(`document.getElementById("liveBox").hidden`), "Live-Ansicht ist nach dem Beenden zu");

  // Ganzer Weg eines erkannten Schwungs: Live starten → Schwung einspeisen (echte Testdaten) →
  // Beenden → Clip aus dem Aufnahme-Stück schneiden → Sitzung in der Datenbank prüfen
  const vorher = await auswerten(`(async () => (await (await import("./speicher.js")).ladeSitzungen()).length)()`);
  await auswerten(`(() => { document.getElementById("liveSchlaeger").value = "Eisen 7"; document.getElementById("liveStartKnopf").click(); })()`);
  await wartenBis(`/ms pro Bild/.test(document.getElementById("liveWerte")?.textContent || "")`, 30);
  const bisUhr = await auswerten(`(async () => {
    const { neueLiveErkennung } = await import("./liveschwung.js");
    const daten = await (await fetch("./tests/daten/faceon_amateur.json")).json();
    const verhaeltnis = daten.breite / daten.hoehe;
    window.__live.setzeSeitenverhaeltnis(verhaeltnis);
    const punkte = (b) => b.punkte.map(([x, y]) => ({ x, y }));
    const t0 = performance.now() / 1000 + 6; // Schwung beginnt 6 s nach jetzt, also sicher im Aufnahme-Stück
    const erster = daten.bilder.find((b) => b.punkte), letzter = daten.bilder.findLast((b) => b.punkte);
    const bilder = [];
    for (let t = -3; t < 0; t += 1 / 30) bilder.push({ zeit: t0 + t, punkte: punkte(erster) });
    for (const b of daten.bilder) bilder.push({ zeit: t0 + b.zeit - daten.bilder[0].zeit, punkte: b.punkte ? punkte(b) : null });
    const ende = bilder.at(-1).zeit;
    for (let i = 1; i <= 90; i++) bilder.push({ zeit: ende + i / 30, punkte: punkte(letzter) });
    const live = neueLiveErkennung(verhaeltnis);
    let schwung = null;
    for (const b of bilder) schwung = live.neuesBild(b) || schwung;
    if (!schwung) return -1;
    window.__live.neuerLiveSchwung(schwung);
    return schwung.phasen.finish.zeit + 1.5; // so lange muss das Aufnahme-Stück mindestens laufen
  })()`);
  pruefe(bisUhr > 0, "Testschwung wird live erkannt");
  // Warten, bis die Uhr den Schwung überholt hat, dann beenden und speichern
  await wartenBis(`performance.now() / 1000 > ${bisUhr}`, 40);
  await auswerten(`document.getElementById("liveStoppKnopf").click()`);
  const gespeichert = await wartenBis(`/gespeichert/.test(document.getElementById("status")?.textContent || "")`, 60);
  const statusText = await auswerten(`document.getElementById("status")?.textContent`);
  pruefe(gespeichert, `Live-Schwung wird gespeichert (steht: „${statusText}“)`);
  pruefe(!/ohne Video/.test(statusText), "…mit Video");
  const ergebnis = await auswerten(`(async () => {
    const speicher = await import("./speicher.js");
    const sitzungen = await speicher.ladeSitzungen();
    const neu = sitzungen.filter((x) => x.notiz === "Live-Aufnahme");
    if (neu.length !== 1) return { fehler: "Sitzungen: " + neu.length };
    const [schwung] = await speicher.ladeSchwuengeDerSitzung(neu[0]);
    const video = await speicher.ladeMedium(schwung.id + "/video");
    const posedaten = await speicher.ladeMedium(schwung.id + "/posedaten");
    const vorschau = await speicher.ladeMedium(schwung.id + "/vorschau");
    return { gesamt: sitzungen.length, schlaeger: schwung.schlaeger, name: schwung.videoName, videoBytes: video?.size ?? 0,
      posen: posedaten?.length ?? 0, mitSkelett: posedaten?.filter((p) => p.punkte).length ?? 0, vorschau: vorschau?.size ?? 0,
      kennzahlen: schwung.kennzahlen?.length ?? 0, phasenOk: ["ansprechen", "top", "treffmoment", "finish"].every((n) => Number.isFinite(schwung.phasen?.[n]?.zeit)) };
  })()`);
  pruefe(!ergebnis.fehler && ergebnis.gesamt === vorher + 1, `Genau eine neue Sitzung in der Datenbank (${JSON.stringify(ergebnis)})`);
  pruefe(ergebnis.schlaeger === "Eisen 7" && ergebnis.name === "Live-Aufnahme", "Schläger und Name stimmen");
  pruefe(ergebnis.videoBytes > 1000, `Clip ist gespeichert (${ergebnis.videoBytes} Bytes)`);
  pruefe(ergebnis.mitSkelett > 30 && ergebnis.vorschau > 100, "Posedaten mit Skelett und Vorschaubild sind gespeichert");
  pruefe(ergebnis.kennzahlen > 5 && ergebnis.phasenOk, "Kennzahlen und alle vier Phasen sind gespeichert");

  // Aufnahme-Stück der Testkamera aufnehmen und daraus einen Clip schneiden (der Weg, den ein
  // erkannter Schwung beim Speichern geht)
  const clipGroesse = await auswerten(`(async () => {
    const { starteAufnahme } = await import("./aufnahme.js");
    const { schneideClip } = await import("./videokuerzen.js");
    const { springe } = await import("./videoanalyse.js");
    const strom = await navigator.mediaDevices.getUserMedia({ video: true });
    const stuecke = [];
    const beende = starteAufnahme(strom, (st) => stuecke.push(st), (f) => { throw f; });
    await new Promise((ok) => setTimeout(ok, 3000));
    await beende();
    strom.getTracks().forEach((t) => t.stop());
    if (stuecke.length !== 1 || !(stuecke[0].ende > stuecke[0].start)) return -1;
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.className = "versteckt-video";
    document.body.append(v);
    await new Promise((ok, nein) => { v.onloadeddata = ok; v.onerror = nein; v.src = URL.createObjectURL(stuecke[0].blob); });
    const clip = await schneideClip(v, 0.5, 1.5, springe);
    URL.revokeObjectURL(v.src); v.remove();
    return clip.video.size;
  })()`);
  pruefe(clipGroesse > 1000, `Aufnahme-Stück der Testkamera lässt sich zu einem Clip schneiden (${clipGroesse} Bytes)`);

  // Sicherung (Etappe 9): erstellen → alles löschen → einspielen → alles wieder da.
  // Teilen-Menü gibt es hier nicht → die App lädt herunter. Den Download fangen wir ab
  // (URL.createObjectURL merkt sich die Datei) und lassen Chrome nichts speichern.
  await senden("Browser.setDownloadBehavior", { behavior: "deny" });
  const KOEDER = "sk-ant-KOEDER-rauchtest";
  const zaehle = `(async () => {
    const speicher = await import("./speicher.js");
    const { sitzungen, schwuenge, posedaten } = await speicher.ladeAllesFuerSicherung();
    return { sitzungen: sitzungen.length, schwuenge: schwuenge.length, posen: Object.values(posedaten).reduce((n, p) => n + p.length, 0),
      notizen: sitzungen.map((s) => s.notiz).sort().join("|") };
  })()`;
  const vorSicherung = await auswerten(zaehle);
  await auswerten(`(() => {
    localStorage.setItem("coachSchluessel", ${JSON.stringify(KOEDER)});
    Object.defineProperty(navigator, "canShare", { value: undefined, configurable: true });
    const original = URL.createObjectURL;
    URL.createObjectURL = (datei) => { if (datei instanceof File) window.__sicherung = datei; return original(datei); };
    document.getElementById("zuEinstellungen").click();
    document.getElementById("sicherungErstellen").click();
  })()`);
  pruefe(await wartenBis(`!document.getElementById("sicherungBereit").hidden`, 20), "Sicherung wird erstellt");
  await auswerten(`document.getElementById("sicherungSichern").click()`);
  const sicherung = await wartenBis(`!!window.__sicherung`, 10) ? await auswerten(`window.__sicherung.text()`) : "";
  pruefe(/^golf-sicherung-\d{4}-\d{2}-\d{2}\.json$/.test(await auswerten(`window.__sicherung?.name`)), "Sicherung wird als JSON-Datei heruntergeladen (ohne Teilen-Menü)");
  pruefe(sicherung.length > 1000 && !sicherung.includes(KOEDER) && !sicherung.includes("coachSchluessel"), "Coach-Schlüssel steht nicht in der Sicherung");
  await auswerten(`localStorage.removeItem("coachSchluessel")`);

  // Alles löschen über den echten Dialog (Häkchen setzen, dann bestätigen)
  await auswerten(`document.getElementById("allesLoeschen").click()`);
  await wartenBis(`document.getElementById("loeschDialog").open`, 10);
  await auswerten(`(() => { const h = document.getElementById("loeschHaken"); h.checked = true; h.dispatchEvent(new Event("change")); document.getElementById("loeschBestaetigen").click(); })()`);
  pruefe(await wartenBis(`/Alle gespeicherten Schwünge sind gelöscht/.test(document.getElementById("datenMeldung").textContent)`, 10), "Alles löschen klappt");
  pruefe((await auswerten(zaehle)).sitzungen === 0, "Nach dem Löschen ist die Datenbank leer");

  // Datei in die Dateiauswahl legen (wie nach dem Antippen in der Dateien-App)
  const waehle = (text) => auswerten(`(() => {
    const auswahl = new DataTransfer();
    auswahl.items.add(new File([${JSON.stringify(text)}], "golf-sicherung.json", { type: "application/json" }));
    const feld = document.getElementById("sicherungDatei");
    feld.files = auswahl.files;
    feld.dispatchEvent(new Event("change"));
  })()`);
  const meldung = `document.getElementById("sicherungMeldung").textContent`;

  // Kaputte Datei (ein geändertes Zeichen, sonst gültig): abgelehnt, nichts geschrieben
  pruefe(sicherung.includes('"schlaeger":"Eisen 7"'), "Testdatei enthält die Stelle, die beschädigt wird");
  await waehle(sicherung.replace('"schlaeger":"Eisen 7"', '"schlaeger":"Eisen 9"'));
  pruefe(await wartenBis(`/beschädigt/.test(${meldung})`, 10), `Beschädigte Sicherung wird abgelehnt (steht: „${await auswerten(meldung)}“)`);
  pruefe((await auswerten(zaehle)).sitzungen === 0 && await auswerten(`document.getElementById("sicherungPruefung").hidden`), "…und es wird nichts eingespielt");

  // Echte Datei: prüfen, Zusammenfassung zeigen, einspielen
  await waehle(sicherung);
  pruefe(await wartenBis(`!document.getElementById("sicherungPruefung").hidden`, 10), "Sicherung wird geprüft und zusammengefasst");
  const pruefText = await auswerten(`document.getElementById("sicherungPruefText").textContent`);
  pruefe(pruefText.includes(`Neu dazu kommen ${vorSicherung.sitzungen} Sitzungen`), `Zusammenfassung nennt die neuen Sitzungen (steht: „${pruefText}“)`);
  await auswerten(`document.getElementById("sicherungUebernehmen").click()`);
  pruefe(await wartenBis(`/✓.*eingespielt/.test(${meldung})`, 20), `Einspielen meldet Erfolg (steht: „${await auswerten(meldung)}“)`);
  const nachSicherung = await auswerten(zaehle);
  pruefe(JSON.stringify(nachSicherung) === JSON.stringify(vorSicherung), `Alles wieder da: ${JSON.stringify(nachSicherung)}`);

  // Nochmal einspielen: keine Doppelten
  await waehle(sicherung);
  pruefe(await wartenBis(`/schon auf diesem Gerät/.test(${meldung})`, 10), "Zweites Einspielen erkennt: alles schon da");
  pruefe((await auswerten(zaehle)).sitzungen === vorSicherung.sitzungen, "…und legt keine Doppelten an");
  // Meine Schwünge zeigt die eingespielten Sitzungen
  await auswerten(`document.getElementById("zuGespeichert").click()`);
  await auswerten(`document.getElementById("zuSitzungen").click()`);
  pruefe(await wartenBis(`document.querySelectorAll("#sitzungsListe > *").length >= ${vorSicherung.sitzungen}`, 10), "Meine Schwünge zeigt die eingespielten Sitzungen");

  // Sitzung mit mehreren Schwüngen öffnen: Auswahl (Dropdown) unter dem Video, Wechsel zeigt den anderen Schwung
  const mehrere = await auswerten(`(() => {
    const knopf = [...document.querySelectorAll("#sitzungsListe > button")]
      .find((k) => Number(k.querySelector("small")?.textContent.match(/^(\\d+) Schwünge/)?.[1]) >= 2);
    knopf?.click();
    return !!knopf;
  })()`);
  pruefe(mehrere, "Es gibt eine Sitzung mit mehreren Schwüngen");
  pruefe(await wartenBis(`!document.getElementById("schwungWahlBox").hidden && document.getElementById("schwungWahl").options.length >= 2 && /^Schwung 1 /.test(document.getElementById("schwungTitel").textContent)`, 15),
    "Mehrere Schwünge: Auswahl unter dem Video, Schwung 1 ist gewählt");
  await auswerten(`(() => { const wahl = document.getElementById("schwungWahl"); wahl.selectedIndex = 1; wahl.dispatchEvent(new Event("change")); })()`);
  pruefe(await wartenBis(`/^Schwung 2 /.test(document.getElementById("schwungTitel").textContent)`, 15),
    `Auswahl wechselt zum zweiten Schwung (steht: „${await auswerten(`document.getElementById("schwungTitel").textContent`)}“)`);

  // Ohne Grafikkarte (Chrome ohne Fenster, CI-Server) meldet MediaPipe, dass die GPU fehlt, und die App
  // rechnet auf der CPU weiter (Statuszeile "… CPU"). Das ist gewollt und kein Fehler.
  const erwartet = /XNNPACK|kGpuService|emscripten_webgl_create_context|Source Location Trace|calculator_graph|graph_utils/;
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
