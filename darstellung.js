// Hell / Dunkel / Automatisch
// ---------------------------------------------------------------
// Diese Datei wird im <head> OHNE "module" geladen und läuft deshalb sofort –
// noch bevor die Seite gezeichnet wird. So blitzt beim Start nichts falsch auf.
//
// So funktioniert es:
// - Die Wahl liegt im localStorage unter "darstellung" ("auto", "hell" oder "dunkel").
// - Bei "hell" oder "dunkel" bekommt <html> das Attribut data-darstellung="…".
//   style.css tauscht dann die Farbvariablen aus.
// - Bei "auto" fehlt das Attribut, und style.css folgt der Einstellung des iPhones.

const DARSTELLUNG_SCHLUESSEL = "darstellung";
const DARSTELLUNGEN = ["auto", "hell", "dunkel"];

function gewaehlteDarstellung() {
  const wahl = localStorage.getItem(DARSTELLUNG_SCHLUESSEL);
  return DARSTELLUNGEN.includes(wahl) ? wahl : "auto";
}

function wendeDarstellungAn() {
  const wahl = gewaehlteDarstellung();
  if (wahl === "auto") delete document.documentElement.dataset.darstellung;
  else document.documentElement.dataset.darstellung = wahl;

  // Farbe der Browserleiste (Android, Safari-Tableiste) passend zum Hintergrund
  const hell = wahl === "hell" || (wahl === "auto" && matchMedia("(prefers-color-scheme: light)").matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", hell ? "#f2f6f3" : "#0c1813");
}

wendeDarstellungAn();
// Bei "auto": wenn das iPhone abends auf dunkel wechselt, die Leistenfarbe mitziehen
matchMedia("(prefers-color-scheme: light)").addEventListener("change", wendeDarstellungAn);

// Die drei Knöpfe in den Einstellungen erst anbinden, wenn die Seite fertig geladen ist
document.addEventListener("DOMContentLoaded", () => {
  const knoepfe = document.querySelectorAll('#darstellungAuswahl input[name="darstellung"]');
  for (const knopf of knoepfe) {
    knopf.checked = knopf.value === gewaehlteDarstellung();
    knopf.addEventListener("change", () => {
      localStorage.setItem(DARSTELLUNG_SCHLUESSEL, knopf.value);
      wendeDarstellungAn();
    });
  }
});
