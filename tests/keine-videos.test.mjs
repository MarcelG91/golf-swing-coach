// Video-Wächter: Das Repo ist öffentlich. Ein einmal hochgeladenes Video bleibt
// in der Git-Historie für alle sichtbar – auch wenn es später gelöscht wird.
// Diese Tests schlagen Alarm, bevor das passiert.
//
// Geprüft werden alle Dateien, die Git kennt – auch solche, die gerade erst
// mit „git add“ vorgemerkt wurden. Läuft automatisch in der Pipeline
// (.github/workflows/pruefen.yml) und lokal mit:  node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJEKT = fileURLToPath(new URL("..", import.meta.url));

// Endungen von Videodateien – Groß- und Kleinschreibung egal (iPhone: IMG_1234.MOV)
const VIDEO = /\.(mp4|mov|m4v|webm|mkv|avi|3gp|hevc|mts|m2ts|wmv|mpe?g)$/i;
// Von der App exportierte Posedaten (Knopf „Posedaten speichern“)
const POSEDATEN_EXPORT = /(^|\/)posedaten-[^/]*\.json$/i;
// Keine Datei im Repo sollte größer sein. Bei Bedarf bewusst anheben.
const GRENZE_MB = 5;

function git(...argumente) {
  return execFileSync("git", argumente, { cwd: PROJEKT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
}

let gitDa = true;
try {
  git("rev-parse", "--is-inside-work-tree");
} catch {
  gitDa = false; // z. B. als ZIP heruntergeladen – dann gibt es nichts zu prüfen
}
const ohneGit = gitDa ? false : "kein Git-Repository";

function dateienImRepo() {
  return git("ls-files", "-z").split("\0").filter(Boolean);
}

test("Keine Videodateien im Repo", { skip: ohneGit }, () => {
  const videos = dateienImRepo().filter((datei) => VIDEO.test(datei));
  assert.deepEqual(videos, [], `Videos gehören nicht ins öffentliche Repo: ${videos.join(", ")}`);
});

test("Keine exportierten Posedaten im Repo", { skip: ohneGit }, () => {
  const exporte = dateienImRepo().filter((datei) => POSEDATEN_EXPORT.test(datei));
  assert.deepEqual(exporte, [], `Posedaten-Exporte bleiben privat: ${exporte.join(", ")}`);
});

test(`Keine Datei größer als ${GRENZE_MB} MB`, { skip: ohneGit }, () => {
  const zuGross = dateienImRepo()
    .map((datei) => ({ datei, pfad: path.join(PROJEKT, datei) }))
    .filter(({ pfad }) => fs.existsSync(pfad))
    .map(({ datei, pfad }) => ({ datei, mb: fs.statSync(pfad).size / 1e6 }))
    .filter(({ mb }) => mb > GRENZE_MB)
    .map(({ datei, mb }) => `${datei} (${mb.toFixed(1)} MB)`);
  assert.deepEqual(zuGross, [], `Zu große Dateien: ${zuGross.join(", ")}`);
});

test(".gitignore hält typische Handy-Videos fern – auch in GROSSBUCHSTABEN", { skip: ohneGit }, () => {
  const beispiele = [
    "IMG_1234.MOV",
    "IMG_1234.mov",
    "VID_20260927_101500.mp4",
    "schwung.MP4",
    "aufnahme.webm",
    "aufnahme.mkv",
    "clip.3gp",
    "clip.avi",
    "clip.hevc",
    "posedaten-IMG_1234.json",
    "videos/notizen.txt",
  ];
  const nichtIgnoriert = beispiele.filter((name) => {
    try {
      // core.ignorecase=false: so streng wie Git auf einem Linux-Server
      git("-c", "core.ignorecase=false", "check-ignore", "-q", "--no-index", name);
      return false; // Git ignoriert die Datei → gut
    } catch {
      return true; // Git würde die Datei mitnehmen → schlecht
    }
  });
  assert.deepEqual(nichtIgnoriert, [], `Nicht durch .gitignore geschützt: ${nichtIgnoriert.join(", ")}`);
});
