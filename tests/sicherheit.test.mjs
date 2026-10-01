import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { coachDaten } from "../coach.js";

const PROJEKT = fileURLToPath(new URL("..", import.meta.url));
const QUELLDATEIEN = fs.readdirSync(PROJEKT)
  .filter((datei) => /\.(js|html|webmanifest)$/.test(datei))
  .map((datei) => ({ datei, text: fs.readFileSync(path.join(PROJEKT, datei), "utf8") }));
const QUELLTEXT = QUELLDATEIEN.map(({ text }) => text).join("\n");
const APP = QUELLDATEIEN.find(({ datei }) => datei === "app.js").text;
const PWA = QUELLDATEIEN.find(({ datei }) => datei === "pwa.js").text;
const SERVICE_WORKER = QUELLDATEIEN.find(({ datei }) => datei === "sw.js").text;
const INDEX = QUELLDATEIEN.find(({ datei }) => datei === "index.html").text;

function dateiliste(text) {
  const treffer = text.match(/APP_DATEIEN\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(treffer, "APP_DATEIEN muss vorhanden sein");
  return [...treffer[1].matchAll(/["']([^"']+)["']/g)].map(([, datei]) => datei);
}

test("Nur erlaubte Netzwerk-Hosts sind eingebaut (seit 0.26.0 nur noch der Coach)", () => {
  // jsDelivr und Google sind mit C1 weggefallen: MediaPipe und Modell liegen in vendor/
  const erlaubt = new Set(["127.0.0.1", "api.anthropic.com"]);
  const hostsIn = (text) => [...text.matchAll(/https?:\/\/[^\s"'`]+/g)]
    .map(([adresse]) => new URL(adresse.replace(/[),;]+$/, "")).hostname);
  assert.deepEqual([...new Set(hostsIn(QUELLTEXT))].filter((host) => !erlaubt.has(host)), []);
  // api.anthropic.com (Coach, V2) nur an der einen Stelle in app.js und in der CSP – nirgends sonst
  const mitAnthropic = QUELLDATEIEN.filter(({ text }) => hostsIn(text).includes("api.anthropic.com")).map(({ datei }) => datei);
  assert.deepEqual(mitAnthropic.sort(), ["app.js", "index.html"]);
  assert.equal(APP.match(/https:\/\/api\.anthropic\.com/g)?.length, 1);
  assert.equal(INDEX.match(/https:\/\/api\.anthropic\.com/g)?.length, 1);
});

test("Kein Fremdcode wird nachgeladen: nur eigene Module, kein import() (C1)", () => {
  for (const { datei, text } of QUELLDATEIEN) {
    const code = ohneKommentare(text);
    // Statische Importe nur aus eigenen Dateien ("./…"), keine Adressen
    for (const [, quelle] of code.matchAll(/\bfrom\s+["']([^"']+)["']/g)) {
      assert.match(quelle, /^\.\//, `${datei} importiert von außen: ${quelle}`);
    }
    assert.doesNotMatch(code, /\bimport\s*\(/, `${datei} lädt Code zur Laufzeit nach`);
    assert.doesNotMatch(code, /<script[^>]+src=["']https?:/, `${datei} bindet ein fremdes Skript ein`);
  }
});

test("CSP (C3): nur eigene Dateien, WebAssembly, Verbindungen nur zu sich selbst und zum Coach", () => {
  const csp = INDEX.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/)?.[1];
  assert.ok(csp, "CSP-Meta-Tag fehlt");
  // Muss vor dem ersten Skript stehen, sonst gilt sie für dieses Skript nicht
  const html = ohneKommentare(INDEX);
  assert.ok(html.indexOf("Content-Security-Policy") < html.indexOf("<script"), "CSP steht nach einem Skript");
  const regeln = Object.fromEntries(csp.split(";").map((r) => r.trim().split(/\s+/)).map(([name, ...werte]) => [name, werte]));
  assert.deepEqual(regeln, {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'wasm-unsafe-eval'"],
    "style-src": ["'self'"],
    "img-src": ["'self'", "blob:"],
    "media-src": ["'self'", "blob:"],
    "connect-src": ["'self'", "https://api.anthropic.com"],
    "object-src": ["'none'"],
    "base-uri": ["'none'"],
  });
  // Inline-Skripte und Inline-Styles würde die CSP blockieren – also gibt es keine
  assert.doesNotMatch(ohneKommentare(INDEX), /<script(?![^>]*\bsrc=)[^>]*>|\son[a-z]+=|\sstyle=/i);
});

test("Gerät ohne WebAssembly-SIMD bekommt eine klare Meldung mit Mindestversion (S13)", () => {
  // vendor/ enthält bewusst nur die SIMD-Variante von MediaPipe
  const laden = APP.slice(APP.indexOf("async function ladePoseErkennung"), APP.indexOf("let letzterFehler"));
  assert.match(laden, /if \(vision\.wasmBinaryPath\.includes\("nosimd"\)\)/);
  assert.match(laden, /16\.4/);
  assert.match(laden, /setzePoseStatus\("fehler"\);[\s\S]*?return;/, "danach nicht weiter laden");
  assert.ok(!SERVICE_WORKER.includes("nosimd"), "nosimd-Dateien sind bewusst nicht dabei");
});

test("Datenschutzhinweis (V4) nennt beide Empfänger und was nie gesendet wird", () => {
  const start = INDEX.indexOf('<section id="datenschutz"');
  assert.ok(start > 0, "Abschnitt Datenschutz fehlt in den Einstellungen");
  const abschnitt = INDEX.slice(start, INDEX.indexOf("</section>", start));
  // Die CSP erlaubt genau zwei Ziele: die eigene Adresse (GitHub Pages) und den Coach (Anthropic)
  for (const wort of ["GitHub", "Anthropic", "IP-Adresse", "Einwilligung", "Videos, Bilder, Posedaten, Notizen, Videonamen oder Datum", "kein Tracking"]) {
    assert.ok(abschnitt.includes(wort), `Datenschutzhinweis nennt „${wort}“ nicht`);
  }
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

// Fortschrittsanzeige (0.28.0, Vorher/Nachher ab 0.29.0): nur lesen und zeichnen – kein Netz, kein Speichern.
// Die Clips für den Bildvergleich werden nur gelesen (ladeMedium), nie geschrieben oder gelöscht.
test("Fortschrittsanzeige liest nur Kennzahlen, sendet nichts und schreibt nichts", () => {
  const app = ohneKommentare(QUELLDATEIEN.find(({ datei }) => datei === "app.js").text);
  const von = app.indexOf("function zeigeGespeichertTeil");
  const bis = app.indexOf("async function zeigeMeineSchwuenge");
  assert.ok(von > 0 && bis > von, "Abschnitt Fortschritt nicht gefunden");
  const abschnitt = app.slice(von, bis);
  assert.doesNotMatch(abschnitt, /fetch\(|sendBeacon|XMLHttpRequest|localStorage|sessionStorage|indexedDB|loesche(Schwung|Sitzung|Alles|VideosUndBilder)|speichereSitzung|aktualisiereSchwung/);
  // Jede Browser-Adresse eines Clips wird wieder freigegeben (Regel aus CLAUDE.md)
  assert.equal((abschnitt.match(/createObjectURL/g) ?? []).length, (abschnitt.match(/revokeObjectURL/g) ?? []).length);
  // ... und zwar im finally, damit auch bei Fehler oder Zeitüberschreitung (Clip lädt nie) nichts hängen bleibt
  assert.match(abschnitt, /finally\s*\{[^}]*URL\.revokeObjectURL\(adresse\)/);
  // einziges innerHTML: fester Text "<svg></svg>" für den SVG-Namensraum
  const treffer = abschnitt.match(/innerHTML\s*=.*$/gm) ?? [];
  assert.deepEqual(treffer.map((z) => z.replace(/\s*\/\/.*$/, "").trim()), ['innerHTML = "<svg></svg>";']);
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
  "phasen.js", "kennzahlen.js", "technik.js", "ideallinien.js", "level.js", "fortschritt.js",
  "tipps.js", "strichfigur.js", "uebungsbilder.js", "coach.js", "schwuenge.js", "gesamtauswertung.js",
  "wissen.js", "nachschlagen.js", "schaubilder.js",
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

test("Coach (V2): Schlüssel nur im localStorage und in der Kopfzeile, kein SDK, nie in Speicher oder Export", () => {
  const speicher = QUELLDATEIEN.find(({ datei }) => datei === "speicher.js").text;
  assert.ok(!speicher.includes("coachSchluessel"), "Der Schlüssel gehört nie in die Schwung-Datenbank");
  const exportTeil = APP.slice(APP.indexOf("function exportiereDaten"), APP.indexOf("function heute"));
  assert.ok(!/localStorage|coach/i.test(exportTeil), "Posedaten-Export enthält nichts vom Coach");
  // Seit 0.26.0 kein Anthropic-SDK mehr (C1): kein Fremdcode sieht den Schlüssel
  assert.doesNotMatch(QUELLTEXT, /@anthropic-ai|dangerouslyAllowBrowser/);
  // Genau ein fetch an die erlaubte Adresse, mit den Kopfzeilen aus coach.js
  assert.match(APP, /const COACH_API_URL = "https:\/\/api\.anthropic\.com\/v1\/messages";/);
  const senden = APP.slice(APP.indexOf("async function sendeAnClaude"), APP.indexOf("async function frageCoach"));
  assert.match(senden, /fetch\(COACH_API_URL, \{\s*method: "POST",\s*headers: coachKopfzeilen\(schluessel\),\s*body: JSON\.stringify\(anfrage\),\s*signal: AbortSignal\.timeout\(COACH_ZEITLIMIT_MS\),?\s*\}\)/);
  assert.equal(ohneKommentare(APP).match(/\bfetch\(/g)?.length, 1, "app.js hat nur diesen einen fetch()-Aufruf");
  // Fehlertexte der API nur in die Konsole, angezeigt werden feste Texte
  assert.match(senden, /coachFehler\(coachFehlerArt\(\{ status: antwort\.status \}\)\)/);
  // Der Service Worker leitet die Anfrage nur durch (POST) und speichert sie nicht
  assert.match(SERVICE_WORKER, /if \(anfrage\.method !== "GET"\) return;/);
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

test("Coach (V2): Die Einwilligung nennt jedes Feld, das gesendet wird (Check 29.09.)", () => {
  const index = QUELLDATEIEN.find(({ datei }) => datei === "index.html").text;
  const start = index.indexOf('<dialog id="coachEinwilligung"');
  const dialog = index.slice(start, index.indexOf("</dialog>", start));
  // Jedes gesendete Feld und das Stichwort, unter dem es im Dialog stehen muss.
  // Sendet coachDaten() ein neues Feld, schlägt dieser Test fehl: dann den Dialog ergänzen,
  // hier eintragen und – wenn eine neue Art von Daten dazukommt – EINWILLIGUNG_WERT in app.js
  // ändern, damit alle einmal neu gefragt werden.
  const STICHWORT = {
    level: "Level", ansicht: "Ansicht", rechtshaender: "Linkshänder", anzahlSchwuenge: "Anzahl erkannter Schwünge",
    kennzahlen: "alle gemessenen Kennzahlen", hintergrundKennzahlen: "als Hintergrund",
    wichtigsteBaustelleDerApp: "wichtigste Baustelle", verlauf: "Verlauf",
  };
  const felder = Object.keys(coachDaten({ kennzahlen: [], level: "einsteiger", ansicht: "frontal" }));
  assert.deepEqual([...felder].sort(), Object.keys(STICHWORT).sort(), "coachDaten() sendet ein Feld, das hier fehlt");
  for (const [feld, wort] of Object.entries(STICHWORT)) assert.ok(dialog.includes(wort), `Die Einwilligung nennt „${feld}“ nicht`);
});

test("Coach: Antwort aus allen Textblöcken lesen – auch nach einem Rückfall im Datenstrom (Check 29.09.)", () => {
  const frage = APP.slice(APP.indexOf("async function frageCoach"), APP.indexOf("// Die Coach-Antwort als Karte"));
  assert.match(frage, /leseAntwort\(antwort\.content\)/, "app.js nutzt leseAntwort() aus coach.js");
  assert.doesNotMatch(frage, /content\.find\(/, "nicht nur den ersten Textblock nehmen");
});

test("Lernfortschritt (wissenFortschritt) übersteht „Alles löschen“ und enthält keine Schwungdaten", () => {
  // Nur app.js fasst den Schlüssel an – und nur zum Lesen und Schreiben, nie zum Entfernen
  const mitSchluessel = QUELLDATEIEN.filter(({ text }) => text.includes("wissenFortschritt")).map(({ datei }) => datei);
  assert.deepEqual(mitSchluessel.filter((d) => d !== "wissen.js"), ["app.js"]);
  const code = ohneKommentare(APP);
  assert.doesNotMatch(code, /removeItem\(\s*(FORTSCHRITT_NAME|["']wissenFortschritt["'])/, "Fortschritt wird nie entfernt");
  assert.match(code, /const FORTSCHRITT_NAME = "wissenFortschritt"/);
  // Gespeichert wird nur die Liste der erledigten Lektions-IDs
  assert.match(code, /localStorage\.setItem\(FORTSCHRITT_NAME, JSON\.stringify\(wissenErledigt\)\)/);
  // Löschen über speicher.js kennt den Schlüssel nicht, der Dialog sagt, dass er bleibt
  assert.ok(!SPEICHER_CODE.includes("wissenFortschritt"));
  const allesLoeschen = APP.slice(APP.indexOf("async function loescheAllesAusEinstellungen"), APP.indexOf("// Übersicht in den Einstellungen"));
  assert.match(allesLoeschen, /bleibt: \[[\s\S]*Lernfortschritt/, "Dialog nennt den Lernfortschritt unter „bleibt“");
  assert.ok(!allesLoeschen.includes("wissen"), "„Alles löschen“ fasst den Fortschritt nicht an");
});
